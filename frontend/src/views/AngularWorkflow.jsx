/* eslint-disable react/no-multi-comp */
import React, { useState, useEffect, useLayoutEffect, memo, useMemo, useRef } from "react";
import ReactDOM from "react-dom"

import theme from "../theme.jsx";
import { useInterval } from "react-powerhooks";
import { makeStyles, } from "@mui/styles";

import WorkflowTemplatePopup from "../components/WorkflowTemplatePopup.jsx"
import { v4 as uuidv4, v5 as uuidv5, validate as isUUID, } from "uuid";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useBeforeunload } from "react-beforeunload"
import ReactJson from "react-json-view-ssr";
import { NestedMenuItem } from 'mui-nested-menu';
import Markdown from "react-markdown";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import { isMobile } from "react-device-detect"
import aa from 'search-insights'
import Drift from "react-driftjs";
import { CodeHandler, Img, OuterLink, } from "../views/Docs.jsx";

import { InstantSearch, Configure, connectSearchBox, connectHits, Index } from 'react-instantsearch-dom';
import algoliasearch from 'algoliasearch/lite';
import {
  Zoom,
  Fade,
  Slide,

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
  FormGroup,
  FormControlLabel,
  Typography,
  Checkbox,
  Breadcrumbs,
  CircularProgress,
  SwipeableDrawer,
  Switch,
  Chip,
  Card,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  AvatarGroup,
  Autocomplete,
  Radio,
  ButtonGroup,
} from "@mui/material";

import {
  Folder as FolderIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Insights as InsightsIcon, 
  LibraryBooks as LibraryBooksIcon,
  OpenInNew as OpenInNewIcon,
  Undo as UndoIcon,
  GetApp as GetAppIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon, 
  Error as ErrorIcon,
  Warning as WarningIcon, 
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Cached as CachedIcon,
  DirectionsRun as DirectionsRunIcon,
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
  Send as SendIcon,
  Restore as RestoreIcon, 
  Preview as PreviewIcon,
  ContentCopy as ContentCopyIcon,
  Circle as  CircleIcon,
  SquareFoot as SquareFootIcon,
  AutoFixHigh as AutoFixHighIcon,
  Polyline as PolylineIcon, 
  QueryStats as QueryStatsIcon, 
  AutoAwesome as AutoAwesomeIcon,

  Add as AddIcon,
  ErrorOutline as ErrorOutlineIcon, 

  ArrowForward as ArrowForwardIcon,

} from "@mui/icons-material";
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
//import * as cytoscape from "cytoscape";
import cytoscape from "cytoscape";


import edgehandles from "cytoscape-edgehandles";

import CytoscapeComponent from "react-cytoscapejs";

import Draggable from "react-draggable";
import cytoscapestyle from "../defaultCytoscapeStyle.jsx";
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";

import WorkflowValidationTimeline from "../components/WorkflowValidationTimeline.jsx"
import { validateJson, collapseField, GetIconInfo } from "../views/Workflows.jsx";
import { GetParsedPaths, internalIds, } from "../views/Apps.jsx";
import ConfigureWorkflow from "../components/ConfigureWorkflow.jsx";
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import ParsedAction from "../components/ParsedAction.jsx";
import PaperComponent from "../components/PaperComponent.jsx"
import ExtraApps from "../components/ExtraApps.jsx"
import EditWorkflow from "../components/EditWorkflow.jsx"
import { act } from "react";
// import AppStats from "../components/AppStats.jsx";
const noImage = "/public/no_image.png";

cytoscape.use(edgehandles);

export const triggers = [
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
      description: "Custom HTTP input trigger",
      long_description: "Execute a workflow with an unauthicated POST request",
	  id: "",
    },
    {
      name: "Schedule",
      type: "TRIGGER",
      status: "uninitialized",
      trigger_type: "SCHEDULE",
      errors: null,
      large_image:
        "data:image/png;base64,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",
      label: "Schedule",
      is_valid: true,
      environment: "onprem",
      description: "Schedule time trigger",
      long_description: "Create a schedule based on cron",
	  id: "",
    },
    {
      name: "Pipelines",
      type: "TRIGGER",
      status: "uninitialized",
      description: "Run a pipeline trigger",
      trigger_type: "PIPELINE",
      errors: null,
      is_valid: true, 
      label: "Pipeline",
      environment: "onprem",
      large_image: "/images/workflows/tenzir2.png",
      long_description: "Controls a pipeline to run things",
	  id: "",
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
      description: "Run a Subflow trigger",
      long_description: "Execute another workflow from this workflow",
	  id: "",
    },
    {
      name: "User Input",
      type: "TRIGGER",
      status: "running",
      large_image: "/images/workflows/UserInput2.svg",
      description: "Wait for user input trigger",
      trigger_type: "USERINPUT",
	  is_valid: true, 
      errors: null,
      label: "User input",
      environment: "cloud",
      long_description: "Take user input to continue execution",
	  id: "",
    },
  ];
// Adds specific text to items

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

// look for keys and set values with shuffle dotnotation 
// used primarily for AI autocompletions
export function SetJsonDotnotation(jsonInput, inputKey) {

	if (jsonInput === undefined || jsonInput === null) {
		return jsonInput;
	}

	// Check for array
	if (Array.isArray(jsonInput)) {
		for (var i = 0; i < jsonInput.length; i++) {
			jsonInput[i] = SetJsonDotnotation(jsonInput[i], inputKey+".#");
		}

		return jsonInput;
		// Check for dict
	} else if (typeof jsonInput === "object") {
		// Loop keys and values
	
		for (var key in jsonInput) {
			if (!jsonInput.hasOwnProperty(key)) {
				continue
			}

			const value = jsonInput[key];
			// Check if array
			if (Array.isArray(value)) {
				for (var i = 0; i < value.length; i++) {
					jsonInput[key][i] = SetJsonDotnotation(jsonInput[key][i], inputKey+"."+key+".#");
				}
			} else if (typeof value === "object") {
				jsonInput[key] = SetJsonDotnotation(jsonInput[key], inputKey+"."+key);
			} else {
				jsonInput[key] = inputKey+"."+key
			}
		}
	} else {
		//jsonInput = inputKey

		console.log("SetJsonDotnotation: jsonInput is not an object or array, but key ", jsonInput, typeof jsonInput);
	}

	return jsonInput;
}

//export const green = "#86c142";
export const green = "#02CB70"
export const yellow = "#FECC00";
//export const red = "#ff3632";
export const red = "#F53434";
export const grey = "#b0b0b0";

export function removeParam(key, sourceURL) {
  if (sourceURL === undefined) {
    return;
  }

  var rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    queryString = sourceURL.indexOf("?") !== -1 ? sourceURL.split("?")[1] : "";

  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (let i = params_arr.length - 1; i >= 0; i -= 1) {
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
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#f86a3e",
    },
  },
});

const splitter = "|~|";
const svgSize = 24;
//const referenceUrl = "https://shuffler.io/functions/webhooks/"
//const referenceUrl = window.location.origin+"/api/v1/hooks/"

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const AngularWorkflow = (defaultprops) => {
  const { globalUrl, setCookie, isLoggedIn, isLoaded, userdata, data_id, ReactGA, } = defaultprops;
  const referenceUrl = globalUrl + "/api/v1/hooks/";
  //const alert = useAlert()
  let navigate = useNavigate();
  const params = useParams();
  var props = JSON.parse(JSON.stringify(defaultprops))
  props.match = {}
  props.match.params = params

  var to_be_copied = "";
  const [firstrequest, setFirstrequest] = React.useState(true);
  const [cystyle] = useState(cytoscapestyle);

  const [cy, setCy] = React.useState();

  const [toolsApp, setToolsApp] = React.useState({});
  const [currentView, setCurrentView] = React.useState(0);
  const [triggerAuthentication, setTriggerAuthentication] = React.useState({});
  const [workflows, setWorkflows] = React.useState([]);
  const [parentWorkflows, setParentWorkflows] = React.useState([]);
  const [showEnvironment, setShowEnvironment] = React.useState(false);
  const [editWorkflowDetails, setEditWorkflowDetails] = React.useState(false);

  const [workflow, setWorkflow] = React.useState({});
  const [originalWorkflow, setOriginalWorkflow] = React.useState({});
  const [userSettings, setUserSettings] = React.useState({});
  const [subworkflow, setSubworkflow] = React.useState({});
  const [subworkflowStartnode, setSubworkflowStartnode] = React.useState("");
  const [leftViewOpen, setLeftViewOpen] = React.useState(isMobile ? false : true);
  const [leftBarSize, setLeftBarSize] = React.useState(isMobile ? 0 : 325)
  const [creatorProfile, setCreatorProfile] = React.useState({});
  const [usecases, setUsecases] = React.useState([]);
  const [files, setFiles] = React.useState({
    "namespaces": [
      "default",
    ]
  });
  const [appGroup, setAppGroup] = React.useState([]);
  const [triggerGroup, setTriggerGroup] = React.useState([]);
  const [executionText, setExecutionText] = React.useState("");
  const [executionRequestStarted, setExecutionRequestStarted] =React.useState(false);
    
  const [scrollConfig, setScrollConfig] = React.useState({
    top: 0,
    left: 0,
    selected: "",
  });

  const [history, setHistory] = React.useState([]);
  const [historyIndex, setHistoryIndex] = React.useState(history.length);
  const [variableInfo, setVariableInfo] = React.useState({})
  const [selectedVersion, setSelectedVersion] = React.useState(null)
  const [appAuthentication, setAppAuthentication] = React.useState(undefined);
  const [variablesModalOpen, setVariablesModalOpen] = React.useState(false);
  const [aiQueryModalOpen, setAiQueryModalOpen] = React.useState(false)
  const [executionVariablesModalOpen, setExecutionVariablesModalOpen] =
    React.useState(false);
  const [authenticationModalOpen, setAuthenticationModalOpen] = React.useState(false);
    
  const [conditionsModalOpen, setConditionsModalOpen] = React.useState(false);
  const [authenticationType, setAuthenticationType] = React.useState("");


  const [workflowDone, setWorkflowDone] = React.useState(false);
  const [localFirstrequest, setLocalFirstrequest] = React.useState(true);
  const [requiresAuthentication, setRequiresAuthentication] =
    React.useState(false);
  const [rightSideBarOpen, setRightSideBarOpen] = React.useState(false);
  const [showSkippedActions, setShowSkippedActions] = React.useState(false);
  const [lastExecution, setLastExecution] = React.useState("");
  const [configureWorkflowModalOpen, setConfigureWorkflowModalOpen] = React.useState(false);
  const [autoCompleting, setAutocompleting] = React.useState(false);

  const [authgroupModalOpen, setAuthgroupModalOpen] = React.useState(false);
  const [authGroups, setAuthGroups] = React.useState([])

  const curpath = typeof window === "undefined" || window.location === undefined ? "" : window.location.pathname;
      

  // 0 = normal, 1 = just done, 2 = normal
  const [savingState, setSavingState] = React.useState(0);

  const [selectedResult, setSelectedResult] = React.useState({});
  const [codeModalOpen, setCodeModalOpen] = React.useState(false);

  const [variableAnchorEl, setVariableAnchorEl] = React.useState(null);

  const [sourceValue, setSourceValue] = React.useState({});
  const [destinationValue, setDestinationValue] = React.useState({});
  const [conditionValue, setConditionValue] = React.useState({});
  const [dragging, setDragging] = React.useState(false);
  const [showWorkflowRevisions, setShowWorkflowRevisions] = React.useState(false);
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
  const [activeDialog, setActiveDialog] = React.useState("");
  const [visited, setVisited] = React.useState([]);
  const [allRevisions, setAllRevisions] = useState([])

  const [apps, setApps] = React.useState([]);
  const [filteredApps, setFilteredApps] = React.useState([]);
  const [prioritizedApps, setPrioritizedApps] = React.useState([])

  const [environments, setEnvironments] = React.useState([]);
  const [established, setEstablished] = React.useState(false);
  const [setupSent, setSetupSent] = React.useState(false);

  const [graphSetup, setGraphSetup] = React.useState(false);

  const [selectedApp, setSelectedApp] = React.useState({});
  const [selectedAction, setSelectedAction] = React.useState({});
  const [selectedActionEnvironment, setSelectedActionEnvironment] = React.useState({});
  const [selectedMeta, setSelectedMeta] = React.useState(undefined);

  // Disabled streaming for now
  const [streamDisabled, setStreamDisabled] = React.useState(true)


  const [executionRequest, setExecutionRequest] = React.useState({});

  const [executionRunning, setExecutionRunning] = React.useState(false);
  const [executionModalOpen, setExecutionModalOpen] = React.useState(false);
  const [executionModalView, setExecutionModalView] = React.useState(0);
  const [executionData, setExecutionData] = React.useState({});
  const [appsLoaded, setAppsLoaded] = React.useState(false);
  const [showVideo, setShowVideo] = React.useState("");
  const [editWorkflowModalOpen, setEditWorkflowModalOpen] = React.useState(false);
  const [userediting, setUserediting] = React.useState(false)

  const [lastSaved, setLastSaved] = React.useState(true);
  const [selectionOpen, setSelectionOpen] = React.useState(false);

  // eslint-disable-next-line no-unused-vars
  const [_, setUpdate] = useState(""); // Used to force rendring, don't remove

  const [executionFilter, setExecutionFilter] = React.useState("ALL")
  const [workflowExecutions, setWorkflowExecutions] = React.useState([]);
  const [workflowExecutionCount, setWorkflowExecutionCount] = React.useState(0);
  const [defaultEnvironmentIndex, setDefaultEnvironmentIndex] = React.useState(0);
  const [workflowRecommendations, setWorkflowRecommendations] = React.useState(undefined);
  const [showErrors, setShowErrors] = React.useState(true);
  const [highlightedApp, setHighlightedApp] = React.useState("")
  const [listCache, setListCache] = React.useState([]);
  const [selectedOption, setSelectedOption] = React.useState("");
  const [tenzirConfigModalOpen, setTenzirConfigModalOpen] = React.useState(false);
  const [rules, setRules] = React.useState([]);
  const [sigmaFilesNames, setSigmaFileNames] = React.useState("")

  const [distributedFromParent, setDistributedFromParent] = React.useState("")
  const [suborgWorkflows, setSuborgWorkflows] = React.useState([])
  const [allTriggers, setAllTriggers] = React.useState(undefined)

  const [suggestionBox, setSuggestionBox] = React.useState({
  	"position": {
  		"top": 500,
  		"left": 500,
  	},
  	"open": false,
  	"attachedTo": "",
  })

  useEffect(() => {
	  if (!firstrequest && isLoaded && isLoggedIn && editWorkflowModalOpen === false) {
        saveWorkflow(workflow)
	  }
  }, [editWorkflowModalOpen])

  // New for generated stuff
const releaseToConnectLabel = "Release to Connect"
  const integrationApps =  [{
		"id": "integration",
		"name": "Integration Framework",
		"type": "ACTION",
	    "app_version": "1.0.0",
		"loop_versions": ["1.0.0"],
	    "authentication": {
			"type": "",
		},
	  	"description": "Support-use only",
		"actions": [{
			"name": "Cases",
			"description": "Available actions for case management",
			"label": "Cases",
			"parameters": [{	
				"name": "action",
				"value": "list_tickets",
				"options": [
					"list_tickets", 
					"get_ticket", 
					"create_ticket", 
				],
				"required": true,
			},
			{
				"name": "fields",
				"value": "",
				"required": false,
				"multiline": true,
			},
			/*{
				"name": "options",
				"value": "deduplicate,enrich",
				"required": false,
				"multiselect": true,
				"options": [
					"deduplicate",
					"enrich",
				]
			}*/
			]
		},{
			"name": "Communication",
			"description": "Available actions for communication",
			"label": "Communication",
			"parameters": [{	
				"name": "action",
				"value": "list_messages",
				"options": [
					"list_messages", 
					"send_message", 
				],
				"required": true,
			},
			{
				"name": "fields",
				"value": "",
				"required": false,
				"multiline": true,
			}]
		},
		{
			"name": "IAM",
			"description": "Available actions for IAM",
			"label": "IAM",
			"parameters": [{	
				"name": "action",
				"value": "get_kms_key",
				"options": [
					"get_kms_key", 
				],
				"required": true,
			},
			{
				"name": "fields",
				"value": "",
				"required": false,
				"multiline": true,
			}]
		},
		]
	}] 

	/*
		{
			"name": "Email",
			"label": "Email",
			"parameters": [{	
				"name": "action",
				"value": "list_email",
				"options": [
					"list_email", 
					"send_mail", 
				],
				"required": true,
			}],
		}]
	}] 
	*/

  // For code editor
  const [codeEditorModalOpen, setCodeEditorModalOpen] = React.useState(false);
  const [codedata, setcodedata] = React.useState("");
  const [editorData, setEditorData] = React.useState({
	"name": "",
	"value": "",
	"field_number": -1,
	"actionlist": [],	
	"field_id": "",
	
	"example": "",
  })

  const [loadedApps, setLoadedApps] = React.useState([])

	const loadAppConfig = (appId, select) => {
		if (appId === undefined || appId === null || appId.length === 0) {
			console.log("No appId to load")
			return
		}

		if (appId === "integration") {
			return
		}

		if (loadedApps.includes(appId)) {
			return
		}

		loadedApps.push(appId)
		setLoadedApps(loadedApps)

		const appUrl = `${globalUrl}/api/v1/apps/${appId}/config?openapi=false`
		fetch(appUrl, {
		  headers: {
			Accept: "application/json",
		  },
		  credentials: "include",
		})
		.then((response) => {
			return response.json()
		})
		.then((responseJson) => {

			if (responseJson.success === true && responseJson.app !== undefined && responseJson.app !== null && responseJson.app.length > 0) {
				// Base64 decode into json
				const foundapp = JSON.parse(atob(responseJson.app))	
				const selectedAppActions = selectedApp.actions === undefined  || selectedApp.actions === null ? [] : selectedApp.actions
				if (foundapp.actions !== undefined && foundapp.actions !== null && foundapp.actions.length > selectedAppActions.length) {

					if (select) {
						setSelectedApp(foundapp)
					}

					if (apps === undefined || apps === null || apps.length === 0) {
						console.log("LOAD APPS!")
					}

					for (var i = 0; i < apps.length; i++) {
						if (apps[i].id !== foundapp.id) {
							continue
						}

						apps[i] = foundapp
						setApps(apps)
						setFilteredApps(apps)

						// Update the local storage
						localStorage.setItem("apps", JSON.stringify(apps))
						break
					}
				}

				// FIXME: Add it to the existing list AND update the selected app
			}
		})
		.catch((error) => {
			console.log(`Failed side-loading app ${appId}: ${error}`)
		})
	}

  // Event for making sure app is correct
  useEffect(() => {
	  if (selectedApp === undefined || selectedApp === null && selectedApp.app_name === undefined) {
		  return
	  }

	  if (apps === undefined || apps === null || apps.length === 0) {
		  return
	  }

	  // Handle the activation case, as they are NOT in the event management system yet 
	  if (selectedApp.actions === undefined || selectedApp.actions === null || selectedApp.actions.length > 1) {
		  return
	  } else {

		if (selectedApp.id !== undefined && selectedApp.id !== null && selectedApp.id.length > 0) {
			loadAppConfig(selectedApp.id, true)
		}
	  }

	  for (let appkey in apps) {
		  const curapp = apps[appkey]
		  if (curapp.name !== selectedApp.name) {
			  continue
		  }
			  
		  if (curapp.actions !== undefined && curapp.actions !== null && curapp.actions.length > selectedApp.actions.length) {
			  var foundActionIndex = -1
			  for (let actionkey in curapp.actions) {
				  const curaction = curapp.actions[actionkey]

				  // First action with a label, as they are most used (typically)
				  if (curaction.category_label !== undefined && curaction.category_label !== null && curaction.category_label.length > 0) { 
					  foundActionIndex = actionkey
					  break
				  }
			  }

			  if (foundActionIndex >= 0) {
			    var newaction = curapp.actions[foundActionIndex]

			  	setNewSelectedAction({
					"target": {
						"value": newaction.name
					},
				})
			  } 

			  setSelectedApp(curapp)
		  }

		  break
	  }

  }, [selectedApp])

  const [executionArgumentModalOpen, setExecutionArgumentModalOpen] = React.useState(false);

  // This should all be set once, not on every iteration
  // Use states and don't update lol
  const cloudSyncEnabled =
    props.userdata !== undefined &&
      props.userdata.active_org !== null &&
      props.userdata.active_org !== undefined
      ? props.userdata.active_org.cloud_sync === true
      : false;
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "migration.shuffler.io";

  const appBarSize = isCloud ? 75 : 72;
  const triggerEnvironments = isCloud ? ["cloud"] : ["onprem", "cloud"];
  const unloadText = "Are you sure you want to leave without saving (CTRL+S)?";
  const classes = useStyles();

  var [bodyWidth, bodyHeight] = useWindowSize()
  const cytoscapeWidth = isMobile ? bodyWidth - leftBarSize : bodyWidth - leftBarSize - 25

  /*
  // Zoom testing to try autofixing for small screens
  if (document !== undefined && document !== null && !isMobile) {
	  const currentZoom = document.body.style.zoom;

	  if (bodyWidth < 1367 || bodyHeight < 769) {
		  console.log("LOWER ZOOM")
		  document.body.style.zoom = "80%"
		  bodyWidth = bodyWidth*0.8
		  bodyHeight = bodyHeight*0.8
	  } else {
		  console.log("RESET ZOOM")
		  document.body.style.zoom = "100%"
	  }
  }

  console.log("Width, height: ", bodyWidth, bodyHeight)
  */

  //console.log("Mobile: ", isMobile, bodyWidth, bodyHeight)
	
  const [elements, setElements] = useState([]);
  const [loopRunning, setLoopRunning] = useState(false)

  var loopRunning2 = loopRunning
  const stop = () => {
	  setLoopRunning(false)
	  loopRunning2 = false
  }

  const start = () => {
	  setLoopRunning(true)
	  loopRunning2 = true 
  }

  useEffect(() => {
	  if (workflow.id !== undefined && workflow.id !== null && workflow.id.length > 0 && workflow.id === originalWorkflow.id && workflow.parentorg_workflow === "") {
		  setOriginalWorkflow(workflow)
	  } 

	  // Special multi-workflow edgecase handler for events
	  if (distributedFromParent === "" && suborgWorkflows === []) {
	  } else {
	    if (cy !== undefined) {
	  	  cy.removeListener("select");
	  	  cy.removeListener("unselect");
	  	  cy.removeListener("add");
	  	  cy.removeListener("remove");
	  	  cy.removeListener("mouseover");
	  	  cy.removeListener("mouseout");
	  	  cy.removeListener("drag");
	  	  cy.removeListener("free");
	  	  cy.removeListener("cxttap");

		  setTimeout(() => {
			setupGraph(workflow) 

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

		    cy.edgehandles({
		      handleNodes: (el) => {
		        if (el.isNode() &&
		      	el.data("buttonType") != "ACTIONSUGGESTION" &&
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
		    })
		  }, 50)
		}
	  }
  }, [workflow])

  useEffect(() => {
	  // Current variable + future state controlled
	  // This is so that the loop can stop itself as well 
	  if (loopRunning && loopRunning2) {
		  const intervalId = setInterval(() => {
			  if (!loopRunning) {
        		clearInterval(intervalId);
      		  }

			  fetchUpdates()
		  }, 3000)

		  return () => clearInterval(intervalId);
	  }
  }, [loopRunning])

  // No point going as fast, as the nodes aren't realtime anymore, but bulk updated.
  //const { start, stop } = useInterval({
  //  duration: 3000,
  //  startImmediate: false,
  //  callback: () => {
  //    fetchUpdates();
  //  },
  //});

  const getAppDocs = (appname, location, version) => {
    fetch(`${globalUrl}/api/v1/docs/${appname}?location=${location}&version=${version}`, {
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          //toast("Successfully GOT app "+appId)
        } else {
          //toast("Failed getting app");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
		  if (responseJson.meta !== undefined && responseJson.meta !== null && Object.getOwnPropertyNames(responseJson.meta).length > 0) {
			  setSelectedMeta(responseJson.meta)
		  }

          if (responseJson.reason !== undefined && responseJson.reason !== undefined && responseJson.reason.length > 0) {
            if (!responseJson.reason.includes("404: Not Found") && responseJson.reason.length > 25) {
			  // Translate <img> into markdown ![]()
			  const imgRegex = /<img.*?src="(.*?)"/g;
			  const newdata = responseJson.reason.replace(imgRegex, '![]($1)');

              selectedApp.documentation = newdata 
              setSelectedApp(selectedApp)
              setUpdate(Math.random())
            }
          }
        }

      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  useEffect(() => {
    if (authenticationModalOpen === true && selectedAction.app_name !== undefined) {
      console.log(`Should get app docs for: ${selectedAction.app_name}`)
      //console.log(selectedAction)
      //console.log("APP: ", selectedApp)

      if (selectedAction.documentation === undefined || selectedAction.documentation === null || selectedAction.documentation.length === 0) {
        // SelectedApp.documentation = Markdown? If so, it works
        //
        const apptype = selectedApp.generated === false ? "python" : "openapi"
        getAppDocs(selectedAction.app_name, apptype, selectedAction.app_version)
      }
    }
  }, [authenticationModalOpen])

	const listOrgCache = (orgId) => {
		var headers = {
			"Content-Type": "application/json",
			"Accept": "application/json",
		}

		if (orgId !== undefined && orgId !== null && orgId.length > 0) {
			headers["Org-Id"] = orgId
		}

		fetch(`${globalUrl}/api/v1/orgs/${orgId}/list_cache`, {
			method: "GET",
			headers: headers,
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
				setListCache(responseJson);
		})
		.catch((error) => {
				toast(error.toString());
		});
	};

  const getWorkflowExecutionCount = (workflowId) => {

    fetch(`${globalUrl}/api/v1/workflows/${workflowId}/executions/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflow execution count: O!");
          return;
        } else {
          return response.json();
        }
      })
      .then((responseJson) => {
        if (responseJson !== undefined) {
          setWorkflowExecutionCount(responseJson.count || 0);
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };  

  const getAvailableWorkflows = (trigger_index) => {
    fetch(globalUrl + "/api/v1/workflows?subflow=true", {
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

          // Sets up subflow trigger with the right info
          if (trigger_index > -1) {

            var baseSubflow = {}
            const trigger = workflow.triggers[trigger_index];
            if (trigger.parameters.length >= 3) {
              for (let paramkey in trigger.parameters) {
                const param = trigger.parameters[paramkey];

								// User Input & Subflow nodes
                if (param.name === "workflow" || param.name === "subflow") {
					const paramIndex = param.name === "workflow" ? 0 : 5
					if (workflow.triggers[trigger_index].parameters[paramIndex].value !== subworkflow.id) {
						if (param.value === workflow.id) {
							setSubworkflow(workflow);
							baseSubflow = workflow
						} else {
							const sub = responseJson.find((data) => data.id === param.value);
							if (sub !== undefined && subworkflow.id !== sub.id) {
								baseSubflow = sub
								setSubworkflow(sub);
							}
						}
					}
				}

                if (param.name === "startnode" && param.value !== undefined && param.value !== null) {
                
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

					if (workflows.length === 0) {
						//console.log("First request. Checking for parent trigger (if this is subflow")
						var parentworkflows = []
						var parent_ids = []
						for (let workflowkey in responseJson) {
							const innerworkflow = responseJson[workflowkey]

							for (let triggerkey in innerworkflow.triggers) {
								const trigger = innerworkflow.triggers[triggerkey]
								if (trigger.trigger_type === "SUBFLOW" || trigger.trigger_type === "USERINPUT") {

									for (let paramkey in trigger.parameters) {
										const param = trigger.parameters[paramkey]
										if ((param.name === "workflow" || param.name === "subflow") && param.value === props.match.params.key && !parent_ids.includes(innerworkflow.id)) {

											parent_ids.push(innerworkflow.id)
											parentworkflows.push({
												id: innerworkflow.id,
												name: innerworkflow.name,
												image: innerworkflow.image,
											})
										}
									}
								}
							}
						}

						if (parentworkflows.length > 0) {
							setParentWorkflows(parentworkflows.filter(wf => wf.id !== props.match.params.key))
						}
					}

          setWorkflows(responseJson);
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Workflow error: ", error.toString())
      });
  };

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
        console.log("Apikey error: ", error);
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
        console.log("Settings error: ", error);
      });
  };

  const setNewAppAuth = (appAuthData, refresh) => {
	var headers = {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}

	if (workflow.org_id !== undefined && workflow.org_id !== null && workflow.org_id.length > 0) {
		headers["Org-Id"] = workflow.org_id
	}

    fetch(globalUrl + "/api/v1/apps/authentication", {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(appAuthData),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
            console.log("Status not 200 for setting app auth :O!");

			if (response.status === 400) {
				toast.error("Failed setting new auth. Please try again", {
					"autoClose": true,
				})
			}
		}

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
		  // Remove the timeout. Has to be clicked
          toast.error("Error: " + responseJson.reason, {
			"autoClose": false,
		  })

        } else {
		  if (refresh === true) {
			getAppAuthentication(true, true, true)
		  } else {
          	getAppAuthentication(true, false)
		  }

          setAuthenticationModalOpen(false)
          // Needs a refresh with the new authentication..
          //toast("Successfully saved new app auth")
		  if (configureWorkflowModalOpen === true) {
		  	setConfigureWorkflowModalOpen(false)

			setTimeout(() => {
				setConfigureWorkflowModalOpen(true)
			}, 1000)
		  }
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("New auth error: ", error.toString());
      });
  };

  const getWorkflowExecution = (id, execution_id, filter) => {
	var url = `${globalUrl}/api/v2/workflows/${id}/executions`
	var method = "GET"
	if (filter === undefined || filter === null || filter.toUpperCase() === "ALL") {

		// Check for 
		if (executionFilter !== undefined && executionFilter !== null && executionFilter.length > 0) {
			filter = executionFilter
		} else {
			filter = "ALL"
		}
	} 

	var formattedBody = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    }

	if (filter !== "ALL") {
	  formattedBody.method = "POST"

	  formattedBody.body = JSON.stringify({
		  "status": filter,
		  "workflow_id": id,
	  })

	  url = `${globalUrl}/api/v1/workflows/search`

    }

    fetch(url, formattedBody)
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson !== undefined && responseJson !== null && responseJson.runs !== undefined && responseJson.runs !== null) {
			responseJson.executions = responseJson.runs
		}

        if (responseJson !== undefined && responseJson !== null && responseJson.executions !== undefined && responseJson.executions !== null) {

          // - means it's opposite
          const newkeys = sortByKey(responseJson.executions, "-started_at");
          setWorkflowExecutions(newkeys);

          const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
          var tmpView = new URLSearchParams(cursearch).get("execution_id");
          if (execution_id !== undefined && execution_id !== null && execution_id.length > 0 && (tmpView === undefined || tmpView === null || tmpView.length === 0)) {
            tmpView = execution_id;
          }

		  // Compare with currently selected item
          if (tmpView !== undefined && tmpView !== null && tmpView.length > 0) {
			// Don't clean up if it's already open
		    if (executionModalOpen === true) {
		        return
		    }

            const execution = responseJson.executions.find((data) => data.execution_id === tmpView);

		    setExecutionModalOpen(true) 
            if (execution !== null && execution !== undefined) {
			  if (execution.execution_argument.includes("too large")) {
			  	setExecutionData({});
			  	setExecutionRunning(true);
			  	setExecutionRequestStarted(false);
			  } else {  
			  	setExecutionData(execution);
			  }

              setExecutionModalView(1);
              setExecutionRequest({
                execution_id: execution.execution_id,
                authorization: execution.authorization,
              });

              start();

              //const newitem = removeParam("execution_id", cursearch);
              //navigate(curpath + newitem)
            } else {
              console.log("Couldn't find execution for execution ID. Retrying as user to get ", tmpView)

              //setExecutionRequestStarted(true);
              const cur_execution = {
                execution_id: tmpView,
                //authorization: data.authorization,
              }
			  setExecutionRunning(true);
              setExecutionModalView(1);
              setExecutionRequest(cur_execution);
              start();

              //const newitem = removeParam("execution_id", cursearch);
              //navigate(curpath + newitem)
              //setTimeout(() => {
              //  stop()
              //}, 5000);
            }
          }
        } else {
          const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
          var tmpView = new URLSearchParams(cursearch).get("execution_id");
          if (tmpView === undefined || tmpView === null || tmpView.length === 0) {
            const execution_id = tmpView;
		    setExecutionModalView(1);
		    setExecutionRequest({
		      execution_id: execution_id,
		    });

			start()
          }
		}
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get execution error: ", error.toString());
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
	  cors: "no-cors",
    })
      .then((response) => {
        if (response.status !== 200) {
          stop();
	  	  setExecutionModalView(0);
		  //toast("Failed loading the workflow run")
          console.log("Status not 200 for stream results :O!");

    	  //const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
		  //const newitem = removeParam("execution_id", cursearch);
		  //navigate(curpath + newitem)
        }

        return response.json();
      })
      .then((responseJson) => {
        handleUpdateResults(responseJson, executionRequest);
      })
      .catch((error) => {
        console.log("Execution result Error: ", error);
        stop();
      });
  };

  const abortExecution = () => {
    setExecutionRunning(false);

    fetch(globalUrl +"/api/v1/workflows/" +props.match.params.key +"/executions/" +executionRequest.execution_id +"/abort",
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
        //toast(error.toString());
        console.log("Abort error: ", error.toString());
      });
  };

  const handleCommandSubmit = (trigger) => {
    if (trigger.trigger_type !== "PIPELINE") {
      toast("Unable to save the configuration");
      return;
    }
  
    trigger.parameters = []

    const command = document.getElementById('sigma')?.value

    if(command) {
      trigger.parameters.push({
        name: "command",
        value: command
      })
    } else {
      toast("Please enter the comamnd");
      return;
    }
  
    // if (autoOffsetReset) {
    //   trigger.parameters.push({
    //     name: "auto_offset_reset",
    //     value: autoOffsetReset
    //   });
    // }
  
    setTenzirConfigModalOpen(false);
  };

  const handleSubmit = (trigger) => {
    if (trigger.trigger_type !== "PIPELINE") {
      toast("Unable to save the configuration");
      return;
    }
   if (selectedOption === "Kafka Queue") {
    trigger.parameters = []

    const pipeline = document.getElementById('pipeline')?.value
  
    setTenzirConfigModalOpen(false);
  } else if (selectedOption === "Syslog listener") {
    trigger.parameters = []

    const endpoint = document.getElementById('endpoint')?.value

    if(endpoint) {
      trigger.parameters.push({
        name: "endpoint",
        value: endpoint
      })
    } else {
      toast("Please enter your endpoint");
      return;
    }
  }

  };
  
  
	const handleColoring = (actionId, status, label) => {
		if (cy === undefined) {
			return
		}

		var currentnode = cy.getElementById(actionId);
		if (currentnode.length === 0) {
			return
			//continue;
		}

		currentnode = currentnode[0];
		const outgoingEdges = currentnode.outgoers("edge");
		const incomingEdges = currentnode.incomers("edge");

		switch (status) {
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

				if (!visited.includes(label)) {
					if (executionRunning) {
						visited.push(label);
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

				if (visited !== undefined && visited !== null && !visited.includes(label)) {
					if (executionRunning) {
						visited.push(label);
						setVisited(visited);
					}
				}

				// FIXME - add outgoing nodes to executing
				//const outgoingNodes = outgoingEdges.find().data().target
				if (outgoingEdges.length > 0) {
					for (let i = 0; i < outgoingEdges.length; i++) {
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

				if (!visited.includes(label)) {
					//if (item.action.result !== undefined && item.action.result !== null && !item.action.result.includes("failed condition")) {
					//	toast("Error for " + item.action.label + " with result " + item.result);
					//}
					visited.push(label);
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
				currentnode.removeClass("not-executing-highlight");
				currentnode.removeClass("executing-highlight");
				currentnode.removeClass("success-highlight");
				currentnode.removeClass("failure-highlight");
				currentnode.removeClass("shuffle-hover-highlight");
				currentnode.removeClass("awaiting-data-highlight");
				currentnode.addClass("not-executing-highlight");
				//console.log("DEFAULT -> Clearing!");
				break;
		}
	}

  // Controls the colors and direction of execution results.
  // Style is in defaultCytoscapeStyle.js
  const handleUpdateResults = (responseJson, executionRequest) => {
	if (responseJson === undefined || responseJson === null || responseJson.success === false) {
		stop()
		return
	}
//console.log(responseJson)
    // Loop nodes and find results
    // Update on every interval? idk

    ReactDOM.unstable_batchedUpdates(() => {
      if (JSON.stringify(responseJson) !== JSON.stringify(executionData)) {
        // FIXME: If another is selected, don't edit..
        // Doesn't work because this is some async garbage
        if (executionData.execution_id === undefined || (responseJson.execution_id === executionData.execution_id && responseJson.results !== undefined && responseJson.results !== null)) {
          if (executionData.status !== responseJson.status || executionData.result !== responseJson.result || (executionData.results !== undefined && responseJson.results !== null && executionData.results.length !== responseJson.results.length)) {
			//console.log("Updating data!")
            setExecutionData(responseJson)
          } else {
      		if (responseJson.status === "ABORTED" || responseJson.status === "STOPPED" || responseJson.status === "FAILURE" || responseJson.status === "WAITING" || responseJson.status === "FINISHED") {
				stop()
			}

            //console.log("NOT updating executiondata state.");
			return
          }
        }
      }

      if (responseJson.execution_id !== executionRequest.execution_id) {
        cy.elements().removeClass("success-highlight failure-highlight executing-highlight");
        return;
      }

    	if (responseJson.results !== null && responseJson.results.length > 0) {
				// First clear current nodes
				if (responseJson.workflow.actions !== undefined && responseJson.workflow.actions !== null) {
					// In clearing of actions
					for (let actionKey in responseJson.workflow.actions) {
    	    	var item = responseJson.workflow.actions[actionKey];

						handleColoring(item.id, "", item.label)
					}
				}

    	  for (let resultKey in responseJson.results) {
    	    var item = responseJson.results[resultKey];

					handleColoring(item.action.id, item.status, item.action.label)
        }
      }

      if (responseJson.status === "ABORTED" || responseJson.status === "STOPPED" || responseJson.status === "FAILURE" || responseJson.status === "WAITING") {
        stop();

        if (executionRunning) {
          setExecutionRunning(false);
        }

    	  var curelements = cy.elements();
    	  for (let i = 0; i < curelements.length; i++) {
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

  var streamDisabled2 = false
  const sendStreamRequest = (body) => {
    //console.log("Stream not activated yet.")
    if (!isCloud) {
		return
    }

	if (streamDisabled) {
		return
	}


    // Session may be important here huh 
    body.user_id = userdata.id

	//const url = ${globalUrl}/api/v1/workflows/${props.match.params.key}/stream
	//const streamUrl = "http://localhost:5002"

	//console.log("Stream request: ", body)
	const streamUrl = "https://stream.shuffler.io"
	const url = `${streamUrl}/api/v1/workflows/${props.match.params.key}/stream`

	var parsedbody = body
	try {
		parsedbody = JSON.stringify(body)
	} catch (e) {
		console.log("Error parsing body for stream: ", e)
	}

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: parsedbody,
      credentials: "include",
    })
      .then((response) => {
        setSavingState(0);
        if (response.status !== 200) {

		  setStreamDisabled(true)
		  streamDisabled2 = true 
          //console.log("Status not 200 for stream :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("Stream resp: ", responseJson)
      })
      .catch((error) => {
        console.log("Stream send error: ", error.toString())
  		setStreamDisabled(true)
  		streamDisabled2 = true 
      })
  }

  const saveWorkflow = (curworkflow, executionArgument, startNode, duplicationOrg) => {
    var success = false;

    if (isCloud && !isLoggedIn) {
      console.log("Should redirect to register with redirect.")

	  setTimeout(() => {
		toast("You may not have access to this workflow.")
		//window.location.href = `/register?view=/workflows/${props.match.params.key}&message=You need sign up to use workflows with Shuffle`
		window.location.href = `/workflows`
	  }, 2500)
	
      return
    }

	if (curworkflow === undefined || curworkflow === null) {
		console.log("No workflow during save")
		return
	}

	if (curworkflow.actions === undefined || curworkflow.actions === null || curworkflow.actions.length === 0) {
		console.log("Can't save without actions")
		return
	}

    setSavingState(2);

    // This might not be the right course of action, but seems logical, as items could be running already
    // Makes it possible to update with a version in current render
    stop();
    var useworkflow = workflow;
    if (curworkflow !== undefined) {
      useworkflow = curworkflow;
    }

	
	
    var cyelements = []
	if (cy !== undefined && cy !== null) {
    	cyelements = cy.elements()
	}

    	var newActions = [];
    	var newTriggers = [];
    	var newBranches = [];
    	var newVBranches = [];
    	var newComments = [];
    	for (let cyelementsKey in cyelements) {
    	  if (cyelements[cyelementsKey].data === undefined) {
    	    continue;
    	  }

    	  var type = cyelements[cyelementsKey].data()["type"]
    	  if (type === undefined) {
    	    if (cyelements[cyelementsKey].data().source === undefined || cyelements[cyelementsKey].data().target === undefined) {
    	      continue
    	    }

			// Get the parent item
			var source_attachment = ""
			const branchSource = cy.getElementById(cyelements[cyelementsKey].data().source)
			if (branchSource === undefined || branchSource === null) {
			} else {
				const branchSourceData = branchSource.data()
				if (branchSourceData !== undefined && branchSourceData !== null && branchSourceData.attachedTo !== undefined) {
					source_attachment = branchSourceData.attachedTo

					// Check if it's the 'else' or not based on uuidv5 
					const else_attachment = uuidv5(source_attachment, uuidv5.URL)
	  				if (else_attachment === branchSourceData.id) {
						source_attachment = source_attachment+"-else"
					}

					console.log("Source parent: ", source_attachment)
				}
			}

    	    var parsedElement = {
    	      id: cyelements[cyelementsKey].data().id,
    	      source_id: cyelements[cyelementsKey].data().source,
    	      destination_id: cyelements[cyelementsKey].data().target,
    	      conditions: cyelements[cyelementsKey].data().conditions,
    	      decorator: cyelements[cyelementsKey].data().decorator,

			  source_parent: source_attachment,
    	    }

    	    if (parsedElement.decorator) {
    	      newVBranches.push(parsedElement)
    	    } else {
    	      newBranches.push(parsedElement)
    	    }

    	  } else {
    	    if (type === "ACTION") {
    	      const cyelement = cyelements[cyelementsKey].data();
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
    	        curworkflowAction = cyelements[cyelementsKey].data();
    	      }

    	      curworkflowAction.position = cyelements[cyelementsKey].position();

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
			if (cyelements[cyelementsKey].data().example !== undefined) {
			  curworkflowAction.example = cyelements[cyelementsKey].data().example;
			}
		  }

          // Override just in this place
          curworkflowAction.errors = [];
          curworkflowAction.isValid = true;

		  // Cleans up OpenAPI items
		  var newparams = [];
		  for (let parametersKey in curworkflowAction.parameters) {
			const thisitem = curworkflowAction.parameters[parametersKey];
			if (thisitem.name.startsWith("${") && thisitem.name.endsWith("}")) {
			  continue;
			}

			if (thisitem.value !== undefined && thisitem.value !== null && Array.isArray(thisitem.value)) {
				thisitem.value = thisitem.value.join(",")
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
			(a) => a.id === cyelements[cyelementsKey].data()["id"]
		  );
		  if (curworkflowTrigger === undefined) {
			curworkflowTrigger = cyelements[cyelementsKey].data();
		  }

		  curworkflowTrigger.position = cyelements[cyelementsKey].position();
		  if (curworkflowTrigger.canConnect === false) {
		  	continue
		  }

          newTriggers.push(curworkflowTrigger);
        } else if (type === "COMMENT") {
          if (useworkflow.comments === undefined || useworkflow.comments === null) {
            useworkflow.comments = [];
          }

    	      var curworkflowComment = useworkflow.comments.find(
    	        (a) => a.id === cyelements[cyelementsKey].data()["id"]
    	      )

    	      if (curworkflowComment === undefined) {
    	        curworkflowComment = cyelements[cyelementsKey].data();
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

		  curworkflowComment.position = cyelements[cyelementsKey].position();
						//console.log(curworkflowComment)

          newComments.push(curworkflowComment);
        } else {
          toast("No handler for type: " + type);
        }
      }
    }

    if (userediting === true) {
      useworkflow.user_editing = true
    }

    useworkflow.actions = newActions;
    useworkflow.triggers = newTriggers;
    useworkflow.branches = newBranches;
    useworkflow.comments = newComments;
    useworkflow.visual_branches = newVBranches;

    // Errors are backend defined
    useworkflow.errors = [];
    useworkflow.previously_saved = true;

	// Find the startnode in actions
	/*
	var foundStartNode = useworkflow.actions.find((a) => a.is_start_node === true)
	console.log("Discovered startnode: ", foundStartNode)
	if ((foundStartNode === undefined || foundStartNode === null) && useworkflow.actions.length > 0) {
		// Set a startnode
		useworkflow.actions[0].is_start_node = true
		useworkflow.start = useworkflow.actions[0].id
	}
	*/

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

	if (useworkflow.id === undefined || useworkflow.id === null || useworkflow.id.length === 0) {
		useworkflow.id = props.match.params.key
	}

	var headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

	if (useworkflow.org_id !== undefined && useworkflow.org_id !== null && useworkflow.org_id.length > 0) {
		headers["Org-Id"] = useworkflow.org_id
	}

	// Realtime makes the workflow if it doesn't exist
	/*
	if (duplicationOrg !== undefined && duplicationOrg !== null && duplicationOrg.length > 0) {
		headers["Org-Id"] = duplicationOrg
	}
	*/

    setLastSaved(true);
    fetch(`${globalUrl}/api/v1/workflows/${useworkflow.id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(useworkflow),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for setting workflows :O!");
        } else {
	  		if (distributedFromParent === "" && suborgWorkflows === []) {
			} else {
  				getChildWorkflows(useworkflow.id) 
			}
		}

        return response.json();
      })
      .then((responseJson) => {
		if (useworkflow.id === originalWorkflow.id && duplicationOrg !== undefined && duplicationOrg !== null && duplicationOrg.length > 0) {
			//duplicateParentWorkflow(useworkflow, duplicationOrg, true)
			duplicateParentWorkflow(useworkflow, duplicationOrg, true)
		}

        if (executionArgument !== undefined && startNode !== undefined) {
          //console.log("Running execution AFTER saving");
          setSavingState(0);
          executeWorkflow(executionArgument, startNode, true);
          return;
        }

        if (!responseJson.success) {
          setSavingState(0);
          console.log(responseJson);
          if (responseJson.reason !== undefined && responseJson.reason !== null) {
            toast("Failed to save: " + responseJson.reason);
          } else {
            toast("Failed to save. Please contact your support@shuffler.io or your local admin if this is unexpected.")
          }
        } else {
          setSavingState(1);

          sendStreamRequest({
            "item": "workflow",
            "type": "save",
            "id": workflow.id,
          })

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
			  
			  for (let i = 0; i < cyelements.length; i++) {
								//cyelements[i].removeStyle();
				cyelements[i].data().is_valid = true;
				cyelements[i].data().errors = [];
			  }

			  for (let actionkey in workflow.actions) {
				workflow.actions[actionkey].is_valid = true;
				workflow.actions[actionkey].errors = [];
			  }
			}

            setWorkflow(workflow);
          }

          setTimeout(() => {
            setSavingState(0);
          }, 1500);
          getRevisionHistory(useworkflow.id)
        }
      })
      .catch((error) => {
        setSavingState(0);
		setExecutionRequestStarted(false)
        console.log("Save workflow error: ", error.toString());
		toast.warn("Failed to save the workflow. Is the network down?")
      });

	if (originalWorkflow.id === undefined || originalWorkflow.id === null || originalWorkflow.id.length === 0 || useworkflow.id === originalWorkflow.id && workflow.parentorg_workflow === "") {
		setOriginalWorkflow(useworkflow)
	}

    return success
  };

  const monitorUpdates = () => {
    var firstnode = cy.getElementById(workflow.start);
    if (firstnode.length === 0) {
      var found = false;
      for (let actionkey in workflow.actions) {
        if (workflow.actions[actionkey].isStartNode) {
          console.log("Updating startnode");
          workflow.start = workflow.actions[actionkey].id;
          firstnode = cy.getElementById(workflow.actions[actionkey].id);
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

    if (hasSaved === false) {
      setExecutionRequestStarted(true)
      saveWorkflow(workflow, executionArgument, startNode);
      //console.log("FIXME: Might have forgotten to save before executing.");
      return;
    }

    if (workflow.public) {
      toast("Save it to get a new version");
    }

    var returncheck = monitorUpdates();
    if (!returncheck) {
      toast("No startnode set.");
      return;
    }

    ReactDOM.unstable_batchedUpdates(() => {


      setVisited([])
      setExecutionRequest({})
      stop()

	  // FIXME: Check if any node contains $exec in a param
	  // If they do, show a popup asking if they want to execute it without an execution argument, or to use a previous one
	  if (executionArgument === undefined || executionArgument === null || executionArgument.length === 0)

		  if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
			  var foundmissing = false
			  for (let actionkey in workflow.actions) {
				  if (workflow.actions[actionkey].parameters === undefined || workflow.actions[actionkey].parameters === null || workflow.actions[actionkey].parameters.length === 0) {
					  continue
				  }

				  for (let paramkey in workflow.actions[actionkey].parameters) {
					  const param = workflow.actions[actionkey].parameters[paramkey]
					  if (param.value === undefined || param.value === null || param.value.length === 0) {
						  continue
					  }

					  if (param.value.indexOf("$exec") !== -1) {
						  foundmissing = true
						  break
					  }
				  }

				  if (foundmissing) {
					  break
				  }
			  }

			  if (foundmissing) {
				  //toast("This workflow contains a node that requires an execution argument. Please provide one.")
				  if (workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0) {
					  setExecutionRequestStarted(false)
					  setExecutionArgumentModalOpen(true)
					  return
				  }

				  if (workflowExecutions.length > 0) {
					setExecutionRequestStarted(false)
					setExecutionArgumentModalOpen(true)

					return
				  }
			  }
		  }

	  var curelements = cy.elements();
	  for (let i = 0; i < curelements.length; i++) {
	    curelements[i].addClass("not-executing-highlight");
	  }

	  var headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      }

	  if (workflow.org_id !== undefined && workflow.org_id !== null && workflow.org_id.length > 0) {
	  	headers["Org-Id"] = workflow.org_id
	  }

      const data = { execution_argument: executionArgument, start: startNode };
      fetch(`${globalUrl}/api/v1/workflows/${props.match.params.key}/execute`,
        {
          method: "POST",
          headers: headers,
          credentials: "include",
          body: JSON.stringify(data),
        }
      )
        .then((response) => {
          setExecutionRequestStarted(false)
          if (response.status !== 200) {
            console.log("Status not 200 for WORKFLOW EXECUTION :O!");
          }

          return response.json();
        })
        .then((responseJson) => {
          if (!responseJson.success) {
              //toast("Failed to start: " + responseJson.reason);
              toast(responseJson.reason);
		      //toast.error(responseJson.reason);
              setExecutionRunning(false);
              setExecutionRequestStarted(false);
              stop();

    	      for (let i = 0; i < curelements.length; i++) {
    	        curelements[i].removeClass("not-executing-highlight");
    	      }
    	      return;
    	    } else {
			  if (responseJson.execution_id !== undefined && responseJson.execution_id !== null && responseJson.execution_id.length > 0) {
			  	navigate(`?execution_id=${responseJson.execution_id}`)
			  }

    	      setExecutionRunning(true);
    	      setExecutionRequestStarted(false);
    	    }

          if (
            responseJson.execution_id === "" ||
            responseJson.execution_id === undefined ||
            responseJson.authorization === "" ||
            responseJson.authorization === undefined
          ) {
            toast("Something went wrong during execution startup");
            console.log("BAD RESPONSE FOR EXECUTION: ", responseJson);
            setExecutionRunning(false);
            setExecutionRequestStarted(false);
            stop();

    	      for (let i = 0; i < curelements.length; i++) {
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
          //toast(error.toString());
          setExecutionRequestStarted(false)
          console.log("Execute workflow err: ", error.toString());
		  toast.warn("Failed to run the workflow. Is the network down?")
        });
    })
  };

  // This can be used to only show prioritzed ones later
  // Right now, it can prioritize authenticated ones
  //"Testing",
	//
	//

  const getAuthGroups = (orgId) => {
	setAuthGroups([])
	var headers = {
		"content-type": "application/json",
		"accept": "application/json",
	}

	if (orgId !== undefined && orgId !== null && orgId.length > 0) {
		headers["Org-Id"] = orgId
	}

    fetch(globalUrl + "/api/v1/authentication/groups", {
      method: "GET",
      headers: headers,
      credentials: "include",
    })
	.then((response) => {
		if (response.status !== 200) {
			console.log("Status not 200 for app auth :O!");
		}

		return response.json();
	})
	.then((responseJson) => {
		if (responseJson.success === true) {
			setAuthGroups(responseJson.data)
		} else {
			console.log("AppAuth group loading error: " + responseJson.reason);
		}
    })
    .catch((error) => {
		setAuthGroups([]);
        console.log("AppAuth group loading error: " + error.toString());
    })
  }

  const getAppAuthentication = (reset, updateAction, closeMenu, orgId) => {
	var headers = {
		"content-type": "application/json",
		"accept": "application/json",
	}

	if (orgId !== undefined && orgId !== null && orgId.length > 0) {
		headers["Org-Id"] = orgId
	}

    fetch(globalUrl + "/api/v1/apps/authentication", {
      method: "GET",
      headers: headers,
      credentials: "include",
    })
	.then((response) => {
		if (response.status !== 200) {
			console.log("Status not 200 for app auth :O!");
		}

		return response.json();
	})
	.then((responseJson) => {
	var shouldClose = false 
	if (responseJson.success) {
	  getAuthGroups(orgId) 

	  var newauth = [];
	  for (let authkey in responseJson.data) {
		if (responseJson.data[authkey].defined === false) {
		  continue;
		}

		newauth.push(responseJson.data[authkey]);
	  }

	  setAppAuthentication(newauth);

	  if (cy !== undefined) {
		// Remove the old listener for select, run with new one
		cy.removeListener("select");

		cy.on("select", "node", (e) => onNodeSelect(e, newauth));
		cy.on("select", "edge", (e) => onEdgeSelect(e));
	  }

	  if (updateAction === true) {
		if (selectedApp.authentication.required) {
		  // Setup auth here :)
		  var appUpdates = false;
		  const authenticationOptions = [];

		  var tmpAuth = JSON.parse(JSON.stringify(newauth));
		  var latest = 0;
		  for (let authkey in tmpAuth) {
			var item = tmpAuth[authkey];

							//console.log("Got auth: ", item);

			const newfields = {};
			for (let filterkey in item.fields) {
			  newfields[item.fields[filterkey].key] = item.fields[filterkey].value;
			}

			item.fields = newfields;

			const appname = selectedApp.name.toLowerCase().replaceAll(" ", "_", -1)
			const itemname = item.app.name.toLowerCase().replaceAll(" ", "_", -1)
			if (itemname === appname) {
			  authenticationOptions.push(item);

			  // Always becoming the last one
			  if (item.edited > latest) {
				latest = item.edited;
				selectedAction.selectedAuthentication = item;

				for (let actionkey in workflow.actions) {
										const actionAppname = workflow.actions[actionkey].app_name.toLowerCase().replaceAll(" ", "_", -1)
				  if (actionAppname === appname) {
					workflow.actions[actionkey].selectedAuthentication = item;
					workflow.actions[actionkey].authentication_id = item.id;
					appUpdates = true;
				  }
				}
			  } else {
				//console.log("Not newer: ", item.edited, " vs ", latest)
			  }
			} else {
				//console.log("Appname is wrong: ", appname, " vs ", itemname)
			}
		  }

		  console.log("auth options: ", authenticationOptions)

		  selectedAction.authentication = authenticationOptions
		  if (selectedAction.selectedAuthentication === null || selectedAction.selectedAuthentication === undefined || selectedAction.selectedAuthentication.length === "") {
			selectedAction.selectedAuthentication = {}
		  }

		  if (appUpdates === true) {
			console.log("Closing auth modal: Success")

			setAuthenticationModalOpen(false);
			setSelectedAction(selectedAction);
			setWorkflow(workflow);
			saveWorkflow(workflow);

			toast("Added and updated authentication!");
							shouldClose = true 
		  } else {
			console.log("Closing auth modal? FAIL")

			toast("Failed to find new authentication. See details in Oauth2 popup window where auth was attempted.");
							shouldClose = false 
		  }
		} else {
		  toast("No authentication to update");
		}
	  } else {
		shouldClose = true
	  }

		} else {
			setAppAuthentication([])
			shouldClose = true 
		}

		// Auto-closing if changes were made 
		if (closeMenu === true && shouldClose === true) {
			setAuthenticationModalOpen(false);
		}
    })
    .catch((error) => {
      		setAppAuthentication([]);
      //toast("Auth loading error: " + error.toString());
      console.log("AppAuth error: " + error.toString());
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
          console.log("Status not 200 for apps. Setting to pretend apps!");

          const pretend_apps = [{
            "name": "TBD",
		    "id": "TBD",
            "app_name": "TBD",
            "app_version": "TBD",
            "description": "TBD",
            "version": "TBD",
            "large_image": "",
          }]
        	
		  setAppsLoaded(true)
          setFilteredApps(pretend_apps)
          setApps(Array.prototype.concat.apply(pretend_apps, triggers))
          setPrioritizedApps(pretend_apps)

  		  if (isLoggedIn) {
		  	toast("Something went wrong while loading apps. Please refresh the window to try again.")
		  }

          return
        }

		console.log("Apps loaded. JSON decoding next")

        return response.json()
      })
      .then((responseJson) => {
        if (responseJson === null) {
          console.log("No response")
          const pretend_apps = [{
            "name": "TBD",
		    "id": "TBD",
            "app_name": "TBD",
            "app_version": "TBD",
            "description": "TBD",
            "version": "TBD",
            "large_image": "",
          }]
        	
		  setAppsLoaded(true)
          setFilteredApps(pretend_apps)
          setApps(Array.prototype.concat.apply(pretend_apps, triggers))
          setPrioritizedApps(pretend_apps)
          return
        }

        if (responseJson.success === false) {
          return
        }

		// Used for e.g. Liquid testing
		const foundTools = responseJson.find((app) => app.name === "Shuffle Tools")
		if (foundTools !== undefined && foundTools !== null) {
			setToolsApp(foundTools)
		}

		// Set localstorage for the apps in the "apps" key
        setApps(Array.prototype.concat.apply(responseJson, triggers))
		if (responseJson !== undefined && responseJson !== null && responseJson.length > 0) {
			try {
				localStorage.setItem("apps", JSON.stringify(responseJson))
			} catch (e) {
				console.log("Failed to set apps in localstorage: ", e)
			}
		}

		var handledPrioritizedApps = responseJson.filter((app) => internalIds.includes(app.name.toLowerCase()));
        handledPrioritizedApps = [].concat(integrationApps, handledPrioritizedApps)

        if (isCloud) {
          setFilteredApps(responseJson.filter((app) => !internalIds.includes(app.name.toLowerCase())))
          setPrioritizedApps(handledPrioritizedApps)
          
        } else {
          const tmpFiltered = responseJson.filter((app) => !internalIds.includes(app.name.toLowerCase()))
          setFilteredApps(tmpFiltered)
          setPrioritizedApps(handledPrioritizedApps)
        }

		setAppsLoaded(true)

		// Remove all cytoscape triggers first?
		if (cy !== undefined && cy !== null) {
			cy.removeListener("select")
		}

		// Re-adding cytoscape triggers
		if (cy !== undefined && cy !== null) {
			cy.on("select", "node", (e) => {
			  onNodeSelect(e, appAuthentication)
			})
		}
      })
      .catch((error) => {
        console.log("App loading error: " + error.toString())
        setAppsLoaded(true)
        //toast("App loading error: "+error.toString())
      });
  };

  // Searhc by username, userId, workflow, appId should all work
  const getUserProfile = (username, rerun) => {
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
        } else {
          console.log("Couldn't find the creator profile (rerun?): ", responseJson, rerun)
          // If the current user is any of the Shuffle Creators 
          // AND the workflow doesn't have an owner: allow editing.
          // else: Allow suggestions?
          //console.log("User: ", userdata)
          //if (rerun !== true) {
          //	getUserProfile(userdata.id, true)
          //}
        }
      })
      .catch((error) => {
        console.log("Get userprofile error: ", error);
      })
  }

  const getFiles = (orgId) => {
	var headers = {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}

	if (orgId !== undefined && orgId !== null && orgId.length > 0) {
		headers["Org-Id"] = orgId
	}

    fetch(globalUrl + "/api/v1/files", {
      method: "GET",
      headers: headers,
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          //console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.files !== undefined && responseJson.files !== null) {
          setFiles(responseJson);
        } else {
          setFiles({
            "namespaces": [
              "default"
            ]
          });
        }

        if (
          responseJson.namespaces !== undefined &&
          responseJson.namespaces !== null
        ) {
          //setFileNamespaces(responseJson.namespaces);
        }
      })
      .catch((error) => {
        //toast(error.toString());
				console.log("Error loading files: ", error)
      });
    };

	const onChunkedResponseComplete = (result) => {
		// Dont return until in 5 seconds without setTimeout
	}

	const onChunkedResponseError = (err) => {
		if (streamDisabled) {
			return
		}
	}


	const uuidToHSV = (uuid) => {
	    // Convert the UUID to a hexadecimal string without dashes
	    const uuidHex = uuid.replace(/-/g, "");
	
	    // Take the first 6 characters of the hexadecimal UUID as the seed
	    const seed = parseInt(uuidHex.slice(0, 6), 16);
	
	    // Normalize the seed to a value between 0 and 1
	    const normalizedSeed = seed / 0xFFFFFF; // 0xFFFFFF is the maximum possible value with 6 hexadecimal characters
	
	    // Use the normalized seed to generate HSV values
	    const hue = normalizedSeed; // Hue value between 0 and 1
	    const saturation = 0.8; // You can adjust the saturation value as desired (between 0 and 1)
	    const value = 0.8; // You can adjust the value/brightness as desired (between 0 and 1)
	
	    // Convert HSV to RGB
	    const rgb = HSVtoRGB(hue, saturation, value);
	
	    // Scale the RGB values to the 0-255 range
	    const scaledRGB = rgb.map(val => Math.round(val * 255));
	
	    return scaledRGB;
	}
	
	// HSV to RGB conversion function
	const HSVtoRGB = (h, s, v) => {
	    const h_i = Math.floor(h * 6);
	    const f = h * 6 - h_i;
	    const p = v * (1 - s);
	    const q = v * (1 - f * s);
	    const t = v * (1 - (1 - f) * s);
	
	    switch (h_i % 6) {
	        case 0: return [v, t, p];
	        case 1: return [q, v, p];
	        case 2: return [p, v, t];
	        case 3: return [p, q, v];
	        case 4: return [t, p, v];
	        case 5: return [v, p, q];
	        default: return [0, 0, 0];
	    }
	}

	const rgbToHex = (rgb) => {
		// Ensure that each component is in the valid range (0-255)
		const r = Math.max(0, Math.min(255, rgb[0]));
		const g = Math.max(0, Math.min(255, rgb[1]));
		const b = Math.max(0, Math.min(255, rgb[2]));

		// Convert the RGB values to hexadecimal and pad with zeros if needed
		const rHex = r.toString(16).padStart(2, "0");
		const gHex = g.toString(16).padStart(2, "0");
		const bHex = b.toString(16).padStart(2, "0");

		// Combine the hexadecimal values to create the final color code
		const hexColor = `#${rHex}${gHex}${bHex}`;

		return hexColor.toUpperCase(); // Optionally, make the result uppercase
	}

	const getUserColor = (user_id) => {
		//return "#ffffff"
		return rgbToHex(uuidToHSV(user_id))
	}

	const hoverNode = (chunkJson) => {
		// Find the node
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		var node = cy.getElementById(chunkJson.id)
		if (node === undefined || node === null) {
			console.log("Node is undefined or null")
			return
		}

		const color = getUserColor(chunkJson.user_id)
		const parsedStyle = {
		  "border-width": "6px",
		  "border-opacity": ".7",
		  "font-size": "25px",
		  "border-color": color,
		}

		const animationDuration = 150 
    	node.animate(
    	  {
    	    style: parsedStyle,
    	  },
    	  {
    	    duration: animationDuration,
    	  }
    	)

		// Wait 3 seconds and remove it
		setTimeout(() => {
			const parsedStyle = {
			  "border-width": "1px",
			  "font-size": "18px",
      		  "border-color": "#81c784",
			}

			node.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			)
		}, 3000)
	}

	const moveNode = (chunkJson) => {
		// Find the node
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		var node = cy.getElementById(chunkJson.id)
		if (node === undefined || node === null) {
			console.log("Node is undefined or null")
			return
		}

		console.log("Moving node: ", node, chunkJson)

		// Find nodes attached to the node
		node.position({
			x: chunkJson.location.x,
			y: chunkJson.location.y
		})

		const connectedNodes = cy.filter('node[attachedTo = "'+chunkJson.id+'"]')
		if (connectedNodes === undefined || connectedNodes === null) {
			console.log("Connected nodes is undefined or null")
		} else {
			console.log("Connected nodes: ", connectedNodes)
			connectedNodes.remove()
		}

		const color = getUserColor(chunkJson.user_id)
		const parsedStyle = {
		  "border-width": "11px",
		  "border-opacity": ".7",
		  "font-size": "25px",
		  "border-color": color,
		}

		const animationDuration = 150 
    	node.animate(
    	  {
    	    style: parsedStyle,
    	  },
    	  {
    	    duration: animationDuration,
    	  }
    	)

		// Wait 3 seconds and remove it
		setTimeout(() => {
			const parsedStyle = {
			  "border-width": "1px",
			  "font-size": "18px",
      		  "border-color": "#81c784",
			}

			node.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			)
		}, 3000)
	}

	const hoverEdge = (chunkJson) => {
		// Find the node
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		var node = cy.getElementById(chunkJson.id)
		if (node === undefined || node === null) {
			console.log("Node is undefined or null")
			return
		}

		const color = getUserColor(chunkJson.user_id)
		const parsedStyle = {
			  "line-gradient-stop-positions": ["0.0", "100"],
			  "line-gradient-stop-colors": [color, color],
		}

		const animationDuration = 150 
    	node.animate(
    	  {
    	    style: parsedStyle,
    	  },
    	  {
    	    duration: animationDuration,
    	  }
    	)

		// Wait 3 seconds and remove it
		setTimeout(() => {
			const parsedStyle = {
			  "line-gradient-stop-positions": ["0.0", "100"],
			  "line-gradient-stop-colors": ["grey", "grey"],
			}

			node.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			)
		}, 3000)
	}

	const selectNode = (chunkJson) => {
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		var node = cy.getElementById(chunkJson.id)
		if (node === undefined || node === null) {
			console.log("Node is undefined or null")
			return
		}

		const color = getUserColor(chunkJson.user_id)
		const parsedStyle = {
		  "border-width": "11px",
		  "border-opacity": ".7",
		  "font-size": "25px",
		  "border-color": color,
		}

		const animationDuration = 150 
    	node.animate(
    	  {
    	    style: parsedStyle,
    	  },
    	  {
    	    duration: animationDuration,
    	  }
    	)

		setTimeout(() => {
			const parsedStyle = {
			  "border-width": "11px",
			  "border-opacity": ".7",
			  "font-size": "25px",
			  "border-color": color,
			}

			node.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			)
		}, 3000)
	}

	const unselectNode = (chunkJson) => {
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		var node = cy.getElementById(chunkJson.id)
		if (node === undefined || node === null) {
			console.log("Node is undefined or null")
			return
		}

		const color = getUserColor(chunkJson.user_id)
		const parsedStyle = {
		  "border-width": "1px",
		  "font-size": "18px",
		  "border-color": "#81c784",
		}

		const animationDuration = 150 
    	node.animate(
    	  {
    	    style: parsedStyle,
    	  },
    	  {
    	    duration: animationDuration,
    	  }
    	)
	}

	const addNode = (chunkJson) => {
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		const node = cy.getElementById(chunkJson.id)
		if (node !== undefined && node !== null) {
			return
		}

		const color = getUserColor(chunkJson.user_id)

		// Create the node and add to cytoscape
		const data = chunkJson.data
		const nodeData = {
			group: "nodes",
			data: chunkJson.data,
			position: { 
				x: data.x, 
				y: data.y 
			},
		}

		cy.add(nodeData)
		
		// Wait 100ms then add a style for it
		setTimeout(() => {
			const node = cy.getElementById(chunkJson.id)
			if (node === undefined || node === null) {
				console.log("Node is undefined or null during auto add from other user")
				return
			}

			const parsedStyle = {
			  "border-width": "11px",
			  "border-opacity": ".7",
			  "font-size": "25px",
			  "border-color": color,
			}

			const animationDuration = 150 
			node.animate(
			  {
				style: parsedStyle,
			  },
			  {
				duration: animationDuration,
			  }
			)
		}, 100)
	}

	const removeNodeStream = (chunkJson) => {
		if (cy === undefined || cy === null) {
			console.log("Cy is undefined or null")
			return
		}

		const node = cy.getElementById(chunkJson.id)
		if (node === undefined || node === null) {
			console.log("Node is undefined or null")
			return
		}

		const color = getUserColor(chunkJson.user_id)

		// Animate node, then delete 1 sec later
		const parsedStyle = {
		  "border-width": "11px",
		  "border-opacity": ".7",
		  "font-size": "25px",
		  "border-color": color,
		}

		const animationDuration = 150 
		node.animate(
		  {
			style: parsedStyle,
		  },
		  {
			duration: animationDuration,
		  }
		)

		setTimeout(() => {
			node.remove()
		}, 1000)
	}

	const processChunkedResponse = async (response) => {
		console.log("In process resp!")

		var text = '';
		var reader = response.body.getReader()
		var decoder = new TextDecoder();
		
		const appendChunks = (result) => {
			var chunk = decoder.decode(result.value || new Uint8Array, {stream: !result.done});

			if (chunk === undefined || chunk === null) {
				console.log("Chunk is undefined or null")
			}

			// Try chunk JSON loading
			try {
				var chunkJson = JSON.parse(chunk)

				if (chunkJson.success === false) {
					console.log("Chunk failed: ", chunkJson)

					if (!streamDisabled) {
						setStreamDisabled(true)
  						streamDisabled2 = true 
					}
					return
				}


				if (chunkJson.item !== undefined && chunkJson.item !== null && chunkJson.item !== "") {
					if (chunkJson.item === "node") {
						if (chunkJson.type === "move") {
							moveNode(chunkJson)
						} else if (chunkJson.type === "hover") {
							hoverNode(chunkJson)
						} else if (chunkJson.type === "select") {
							selectNode(chunkJson)
						} else if (chunkJson.type === "unselect") {
							unselectNode(chunkJson)
						} else if (chunkJson.type === "add") {
							addNode(chunkJson)
						} else if (chunkJson.type === "remove") {
							removeNodeStream(chunkJson)
						}
					} else if (chunkJson.item === "edge") {
						if (chunkJson.type === "hover") {
							// Same as node function?
							//hoverEdge(chunkJson)
						}
					}
				}
			} catch (e) {
				console.log("Chunk JSON error: ", e)
	
				if (!streamDisabled) {
					setStreamDisabled(true)
  					streamDisabled2 = true 
				}
					
				return
			}

			//data.push(chunk)
			//setData(data)
    	    
			//setUpdate(Math.random());

			//console.log('got chunk of', chunk.length, 'bytes. Value: ', chunk)
			text += chunk;
			//console.log('text so far is', text.length, 'bytes
			if (result.done) {
				console.log('returning')
				return text;
			} else {
				return readChunk()
			}
		}

		const readChunk = () => {
			return reader.read().then(appendChunks);
		}

		return readChunk();
	}

  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
  
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
  
    const response = await fetch(resource, {
  	...options,
  	signal: controller.signal
    });
    clearTimeout(id);
  
    return response;
  }

  const startWorkflowStream = async (workflowId) => {
	if (!isCloud) {
		console.log("Not cloud, not starting workflow stream")
		return
	}

	if (streamDisabled) {
		console.log("Stream listener disabled")
		return
	}

  	const timeout = 60000 
    //const url = `${globalUrl}/api/v1/workflows/${workflowId}/stream`
	//const streamUrl = "https://shuffle-streaming-backend-stbuwivzoq-ew.a.run.app"
	  //
	const streamUrl = "https://stream.shuffler.io"
	const url = `${streamUrl}/api/v1/workflows/${workflowId}/stream`
  	while (true) {
		if (streamDisabled === true || streamDisabled2 === true) {
			console.log("Stream disabled, breaking")
			break
		}

		// Wait 1 second before next request just in case of timeouts
		await new Promise(r => setTimeout(r, 1000));
		await fetchWithTimeout(url, {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		  timeout: timeout, 
		})
		.then(processChunkedResponse)
		.then(onChunkedResponseComplete)
		.catch(onChunkedResponseError)
  	}
  }

  const [usedSubflowApps, setUsedSubflowApps] = React.useState([]);

  const getWorkflowApps = (workflow_id) => {
    let apps = []

    if (workflow_id === "") {
      console.log("workflow_id is empty");
      return {};
    }

    fetch(`${globalUrl}/api/v1/workflows/${workflow_id}`, {
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
        }

        return response.json();
      })
      .then((responseJson) => {
        for (let index in responseJson.actions) {
          apps.push(responseJson.actions[index]);
        }
        
        console.log("Setting used subflow apps: ", apps)
        setUsedSubflowApps(apps);

        return apps
      })
      .catch((error) => {
        console.log("Get workflow apps error: ", error);
      });

    return apps
  };

  const getChildWorkflows = (parentWorkflowId) => {
	//toast("Loading child workflows 1 (should be 2)")

	/*
	if (originalWorkflow.suborg_distribution === undefined || originalWorkflow.suborg_distribution === null || originalWorkflow.suborg_distribution.length === 0) { 
		return
	}
	*/

	const orgId = originalWorkflow.org_id === undefined || originalWorkflow.org_id === null || originalWorkflow.org_id === "" ? "" : originalWorkflow.org_id

	//toast("Loading child workflows 2: " + orgId)

    fetch(`${globalUrl}/api/v1/workflows/${parentWorkflowId}/child_workflows`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
		"Org-Id": orgId,
      },
      credentials: "include",
    })
	.then((response) => {
		if (response.status !== 200) {
			console.log("Status not 200 for workflows :O!");
		}

		return response.json();
	})
	.then((responseJson) => {
		if (responseJson.success !== false) {
			setSuborgWorkflows(responseJson)
		}
	})
	.catch((error) => {
		console.log("Get child workflows error: ", error);
	})
  }

  const getWorkflow = (workflow_id, sourcenode) => {
    fetch(`${globalUrl}/api/v1/workflows/${workflow_id}`, {
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

			if (response.status >= 500) {
				toast("Something went wrong while loading the workflow. Please reload.")
			} else {

				// Check for execution_id in URL
				// don't redirect if it exists
				const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
			    var execFound = new URLSearchParams(cursearch).get("execution_id");
			    var sessionToken = new URLSearchParams(cursearch).get("session_token");
			    if (execFound === null && sessionToken === null) {
					toast(`You don't have access to this workflow or loading failed. Redirecting to workflows in a few seconds..`)
					setTimeout(() => {
						window.location.pathname = "/workflows";
					}, 2000);

				} else if (sessionToken !== null && workflow_id === "3abdfb21-b40f-4e50-b855-ac0d62f83cbe") {
					toast(`Injecting session token and reloading workflow..`)
					setTimeout(() => {
					  setCookie("session_token", sessionToken, { path: "/" });
					  window.location.href = "https://shuffler.io/workflows/3abdfb21-b40f-4e50-b855-ac0d62f83cbe";
					}, 2000)
				}
			}
        }

		// Read text from stream
		//return response.text();
        return response.json();
      })
      .then((responseJson) => {
		// Load as JSON
		if (responseJson.id !== undefined && responseJson.id !== null && responseJson.id.length > 0 && responseJson.id !== workflow_id) {
			toast("Workflow ID mismatch. Redirecting to your workflow")
			navigate(`/workflows/${responseJson.id}`)
		}

		if (responseJson.parentorg_workflow !== undefined && responseJson.parentorg_workflow !== null && responseJson.parentorg_workflow !== "") {
			setDistributedFromParent(responseJson.parentorg_workflow)
		} 

		if (responseJson.childorg_workflow_ids !== undefined && responseJson.childorg_workflow_ids !== null && responseJson.childorg_workflow_ids.length > 0) {
  			getChildWorkflows(responseJson.id) 
		} else if (responseJson.parentorg_workflow !== undefined && responseJson.parentorg_workflow !== null && responseJson.parentorg_workflow.length > 0) {
  			getChildWorkflows(responseJson.parentorg_workflow)
		}

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

		if (responseJson.org_id !== undefined && responseJson.org_id !== null) {
			listOrgCache(responseJson.org_id)
		}

		if (responseJson.sharing !== undefined && responseJson.sharing !== null && (responseJson.sharing === "form" || responseJson.sharing === "forms")) {
			if (responseJson.actions === undefined || responseJson.actions === null || responseJson.actions.length === 0) {
				navigate("/forms/" + responseJson.id)
				toast("Redirecting to Form from Workflow")
			}
		}
  	
		// Wait for this to finish
		fetchRecommendations(responseJson) 


        if (responseJson.public) {
		  setAppAuthentication([])
          console.log("RESP: ", responseJson)
          if (Object.getOwnPropertyNames(creatorProfile).length === 0) {
            //getUserProfile("frikky") 
            getUserProfile(responseJson.id, false)
          }

			//{appGroup.map((data, index) => {
			//const [appGroup, setAppGroup] = React.useState([]);
			var appsFound = []
			for (let actionkey in responseJson.actions) {
				const parsedAction = responseJson.actions[actionkey]
				if (parsedAction.large_image === undefined || parsedAction.large_image === null || parsedAction.large_image === "") {
					continue
				}
				if (appsFound.findIndex(data => data.app_name === parsedAction.app_name) < 0){
					appsFound.push(parsedAction)
				}
			}

          setAppGroup(appsFound)

			appsFound = []
			for (let triggerkey in responseJson.triggers) {
				const parsedAction = responseJson.triggers[triggerkey]
				if (appsFound.findIndex(data => data.app_name === parsedAction.app_name) < 0){
					appsFound.push(parsedAction)
				}
			}

          setTriggerGroup(appsFound)
		  setWorkflows([responseJson])
        } else {
          getAppAuthentication();
          getEnvironments();

          getSettings();
          getFiles()
		  getWorkflowExecution(props.match.params.key, "");
		  getAvailableWorkflows(-1);
        }


        // Appends SUBFLOWS. Does NOT run during normal grabbing of workflows.
        if (sourcenode.id !== undefined) {

          var nodefound = false;
          var target = sourcenode.parameters.find((item) => item.name === "startnode");
			console.log("Got rightclick target: ", target)
			if (target === undefined || target === null) {
				target = {
					"name": "startnode",
					"value": responseJson.start
				}
			}
          
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

            node.data.canConnect = false
            node.data.is_valid = true
            node.data.isValid = true
            node.data._id = action["id"];
            node.data.type = "ACTION";
            node.data.source_workflow = responseJson.id;
            if (action.id === target_id) {
              nodefound = true;
            }

            if (responseJson.public) {
              node.data.is_valid = true
              node.is_valid = true
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

          var triggers = responseJson.triggers.map((trigger) => {
            const node = {};

            console.log("Only add workflow: ", trigger.app_name)
            if (trigger.app_name !== "Shuffle Workflow" && trigger.app_name !== "User Input") {
              return null
            }

            node.position = trigger.position;
            node.data = trigger;

            node.data.canConnect = false
            node.data.id = trigger["id"];
            node.data._id = trigger["id"];
            node.data.type = "TRIGGER";

            return node;
          });

          triggers = triggers.filter((trigger) => trigger !== null);
          const insertedNodes = [].concat(actions, triggers);
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

            const sourceFound = insertedNodes.findIndex(
              (action) => action.data.id === branch.source_id
            );
            if (sourceFound < 0) {
              return null;
            }

            const destinationFound = insertedNodes.findIndex(
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

            if (responseJson.public) {
              edge.data.is_valid = true
              edge.is_valid = true
            }

            return edge;
          });

          edges = edges.filter((edge) => edge !== null);
          cy.removeListener("add");
          cy.add(insertedNodes)
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
	  	  if (responseJson.id !== undefined && responseJson.id !== null && responseJson.id.length > 0 && responseJson.parentorg_workflow === "") {
          	setOriginalWorkflow(responseJson)
		  }

          setWorkflow(responseJson);
          setWorkflowDone(true);

          // Add error checks
          if (!responseJson.public) {
            if (
              !responseJson.previously_saved ||
              !responseJson.is_valid ||
              responseJson.errors !== undefined ||
              responseJson.errors !== null ||
              responseJson.errors !== // what
              responseJson.errors.length > 0
            ) {
			  console.log("Setting configure Modal to open")
            }
              
			setConfigureWorkflowModalOpen(true)
          }
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get workflows error: ", error.toString());
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
    for (var idkey in typeIds) {
      const item = typeIds[idkey]
      if (item.data.isButton === true) {
        //console.log("Reselect old node & return - or just return?")

        if (item.data.buttonType === "delete" && item.data.attachedTo === nodedata.id) {
          //console.log("delete of same node!")
        }
        return
      }
    }

    // Unselecting all
    //cy.elements().unselect()

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


    // FIXME - check if they have value before overriding like this for no reason.
    // Would save a lot of time (400~ ms -> 30ms)
    //console.log("ACTION: ", selectedAction)
    //console.log("APP: ", selectedApp)

		//setSubworkflow({})
    ReactDOM.unstable_batchedUpdates(() => {
      setSelectedAction({});
      setSelectedApp({});
      setSelectedComment({})
      setSelectedEdge({})
      //setSelectedActionEnvironment({})
      setTriggerAuthentication({})
      setLocalFirstrequest(true)

      setSelectedTrigger({});
      setSelectedTriggerIndex(-1)
	  setUpdate(Math.random())

      // Can be used for right side view
      setRightSideBarOpen(false);
      setScrollConfig({
        top: 0,
        left: 0,
        selected: "",
      });
      //console.timeEnd("UNSELECT");
    })

    sendStreamRequest({
      "item": "node",
      "type": "unselect",
      "id": workflow.id,
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
        toast("This edge can't be edited.");
      } else {
        const destinationId = event.target.data("target");
        const curaction = workflow.actions.find((a) => a.id === destinationId);
        //console.log("ACTION: ", curaction)
        if (curaction !== undefined && curaction !== null) {
          if (
            curaction.app_name === "Shuffle Tools" &&
            curaction.name === "router"
          ) {
            toast("Router action can't have incoming conditions");
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
    if (nodedata.type === "TRIGGER" && (nodedata.app_name === "Shuffle Workflow" || nodedata.app_name === "User Input")) {
    
      if (nodedata.parameters === null) {
        toast("Set a workflow first");
        return;
      }

      if (nodedata.parameters === undefined) {
        return
      }

      const workflow_id = nodedata.parameters.find((param) => param.name === "workflow" || param.name === "subflow");

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
      //console.log("Same node, return")
      return
    }

    if (nodedata.finished === false) {
      return
    }

	const connected = event.target.connectedEdges().jsons()
    if (connected.length > 0 && connected !== undefined) {
		for (let connectkey in connected) {
			const edge = connected[connectkey]
			if (edge.data.decorator && edge.data.label === releaseToConnectLabel) {
				// Transform to normal edge
				const currentedge = cy.getElementById(edge.data.id)
				if (currentedge !== undefined && currentedge !== null) {
					currentedge.data("decorator", false)
					currentedge.data("label", "")
				}
				continue
			}

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

          // Find exact position to put the text

          const idsplit = curElement.id.split("_");
          console.log(idsplit);
          if (idsplit.length === 3 && !isNaN(idsplit[2])) {

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
        nodedata.app_name !== "Integration Framework" &&
        nodedata.app_name !== "User Input") ||
        nodedata.isStartNode)
    ) {
			const allNodes = cy.nodes().jsons();
			var found = false;
			for (let nodekey in allNodes) {
				const currentNode = allNodes[nodekey];
				if (currentNode.data.attachedTo === nodedata.id && currentNode.data.isDescriptor) {
					found = true
					break
				}
			}

			if (nodedata.app_name === "Webhook" || nodedata.app_name === "Schedule" || nodedata.app_name === "Gmail" || nodedata.app_name === "Office365") {
      			if (!found) {
					console.log("Find amount of executions for the specific nodetype: ", nodedata.app_name, "Executions: ", workflowExecutions)
					// Find how many executions it has 
					var executions = 0
					const matchingExecutions = workflowExecutions.filter((execution => execution.execution_source === nodedata.app_name.toLowerCase()))
					const color = matchingExecutions.length > 0 ? "#34a853" : "#ea4436"
					const decoratorNode = {
						position: {
							x: event.target.position().x + 44,
							y: event.target.position().y + 44,
						},
						locked: true,
						data: {
							isDescriptor: true,
							isValid: true,
							is_valid: true,
							isTrigger: true,
							label: `${matchingExecutions.length}`,
							attachedTo: nodedata.id,
							imageColor: color,
							hasExecutions: true,
						},
					};

					cy.add(decoratorNode)
				}
			} else { 
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
      	  //console.log("Node already exists - don't add descriptor node");
      	}
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
      "location": {
        "x": event.target.position("x"),
        "y": event.target.position("y"),
      }
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
      for (var nodekey in allNodes) {
        const currentNode = allNodes[nodekey];
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

    if (nodedata.buttonType === "edgehandler") {
      console.log("Enable edgehandler!")
      console.log("Find parent: ", nodedata.attachedTo)
      const parentNode = cy.getElementById(nodedata.attachedTo);
      if (parentNode !== null && parentNode !== undefined) {
        console.log("Start parentnode tracking!")
        //cy.edgehandles().start(parentNode)
      }
    }

    if (nodedata.id === selectedAction.id) {
      return;
    }

    if ((nodedata.trigger_type === "SUBFLOW" || nodedata.trigger_type === "USERINPUT" || nodedata.type === "ACTION") && !nodedata.isStartNode) {
      // Check if it already has any non-decorator branches attached to it
      const branches = cy.elements('edge').jsons()
      var branchFound = false
      var decoratorIds = []
      for (var branchkey in branches) {
        if (branches[branchkey].data.source === nodedata.id || branches[branchkey].data.target === nodedata.id) {
  
          if (branches[branchkey].data.decorator === true) {
  
            // Add the source/destination
            if (branches[branchkey].data.source === nodedata.id) {	
              decoratorIds.push(branches[branchkey].data.target)
            } else {
              decoratorIds.push(branches[branchkey].data.source)
            }
  
            continue
          }
  
          branchFound = true 
          break
        }
      }
  
      if (!branchFound) {
        //console.log("Found action during drag. Checking closest nodes as it doesn't have a valid branch")
        var closestNode = null
        var minDistance = 300 
  
          const draggedNode = event.target
        const allnodes = cy.nodes().jsons()
        for (var nodekey in allnodes) {
          const node = allnodes[nodekey]
          if (node.data.id === nodedata.id) {
            continue
          }
  
          // Decorators
          if (node.data.attachedTo !== undefined) {
            continue
          }
  
          if (node.position === undefined || node.position === null || node.position.x === undefined || node.position.y === undefined) {
            continue
          }
  
          if (node.data.type !== "ACTION" && node.data.type !== "TRIGGER") { 
            continue
          }
  
          const distance = Math.sqrt(
            Math.pow(draggedNode.position('x') - node.position.x, 2) +
            Math.pow(draggedNode.position('y') - node.position.y, 2)
          )
  
          if (decoratorIds.includes(node.data.id)) {
            //console.log("Found existing decorator for: ", node.data.app_name, "Distance: ", distance)
  
            if (distance > 300) {
              // Remove the branch
              const edgeToRemove = cy.getElementById(branches[branchkey].data.id)
              if (edgeToRemove !== null && edgeToRemove !== undefined) {
                //console.log("Removing edge: ", edgeToRemove)
                edgeToRemove.remove()
                //decoratorIds.splice(decoratorIds.indexOf(node.data.id), 1)
                break
              }
            }
          }
  
  
          if (distance < minDistance) {
            minDistance = distance
            closestNode = node
          }
        }
  
        if (closestNode !== null && closestNode !== undefined) {
          //console.log("Closest node app: ", closestNode.data.app_name, "Distance: ", minDistance)
  
          /*
          if (decoratorIds.length > 0) {
            console.log("Decorators already exists. If within distance of 15 add to existing, otherwise remove old and add new: ", decoratorIds)
            for (var decoratorkey in decoratorIds) {
              const decoratorEdge = cy.getElementById(decoratorIds[decoratorkey])
              if (decoratorEdge === null || decoratorEdge === undefined) {
                continue
              }
  
              const sourceNode = cy.getElementById(decoratorEdge.data.source)
              const targetNode = cy.getElementById(decoratorEdge.data.target)
  
              const distance = Math.sqrt(
                Math.pow(draggedNode.position('x') - sourceNode.position('x'), 2) +
                Math.pow(draggedNode.position('y') - sourceNode.position('y'), 2)
              )
  
              // Check plus minus 15 in distance from mindistance
              if (distance > minDistance - 15 && distance < minDistance + 15) {
                console.log("Within distance of 15, add to existing edge")
              } else {
                console.log("Outside distance of 15, remove old edge and add new")
              }
  
            }
          }
          */
  
          if (decoratorIds.length === 0) { 
            //const edgeCurve = calculateEdgeCurve(draggedNode.position(), closestNode.position)
            //currentedge.style('control-point-distance', edgeCurve.distance)
            //currentedge.style('control-point-weight', edgeCurve.weight)
            
            const newId = uuidv4()
            cy.add({
              group: "edges",
              data: {
                decorator: true,
                id: newId,
                _id: newId,
                source: closestNode.data.id,
                target: nodedata.id,
                label: releaseToConnectLabel,
                conditions: [],
              }
            })
          } 
        } 
      }
    }
    
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
          for (var styledElementsKey in styledElements) {
            const curElement = document.getElementById(styledElements[styledElementsKey]);
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
          for (var index in styledElements) {
            const curElement = document.getElementById(styledElements[index]);
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

  	// Should get AI autocompletes
	const aiSubmit = (value, setResponseMsg, setSuggestionLoading, inputAction) => {
		if (setResponseMsg !== undefined) {
			setResponseMsg("")
		}

		if (value === undefined || value === "") {
			console.log("No value input!")
			return
		}

		if (setSuggestionLoading !== undefined) {
			setSuggestionLoading(true)
		}
	
		console.log("Submit conversation with value: ", value);

		// This is to find sample response and parse it as string
		
		var AppContext = []
		var originalParams = []
					
		if (inputAction !== undefined && inputAction !== null) {
			// Reload the data without copying
			inputAction = JSON.parse(JSON.stringify(inputAction))
			originalParams = JSON.parse(JSON.stringify(inputAction.parameters))
			const parents = getParents(inputAction)

			var actionlist = []
			if (parents.length > 1) {
				for (let [key,keyval] in Object.entries(parents)) {
					const item = parents[key];
					if (item.label === "Execution Argument") {
						continue;
					}

					var exampledata = item.example === undefined || item.example === null ? "" : item.example;
					// Find previous execution and their variables
					//exampledata === "" &&
					if (workflowExecutions.length > 0) {
						// Look for the ID
						const found = false;
						for (let [key,keyval] in Object.entries(workflowExecutions)) {
							if (workflowExecutions[key].results === undefined || workflowExecutions[key].results === null) {
								continue;
							}

							var foundResult = workflowExecutions[key].results.find((result) => result.action.id === item.id);
							if (foundResult === undefined || foundResult === null) {
								continue;
							}

							if (foundResult.result !== undefined && foundResult.result !== null) {
								foundResult = foundResult.result
							}

							const valid = validateJson(foundResult, true)
							if (valid.valid) {
								if (valid.result.success === false) {
									//console.log("Skipping success false autocomplete")
								} else {
									exampledata = valid.result;
									break;
								}
							} else {
								exampledata = foundResult;
							}
						}
					}

					// 1. Take
					const itemlabelComplete = item.label === null || item.label === undefined ? "" : item.label.split(" ").join("_");

					const actionvalue = {
						app_name: item.app_name,
						action_name: item.name,
						label: item.label,

						type: "action",
						id: item.id,
						name: item.label,
						autocomplete: itemlabelComplete,
						example: exampledata,
					};

					actionlist.push(actionvalue);
				}
			}

			var fixedResults = []
			for (var i = 0; i < actionlist.length; i++) {
				const item = actionlist[i];
				const responseFix = SetJsonDotnotation(item.example, "") 
				
				// Check if json
				const validated = validateJson(responseFix)
				var exampledata = responseFix;
				if (validated.valid) {
					exampledata = JSON.stringify(validated.result)
				}

				AppContext.push({
					"app_name": item.app_name,
					"action_name": item.action_name,
					"label": item.label,
					"example": exampledata,
					//"example_response": exampledata,
				})
			}

			var params = []
			for (var paramkey in inputAction.parameters) {
				const param = inputAction.parameters[paramkey]
				if (param.configuration) {
					continue
				}

				// Mainly for booleans
				if (param.options !== undefined && param.options !== null && param.options.length > 0) {
					continue
				}

				params.push(param)
			}

			inputAction.parameters = params
		}

		var conversationData = {
			"query": value,
			"output_format": "action",
			"app_context": AppContext,

			"workflow_id": workflow.id,
		}


		if (inputAction !== undefined) {
			console.log("Add app context! This should them get parameters directly")
			conversationData.output_format = "action_parameters"

			conversationData.app_id = inputAction.app_id
			conversationData.app_name = inputAction.app_name
			conversationData.action_name = inputAction.name
			conversationData.parameters = inputAction.parameters
		}

		// Onprem not available yet (April 2023)
		// Should: Make OpenAI work for them with their own key
		//fetch(`${globalUrl}/api/v1/conversation`, {
		const url = `${globalUrl}/api/v1/conversation`
		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(conversationData),
			credentials: "include",
		})
		.then((response) => {
		    setAiQueryModalOpen(false)
  			setAutocompleting(false)
			if (setSuggestionLoading !== undefined) {
				setSuggestionLoading(false)
			}

			if (response.status !== 200) {
				console.log("Status not 200 for stream results :O!");
			} else {
				toast("Completion finished. Please verify your action!")
			}

			return response.json();
		})
		.then((responseJson) => {
			console.log("Conversation response: ", responseJson)
			if (responseJson.success === false) {
				if (responseJson.reason !== undefined) {
					if (setResponseMsg !== undefined) {
						setResponseMsg(responseJson.reason)
					}
				}

				return
			}

			if (inputAction !== undefined) {
				console.log("In input action! Should check params if they match, and add suggestions")

				if (responseJson.parameters === undefined || responseJson.parameters.length === 0) {
					return
				}

				var changed = false
				for (let respParamKey in responseJson.parameters) {
					var respParam = responseJson.parameters[respParamKey]
					if (respParam.value === undefined || respParam.value === null || respParam.value === "" ) {
						continue
					}

					for (let paramkey in originalParams) {
						const actionParam = originalParams[paramkey]
						/*
						if (actionParam.value !== "" && actionParam.value !== actionParam.example) {
							console.log("Skipping: ", actionParam)
							continue
						}
						*/

						if (respParam.name !== actionParam.name) {
							continue
						}

						const codeeditor = document.getElementById("shuffle-codeeditor")
						if (codeeditor !== undefined && codeeditor !== null) {
							const editorInstance = window?.ace?.edit("shuffle-codeeditor")
							if (editorInstance === undefined || editorInstance === null) {
								toast.error("Failed to find code editor instance")
								return
							} else {
								editorInstance.setValue(respParam.value)
								originalParams[paramkey].autocompleted = true
								changed = true
							}
						}

						if (!changed) {
							console.log("Found match for param: ", respParam)
							changed = true
							originalParams[paramkey].autocompleted = true
							originalParams[paramkey].value = respParam.value
						}

						break
					}
				}

				if (changed === true) {
					inputAction.parameters = originalParams
					console.log("Setting action! Force update pls :)")
					setUpdate(Math.random())

					setSelectedAction(inputAction)

					// Find it in cytoscape and update the action 
					if (cy !== undefined && cy !== null) {
						const cyAction = cy.getElementById(inputAction.id)
						if (cyAction !== undefined && cyAction !== null) {
							cyAction.data("parameters", inputAction.parameters)
						}
					}

				}

				return
			}

			// Add action
			console.log("Suggestionbox location: ", suggestionBox)
			if (responseJson.app_name !== undefined && responseJson.app_name !== null) {
				// Always added to 0, 0
				// Should use suggestionBox.position.x, suggestionBox.position.y
				var newitem = {
					"data": responseJson,
					"position": {
						"x": suggestionBox.node_position.x !== undefined ? suggestionBox.node_position.x : 0,
						"y": suggestionBox.node_position.y !== undefined ? suggestionBox.node_position.y + 100 : 0,
					},
					"group": "nodes",
				}

				newitem.type = "ACTION"
				newitem.isStartNode = false
				newitem.data.id = uuidv4()
				newitem.data.type = "ACTION"
				newitem.data.isStartNode = false

				newitem.data.is_valid = true
				newitem.data.isValid = true

				cy.add({
					group: 	newitem.group,
					data: 	newitem.data,
					position: newitem.position,
				});

				// Add edge
				const newId = uuidv4()
				cy.add({
					group: "edges",
					data: {
						id: newId,
						_id: newId,
						source: suggestionBox.attachedTo,
						target: newitem.data.id,
					}
				})
				//label: "Generated",
		
				setSuggestionBox({
					"position": {
						"top": 500,
						"left": 500,
					},
					"open": false,
					"attachedTo": "",
				});
			}
		})
		.catch((error) => {
		    setAiQueryModalOpen(false)
  			setAutocompleting(false)
			if (setSuggestionLoading !== undefined) {
				setSuggestionLoading(false)
			}

			console.log("Conv response error: ", error);
		});
	}



  // Nodeselectbatching:
  // https://stackoverflow.com/questions/16677856/cy-onselect-callback-only-once
  // onNodeClick
  const onNodeSelect = (event, newAppAuth) => {
    // Forces all states to update at the same time,
	// Otherwise everything is SUPER slow
    
	//const data = JSON.parse(JSON.stringify(event.target.data()))
    const data = event.target.data()

    if (data.app_name === "Shuffle Workflow") {
      if ((data.parameters !== undefined) && (data.parameters.length > 0)) {
        getWorkflowApps(data.parameters[0].value)
      }
    }

	if (data.buttonType == "ACTIONSUGGESTION") {
  	  const attachedToId = data.attachedTo

	  const parentitemRaw = cy.getElementById(data.attachedTo)
	  const parentitem = parentitemRaw.data()
	  if (parentitem !== null && parentitem !== undefined) {
		  setTimeout(() => {
		  	parentitemRaw.select()

			const allNodes = cy.nodes().jsons()
		    for (var _key in allNodes) {
		  		const currentNode = allNodes[_key]

        		if (currentNode.data.buttonType === "ACTIONSUGGESTION") {
          			cy.getElementById(currentNode.data.id).remove()
				}
			}
		  }, 100)

		  const findaction = data.label
		  console.log("CLICKED: ", findaction, apps.length)

		  for (let appkey in apps) {
			  const curapp = apps[appkey]
			  if (curapp.name !== parentitem.app_name) {
				  continue
			  }

			  if (curapp.actions === undefined || curapp.actions === null) {
				  continue
			  }

			  for (let actionkey in curapp.actions) {
				  const curaction = curapp.actions[actionkey]

			  	  if (curaction.category_label !== undefined && curaction.category_label !== null && curaction.category_label.length > 0) { 
					  if (curaction.category_label[0].toLowerCase() === findaction.toLowerCase()) {
						  console.log("FOUND: ", curaction)

						  // Update the action itself
						  // Find the action index, and update:
						  // - label 
						  // - description
						  // - parameters
						  // - name
					  
						  var foundindex = -1
						  for (let wfactionkey in workflow.actions) {
							  const wfaction = workflow.actions[wfactionkey]
							  if (wfaction.id === data.attachedTo) {
								  foundindex = wfactionkey
								  break
							  }
						  }

						  console.log("Updating action: ", foundindex, findaction)
						  if (foundindex >= 0) {
							  workflow.actions[foundindex].label = findaction
							  workflow.actions[foundindex].description = curaction.description
							  workflow.actions[foundindex].parameters = curaction.parameters
							  workflow.actions[foundindex].name = curaction.name

							  setWorkflow(workflow)
                console.log(workflow)
						  }
						  break
					  }
				  }
			  }

			  break
		  }

		  return
	  }

	} else if (data.isSuggestion === true) {
	  console.log("Suggestion! Replace with a real action.")
  
  	  const attachedToId = data.attachedTo
  	  //event.target.data("attachedTo", "")
  
  	  const allNodes = cy.nodes().jsons();
  	  for (var _key in allNodes) {
  		const currentNode = allNodes[_key];
  		// console.log("CURRENT NODE: ", currentNode)
  		if ((currentNode.data.isButton || currentNode.data.isSuggestion) && currentNode.data.attachedTo !== data.id) {
  			cy.getElementById(currentNode.data.id).remove();
  		}
  	  }
  
  
  	  // Add relevant fields for the action and connect it to the parent (attachedTo)
  	  //event.target.data("attachedTo", "")
  	  // Decides directionality
  	  //
  	  const isTarget = event.target.data("isTarget")
  	  const target = isTarget ? data.id : attachedToId
  	  const source = isTarget ? attachedToId : data.id
  	  const newId = uuidv4()

	  // Add a new node
	  const newAction = {
		...data,
	  }

      newAction.attachedTo = ""
	  newAction.isSuggestion = false
	  newAction.finished = true
	  newAction.isButton = false
	  newAction.private_id = ""
	  newAction.type = "ACTION"
	  if (newAction.app_name === "Shuffle Subflow") {
		  newAction.type = "TRIGGER"
		  newAction.trigger_type = "SUBFLOW"
	  } else {
		  newAction.decorator = false
		  newAction.suggested = true
	  }

	  newAction.label = data.label
	  newAction.id = uuidv4()
	  // Find the app and add params?

	  cy.add({
		group: "nodes",
		data: newAction,
		position: {
			x: event.target.position().x,
			y: event.target.position().y,
		},
	  })

	  toast("Suggestion added!")
	  setTimeout(() => {
		  const newBranch = {
		  	source: source,
		  	target: newAction.id,
		  	_id: newId,
		  	id: newId,
		  	decorator: false, 
		  	finished: true, 
		  }

		  cy.add({
			group: "edges",
			data: newBranch,
		  })
	  
		  setWorkflowRecommendations(undefined)

		  // Find the new node we added from newAction.id
		  const newActionNode = cy.getElementById(newAction.id)
		  if (newActionNode !== undefined && newActionNode !== null) {
			  newActionNode.select()
		  }
					
		  aiSubmit("Fill based on previous values", undefined, undefined, newAction)
	  }, 1000)
	  return
    }

	ReactDOM.unstable_batchedUpdates(() => {
      if (data.isButton) {
         if (data.buttonType === "suggestion") {
			if (cy === undefined) {
				console.log("Cy not defined yet")
				return
			}

			// Inject HTML at a fixed location?
			//const newHtml = "<div id='suggestion' style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: white; z-index: 1000;'><div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);'><h1>Do you want to add this suggestion?</h1><button id='suggestion_yes'>Yes</button><button id='suggestion_no'>No</button></div></div>"

			// Find mouse cursor position on screen
			console.log("Suggestion html to be added at location: ", event)
			/*
			const position = {
				"top": cy.pan().y, 
				"left": cy.pan().x, 
			}
			*/


			const position = event.target.renderedPosition();
			const container = cy.container();
			const offset = {
			left: container.offsetLeft,
			top: container.offsetTop
			};
			
			// Calculate the actual screen position for the box
			const screenPosition = {
			  left: position.x + offset.left - 150,
			  top: position.y + offset.top,
			};
			
			// Log the position to the console
			console.log('Node screen position:', screenPosition);

			const newbox = {
				"position": screenPosition,
				"node_position": event.target.position(),
				"open": true,
				"attachedTo": data.attachedTo,
			}

			console.log("Rendered position: ", newbox.node_position)

			setSuggestionBox(newbox)

			// Unselect
        	event.target.unselect();
					
        } else if (data.buttonType === "delete") {
          const parentNode = cy.getElementById(data.attachedTo);
          if (parentNode !== null && parentNode !== undefined) {
            removeNode(data.attachedTo)
            //parentNode.remove()
          }

          return
        } else if (data.buttonType === "set_startnode" && data.type !== "TRIGGER") {
		  //console.log("STARTNODE")
		  //event.preventDefault()
		  //event.stopPropagation()

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
          if (parentNode !== null && parentNode !== undefined && parentNode.data() !== undefined && parentNode.data() !== null) {
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

            const sourcebranches = workflow.branches.filter((foundbranch) => foundbranch.source_id === parentNode.data("id"))


            const destinationbranches = workflow.branches.filter((foundbranch) => foundbranch.destination_id === parentNode.data("id"))
            

    	      for (var sourceBranchesKey in sourcebranches) {
    	        var newbranch = JSON.parse(JSON.stringify(sourcebranches[sourceBranchesKey]));

    	        newbranch.id = uuidv4()
    	        newbranch.source_id = newNodeData.id

                newbranch._id = newbranch.id
                newbranch.source = newbranch.source_id
                newbranch.target = newbranch.destination_id
                cy.add({
                  group: "edges",
                  data: newbranch,
                })
            }

    	      for (var destinationBranchesKey in destinationbranches) {
    	        var newbranch = JSON.parse(JSON.stringify(destinationbranches[destinationBranchesKey]))

				const sourcenode = cy.getElementById(newbranch.source_id)
				if (sourcenode !== null && sourcenode !== undefined) {
					const sourcedata = sourcenode.data()

				  	if (sourcedata.trigger_type !== "SUBFLOW" && sourcedata.trigger_type !== "USERINPUT") {
						continue
					}

				}

    	        newbranch.id = uuidv4()
    	        newbranch.destination_id = newNodeData.id

                newbranch._id = newbranch.id
                newbranch.source = newbranch.source_id
                newbranch.target = newbranch.destination_id
                cy.add({
                  group: "edges",
                  data: newbranch,
                })
            }

            //event.target.unselect();
            return
          }
        }

        return;
      } else if (data.isDescriptor) {
		// Find parent
        event.target.unselect();

		if (data.attachedTo !== undefined && data.attachedTo !== null && data.attachedTo.length > 0) {
			const parentNode = cy.getElementById(data.attachedTo)
			if (parentNode !== null && parentNode !== undefined) {
				setTimeout(() => {
					parentNode.select()
				}, 100)
			}
		}

        //console.log("Can't select descriptor");
		if (data.isTrigger) {
			console.log("But maybe we can select trigger descriptor? Maybe open execution tab?")
			setExecutionModalOpen(true)
		}

        return;
      }

		if (data.type === undefined) {
			console.log("No type, automatically setting to action");
			data.type = "ACTION"
		}

      if (data.type === "ACTION") {
        setSelectedComment({})
        //var curaction = JSON.parse(JSON.stringify(data))
        // FIXME: Trust it to just work?
        //event.target.data()
        var curaction = workflow.actions.find((a) => a.id === data.id)
        if (!curaction || curaction === undefined) {
          if (data.id !== undefined && data.app_name !== undefined) {
            workflow.actions.push(data)
            setWorkflow(workflow)
            curaction = data
          } else {
            if (workflow.public !== true) {
              toast("Action not found. Please remake it.");
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

        // Check ID first, then names etc
        // That way it always selects the right IF it exists
        var curapp = newapps.find((a) =>
          a.id === curaction.app_id
        )

        if (curapp === undefined || curapp === null) {
          console.log("Couldn't find app with that ID - checking with name & version")

          curapp = newapps.find((a) =>
            a.name === curaction.app_name &&
            (a.app_version === curaction.app_version ||
              (a.loop_versions !== null &&
                a.loop_versions.includes(curaction.app_version)))
          )
        }

        if (curapp === undefined || curapp === null) {
          curapp = integrationApps.find((a) =>
            a.name === curaction.app_name &&
            (a.app_version === curaction.app_version ||
              (a.loop_versions !== null &&
                a.loop_versions.includes(curaction.app_version)))
          )
		}

        if (curaction.template === true && curaction.name !== undefined) {
          //newapps.
          const parsedname = curaction.name.replaceAll(" ", "_").toLowerCase()
          console.log("FIND AN ACTION AMONG THE APPS THAT MATCHES NAME: ", parsedname)

			curaction.matching_actions = []
			for (var newAppskey in newapps) {
				for (let actionsSubkey in newapps[newAppskey].actions) {
					const tmpaction = newapps[newAppskey].actions[actionsSubkey]
					if (tmpaction.name.replaceAll(" ", "_").toLowerCase() === parsedname) {
						console.log("MATCH!: ", newapps[newAppskey])
						curaction.matching_actions.push({
							"app_name": newapps[newAppskey].name,
							"app_version": newapps[newAppskey].app_version,
							"app_id": newapps[newAppskey].id,
							"action": tmpaction,
							"large_image": newapps[newAppskey].large_image,
							"app_index": newAppskey,
							"action_index": actionsSubkey,
						})
					}
				}
			}
		}

		if (!curapp || curapp === undefined) {
			// Check local storage has it 
			const foundapps = localStorage.getItem("apps")
			if (foundapps !== null && foundapps !== undefined) {
				try {
					const parsedapps = JSON.parse(foundapps)
					if (parsedapps !== null && parsedapps !== undefined && parsedapps.length > 0) {
						for (let appkey in parsedapps) {
							if (parsedapps[appkey].name === curaction.app_name) {
								curapp = parsedapps[appkey]
								break
							}
						}
					}
				} catch (e) {
					console.log("Problem with parsing apps from local storage", e)
				}

			} else {
				console.log("No apps found in local storage")
			}
		}

		/*
		if (curapp && curapp.app_id !== undefined && curapp.app_id !== null && curapp.app_id.length > 0 &&curapp.actions.length <= 1) {
			toast(`Side-loading app ${curapp.name} to get actions.`)
		}
		*/

		if (curapp !== undefined && curapp !== null && curapp.id !== undefined && curapp.id !== null && curapp.id.length > 0) { 
			loadAppConfig(curapp.id, true)
		}

        if (!curapp || curapp === undefined) {
          const tmpapp = {
            name: curaction.app_name,
            app_name: curaction.app_name,
            app_version: curaction.app_version,
            id: curaction.app_id,
            actions: [curaction],
          }

          setSelectedApp(tmpapp)
          setSelectedAction(curaction)
        } else {

          curaction.app_id = curapp.id

		  if (curapp.authentication === undefined || curapp.authentication === null) {
			  setAuthenticationType({
				type: "",
			  })

			  curapp.authentication = {
				  type: "",
				  required: false,
			  }
		  } else {
			  setAuthenticationType(
				curapp.authentication.type === "oauth2-app" || (curapp.authentication.type === "oauth2" && curapp.authentication.redirect_uri !== undefined && curapp.authentication.redirect_uri !== null) ? {
				  type: curapp.authentication.type,
				  redirect_uri: curapp.authentication.redirect_uri,
				  refresh_uri: curapp.authentication.refresh_uri,
				  token_uri: curapp.authentication.token_uri,
				  scope: curapp.authentication.scope,
				  client_id: curapp.authentication.client_id,
				  client_secret: curapp.authentication.client_secret,
				  grant_type: curapp.authentication.grant_type,
				} : {
				  type: "",
				}
			  )
		  }

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

            const tmpAuth = JSON.parse(JSON.stringify(newAppAuth));

			const curappName = curapp.name.toLowerCase()
		    for (let tmpAuthKey in tmpAuth) {
				var item = tmpAuth[tmpAuthKey];

				const newfields = {};
				if (item.app.name.toLowerCase() !== curappName) {
				  continue
				}

				// Makes list into key:value object 
				for (let fieldkey in item.fields) {
					if (item.fields[fieldkey] === undefined) {
						console.log("Problem with filterkey in Node select", fieldkey)
						continue
					}

					const filterkey = item.fields[fieldkey]["key"]
					if (filterkey === null || filterkey === undefined) {
						console.log("Problem with filterkey 2. Null or undefined 3")
						continue
					}

					newfields[filterkey] = item.fields[fieldkey]["value"];
				} 

				item.fields = newfields;
				if (item.app.name.toLowerCase() === curappName) {
				  authenticationOptions.push(item);
				  if (item.id === findAuthId) {
					curaction.selectedAuthentication = item;
				  }
				}
		  }

		  // Find with authenticationOption (authenticationOptions) has the highest .edited time. In this index, set the "last_modified" to true
		  
		    var latesttime = 0
			var latestindex = -1

			for (var i = 0; i < authenticationOptions.length; i++) {
				const authopt = authenticationOptions[i]

				if (authopt.edited > latesttime) {
					latesttime = authopt.edited
					latestindex = i
				}
			}

			if (latestindex !== -1) {
				authenticationOptions[latestindex].last_modified = true
		    }

            curaction.authentication = authenticationOptions
            if (
              curaction.selectedAuthentication === null ||
              curaction.selectedAuthentication === undefined ||
              curaction.selectedAuthentication.length === ""
            ) {
              curaction.selectedAuthentication = {};
            }
          } else {

            curaction.authentication = []
            curaction.authentication_id = "";
            curaction.selectedAuthentication = {};
          }

    	    if (
    	      curaction.parameters !== undefined &&
    	      curaction.parameters !== null &&
    	      curaction.parameters.length > 0
    	    ) {
    	      for (var curActionParamKey in curaction.parameters) {
    	        if (
    	          curaction.parameters[curActionParamKey].options !== undefined &&
    	          curaction.parameters[curActionParamKey].options !== null &&
    	          curaction.parameters[curActionParamKey].options.length > 0 &&
    	          curaction.parameters[curActionParamKey].value === ""
    	        ) {
    	          curaction.parameters[curActionParamKey].value = curaction.parameters[curActionParamKey].options[0];
    	        }
    	      }
    	    } else {
						console.log("Should check APP if it has the same params as ACTION")
						for (let actionKey in curapp.actions) {
							const tmpaction = curapp.actions[actionKey]
							if (tmpaction.name === curaction.name) {
								console.log("Found action - needs change?", tmpaction)
								if (tmpaction.parameters !== undefined && tmpaction.parameters !== null && tmpaction.parameters.length > 0) {
									curaction.parameters = JSON.parse(JSON.stringify(tmpaction.parameters))
								}
								break
							}
						}
					}

					//curaction["authentication"] = []
					//curaction["authentication_id"] = ""
					// Fix parameters that are... Not ideal
					//var paramnames = []
					//var newparams = []
					//for (let paramKey in curaction.parameters) {
					//	console.log("Name: ", curaction.parameters[paramKey].name)
					//	if (paramnames.includes(curaction.parameters[paramKey].name)) {
					//		continue
					//	}

					//	paramnames.push(curaction.parameters[paramKey].name)
					//	newparams.push(curaction.parameters[paramKey])
					//}

					//curaction.parameters = newparams

          setSelectedApp(curapp);
          setSelectedAction(curaction);

          cy.removeListener("drag");
          cy.removeListener("free");
          cy.on("drag", "node", (e) => onNodeDrag(e, curaction));
          cy.on("free", "node", (e) => onNodeDragStop(e, curaction));
        }

        if (environments !== undefined && environments !== null && (typeof environments === "array" || typeof environments === "object")) {
          var parsedenv = environments
          //if (typeof environments === "object") {
          //	parsedenv = [environments]
          //}

          const envs = parsedenv.find((a) => a.Name === curaction.environment);
          var env = environments[defaultEnvironmentIndex]
          if (envs !== undefined && envs !== null) {
            env = envs
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
        )

        if (trigger_index === -1) {
          workflow.triggers.push(data)
          trigger_index = workflow.triggers.length - 1
          setWorkflow(workflow)
        }

        if (data.app_name === "Shuffle Workflow" || data.app_name === "User Input") {

			// Check if public workflow
			if (workflow.public === true) {
				setWorkflows([workflow])
			} else {
				getAvailableWorkflows(trigger_index);
				getSettings();
			}
        } else if (data.app_name === "Webhook") {
          if (workflow.triggers[trigger_index].parameters !== undefined && workflow.triggers[trigger_index].parameters !== null && workflow.triggers[trigger_index].parameters.length > 0) {
            workflow.triggers[trigger_index].parameters[0] = {
              name: "url",
              value: referenceUrl + "webhook_" + workflow.triggers[trigger_index].id,
            };

			if (workflow.triggers[trigger_index].parameters.length < 5) {
				console.log("Adding to webhook params!")
				workflow.triggers[trigger_index].parameters.push({
					name: "await_response",
					value: "v1,"
				})
			}
          }
        } else if (data.app_name === "Pipeline") {

			// Check if environment is set
			if (data.environment === undefined || data.environment === null || data.environment === "" || data.environment.toLowerCase() === "cloud") { 
				for (var envKey in environments) {
					if (environments[envKey].archived === true) {
						continue
					}

					if (environments[envKey].Name.toLowerCase() === "cloud") {
						continue
					}

					workflow.triggers[trigger_index].environment = environments[envKey].Name
					data.environment = environments[envKey].Name
					//setSelectedTrigger(data)
					break
				}
			}
		}

        setTimeout(() => {
			if (trigger_index !== -1) {
				const trigger = workflow.triggers[trigger_index]
				if (trigger !== undefined && trigger !== null) {

					// Autofixer
					if (trigger.trigger_type === "USERINPUT") {
						const relevantparams = [
							"alertinfo",
							"options",
							"type",
							"email",
							"sms",
							"subflow",
						]
						var foundparams = 0
						for (var paramkey in trigger.parameters) {
							if (relevantparams.includes(trigger.parameters[paramkey].name)) {
								foundparams++
							}
						}

						if (foundparams < 6) {
							trigger.parameters = [{
								name: "alertinfo",
            					value: "Do you want to continue the workflow? Start parameters: $exec",
          					},{
            					name: "options",
            					value: "boolean",
          					},
						    {
						      name: "type",
						      value: "subflow",
						    },
						    {
						      name: "email",
						      value: "test@test.com",
						    },
						    {
						      name: "sms",
						      value: "0000000",
						    },
						    {
						      name: "subflow",
						      value: "",
						    }]

							workflow.triggers[trigger_index].parameters = trigger.parameters
						}
					}
				}
			}

			if (allTriggers !== undefined && allTriggers !== null) { 

				// Just checking all three. Could just make a new list, but meh 
				if (allTriggers.pipelines !== undefined && allTriggers.pipelines !== null) {
					for (var pipelineKey in allTriggers.pipelines) {
						if (allTriggers.pipelines[pipelineKey].id === data.id) {
							data.status = allTriggers.pipelines[pipelineKey].status
						}
					}
				}

				if (allTriggers.webhooks !== undefined && allTriggers.webhooks !== null) {
					for (var webhookKey in allTriggers.webhooks) {
						if (allTriggers.webhooks[webhookKey].id === data.id) {
							data.status = allTriggers.webhooks[webhookKey].status
						}
					}
				}

				if (allTriggers.schedules !== undefined && allTriggers.schedules !== null) {
					for (var scheduleKey in allTriggers.schedules) {
						if (allTriggers.schedules[scheduleKey].id === data.id) {
							data.status = allTriggers.schedules[scheduleKey].status
						}
					}
				}
			}

			setSelectedTriggerIndex(trigger_index)
			setSelectedTrigger(data)
			setSelectedActionEnvironment(data.env)
		}, 25)
      } else if (data.type === "COMMENT") {
        setSelectedComment(data);
      } else {
        toast("Can't handle node type " + data.type);
        return;
      }

      setRightSideBarOpen(true);
      //setLastSaved(false);
      setScrollConfig({
        top: 0,
        left: 0,
        selected: "",
      });

	  setSuggestionBox({
	  	"position": {
	  		"top": 500,
	  		"left": 500,
	  	},
	  	"open": false,
	  	"attachedTo": "",
	  });

      sendStreamRequest({
        "item": "node",
        "type": "select",
        "id": data.id,
        "location": {
          "x": event.target.position("x"),
          "y": event.target.position("y"),
        }
      })

    })
  }

  const activateApp = (appid, refresh) => {
    fetch(`${globalUrl}/api/v1/apps/${appid}/activate`, {
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
          toast("Failed to auto-activate the app. Go to /apps and activate it.")
        } else {
          if (refresh === true) {
  			setHighlightedApp(appid)
          	//toast("App activated for your organisation! Refresh the page to use the app.")
            getApps()

          }
        }
      })
      .catch(error => {
        //toast(error.toString())
        console.log("Activate app error: ", error.toString())
      });
  }

  const GetExampleResult = (item) => {
    var exampledata = item.example === undefined ? "" : item.example;
    if (workflowExecutions.length > 0) {
      // Look for the ID
      for (let execkey in workflowExecutions) {
        if (
          workflowExecutions[execkey].results === undefined ||
          workflowExecutions[execkey].results === null
        ) {
          continue;
        }

        var foundResult = { result: "" };
        if (item.id === "exec") {
          if (
            workflowExecutions[execkey].execution_argument !== undefined &&
            workflowExecutions[execkey].execution_argument !== null &&
            workflowExecutions[execkey].execution_argument.length > 0
          ) {
            foundResult.result = workflowExecutions[execkey].execution_argument;
          } else {
            continue;
          }
        } else {
          foundResult = workflowExecutions[execkey].results.find(
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

    //console.log("NOT REPLACING ON PURPOSE!!")
    //return ""

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
        "message id",
        "message_id",
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
      tags: ["tags", "taxonomies"],
    };

    // 1. Find the right synonym
    // 2. Replace with an autocomplete if it exists
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

          for (let [subitem,subitemval] in Object.entries(value)) {
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
          toreturn = `${basekey}.${key}`
          break
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
    for (var dstdataParamKey in dstdata.parameters) {
      const param = dstdata.parameters[dstdataParamKey];
      // Skip authentication params
      if (param.configuration) {
        continue
      }

      if (param.options !== undefined && param.options !== null && param.options.length > 0) {
        continue
      }

      const paramname = param.name.toLowerCase().trim().replaceAll("_", " ");

      const foundresult = GetParamMatch(paramname, exampledata, "");
      if (foundresult.length > 0) {
        if (dstdata.parameters[dstdataParamKey].value.length === 0) {
          dstdata.parameters[dstdataParamKey].value = `$${parentlabel}${foundresult}`;
          dstdata.parameters[dstdataParamKey].autocompleted = true
        }
      }
    }

    var parents = getParents(dstdata);
    if (parents.length > 1) {
      for (let parentkey in parents) {
        const item = parents[parentkey];
        if (item.label === "Execution Argument") {
          continue;
        }

        parentlabel =
          item.label === undefined
            ? ""
            : item.label.toLowerCase().trim().replaceAll(" ", "_");

        exampledata = GetExampleResult(item);
				if (dstdata.parameters !== undefined && dstdata.parameters !== null) {
        	for (let [paramkey,paramkeyval] in Object.entries(dstdata.parameters)) {
        	  const param = dstdata.parameters[paramkey];
        	  // Skip authentication params
        	  if (param.configuration) {
        	    continue
        	  }

        	  if (param.options !== undefined && param.options !== null && param.options.length > 0) {
        	    continue
        	  }

        	  const paramname = param.name
        	    .toLowerCase()
        	    .trim()
        	    .replaceAll("_", " ");

        	  const foundresult = GetParamMatch(paramname, exampledata, "");
        	  if (foundresult.length > 0) {
        	    if (dstdata.parameters[paramkey].value.length === 0) {
        	      dstdata.parameters[paramkey].value = `$${parentlabel}${foundresult}`;
        	      dstdata.parameters[paramkey].autocompleted = true
        	    } else {
        	      //dstdata.parameters[paramkey].value = `$${parentlabel}${foundresult}`;
        	    }
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

    if (edge.source === undefined && edge.target === undefined) {
	  console.log("Edge added without source or target")

      return
    }

    if (edge.readded === true) {
      console.log("Readded edge - stopping")

      event.target.data("readded", false)
      return
    }

    const sourcenode = cy.getElementById(edge.source)
    const destinationnode = cy.getElementById(edge.target)

    if (sourcenode === undefined || sourcenode === null || destinationnode === undefined || destinationnode === null) {
	  console.log("Source or destination node is undefined or null: ", sourcenode, destinationnode)
    } else {
	  if (sourcenode.data("name") === "switch") { 
		event.target.remove()
		return
	  }

      console.log("Edge added: Is it a trigger? If so, check if it already has a branch and remove it: ", sourcenode.data())
      if (sourcenode.data("type") === "TRIGGER") {
        if (sourcenode.data("app_name") !== "Shuffle Workflow" && sourcenode.data("app_name") !== "User Input") {
          setTimeout(() => {
            const alledges = cy.edges().jsons()
            var targetedge = alledges.findIndex(
              (data) => data.data.source === edge.source && data.data.id !== edge.id
            )

            if (targetedge !== -1) {
              event.target.remove()

              //console.log("Found branch already!")
              toast.error("Triggers can have exactly one target node")
              return


              // name: "Shuffle Workflow",
              // name: "User Input",
            } else {
              console.log("Node doesn't already have one")
            }
          }, 50)
        }
      }

      const edgeCurve = calculateEdgeCurve(sourcenode.position(), destinationnode.position())
      const currentedge = cy.getElementById(edge.id)
      if (currentedge !== undefined && currentedge !== null) {
		currentedge.style('control-point-distance', edgeCurve.distance)
		currentedge.style('control-point-weight', edgeCurve.weight)
      }
    }


    var targetnode = workflow.triggers.findIndex(
      (data) => data.id === edge.target
    )
    if (targetnode !== -1) {
      if (workflow.triggers[targetnode].app_name === "User Input" || workflow.triggers[targetnode].app_name === "Shuffle Workflow" || workflow.triggers[targetnode].app_name === "Shuffle Subflow") {
		  console.log("User Input or Shuffle Workflow")
      } else {
        toast("Can't have triggers as target of branch")
        event.target.remove()
      }
    }

    const eventTarget = event.target.target()
    console.log("BUTTON ADDED! Find parent from: ", eventTarget)
    if (eventTarget.data("isButton") === true) {
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

    if (eventTarget.data("isDescriptor") === true || eventTarget.data("type") === "COMMENT") {
      console.log("Removing because of descriptor or comment")
      event.target.remove()
      return
    }

    targetnode = -1;

    // Check if:
    // dest == source && source == dest
    // dest == dest && source == source
    // backend: check all children? to stop recursion
	  //
    var found = false;
    for (let branchkey in workflow.branches) {
      if (workflow.branches[branchkey].destination_id === edge.source && workflow.branches[branchkey].source_id === edge.target) {
        toast("A branch in the opposite direction already exists")
        event.target.remove()
        found = true
        break
      } 

	  if (workflow.branches[branchkey].destination_id === edge.target && workflow.branches[branchkey].source_id === edge.source) {

		console.log("That branch already exists: ", workflow.branches[branchkey])
		const foundbranch = cy.getElementById(workflow.branches[branchkey].id)
		if (foundbranch !== undefined && foundbranch !== null && foundbranch.data() !== undefined && foundbranch.data() !== null) {
			console.log("Removing branch: ", foundbranch.data())

			event.target.remove()

			found = true
			break
		} else {
			console.log("Old branch didn't exist afterall. Remove.")
		}
      } 

	  if (edge.target === workflow.start) {
        targetnode = workflow.triggers.findIndex(
          (data) => data.id === edge.source
        );
        if (targetnode === -1) {
          if (targetnode.type !== "TRIGGER") {
            toast("Can't make arrow to starting node");
            event.target.remove();
            break;
          }

          found = true;
        }
      } 

	  if (edge.source === workflow.branches[branchkey].source_id) {
        // FIXME: Verify multi-target for triggers
        // 1. Check if destination exists
        // 2. Check if source is a trigger
        // targetnode = workflow.triggers.findIndex(data => data.id === edge.source)
        // console.log("Destination: ", edge.target)
        // console.log("CHECK SOURCE IF ITS A TRIGGER: ", targetnode)
        // if (targetnode !== -1) {
        // 	toast("Triggers can only target one target (startnode)")
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
          if (workflow.triggers[targetnode].app_name === "User Input" || workflow.triggers[targetnode].app_name === "Shuffle Workflow") {
          } else {
            toast("Can't have triggers as target of branch")
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
      //console.log("DST Autocompleter: ", dstdata);
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

    //if (Object.keys(nodedata).length === 1) {
    //  console.log("Check if another node actually exists before adding")
    //}

    if (nodedata.finished === false || (nodedata.id !== undefined && nodedata.is_valid === undefined)
    ) {
      //if (nodedata.app_id === undefined) {
      //console.log("Returning because node is not valid: ", nodedata)
      return;
    }

	// Check for recommendations when a new action is added 
	// if (isLoaded === true && firstrequest === false) {
	// 	fetchRecommendations(workflow) 
	// }


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
      for (let actionkey in workflow.actions) {
        const action = workflow.actions[actionkey];
        if (action.isStartNode && workflow.start !== action.id) {
          action.isStartNode = false;
        }
      }
    }

	if (nodedata.decorator !== true && nodedata.attachedTo === undefined) {
		var newdata = JSON.parse(JSON.stringify(nodedata))
		newdata.large_image = "" 
		sendStreamRequest({
		  "item": "node",
		  "type": "add",
		  "id": nodedata.id,
		  "data": nodedata,
		  "x": node.position("x"),
		  "y": node.position("y"),
		})
	}

    if (nodedata.type === "ACTION") {
		// Should get recommendations to load in for all nodesma

      /*
      var curaction = workflow.actions.find((a) => a.id === nodedata.id);
      if (curaction === null || curaction === undefined) {
        toast("Node not found. Please remake it.")
        event.target.remove();
      }
      */
      if (workflow.actions.length === 1 && workflow.actions[0].id === workflow.start) {
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

        for (let [subkey,subkeyval] in Object.entries(nodedata.parameters)) {
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

	  // 1. Check how many actions there are. If less than three, send a toast notification with suggested workflows 
	  //if (workflow.actions.length < 3) {
	  //    toast("Recommendations to show??")
	  //}

      setWorkflow(workflow);
  	  fetchRecommendations(workflow)
    } else if (nodedata.type === "TRIGGER") {
      if (nodedata.is_valid === false) {
        toast("This trigger is not available to you");
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

	  if (edgeToBeAdded.data.source !== edgeToBeAdded.data.target && edgeToBeAdded.data.source !== undefined && edgeToBeAdded.data.target !== undefined) {
		  if (nodedata.name !== "User Input" && nodedata.name !== "Shuffle Workflow") {
		    console.log("NAME: ", nodedata.name)
			if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
				console.log("Edge handle: ", edgeToBeAdded)
				cy.add(edgeToBeAdded);
			}
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

    // Check if the source is trigger and can start
    //console.log("Removed: ", edge.data())
    const allNodes = cy.nodes().jsons()
		for (let nodekey in allNodes) {
			const curnode = allNodes[nodekey]
			if (curnode.data.type !== "TRIGGER") {
				continue
			}

			  if (curnode.data.id === edge.data("source")) {
				console.log("Found matching trigger source: ", curnode)
				if (curnode.data.app_name !== "Shuffle Workflow" && curnode.data.app_name !== "User Input") {


				  // If it's started, READD the edge
				  if (curnode.data.status === "running") {
					//console.log("Edge is running - readd it: ", edge.data())

					// Just making sure it's not running infinitely
					var newdata = edge.data()
					newdata.readded = true

					try {
					  cy.add({
						group: "edges",
						data: newdata,
					  })

					  //toast.error("You must STOP the trigger before deleting its branches")
					  console.log("You must STOP the trigger before deleting its branches")
					} catch (e) {
					  console.log("Failed re-adding edge: ", e)
					}
				  }

				  //status: "uninitialized",
				}
			  }
		}

    workflow.branches = workflow.branches.filter(
      (a) => a.id !== edge.data().id
    );

    setWorkflow(workflow);
    event.target.remove();

    // trigger as source check
    const indexcheck = workflow.triggers.findIndex(
      (data) => edge.data("source") === data.id
    );
    if (indexcheck !== -1) {
      console.log("Shouldnt remove edge from trigger? ");
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

	// FIXME: This is still a bit buggy
	if (data.decorator !== true && data.attachedTo === undefined) {
		sendStreamRequest({
		  "item": "node",
		  "type": "remove",
		  "id": data.id,
		})
	}

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
      for (let allNodesKey in allNodes) {
        const currentNode = allNodes[allNodesKey];
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
  }

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
                  toast("Can only copy over HTTPS (port 3443)");
                  return;
                }

                navigator.clipboard.writeText(JSON.stringify(cydata));
                copyText.select();
                copyText.setSelectionRange(0, 99999); /* For mobile devices */
                document.execCommand("copy");
                toast(`Copied ${cydata.length} element(s)`);
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
            toast("Can only use cliboard over HTTPS (port 3443)")
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
      var parsedjson = JSON.parse(clipboard);
			// Check if array
			if (!Array.isArray(parsedjson)) {
				console.log("Not array! Adding to array.")
				parsedjson = [parsedjson]
			}

      for (let jsonkey in parsedjson) {
        var item = parsedjson[jsonkey];
        console.log("Adding: ", item);

				if (item.data === undefined || item.data === null) {
					console.log("Appending from here")
					const newitem = {
						"data": item,
						"position": {
							"x": 0,
							"y": 0
						},
						"group": "nodes",
					}

					item = newitem
					item.type = "ACTION"
					item.isStartNode = false
					item.data.type = "ACTION"
					item.data.isStartNode = false
				}

				item.data.id = uuidv4()

        cy.add({
          group: item.group,
          data: item.data,
          position: item.position,
        });
      }
    } catch (e) {
      console.log("Error pasting: ", e);
      //toast("Failed parsing clipboard: ", e)
    }
  };

  const registerKeys = () => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);
  };

  const getEnvironments = (orgId) => {
	var headers = {
		"Content-Type": "application/json",
		"Accept": "application/json",
	}

	if (orgId !== undefined && orgId !== null && orgId.length > 0) {
		headers["Org-Id"] = orgId
	}

    fetch(globalUrl + "/api/v1/getenvironments", {
      method: "GET",
      headers: headers,
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
        for (let jsonkey in responseJson) {
          if (responseJson[jsonkey].default && !found) {
            setDefaultEnvironmentIndex(jsonkey);
            found = true;
          }

          if (responseJson[jsonkey].archived === false) {
            showEnvCnt += 1;
          }
        }

        if (showEnvCnt > 1) {
          setShowEnvironment(true);
        }

        if (!found) {
          for (let jsonkey in responseJson) {
            if (!responseJson[jsonkey].archived) {
              setDefaultEnvironmentIndex(jsonkey);
              break;
            }
          }
        }

        // FIXME: Don't allow multiple in cloud yet. Cloud -> Onprem isn't stable.
        if (isCloud) {
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
        //toast(error.toString());
        console.log("Get environments error: ", error.toString());
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

	// Check if 
	if (distributedFromParent === "" && suborgWorkflows === []) {
		toast.info("Redirecting as the workflow ID does not match the URL")

		setTimeout(() => {	
			window.location.pathname = "/workflows/" + props.match.params.key;
		}, 2500)
	}
  }

  const animationDuration = 150;
  const onNodeHoverOut = (event) => {
    const nodedata = event.target.data();

    const cytoscapeElement = document.getElementById("cytoscape_view")
    if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
      cytoscapeElement.style.cursor = "default"
    }

	if (nodedata.finished === false) {

	  // Should just be 1, so this should be fast enough :3
	  const incomingEdges = event.target.incomers("edge").jsons()
	  if (incomingEdges !== undefined && incomingEdges !== null) {
		  for (var i = 0; i < incomingEdges.length; i++) {
			  // Find the actual edge
			  const edge = cy.getElementById(incomingEdges[i].data.id)
			  if (edge === undefined || edge === null) {
				  console.log("edge is null or undefined")
				  continue
			  }

			  // Set the edge to be dashed
			  edge.style("target-arrow-color", "#555555")
			  edge.style("line-style", "dashed")
			  edge.style("line-gradient-stop-colors", ["#555555", "#555555"])
		  }
	  }

      return
    }

    if (nodedata.name === "switch") { 
		return
	}

    // console.log("nodedata", nodedata);
    // console.log("nodedata.app_name: ", nodedata.app_name);
    if (nodedata.app_name !== undefined) {
      
      const allNodes = cy.nodes().jsons();
      // console.log("allNodes: ", allNodes)
      for (var nodekey in allNodes) {
        const currentNode = allNodes[nodekey];
        // console.log("Current node: ", currentNode);
        if (currentNode.data.isButton && currentNode.data.attachedTo !== nodedata.id) {

		  if (currentNode.data.buttonType === "condition-drag") {
			continue
		  }

          cy.getElementById(currentNode.data.id).remove();
        }

      }
    }


    // Skipping node editing if it's the selected one
    if (cy !== undefined) {
      const typeIds = cy.elements('node:selected').jsons();
      for (var idkey in typeIds) {
        const item = typeIds[idkey]
        if (item.data.id === nodedata.id) {
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

  const addRunCountButton = (event) => {
		// Count executions?
		// Maybe it shouldn't be onclick?
	}

  const addConditionDraggers = (event, allElements, branches) => {
	  const nodedata = event.target.data()
	  const position = event.target.position()

	  var conditions = []
	  const foundParam = nodedata.parameters.find((param) => param.name.toLowerCase() === "conditions")

	  try {
		  conditions = JSON.parse(foundParam.value)
	  } catch (e) {
		  //toast("Failed parsing conditions: ", e)
	  }

	  // Test conditions 
	  if (conditions === undefined || conditions === null || typeof conditions !== "object") {
		  return
	  }

	  // Look for if it has the "Else" condition or not
	  const elseindex = conditions.findIndex((condition) => condition.name.toLowerCase() === "else") 
	  const parentId = nodedata.id

	  // Force following of Else at the least
	  const newId = uuidv5(parentId, uuidv5.URL)
	  if (elseindex === -1) {
		  conditions.push({
			  name: "Else",
			  check: "Else",
			  id: newId,
			  parent_source: parentId,
		  })
	  } else {
		  conditions[elseindex].id = newId
	  }

	  // 4 conditions (with else) = 300px -> 75px each
	  const parentHeight = (conditions.length*75)*0.75


	  var startheight = -parentHeight/2
	  var newnodes = []
	  for (let conditionkey in conditions) {
		  var circleId = conditions[conditionkey].id === undefined ? (newNodeId = uuidv4()) : conditions[conditionkey].id

		  // Check if circleId is a valid uuid or not
		  if (circleId === undefined || circleId === null) { 
			  circleId = uuidv4()
		  } 

		  if (!isUUID(circleId)) {
			  if (conditions[circleId].name !== undefined && conditions[circleId].name !== null) {
				circleId = uuidv5(conditions[circleId].name, uuidv5.URL)
			  } else {
				circleId = uuidv4()
				conditions[conditionkey].name = circleId
				conditions[conditionkey].id = circleId
			  }
		  }

		  // Check if circleId already exists as a node
		  if (cy !== undefined && cy !== null) {
			  const existingNode = cy.getElementById(circleId)
			  if (existingNode !== undefined && existingNode !== null && existingNode.length > 0) {
				  continue
			  }
		  }

		  // 1. Create "small" nodes at each point along the section based on the amount of conditions
		  // 2. Make these conditions have edgehandles
		  // 3. Make these conditions have a "drag" handle
		  const px = position.x + 65
		  const py = position.y + startheight

		  console.log("Y height: ", startheight)

		  const node = {
				group: "nodes",
				data: {
				  name: conditions[conditionkey].name,
				  id: circleId,
				  buttonType: "condition-drag",
				  attachedTo: nodedata.id,
				  is_valid: true,
				},
				position: { 
					x: px, 
					y: py,
				},
				locked: true,
		  }

		  newnodes.push(node)

		  // Check if ANY of the incoming branches has the id as source
		  if (branches !== undefined && branches !== null && branches.length > 0) {
		  	for (let branchkey in branches) {
				const branch = branches[branchkey]
				if (branch.source_id !== circleId) {
					continue
				}

				const branchid = uuidv4()
				newnodes.push({
					group: "edges",
					data: {
						id: branchid,
						_id: branchid,

						source: circleId,
						target: branch.destination_id,
						label: branch.label,
						conditions: branch.conditions,
						hasErrors: branch.has_errors,
						decorator: false,
			  			parent_source: parentId,
					}
				})
			}
		  }

		  startheight = startheight + parentHeight/(conditions.length-1)
	  }

	  if (cy !== undefined && cy !== null) {
		  cy.add(newnodes)
	  } else {
		  var newelements = elements
		  if (allElements !== undefined) {
			  newelements = allElements
		  }

		  for (let nodekey in newnodes) {
			  newelements.push(newnodes[nodekey])
		  }

		  console.log("ELEMENTS: ", newelements)
		  setElements(newelements)
	  }
  }

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

  const addActionSuggestions = (nodedata, event) => {
	  if (nodedata.type !== "ACTION") {
		  return
	  }

	  var parentNode = cy.$("#" + event.target.data("id"))
	  if (parentNode.data("isButton") || parentNode.data("buttonId")) {
		  return
	  }

	  const px = parentNode.position("x") + 0;
	  const py = parentNode.position("y") + 100;

	  const parentlabel = parentNode.data("label")?.toLowerCase().replace(" ", "_")
	  const parentname = parentNode.data("app_name")?.toLowerCase().replace(" ", "_")
	  if (!parentlabel?.startsWith(parentname)+"_") {
		  return
	  }

	  // Check if action has changed
	  const parentAppId = parentNode.data("app_id")
	  const parentActionname = parentNode.data("name")
	  for (var appkey in apps) {
		  const curapp = apps[appkey]

		  if (curapp.id !== parentAppId) {
			  continue
		  }

		  if (curapp.actions === undefined || curapp.actions === null || curapp.actions.length === 0) {
			  continue
		  }

		  var startIndex = curapp.actions.findIndex((action) => action.category_label !== undefined && action.category_label !== null && action.category_label.length > 0)
		  if (startIndex === -1) {
			  startIndex = 0
		  }

		  if (curapp.actions[startIndex].name !== parentActionname) {
		  	  console.log("Return 2")
			  return
		  }

		  break
	  }

	  console.log("CONTINUE EVEN WHEN FIELDS ARE FILLED")

      const iconInfo = {
        icon: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4l6 6v10c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h7zm-1 7h5.5L14 6.5V12z",
        iconColor: buttonColor,
        iconBackgroundColor: buttonBackgroundColor,
      };

      const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
      const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

	  // 1. Find the app
	  // 2. Loop the apps' actions
	  // 3. Find actions based on category label IF it exists
		  
	  var addedLabels = []
	  for (let appKey in apps) {
		  const curapp = apps[appKey]
		  if (curapp.name.toLowerCase().replace(" ", "_") !== parentname) {
			  continue
		  }

		  if (curapp.actions === undefined || curapp.actions === null || curapp.actions.length === 0) {
			  continue
		  }

		  for (let actionKey in curapp.actions) {
			  const curaction = curapp.actions[actionKey]
			  
			  // Check if this is the current action already
			  if (parentNode.data("name") == curaction.name) {
				  continue
			  }

			  if (curaction.category_label !== undefined && curaction.category_label !== null && curaction.category_label.length > 0) { 
				  if (addedLabels.includes(curaction.category_label[0])) {
					  continue
				  }

				  if (curaction.category_label[0].replaceAll("_", " ").toLowerCase() === "no label") {
					  continue
				  }

				  cy.add({
					group: "nodes",
					data: {
						weight: 30,
						id: uuidv4(),
						label: curaction.category_label[0],
						attachedTo: event.target.data("id"),
						is_valid: true,
						buttonType: "ACTIONSUGGESTION",
					},
					position: {
						x: px,
						y: py + (addedLabels.length * 50),
					},
      				locked: true,
				  })

				  addedLabels.push(curaction.category_label[0])
				  if (addedLabels.length >= 2) {
					  break
				  }
			  }
		  }

		  break
	  }
  }

  const addSuggestionButtons = (nodedata, event) => {
	  //console.log("Skipping Adding suggestion buttons")
	  //return
	// Skipping add for now. Should Re-enable

	// Add a button for autocompletion based on input
	if (nodedata.type === "ACTION") {
		/*
		const color = "#34a853" 

		// Fix icon
		const iconInfo = {
		  icon: "M7.5 5.6 10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.9959.9959 0 0 0-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zm-1.03 5.49-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z",
		  iconColor: buttonColor,
		  iconBackgroundColor: buttonBackgroundColor,
		};

		const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
		const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);

		const decoratorNode = {
			position: {
				x: event.target.position().x + 0,
				y: event.target.position().y + 65,
			},
			locked: true,
			data: {
				isButton: true,
				isValid: true,
				is_valid: true,
				//label: "+",
				attachedTo: nodedata.id,
				imageColor: color,
				buttonType: "suggestion", 
				icon: svgpin_Url,
				iconBackground: iconInfo.iconBackgroundColor,
			},
		};

		cy.add(decoratorNode);
		*/
	}

	if (workflowRecommendations === undefined || workflowRecommendations === null || workflowRecommendations.length === 0) {
		return
	}

	var parentNode = cy.$("#" + event.target.data("id"));
	if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

		const px = parentNode.position("x") + 0;
		const py = parentNode.position("y") + 200;
		const circleId = (newNodeId = uuidv4());

		parentNode.data("circleId", circleId);

		var startHeight = 0
		for (let recKey in workflowRecommendations) {
			const rec = workflowRecommendations[recKey]
			if (rec.action_id !== nodedata.id) {
				continue
			}

			if (rec.recommendations === undefined || rec.recommendations === null || rec.recommendations.length === 0) {
				continue
			}

			for (let recIndex in rec.recommendations) {
				const parsedRec = rec.recommendations[recIndex]
				console.log("REC: ", parsedRec)

				const foundVersion = parsedRec.app_version !== undefined && parsedRec.app_version !== null && parsedRec.app_version !== "" ? parsedRec.app_version : "1.1.0"
				const foundApp = apps.find((app) => app.app_name === parsedRec.app_name && app.app_version === foundVersion)
				// Find out if foundApp is shuffle tools, and if so, add the correct image based on name

				const largeImage = parsedRec.large_image !== undefined && parsedRec.large_image !== null && parsedRec.large_image !== "" ? parsedRec.large_image : foundApp === undefined || foundApp === null ? theme.palette.defaultImage : foundApp.large_image

				const uuid = uuidv4()
			    const attachedToId = event.target.data("id")
				// Check if parsedRec.app_action exists already as a node under this one
				const branches = cy.edges().jsons()
				var found = false
				for (let branchKey in branches) {
					const branch = branches[branchKey]
					if (branch.data.source !== attachedToId) {
						continue
					}

					const targetNode = cy.getElementById(branch.data.target)
					if (targetNode === undefined || targetNode === null) {
						continue
					}

					if (targetNode.data("name") === parsedRec.app_action) {
						console.log("Found existing node (action name): ", targetNode)
						found = true 
					}

					// FIXME: This could potentially be removed
					if (targetNode.data("app_id") === parsedRec.app_id) {
						console.log("Found existing node (id): ", targetNode)
						found = true
					}
				}

				// Skip the suggestion if it already exists
				if (found) {
					continue
				}

				// Checks for src/dst (e.g. trigger = src usually)
				const isTarget = true 

				var name = parsedRec.app_action
				if (parsedRec.app_action === "subflow") {
					name = "Shuffle Workflow"
				} else if (parsedRec.app_action === "user_input") {
					name = "User Input"
				}

				const newaction = {
          		  name: name,
				  label: parsedRec.app_action,
				  label_replaced: parsedRec.app_action.replace("_", " ", -1),

				  id: uuid,
				  app_name: parsedRec.app_name,
				  app_version: foundVersion,
				  app_id: parsedRec.app_id,
				  sharing: false,
				  private_id: "",
				  isStartNode: false,
				  large_image: largeImage,
				  is_valid: true,
				  isSuggestion: true,
				  isTarget: isTarget,
				  attachedTo: attachedToId,

				  finished: false,
				}

				cy.add({
				  group: "nodes",
				  data: newaction,
				  position: { 
					x: px+startHeight, 
					y: py,
				  },
				  locked: true,
				});

				cy.add({
					group: "edges",
					data: {
						source: event.target.data("id"),
						target: uuid,
						decorator: true,
					}
				})

				startHeight += 100
			}

			console.log("Got Rec: ", rec)
			break
		}
  }

  const addDeleteButton2 = (event) => {
    var parentNode = cy.$("#" + event.target.data("id"));
    if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    const px = parentNode.position("x") + 100;
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
        name: "This is autocomplete",
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

    const cytoscapeElement = document.getElementById("cytoscape_view")
    if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
      cytoscapeElement.style.cursor = "pointer"
    }

    sendStreamRequest({
      "item": "node",
      "type": "hover",
      "id": nodedata.id,
    })

    if (nodedata.finished === false) {
      console.log("NODE UNFINISHED (hover in): ", nodedata)

	  // Should just be 1, so this should be fast enough :3
	  /*
	  const incomingEdges = event.target.incomers("edge").jsons()
	  if (incomingEdges !== undefined && incomingEdges !== null) {
		  for (var i = 0; i < incomingEdges.length; i++) {
			  // Find the actual edge
			  const edge = cy.getElementById(incomingEdges[i].data.id)
			  if (edge === undefined || edge === null) {
				  console.log("edge is null or undefined")
				  continue
			  }

			  // Set the edge to be dashed
			  edge.style("target-arrow-color", "white")
			  edge.style("line-style", "solid")
			  edge.style("line-gradient-stop-colors", ["white", "white"])
		  }
	  }

      return
	  */
    }



    //var parentNode = cy.$("#" + event.target.data("id"));
    //if (parentNode.data("isButton") || parentNode.data("buttonId")) return;

    if (nodedata.app_name !== undefined && !workflow.public === true) {
		const allNodes = cy.nodes().jsons();

		if (nodedata.app_name === "Webhook" || nodedata.app_name === "Schedule" || nodedata.app_name === "Gmail" || nodedata.app_name === "Office365") {
			var found = false;
			for (let nodekey in allNodes) {
				const currentNode = allNodes[nodekey];
				if (
					currentNode.data.attachedTo === nodedata.id &&
					currentNode.data.isDescriptor
				) {
					found = true;
					break;
				}
			}

			if (!found) {
				// Find how many executions it has 
				var executions = 0
				const matchingExecutions = workflowExecutions.filter((execution => execution.execution_source === nodedata.app_name.toLowerCase()))
				const color = matchingExecutions.length > 0 ? "#34a853" : "#ea4436"
				const decoratorNode = {
					position: {
						x: event.target.position().x + 44,
						y: event.target.position().y + 44,
					},
					locked: true,
					data: {
						isDescriptor: true,
						isValid: true,
						is_valid: true,
						isTrigger: true,
						label: `${matchingExecutions.length}`,
						attachedTo: nodedata.id,
						imageColor: color,
						hasExecutions: true,
					},
				};

				cy.add(decoratorNode)
			}
		}

      var found = false;
      for (var _key in allNodes) {
        const currentNode = allNodes[_key];
        // console.log("CURRENT NODE: ", currentNode)
		
        if ((currentNode.data.buttonType === "ACTIONSUGGESTION" || currentNode.data.isButton || currentNode.data.isSuggestion) && currentNode.data.attachedTo !== nodedata.id) {

		  if (currentNode.data.buttonType === "condition-drag") {
			continue
		  }

          cy.getElementById(currentNode.data.id).remove()
        }

        /*if (
          currentNode.data.isSuggestion &&
          currentNode.data.attachedTo !== nodedata.id
        ) {
          cy.getElementById(currentNode.data.id).remove();
        }*/

        if (currentNode.data.isButton && currentNode.data.attachedTo === nodedata.id) {
            found = true;
        }
      }

	  if (nodedata.name === "switch") { 
		  addConditionDraggers(event)
		  return
	  }

      if (!found) {
        addDeleteButton(event)

        if (nodedata.type === "TRIGGER") {
          if (nodedata.trigger_type === "SUBFLOW" || nodedata.trigger_type === "USERINPUT") {
            addCopyButton(event);
          } else {
			// Check how many executions from the source
			addRunCountButton(event);
		  }
		} else {

		  addCopyButton(event);
		  addStartnodeButton(event);
		}

		// autocomplete
		// right click
		// suggestions
		addActionSuggestions(nodedata, event);

		if (workflow.actions.length < 4) {
			addSuggestionButtons(nodedata, event);
		} else {
			//console.log("Too many actions to suggest (for now)")
		}
	  }
    }

    if (nodedata.name === "switch") { 
		return
	}

    var parsedStyle = {
      "border-width": "7px",
      "border-opacity": ".7",
      "font-size": "25px",
      //"cursor": "pointer",
    }

	if (nodedata.buttonType === "ACTIONSUGGESTION") {
		parsedStyle["font-size"] = "18px"
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

      //if (!event.target.data("isButton") && !event.target.data("buttonId")) {
      //	const px = event.target.position("x") - 0;
      //	const py = event.target.position("y") - 50;
      //	const circleId = (newNodeId = uuidv4());

      //	console.log("Got px, py: ", px, py)
      //	
      //	cy.add({
      //		group: "nodes",
      //		data: {
      //			weight: 30,
      //			id: circleId,
      //			isButton: true,
      //			attachedTo: event.target.data("id"),
      //			buttonType: "edgehandler",
      //			is_valid: true,
      //		},
      //		position: { x: px, y: py },
      //		locked: true,
      //	})
      //}
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
  }

  const onEdgeHoverOut = (event) => {
    if (event === null || event === undefined || event.target === null || event.target === undefined) {
      event.target.removeStyle();
      return;
    }

    const edgeData = event.target.data();
    if (edgeData.decorator === true) {

	  // Defaults
	  event.target.style("target-arrow-color", "#555555")
	  event.target.style("line-style", "dashed")
	  event.target.style("line-gradient-stop-colors", ["#555555", "#555555"])

      return;
    }

    const cytoscapeElement = document.getElementById("cytoscape_view")
    if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
      cytoscapeElement.style.cursor = "default"
    }

    //event.target.removeStyle();
  };

  // This is here to have a proper transition for lines
  const onEdgeHover = (event) => {
    if (event === null || event === undefined || event.target === null || event.target === undefined) {
      return;
    }

    const edgeData = event.target.data();
    if (edgeData.decorator === true) {
	  // Set color of it to white and not stripled
	  event.target.style("target-arrow-color", "white")
	  event.target.style("line-style", "solid")
	  event.target.style("line-gradient-stop-colors", ["white", "white"])

      return;
    }

	// FIXME: Color problem. Do later 
    //sendStreamRequest({
    //  "item": "edge",
    //  "type": "hover",
    //  "id": edgeData.id,
    //})

    const cytoscapeElement = document.getElementById("cytoscape_view")
    if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
      cytoscapeElement.style.cursor = "pointer"
    }

    //const sourcecolor = cy
    //  .getElementById(event.target.data("source"))
    //  .style("border-color");
    //const targetcolor = cy
    //  .getElementById(event.target.data("target"))
    //  .style("border-color");

    ////console.log(sourcecolor, targetcolor)
    //if (
    //  sourcecolor !== null &&
    //  sourcecolor !== undefined &&
    //  targetcolor !== null &&
    //  targetcolor !== undefined && 
    //	!sourcecolor.includes("rgb") &&
    //	!targetcolor.includes("rgb") 
    //) {
    //	console.log(sourcecolor)
    //	console.log(targetcolor)

    //	if (event.target !== null && event.target.value !== null) {
    //		event.target.animate({
    //			style: {
    //				"target-arrow-color": targetcolor,
    //				"line-fill": "linear-gradient",
    //				"line-gradient-stop-colors": [sourcecolor, targetcolor],
    //				"line-gradient-stop-positions": [0, 1],
    //			},
    //			duration: animationDuration,
    //		})
    //	} else {
    //		event.target.animate({
    //			style: {
    //				"target-arrow-color": targetcolor,
    //				"line-fill": "linear-gradient",
    //  			"line-gradient-stop-colors": ["#41dcab", "#41dcab"],
    //				"line-gradient-stop-positions": [0, 1],
    //			},
    //			duration: animationDuration,
    //		})

    //	}
    //}

    if (event.target !== undefined && event.target !== null) {

		// If decorator and hovered
		// Set color to white
			




      //const targetcolor = "#66a8b1"
      //const parsedStyle = {
      //	"width": "10px",
      //	"font-size": "18px",
      //	"target-arrow-color": "#66a8b1",
      //	"color": "#66a8b1",
      //}

      //event.target.addClass("shuffle-hover-highlight");

      //console.log("Style1: ", event.target)
      //console.log("Style: ", event.target.style())

      //event.target.animate(
      //	{
      //		style: parsedStyle,
      //	},
      //	{
      //		duration: animationDuration,
      //	}
      //)
    }
  }

  // Thanks to:
  // Calculates how a branch should curve (it's still weird~)
  // https://codepen.io/guillaumethomas/pen/xxbbBKO
  const calculateEdgeCurve = (sourcenodePosition, destinationnodePosition) => {
    const xParsed = destinationnodePosition.x - sourcenodePosition.x
    const yParsed = destinationnodePosition.y - sourcenodePosition.y

    const z = Math.sqrt(xParsed * xParsed + yParsed * yParsed)
    const costheta = xParsed / z
    const alpha = 0.3
    var controlPointDistance = [-alpha * yParsed * costheta, alpha * yParsed * costheta]
    var controlPointWeight = [alpha, 1 - alpha]

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
		if (isNaN(controlPointDistance[0])) {
			controlPointDistance[0] = 0
		} 
		if (isNaN(controlPointDistance[1])) {
			controlPointDistance[1] = 0
		}

		if (isNaN(controlPointWeight[0])) {
			controlPointWeight[0] = 0
		}
		if (isNaN(controlPointWeight[1])) {
			controlPointWeight[1] = 0
		}

    return {
      "distance": controlPointDistance,
      "weight": controlPointWeight,
    }
  }

  const setupGraph = (inputworkflow) => {
	// Reset cytoscape nodes and branches
	if (cy !== undefined && cy !== null) {
		if (inputworkflow.actions !== undefined && inputworkflow.actions !== null && inputworkflow.actions.length > 0) {
			//cy.remove('*')
		}
	}

	if (inputworkflow.actions === undefined || inputworkflow.actions === null) {
		inputworkflow.actions = []
	}

	if (inputworkflow.branches === undefined || inputworkflow.branches === null) {
		inputworkflow.branches = []
	}

	if (inputworkflow.triggers === undefined || inputworkflow.triggers === null) {
		inputworkflow.triggers = []
	}

	if (inputworkflow.comments === undefined || inputworkflow.comments === null) {
		inputworkflow.comments = []
	}

	if (inputworkflow.visual_branches === undefined || inputworkflow.visual_branches === null) {
		inputworkflow.visual_branches = []
	}

    const actions = inputworkflow.actions.map((action) => {
      const node = {};

      if (!action.isStartNode && action.app_name === "Shuffle Tools") {
        const iconInfo = GetIconInfo(action)
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
      } else if (action.app_name === "Integration Framework") {
		  const iconInfo = GetIconInfo(action)
		  if (iconInfo !== undefined && iconInfo !== null) {
		  	action.fillGradient = iconInfo.fillGradient
		  	action.iconBackground = iconInfo.iconBackgroundColor
		  	action.fillstyle = "linear-gradient"
		  }
	  }

      node.position = action.position;
      node.data = action;

      node.data.id = action["id"];
      node.data._id = action["id"];
      node.data.type = "ACTION";
      node.isStartNode = action["id"] === inputworkflow.start;

      if (inputworkflow.public === true) {
        node.data.is_valid = true
        node.is_valid = true
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

      return node
    })

	// What are these again? Where are they used?
    const decoratorNodes = inputworkflow.actions.map((action) => {
      if (!action.isStartNode) {
        if (action.app_name === "Testing") {
          return null
        } else if (action.app_name === "Shuffle Tools") {
          return null
        } else if (action.app_name === "Integration Framework") {
          return null
        }
      }

	  if (action.id === undefined || action.id === null) {
		  return null
	  }

	  if (action.position === undefined || action.position === null || action.position.x === undefined || action.position.x === null || action.position.y === undefined || action.position.y === null) {
		  return null
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
      }
      return decoratorNode
    })


    const foundtriggers = inputworkflow.triggers.map((trigger) => {
      const node = {};
      node.position = trigger.position;

	  if (trigger.large_image === undefined || trigger.large_image === null || trigger.large_image.length === 0) {

		// Search triggers array for it where the name is matching and set image
		var foundTrigger = triggers.find((t) => t.name === trigger.name)
		if (foundTrigger !== undefined && foundTrigger !== null) {
			console.log("Autofilled missing trigger image")
			trigger.large_image = foundTrigger.large_image
		}
	  }

      node.data = trigger;
      node.data._id = trigger["id"];
      node.data.id = trigger["id"];
      node.data.type = "TRIGGER";

      return node;
    });

    var comments = [];
    if (
      inputworkflow.comments !== undefined &&
      inputworkflow.comments !== null &&
      inputworkflow.comments.length > 0
    ) {
      comments = inputworkflow.comments.map((comment) => {
        const node = {};
        node.position = comment.position;
        node.data = comment;

        node.data._id = comment["id"];
        node.data.type = "COMMENT";

        return node;
      });
    }

    var insertedNodes = [].concat(actions, foundtriggers, decoratorNodes, comments);
    insertedNodes = insertedNodes.filter((node) => node !== null);

    var edges = inputworkflow.branches.map((branch, index) => {
      const edge = {};
      var conditions = inputworkflow.branches[index].conditions;
      if (conditions === undefined || conditions === null) {
        conditions = [];
      }

      var label = "";
      if (conditions.length === 1) {
        label = conditions.length + " condition";
      } else if (conditions.length > 1) {
        label = conditions.length + " conditions";
      }

	  // Verify if branch.source_id and branch.destination_id exists in triggers or actions
	  /*
	  var sourceExists = false;
	  var destinationExists = false;
	  for (var i = 0; i < insertedNodes.length; i++) {
		  console.log("Insertednode: ", insertedNodes[i].data);
		if (insertedNodes[i].data._id === branch.source_id) {
			sourceExists = true;
		} 
		if (insertedNodes[i].data._id === branch.destination_id) {
			destinationExists = true;
		}
	  }

	  if (sourceExists === false || destinationExists === false) {
		  console.log("Couldn't find source node for branch " + branch.id);
		  return null;
	  }
	  */

	  var parentcontrolled = false
	  if (branch.parent_controlled !== undefined && branch.parent_controlled !== null && branch.parent_controlled === true) {
		  parentcontrolled = true
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
		parent_controlled: parentcontrolled,
      }

      // This is an attempt at prettier edges. The numbers are weird to work with.
      // Bezier curves
      //http://manual.graphspace.org/projects/graphspace-python/en/latest/demos/edge-types.html
      var sourcenode = actions.find(node => node.data._id === branch.source_id || node.data.id === branch.source_id)
      var destinationnode = actions.find(node => node.data._id === branch.destination_id || node.data.id === branch.destination_id)

      if (sourcenode === undefined) {
        sourcenode = foundtriggers.find(node => node.data._id === branch.source_id || node.data.id === branch.source_id)
      }

      if (destinationnode === undefined) {
        destinationnode = foundtriggers.find(node => node.data._id === branch.destination_id || node.data.id === branch.destination_id)
      }

      if (sourcenode !== undefined && destinationnode !== undefined && branch.source_id !== branch.destination_id) {
        const edgeCurve = calculateEdgeCurve(sourcenode.position, destinationnode.position)
        edge.style = {
          'control-point-distance': edgeCurve.distance,
          'control-point-weight': edgeCurve.weight,
        }
      } else {
        console.log("FAILED node curve handling")
      }

      return edge;
    });

    if (inputworkflow.visual_branches !== undefined && inputworkflow.visual_branches !== null && inputworkflow.visual_branches.length > 0) {
      const visualedges = inputworkflow.visual_branches.map((branch, index) => {
        const edge = {};

        if (inputworkflow.branches[index] === undefined) {
          return {}
        }

        var conditions = inputworkflow.branches[index].conditions
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
        }

        return edge
      });

      edges = edges.concat(visualedges)
    }


    // Verifies if a branch is valid and skips others
    var newedges = [];
    for (var edgeKey in edges) {
      var item = edges[edgeKey];
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
    setWorkflow(inputworkflow);

	// Reset view for cytoscape
	if (cy !== undefined && cy !== null) {
		cy.add(insertedNodes);
    	cy.fit(null, 200);
	} else {
    	setElements(insertedNodes);
	}

	const additionalNodes = inputworkflow.actions.map((action) => {
		// Looking for: el.data("name") != "switch" 
		if (action.name !== "switch") {
			return null
		}

		addConditionDraggers({
				target: {
					// Run data() function
					data: function() {
						return action
					},
					position: function() {
						return action.position
					}
				}
			},
			insertedNodes,	
			inputworkflow.branches,
		)
	})
  }

  const removeNode = (nodeId) => {
    const selectedNode = cy.getElementById(nodeId);
    // console.log("selected node in removenode", selectedNode);
    if (selectedNode.data() === undefined) {
      console.log("No node to remove")
      return;
    }

    //console.log("Removing node: ", selectedNode.data("id"), "Action: ", selectedAction.id)

    // Get selected node

    if (selectedNode.data().type === "TRIGGER") {

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
      } else if (selectedNode.data().trigger_type === "PIPELINE") {
        setSelectedTrigger(selectedNode.data());

        const pipelineConfig = {
          command: "",
          name: selectedNode.data().label,
          type: "delete",
          environment: selectedNode.data().environment,
          workflow_id: workflow.id,
          trigger_id: selectedNode.data().id,
          start_node: "",
        };

        submitPipeline(selectedNode.data(), triggerindex, pipelineConfig);
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
      toast("This node can't be deleted.");
    } else {
      	selectedNode.remove();

		setSelectedTrigger({})
		setSelectedEdge({})
		setSelectedAction({})
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


  if (isLoaded && setupSent === false) {
    setSetupSent(true)

    sendStreamRequest({
      "item": "workflow",
      "type": "enter",
      "id": workflow.id,
    })
  }

  const fetchRecommendations = (inputWorkflow) => {
	console.log("Disabled recommendations as they were too inaccurate")
	return

	const parsedWorkflow = JSON.parse(JSON.stringify(inputWorkflow))

    fetch(globalUrl + "/api/v1/workflows/recommend", {
      method: "POST",
	  headers: {
	  	"Content-Type": "application/json",
	  	Accept: "application/json",
	  },
	  body: JSON.stringify(parsedWorkflow),
	  credentials: "include",
    })
    .then((response) => {
      if (response.status !== 200) {
        console.log("Status not 200 for usecases");
      }

      return response.json();
    })
    .then((responseJson) => {
      if (responseJson.success !== false) {
      	//console.log("recommendations: ", responseJson);

      	if (responseJson.actions !== undefined && responseJson.actions !== null) {
			console.log("Got recommendations: ", responseJson.actions)

			//if (cy !== undefined && cy !== null) {
			//	cy.removeListener("mouseover", "node");
			//}

      		setWorkflowRecommendations(responseJson.actions)

			//if (cy !== undefined && cy !== null) {
    		//	cy.on("mouseover", "node", (e) => onNodeHover(e));
			//}
      	} else {
		  setWorkflowRecommendations([])
		}
      } else {
		  setWorkflowRecommendations([])
      }
    })
    .catch((error) => {
      //toast("ERROR: " + error.toString());
	  setWorkflowRecommendations([])
      console.log("ERROR getting usecases: " + error.toString());
    })
  }

  const fetchUsecases = () => {
    fetch(globalUrl + "/api/v1/workflows/usecases", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for usecases");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success !== false) {
          setUsecases(responseJson)
        } else {
        }
      })
      .catch((error) => {
        //toast("ERROR: " + error.toString());
        console.log("ERROR getting usecases: " + error.toString());
      })
  }

	const getRevisionHistory  = (workflow_id) => {
	  fetch(`${globalUrl}/api/v1/workflows/${workflow_id}/revisions`, {
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
		}

		// Read text from stream
		//return response.text();
		return response.json();
	  })
	  .then((responseJson) => {
		if (responseJson === null) {
			console.log("No revisions found")
			return
		}

		if (responseJson.success === false) {
			console.log("Error getting workflow revisions: ", responseJson)
			return
		}

		setAllRevisions(responseJson)
    	setSelectedVersion(responseJson[0])
	  })
	  .catch((error) => {
		console.log("Error getting workflow revisions: ", error)
	  });
    }

	const loadTriggers = () => {
	  const url = `${globalUrl}/api/v1/triggers`
      fetch(url,
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
	  	if (responseJson.success !== false) {
	  		setAllTriggers(responseJson)
	  	}
	  })
	  .catch((error) => {
	    console.log("Get outlook folders error: ", error.toString());
	  });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  //useEffect(() => {
  if (firstrequest) {
    setFirstrequest(false);
    getWorkflow(props.match.params.key, {});
  	getChildWorkflows(props.match.params.key)
	getRevisionHistory(props.match.params.key)
	loadTriggers() 
    getApps()
    fetchUsecases()

    const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;

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
  // Not using recommendations, so skipping this for now
  //if (elements.length === 0 && workflow.actions !== undefined && !graphSetup && Object.getOwnPropertyNames(workflow).length > 0 && workflowRecommendations !== undefined) {
  if (elements.length === 0 && workflow.actions !== undefined && !graphSetup && Object.getOwnPropertyNames(workflow).length > 0) {
    setGraphSetup(true);
    setupGraph(workflow);
    console.log("In graph setup")

    // 2nd load - configures cytoscape
  //} else if (!established && cy !== undefined && ((apps !== null && apps !== undefined && apps.length > 0) || workflow.public === true) && Object.getOwnPropertyNames(workflow).length > 0 && appAuthentication !== undefined && workflowRecommendations !== undefined) {
  } else if (!established && cy !== undefined && ((apps !== null && apps !== undefined && apps.length > 0) || workflow.public === true) && Object.getOwnPropertyNames(workflow).length > 0 && appAuthentication !== undefined) {

    //This part has to load LAST, as it's kind of not async.
    //This means we need everything else to happen first.

    setEstablished(true);
    // Validate if the node is just a node lol

    // https://www.npmjs.com/package/cytoscape-grid-guide
    //
    if (cy.gridGuide !== undefined) {
      cy.gridGuide({
        gridSpacing: 30,
        guidelinesStyle: {
          strokeStyle: "#8b7d6b", 					// color of geometric guidelines
          geometricGuidelineRange: 400, 		// range of geometric guidelines
          range: 100, 											// max range of distribution guidelines
          minDistRange: 10, 								// min range for distribution guidelines
          distGuidelineOffset: 10, 					// shift amount of distribution guidelines
          horizontalDistColor: "#ff0000", 	// color of horizontal distribution alignment
          verticalDistColor: "#00ff00", 		// color of vertical distribution alignment
          initPosAlignmentColor: "#0000ff", // color of alignment to initial mouse location
          lineDash: [0, 0], 								// line style of geometric guidelines
          horizontalDistLine: [0, 0], 			// line style of horizontal distribution guidelines
          verticalDistLine: [0, 0], 				// line style of vertical distribution guidelines
          initPosAlignmentLine: [0, 0], 		// line style of alignment to initial mouse position
        }
      })
    } else {
      console.log("ERROR: Failed to render grid as it's unitialized")
    }

    if (cy.edgehandles !== undefined) {
      cy.edgehandles({
        handleNodes: (el) => {
          if (el.isNode() &&
            el.data("buttonType") != "ACTIONSUGGESTION" &&
            el.data("name") != "switch" &&
            !el.data("isButton") &&
            !el.data("isDescriptor") &&
            !el.data("isSuggestion") &&
            el.data("type") !== "COMMENT") {
            return true
          }

          return false
        },
        preview: false,
        toggleOffOnLeave: true,
        loopAllowed: function (node) {
          return false;
        },
      })

      //cy.edgehandles({
      //	preview: false,
      //})

      //cy.edgehandles().enable()
    } else {
      console.log("ERROR: Failed to initialize edgehandler")
    }
    // preview: true,

    cy.fit(null, 200);

    cy.on("boxselect", "node", (e) => {
      if (e.target.data("isButton") || e.target.data("isDescriptor") || e.target.data("isSuggestion")) {
        e.target.unselect();
      }

      e.target.addClass("selected");
    });

    cy.on("boxstart", (e) => {
      console.log("START");
    });

    cy.on("boxend", (e) => {
      console.log("END: ", cy)
      var cydata = cy.$(":selected").jsons();
      if (cydata !== undefined && cydata !== null && cydata.length > 0) {
        toast(`Selected ${cydata.length} element(s). CTRL+C to copy them.`);
      }
    });

	cy.on('grab', 'edge', (e) => {
		console.log("Edge grabbed: ", e.target.data())
	})

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

	startWorkflowStream(props.match.params.key);

    registerKeys();
  }
  //})

  const stopSchedule = (trigger, triggerindex) => {
    fetch(
      `${globalUrl}/api/v1/workflows/${props.match.params.key}/schedule/${trigger.id}`,
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
            toast("Failed to stop schedule: " + responseJson.reason);
          }
        } else {
          toast("Successfully stopped schedule");
        }

        workflow.triggers[triggerindex].status = "stopped";
        trigger.status = "stopped";
        setSelectedTrigger(trigger);
        setWorkflow(workflow);
        saveWorkflow(workflow)
      })
      .catch((error) => {
        console.log("Stop schedule error: ", error.toString())
      })
  }

  const submitPipeline = (trigger, triggerindex, usecase) => {
    if (trigger.name.length <= 0) {
      toast("Error: name can't be empty");
      return;
    }
  
    var mappedStartnode = "";
    const alledges = cy.edges().jsons();
    if (alledges !== undefined && alledges !== null && alledges.length > 0) {
      for (let edgekey in alledges) {
        const tmp = alledges[edgekey];
        if (tmp.data.source === trigger.id) {
          mappedStartnode = tmp.data.target;
          break;
        }
      }
    }
    const data = usecase;
    data.start_node = mappedStartnode

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
        }
  
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success && data.type !== "delete") {
          toast("Failed to set pipeline: " + responseJson.reason);
        } else {
          if (data.type === "create") {
            toast("Pipeline will be created!");
          } else if (data.type === "stop") {
             toast("Pipeline will be stopped!");
          } else {
            toast("Pipeline deleted!")
            return
          }
       if (trigger.parameters){
          trigger.parameters.push({
            name: data.name,
            value: data.command,
          });}
          
          if (data.type === "stop") trigger.status = "stopped";
          else trigger.status = "running";
          workflow.triggers[triggerindex] = trigger;
  
          setSelectedTrigger(trigger);
          setWorkflow(workflow);
          saveWorkflow(workflow);
        }
      })
      .catch((error) => {
        console.log("Get pipeline error: ", error.toString());
      });
  };
  
  const submitSchedule = (trigger, triggerindex) => {
    if (trigger.name.length <= 0) {
      toast("Error: name can't be empty");
      return;
    }

	var mappedStartnode = ""
	const alledges = cy.edges().jsons()
    if (alledges !== undefined && alledges !== null && alledges.length > 0) {
		for (let edgekey in alledges) {
			const tmp = alledges[edgekey]
			if (tmp.data.source === trigger.id) {
				mappedStartnode = tmp.data.target
				break
			}
		}
  }

    toast("Creating schedule") 
    const data = {
      name: trigger.name,
      frequency: workflow.triggers[triggerindex].parameters[0].value,
      execution_argument: workflow.triggers[triggerindex].parameters[1].value,
      environment: workflow.triggers[triggerindex].environment,
      id: trigger.id,
      start: mappedStartnode,
    }

    fetch(
      `${globalUrl}/api/v1/workflows/${props.match.params.key}/schedule`,
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
          toast("Failed to set schedule: " + responseJson.reason);
        } else {
          toast("Successfully created schedule");
          workflow.triggers[triggerindex].status = "running";
          trigger.status = "running";
          setSelectedTrigger(trigger);
          setWorkflow(workflow);
          saveWorkflow(workflow);
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Get schedule error: ", error.toString());
      });
  };

  const getSigmaInfo = () => {
    const url = globalUrl + "/api/v1/files/detection/sigma_rules";
  
    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            toast("Failed to get sigma rules");
          } else {
            setRules(responseJson.sigma_info);
  
          }
        })
      )
      .catch((error) => {
        console.log("Error in getting sigma files: ", error);
        toast("An error occurred while fetching sigma rules");
      });
  };

  const parsedHeight = isMobile ? bodyHeight - appBarSize * 4 : bodyHeight - appBarSize - 50 
  const appViewStyle = {
    marginLeft: 5,
    marginRight: 5,
    display: "flex",
    flexDirection: "column",
    minHeight: isMobile ? bodyHeight - appBarSize * 4 : parsedHeight,
    maxHeight: isMobile ? bodyHeight - appBarSize * 4 : parsedHeight,
  };

  const paperAppStyle = {
    borderRadius: theme.palette?.borderRadius,
    minHeight: isMobile ? 50 : 70,
    maxHeight: isMobile ? 50 : 70,
    minWidth: isMobile ? 50 : "100%",
    maxWidth: isMobile ? 50 : "100%",
    marginTop: "5px",
    color: "white",
    backgroundColor: theme.palette.surfaceColor,
    cursor: "pointer",
    display: "flex",
  };

  const paperVariableStyle = {
    borderRadius: theme.palette?.borderRadius,
    minHeight: 50,
    maxHeight: 50,
    minWidth: "100%",
    maxWidth: "100%",
    marginTop: "5px",
    color: "white",
    backgroundColor: theme.palette.surfaceColor,
    cursor: "pointer",
    display: "flex",
  }

  const VariableItem = (props) => {
	const { variable, index, type } = props;

    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const menuClick = (event) => {
      setOpen(!open);
      setAnchorEl(event.currentTarget);
    };

    const deleteVariable = (type, variableIndex) => {

			console.log("Delete type: ", type, variableIndex)

			if (type === "normal") {
				if (workflow.workflow_variables !== undefined && workflow.workflow_variables !== null && workflow.workflow_variables.length > variableIndex) {
					var vars = JSON.parse(JSON.stringify(workflow.workflow_variables))
					vars.splice(variableIndex, 1)
					workflow.workflow_variables = vars

					console.log("Workflow after del: ", workflow)

					setWorkflow(workflow);
					setUpdate(Math.random());
				}
			} else if (type === "exec") {
				if (workflow.execution_variables !== undefined && workflow.execution_variables !== null && workflow.execution_variables.length > variableIndex) {
					var vars = JSON.parse(JSON.stringify(workflow.execution_variables))
					vars.splice(variableIndex, 1)
					workflow.execution_variables = vars

					console.log("Workflow after del: ", workflow)

					setWorkflow(workflow);
					setUpdate(Math.random());
				}
			}
    };

		return (
			<div key={index}>
				<Paper square style={paperVariableStyle} onClick={() => { }}>
					<div
						style={{
							marginLeft: "10px",
							marginTop: "5px",
							marginBottom: "5px",
							width: 2,
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

								if (type === "normal") {
									setVariablesModalOpen(true);
								} else if (type === "exec") {
									setExecutionVariablesModalOpen(true);
								} else {
									console.log("Unknown type: ", type)
								}
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
										backgroundColor: theme.palette.surfaceColor,
									},
								}}
								onClose={() => {
									setOpen(false);
									setAnchorEl(null);
								}}
							>
								<MenuItem
									style={{
										backgroundColor: theme.palette.inputColor,
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

										if (type === "normal") {
											setVariablesModalOpen(true);
										} else if (type === "exec") {
											setExecutionVariablesModalOpen(true);
										} else {
											console.log("Unknown type: ", type)
										}
									}}
									key={"Edit"}
								>
									{"Edit"}
								</MenuItem>
								<MenuItem
									style={{
										backgroundColor: theme.palette.inputColor,
										color: "white",
									}}
									onClick={() => {
										deleteVariable(type, index);
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
		)
	}

  const VariablesView = () => {
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
            Workflow variables?
          </a>
          {workflow.workflow_variables === null
            ? null
            : workflow.workflow_variables.map((variable, varindex) => {
              return (
								<VariableItem 
									variable={variable}
									index={varindex}
									type={"normal"}
								/>
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
                setLastSaved(false)

								setVariableInfo({
									"name": "",
									"description": "",
									"value": "",
								})
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
            Runtime variables?
          </a>
          {workflow.execution_variables === null ||
            workflow.execution_variables === undefined
            ? null
            : workflow.execution_variables.map((variable, varindex2) => {
              return (
								<VariableItem 
									variable={variable}
									index={varindex2}
									type={"exec"}
								/>
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

								setVariableInfo({
									"name": "",
									"description": "",
									"value": "",
								})
              }}
            >
              New Runtime variable
            </Button>
          </div>
        </div>
      </div>
    );
  };

  

  const HandleLeftView = () => {
    // console.log("HandleLeftView Rendered!")

    const handleSetTab = (event, newValue) => {
      setCurrentView(newValue);
    };
    
    // Defaults to apps.
    var thisview = (
      <AppView
        allApps={apps}
        extraApps={[]}
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
        <Divider style={{ backgroundColor: "rgb(91, 96, 100)", }} />
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
            style={{
			  maxWidth: isMobile ? leftBarSize : leftBarSize / 3,
			  minWidth: isMobile ? leftBarSize : leftBarSize / 3,
			  flex: 1,
			  textTransform: "none",
			  padding: 0, 
			}}
          />
          <Tab
            label={
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <FavoriteBorderIcon style={iconStyle} />
                </Grid>
                {isMobile ? null : <Grid item>Vars</Grid>}
              </Grid>
            }
            style={tabStyle}
          />
        </Tabs>
      </div>
    )
  }

  

  const TriggersView = () => {
    const triggersViewStyle = {
      marginLeft: 10,
      marginRight: 10,
      display: "flex",
      flexDirection: "column",
    }

    // Predefined hurr
    return (
      <div style={triggersViewStyle}>
        <div style={appScrollStyle}>
          {triggers.map((trigger, index) => {

			// Hiding since March 2024
			if (trigger.trigger_type === "EMAIL") {
				return null
			}

			const imagesize = isMobile ? 40 : trigger.large_image.includes("svg") ? 50 : 50 
            var imageline = trigger.large_image.length === 0 ? <img alt="" style={{ borderRadius: theme.palette?.borderRadius, width: isMobile ? 40 : 60 , pointerEvents: "none" }} />
              : 
                <img
                  alt=""
                  src={trigger.large_image}
                  style={{ 
					  borderRadius: theme.palette?.borderRadius, 
					  width: imagesize, 
					  height: imagesize, 
					  // Stretch if necessary
					  objectFit: "cover",
					  // Center the object
					  objectPosition: "center center",
				  }}
                />

			const title = trigger.trigger_type === "WEBHOOK" ? "Workflow starters" : trigger.trigger_type === "SUBFLOW" ? "Mid-Workflow" : ""

            const color = trigger.is_valid ? green : yellow;
            return (
			<span>
				{title.length > 0 ? 
					<Typography variant="h6" style={{ marginTop: 10, marginBottom: 10, marginLeft: 10, }}>
						{title}
					</Typography>
				: null}

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
              	  <Paper square style={paperAppStyle} onClick={() => { }}>
              	    <div
              	      style={{
              	        marginLeft: isMobile ? 0 : 10,
              	        marginTop: isMobile ? 10 : 5,
              	        marginBottom: 5,
              	        width: 2,
              	        backgroundColor: color,
              	        marginRight: 5,
              	      }}
              	    ></div>
              	    <Grid
              	      container
              	      style={{ margin: isMobile ? "10px 0px 0px 0px" : "10px 10px 10px 10px", flex: "10", overflow: "hidden", }}
              	    >
              	      <Grid item>
              	        <ButtonBase>{imageline}</ButtonBase>
              	      </Grid>
              	      {isMobile ? null :
              	        <Grid
              	          style={{
              	            display: "flex",
              	            flexDirection: "column",
              	            marginLeft: 20,
              	          }}
              	        >
              	          <Grid item style={{ flex: "1", overflow: "hidden", }}>
              	            <Typography variant="body1" style={{ marginTop: 0, marginBottom: 0, overflow: "hidden" }}>
              	              {trigger.name}
              	            </Typography>
              	          </Grid>
              	          <Grid item style={{ flex: "1" }}>
						  	<Typography variant="body2" color="textSecondary" style={{ marginTop: 0, marginBottom: 0, overflow: "hidden", }}>
              	            	{trigger.description}
						  	</Typography>
              	          </Grid>
              	        </Grid>
              	      }
              	    </Grid>
              	  </Paper>
              	</Draggable>
			  </span>
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
          toast("Define a starting action first.");
          return;
        }

        const triggerLabel = getNextActionName(data.name);

        newNodeId = uuidv4();
        const newposition = {
          x: e.pageX - cycontainer.offsetLeft,
          y: e.pageY - cycontainer.offsetTop,
        };

        var newAppData = {
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
        }

		if (data.name === "Pipelines") {	
			var newenv = environments.find((env) => {
				if (env.archived) {
					return false
				}

				if (env.Name === "cloud" || env.Type === "cloud") {
					return false
				}

				return true
			})

			console.log("NEWENV: ", environments, newenv)
			if (newenv !== undefined && newenv !== null) {
				newAppData.environment = newenv.Name
			} else {
				newAppData.environment = ""
			}
		}
	    console.log("NEW DATA: ", newAppData)

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

	if (parsedApp === undefined || parsedApp === null || parsedApp.data === undefined || parsedApp.data === null) {
		toast("Failed to add node. Please try again.")
		console.log("Failed to add node. Please try again. Parsed app:", parsedApp)
		return
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
        activateApp(newAppData.app_id, false)
      }

      // AUTHENTICATION
      if (app.authentication !== undefined && app.authentication !== null && app.authentication.required === true) {

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

        const tmpAuth = JSON.parse(JSON.stringify(appAuthentication));
        for (let authkey in tmpAuth) {
		  if (authkey === undefined) {
		  	continue
		  }

          var item = tmpAuth[authkey];
          const newfields = {};
		  for (let fieldkey in item.fields) {
		  	if (item.fields[fieldkey] === undefined) {
		  		console.log("Problem with filterkey in Node select", fieldkey)
		  		continue
		  	}

		  	const filterkey = item.fields[fieldkey]["key"]
		  	if (filterkey === null || filterkey === undefined) {
		  		console.log("Problem with filterkey 2. Null or undefined 3")
		  		continue
		  	}

		  	newfields[filterkey] = item.fields[fieldkey]["value"];
		  }

          item.fields = newfields;
          if (item.app.id === app.id || item.app.name === app.name) {
            authenticationOptions.push(item);

            if (item.id === findAuthId) {
              newAppData.selectedAuthentication = item
              newAppData.authentication_id = item.id

            } else if (findAuthId === "") {
              // Will always be set to the last one if one isn't found. 
              // Last = timestamp too
              newAppData.selectedAuthentication = item
              newAppData.authentication_id = item.id
            }
          }
        }

        if (
          authenticationOptions !== undefined &&
          authenticationOptions !== null &&
          authenticationOptions.length > 0
        ) {
          for (let authkey in authenticationOptions) {
            const option = authenticationOptions[authkey];

            if (option.active && newAppData.authentication_id === "") {
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

  const barHeight = bodyHeight - appBarSize - 50;
  const appScrollStyle = {
    overflow: "scroll",
    maxHeight: isMobile ? bodyHeight - appBarSize * 4 : barHeight,
    minHeight: isMobile ? bodyHeight - appBarSize * 4 : barHeight,
    marginTop: 1,
    overflowY: "auto",
    overflowX: "hidden",
  }

  const handleAppDrag = (e, app) => {
    const cycontainer = cy.container();

	console.log("APPDRAG!")


	if (app.type === "TRIGGER") {
    	handleTriggerDrag(e, app)
		return
	}

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

        currentnode[0].renderedPosition("x", e.pageX - cycontainer.offsetLeft)
        currentnode[0].renderedPosition("y", e.pageY - cycontainer.offsetTop)
      } else {
        if (workflow.public) {
          console.log("workflow is public - not adding")
          return;
        }

		if (app.actions === undefined || app.actions === null) {
			app.actions = []
		}

		/*
        if (app.actions === undefined || app.actions === null || app.actions.length === 0) {
          toast("App " + app.name + " currently has no actions to perform. Please go to https://shuffler.io/apps to edit it.")

          return
        }
		*/

        newNodeId = uuidv4();
        const actionType = "ACTION";
        const actionLabel = getNextActionName(app.name);
		//console.log("Next action name: ", actionLabel)
        var parameters = null;
        var example = "";
        var description = ""

		const startIndex = app.actions.findIndex((action) => action.category_label !== undefined && action.category_label !== null && action.category_label.length > 0)
		const actionIndex = startIndex < 0 ? 0 : startIndex

		if (app.actions[actionIndex] === undefined || app.actions[actionIndex] === null) {
			if (app.id !== undefined && app.id !== null) {
				loadAppConfig(app.id, false) 
			}

			console.log("No actions found for app: ", app)
			return
		}

		// Make the first action the most relevant one for them based on previous use
        if (
          app.actions[actionIndex].parameters !== undefined &&
          app.actions[actionIndex].parameters !== null &&
          app.actions[actionIndex].parameters.length > 0
        ) {
          parameters = app.actions[actionIndex].parameters;
		  for (let paramkey in parameters) {
			  // Check if parameter.name == "headers" and if it includes "=undefined". If it does, set the value to example if it exists, otherwise empty
			  if (parameters[paramkey].name === "headers" && parameters[paramkey].value.includes("=undefined")) {
				  if (parameters[paramkey].example !== undefined && parameters[paramkey].example !== null && parameters[paramkey].example.length > 0) {
					  parameters[paramkey].value = parameters[paramkey].example
				  } else {
					  parameters[paramkey].value = ""
				  }
			  }
		  }

          //parameters = app.actions[0].parameters;
        }

        if (
          app.actions[actionIndex].returns !== undefined &&
          app.actions[actionIndex].returns !== null &&
          app.actions[actionIndex].returns.example !== undefined &&
          app.actions[actionIndex].returns.example !== null &&
          app.actions[actionIndex].returns.example.length > 0
        ) {
          example = app.actions[actionIndex].returns.example;
        }

        if (
          app.actions[actionIndex].description !== undefined &&
          app.actions[actionIndex].description !== null &&
          app.actions[actionIndex].description.length > 0
        ) {
          description = app.actions[actionIndex].description
        }

        var parsedEnvironments =
          environments === undefined || environments === null || environments === []
            ? isCloud ? "cloud" : "Shuffle" : environments[defaultEnvironmentIndex] === undefined
              ? isCloud ? "cloud" : "Shuffle" : environments[defaultEnvironmentIndex].Name

		// Basic automatic auth mapping
		var authId = ""
		if (appAuthentication !== undefined && appAuthentication !== null && appAuthentication.length > 0) {
			const appname = app.name.toLowerCase().replace(" ", "_")
			for (var key in appAuthentication) {
				const authKey = appAuthentication[key]
				if (authKey.app.id === app.id) {
					authId = authKey.id
					break
				}

				const appauthname = authKey.app.name.toLowerCase().replace(" ", "_")
				if (appauthname === appname) {
					authId = authKey.id
				}
			}
		}

		// List other nodes in the workflow and see if they have an environment set. If they do, use that as the default
		if (cy !== undefined && cy !== null) {
			const foundnodes = cy.nodes().jsons()
			if (foundnodes !== undefined && foundnodes !== null && foundnodes.length > 0) {
				// As they should all be the same, this is just an override
				for (let nodekey in foundnodes) {
					const curnode = foundnodes[nodekey]
					if (curnode.data.environment !== undefined && curnode.data.environment !== null && curnode.data.environment.length > 0) {
						parsedEnvironments = curnode.data.environment
						break
					}
				}
			}
		}

        const newAppData = {
          name: app.actions[actionIndex].name,
          label: actionLabel,
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
          type: actionType,
          parameters: parameters,
          isStartNode: false,
          large_image: app.large_image,
          run_magic_output: false,
          authentication: [],
          execution_variable: undefined,
          example: example,
		  required_body_fields: app.actions[actionIndex].required_body_fields,
          category:
            app.categories !== null &&
              app.categories !== undefined &&
              app.categories.length > 0
              ? app.categories[0]
              : "",
          authentication_id: authId,
          finished: false,
          template: app.template === true ? true : false,
        };

        // FIXME: overwrite category if the ACTION chosen has a different category
				//

				if (!isCloud && (!app.is_valid || (!app.activated && app.generated)))  {
					console.log("NOT VALID: Activate!")
                    
					activateApp(app.id, false)
				}

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
    const { allApps, prioritizedApps, filteredApps, extraApps } = props;
    // console.log("AppView Rendered!")
    //extraApps,
    const [visibleApps, setVisibleApps] = React.useState(
      Array.prototype.concat.apply(
        prioritizedApps,
        Array.prototype.concat.apply(
			filteredApps.filter((innerapp) => !internalIds.includes(innerapp.id.toLowerCase())),
			triggers
		)
	  )
	)

    var delay = -75
    var runDelay = false

    const ParsedAppPaper = (props) => {
      const app = props.app;
      const [hover, setHover] = React.useState(false);

	  if (app.type !== "TRIGGER" && (app.id === "" || app.name === "")) {
	  	return null
	  }

      const maxlen = 35 
      var newAppname = app.name
      newAppname = newAppname.charAt(0).toUpperCase() + newAppname.substring(1)
      if (newAppname.length > maxlen) {
        newAppname = newAppname.slice(0, maxlen) + ".."
      }

      newAppname = newAppname.replaceAll("_", " ")

	  if (app.large_image === undefined || app.large_image === null || app.large_image === "") {
	  	app.large_image = theme.palette.defaultImage
	  }

      const image = app.large_image !== undefined && app.large_image !== null && app.large_image !== "" ? app.large_image : theme.palette.defaultImage
			
      const newAppStyle = JSON.parse(JSON.stringify(paperAppStyle))
      const pixelSize = !hover ? "2px" : "4px";
      //newAppStyle.borderLeft = app.is_valid && app.actions !== null && app.actions !== undefined && app.actions.length > 0 && !(app.activated && app.generated)
      newAppStyle.borderLeft = app.is_valid && app.actions !== null && app.actions !== undefined && app.actions.length > 0
        ? `${pixelSize} solid ${green}`
        : `${pixelSize} solid ${yellow}`;

	  if (app.id == highlightedApp && app.id !== "") {
		  //console.log("Found correct appid to highlight: ", app.id)

		  newAppStyle.border = "3px solid " + green
	  }

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
            onMouseOver={(e) => {
			  e.preventDefault()
			  e.stopPropagation()

              setHover(true)

			  if (app.actions !== undefined && (app.actions === null || app.actions.length === 1)) {
			  	loadAppConfig(app.id, false) 
			  }

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
                  large_image: image,
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
              style={{ margin: "7px 10px 10px 10px", flex: "10" }}
            >
              <Grid item>
                <img
                  alt={newAppname}
                  src={image}
                  style={{
                    pointerEvents: "none",
                    userDrag: "none",
                    userSelect: "none",
                    borderRadius: theme.palette?.borderRadius,
                    height: isMobile ? 40 : 55,
                    width: isMobile ? 40 : 55,
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
                      style={{ 
						  marginBottom: 0, 
						  marginLeft: 5, 
						  marginTop: newAppname.length > 20 ? -1 : 12, 
						  fontSize: 19, 
					  }}
                    >
                      {newAppname}
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
	  value = value.trim().toLowerCase()
      if (value.length > 0) {
		// Dedup based on name
		const preppedApps = Array.prototype.concat.apply(allApps, triggers).filter((app, index, self) => {
			return index === self.findIndex((t) => (
				t.name === app.name
			))
		})

        var newApps = preppedApps.filter(
          (app) =>
            app.name.toLowerCase().includes(value)
            ||
            app.description.toLowerCase().includes(value)
        )

        // Extend search
        if (newApps.length === 0) {
          newApps = allApps.filter((app) => {
		  if (app.actions !== undefined && app.actions !== null) {
		  	for (let actionkey in app.actions) {
		  		const inneraction = app.actions[actionkey]
		  		if (inneraction.name.toLowerCase().includes(value)) {
		  			return true;
		  		}
		  	}
		  }

            return false;
          })
        }

        setVisibleApps(newApps)
      } else {
        setVisibleApps(
          prioritizedApps.concat(
            filteredApps.filter(
              (innerapp) => !internalIds.includes(innerapp.id.toLowerCase())
            )
          )
        )
      }
    };

    const SearchBox = ({ currentRefinement, refine, isSearchStalled, }) => {
	  if (document !== undefined) {
	    const appsearchValue = document.getElementById("appsearch")
	    if (appsearchValue !== undefined && appsearchValue !== null) {
			if (appsearchValue.value !== undefined && appsearchValue.value !== null && appsearchValue.value.length > 0) {
			  refine(appsearchValue.value)
			}
	    }
	  }

      return (
        <form id="search_form" noValidate type="searchbox" action="" role="search" style={{ margin: 0, display: "none", }} onClick={() => {
        }}>
          <TextField
            fullWidth
            style={{ backgroundColor: theme.palette.inputColor, borderRadius: theme.palette?.borderRadius, maxWidth: leftBarSize - 20, }}
            InputProps={{
              style: {
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ marginLeft: 5 }} />
                </InputAdornment>
              ),
            }}
            autoComplete='off'
            type="search"
            color="primary"
            placeholder="Find Public Apps, Workflows, Documentation and more"
            value={currentRefinement}
            id="shuffle_search_field"
            onBlur={(event) => {
              //setSearchOpen(false)
            }}
            onChange={(event) => {
              //if (event.currentTarget.value.length > 0 && !searchOpen) {
              //	setSearchOpen(true)
              //}

              refine(event.currentTarget.value)
            }}
            limit={5}
          />
          {/*isSearchStalled ? 'My search is stalled' : ''*/}
        </form>
      )
    }


    const AppHits = ({ hits }) => {
      const [mouseHoverIndex, setMouseHoverIndex] = useState(0)

      //var tmp = searchOpen
      //if (!searchOpen) {
      //	return null
      //}

      const positionInfo = document.activeElement.getBoundingClientRect()
      const outerlistitemStyle = {
        width: "100%",
        overflowX: "hidden",
        overflowY: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.4)",
      }

      if (hits.length > 4) {
        hits = hits.slice(0, 4)
      }


	  const clickedApp = (hit) => {
	  	toast.success(`Activating App. Please wait a moment.`)

	  	const queryID = hit.__queryID


	  	if (queryID !== undefined && queryID !== null) {
	  	  aa('init', {
	  		appId: "JNSS5CFDZZ",
	  		apiKey: "db08e40265e2941b9a7d8f644b6e5240",
	  	  })

	  	  const timestamp = new Date().getTime()
	  	  aa('sendEvents', [
	  		{
	  		  eventType: 'conversion',
	  		  eventName: 'Public App Activated',
	  		  index: 'appsearch',
	  		  objectIDs: [hit.objectID],
	  		  timestamp: timestamp,
	  		  queryID: queryID,
	  		  userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
	  		}
	  	  ])
	  	} else {
	  	  console.log("No query to handle when activating")
	  	}

	  	activateApp(hit.objectID, true)
	  }

      var type = "app"
      const baseImage = <LibraryBooksIcon />
      return (
        	<div style={{ position: "relative", marginTop: 15, marginLeft: 0, marginRight: 10, position: "absolute", color: "white", zIndex: 1001, backgroundColor: theme.palette.inputColor, minWidth: leftBarSize - 10, maxWidth: leftBarSize - 10, boxShadows: "none", overflowX: "hidden", }}>
        	  <List style={{ backgroundColor: theme.palette.inputColor, }}>
        	    {hits.length === 0 ?
        	      <ListItem style={outerlistitemStyle}>
        	        <ListItemAvatar onClick={() => console.log(hits)}>
        	          <Avatar>
        	            <FolderIcon />
        	          </Avatar>
        	        </ListItemAvatar>
        	        <ListItemText
        	          primary={"No public apps found."}
        	          secondary={"Try a broader search term"}
        	        />
        	      </ListItem>
        	      :
        	      hits.map((hit, index) => {
        	        const innerlistitemStyle = {
        	          width: positionInfo.width + 35,
        	          overflowX: "hidden",
        	          overflowY: "hidden",
        	          borderBottom: "1px solid rgba(255,255,255,0.4)",
        	          backgroundColor: mouseHoverIndex === index ? "#1f2023" : "inherit",
        	          cursor: "pointer",
        	          marginLeft: 0,
        	          marginRight: 0,
        	          maxHeight: 75,
        	          minHeight: 75,
        	          maxWidth: 420,
        	          minWidth: "100%",
        	        }

        	        const name = hit.name === undefined ?
        	          hit.filename.charAt(0).toUpperCase() + hit.filename.slice(1).replaceAll("_", " ") + " - " + hit.title :
        	          (hit.name.charAt(0).toUpperCase() + hit.name.slice(1)).replaceAll("_", " ")

        	        var secondaryText = hit.data !== undefined ? hit.data.slice(0, 40) + "..." : ""
        	        const avatar = hit.image_url === undefined ?
        	          baseImage
        	          :
        	          <Avatar
        	            src={hit.image_url}
        	            variant="rounded"
        	          />

        	        //console.log(hit)
        	        if (hit.categories !== undefined && hit.categories !== null && hit.categories.length > 0) {
        	          secondaryText = hit.categories.slice(0, 3).map((data, index) => {
        	            if (index === 0) {
        	              return data
        	            }

        	            return ", " + data

        	            /*
        	              <Chip
        	                key={index}
        	                style={chipStyle}
        	                label={data}
        	                onClick={() => {
        	                  //handleChipClick
        	                }}
        	                variant="outlined"
        	                color="primary"
        	              />
        	            */
        	          })
        	        }

        	        var parsedUrl = isCloud ? `/apps/${hit.objectID}` : `https://shuffler.io/apps/${hit.objectID}`
        	        parsedUrl += `?queryID=${hit.__queryID}`

					var appdragged = false
        	        return (
					  <Draggable
					    onDrag={(e) => {
						  e.preventDefault()
						  e.stopPropagation()

						  if (!appdragged) { 
						  	clickedApp(hit)
						  }
						  
						  appdragged = true 
					    }}
					    onStop={(e) => {
					    }}
					    dragging={false}
					    position={{
					  	x: 0,
					  	y: 0,
					    }}
					  >
        	          <div style={{ textDecoration: "none", color: "white", }} onClick={(event) => {
						  clickedApp(hit)

        	          }}>
        	            <ListItem key={hit.objectID} style={innerlistitemStyle} onMouseOver={() => {
        	              setMouseHoverIndex(index)
        	            }}>
        	              <ListItemAvatar>
        	                {avatar}
        	              </ListItemAvatar>
        	              <ListItemText
        	                primary={name}
        	                secondary={secondaryText}
        	              />
        	              {/*
												<ListItemSecondaryAction>
													<IconButton edge="end" aria-label="delete">
														<DeleteIcon />
													</IconButton>
												</ListItemSecondaryAction>
												*/}
        	            </ListItem>
        	          </div>
		  			  </Draggable>
        	        )
        	      })
        	    }
        	  </List>
        	</div>
      )
    }


    const CustomSearchBox = connectSearchBox(SearchBox)
    const CustomAppHits = connectHits(AppHits)

	var viewedApps = []
    return (
      <div style={appViewStyle}>
        <div style={{ flex: "1" }}>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
              marginTop: 5,
              marginRight: 10,
            }}
            InputProps={{
              style: {
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
			onChange={(event) => {
              runSearch(event.target.value)
			}}
            onBlur={(event) => {

              //navigate(`?q=${event.target.value}`)

              //runSearch(event.target.value)
            }}
          />
          {visibleApps.length > extraApps.length ? (
            <div style={appScrollStyle}>
              {visibleApps.map((app, index) => {
                if (app.invalid) {
                  	return null
                }

				if (app.trigger_type === "PIPELINE" && userdata.support !== true) {
					return null
				}

				if (app.id === "integration" && userdata.support !== true) {
					return null
				}

				if (viewedApps.includes(app.id)) {
					return null
				}

				viewedApps.push(app.id)

                var extraMessage = ""
                if (index == 2) {
                  	extraMessage = <div style={{ marginTop: 5 }} />
                }

                delay += 75
                return (
                  runDelay ?
				  	<span>
                    	{/*<Zoom key={index} in={true} style={{ transitionDelay: `${delay}ms` }}>*/}
                      <div>
                        <ParsedAppPaper key={index} app={app} />
                      </div>
                    	{/*</Zoom>*/}
					</span>
                    :
                    <div key={index}>
                      {extraMessage}
                      <ParsedAppPaper key={index} app={app} />
                    </div>
                )
              })}

			  {visibleApps.length <= 2 ? 
				<div
				  style={{ textAlign: "center", width: leftBarSize, marginTop: 40, maxWidth: 340, overflow: "hidden",  }}
				  onLoad={() => {
				  }}
				>
				  <Typography variant="body1" color="textSecondary">
					Click one of the relevant public apps below to Activate it for your organization. 
				  </Typography>
				  <InstantSearch searchClient={searchClient} indexName="appsearch" onClick={() => {
					console.log("CLICKED")
				  }}>
					<CustomSearchBox />
					<Index indexName="appsearch">
					  <CustomAppHits />
					</Index>
				  </InstantSearch>
				</div>
			    :
				<div style={{marginLeft: 10, marginTop: 10, marginBottom: 100, }}>
				  <Typography variant="body1" color="textSecondary">
					Apps need to be activated before they can be used. Search from our 2500+ apps to activate them for your organisation.
				  </Typography>
			    </div>
			  	}
            </div>
          ) : apps.length > 0 ? (
            <div
              style={{ textAlign: "center", width: leftBarSize, marginTop: 10, marginLeft: 5, marginRight: 5, }}
              onLoad={() => {
                console.log("Should load in extra apps?")
              }}
            >
              <Typography variant="body1" color="textSecondary">
                Couldn't find the apps you were looking for? Searching unactivated apps. Click one of these apps to Activate it for your organisation.
              </Typography>
              <InstantSearch searchClient={searchClient} indexName="appsearch" onClick={() => {
                console.log("CLICKED")
              }}>
                <CustomSearchBox />
                <Index indexName="appsearch">
                  <CustomAppHits />
                </Index>
              </InstantSearch>
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
}



  const getNextActionName = (appName) => {
    var highest = "";

    const allitems = workflow.actions.concat(workflow.triggers);
		if (allitems !== undefined && allitems !== null) {
			for (let itemkey in allitems) {
				const item = allitems[itemkey];

				if (item.app_name === appName && item.label !== undefined && item.label !== null) {
					var number = item.label.split("_");
					if (isNaN(number[-1]) && parseInt(number[number.length - 1]) > highest) {
						highest = number[number.length - 1];
					}
				}
			}
		}

    appName = appName.replaceAll(" ", "_")
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

	if (selectedApp.actions.length === 1) {
		// Find if there's a new app
		const newApp = apps.find((app) => (app.name === selectedApp.name && app.app_version !== selectedApp.app_version) || app.id == selectedApp.id)
		if (newApp !== undefined && newApp !== null) {

			if (selectedApp.actions !== undefined && selectedApp.actions !== null && selectedApp.actions.length > 1) {
				setSelectedApp(newApp)
			}

			selectedApp.actions = newApp.actions
		}
	}

    const newaction = selectedApp.actions.find((a) => a.name === e.target.value)
    if (newaction === undefined || newaction === null) {
      toast("Failed to find the action you selected. Please try again or contact support@shuffler.io if it persists.");
      return;
    }

    if (workflow.actions !== undefined && workflow.actions !== null) {
      const foundInfo = workflow.actions.find(ac => ac.id === selectedAction.id)
    }


    // Setting an old reference just to use the same memory space elsewhere 
    // for selectedAction
    const oldaction = JSON.parse(JSON.stringify(selectedAction))

    // Does this one find the wrong one?
    //var newSelectedAction = JSON.parse(JSON.stringify(selectedAction))
    var newSelectedAction = selectedAction
    newSelectedAction.name = newaction.name;
    newSelectedAction.parameters = JSON.parse(JSON.stringify(newaction.parameters))
    newSelectedAction.errors = [];
    newSelectedAction.isValid = true;
    newSelectedAction.is_valid = true;
	newSelectedAction.required_body_fields = newaction.required_body_fields 

	// Simple action swap autocompleter
	if (oldaction.parameters !== undefined && oldaction.parameters !== null && newSelectedAction.parameters !== undefined && oldaction.id === newSelectedAction.id) {
		var fileid_found = false

		for (let [paramkey,paramkeyval] in Object.entries(oldaction.parameters)) {
			const param = oldaction.parameters[paramkey];
		
			if (param.name === "file_id") {
				fileid_found = true
			}

    	    if (param.value === null || param.value === undefined || param.value.length === 0) {
    	      continue
    	    }

    	    if (param.name === "body") {
    	      //console.log("Param: ", param)
    	      continue
    	    }

    	    if (param.name === "headers") {
    	      if (fileid_found) {
    	        newSelectedAction.parameters[paramkey].value = ""
    	        newSelectedAction.parameters[paramkey].autocompleted = true

    	        continue
    	      }
    	      //newSelectedAction.parameters[newParamIndex].value = param.value
    	    }

    	    if (newSelectedAction.parameters === undefined || newSelectedAction.parameters === null) {
    	      continue
    	    }

    	    // Not doing options fields
    	    const newParamIndex = newSelectedAction.parameters.findIndex(paramdata => paramdata.name === param.name)
    	    if (newParamIndex < 0) {
    	      continue
    	    }

			if (newSelectedAction.parameters[newParamIndex].name === "headers") {
				if (param.value !== undefined && param.value !== null && param.value.includes("=undefined")) {
					if (newSelectedAction.parameters[newParamIndex].example !== undefined && newSelectedAction.parameters[newParamIndex].example !== null) {
						newSelectedAction.parameters[newParamIndex].value = newSelectedAction.parameters[newParamIndex].example
					} else {
						newSelectedAction.parameters[newParamIndex].value = ""
					}

					continue
				}
			}

    	    newSelectedAction.parameters[newParamIndex].value = param.value
    	    newSelectedAction.parameters[newParamIndex].autocompleted = true
    	    if (param.options !== undefined && param.options !== null && param.options.length > 0) {
    	      newSelectedAction.parameters[newParamIndex].autocompleted = false
    	    }
    	  }
    	}

    	if (newSelectedAction.app_name === "Shuffle Tools") {
    	  const iconInfo = GetIconInfo(newSelectedAction);
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
    	  } else {
    	    newSelectedAction.iconBackground = iconInfo.iconBackgroundColor;
    	  }

    	  const foundnode = cy.getElementById(newSelectedAction.id);
    	  if (foundnode !== null && foundnode !== undefined) {
    	    foundnode.data(newSelectedAction);
    	  }
    	}


    // Takes an action as input, then runs through and updates the relevant parameters based on previous actions' results (parent nodes)
    // Further checks if those fields are already set in a previously used action
    newSelectedAction = RunAutocompleter(newSelectedAction);

    if (
	  newaction.return !== undefined &&
	  newaction.return !== null &&
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


    if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0) {
      const foundActionIndex = workflow.actions.findIndex(actiondata => actiondata.id === newSelectedAction.id)
      if (foundActionIndex >= 0) {
        workflow.actions[foundActionIndex] = newSelectedAction
        setWorkflow(workflow)
      }
    }

	// Last fix for params
	if (newSelectedAction.parameters !== undefined && newSelectedAction.parameters !== null && newSelectedAction.parameters.length > 0) {
		for (let paramkey in newSelectedAction.parameters) {
			const param = newSelectedAction.parameters[paramkey]
			if (param.name !== "body") {
				continue
			}

			if (param.example !== undefined && param.example !== null && param.example.length > 0) {
				if (param.value === undefined || param.value === null || param.value.length === 0) {
					param.value = param.example
				}
			}

			newSelectedAction.parameters[paramkey] = param
		}
	}

    setSelectedAction(newSelectedAction)
    setUpdate(Math.random())

    const allNodes = cy.nodes().jsons()
	if (allNodes !== undefined && allNodes !== null) {
		for (let nodekey in allNodes) {
			const currentNode = allNodes[nodekey];
			if (
				currentNode.data.attachedTo === oldaction.id &&
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
	}

		// Send it in here, after all fields are filled
		// Disabled for now :(
		// const aiMsg = "Fill based on previous values"
		// aiSubmit(aiMsg, undefined, undefined, newSelectedAction)
	};

  // APPSELECT at top
  // appname & version
  // description
  // ACTION select
  const selectedNameChange = (appActionName) => {
	if (appActionName === undefined || appActionName === null) {
		return
	}

    appActionName = appActionName.replaceAll("(", "");
    appActionName = appActionName.replaceAll(")", "");
    appActionName = appActionName.replaceAll("]", "");
    appActionName = appActionName.replaceAll("[", "");
    appActionName = appActionName.replaceAll("{", "");
    appActionName = appActionName.replaceAll("}", "");
    appActionName = appActionName.replaceAll("*", "");
    appActionName = appActionName.replaceAll("!", "");
    appActionName = appActionName.replaceAll("@", "");
    appActionName = appActionName.replaceAll("#", "");
    appActionName = appActionName.replaceAll("$", "");
    appActionName = appActionName.replaceAll("%", "");
    appActionName = appActionName.replaceAll("&", "");
    appActionName = appActionName.replaceAll("#", "");
    appActionName = appActionName.replaceAll(".", "");
    appActionName = appActionName.replaceAll(",", "");
    appActionName = appActionName.replaceAll(" ", "_");
    appActionName = appActionName.replaceAll("^", "_");
    appActionName = appActionName.replaceAll("'", "_");
    appActionName = appActionName.replaceAll("\"", "_");
    appActionName = appActionName.replaceAll("\"", "_");
    appActionName = appActionName.replaceAll(":", "_");
    appActionName = appActionName.replaceAll(";", "_");
    appActionName = appActionName.replaceAll("=", "_");
    appActionName = appActionName.replaceAll("+", "_");
    selectedAction.label = appActionName;
    setSelectedAction(selectedAction);
  };

  const actionDelayChange = (delay) => {
    if (isNaN(delay)) {
      console.log("NAN: ", delay)
      return
    }

    const parsedNumber = parseInt(delay)
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
  // FIXME: Use the GetParentNodes in WorkflowValidationTimeline.jsx instead
  const getParents = (action) => {
    if (action === undefined || action === null) {
      return []
    }

    var allkeys = [action.id];
    var handled = [];
    var results = [];

	if (cy === undefined || cy === null) {
		return []
	}

    // maxiter = max amount of parent nodes to loop
    // also handles breaks if there are issues
    var iterations = 0;
    var maxiter = 10;
    while (true) {
      for (let parentkey in allkeys) {
        var currentnode = cy.getElementById(allkeys[parentkey]);
        if (currentnode === undefined || currentnode === null) {
          continue;
        }

        if (currentnode.data() === undefined) {
          handled.push(allkeys[parentkey]);
          results.push({ id: allkeys[parentkey], type: "TRIGGER" });
        } else {
          if (handled.includes(currentnode.data().id)) {
            continue
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

        for (let i = 0; i < incomingEdges.length; i++) {
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
    results = results.filter((data) => data.id !== action.id)
    results = results.filter((data) => data.type === "ACTION" || data.app_name === "Shuffle Workflow" || data.app_name === "User Input")
    results.push({ label: "Execution Argument", type: "INTERNAL" })

    return results
  }

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
	paddingBottom: 100, 

	overflowAnchor: "none",
  };

  const minSize = 370
  var rightsidebarStyle = {
    position: "fixed",
    top: appBarSize + 25,
    right: 25,
    height: "80vh",
    width: isMobile ? "100%" : minSize,
    minWidth: minSize,
    maxWidth: 600,
    maxHeight: "100vh",
    border: "1px solid rgb(91, 96, 100)",
    zIndex: 1000,
    borderRadius: theme.palette?.borderRadius,
    resize: "both",
    overflow: "auto",

	overflowAnchor: "none",
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
      toast("Max 1 folder at a time allowed for Office365")
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
    console.log("Cron Value: ", value)
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
    if (selectedTrigger.parameters === null || selectedTrigger.parameters === undefined) {
      selectedTrigger.parameters = [
	  	{ name: "", value: "" },
		{ name: "", value: "" },
		{ name: "", value: "" },
	  ]
    }

	if (selectedTrigger.parameters.length < 3 ) {
		selectedTrigger.parameters.push({ name: "", value: "" })
	}

    const splitItems = workflow.triggers[selectedTriggerIndex].parameters[2].value.split(",");
      
    console.log(splitItems);
    if (splitItems.includes(value)) {
      for (let i = 0; i < splitItems.length; i++) {
        if (splitItems[i] === value) {
          splitItems.splice(i, 1);
        }
      }
    } else {
      splitItems.push(value);
    }

    for (let i = 0; i < splitItems.length; i++) {
      if (splitItems[i] === "") {
        splitItems.splice(i, 1);
      }
    }

    workflow.triggers[selectedTriggerIndex].parameters[2].value = splitItems.join(",");

    setWorkflow(workflow);
    setLocalFirstrequest(!localFirstrequest);
		setUpdate(Math.random());
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
      }
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

      if (workflow.workflow_variables !== null && workflow.workflow_variables !== undefined && workflow.workflow_variables.length > 0) {
        for (let varkey in workflow.workflow_variables) {
          const item = workflow.workflow_variables[varkey];
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
        for (let varkey in workflow.execution_variables) {
          const item = workflow.execution_variables[varkey];
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
        for (let parentkey in parents) {
          const item = parents[parentkey];
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
          backgroundColor: theme.palette.inputColor,
          borderRadius: theme.palette?.borderRadius,
        }}
        InputProps={{
          style: {
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
                    for (let triggerkey in workflow.triggers) {
                      const item = workflow.triggers[triggerkey];

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
                  console.log("Hovering over action: " + actionId)
                  if (node.length > 0) {
                    if (inside) {
                      console.log("Hovering over action: " + actionId)
                      node.addClass("shuffle-hover-highlight");
                    } else {
                      node.removeClass("shuffle-hover-highlight");
                    }
                  }
                };

                return (
                  <MenuItem
                    key={data.name}
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
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
    backgroundColor: theme.palette.inputColor,
  };


  // Makes a list of items the user can choose from based on previous runs
  var availableArguments = []
  if (executionArgumentModalOpen && workflowExecutions.length > 0) {
	  for (let executionKey in workflowExecutions) {
		  if (availableArguments.length > 2) {
			  break
		  }


		  const execution = workflowExecutions[executionKey]
		  if (execution.execution_argument === undefined || execution.execution_argument === null || execution.execution_argument.length < 2) {
			  continue
		  }

		  if (execution.execution_argument.includes("too large ")) {
			  continue
		  }

		  if (availableArguments.includes(execution.execution_argument)) {
			  continue
		  }


		  availableArguments.push(execution.execution_argument)
	  }
  }

  const handleAppAuthGroupCheckbox = (data) => {
    console.log("CHECKED: ", data)

	if (workflow.auth_groups === undefined || workflow.auth_groups === null) {
		workflow.auth_groups = []
	}

	const foundIndex = workflow.auth_groups.findIndex(auth => auth === data.id)
	if (foundIndex >= 0) {
		workflow.auth_groups.splice(foundIndex, 1)
	} else {
		workflow.auth_groups.push(data.id)
	}

	setWorkflow(workflow)
	console.log("WF: ", workflow)
	setUpdate(Math.random())
  }

  const authgroupModal = 
	<Dialog
      PaperComponent={PaperComponent}
      disableEnforceFocus={true}
      hideBackdrop={true}
      disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      open={authgroupModalOpen}
      PaperProps={{
        style: {
		  padding: 30,
          pointerEvents: "auto",
          color: "white",
          minWidth: isMobile ? "90%" : 800,
          border: theme.palette.defaultBorder,
        },
      }}
      onClose={() => {
      }}
    >
        <Tooltip
          title="Close window"
          placement="top"
          style={{ zIndex: 10011 }}
        >
          <IconButton
            style={{ zIndex: 5000, position: "absolute", top: 34, right: 34 }}
            onClick={(e) => {
              e.preventDefault();
			  setAuthgroupModalOpen(false)
            }}
          >
            <CloseIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
        <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
          <span style={{ color: "white" }}>Authgroup Selection</span>
        </DialogTitle>
		<DialogContent>
			<Typography variant="body1" color="textSecondary"> 
				Authgroups are a way to control how a workflow runs. If chosen, the workflow will use the groups on the nodes that have them selected. If three are chosen, the workflows runs three times. This is an experimental MSSP feature to handle multiple environments.
			</Typography>

			<Divider style={{marginTop: 10, marginBottom: 20, }}/>

	 		{authGroups.map((data, index) => {
				var checked = false
				if (workflow.auth_groups !== undefined && workflow.auth_groups !== null) {
					checked = workflow.auth_groups.includes(data.id)
				}

				if (data === undefined || data === null || data.app_auths === undefined || data.app_auths === null || data.app_auths.length === 0) {
					return null
				}

				return (
					<div 
						style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', marginLeft: '5px', cursor: "pointer", }}
						onClick={() => {
							handleAppAuthGroupCheckbox(data)
						}}
					>
					  <Checkbox
						checked={checked}
						name={data.label}
					  />

					  <Typography variant="body1" color="textSecondary" style={{minWidth: 200, maxWidth: 200, marginRight: 10, }}>
						{data.label}
					  </Typography>	

					  <Typography variant="body1" color="textSecondary" style={{minWidth: 150, maxWidth: 150, marginRight: 10, }}>
						{data.environment}
					  </Typography>	

					  {data.app_auths.map((appAuth, index) => {
							if (appAuth.app.large_image === undefined || appAuth.app.large_image === null || appAuth.app.large_image === "") {
								const foundImage = appAuthentication.find((auth) => auth.app.id === appAuth.app.id)
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
				)
			})}


			<Button
				variant="outlined"
				color="primary"
				onClick={() => {
					setAuthgroupModalOpen(false)
				}}
				style={{ marginTop: 20, marginBottom: 20 }}
			>
				Submit
			</Button>
		</DialogContent>
    </Dialog>

  const executionArgumentModal = 
	<Dialog
      PaperComponent={PaperComponent}
      disableEnforceFocus={true}
      hideBackdrop={true}
      disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      open={executionArgumentModalOpen}
      PaperProps={{
        style: {
		  padding: 30,
          pointerEvents: "auto",
          color: "white",
          minWidth: isMobile ? "90%" : 650,
          border: theme.palette.defaultBorder,
        },
      }}
      onClose={() => {
      }}
    >
        <Tooltip
          title="Close window"
          placement="top"
          style={{ zIndex: 10011 }}
        >
          <IconButton
            style={{ zIndex: 5000, position: "absolute", top: 34, right: 34 }}
            onClick={(e) => {
              e.preventDefault();
			  setExecutionArgumentModalOpen(false)
            }}
          >
            <CloseIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
        <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
          <span style={{ color: "white" }}>Provide an execution argument</span>
        </DialogTitle>
		<DialogContent>

		{workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0 ?
			<div style={{marginBottom: 5, }}>
				{workflow.input_questions.map((question, index) => {

					return (
						<div style={{marginBottom: 5}} key={index}>
							{question.name}
							<TextField
								color="primary"
								style={{backgroundColor: theme.palette.inputColor, marginTop: 5, }}
								multiLine
								maxRows={2}
								InputProps={{
									style:{
										height: "50px", 
										color: "white",
										fontSize: "1em",
									},
								}}
								fullWidth={true}
								placeholder=""
								id="emailfield"
								margin="normal"
								variant="outlined"
								onBlur={(e) => {
									var newtext = {}
									if (executionText.length > 0) {
										try {
											newtext = JSON.parse(executionText)
											// Check if list or object, then make it object only
											if (Array.isArray(newtext)) {
												newtext = {}
											}
										} catch (e) {
											console.log("Error parsing JSON: ", e)
										}
									} 

									newtext[question.value] = e.target.value
  									setExecutionText(JSON.stringify(newtext))
								}}
							/>
						</div>
					)
				})}

				<Button
					variant="outlined"
					color="primary"
					onClick={() => {
						executeWorkflow(executionText, workflow.start, lastSaved);
						setExecutionArgumentModalOpen(false)
					}}
					style={{ marginTop: 20, marginBottom: 20 }}
				>
					Run Workflow 
				</Button>
			</div>
			: 
			<div>
				<Typography variant="body1" color="textSecondary"> 
					At least one node in this workflow requires an execution argument ($exec). Please select one below, or provide a custom one in the text field next to the run button.
				</Typography>

				<Divider style={{marginTop: 10, marginBottom: 20, }}/>
				{availableArguments.length > 0 ?
					<div>
						<Typography variant="body1" style={{}}>
							Previously used arguments:
						</Typography>
						{availableArguments.map((data) => {
							return (
								<Paper style={{ padding: 10, marginTop: 10, backgroundColor: theme.palette.platformColor, maxHeight: 70, overflow: "auto", cursor: "pointer", position: "relative", }}
									onClick={() => {
										setExecutionText(data)
										executeWorkflow(data, workflow.start, lastSaved);

										setExecutionArgumentModalOpen(false)
									}}
								>
									<div style={{height: "100%", width: 2, backgroundColor: "rgba(255, 255, 255, 0.5)", position: "absolute", left: 0, top: 0}} />
									<Typography variant="body1" color="textSecondary">
										{data}
									</Typography>
								</Paper>
							)
						})}
					</div>
				: null}

				<Button
					variant="outlined"
					color="primary"
					onClick={() => {
						executeWorkflow(" ", workflow.start, lastSaved);
						setExecutionArgumentModalOpen(false)
					}}
					style={{ marginTop: 20, marginBottom: 20 }}
				>
					Run anyway 
				</Button>
			  </div>
			}
		</DialogContent>
    </Dialog>

  const submitQueryModal = () => {
	const changeActionTextfield = document.getElementById("change-action-textfield")
	if (changeActionTextfield === undefined || changeActionTextfield === null) {
		setAiQueryModalOpen(false)
		toast.error("Failed to find textfield")
		return
	}

	if (changeActionTextfield.value === undefined || changeActionTextfield.value === null || changeActionTextfield.value === "") { 
		toast("Please provide how you want formatting to happen")
		return
	}

	setAutocompleting(true)
	if (codeEditorModalOpen === true) { 
		autoFormatCodemodal(changeActionTextfield.value)
	} else {
		aiSubmit(changeActionTextfield.value, undefined, undefined, selectedAction)
	}
  }

	const autoFormatCodemodal = (input) => {
		if (codeEditorModalOpen !== true) { 
			toast.error("Code editor is not open")
			return
		}

		if (editorData.name === undefined || editorData.name === null || editorData.name === "") {
			toast.error("Failed to find editor field name")
			return
		}

		const codeeditor = document.getElementById("shuffle-codeeditor")
		if (codeeditor === undefined || codeeditor === null) {
			toast.error("Failed to find code editor html")
			return
		} 

		const editorInstance = window?.ace?.edit("shuffle-codeeditor")
		if (editorInstance === undefined || editorInstance === null) {
			toast.error("Failed to find code editor instance")
			return
		}

		//console.log("ACE data: ", editorInstance.getValue())
		//editorInstance.setValue("HELO")

		// Should try to automatically fix this input
		console.log("Running AI input fixer: ", selectedResult)
		if (aiSubmit === undefined || selectedAction === undefined) {
			toast.error("Failed to find AI submit function")
			return
		}
			
		// Should remove params from selectedAction that aren't parameterName  
		var tmpAction = JSON.parse(JSON.stringify(selectedAction))
		var tmpParams = tmpAction.parameters.filter((param) => param.name === editorData.name)
		if (tmpParams.length !== 1) {
			toast.error("Failed to find correct parameter in action")
			return
		}

		tmpParams[0].value = editorInstance.getValue() 
		tmpAction.parameters = tmpParams
		aiSubmit(input, undefined, undefined, tmpAction)
	}

  const aiQueryModal = 
    <Dialog
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      open={aiQueryModalOpen}
      PaperProps={{
        style: {
          color: "white",
          minWidth: isMobile ? "90%" : 450,
          border: theme.palette.defaultBorder,
		  padding: 50, 
		  paddingBottom: 70,

    	  borderImage: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) 1",
        },
      }}
      onClose={() => {
		  setAiQueryModalOpen(false)
      }}
    >
        <Tooltip
          title="Move window"
          placement="top"
          style={{ zIndex: 10011 }}
        >
          <IconButton
            id="draggable-dialog-title"
            style={{ 
				position: "absolute", 
				top: 4, 
				right: 34, 
				cursor: "move",
			}}
            onClick={(e) => {
            }}
          >
            <DragIndicatorIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
		<IconButton
		  style={{
			position: "absolute",
			top: 6,
			right: 6,
			color: "white",
		  }}
		  onClick={() => {
			setAiQueryModalOpen(false)
		  }}
		>
		  <CloseIcon />
		</IconButton>
        <Typography variant="h6" color="textPrimary">
			Shuffle AI	
		</Typography>
        <Typography variant="body2" color="textSecondary">
			What you write here will be fed to the Shuffle AI to generate a change for the selected action or field. Best used for when you are stuck with formatting. Uses your AI credits (resets monthly). Alpha feature. Please give feedback to support@shuffler.io {"<"}3

		</Typography>
		<TextField
			color="primary"
			autoFocus
			label={codeEditorModalOpen ? `How do you want to change the ${editorData?.name} field?` : ""}
			id="change-action-textfield"
			disabled={autoCompleting}
			minRows={1}
			maxRows={4}
			multiline
			style={{
				backgroundColor: theme.palette.inputColor, 
				marginTop: 15, 
			}}
			defaultValue={codeEditorModalOpen === true ? "" : selectedAction?.label !== undefined ? selectedAction.label.replaceAll("_", " ") : ""}
			fullWidth
			InputProps={{
				endAdornment: (
					<InputAdornment position="end">
						<Button
							color="primary"
							edge="end"
							disabled={autoCompleting}
							onClick={() => {
								submitQueryModal()
							}}
						>	
							{autoCompleting ? <CircularProgress size={20} /> : "Submit"}
							<SendIcon style={{marginLeft: 10, }}/>
						</Button>
					</InputAdornment>
				),
				onKeyPress: (e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						submitQueryModal()
					}
				},
			}}

		/>
    </Dialog>


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
		  zIndex: 10000,
        }}
      >
        Conditions can't be used for loops [ .# ]{" "}
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="/docs/workflows#conditions"
          style={{ 
			  	textDecoration: "none", 
				color: "#f85a3e",
		  }}
        >
          Learn more
        </a>
      </span>
      <FormControl>
        <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
          <span style={{ color: "white" }}>Condition</span>
        </DialogTitle>
        <DialogContent style={{}}>
          <div style={{ display: "flex" }}>
            <Tooltip
              color="primary"
              title={conditionValue.configuration ? "Opposite" : "Default"}
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
                    backgroundColor: theme.palette.surfaceColor,
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
                <MenuItem
                  style={menuItemStyle}
                  onClick={(e) => {
                    conditionValue.value = "is empty";
                    setConditionValue(conditionValue);
                    setVariableAnchorEl(null);
                  }}
                  key={"is empty"}
                >
                  is empty
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
              if (selectedEdge.conditions === undefined || selectedEdge.conditions === null) {
                selectedEdge.conditions = [data];
              } else {
                const curedgeindex = selectedEdge.conditions.findIndex(
                  (data) => data.source.id === sourceValue.id
                )
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
              if (currentedge !== undefined && currentedge !== null && label !== undefined) {
                currentedge.data("label", label)
                //.label = label;
                //oldstartnode[0].data("isStartNode", false);
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
        backgroundColor: theme.palette.surfaceColor,
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
          onClick={() => { }}
        >
          <div
            style={{
              marginLeft: "10px",
              marginTop: "5px",
              marginBottom: "5px",
              width: 2,
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
                onClick={() => { }}
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
                    backgroundColor: theme.palette.surfaceColor,
                  },
                }}
                onClose={() => {
                  setOpen(false);
                  setAnchorEl(null);
                }}
              >
                <MenuItem
                  style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                  onClick={() => {
                    duplicateCondition(index);
                  }}
                  key={"Duplicate"}
                >
                  {"Duplicate"}
                </MenuItem>
                <MenuItem
                  style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
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

    if (selectedEdge.conditions !== undefined && selectedEdge.conditions !== null && selectedEdge.conditions.length > 0) {
      injectedData = selectedEdge.conditions.map((condition, index) => {
        return ConditionHandler(condition, index);
      });
    }

		// Startnode = dest node
		const conditionsDisabled = false

    const conditionId = uuidv4();
    return (
      <div style={appApiViewStyle}>
          <div style={{ }}>
            <h3 style={{ marginBottom: 5, }}>
              Conditions 
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
          color="secondary"
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

				{/* Check if dest is the same as start */}
				{conditionsDisabled ? 
					<Typography variant="body1">
						Conditions are unavailable between triggers and the startnode.
					</Typography>
				: null}

		<div style={{position: "absolute", bottom: 15, width: "90%", margin: "auto", }}>
			
			<Button
			  style={{ margin: "auto", marginTop: "15px" }}
			  color="secondary"
			  fullWidth
			  variant="outlined"
			  onClick={() => {
				// Change Direction of the branch target/source
				const foundBranch = cy.getElementById(selectedEdge.id)
				if (foundBranch !== undefined && foundBranch !== null) {
					console.log("BRANCH: ", foundBranch)
					const source = foundBranch.data("source")
					const target = foundBranch.data("target")

					var branchdata = JSON.parse(JSON.stringify(foundBranch.data()))
					console.log("BEFORE: ", branchdata)
          console.log("Start node", workflow.start)
          const startNode = workflow.start
          if(source === startNode){
            toast("Can't point to Start Node")
          }else{
            const newid = uuidv4()
            branchdata.source = target
            branchdata.target = source
            branchdata.id = newid
            branchdata._id = newid
  
            foundBranch.remove()
  
            cy.add({
              group: "edges",
              source: target,
              target: source,
              data: branchdata,
            })
            selectedEdge.id = newid
            setSelectedEdge(selectedEdge)
            toast("Branch direction changed!")
          }
				}
			  }}
			  fullWidth
			>
        <SwapHorizIcon style={{marginRight: 10 }}/>
				Flip Branch
			</Button>
			{/*<Button
			  style={{ margin: "auto", }}
			  color="secondary"
			  fullWidth
			  variant="outlined"
			  onClick={() => {
				// Delete the branch
			  }}
			  fullWidth
			>
				Re-attach branch
			</Button>
			<Button
			  style={{ margin: "auto", }}
			  color="secondary"
			  fullWidth
			  variant="outlined"
			  onClick={() => {
				// Delete the branch
			  }}
			  fullWidth
			>
				Disable Path
			</Button>
			*/}
			<Button
			  style={{ margin: "auto", marginTop: 20, }}
			  color="secondary"
			  fullWidth
			  variant="outlined"
			  onClick={() => {
				// Delete the branch
				const foundBranch = cy.getElementById(selectedEdge.id)
			    if (foundBranch !== undefined && foundBranch !== null) {
			        foundBranch.remove()
			    }
				setConditionsModalOpen(false)
				setSelectedEdge({})
			  }}
			  fullWidth
			>
                <DeleteIcon style={{marginRight: 10, }}/>
				Delete Branch 
			</Button>
		</div>
      </div>
    );
  };

	const handleWorkflowSelectionUpdate = (e, isUserinput) => {

		if (e.target.value === undefined || e.target.value === null || e.target.value.id === undefined) {
			console.log("Returning as there's no id. Value: ", e.target.value);
			return null
		}

		const paramIndex = isUserinput === true ? 5 : 0

		console.log("USERINPUT: ", paramIndex, workflow.triggers[selectedTriggerIndex])
		if (workflow.triggers[selectedTriggerIndex].parameters[paramIndex] === undefined || workflow.triggers[selectedTriggerIndex].parameters[paramIndex] === null) { 
			workflow.triggers[selectedTriggerIndex].parameters[paramIndex] = {
				"name": "subflow",
				"value": "",
			}
		}

		setUpdate(Math.random());
		workflow.triggers[selectedTriggerIndex].parameters[paramIndex].value = e.target.value.id;
		setSubworkflow(e.target.value);

		// Sets the startnode
		if (e.target.value.id !== workflow.id && e.target.value.id.length > 0 ) {

			const startnode = e?.target?.value?.actions?.find((action) => action.id === e.target.value.start);
			

			if (startnode !== undefined && startnode !== null) {
				setSubworkflowStartnode(startnode);

				if (paramIndex === 0) { 
					try {
						workflow.triggers[selectedTriggerIndex].parameters[3].value = startnode.id;
					} catch {
						workflow.triggers[selectedTriggerIndex].parameters[3] = {
							name: "startnode",
							value: startnode.id,
						};
					}
				}

				//setWorkflow(workflow);
			}
		} else {
			console.log("WORKFLOW: ", workflow);
		}

		setWorkflow(workflow);
	}
  // Function to transform the data
  const transformAuthData = (authData) => {
    const transformedData = {};

    let subflowId = workflow.triggers[selectedTriggerIndex].parameters[0].value;

    // get the apps used in "find your workflow"
    if (subflowId === "" && subflowId === undefined && subflowId === null) {
      console.log("subflow is empty")
      return {};
    }

    let workflowApps = usedSubflowApps;

    if (workflowApps === undefined || workflowApps === null) {
      console.log("workflow apps is empty");
      return {};
    }

    // get the app ids
    // let appIdsInWorkflow = [...new Set(workflowApps.map(app => app.app_id))];
    let appIdsInWorkflow = [];

    Object.entries(workflowApps).forEach(([key, value]) => {
      appIdsInWorkflow.push(value.app_id);
    })

    appIdsInWorkflow = [...new Set(appIdsInWorkflow)];
    
    // loop through the authData and create transformedData which looks like:
    // appId: [auth1, auth2, ...]
    authData.forEach((auth) => {
      const { app } = auth;
      const appId = app.id;

      // check if the app is used in the workflow
      if (appIdsInWorkflow.includes(appId)) {
        if (transformedData[appId] === undefined) {
          transformedData[appId] = [];
        }

        transformedData[appId].push(auth);
      }

    });

    return transformedData;
    
  };

  const AppAuthSelector = ({ appAuthData }) => {
    const [selectedAuth, setSelectedAuth] = useState("");
    const [transformedAuthData, setTransformedAuthData] = useState({});

    useEffect(() => {
      setTransformedAuthData(transformAuthData(appAuthData));
    }, [appAuthData, selectedAuth]);

    const handleShowingValue = (appName) => {
      let mappingWithName = {}
      let listWithValues = workflow.triggers[selectedTriggerIndex].parameters[5]?.value.split(";").filter(e => e).map(e => e.split("="))
      if (listWithValues === undefined || listWithValues === null || listWithValues.length === 0) {
        return "no-overrides";
      }

      for (let i = 0; i < listWithValues.length; i++) {
        mappingWithName[listWithValues[i][0]] = listWithValues[i][1]
      }

      if (mappingWithName[appName] !== undefined) {
        return mappingWithName[appName];
      }
      
      return "no-overrides";
    }

    const handleSelectChange = (appName, appId, event) => {
      const authId = event.target.value || "no-override";

      if (authId === "no-override") {
        // remove the override parameter
        let oldValue = workflow.triggers[selectedTriggerIndex].parameters[5].value;      
        // replace from appName= to the next ;
        let newValue = oldValue.replace(new RegExp(appName + "=[^;]*;"), "");
   
        workflow.triggers[selectedTriggerIndex].parameters[5].value = newValue
        setSelectedAuth("");
        return
      }

      const auth = transformedAuthData[appId].find((auth) => auth.id === authId);

      if (auth === undefined) {
        setSelectedAuth("");
        return;
      }

      // // check if the trigger already has an override parameter
      // for (let i = 0; i < workflow.triggers[selectedTriggerIndex].parameters.length; i++) {
      //   // if name includes the app id
      //   if (workflow.triggers[selectedTriggerIndex].parameters[i].name.includes(appId + "_override")) {
      //     // update the value
      //     workflow.triggers[selectedTriggerIndex].parameters[i].value = auth.id;
      //     setSelectedAuth(auth.id);
      //     return;
      //   }
      // }
    
    if (workflow.triggers[selectedTriggerIndex].parameters[5] === undefined || workflow.triggers[selectedTriggerIndex].parameters[5] === null) {
      workflow.triggers[selectedTriggerIndex].parameters[5] = {
        name: "auth_override",
        value: "",
      };
    }
      
     let authGroupValue = workflow.triggers[selectedTriggerIndex].parameters[5].value;

     if (authGroupValue === undefined || authGroupValue === null || authGroupValue === "") {
        workflow.triggers[selectedTriggerIndex].parameters[5].value = appName + "=" + auth.id + ";";
     } else {
        // check if the app is already in the list
        if (authGroupValue.includes(appName)) {
          let oldValue = workflow.triggers[selectedTriggerIndex].parameters[5].value;
          let newValue = oldValue.replace(new RegExp(appName + "=[^;]*;"), appName + "=" + auth.id + ";");
          workflow.triggers[selectedTriggerIndex].parameters[5].value = newValue;
        } else {
          workflow.triggers[selectedTriggerIndex].parameters[5].value += appName + "=" + auth.id + ";";
        }
     }

      // workflow.triggers[selectedTriggerIndex].parameters.push({
      //   name: auth.label + "_" + auth.app.id + "_override",
      //   value: auth.id,
      // });
      setSelectedAuth(auth.id);
    }

    return (
    <div className="auth-container" style={{ padding: '20px', backgroundColor: '#26292D', borderRadius: '8px' }}>
      {Object.entries(transformedAuthData).map(([appId, authList]) => {
		  if (authList === undefined || authList === null || authList.length < 2) {
			  return null;
		  }

		  return (
        <div key={appId} className="auth-item" style={{ marginBottom: '20px' }}>
          <label className="auth-label" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#E8E8E8' }}>
            {authList[0].app.name} Authentication:
          </label>
          <select 
            value={handleShowingValue(authList[0].app.name)}
            onChange={(e) => handleSelectChange(authList[0].app.name, authList[0].app.id, e)}
            className="auth-select"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: theme.palette.inputColor,
              color: '#E8E8E8',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#007BFF'}
            onBlur={(e) => e.target.style.borderColor = '#555'}
          >
            <option value="no-override">No override</option>
            {authList.flatMap((auth) => 
              <option 
                key={auth.id}
                value={auth.id}
                style={{
                  backgroundColor: theme.palette.inputColor,
                  fontSize: "1.2em",
                }}
              >
                {auth.label}
              </option> 
            )}
          </select>
        </div>
      )})}
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
        for (let varkey in workflow.workflow_variables) {
          const item = workflow.workflow_variables[varkey];
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
        for (let varkey in workflow.execution_variables) {
          const item = workflow.execution_variables[varkey];
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
        for (let parentkey in parents) {
          const item = parents[parentkey];
          if (item.label === "Execution Argument") {
            continue;
          }

          var exampledata = item.example === undefined ? "" : item.example;
          // Find previous execution and their variables
          if (workflowExecutions.length > 0) {
            // Look for the ID
            for (let execkey in workflowExecutions) {
              if (
                workflowExecutions[execkey].results === undefined ||
                workflowExecutions[execkey].results === null
              ) {
                continue;
              }

              var foundResult = workflowExecutions[execkey].results.find(
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
        workflow.triggers[selectedTriggerIndex].parameters[5] = {
          name: "auth_override",
          value: "",
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

      
	  const subflowtypes = [
		  {
			name: "Any",
	  	  },
		  {
			name: "Enrich",
	  	  }
	  ]

      return (
        <div style={appApiViewStyle}>
		  <span style={{display: "flex", }}>
		    <h3 style={{ marginBottom: "5px", flex: 3, }}>
		      {selectedTrigger.app_name}
		    </h3>
		  	<Tooltip title="Choose the type of subflow to run. This is NOT required, but is used to help Shuffle's workflow generators better understand the workflow." placement="top">
				<Select
				  MenuProps={{
					disableScrollLock: true,
				  }}
				  value={selectedTrigger.tags !== undefined && selectedTrigger.tags !== null && selectedTrigger.tags.length > 0 ? selectedTrigger.tags[0] : "Any"}
				  onChange={(event) => {
					  if (selectedTrigger.tags === undefined || selectedTrigger.tags === null) {
						  selectedTrigger.tags = [event.target.value]
					  } else {
						  if (selectedTrigger.tags.includes(event.target.value)) {
							  return
						  } 

						  if (selectedTrigger.tags.length > 0) {
							  selectedTrigger.tags = []
						  }

						  selectedTrigger.tags.push(event.target.value)
					  }

					  setSelectedTrigger(selectedTrigger)
					  setUpdate(Math.random())
				  }}
				  style={{
					marginTop: 10,
					flex: 1, 
					backgroundColor: theme.palette.inputColor,
					color: "white",
					height: 35,
					marginleft: 10,
					borderRadius: theme.palette?.borderRadius,
				    color: "rgba(255,255,255,0.4)",
				  }}
				  SelectDisplayProps={{
					style: {
					},
				  }}
				>
				  {subflowtypes.map((data, index) => {
					return (
					  <MenuItem
						key={index}
						style={{
						  backgroundColor: theme.palette.inputColor,
						  color: "white",
						}}
						value={data.name}
					  >
						{data.name}
					  </MenuItem>
					);
				  })}
				</Select>
		    </Tooltip>
		  </span>
	  	  <a
			rel="noopener noreferrer"
			target="_blank"
			href="https://shuffler.io/docs/triggers#subflow"
			style={{ textDecoration: "none", color: "#f85a3e" }}
		  >
			What are subflows?
		  </a>
          <Divider
            style={{
              marginBottom: "10px",
              marginTop: "10px",
              height: "1px",
              width: "100%",
              backgroundColor: "rgb(91, 96, 100)",
            }}
          />
          <div style={{ display: "flex" }}>
            <div style={{ flex: 5 }}>
              <Typography>Name</Typography>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
                  },
                }}
                fullWidth
                color="primary"
                placeholder={selectedTrigger.label}
                onChange={selectedTriggerChange}
              />
            </div>
            <div>
              <div style={{ flex: 1, marginLeft: 5, }}>
                <Tooltip
                  color="primary"
                  title={"Delay before action runs (in seconds)"}
                  placement="top"
                >
                  <span>
                    <Typography>Delay</Typography>
                    <TextField
                      style={{
                        backgroundColor: theme.palette.inputColor,
						maxWidth: 50,
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
                  const newvalue = workflow.triggers[selectedTriggerIndex].parameters[4] === undefined || workflow.triggers[selectedTriggerIndex].parameters[4].value === "false"? "true" : "false";
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
          <div style={{ flex: "6", marginTop: 10, }}>
            <div>
              <div style={{ display: "flex" }}>
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
                  <div style={{ marginLeft: 5, flex: 1 }}>
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
				  freeSolo
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
                    borderRadius: theme.palette?.borderRadius,
                  }}
                  onChange={(event, newValue) => {
                    setLastSaved(false)
                    console.log("Found value: ", newValue)

					var parsedinput = { target: { value: newValue } }

					// For variables
					if (typeof newValue === 'string' && newValue.startsWith("$")) {
						parsedinput = { 
							target: { 
								value: {
									"name": newValue, 
									"id": newValue,
									"actions": [],
									"triggers": [],
								} 
							} 
						}
					}

                    handleWorkflowSelectionUpdate(parsedinput)
                  }}
            	  renderOption={(props, data, state) => {
                    if (data.id === workflow.id) {
                      data = workflow;
                    }

                    //key={index}
                    return (
                      <Tooltip arrow placement="left" title={
                        <span style={{}}>
                          {data.image !== undefined && data.image !== null && data.image.length > 0 ?
                            <img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} />
                            : null}
                          <Typography>
                            Choose Subflow '{data.name}'
                          </Typography>
                        </span>
                      }>
                        <MenuItem
                          style={{
                            backgroundColor: theme.palette.inputColor,
                            color: data.id === workflow.id ? "red" : "white",
                          }}
                          value={data}
						  onClick={() => {	
              				getWorkflowApps(data.id);
							handleWorkflowSelectionUpdate({
								target: {
									value: data
								}
							})
						  }}
                        >
						  <PolylineIcon style={{ marginRight: 8 }} />
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
                          borderRadius: theme.palette?.borderRadius,
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
                      if (option === undefined || option === null || option.label === undefined || option.label === null) {
                        if (option.length === 36) {

                        }

                        return "Default";
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
                      borderRadius: theme.palette?.borderRadius,
                    }}
                    onChange={(event, newValue) => {
      				        setLastSaved(false)
                      handleSubflowStartnodeSelection({ target: { value: newValue } })
                    }}
            		renderOption={(props, action, state) => {
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
						  onClick={() => {
                      		handleSubflowStartnodeSelection({ 
								target: { 
									value: action 
								} 
							})
						  }}
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
                            borderRadius: theme.palette?.borderRadius,
                          }}
                          {...params}
                          label="Select a start-node (optional)"
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
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
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
      			  setLastSaved(false)

                  workflow.triggers[selectedTriggerIndex].parameters[1].value = e.target.value
                  setWorkflow(workflow)
                }}
              />
              {!showDropdown ? null :
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
                      for (let triggerkey in workflow.triggers) {
                        const item = workflow.triggers[triggerkey];
      
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
                  console.log("Found example data: ", innerdata.example)
                  if (typeof innerdata.example === "object") {
                    parsedPaths = GetParsedPaths(innerdata.example, "");
                  }
      
                  const coverColor = "#82ccc3"
      
                  return parsedPaths.length > 0 ? (
                    <span>
                    {/*
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
                            onMouseOver={() => { }}
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
                    */}
      
                    <NestedMenuItem
                      key={innerdata.name}
                      label={
                        <div style={{ display: "flex", marginLeft: 0, }}>
                          {icon} {innerdata.name}
                        </div>
                      }
                      parentMenuOpen={!!menuPosition}
                      style={{
                        color: "white",
                        minWidth: 250,
                        maxWidth: 250,
                        maxHeight: 50,
                        overflow: "hidden",
                      }}
                      onClick={() => {
                        console.log("CLICKED: ", innerdata);
                        console.log(innerdata.example)
                        handleItemClick([innerdata]);
                      }}
                    >
                      <Paper style={{minHeight: 500, maxHeight: 500, minWidth: 275, maxWidth: 275, position: "fixed", top: menuPosition.top-200, left: menuPosition.left-455, padding: "10px 0px 10px 10px", backgroundColor: theme.palette.inputColor, overflow: "hidden", overflowY: "auto", border: "1px solid rgba(255,255,255,0.3)",}}>
      
                        <MenuItem
                          key={innerdata.name}
                          style={{
                            backgroundColor: theme.palette.inputColor,
                            marginLeft: 15,
                            color: "white",
                            minWidth: 250,
                            maxWidth: 250,
                            padding: 0, 
                            position: "relative",
                          }}
                          value={innerdata}
                          onMouseOver={() => {
                            //console.log("HOVER: ", pathdata);
                          }}
                          onClick={() => {
                            handleItemClick([innerdata]);
                          }}
                        >
                          <Typography variant="h6" style={{paddingBottom: 5}}>
                            {innerdata.name}
                          </Typography>
                        </MenuItem>
      
                        {parsedPaths.map((pathdata, index) => {
                          // FIXME: Should be recursive in here
                          //<VpnKeyIcon style={iconStyle} />
                          const icon =
                            pathdata.type === "value" ? (
                              <span style={{marginLeft: 9, }} />
                            ) : pathdata.type === "list" ? (
                              <FormatListNumberedIcon style={{marginLeft: 9, marginRight: 10, }} />
                            ) : (
                              <CircleIcon style={{marginLeft: 9, marginRight: 10, color: coverColor}}/>
                            );
                          //<ExpandMoreIcon style={iconStyle} />
      
                          const indentation_count = (pathdata.name.match(/\./g) || []).length+1
                          const baseIndent = <div style={{marginLeft: 20, height: 30, width: 1, backgroundColor: coverColor,}} />
                          //const boxPadding = pathdata.type === "object" ? "10px 0px 0px 0px" : 0
                          const boxPadding = 0 
                          const namesplit = pathdata.name.split(".")
                          const newname = namesplit[namesplit.length-1]
                          return (
                            <MenuItem
                              key={pathdata.name}
                              style={{
                                backgroundColor: theme.palette.inputColor,
                                color: "white",
                                minWidth: 250,
                                maxWidth: 250,
                                padding: boxPadding, 
                              }}
                              value={pathdata}
                              onMouseOver={() => {
                                //console.log("HOVER: ", pathdata);
                              }}
                              onClick={() => {
                                handleItemClick([innerdata, pathdata]);
                              }}
                            >
                              <Tooltip
                                color="primary"
                                title={`Ex. value: ${pathdata.value}`}
                                placement="left"
                              >
                                <div style={{ display: "flex", height: 30, }}>
                                  {Array(indentation_count).fill().map((subdata, subindex) => {
                                    return (
                                      baseIndent
                                    )
                                  })}
                                  {icon} {newname} 
                                  {pathdata.type === "list" ? <SquareFootIcon style={{marginleft: 10, }} onClick={(e) => {
      
                                  }} /> : null}
                                </div>
                              </Tooltip>
                            </MenuItem>
                          );
                        })}
                      </Paper>
                    </NestedMenuItem>
                    </span>
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
               }
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
										borderRadius: theme.palette?.borderRadius,
									}}
									InputProps={{
										style: {
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

          <div>
            <div>
            <div className="app">
              <div style={{ display: "flex", marginTop: 50 }}>
                <div style={{ flex: "10" }}>
                  <b>Authentication Override</b>
                </div>
              </div>

              <div style={{ display: "flex", marginTop: 10 }}>
                <div style={{ flex: "10", marginLeft: 10 }}>
                  <AppAuthSelector appAuthData={appAuthentication} />
                </div>
              </div>
            </div>
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
		  <h3 style={{ marginBottom: "5px" }}>Comment</h3>
		  <a
			rel="noopener noreferrer"
			target="_blank"
			href="https://shuffler.io/docs/workflows#comments"
			style={{ textDecoration: "none", color: "#f85a3e" }}
		  >
			What are comments?
		  </a>
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
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
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
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
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
            <div style={{ marginLeft: 5 }}>
              <div>Width</div>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
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
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
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
            <div style={{ marginLeft: 5 }}>
              <div>Text Color</div>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
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
          <div style={{ marginTop: 15, }}>Background-Image</div>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
              },
            }}
            fullWidth
            color="primary"
            placeholder={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr69kkDcJiR4Vm59ypxhGkD1JDIV0oLVDiBQ&usqp=CAU"}
            defaultValue={selectedComment["backgroundimage"]}
            onChange={(event) => {
              selectedComment.backgroundimage = event.target.value;
              console.log("Comment: ", selectedComment)
              setSelectedComment(selectedComment);
            }}
          />
        </div>
      );
    }

    return null;
  };

  // Special SCHEDULE handler
  var trigger_header_auth = ""
  if (Object.getOwnPropertyNames(selectedTrigger).length > 0 && workflow.triggers !== null && workflow.triggers !== undefined && workflow.triggers.length >= selectedTriggerIndex && workflow.triggers[selectedTriggerIndex] !== undefined ) {
      if (selectedTrigger.trigger_type === "SCHEDULE" && workflow.triggers[selectedTriggerIndex].parameters === undefined || workflow.triggers[selectedTriggerIndex].parameters === null) {
	    console.log("Autofixing schedule")

        workflow.triggers[selectedTriggerIndex].parameters = [];
        workflow.triggers[selectedTriggerIndex].parameters[0] = {
          name: "cron",
          value: isCloud ? "*/25 * * * *" : "60",
        };
        workflow.triggers[selectedTriggerIndex].parameters[1] = {
          name: "execution_argument",
          value: '{"name": "value"}',
        };
        setWorkflow(workflow);
      } else if (selectedTrigger.trigger_type === "WEBHOOK") {
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
      	  workflow.triggers[selectedTriggerIndex].parameters[4] = {
      	    name: "await_response",
      	    value: "v1",
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

      	trigger_header_auth =
      	  workflow.triggers[selectedTriggerIndex].parameters.length > 2
      	    ? workflow.triggers[selectedTriggerIndex].parameters[2].value
      	    : "";
	  	}else if(
        selectedTrigger.trigger_type === "USERINPUT"
      ){
        if (
          workflow.triggers[selectedTriggerIndex].parameters === undefined ||
          workflow.triggers[selectedTriggerIndex].parameters === null ||
          workflow.triggers[selectedTriggerIndex].parameters.length === 0
        ) {
          workflow.triggers[selectedTriggerIndex].parameters = [];
          workflow.triggers[selectedTriggerIndex].parameters[0] = {
            name: "alertinfo",
            value: "Do you want to continue the workflow? Start parameters: $exec",
          };
  
          // boolean,
          workflow.triggers[selectedTriggerIndex].parameters[1] = {
            name: "options",
            value: "boolean",
          };
  
          // email,sms,app ...
          workflow.triggers[selectedTriggerIndex].parameters[2] = {
            name: "type",
            value: "subflow",
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
      }
  }

  const WebhookSidebar = Object.getOwnPropertyNames(selectedTrigger).length === 0 || workflow.triggers[selectedTriggerIndex] === undefined || selectedTrigger.trigger_type !== "WEBHOOK" ? null :
        <div style={appApiViewStyle}>
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
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
              },
            }}
            fullWidth
            color="primary"
            placeholder={selectedTrigger.label}
            onChange={selectedTriggerChange}
          />
          {apps !== undefined && apps !== null && apps.length > 0 ?
            <div style={{ marginTop: 35, }}>
              <Autocomplete
                id="action_search"
                autoHighlight
                value={selectedTrigger.app_association}
                classes={{ inputRoot: classes.inputRoot }}
                ListboxProps={{
                  style: {
                    backgroundColor: theme.palette.inputColor,
                    color: "white",
                  },
                }}
                filterOptions={(options, { inputValue }) => {
                  const lowercaseValue = inputValue.toLowerCase()
                  options = options.filter(x => x.name.replaceAll("_", " ").toLowerCase().includes(lowercaseValue) || x.description.toLowerCase().includes(lowercaseValue))

                  return options
                }}
                getOptionLabel={(option) => {
                  if (
                    option === undefined ||
                    option === null ||
                    option.name === undefined ||
                    option.name === null
                  ) {
                    return null;
                  }

                  const newname = (
                    option.name.charAt(0).toUpperCase() + option.name.substring(1)
                  ).replaceAll("_", " ");

                  return newname;
                }}
                options={sortByKey(apps, "name")}
                fullWidth
                style={{
                  backgroundColor: theme.palette.inputColor,
                  height: 50,
                  borderRadius: theme.palette?.borderRadius,
                }}
                onChange={(event, newValue) => {
                  // Workaround with event lol
                  console.log("CHANGE: ", event, newValue)
                  if (newValue !== undefined && newValue !== null) {
                    var parsedvalue = JSON.parse(JSON.stringify(newValue))
                    parsedvalue.actions = []
                    parsedvalue.authentication = {}
                    selectedTrigger.app_association = parsedvalue
                    setUpdate(Math.random());
                  }
                }}
            	renderOption={(props, app, state) => {
                  var appname = app.name.replaceAll("_", " ")
                  appname = appname.charAt(0).toUpperCase() + appname.substring(1)

                  return (
                    <Tooltip
                      color="secondary"
                      title={appname}
                      placement="left"
                    >
                      <MenuItem 
					  	onClick={() => {
							console.log("CLICK: ", app)
							const newValue = app

                  			if (newValue !== undefined && newValue !== null) {
                  			  var parsedvalue = JSON.parse(JSON.stringify(newValue))
                  			  parsedvalue.actions = []
                  			  parsedvalue.authentication = {}
                  			  selectedTrigger.app_association = parsedvalue
                  			  selectedTrigger.large_image = app.large_image

							  if (cy !== undefined && cy !== null) {
								  const foundnode = cy.getElementById(selectedTrigger.id)
								  if (foundnode !== undefined && foundnode !== null) {
									  foundnode.data("large_image", app.large_image)
								  }
							  }

                  			  setUpdate(Math.random());
                  			}
                        document.activeElement.blur();
						}}
					  >
                        <div style={{ display: "flex", marginBottom: 0, }}>
                          <Avatar variant="rounded">
                            <img
                              alt={appname}
                              src={app.large_image}
                              style={{ width: 50, height: 50, }}
                            />
                          </Avatar>
                          <Typography variant="body1" style={{ marginLeft: 15, }}>
                            {appname}
                          </Typography>
                        </div>
                      </MenuItem>
                    </Tooltip>
                  )
                }}
                renderInput={(params) => {
                  return (
                    <TextField
                      color="primary"
                      variant="body1"
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        borderRadius: theme.palette?.borderRadius,
                      }}
                      {...params}
                      label="Find Associated App (optional)"
                      variant="outlined"
                    />
                  );
                }}
              />

            </div>
            : null}
          {selectedTrigger.status === "running" ? null :
            <div style={{ marginTop: 20 }}>
              <Typography>Environment</Typography>
              <Select
                MenuProps={{
                  disableScrollLock: true,
                }}
                value={selectedTrigger.environment === undefined || selectedTrigger.environment === null || selectedTrigger.environment === "" ? 
					environments?.find((env) => {
						if (env.archived) {
							return false
						}

						if (env.name === "cloud" || env.type === "cloud") {
							return false 
						}


						return true 
					}).name
				: selectedTrigger.environment}
                disabled={selectedTrigger.status === "running"}
                SelectDisplayProps={{
                  style: {
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
                  backgroundColor: theme.palette.inputColor,
                  color: "white",
                  height: 50,
                }}
              >
                {triggerEnvironments.map((data) => {
                  if (data.archived) {
                    return null
                  }

                  return (
                    <MenuItem
                      key={data}
                      style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                      value={data}
                    >
                      {data}
                    </MenuItem>
                  );
                })}
              </Select>
            </div>
          }
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
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                id="webhook_uri_field"
                onClick={() => {
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
                  },
                  endAdornment:
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Copy webhook"
                        onClick={() => {
                          var copyText = document.getElementById("webhook_uri_field");
                          if (copyText !== undefined && copyText !== null) {
                            console.log("NAVIGATOR: ", navigator);
                            const clipboard = navigator.clipboard;
                            if (clipboard === undefined) {
                              toast("Can only copy over HTTPS (port 3443)");
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
                            toast("Copied Webhook URL");
                          } else {
                            console.log("Couldn't find webhook URI field: ", copyText);
                          }
                        }}
                        edge="end"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </InputAdornment>
                }}
                fullWidth
                disabled
                value={
                  workflow.triggers[selectedTriggerIndex].parameters[0].value
                }
                color="primary"
                placeholder="10"
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
                    backgroundColor: theme.palette.inputColor,
                    borderRadius: theme.palette?.borderRadius,
                  }}
                  id="webhook_uri_header"
                  onClick={() => { }}
                  InputProps={{
                    style: {
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
              <div style={{ marginBottom: 20, }}>
                <TextField
                  style={{
                    backgroundColor: theme.palette.inputColor,
                    borderRadius: theme.palette?.borderRadius,
                  }}
                  id="webhook_uri_header"
                  onClick={() => { }}
                  InputProps={{
                    style: {
                    },
                  }}
                  fullWidth
                  multiline
                  rows="2"
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
			{workflow.triggers[selectedTriggerIndex].parameters.length > 4 ? 
				<FormGroup
					style={{ paddingLeft: 10, backgroundColor: theme.palette.inputColor, marginBottom: 50,  }}
					row
				>
				<FormControlLabel
					control={
						<Checkbox
							checked={workflow.triggers[selectedTriggerIndex].parameters[4].value.includes("v2")}
							disabled={selectedTrigger.status === "running"}
							onChange={(e) => {
								if (selectedTrigger.parameters === null) {
									selectedTrigger.parameters = [];
								}

								// Sets the webhook to run as version 2.. kinda
								var value = "v2"
								if (workflow.triggers[selectedTriggerIndex].parameters[4].value.includes("v2")) {
									value = "v1"
								}

								workflow.triggers[selectedTriggerIndex].parameters[4] = {
									name: "await_response",
									value: value
								}

								setWorkflow(workflow)
								setUpdate(Math.random())
							}}
							color="primary"
							value="await_response"
						/>
					}
					label={<div style={{ color: "white" }}>Wait For Response</div>}
				/>
			</FormGroup>
		: null}
						</div>
          </div>
        </div>

  const stopMailSub = (trigger, triggerindex) => {
    // DELETE
    if (trigger.id === undefined) {
      return;
    }

    toast("Stopping mail trigger");
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
          toast("Successfully stopped trigger");
          // Set the status
          workflow.triggers[triggerindex].status = "stopped";
          trigger.status = "stopped";
          setWorkflow(workflow);
          setSelectedTrigger(trigger);
          saveWorkflow(workflow);
        } else {
          toast("Failed stopping trigger: " + responseJson.reason);
        }
      })
      .catch((error) => {
        //toast(error.toString());
        console.log("Stop mailsub error: ", error.toString());
      });
  };

  const newWebhook = (trigger) => {
    const hookname = trigger.label;
    if (hookname.length === 0) {
      toast("Missing name");
      return;
    }

    if (trigger.id.length !== 36) {
      toast("Missing id");
      return;
    }

    // Check the node it's connected to
    var startNode = workflow.start;
    const branch = workflow.branches.find(
      (branch) => branch.source_id === trigger.id
    );
    if (branch === undefined && (workflow.start === undefined || workflow.start === null || workflow.start.length === 0)) {
      toast("No webhook node defined");
    }

    toast("Starting webhook");
    if (branch !== undefined) {
      startNode = branch.destination_id;
    }

    const param = trigger.parameters.find((param) => param.name === "auth_headers");
    var auth = "";
    if (param !== undefined && param !== null) {
      auth = param.value;
    }


		// Version: v2 = await response for 30 sec
    const await_resp = trigger.parameters.find((param) => param.name === "await_response");
    var version = "";
    if (await_resp !== undefined && await_resp !== null) {
      version = await_resp.value;
    }

    const customRespParam = trigger.parameters.find(
      (param) => param.name === "custom_response_body"
    )
    var custom_response = "";
    if (customRespParam !== undefined && customRespParam !== null) {
      custom_response = customRespParam.value;
    }

    const data = {
      name: hookname,
      type: "webhook",
      id: trigger.id,
      workflow: workflow.id,
      start: startNode,
      environment: trigger.environment,
      auth: auth,
      custom_response: custom_response,
			version: version,
			version_timeout: 15,
    };

		console.log("Trigger data: ", data)

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
          trigger.status = "running";
          setSelectedTrigger(trigger);
          workflow.triggers[selectedTriggerIndex].status = "running";
          setWorkflow(workflow);
          saveWorkflow(workflow);
        } else {
          toast("Failed starting webhook: " + responseJson.reason);
        }
      })
      .catch((error) => {
        //console.log(error.toString());
        console.log("New webhook error: ", error.toString());
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
        if (!responseJson.success) {
          if (responseJson.reason !== undefined) {
            toast("Failed to stop webhook: " + responseJson.reason);
          }
        } else {
          toast("Successfully stopped webhook");
        }
        if (workflow.triggers[triggerindex] !== undefined) {
          workflow.triggers[triggerindex].status = "stopped";
        }
        trigger.status = "stopped";
        setSelectedTrigger(trigger);
        setWorkflow(workflow);
        saveWorkflow(workflow);
        setSelectedTrigger({})
   
      })
      .catch((error) => {
        //toast(error.toString());
        toast(
          "Delete webhook error. Contact support or check logs if this persists.",
        );
      });
  };
  

  // POST to /api/v1/workflows
  const createWorkflow = (workflow, trigger_index) => {
	  fetch(globalUrl + "/api/v1/workflows", {
		  method: "POST",
		  headers: {
			  "Content-Type": "application/json",
		  },
		  body: JSON.stringify(workflow),
		  credentials: "include",
	  })
	  .then((response) => {
		  if (response.status === 200) {
			  getAvailableWorkflows(trigger_index) 
		  }

		  return response.json();
	  })
	  .then((responseJson) => {
		  if (responseJson.id !== undefined && responseJson.id !== null && responseJson.id.length > 0) {
			  toast("Successfully created workflow");

              handleWorkflowSelectionUpdate({ target: { value: responseJson } }, true)
		  }
	  })
	  .catch((error) => {
		  console.log("Create workflow error: ", error.toString())
	  })
  }

  const UserinputSidebar = Object.getOwnPropertyNames(selectedTrigger).length === 0 || workflow.triggers[selectedTriggerIndex] === undefined || selectedTrigger.trigger_type !== "USERINPUT" ? null :
        <div style={appApiViewStyle}>
		  <h3 style={{ marginBottom: "5px" }}>
			{selectedTrigger.app_name}
		  </h3>
		  <a
			rel="noopener noreferrer"
			target="_blank"
			href="https://shuffler.io/docs/triggers#user_input"
			style={{ textDecoration: "none", color: "#f85a3e" }}
		  >
			What is the user input trigger?
		  </a>
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
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
              },
            }}
            fullWidth
            color="primary"
            placeholder={selectedTrigger.label}
            onChange={selectedTriggerChange}
          />

          {/*<div style={{ marginTop: "20px" }}>
            Environment:
            <TextField
              style={{
                backgroundColor: theme.palette.inputColor,
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
              required
              disabled
              fullWidth
              color="primary"
              value={selectedTrigger.environment}
            />
          </div>
					*/}
          <div style={{ flex: "6", marginTop: 10, }}>
            <div
              style={{
                marginTop: "20px",
                marginBottom: "7px",
                display: "flex",
              }}
            >
              <div style={{ flex: "10" }}>
                <b>Information</b>
		  		<Typography variant="body2" color="textSecondary">
		  			The information you want to show the user. Supports variables.
		  		</Typography>
              </div>
            </div>
            <TextField
              style={{
                backgroundColor: theme.palette.inputColor,
                borderRadius: theme.palette?.borderRadius,
              }}
              InputProps={{
                style: {
                },
              }}
              fullWidth
              rows="4"
              multiline
              defaultValue={
				workflow.triggers !== undefined && workflow.triggers !== null && workflow.triggers[selectedTriggerIndex].parameters !== undefined && workflow.triggers[selectedTriggerIndex].parameters.length > 0  && workflow.triggers[selectedTriggerIndex].parameters[0] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[0].value !== undefined ? workflow.triggers[selectedTriggerIndex].parameters[0].value : ""
              }
              color="primary"
              placeholder=""
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
              <div style={{ flex: "10" }}>
                <b>Input options</b>
			    <Typography variant="body2" color="textSecondary">
			      Use subflows to connect to any app you want, or use the default email and sms options
			    </Typography>
              </div>
            </div>
            <FormGroup
              style={{ paddingLeft: 10, backgroundColor: theme.palette.inputColor }}
              row
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("subflow")}
                    onChange={() => {
                      setTriggerOptionsWrapper("subflow");
                    }}
                    color="primary"
                    value="subflow"
                  />
                }
                label={<div style={{ color: "white" }}>Subflow</div>}
              />
              <FormControlLabel
                control={
                  <Checkbox
					disabled={!isCloud}
                    checked={
                      workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("email")
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
					disabled={!isCloud}
                    checked={workflow.triggers !== undefined && workflow.triggers !== null && workflow.triggers[selectedTriggerIndex].parameters !== undefined && workflow.triggers[selectedTriggerIndex].parameters.length > 0  && workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value !== undefined ? workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("sms") : false}
                    onChange={() => {
                      setTriggerOptionsWrapper("sms");
                    }}
                    color="primary"
                    value="sms"
										disabled={true}
                  />
                }
                label={<div style={{ color: "white" }}>SMS</div>}
              />
            </FormGroup>
			{workflow.triggers[selectedTriggerIndex].parameters[2] !== undefined && workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("subflow") ? (
			<div style={{  }}>
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
              	      if (option === undefined || option === null || option.name === undefined || option.name === null) {
              	        return "No Workflow Selected";
              	      }

              	      const newname = (option.name.charAt(0).toUpperCase() + option.name.substring(1)).replaceAll("_", " ");
              	      return newname;
              	    }}
              	    options={
						[{
							"id": "",
							"name": "No Workflow Selected",
						}].concat(workflows)
					}
              	    fullWidth
              	    style={{
              	      backgroundColor: theme.palette.inputColor,
              	      height: 50,
              	      borderRadius: theme.palette?.borderRadius,
						marginTop: 15,
						marginBottom: 15,
              	    }}
              	    onChange={(event, newValue) => {
					  console.log("Changed autocomplete!")
              	      handleWorkflowSelectionUpdate({ target: { value: newValue } }, true)
                      event.target.blur();
              	    }}
            		renderOption={(props, data, state) => {
              	      if (data.id === workflow.id) {
              	        data = workflow;
              	      }

              	      return (
              	        <Tooltip arrow placement="left" title={
              	          <span style={{}}>
              	            {data.image !== undefined && data.image !== null && data.image.length > 0 ?
              	              <img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} />
              	              : null}
              	            <Typography>
              	              Choose Trigger '{data.name}'
              	            </Typography>
              	          </span>
              	        }>
              	          <MenuItem
              	            style={{
              	              color: data.id === workflow.id ? "red" : "white",
              	            }}
              	            value={data}
							onClick={() => {
								handleWorkflowSelectionUpdate({ 
									target: { 
										value: data,
									}}, 
								true)
                document.activeElement.blur();
							}}
              	          >
						  	<PolylineIcon style={{ marginRight: 8 }} />
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
              	            borderRadius: theme.palette?.borderRadius,
              	          }}
              	          {...params}
              	          label="Find the workflow you want to trigger"
              	          variant="outlined"
              	        />
              	      );
              	    }}
              	  />
              	)}

				{/* Button for making a new workflow to attach */}
				<Button
					variant="outlined"
					style={{ marginTop: 10, }}
				    disabled={!(subworkflow === null || subworkflow === undefined || Object.getOwnPropertyNames(subworkflow).length === 0)}
					onClick={() => {
						toast("Setting up new workflow")

						const newworkflow = {
							name: "User Input subflow",
							description: "",
						}

						createWorkflow(newworkflow, selectedTriggerIndex)
					}}
					color="primary"
				>

  					<AddIcon /> New Subflow 
				</Button>
					
				</div>
            ) : null}

            {workflow.triggers[selectedTriggerIndex].parameters[2] !==
              undefined &&
              workflow.triggers[selectedTriggerIndex].parameters[2].value.includes("email") ? (
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
									marginTop: 10,
                }}
                InputProps={{
                  style: {
                    color: "white",
                    fontSize: "1em",
                  },
                }}
                fullWidth
				label="Email"
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
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
									marginTop: 10,
                }}
                InputProps={{
                  style: {
                  },
                }}
                fullWidth
                color="primary"
                placeholder={"+474823212132,+46020304242"}
								label="Phone Number"
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
            
          </div>

		  <div style={{marginTop: 0, }} />
          <b>Required Input-Questions</b>
		  {workflow.input_questions !== undefined && workflow.input_questions !== null && workflow.input_questions.length > 0 ?
			<div>
				{workflow.input_questions.map((question, index) => {
					var foundParamIndex = workflow.triggers[selectedTriggerIndex].parameters.findIndex((param) => param.name === "input_questions")

					const selectionClick = () => {
						if (foundParamIndex === -1) {
							workflow.triggers[selectedTriggerIndex].parameters.push({
								"name": "input_questions",
								"value": [],
							})

							foundParamIndex = workflow.triggers[selectedTriggerIndex].parameters.length - 1
						} else {
							try {
								workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value = JSON.parse(workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value)
							} catch (e) {
								console.log("Couldn't parse input questions: ", e)
								workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value = []
							}
						}

						if (workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value.includes(question.name)) {
							workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value = workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value.filter((item) => item !== question.name)
						} else {
							workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value.push(question.name)
						}

						// Make it back to a string
						workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value = JSON.stringify(workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value)
						setWorkflow(workflow)
						setUpdate(Math.random())
					}

					return (
						<div key={index} style={{ display: "flex", cursor: "pointer", }} onClick={() => {
							selectionClick()
						}}>
							<Checkbox
								checked={foundParamIndex !== -1 ? workflow.triggers[selectedTriggerIndex].parameters[foundParamIndex].value.includes(question.name) : false}
							/>
							<Typography variant="body2" style={{marginTop: 10, }}>
								{question.name}
							</Typography>
						</div> 
					)
				})}
			</div> 
		  : 
			<div style={{cursor: "pointer", color: "#f85a3e", marginTop: 10, }} onClick={() => {
                setEditWorkflowModalOpen(true)
				toast.info("Expand and scroll down to add input-questions")
			}}>
			  <Typography variant="body2">No Input-Questions found. Click to add them!</Typography>
			</div> 
		  }

        </div>
  const defaultEnvironment = environments.find(
    (env) => env.default && env.Name.toLowerCase() !== "cloud"
  );

  if (selectedTrigger.trigger_type === "PIPELINE" && selectedTrigger.environment === "onprem" && defaultEnvironment !== undefined) {
     selectedTrigger.environment = defaultEnvironment.Name
     setSelectedTrigger(selectedTrigger)  }

  const PipelineSidebar = Object.getOwnPropertyNames(selectedTrigger).length === 0 || workflow.triggers[selectedTriggerIndex] === undefined && selectedTrigger.trigger_type !== "SCHEDULE" ? null : 
          <div style={appApiViewStyle}>
            <h3 style={{ marginBottom: "5px" }}>
              {selectedTrigger.app_name}: {selectedTrigger.status}
            </h3>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://shuffler.io/docs/triggers#pipelines"
              style={{ textDecoration: "none", color: "#f85a3e" }}
            >
              What are pipelines?
            </a>
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
                backgroundColor: theme.palette.inputColor,
                borderRadius: theme.palette?.borderRadius,
              }}
              InputProps={{
                style: {},
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
                SelectDisplayProps={{}}
                fullWidth
                onChange={(e) => {
                  selectedTrigger.environment = e.target.value;
                  setSelectedTrigger(selectedTrigger);

                  setWorkflow(workflow);
                  setUpdate(Math.random());
                }}
                style={{
                  backgroundColor: theme.palette.inputColor,
                  color: "white",
                  height: 50,
                }}
              >
                {environments.map((data) => {
                  if (data.archived) {
                    return null;
                  }

                  if (data.Name.toLowerCase() === "cloud") {
                    return null;
                  }

                  return (
                    <MenuItem
                      key={data.id}
                      style={{
                        backgroundColor: theme.palette.inputColor,
                        color: "white",
                      }}
                      value={data.Name}
                    >
                      {data.Name}
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
            <div style={{ flex: 6, marginTop: 20 }}>
              <div>
                <b>What would you like to do?</b>
				{/*
                <div
                  key="syslogListener"
                  onClick={() => {
                    if(selectedTrigger.status === "running"){
                      //toast("please stop the trigger to edit the configuration");
                      return;
                    } else {
                    setSelectedOption("Syslog listener");
                    const url = `${globalUrl}/api/v1/pipelines/pipeline_${selectedTrigger.id}`
                    const command = `from tcp://192.168.1.100:5162 read syslog | import`
                    const pipelineConfig = {
                      command: command,
                      name: selectedTrigger.label,
                      type: "create",
                      environment: selectedTrigger.environment,
                      workflow_id: workflow.id,
                      trigger_id: selectedTrigger.id,
                      start_node: "",
                      url:url,
                    };
                    submitPipeline(selectedTrigger, selectedTriggerIndex, pipelineConfig);
                 
                  
                  }}}
                  style={{
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: theme.palette?.borderRadius,
                    padding: 10,
                    cursor: "pointer",
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Radio
                        checked={selectedOption === "Syslog listener"}
                        onChange={() => {
                          setSelectedOption("Syslog listener")}}

                        value={"Syslog listener"}
                        name="option"
                      />
                    }
                    label= {selectedOption === "Syslog listener" && selectedTrigger.status === "running" ? "listening at 192.168.1.100:5162" : "Start Syslog listener"}
                  />
                </div>

                <div
                  key="sigmaRulesearch"
                  onClick={() => {
                    if(selectedTrigger.status === "running"){
                     // toast("please stop the trigger to edit the configuration");
                      return;
                    } else {
                    setSelectedOption("SigmaRule");
                    const url = `${globalUrl}/api/v1/pipelines/pipeline_${selectedTrigger.id}`
                    const command = `export | sigma /var/lib/tenzir/sigma_rules | to ${url}`
                    const pipelineConfig = {
                      command: command,
                      name: selectedTrigger.label,
                      type: "create",
                      environment: selectedTrigger.environment,
                      workflow_id: workflow.id,
                      trigger_id: selectedTrigger.id,
                      start_node: "",
                      url:url,
                    };
                    submitPipeline(selectedTrigger, selectedTriggerIndex, pipelineConfig);
                 
                  }}}
                  style={{
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: theme.palette?.borderRadius,
                    padding: 10,
                    cursor: "pointer",
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Radio
                        checked={selectedOption === "SigmaRule"}
                        onChange={() => {
                          if (selectedTrigger.status !== "running"){
                          	setSelectedOption("SigmaRule")
						  }
						}}
                        value={"Sigma Rulesearch"}
                        name="option"
                      />
                    }
                    label="Run Sigma Rulesearch"
                  />
                </div>

				*/}

                <div
                  key="kafkaQueue"
                  onClick={() => {
                    if (selectedTrigger.status === "running"){
                      toast("please stop the trigger to edit the configuration");
                      return;
                    } else {
                    	setSelectedOption("Kafka Queue");
                    	setTenzirConfigModalOpen(true);
                  	}
				  }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: theme.palette?.borderRadius,
                    padding: 10,
                    cursor: "pointer",
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Radio
                        checked={selectedOption === "Kafka Queue"}
                        onChange={() => { 
                          if (selectedTrigger.status !== "running") {
                          	setSelectedOption("Kafka Queue")

						  }
						}}

                        value={"Kafka Queue"}
                        name="option"
                      />
                    }
                    label="Subscribe to a Kafka Queue"
                  />
                </div>

                <div style={{ marginTop: 20, marginBottom: 7, display: "flex" }}>
                  <Button
                    style={{ flex: 1 }}
                    variant="contained"
                    disabled={selectedTrigger.status !== "running"}
                    onClick={() => {
                      const pipelineConfig = {
                        name: selectedTrigger.label,
                        type: "stop",
                        environment: selectedTrigger.environment,
                        workflow_id: workflow.id,
                        trigger_id: selectedTrigger.id,
                        start_node: "",
                      };
                      submitPipeline(selectedTrigger, selectedTriggerIndex, pipelineConfig);
                    }}
                    color="primary"
                  >
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          </div>

  const ScheduleSidebar = Object.getOwnPropertyNames(selectedTrigger).length === 0 || workflow.triggers[selectedTriggerIndex] === undefined && selectedTrigger.trigger_type !== "SCHEDULE" ? null :
        <div style={appApiViewStyle}>
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
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
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
                backgroundColor: theme.palette.inputColor,
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
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
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
                  <b>When to start: {isCloud || selectedTrigger?.environment === "cloud" ? <a href="https://crontab.guru" target="_blank" style={{color: "#f85a3e", }}>Cron formatting</a> : "every X second"}</b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
                  },
                }}
                fullWidth
                disabled={
				  selectedTrigger.status === "running"
                }
                defaultValue={
					selectedTrigger.parameters === undefined ? "" : selectedTrigger.parameters[0]?.value
                }
                color="primary"
                placeholder=""
                onBlur={(e) => {
                  setTriggerCronWrapper(e.target.value);
                }}
              />
              {/*selectedTrigger.environment === "cloud" ? 
								<Cron
      					  value={workflow.triggers[selectedTriggerIndex].parameters[0].value}
      					  setValue={setTriggerCronWrapper}
      					/>
							: 
								null
							*/}
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
                  <b>Runtime Argument: </b>
                </div>
              </div>
              <TextField
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {
                  },
                }}
                disabled={
                  workflow.triggers[selectedTriggerIndex] === null || workflow.triggers[selectedTriggerIndex] === undefined ? false : workflow.triggers[selectedTriggerIndex].status === "running"
                }
                fullWidth
                rows="3"
                multiline
                color="primary"
                defaultValue={
                  workflow.triggers[selectedTriggerIndex] !== undefined && workflow.triggers[selectedTriggerIndex].parameters !== undefined && workflow.triggers[selectedTriggerIndex].parameters !== null && workflow.triggers[selectedTriggerIndex].parameters.length > 1 ? workflow.triggers[selectedTriggerIndex].parameters[1].value : ""
                }
                placeholder='{"key": "value"}'
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

  const cytoscapeViewWidths = isMobile ? 50 : 950;
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
	pointerEvents: "none",
  }




  const TopCytoscapeBar = (props) => {
    if (workflow.public === true) {
      return null
    }

	if (userdata.active_org === undefined || userdata.active_org === null) {
		return null
	}

    const isCorrectOrg = workflow.public === true || userdata.active_org.id === undefined || userdata.active_org.id === null || workflow.org_id === null || workflow.org_id === undefined || workflow.org_id.length === 0 || userdata.active_org.id === workflow.org_id 

    return (
      <div style={topBarStyle}>
        <div style={{ 
			margin: "0px 10px 0px 10px",
			pointerEvents: "none",
		}}>
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            style={{ 
			 	color: "white",
				pointerEvents: "auto",
			}}
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
                <PolylineIcon style={{ marginRight: 10 }} />
                Workflows
              </h2>
            </Link>
            <h2 style={{ 
				margin: 0,
				pointerEvents: "none",
			}}>{workflow.name}</h2>
          </Breadcrumbs>

		  {!distributedFromParent ? 
			isCorrectOrg ? null :
			<Typography variant="body1">
				<b>Warning</b>: Change <span
			  		style={{color: "#f85a3e", cursor: "pointer", pointerEvents: "auto", }}
			  		onClick={() => {
						toast("Changing to correct organisation. Please wait a few seconds.")

    					localStorage.setItem("globalUrl", "");
    					localStorage.setItem("getting_started_sidebar", "open");
    					fetch(`${globalUrl}/api/v1/orgs/${workflow.org_id}/change`, {
    					  mode: "cors",
    					  credentials: "include",
    					  crossDomain: true,
    					  method: "POST",
    					  body: JSON.stringify({"org_id": workflow.org_id}),
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
	  					  console.log("In here?")
      					  if (responseJson.success === true) {
      					    if (responseJson.region_url !== undefined && responseJson.region_url !== null && responseJson.region_url.length > 0) {
      					      console.log("Region Change: ", responseJson.region_url);
      					      localStorage.setItem("globalUrl", responseJson.region_url);
      					      //globalUrl = responseJson.region_url
      					    }

  						    if (responseJson["reason"] === "SSO_REDIRECT") {
  							  setTimeout(() => {
  							    toast.info("Redirecting to SSO login page as SSO is required for this organization.")
  							    window.location.href = responseJson["url"]
  							    return
  							  }, 2000)
  						    } else {
								setTimeout(() => {
								  window.location.reload();
								}, 2000);
							}

      					    toast("Successfully changed active organisation - refreshing!");
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
      					})



					}}
			  	>Active Organization</span> to edit this Workflow.
			</Typography>
			:
			<Typography variant="body1">
				Warning: This workflow is controlled by your parent org and may not be editable.
			</Typography>
		  }

		  {originalWorkflow.suborg_distribution === undefined || originalWorkflow.suborg_distribution === null || originalWorkflow.suborg_distribution.length === 0 || originalWorkflow.suborg_distribution.includes("none") ? null :
          <FormControl fullWidth style={{marginTop: 10, maxWidth: 250, pointerEvents: "auto", }}>

            <InputLabel
              id="suborg-changer"
              style={{ color: "white" }}
            >
				Select an Org
            </InputLabel>
			<Select
				style={{
					  pointerEvents: "auto", 
					  backgroundColor: theme.palette.inputColor,
					  color: "white",
					  height: 50,
					  maxWidth: 250, 
					  minWidth: 250, 
					  borderRadius: theme.palette?.borderRadius,
				}}
              	labelId="suborg-changer"
				value={workflow.org_id}
			  	disabled={savingState !== 0}
				onChange={(e) => {
					if (workflow.org_id === e.target.value) {
						console.log("Same org selected. No change.")
						return
					} else {
						//if (savingState === 0) {
						//	saveWorkflow(workflow, undefined, undefined, undefined)
						//}
					}

					// Unselect in cy
					if (cy !== undefined && cy !== null) {
						cy.nodes().unselect()
						cy.edges().unselect()
					}

    				ReactDOM.unstable_batchedUpdates(() => {
						getEnvironments(e.target.value) 
						getAppAuthentication(undefined, undefined, undefined, e.target.value)
						getFiles(e.target.value)
						listOrgCache(e.target.value) 

						if (e.target.value === originalWorkflow.org_id) {
							console.log("Original org selected. No change.")

							updateCurrentWorkflow(originalWorkflow)
							return
						} else {
							// Load environments, auth, auth groups
							//toast("Loading correct info for suborg")
						}


						// Should look through childorg workflow
						console.log("Original: ", originalWorkflow)
						if (originalWorkflow.childorg_workflow_ids === undefined || originalWorkflow.childorg_workflow_ids === null || originalWorkflow.childorg_workflow_ids.length === 0) {
							console.log("In childorg doesn't exist. Suborgworkflows: ", suborgWorkflows)

							if (suborgWorkflows !== undefined && suborgWorkflows !== null && suborgWorkflows.length > 0) {
								var found = false
								for (var suborgkey in suborgWorkflows) {
									const suborgWorkflow = suborgWorkflows[suborgkey]
									if (suborgWorkflow.org_id === e.target.value) {
										found = true 
										updateCurrentWorkflow(suborgWorkflow)
										break
									}
								}

								if (!found) {
									toast("(3) Creating new workflow for this org. Please wait a second while we duplicate.")
									//console.log("No workflow found out of suborg workflows.")
          						
									//saveWorkflow(originalWorkflow, undefined, undefined, e.target.value)
								}
							} else {
								console.log("Suborgworkflows: ", suborgWorkflows)
								toast("(1) Loading NEW  workflow for this org (?). Please wait a second.")
          						saveWorkflow(originalWorkflow, undefined, undefined, e.target.value)
							}
						} else {
							console.log("In childorg EXIST!")

							var workflowFound = false
							for (var childorgidkey in originalWorkflow.childorg_workflow_ids) {
								const childworkflowid = originalWorkflow.childorg_workflow_ids[childorgidkey]
								for (var suborgWorkflowKey in suborgWorkflows) {
									const suborgWorkflow = suborgWorkflows[suborgWorkflowKey]
									if (suborgWorkflow.org_id === e.target.value) {
										workflowFound = true

										updateCurrentWorkflow(suborgWorkflow)
										break
									}
								}

								if (workflowFound) {
									break
								}
							}

							if (!workflowFound) { 
								console.log("No workflow found.")
								toast("(2) Creating new workflow for this org. Please wait a few seconds while we prepare it for you.")
          						//saveWorkflow(originalWorkflow, undefined, undefined, e.target.value)
							}
						}
    				})
				}}
				label="Suborg Distribution"
				fullWidth
			>
				<MenuItem key={originalWorkflow.org_id} value={originalWorkflow.org_id}>
					  Parent: {userdata.active_org.large_image}{" "}
					  <span style={{ marginLeft: 8 }}>
						{userdata.active_org.name}
					  </span>
				</MenuItem>

			  	<Divider style={{marginTop: 10, marginBottom: 10, }}/>

				{originalWorkflow.suborg_distribution.map((org_id, index) => {
					var data = {}
					for (var key in userdata.orgs) {
						if (userdata.orgs[key].id === org_id) {
							data = userdata.orgs[key]
							break
						}
					}

					if (data.id === undefined || data.id === null) {
						//toast("No org found for id: " + org_id)
						return null
					}

					var skipOrg = false;

					const imagesize = 22
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
							: 0 
						  : 0,
					}

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


					return (
						<MenuItem key={index} value={data.id}>
							  {image}{" "}
							  <span style={{ marginLeft: 8 }}>
								{data.name}
							  </span>
						</MenuItem>
					)
				})}
			</Select>
        </FormControl> 
		}

        </div>
		<div style={{display: "flex", marginLeft: 10, pointerEvents: "auto", }}>
			{parentWorkflows.slice(0,5).map((wf, index) => {
				return (
					<a href={`/workflows/${wf.id}`} target="_blank" rel="noopener noreferrer" key={index}>
						<Tooltip arrow placement="left" title={
							<span style={{}}>
								{wf.image !== undefined && wf.image !== null && wf.image.length > 0 ?
									<img 
										src={wf.image} 
										alt={wf.name} 
										style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} 
										
									/>
									: null}
								<Typography>
									Parent workflow: '{wf.name}'
								</Typography>
							</span>

						} placement="bottom">
							<span onClick={() => {
								console.log("Click: ", wf)
							}}>
								<img src={theme.palette.defaultImage} style={{height: 25, width: 25, cursor: "pointer", border: 15, marginRight: 5, marginTop: 5, filter: "grayscale(90%)", }} />
							</span>
						</Tooltip>
					</a>
				)
			})}
		</div>

			{showEnvironment === true && environments.length > 1 ?
			    <FormControl fullWidth style={{marginTop: 15, marginleft: 10, pointerEvents: "auto", }}>

					<InputLabel
					  id="execution_location"
					  style={{ color: "white" }}
					>
						Execution Location
					</InputLabel>
					<Select
					labelId="execution_location"
					MenuProps={{
					}}
					value={
					  selectedActionEnvironment === undefined || selectedActionEnvironment === null || selectedActionEnvironment.Name === undefined || selectedActionEnvironment.Name === null ? isCloud ? "Cloud" : "Shuffle" : selectedActionEnvironment.Name
					}
					SelectDisplayProps={{
					  style: {
					  },
					}}
					onChange={(e) => {
					  const env = environments.find((a) => a.Name === e.target.value);
					  setSelectedActionEnvironment(env);
					  selectedAction.environment = env.Name;
					  setSelectedAction(selectedAction);

					  for (let actionkey in workflow.actions) {
						  workflow.actions[actionkey].environment = env.Name
					  }
					  setWorkflow(workflow)
					  toast.success("Set execution location for ALL actions to " + env.Name)
					}}
					style={{
					  pointerEvents: "auto", 
					  backgroundColor: theme.palette.inputColor,
					  color: "white",
					  height: 50,
					  maxWidth: 250, 
					  minWidth: 250, 
					  borderRadius: theme.palette?.borderRadius,
					  marginLeft: 10, 
					}}
				  >
					{environments.map((data, index) => {
					  if (data.archived === true) {
						return null
					  }

					  const isRunning = data.running_ip !== "" 

					  return (
						<MenuItem
						  key={data.Name}
						  style={{
							backgroundColor: theme.palette.inputColor,
							color: "white",
						  }}
						  value={data.Name}
						>

						  {data.Name === "cloud" || data.Name === "Cloud" ? null : !isRunning ?
							  <a href={`/admin?tab=locations&env=${data.Name}`} target="_blank" style={{textDecoration: "none",}}>
								  <Tooltip title={"Click to configure the environment"} placement="top">
									  <Chip
										style={{marginLeft: 0, padding: 0, marginRight: 10, cursor: "pointer", backgroundColor: red, }}
										label={"Stopped"}
										variant="outlined"
										color="secondary"
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											window.open(`/admin?tab=locations&env=${data.Name}`, "_blank", "noopener,noreferrer")
										}}


									  />
								  </Tooltip>
							  </a>
							: null}

						  {data.default === true ?
							  <Chip
								style={{marginLeft: 0, padding: 0, marginRight: 10, cursor: "pointer",}}
								label={"Default"}
								variant="outlined"
								color="secondary"
							  />
							  : null}


						  {data.Name}
						</MenuItem>
					  );
					})}
				  </Select>
				</FormControl> 
			: null}

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
        {/*
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
				*/}
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

  const BottomAvatars = () => {
	  const connectedUsers = [{
		  "user": "Anonymous",
		  "user_id": "user_id",
		  "color": "blue",
	  }]
	  

	  if (connectedUsers === undefined || connectedUsers === null || connectedUsers.length < 2) {
		  return null
	  }

	  const avatarStyle = {
		position: "fixed",
		display: "flex", 
		right: isMobile ? 20 : 20,
		top: isMobile ? appBarSize-100 : undefined,
		bottom: isMobile ? undefined : 0,
		left: isMobile ? undefined : leftBarSize,
		minWidth: cytoscapeViewWidths,
		maxWidth: cytoscapeViewWidths,
		marginLeft: 20,
		marginBottom: 20,
		zIndex: 50,
      }

	  const HandleAvatar = (props) => {
		  const {user} = props
		  console.log("Clicked avatar: ", user)

		  const userTitle = user.user[0].toUpperCase() 
		  return (
		  	<Tooltip title={user.user} placement="top">
				<Avatar style={{
					borderColor: user.color, 
					marginLeft: 5, 
					marginRight: 5, 
					borderWidth: 3, 
				}}>
					{userTitle}
				</Avatar>
			</Tooltip>
		  )
	  }

      return (
	  	<div style={avatarStyle}>
			{connectedUsers.map((user) => {
				return (
					<HandleAvatar user={user} />
				)
			})}
		</div>
	)
  }

  const shownErrors = !distributedFromParent && !isMobile && workflow.errors !== undefined && workflow.errors !== null && workflow.errors.length > 0 && showErrors && (!workflow.public || userdata.support === true) ?  
  	<div
  		style={{
			border: "1px solid rgba(255,255,255,0.1)",
  			position: "absolute",
  			bottom: 130,
  			left: leftBarSize+20,
			color: "white",
			padding: 10, 
			borderRadius: theme.palette?.borderRadius,
  		}}
  	>

        <Tooltip
          title="Hide error messages. They will show up the next refresh."
          placement="top"
        >
          <IconButton
            style={{ position: "absolute", top: 0, right: 0}}
            onClick={(e) => {
              e.preventDefault();

			  // A temporary hider thing
			  setShowErrors(false)
            }}
          >
            <CloseIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>

  		<Typography variant="body22">
			{/*<WarningIcon style={{marginRight: 5, height: 15, width: 15, }} />*/}
  			<b>Workflow Issues:</b> {workflow.errors.length} 
  		</Typography>
  		<Typography
  			variant="body2"
  		>
  			{workflow.errors.slice(0,3).map((error) => {
				// Loop through each word, and if it matches "Action <name> " then replace it with a link to the action
				var colornext = false
				const newerror = error === undefined || error == null ? "" : error.split(" ").map((word) => {
					if (colornext) {
						colornext = false
						return (
							<span
								style={{color: "#f85a3e", cursor: "pointer"}}
								onClick={() => {
									console.log("Clicked action: ", word)

									// Find it in cytoscape
									if (cy === undefined || cy === null) {
										return
									}

									const foundnode = cy.nodes().filter((node) => {
										const nodelabel = node.data("label")
										if (nodelabel === undefined || nodelabel === null) {
											return false
										}

										console.log("Node: ", nodelabel.toLowerCase(), "Word: ", word.toLowerCase())
										return nodelabel.toLowerCase() === word.toLowerCase()
									})

									console.log("FOUND: ", foundnode)

									if (foundnode === undefined || foundnode === null || foundnode.length === 0) {
										return
									}

									console.log("Found node: ", foundnode)
            						cy.elements().unselect()
									foundnode[0].select()
								}}
							>
								{word}&nbsp;
							</span>
						)
					}

					if (word.toLowerCase() === "action") {
						colornext = true
					}

					return word + " "
				})

				if (newerror === undefined || newerror === null || newerror === "") {
					return null
				}

  				return (
  					<div>
  						- {newerror}
  					</div>
  				)
  			})}
  		</Typography>
  	</div>
  : null



  const RightsideBar = () => {
	const [hovered, setHovered] = useState(false)

    useEffect(() => {
      const handleKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === '/') {
          event.preventDefault(); // Prevent default browser behavior (like opening search bar)
          if (!workflow.public && !executionRequestStarted) {
            executeWorkflow(executionText, workflow.start, lastSaved);
          }
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "'") {
          // Check if Ctrl (Windows/Linux) or Command (Mac) key is pressed along with '/'
          if (!workflow.public && !executionModalOpen) {
            setExecutionModalOpen(true);
            getWorkflowExecution(props.match.params.key, "");
          } else if (!workflow.public && executionModalOpen) {
            setExecutionModalOpen(false);
          }
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "]") {
          console.log("Show workflow revisions key pressed")
          if (!workflow.public) {
            setShowWorkflowRevisions(true)
            //setOriginalWorkflow(workflow)
          }
        }

        if (( event.ctrlKey || event.metaKey ) && event.key === ";") {
          if (!workflow.public && executionModalOpen) {
            getWorkflowExecution(props.match.params.key, "");
          }
        }

		/*
        if (( event.ctrlKey || event.metaKey ) && event.shiftKey) {
          console.log("Shift key pressed")
          if (!workflow.public && executionModalOpen) {
            setExecutionRunning(false);
            stop()
            const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
            const newitem = removeParam("execution_id", cursearch);
            navigate(curpath + newitem)
            setExecutionModalView(0);
          }
        }
		*/
      };
  
      document.addEventListener('keydown', handleKeyDown);
  
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      }
    }, [executeWorkflow, executionText, workflow, lastSaved, executionRequestStarted])  

    useEffect(() => {
      const handleKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === '/') {
          event.preventDefault(); // Prevent default browser behavior (like opening search bar)
          if (!workflow.public && !executionRequestStarted) {
            executeWorkflow(executionText, workflow.start, lastSaved);
          }
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "'") {
          // Check if Ctrl (Windows/Linux) or Command (Mac) key is pressed along with '/'
          if (!workflow.public && !executionModalOpen) {
            setExecutionModalOpen(true);
            getWorkflowExecution(props.match.params.key, "");
          } else if (!workflow.public && executionModalOpen) {
            setExecutionModalOpen(false);
          }
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "]") {
          console.log("Show workflow revisions key pressed")
          if (!workflow.public) {
            setShowWorkflowRevisions(true)
          }
        }

        if (( event.ctrlKey || event.metaKey ) && event.key === ";") {
          if (!workflow.public && executionModalOpen) {
            getWorkflowExecution(props.match.params.key, "");
          }
        }

		/*
        if (( event.ctrlKey || event.metaKey ) && event.shiftKey) {
          console.log("Shift key pressed")
          if (!workflow.public && executionModalOpen) {
            setExecutionRunning(false);
            stop()
            const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
            const newitem = removeParam("execution_id", cursearch);
            navigate(curpath + newitem)
            setExecutionModalView(0);
          }
        }
		*/
      };
  
      document.addEventListener('keydown', handleKeyDown);
  
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [executeWorkflow, executionText, workflow, lastSaved, executionRequestStarted]);  

	  if (isMobile) {
		  return null
	  }

	  return (
		  <div 
		  	style={{
				position: "fixed", 
				right: -5, 
				top: "40%", 
				width: 70, 
				height: 235, 
				border: "1px solid #f85a3e", 
				cursor: "pointer", 
				borderRadius: theme.palette?.borderRadius, 
				padding: 10, 
				backgroundColor: hovered ? theme.palette.surfaceColor : theme.palette.platformColor, 
			}}
		    onMouseEnter={() => setHovered(true)}
		    onMouseLeave={() => setHovered(false)}
		  	onClick={() => {
			  setExecutionModalOpen(true);
			  getWorkflowExecution(props.match.params.key, "");
			}}
		  >
  			<ArrowLeftIcon style={{marginTop: 10, marginLeft: 10, marginBottom: 10, }}/> 
		  	<Typography 
		  		variant="h6" 
		  		style={{
					writingMode: "vertical-rl", 
					textOrientation: "mixed", 
					marginLeft: 10, 
					fontWeight: "bold",
				}}
		  	>
		  		Explore runs 
		  	</Typography>
		  </div>
	  )
  }

  // Used for handling suborg workflow distribution management
  const updateCurrentWorkflow = (inputworkflow) => {
	//setLastSaved(false)
	setSelectedAction({});
	setSelectedApp({})
	setWorkflow(inputworkflow)

	if (inputworkflow !== undefined && inputworkflow !== null && inputworkflow.id !== undefined && inputworkflow.id !== null) {
		getRevisionHistory(inputworkflow.id)
		getWorkflowExecution(inputworkflow.id)
	}

	// Update props match key
	if (inputworkflow.parentorg_workflow !== undefined && inputworkflow.parentorg_workflow !== null && inputworkflow.parentorg_workflow !== "") {
		setDistributedFromParent(inputworkflow.parentorg_workflow)
	} else {
		setDistributedFromParent("")
	}

	if (cy !== undefined) {
		cy.removeListener("select");
		cy.removeListener("unselect");

		cy.removeListener("add");
		cy.removeListener("remove");

		cy.removeListener("mouseover");
		cy.removeListener("mouseout");

		cy.removeListener("drag");
		cy.removeListener("free");
		cy.removeListener("cxttap");

		setElements([])

		// Remove all edges
		cy.edges().remove()
		cy.nodes().remove()
	}
  }

  // Uses Org-Id referencing header to create a workflow while getting it in realtime
  // This further ensures the user needs access to GET the workflow properly
  const duplicateParentWorkflow = (inputWorkflow, org_id, setWorkflow) => {
	  fetch(`${globalUrl}/api/v1/workflows/${inputWorkflow.id}`, {
		  method: "GET",
		  headers: {
			  "Org-Id": org_id,
			  "Content-Type": "application/json",
		  },
		  credentials: "include",
	  })
	  .then((response) => {
		  if (response.status === 200) {
  			  getChildWorkflows(inputWorkflow.id) 
		  }

		  return response.json();
	  })
	  .then((responseJson) => {
		  if (responseJson.success === false) {
			  //toast("Failed to duplicate workflow")
		  } else {
			  //toast("Successfully duplicated workflow. Reloading child workflows.")
			  if (setWorkflow === true) {
				  updateCurrentWorkflow(responseJson)
			  }
		  }
	  })
	  .catch((error) => {
		  console.log("Dupe workflow for suborg error: ", error.toString())
	  })
  }

  const BottomCytoscapeBar = () => {
    if (workflow.id === undefined || workflow.id === null || (!workflow.public && apps.length === 0)) {
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
        <span>
          <Button
            disabled={
              workflow.public 
			  || executionRequestStarted
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
    )

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
          <Tooltip color="primary" title={workflow.public === true ? "Use this Workflow in your organisation" : "Save Workflow"} placement="top">
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
                onClick={() => {
                  saveWorkflow(workflow)

                  if (workflow.public === true) {
                    console.log("Public!")

                    const tmpurl = new URL(window.location.href)
                    const searchParams = tmpurl.searchParams
                    const queryID = searchParams.get('queryID')

                    if (queryID !== undefined && queryID !== null) {
                      aa('init', {
                        appId: "JNSS5CFDZZ",
                        apiKey: "db08e40265e2941b9a7d8f644b6e5240",
                      })

                      const timestamp = new Date().getTime()
                      aa('sendEvents', [
                        {
                          eventType: 'conversion',
                          eventName: 'Public Workflow Saved',
                          index: 'workflows',
                          objectIDs: [workflow.id],
                          timestamp: timestamp,
                          queryID: queryID,
                          userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
                        }
                      ])
                    } else {
                      console.log("No query to handle")
                    }
                  }
                }}
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
          {workflow.public || userdata.support == true ? (
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
            title="Fit to screen"
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
                disabled={history.length === 0 || !(originalWorkflow.suborg_distribution === undefined || originalWorkflow.suborg_distribution === null || originalWorkflow.suborg_distribution.length === 0 || originalWorkflow.suborg_distribution.includes("none"))}
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
            title={`Show executions (${workflowExecutions.length}) (Ctrl + ')`}
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
                {/*<Badge 
									sx={{"& .MuiBadge-badge": {
											right: `20px`,
											bottom: `20px`,
										}
									}}
									variant="outlined" badgeContent={workflowExecutions.length} color="primary" anchorOrigin={{vertical: "top", horizontal: "left", }}> */}
                <DirectionsRunIcon />
                {/*</Badge>*/}
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
          <Tooltip
            color="secondary"
            title="Edit workflow details"
            placement="top"
          >
            <span>
              <Button
                disabled={workflow.public}
                color="primary"
                style={{ height: 50, marginLeft: 10 }}
                variant="outlined"
                onClick={() => {
                  console.log("SHOW EDIT VIEW!")

                  setEditWorkflowModalOpen(true)
  				  setLastSaved(false)
                }}
              >
                <EditIcon />
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            color="secondary"
            title="Show Workflow Revision History (Ctrl + ])"
            placement="top"
          >
            <span>
              <Button
                disabled={workflow.public}
                color="primary"
                style={{ height: 50, marginLeft: 10 }}
                variant={"outlined"}
                onClick={() => {
                  setShowWorkflowRevisions(true)
                }}
              >
			  	<RestoreIcon />
              </Button>
            </span>
          </Tooltip>

		  
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
        label: "Click to write a comment",
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

    var defaultReturn = null
    if (Object.getOwnPropertyNames(selectedComment).length > 0) {
      defaultReturn = <CommentSidebar />
    } else if (Object.getOwnPropertyNames(selectedTrigger).length > 0) {
      if (selectedTrigger.trigger_type === undefined) {
        //defaultReturn = <UserinputSidebar />
        return null;
      } else {
		/*
        console.log(
          "Unable to handle invalid trigger type " +
          selectedTrigger.trigger_type
        );
		*/
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
		<span>
        {/*<Fade in={true} style={{ transitionDelay: `$0ms` }}>*/}
          <div id="rightside_actions" style={rightsidebarStyle}>
            {defaultReturn}
          </div>
		</span>
    );

    //return null;
  };

  const unPublishWorkflow = (data) => {
	data.id = props.match.params.key
	if (!isCloud) {
		toast("Function only supported on cloud")
		return
	}

	if (data.public !== true) {
		toast("Workflow is not public. Can't unpublish");
		return
	}

    // This ALWAYS talks to Shuffle cloud
    data = JSON.parse(JSON.stringify(data));
	const url = `${globalUrl}/api/v1/workflows/${props.match.params.key}/unpublish`;
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
			console.log("Status not 200 for workflow publish :O!");
		}

		return response.json();
	})
	.then((responseJson) => {
		if (responseJson.reason !== undefined) {
			toast("Unpublishing: "+responseJson.reason)
		}

		if (responseJson.success === true) {
			workflow.public = false
			setWorkflow(workflow)
		}
	})
	.catch((error) => {
		toast("Failed publishing: is the workflow valid? Remember to save the workflow first.")
		console.log(error.toString())
	})
  }

  // This can execute a workflow with firestore. Used for test, as datastore is old and stuff
  // Too much work to move everything over alone, so won't touch it for now
  //<Button style={{borderRadius: "0px"}} color="primary" variant="contained" onClick={() => {
  //	executeWorkflowWebsocket()
  //}}>Execute websocket</Button>
  //

  // A list used for FRONTEND handling of whether a public workflow
  // should be change-able
  const allowList = ["frikky", "m1nk-code", "DavidtheGoliath"]
  // console.log(allowList, userdata.public_username)

  const leftView = workflow.public === true ?
    <div style={{ minHeight: "82vh", maxHeight: "82vh", height: "100%", minWidth: leftBarSize - 70, maxWidth: leftBarSize - 70, zIndex: 0, padding: 35, borderRight: "1px solid rgba(91,96,100,1)", overflowY: "auto", }}>

	  <span style={{display: "flex", }}>
		  <Typography variant="h6" color="textPrimary" style={{
			margin: "0px 0px 0px 0px",
		  }}>
			{workflow.name}
	 	  </Typography>
		  {workflow.validated === true ? 
		    <Tooltip title="The functionality of this workflow manually verified by the Shuffle automation team" placement="top">
		  	<VerifiedUserIcon style={{marginLeft: 10, }} />
		    </Tooltip>
		  : null}
	 </span>
      <Typography variant="body2" color="textSecondary">
        This workflow is public	and <span style={{ color: "#f86a3e", cursor: "pointer", }} onClick={() => {
          saveWorkflow(workflow)
        }}>must be saved</span> or exported before use.
      </Typography>
      {Object.getOwnPropertyNames(creatorProfile).length !== 0 && creatorProfile.github_avatar !== undefined && creatorProfile.github_avatar !== null ?
        <div style={{ display: "flex", marginTop: 10, }}>
          <IconButton color="primary" style={{ padding: 0, marginRight: 10, }} aria-controls="simple-menu" aria-haspopup="true" onClick={(event) => {
          }}>
            <Link to={`/creators/${creatorProfile.github_username}`} style={{ textDecoration: "none", color: "#f86a3e" }}>
              <Avatar style={{ height: 30, width: 30, }} alt={"Workflow creator"} src={creatorProfile.github_avatar} />
            </Link>
          </IconButton>
          <Typography variant="body1" color="textSecondary" style={{ color: "" }}>
            Shared by <Link to={`/creators/${creatorProfile.github_username}`} style={{ textDecoration: "none", color: "#f86a3e" }}>{creatorProfile.github_username}</Link>
          </Typography>
        </div>
        : null}
      <div style={{ marginTop: 15 }} />
      {workflow.tags !== undefined && workflow.tags !== null && workflow.tags.length > 0 ?
        <div style={{ display: "flex", overflow: "hidden", marginTop: 5, }}>
          <Typography variant="body1" style={{ marginRight: 10, }}>
            Tags
          </Typography>
          <div style={{ display: "flex" }}>
            {workflow.tags.map((tag, index) => {
              if (index >= 3) {
                return null;
              }

              return (
                <Chip
                  key={index}
                  style={{ backgroundColor: "#3d3f43", height: 30, marginRight: 5, paddingLeft: 5, paddingRight: 5, height: 28, cursor: "pointer", borderColor: "#3d3f43", color: "white", }}
                  label={tag}
                  variant="outlined"
                  color="primary"
                />
              );
            })}
          </div>
        </div>
        : null}

      {workflow.blogpost !== undefined && workflow.blogpost !== null && workflow.blogpost.length > 0 ?
        <div style={{
          marginTop: 10,
          maxWidth: "100%",
          overflow: "hidden",
        }}>
          <Typography variant="body1">
            <a
              href={workflow.blogpost}
              style={{ textDecoration: "none", color: "#f86a3e" }}
              rel="noopener noreferrer"
              target="_blank"
            >
              Related blog & docs
            </a>
          </Typography>
        </div>
        : null
      }

      {appGroup.length > 0 ?
        <div style={{ marginTop: 10, }}>
          <div style={{ display: "flex" }}>
            <Typography variant="body1">
              Apps
            </Typography>
            <AvatarGroup max={6} style={{ marginLeft: 10, }}>
              {appGroup.map((data, index) => {
                return (
                  <Link key={index} to={`/apps/${data.app_id}`}>
                    <Avatar alt={data.app_name} src={data.large_image} style={{ width: 30, height: 30 }} />
                  </Link>
                )
              })}
            </AvatarGroup>
          </div>
        </div>
        : null}

      {triggerGroup.length > 0 ?
        <div style={{ display: "flex", marginTop: 10, }}>
          <Typography variant="body1">
            Triggers
          </Typography>
          <AvatarGroup max={6} style={{ marginLeft: 10, }}>
            {triggerGroup.map((data, index) => {
              return (
                <Avatar key={index} alt={data.app_name} src={data.large_image} style={{ width: 30, height: 30 }} />
              )
            })}
          </AvatarGroup>
        </div>
        : null}

      {/*
			<div style={{display: "flex", marginTop: 10, }}>
				<Typography variant="body1">
					Mitre Att&ck:&nbsp; 
				</Typography>
				<Typography variant="body1" color="textSecondary">
					TBD
				</Typography>
			</div>
			*/}

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

      {workflow.video !== undefined && workflow.video !== null && workflow.video.length > 0 ?
        <div style={{
          marginTop: 10,
          maxWidth: "100%",
          overflow: "hidden",
        }}>
          <Typography variant="body1">
            Video
          </Typography>
          {
            workflow.video.includes("loom.com/share") && workflow.video.split("/").length > 4 ?
              <div>
                <iframe
                  src={`https://www.loom.com/embed/${workflow.video.split("/")[4]}`}
                  frameBorder={"false"}
                  webkitallowfullscreen={"true"}
                  mozallowFullscreen={true}
                  allowFullScreen={true}
                  style={{
                    "top": 0,
                    "left": 0,
                    "maxWidth": 270,
                    "minWidth": 270,
                  }}
                />
              </div>
              :
              workflow.video.includes("youtube.com") && workflow.video.split("/").length > 3 && workflow.video.includes("v=")
                ?
                <div>
                  <iframe
                    src={`https://www.youtube.com/embed/${((new URL(workflow.video)).searchParams).get("v")}`}
                    frameBorder={"false"}
                    webkitallowfullscreen={"true"}
                    mozallowFullscreen={true}
                    allowFullScreen={true}
                    style={{
                      "top": 0,
                      "left": 0,
                      "maxWidth": 270,
                      "minWidth": 270,
                    }}
                  />
                </div>
                :
                <Typography variant="body1">
                  {workflow.video}
                </Typography>
          }
        </div>
        : null}

      {workflow.description !== undefined && workflow.description !== null && workflow.description.length > 0 ?
        <div style={{ marginTop: 5, }}>
          <Typography variant="body1">
            Description
          </Typography>
          <Typography variant="body1" color="textSecondary" style={{ maxWidth: "100%", maxHeight: 250, overflowX: "hidden" }}>
            {workflow.description}
          </Typography>
        </div>
        : null}

			{/*
			<div style={{ display: "flex" }}>
				<Button
					color="primary"
					variant="contained"
					fullWidth
					style={{ marginTop: 15, display: "flex" }}
					onClick={() => {
						setSelectionOpen(true)
					}}
				>
					Statistics
				</Button>
			</div>
			*/}

      {userdata.support === true || (userdata.avatar !== undefined && (userdata.avatar === creatorProfile.github_avatar || allowList.includes(userdata.public_username))) ?
        <div style={{ marginTop: 50, }}>
          <Typography variant="body2" color="textSecondary">
            You can see these buttons because you may have the correct access rights as a creator to help modify this workflow.
          </Typography>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            style={{ marginTop: 15, }}
            onClick={() => {
              // Further checks are being done on the backend
              // Even if the user can "edit" a workflow on the frontend,
              // that doesn't necessarily mean anything

              //setEditWorkflowDetails(true)
              workflow.public = false
              setUserediting(true)
              setWorkflow(workflow)

              getAppAuthentication();
              getEnvironments();
              getWorkflowExecution(props.match.params.key, "");
              getAvailableWorkflows(-1);
              getSettings();
              getFiles()

			  // For loading datastore

              setUpdate(Math.random());
            }}
          >
            Edit Workflow
          </Button>
          <Button
            color="secondary"
            variant="outlined"
		    disabled={workflow.public !== true}
            fullWidth
            style={{ marginTop: 15, }}
            onClick={() => {
              // setEditWorkflowDetails(true)
              // workflow.public = false
              // setWorkflow(workflow)
              // setUpdate(Math.random());
			  toast("Unpublishing this workflow from the search engine. It will remain public until it is deleted, as it is a copy of the original workflow.")
  			  unPublishWorkflow(workflow) 
            }}
          >
            Unpublish Workflow
          </Button>

		  {userdata.support === true ? 
			  <span>
				  <Typography variant="body2" color="textSecondary" style={{marginTop: 50, }}>
					Manual Verification: <b>{workflow.validated === undefined || workflow.validated === null  || workflow.validated === false ? "Not valided" : "Validated"}</b>
				  </Typography>
				  <div style={{display: "flex", }}>
					  <Typography variant="body2" color="textSecondary" style={{marginTop: 10, }}>
						  Validate Workflow:
					  </Typography>
					  <Switch
						value={workflow.validated === undefined || workflow.validated === null || workflow.validated === false ? false : workflow.validated}
						onChange={(event) => {
							workflow.validated = event.target.checked
							workflow.user_editing = true 
							//setUserediting(true)

							saveWorkflow(workflow)
						}}
					  />
				  </div>
			  </span>
			: null}
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
    marginTop: 5,
    color: "white",
    marginBottom: 10,
    padding: 5,
    backgroundColor: theme.palette.surfaceColor,
    cursor: "pointer",
    display: "flex",
    minHeight: 45,
    maxHeight: 45,
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
        <div style={{ display: "flex" }}>
          <IconButton
            style={{
              marginTop: "auto",
              marginBottom: "auto",
              height: 30,
              paddingLeft: 0,
              width: 30,
            }}
            onClick={() => {
              if (validate.valid) {
                //console.log("Find and change result: ", 
                //const oldstartnode = cy.getElementById(selectedResult.action.id);
                //if (oldstartnode !== undefined && oldstartnode !== null) {
                //	const foundname = oldstartnode.data("label")
                //	if (foundname !== undefined && foundname !== null) {
                //		result.action.label = foundname
                //	}
                //}
              }

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
            collapsed={false}
			shouldCollapse={(jsonField) => {
				return collapseField(jsonField)
			}}
		  	iconStyle={theme.palette.jsonIconStyle}
		  	collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
		    displayArrayKey={false}
            enableClipboard={(copy) => {
              handleReactJsonClipboard(copy);
            }}
            displayDataTypes={false}
            onSelect={(select) => {
              HandleJsonCopy(validate.result, select, "exec");
            }}
            name={false}
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
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACOCAMAAADkWgEmAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAWlBMVEX4Wj69TDgmKCvkVTwlJyskJiokJikkJSkjJSn4Ykf+6+f5h3L////8xLr5alH/9fT7nYz4Wz/919H5cVn/+vr8qpv4XUL94d35e2X//v38t6v4YUbkVDy8SzcVIzHLAAAAAWJLR0QMgbNRYwAAAAlwSFlzAAARsAAAEbAByCf1VAAAAAd0SU1FB+QGGgsvBZ/GkmwAAAFKSURBVHja7dlrTgMxDEXhFgpTiukL2vLc/zbZQH5N7MmReu4KPmlGN4m9WgGzfhgtaOZxM1rQztNoQDvPowHtTKMB7WxHA2TJkiVLlixIZMmSRYgsWbIIkSVLFiGyZMkiRNZirBcma/eKZEW87ZGsOBxPRFbE+R3Jio/LlciKuH0iWfH1/UNkRSR3RRYruSvyWKldkcjK7IpUVl5X5LLSuiKbldQV6aycrihgZXRFCau/K2pY3V1RxersijJWX1cUsnq6opLV0RW1rNldUc2a2RXlrHldsQBrTlfcLwv5EZm/PLIgkHXKPHyQRzXzYoO8BjIvzcgnBvJBxny+Ih/7zNEIcpDEHLshh5TIkS5zAI5cFzCXK8hVFHNxh1xzQpfC0BV6XWTJkkWILFmyCJElSxYhsmTJIkSWLFmEyJIlixBZsmQB8stk/U3/Yb49pVcDMg4AAAAldEVYdGRhdGU6Y3JlYXRlADIwMjAtMDYtMjZUMTE6NDc6MDUrMDI6MDD8QCPmAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIwLTA2LTI2VDExOjQ3OjA1KzAyOjAwjR2bWgAAAABJRU5ErkJggg=="

    const size = 40;
	const borderRadius = 5
    if (execution.execution_source === undefined || execution.execution_source === null || execution.execution_source.length === 0) {
      return (
        <img
          alt="default"
          src={defaultImage}
          style={{ 
			  width: size, 
			  height: size,
			  borderRadius: borderRadius,
		  }}
        />
      )
    }

    if (execution.execution_source === "authgroups") {
	  const iconMargin = 7
	  return (
		<div style={{
			width: size,
			height: size,
			borderRadius: borderRadius,
			backgroundColor: "rgba(222,112,72,1)",
		}}>
			<LockOpenIcon
				style={{
					width: size/3*2, 
					height: size/3*2, 
					marginLeft: iconMargin,
					marginTop: iconMargin,
				}}
			/>
		</div>
      )

	} else if (execution.execution_source === "webhook") {
      return (
        <img
          alt={"webhook"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "WEBHOOK")
              .large_image
          }
          style={{ 
			  width: size, 
			  height: size,
			  borderRadius: borderRadius,
		  }}
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
          style={{ 
			  width: size, 
			  height: size, 
			  borderRadius: borderRadius,
		  }}
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
          style={{ 
			  width: size, 
			  height: size,
			  borderRadius: borderRadius,
		  }}
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
          style={{ 
			  width: size, 
			  height: size,
			  borderRadius: borderRadius,
		  }}
        />
      );
	} else if (execution.execution_source === "ShuffleGPT") {
      return (
		<AutoAwesomeIcon 
		  color="secondary" 
		  style={{paddingTop: 8, paddingLeft: 4, height: 25, width: 25, }}
		/>
      );
    } else if (execution.execution_source === "pipeline") {
      return (
        <img
          alt={"pipeline"}
          src={
            triggers.find((trigger) => trigger.trigger_type === "PIPELINE")
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
          style={{ 
			  width: size, 
			  height: size, 
			  borderRadius: borderRadius,
		  }}
        />
      );
    }

    return (
      <img
        alt={execution.execution_source}
        src={defaultImage}
        style={{ 
			width: size, 
			height: size,
			borderRadius: borderRadius,
		}}
      />
    );
  };

  const handleReactJsonClipboard = (copy) => {

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
        toast("Can only copy over HTTPS (port 3443)");
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
      toast("Copied value to clipboard, NOT json path.")
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

    // Check if base_node_name has changed
    if (cy !== undefined && cy !== null) {
      console.log("Change name?")
      //const allNodes = cy.nodes().jsons();
      //for (var key in allNodes) {
      //const currentNode = allNodes[key];

      //if (currentNode.
      //}

      //const nodedata = cy.getElementById(data.action.id).data();
      //base_node_name = 
    }

    to_be_copied = "$" + base_node_name.toLowerCase().replaceAll(" ", "_");
    for (let copykey in copy.namespace) {
      if (copy.namespace[copykey].includes("Results for")) {
        continue;
      }

      if (newitem !== undefined && newitem !== null) {
        newitem = newitem[copy.namespace[copykey]];
        if (!isNaN(copy.namespace[copykey])) {
          to_be_copied += ".#";
        } else {
          to_be_copied += "." + copy.namespace[copykey];
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
        toast("Can only copy over HTTPS (port 3443)");
        return;
      }

      navigator.clipboard.writeText(to_be_copied);
      copyText.select();
      copyText.setSelectionRange(0, 99999); /* For mobile devices */

      /* Copy the text inside the text field */
      document.execCommand("copy");
      console.log("COPYING!");
      toast("Copied JSON path to clipboard.")
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
      console.log("IN useeffectt " + autocomplete)

      if (isFirstRender.current) {
        isFirstRender.current = false;
        console.log("IN useeffectt (2)" + collapsed)
        return;
      }
    },[])
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
		  shouldCollapse={(jsonField) => {
			return collapseField(jsonField)
		  }}
		  iconStyle={theme.palette.jsonIconStyle}
		  collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
		  displayArrayKey={false}
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
            style={{ zIndex: 50000, }}
            onClose={(event) => {
              setAnchorPosition({
                top: 750,
                left: 16,
              })
            }}
            disableRestoreFocus
          >
            <Typography style={{ padding: 5 }}>
              Copying
            </Typography>
          </Popover>
          : null}
      </span>
    )
  }

	const changeExecution = (data) => {
		if ((data.result === undefined || data.result === null || data.result.length === 0) && data.status !== "FINISHED" && data.status !== "ABORTED") {
		  start()
		  setExecutionRunning(true)
		  setExecutionRequestStarted(false)
		}

		var checkStarted = false
		if (data.results !== undefined && data.results !== null && data.results.length > 0) {
			if (data.execution_argument !== undefined && data.execution_argument !== null && data.execution_argument.includes("too large")) {
				setExecutionData({});
				checkStarted = true 
				start();
				setExecutionRunning(true);
				setExecutionRequestStarted(false);
			} else {
				if (data.results !== undefined && data.results !== null) {
					for (let resultkey in data.results) {
						if (data.results[resultkey].status !== "SUCCESS") {
							continue
						}

						if (data.results[resultkey].result.includes("too large")) {
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
		}

		const cur_execution = {
		  execution_id: data.execution_id,
		  authorization: data.authorization,
		}

		setExecutionRequest(cur_execution)
		setExecutionModalView(1)

		if (!checkStarted) {
		  handleUpdateResults(data, cur_execution)

		  if (cy !== undefined && cy !== null) {
			cy.elements().removeClass("success-highlight failure-highlight executing-highlight");
			for (let actionKey in data.workflow.actions) {
				var actionitem = data.workflow.actions[actionKey]

				handleColoring(actionitem.id, "", actionitem.label)
			}

			for (let resultKey in data.results) {
				var item = data.results[resultKey]

				handleColoring(item.action.id, item.status, item.action.label)
			}
		  }

		  setExecutionData(data)
		}
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

  var nonskippedResults = []
  if (executionData.results !== undefined) {
    const newSkipped = executionData.results.find((result) => result.status !== "SKIPPED")
    if (newSkipped !== undefined) {
      nonskippedResults = newSkipped
    }
  }

  const envStatus = !(executionData.workflow !== undefined && executionData.workflow !== null && executionData.workflow.actions !== undefined && executionData.workflow.actions !== null && executionData.workflow.actions.length > 0) ? "loading" : "success"

  var executionDelay = -75
  const executionModal = (
    <Drawer
      anchor={"right"}
      open={executionModalOpen}
      onClose={() => {
        setExecutionModalOpen(false)

		const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
		const newitem = removeParam("execution_id", cursearch);
		navigate(curpath + newitem)
      }}
      style={{ 
		  resize: "both", 
		  overflow: "auto", 
	  }}
      hideBackdrop={false}
      variant="temporary"
      BackdropProps={{
        style: {
          //backgroundColor: "transparent",
        }
      }}
      PaperProps={{
        style: {
          resize: "both",
          overflow: "auto",
          minWidth: isMobile ? "100%" : 490,
          maxWidth: isMobile ? "100%" : 490,
          color: "white",
          fontSize: 18,
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
            style={{ zIndex: 5000, position: "absolute", top: 10, right: 10 }}
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
        <div style={{ padding: isMobile ? "0px 0px 0px 10px" : 25, zIndex: 12502, }}>
		  <div style={{display: "flex", }}>
			  <Breadcrumbs
				aria-label="breadcrumb"
				separator="›"
				style={{ color: "white", fontSize: 16 }}
			  >
				<h2 style={{ color: "rgba(255,255,255,0.5)" }}>
				  <DirectionsRunIcon style={{ marginRight: 0, }} />
				  All Workflow Runs
				</h2>
			  </Breadcrumbs>
			  <Tooltip
				title={"Explore and Debug all Workflow Runs"}
				placement="left-start"
				style={{ zIndex: 10010 }}
			  >
		  		<a target="_blank" href={`/workflows/debug?workflow_id=${workflow.id}`} style={{textDecoration: "none", }}>
				  <Button
		  			color="secondary"
		  			style={{marginLeft: 125, maxHeight: 30, marginTop: 20, }}
				  >
		  			<QueryStatsIcon style={{color: "white", }}/>
				  </Button>
		  		</a>
		  	</Tooltip>
		  </div>
        <Tooltip title="Refresh runs (Ctrl + ;)" arrow>
          <Button
            style={{ borderRadius: theme.palette?.borderRadius, }}
            variant="outlined"
            fullWidth
            onClick={() => {
              getWorkflowExecution(props.match.params.key, "", executionFilter)
            }}
            color="secondary"
          >
            <CachedIcon style={{ marginRight: 10 }} />
            Refresh Runs
          </Button>
        </Tooltip>
		<ButtonGroup 
			fullWidth  
		  	style={{marginTop: 5, maxHeight: 50, overflow: "hidden", }}>
		>
		  <Button
		  	color="secondary"
		  	variant={executionFilter === "ALL" ? "contained" : "outlined"}
		  	onClick={() => {
				setExecutionFilter("ALL")
				getWorkflowExecution(props.match.params.key, "", "ALL")
			}}
		  >
		  	All
		  </Button>
		  <Button
		  	color="secondary"
		  	variant={executionFilter === "FINISHED" ? "contained" : "outlined"}
		  	onClick={() => {
				setExecutionFilter("FINISHED")
				getWorkflowExecution(props.match.params.key, "", "FINISHED")
			}}
		  >
		  	Finished
		  </Button>
		  <Button
		  	color="secondary"
		  	variant={executionFilter === "EXECUTING" ? "contained" : "outlined"}
		  	onClick={() => {
				setExecutionFilter("EXECUTING")
				getWorkflowExecution(props.match.params.key, "", "EXECUTING")
			}}
		  >
		  	Executing
		  </Button>
		  <Button
		  	color="secondary"
		  	variant={executionFilter === "ABORTED" ? "contained" : "outlined"}
		  	onClick={() => {
				setExecutionFilter("ABORTED")
				getWorkflowExecution(props.match.params.key, "", "ABORTED")
			}}
		  >
		  	Aborted	
		  </Button>
		</ButtonGroup>
          <div
            style={{
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
                    ? green : data.status === "ABORTED" || data.status === "FAILED"
                      ? "red"
                      : yellow;

                const successActions =
                  data.results !== undefined && data.results !== null
                    ? data.results.filter((result) => result.status === "SUCCESS").length
                    : 0

                const skippedActions = data.results !== undefined && data.results !== null ?
					  data.results.filter((result) => result.status === "SKIPPED").length
				  	  : 0

                const timestamp = new Date(data.started_at * 1000)
                  .toLocaleString("en-GB")
                  .split(".")[0]
                  .split("T")
                  .join(" ");

                var calculatedResult =
                  data.workflow.actions !== undefined &&
                    data.workflow.actions !== null
                    ? data.workflow.actions.length
                    : 0;

								if (data.workflow.triggers !== undefined && data.workflow.triggers !== null) {
                	for (let triggerkey in data.workflow.triggers) {
                	  const trigger = data.workflow.triggers[triggerkey];
                	  if (
                	    (trigger.app_name === "User Input" &&
                	      trigger.trigger_type === "USERINPUT") ||
                	    (trigger.app_name === "Shuffle Workflow" &&
                	      trigger.trigger_type === "SUBFLOW")
                	  ) {
                	    calculatedResult += 1;
                	  }
                	}
				}

				const foundnotifications = data.notifications_created === undefined || data.notifications_created === null ? 0 : data.notifications_created

                return (
				  <span>
                  {/*<Zoom key={index} in={true} style={{ transitionDelay: `${executionDelay}ms` }}>*/}
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
                          onMouseOver={() => { }}
                          onMouseOut={() => { }}
                          onClick={() => {
                            if ((data.result === undefined || data.result === null || data.result.length === 0) && data.status !== "FINISHED" && data.status !== "ABORTED") {
                              start()
                              setExecutionRunning(true)
                              setExecutionRequestStarted(false)
                            }

							navigate(`?execution_id=${data.execution_id}`)

                            // Ensuring we have the latest version of the result.
                            // Especially important IF the result is > 1 Mb in cloud
                            var checkStarted = false
                            if (data.results !== undefined && data.results !== null && data.results.length > 0) {
								if (data.execution_argument !== undefined && data.execution_argument !== null && data.execution_argument.includes("too large")) {
									setExecutionData({});
									checkStarted = true 
									start();
									setExecutionRunning(true);
									setExecutionRequestStarted(false);
								} else {
									if (data.results !== undefined && data.results !== null) {
										for (let resultkey in data.results) {
											if (data.results[resultkey].status !== "SUCCESS") {
												continue
											}

											if (data.results[resultkey].result.includes("too large")) {
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
							}

                            const cur_execution = {
                              execution_id: data.execution_id,
                              authorization: data.authorization,
                            }

                            setExecutionRequest(cur_execution)
                            setExecutionModalView(1)

                            if (!checkStarted) {
                              handleUpdateResults(data, cur_execution)

							  if (cy !== undefined && cy !== null) {
							  	cy.elements().removeClass("success-highlight failure-highlight executing-highlight");
							  	for (let actionKey in data.workflow.actions) {
							  		var actionitem = data.workflow.actions[actionKey]

							  		handleColoring(actionitem.id, "", actionitem.label)
							  	}

							  	for (let resultKey in data.results) {
							  		var item = data.results[resultKey]

							  		handleColoring(item.action.id, item.status, item.action.label)
							  	}
							  }

                              setExecutionData(data)
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
								maxHeight: 40, 
                              }}
                            />
						    <Tooltip
						      color="primary"
						      title={`Execution Source: ${data.execution_source === 'default' ? 'manual run' : data.execution_source}.` + (data.authgroup !== undefined && data.authgroup !== null && data.authgroup.length > 0 ? ` Authgroup: ${data.authgroup}` : '')}
						      placement="left"
						    >
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
							</Tooltip>
                            <div
                              style={{
                                marginTop: "auto",
                                marginBottom: "auto",
                                marginRight: 15,
                                fontSize: 13,
								color: "rgba(255,255,255,0.8)",
                              }}
                            >
                              {timestamp}
                            </div>
                            {data.workflow.actions !== null ? (
                              <Tooltip
                                color="primary"
                                title={`${successActions} action(s) ran + ${skippedActions} skipped = ${calculatedResult} total node(s). If this doesn't add up, there is most likely a problem with the workflow (e.g. ABORTED/FAILURE)`}
                                placement="top"
                              >
                                <div
                                  style={{
                                    marginRight: 10,
								    marginLeft: 10, 
                                    marginTop: "auto",
                                    marginBottom: "auto",
                                  }}
                                >
                                  {successActions} <span style={{color: "rgba(255,255,255,0.4)"}}>+</span> {skippedActions > 0 ? skippedActions : <span style={{color: "rgba(255,255,255,0.4)"}}>{skippedActions}</span>} <span style={{color: "rgba(255,255,255,0.4)"}}>=</span> {calculatedResult}
                                </div>
                              </Tooltip>
                            ) : null}
                          </div>
						
						  {foundnotifications > 0 ?
							<Tooltip title={"This workflow created " + foundnotifications + " notification(s)"} placement="top">
							  <ErrorOutlineIcon 
							  	style={{color: "rgba(255,255,255,0.4)", marginTop: 10, marginRight: 10, }} 
							  	onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									window.open(`/admin?admin_tab=priorities&workflow=${data.workflow.id}&execution_id=${data.execution_id}`, "_blank")
								}}
							  />
							</Tooltip>
						: null}

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
				  </span>
                );
              })}
            </div>
          ) : (
          	<Fade in={true} timeout={1000} style={{ transitionDelay: `${150}ms` }}>
				<div style={{marginTop: 100, }}>
					<Typography variant="body1" color="textSecondary">
						No executions found for the '{executionFilter}' filter. 
					</Typography>

					<Button 
						fullWidth
						variant="outlined"
						style={{
							marginTop: 20,
						}}
						onClick={() => {
							executeWorkflow(executionText, workflow.start, lastSaved);
						}}
					>
						Test Workflow <PlayArrowIcon style={{marginLeft: 15, }} />
					</Button>
				</div>
			  </Fade>
          )}
        </div>
      ) : (
        <div style={{ padding: isMobile ? "0px 10px 25px 10px" : "25px 15px 25px 15px", maxWidth: isMobile ? "100%" : "100%", overflowX: "hidden" }}>

          
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
                    onClick={() => { 
                      setExecutionRunning(false);
              stop()
            }}
                  >
                    <ArrowBackIcon style={{ color: "rgba(255,255,255,0.5)" }} />
                  </IconButton>
                  <Tooltip title="See more runs (Ctrl + Shift)" arrow>
                  <h2
                    style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                    onClick={() => { 
                    const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
                    const newitem = removeParam("execution_id", cursearch);
                    navigate(curpath + newitem)
                    setExecutionRunning(false);
                    stop()
                  }}
                  >
                    See more runs 
                  </h2>
                  </Tooltip>
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
            <h2>Details</h2>
            <Tooltip
              color="primary"
              title="Rerun workflow (uses same startnode as the original)"
              placement="top"
              style={{ zIndex: 50000 }}
            >
              <span style={{}}>
                <Button
                  color="primary"
                  style={{ float: "right", marginTop: 20, marginLeft: 10 }}
                  onClick={() => {
                    executeWorkflow(
                      executionData.execution_argument,
                      executionData.start,
                      lastSaved
                    )

                    if (executionText === undefined || executionText === null || executionText.length === 0) {
                      setExecutionText(executionData.execution_argument)
                    }

                    setExecutionModalOpen(false);
                  }}
                >
                  <CachedIcon style={{}} />
                </Button>
              </span>
            </Tooltip>

		    <Tooltip
		      color="primary"
		      title="Previous execution"
		      placement="top"
		      style={{ zIndex: 50000, }}
		    >
		      <span style={{}}>
		        <Button
		      	color="primary"
		      	style={{ float: "right", marginTop: 20, marginLeft: 10 }}
		      	onClick={() => {
					// Find current one in execution list
					var nextindex = -1
					const currentIndex = workflowExecutions.findIndex((item) => item.execution_id === executionData.execution_id)
					if (currentIndex === -1) {
						nextindex = workflowExecutions.length - 1
					} else {
						nextindex = currentIndex - 1 
					}

					if (nextindex < 0) {
						toast.warn("Use the workflow run debugger to dig deeper - nothing more to show here.")
						return
					}

					const data = workflowExecutions[nextindex]
					navigate(`?execution_id=${data.execution_id}`)

					changeExecution(data)
		      	}}
		        >
					<ArrowBackIcon color="secondary" />
		        </Button>
		      </span>
		    </Tooltip>

		    <Tooltip
		      color="primary"
		      title="Next execution"
		      placement="top"
		      style={{ zIndex: 50000, }}
		    >
		      <span style={{}}>
		        <Button
		      	color="primary"
		      	style={{ float: "right", marginTop: 20, }}
		      	onClick={() => {
					// Find current one in execution list
					var nextindex = -1
					const currentIndex = workflowExecutions.findIndex((item) => item.execution_id === executionData.execution_id)
					if (currentIndex === -1) {
						nextindex = 0
					} else {
						nextindex = currentIndex + 1
					}

					if (nextindex >= workflowExecutions.length) {
						toast.warn("Use the workflow run debugger to dig deeper - nothing more to show here.")
						return
					}

					const data = workflowExecutions[nextindex]
					navigate(`?execution_id=${data.execution_id}`)

					changeExecution(data)
		      	}}
		        >
					<ArrowForwardIcon color="secondary" />
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
            ) : 
              <Tooltip
                color="primary"
                title={`Check Notifications (${executionData.notifications_created === undefined || executionData.notifications_created === null || executionData.notifications_created === 0 ? 0 : executionData.notifications_created})`}
                placement="top"
                style={{ zIndex: 50000 }}
              >
                <span style={{}}>
                  <Button
                    color={executionData.notifications_created === undefined || executionData.notifications_created === null || executionData.notifications_created === 0 ? "secondary" : "primary"}
                    style={{ float: "right", marginTop: 20, marginLeft: 10 }}
					disabled={executionData.notifications_created === undefined || executionData.notifications_created === null || executionData.notifications_created === 0}
                  >
					  <ErrorOutlineIcon 
						style={{}} 
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							window.open(`/admin?admin_tab=priorities&workflow=${executionData.workflow.id}&execution_id=${executionData.execution_id}`, "_blank")
						}}
					  />
                  </Button>
                </span>
              </Tooltip>
			}

            {isCloud ? 
              <Tooltip
                color="primary"
                title="Explore logs for the workflow (up to 5 days back)"
                placement="top"
                style={{ zIndex: 50000, }}
              >
                <span style={{}}>
                  <Button
                    color="secondary"
                    style={{ float: "right", marginTop: 20, marginLeft: 10 }}

					// Max 5 days in the past
					disabled={userdata.region_url !== "https://shuffler.io" || executionData.started_at < (Math.floor(Date.now() / 1000) - 432000)}
                    onClick={() => {
						toast("Opening logs in a new tab")

						setTimeout(() => {
							window.open(`/api/v1/workflows/search/${executionData.execution_id}`, "_blank")
						}, 250)
                    }}
                  >
					<InsightsIcon  />
                  </Button>
                </span>
              </Tooltip>
             : null}

          </div>

          {executionData.workflow !== undefined && executionData.workflow !== null && executionData.workflow.actions !== undefined && executionData.workflow.actions !== null && executionData.workflow.actions.length > 0  ?
            <div style={{ display: "flex", marginLeft: 10, }}>
              <Typography variant="body1">

			  	{/*envStatus === "success" ?
					<Tooltip title="Environment is healthy" placement="top">
						<CheckCircleIcon style={{ color: "green" }} />
					</Tooltip>
					: envStatus === "failure" ?
					<Tooltip title="Environment is unhealthy" placement="top">
						<ErrorIcon style={{ color: "red" }} />
					</Tooltip>
				: null*/}

                <b style={{ }}>Env &nbsp;&nbsp;&nbsp;&nbsp;</b>
              </Typography>

              <Typography variant="body1" color="textSecondary" style={{color: "#f85a3e", cursor: "pointer", }} onClick={() => {
				  window.open("/admin?tab=locations", "_blank")
			  }}>
                {executionData.workflow.actions[0].environment}
              </Typography>

            </div>
          	: null}
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
            executionData.execution_source !== "default" ||
			(executionData.authgroup !== undefined && executionData.authgroup !== null && executionData.authgroup.length > 0) ? (
            <div style={{ display: "flex", marginLeft: 10, }}>
              <Typography variant="body1">
                <b>Source &nbsp;&nbsp;</b>
              </Typography>
              <Typography variant="body1" color="textSecondary">


				{executionData.execution_source === "authgroups" || (executionData.authgroup !== undefined && executionData.authgroup !== null && executionData.authgroup.length > 0) ? 
					<a
                      rel="noopener noreferrer"
                      href={`/admin?tab=app_auth`}
                      target="_blank"
                      style={{ textDecoration: "none", color: "#f85a3e" }}
                    >
						Auth Group '{executionData.authgroup !== undefined && executionData.authgroup !== null && executionData.authgroup.length > 0 ? `${executionData.authgroup}` : null}'
                    </a>
				  :
                executionData.execution_parent !== null &&
                  executionData.execution_parent !== undefined &&
                  executionData.execution_parent.length > 0 ? (
                  executionData.execution_source === props.match.params.key ? 
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
                   : 
                    <a
                      rel="noopener noreferrer"
                      href={`/workflows/${executionData.execution_source}?view=executions&execution_id=${executionData.execution_parent}`}
                      target="_blank"
                      style={{ textDecoration: "none", color: "#f85a3e" }}
                    >
                      Parent Workflow
                    </a>
                  )
                 : 
				  executionData.execution_source === "questions" || executionData.execution_source === "web" || executionData.execution_source === "form" || executionData.execution_source === "forms" ? 
                    <a
                      rel="noopener noreferrer"
                      href={`/forms/${executionData.workflow.id}`}
                      target="_blank"
                      style={{ textDecoration: "none", color: "#f85a3e" }}
                    >
						Form	
                    </a>
				  : 
                  executionData.execution_source
                }
              </Typography>
            </div>
          ) : null}
          {executionData.started_at !== undefined ? (
            <div style={{ display: "flex", marginLeft: 10, }}>
              <Typography variant="body1">
                <b>Started &nbsp;&nbsp;</b>
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {new Date(executionData.started_at * 1000).toLocaleString("en-GB")}
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
                {new Date(executionData.completed_at * 1000).toLocaleString("en-GB")}
              </Typography>
            </div>

          ) : null}

		  {userdata.support === true && executionData.workflow !== undefined && executionData.workflow !== null && executionData.status !== "EXECUTING" ? 
			  <div style={{marginTop: 5, marginBottom: 5, }}>
				  <WorkflowValidationTimeline 
			  		originalWorkflow={workflow}

			  		apps={apps}
					workflow={executionData.workflow}
			  		getParents={getParents}

			  		execution={executionData}
				  />
			  </div>
		  : null}

          <div style={{ marginTop: 10 }} />

          {executionData.execution_argument !== undefined && executionData.execution_argument !== null && 
            executionData.execution_argument.length > 1
            ? parsedExecutionArgument()
            : 
			null}

          <Divider
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              marginTop: 15,
              marginBottom: 20,
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
                !(executionData.results === undefined || executionData.results === null || (executionData.results.length === 0 &&  executionData.status === "EXECUTING")) ? (
                <div style={{}}>
                  <CircularProgress style={{marginLeft: 145, marginBottom: 10, }} onClick={() => {
					console.log(environments, defaultEnvironmentIndex, nonskippedResults)
				  }} />

                  {environments.length > 0 && defaultEnvironmentIndex < environments.length && nonskippedResults.length === 0 && environments[defaultEnvironmentIndex].Name !== "Cloud" ?
                    <Typography variant="body2" color="textSecondary" style={{}}>
                      No results yet. Is Orborus running for the "{environments[defaultEnvironmentIndex].Name}" environment? <a href="/admin?tab=locations" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Find out here</a>. If the Workflow doesn't start within 30 seconds with Orborus running, contact support: <a href="mailto:support@shuffler.io" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>support@shuffler.io</a>
                    </Typography>
                    : null}
                </div>
              ) : null}
            </div>
          </div>
          {
			executionData.results === undefined ||
            executionData.results === null ||
            (executionData.results.length === 0 && executionData.status === "EXECUTING") ? (

						<div style={{}}>
							<CircularProgress style={{marginLeft: 145, marginBottom: 10, }} /> 
								{environments.length > 0 && defaultEnvironmentIndex < environments.length && nonskippedResults.length === 0 && environments[defaultEnvironmentIndex].Name !== "Cloud" ?
									<Typography variant="body2" color="textSecondary" style={{}}>
										No results yet. Is Orborus running for the "{environments[defaultEnvironmentIndex].Name}" environment? <a href="/admin?tab=locations" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Learn more</a>. If the Workflow doesn't start within 30 seconds with Orborus running, contact support: <a href="mailto:support@shuffler.io" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>support@shuffler.io</a>
									</Typography>
								: 
								null}
							</div>
          ) : (
            executionData.results.map((data, index) => {
              if (executionData.results.length !== 1 && !showSkippedActions && (data.status === "SKIPPED")) {
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
              if (imgSrc.length === 0 && workflow.actions !== undefined && workflow.actions !== null) {
                // Look for the node in the workflow
                const action = workflow.actions.find(
                  (action) => action.id === data.action.id
                )
                if (action !== undefined && action !== null) {
                  imgSrc = action.large_image;
                }
              }

			  if ((imgSrc === undefined || imgSrc === null || imgSrc.length === 0) && cy !== undefined && cy !== null) {
				  const foundnode = cy.getElementById(data.action.id)
				  if (foundnode !== undefined && foundnode !== null && foundnode.length > 0) {
					  // FIXME: Find image from cytoscape action
				  } else {
					  for (let actionkey in workflow.actions) {
						  if (workflow.actions[actionkey].app_name === data.action.app_name || workflow.actions[actionkey].id === data.action.id || workflow.actions[actionkey].label === data.action.label || workflow.actions[actionkey].name === data.action.name) {

							  if (workflow.actions[actionkey].large_image !== undefined && workflow.actions[actionkey].large_image !== null && workflow.actions[actionkey].large_image.length > 0) {
								  imgSrc = workflow.actions[actionkey].large_image
								  break
							  }
						  }
					  }
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
                      borderRadius: executionData.start === data.action.id ? 25 : 5,
                    }}
                  />
                );

              if (triggers.length > 2) {
                if (data.action.app_name === "shuffle-subflow") {
                  const parsedImage = triggers[3].large_image;
                  actionimg = (
                    <img
                      alt={"Shuffle Subflow"}
                      src={parsedImage}
                      style={{
                        marginRight: 20,
                        width: imgsize,
                        height: imgsize,
                        border: `2px solid ${statusColor}`,
                        borderRadius: executionData.start === data.action.id ? 25 : 5,
                      }}
                    />
                  );
                }

                if (data.action.app_name === "User Input") {
                  actionimg = (
                    <img
                      alt={"Shuffle Subflow"}
                      src={triggers[4].large_image}
                      style={{
                        marginRight: 20,
                        width: imgsize,
                        height: imgsize,
                        borderRadius: executionData.start === data.action.id ? 25 : 5,
                      }}
                    />
                  );
                }
              }

              if (data.action.app_name === "Shuffle Tools" && data.action.id !== undefined && cy !== undefined) {
                const nodedata = cy.getElementById(data.action.id).data();
                //if (nodedata !== undefined && nodedata !== null && nodedata.fillstyle === "linear-gradient") {
                if (nodedata !== undefined && nodedata !== null) { 
                  var imgStyle = {
                    marginRight: 20,
                    width: imgsize,
                    height: imgsize,
                    border: `2px solid ${statusColor}`,
                    borderRadius: executionData.start === data.action.id ? 25 : 5,
                    background: `linear-gradient(to right, ${nodedata.fillGradient})`,
                  };

                  actionimg = (
                    <img
                      alt={nodedata.label}
                      src={nodedata.large_image}
                      style={imgStyle}
                    />
                  );
                } else {
					//console.log("Node not found: ", nodedata)
					actionimg = (
						<img
							alt={data.action.app_name}
							src={data.action.large_image}
							style={{
								marginRight: 20,
								width: imgsize,
								height: imgsize,
								border: `2px solid ${statusColor}`,
								borderRadius: executionData.start === data.action.id ? 25 : 5,
							}}
						/>
					)
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
								if (data.similar_actions !== undefined && data.similar_actions !== null) {
									for (let [k,kval] in Object.entries(data.similar_actions)){
										if (data.similar_actions.hasOwnProperty(k)) {
											if (data.similar_actions[k].similarity > minimumMatch) {
												matching_executions.push(data.similar_actions[k].execution_id)
											}
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
                      style={{ zIndex: 50000, marginLeft: 50, }}
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
                        <PreviewIcon style={{ color: "rgba(255,255,255,0.5)" }} />
                      </IconButton>
                    </Tooltip>
                }
              }

          	  const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;
			  const chosenNodeId = new URLSearchParams(cursearch).get("node");
			  const highlightNode = chosenNodeId !== null && chosenNodeId !== undefined && chosenNodeId !== "" && chosenNodeId === data.action.id 

              return (
                <div
                  key={index}
                  style={{
                    marginBottom: 20,
                    border: highlightNode ? "2px solid red" 
					:
                      data.action.sub_action === true
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid rgba(255,255,255, 0.3)",
                    borderRadius: theme.palette?.borderRadius,
                    backgroundColor: theme.palette.inputColor,
                    padding: "15px 10px 10px 10px",
                    overflow: "hidden",
                  }}
                  onMouseOver={() => {
					  if (cy == undefined || cy == null) {
						  return
					  }

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
					  if (cy == undefined || cy == null) {
						  return
					  }

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
						  if (cy !== undefined) {
							  const oldstartnode = cy.getElementById(data.action.id);
							  //console.log("FOUND NODe: ", oldstartnode)
							  if (oldstartnode !== undefined && oldstartnode !== null) {
								const foundname = oldstartnode.data("label")
								if (foundname !== undefined && foundname !== null) {
								  data.action.label = foundname
								}
							  }

							  //console.log("Click data: ", data)
							  //data.action.label = ""
							  setSelectedResult(data);
                setActiveDialog("result")
							  setCodeModalOpen(true);
						  } else {
							  toast("Please wait until the workflow is loaded and try again")
							  setCodeModalOpen(true)
							  setSelectedResult(data)

							}
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
                          <b>{data.action.label === undefined || data.action.label === null || data.action.label === "" ? data.action.label : data.action.label.replaceAll("_", " ")}</b>
							  
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
                              onClick={(event) => { }}
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

				  { data.status !== "SUCCESS" ?
					  <div style={{ marginBottom: 5, display: "flex" }}>
						<Typography variant="body1">
						  <b>Status&nbsp;</b>
						</Typography>
						<Typography variant="body1" color="textSecondary" style={{ marginRight: 15, }}>
						  {data.status}
						</Typography>
						{similarActionsView}
					  </div>
				  : null}

                  {validate.valid ? (
                    <span>
                      <ReactJson
                        src={validate.result}
                        theme={theme.palette.jsonTheme}
                        style={theme.palette.reactJsonStyle}
                        collapsed={false}
		  				shouldCollapse={(jsonField) => {
		  				  return collapseField(jsonField)
		  				}}
		  				iconStyle={theme.palette.jsonIconStyle}
		  				collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
		  				displayArrayKey={false}
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

  const validate = !codeModalOpen ? "" : validateJson(selectedResult.result.trim())
  if (validate.valid && typeof validate.result === "string") {
    validate.result = JSON.parse(validate.result)
  }

  const AppResultVariable = ({ data, action }) => {
    const [open, setOpen] = React.useState(false)
    const showVariable = data.value.length < 60

		// Check if it's valid JSON
	const checked = validateJson(data.value.trim())

	if (data.name === "shuffle_action_logs" && data.value !== undefined && data.value !== null && data.value.length > 0 && data.value.includes("add env SHUFFLE_LOGS_DISABLED")) {
		return (
			<div style={{ maxWidth: 600, marginTop: 15, overflowX: "hidden", }}>
				<Typography
				  variant="body1"
				  style={{}}
				>
				  <b>Action Logs</b>
				</Typography>
				<Typography variant="body2" style={{ whiteSpace: 'pre-line', }}>
					Logs for an action are not available without <a style={{color: "#f85a3e", }} href="/admin?tab=locations" target="_blank" rel="noopener noreferrer">an onprem environment</a> with the <a style={{color: "#f85a3e", }} href="/docs/configuration#scaling-shuffle" target="_blank" rel="noopener noreferrer">SHUFFLE_LOGS_DISABLED</a> environment variable set to false: SHUFFLE_LOGS_DISABLED=false. Logs are enabled by default, except in scale mode.
				</Typography>
			</div> 
		)
	}

	var showlink = false
	if (data.name.endsWith("-Url")) {
		//data.name = data.name.toLowerCase().replaceAll("-", "_")
		if (data.value.startsWith(", ")) {
			data.value = data.value.substring(2)
		}

		if (data.value.startsWith("http") || (data.value.startsWith("/") && data.value.includes("?"))) {
			showlink = true 
		}
	}

    return (
      <div style={{ maxWidth: 600, overflowX: "hidden", }}>
        {data.value.length > 60 || checked.valid ?
          <IconButton
            style={{
              marginBottom: 0, 
			  marginTop: 5, 
			  cursor: "pointer",
              padding: 3,
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: theme.palette?.borderRadius,
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
              <b>{data.name}</b>
				{checked.valid ? 
					<Chip
						style={{marginLeft: 10, padding: 0, cursor: "pointer",}}
						label={"JSON"}
						variant="outlined"
						color="secondary"
					/>
				: null}
				{showVariable ? data.value : null}
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
			checked.valid ?
				<ReactJson
					src={checked.result}
					theme={theme.palette.jsonTheme}
					style={theme.palette.reactJsonStyle}
					collapsed={data.value.length < 10000 ? false : true}
					shouldCollapse={(jsonField) => {
					  return collapseField(jsonField)
					}}
		  			iconStyle={theme.palette.jsonIconStyle}
		  			collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
		  			displayArrayKey={false}
					displayDataTypes={false}
					name={"Parsed data for variable " + data.name}
				/>
			:
				<Typography
					variant="body2"
					style={{
						whiteSpace: 'pre-line',
						color: showlink ? "#f85a3e" : "white",
						cursor: showlink ? "pointer" : "default",
					}}
					onClick={(e) => {
						if (showlink) {
							e.preventDefault()
							e.stopPropagation()
							window.open(data.value, "_blank")
						}
					}}
					color={showlink ? "inherit" : "textSecondary"}
				>
					{data.value}
				</Typography>
          : null}
      </div>
    )
  }

  var draggingDisabled = false;

  // Should probably put this on the backend instead when notifications are made :))
  const getErrorSuggestion = (result) => {
	  if (result === undefined || result === null) {
		  return ""
	  }

	  // Check if array with json inside to handle one item at a time~
	  if (typeof result === "object" && result.length !== undefined) {
		  if (result.length > 0) {
			  // Check type inside
			  if (typeof result[0] === "object") {
				  result = result[0]
			  }
		  }
	  }

	  if (result.success === true && result.status === 200) {
		  if (result.body !== undefined && result.body !== null) {
			  const stringbody = result.body.toString()
			  if ((stringbody.startsWith("{") && stringbody.endsWith("}")) || (stringbody.startsWith("[") && stringbody.endsWith("]"))) {
				  return ""
			  }

			  if (stringbody.length > 1000) {
				  return "Body looks to be big in a standard format. Consider using the 'To File' parameter to automatically make it into a file."
			  }
		  }
	  }

	  if (result.status === 429) {
		  return "Rate limit exceeded. Consider using a different API key or wait a bit before trying again."
	  }

	  if (result.status === 405) {
		  return "Method not allowed. Check the URL to ensure it has all the required parameters. If you keep getting a 405, please forward a screenshot of this to support@shuffler.io"
	  }

	  if (result.status === 415) {
		  return "Content-Type header missing or wrong. Please add the correct Content-Type header and save the workflow."
	  }

	  if (result.status === 401) {
		  return "Authentication failed (401). The URL or auth key is wrong. Check the body of the result for more information."
	  }

	  if (result.status === 403) {
		  return "Authorization failed (403). The API user most likely doesn't have the correct permissions. Check the body of the result for more information."
	  }

	  if (result.status === 404) {
		  return "The URL, or content of the URL is incorrect. Check it and try again."
	  }

	  if (result.status === 400) {
		  return "The queries or data sent to the API is most likely wrong (400). Check the body of the result for more information."
	  }

	  if (result.status === 200 || result.status === 201 || result.status === 204) {
		  return "It looks like the result was successful! If it didn't work, make sure to check if the body you are sending was correct."
	  }


	  // Validate and check for newlines
	  if (result.success !== false) {

		  var stringjson = result
		  const valid = validateJson(stringjson, true)
		  if (valid.valid === false) {
			  if (stringjson.startsWith("{") && stringjson.endsWith("}")) {
				  // Look for newline
				  if (stringjson.includes("\n") && !stringjson.includes("\n")) {
					return "Looks like you have a newline problem. Consider using the | replace: '\n', '\\n' }} filter in Liquid."
				  } else {
					return "The result looks like it should be JSON, but is invalid. Look for potential single quotes instead of double quotes, missing commas or newlines"
				  }
			  }
		  }

		  //return ""
	  } 


	  try {
		  stringjson = JSON.stringify(result)
	  } catch (e) {
	  }

	  stringjson = stringjson.toLowerCase()
	  if (stringjson.includes("localhost")) {
		  return "You can't use localhost in apps. Use the external ip or url of the server instead"
	  }

	  if (stringjson.includes("manifest unknown")) {
		  return "The app's Docker Image is not available in the environment yet. Re-run the app to force a re-download of the app. If the problem persists, contact support" 
	  }

	  if (result.status !== 200 && result.url !== undefined && result.url !== null && typeof result.url === "string" && (result.url.includes("192.168") || result.url.includes("172.16") || result.url.includes("10.0"))) {
		  return "Consider whether your Orborus environment can connect to a local IP or not."
	  }

	  if (stringjson.includes("kms/")) {
		  return "KMS authentication most likely failed. Check your notifications for more details on this page: /admin?admin_tab=priorities. If you need help with KMS, please contact support@shuffler.io"
	  }

	  if (stringjson.includes("invalidurl")) {
		// IF count of "http" is more than one, 1, it's prolly invalid
		var additionalinfo = ""
		if (stringjson.includes("http") && stringjson.match(/http/g).length > 1) {
			additionalinfo = "You may be using multiple 'http' in the URL. "
		}

		return "The URL is invalid. Change the URL to a valid one, and try again. "+additionalinfo
	  }

	  if (stringjson.includes("result too large to handle")) {
		  return "Execution loading failed. Reload the execution by closing it and clicking it again"
	  }

	  if (isCloud && stringjson.toLowerCase().includes("timeout error")) {
		  return "Run this workflow in a local environment to increase the timeout. Go to https://shuffler.io/admin?tab=locationsto create an environment to connect to"
	  }

	  if (stringjson.toLowerCase().includes("invalid header")) {
		  return "A header or authentication token in the app is invalid. Check the app's configuration"
	  }


	  if (stringjson.includes("connectionerror")) {
		  if (stringjson.includes("kms")) {
			  return "KMS authentication most likely failed (2). Check your notifications for more details on this page: /admin?admin_tab=priorities&kms=true. If you need help with KMS, please contact support@shuffler.io"
		  }

		  return "The URL is incorrect, or Shuffle can't reach it. Set up a Shuffle Environment in the same VLAN, or whitelist Shuffle's IPs."
	  }


	  return ""
  }

  const currentSuggestion = getErrorSuggestion(validate.result)
  const codePopoutModal = !codeModalOpen ? null : (
      <Dialog
		PaperComponent={PaperComponent}
		aria-labelledby="draggable-dialog-title"
        disableEnforceFocus={true}
        style={{ pointerEvents: "none", zIndex : activeDialog === "result" ? 1200 : 1100 }}
        hideBackdrop={true}
        open={codeModalOpen}
        PaperProps={{
          onClick : () => setActiveDialog("result"),
          style: {
            pointerEvents: "auto",
            color: "white",
            minWidth: isMobile ? "90%" : 750,
            padding: 30,
            maxHeight: 550,
            overflowY: "auto",
            overflowX: "hidden",
            // zIndex: 10012,
						border: theme.palette.defaultBorder,
          },
        }}
      >
	  	{/* Have a sticky top bar */}
        <span id="top_bar" style={{ position: "sticky", top: -30, zIndex: 12000, }}>
          <Tooltip
            title="Suggest solution"
            placement="top"
            style={{ zIndex: 50000 }}
          >
            <IconButton
	  		  disabled
              style={{
                zIndex: 5000,
                position: "absolute",
                top: 4,
                right: 210,
              }}
              onClick={(e) => {
                e.preventDefault()
			  }}
	  		>
	  			<AutoFixHighIcon />
	  		</IconButton>
	  	  </Tooltip>
          <Tooltip
            title="Find successful execution"
            placement="top"
            style={{ zIndex: 50000 }}
          >
            <IconButton
              style={{
                zIndex: 5000,
                position: "absolute",
                top: 4,
                right: 170,
              }}
              onClick={(e) => {
                e.preventDefault()

				if (workflowExecutions !== null) {
                	for (let execkey in workflowExecutions) {
                	  const execution = workflowExecutions[execkey];
					  if (execution.execution_argument.includes("too large")) {
					  	continue
					  }

                	  const result = execution.results.find((data) => data.status === "SUCCESS" && data.action.id === selectedResult.action.id)

					  if (result !== undefined) {
					  	const oldstartnode = cy.getElementById(selectedResult.action.id)
					  	if (oldstartnode !== undefined && oldstartnode !== null) {
					  		const foundname = oldstartnode.data("label")
					  		if (foundname !== undefined && foundname !== null) {
					  			result.action.label = foundname
					  		}
					  	}

					  	setSelectedResult(result)
					  	setUpdate(Math.random())
					  	break;
					  }
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
                top: 4,
                right: 136,
              }}
              onClick={(e) => {
                e.preventDefault();
                for (let execkey in workflowExecutions) {
                  const execution = workflowExecutions[execkey];
                  const result = execution.results.find(
                    (data) =>
                      data.action.id === selectedResult.action.id &&
                      data.status !== "SUCCESS" &&
                      data.status !== "SKIPPED" &&
                      data.status !== "WAITING"
                  );

                if (result !== undefined) {
                  const oldstartnode = cy.getElementById(selectedResult.action.id);
                  if (oldstartnode !== undefined && oldstartnode !== null) {
                    const foundname = oldstartnode.data("label")
                    if (foundname !== undefined && foundname !== null) {
                      result.action.label = foundname
                    }
                  }

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
            style={{ zIndex: 5000, position: "absolute", top: 4, right: 98 }}
            onClick={(e) => {
              e.preventDefault();
              const executionIndex = workflowExecutions.findIndex((data) => data.execution_id === selectedResult.execution_id);

              if (executionIndex !== -1) {
                setExecutionModalOpen(true);
                setExecutionModalView(1);

								if (workflowExecutions[executionIndex] !== undefined && workflowExecutions[executionIndex] !== null && workflowExecutions[executionIndex].execution_argument.includes("too large")) {
									//checkStarted = true 
									setExecutionData({});
									start();
									setExecutionRunning(true);
									setExecutionRequestStarted(false);
								} else {
                	setExecutionData(workflowExecutions[executionIndex]);
								}
              }
            }}
          >
            <VisibilityIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
        <Tooltip
          title="Move window"
          placement="top"
          style={{ zIndex: 10011 }}
        >
          <IconButton
            id="draggable-dialog-title"
            style={{ 
				zIndex: 5000, 
				position: "absolute", 
				top: 4, 
				right: 34, 
				cursor: "move",
			}}
            onClick={(e) => {
            }}
          >
            <DragIndicatorIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
        <Tooltip
          title="Close window"
          placement="top"
          style={{ zIndex: 10011 }}
        >
          <IconButton
            style={{ zIndex: 5000, position: "absolute", top: 4, right: 4, }}
            onClick={(e) => {
              e.preventDefault();
              setCodeModalOpen(false);
            }}
          >
            <CloseIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
      </span>

      <div style={{ marginBottom: 40,  }}>
        <div style={{ display: "flex", marginBottom: 15, position: "sticky", top: -31, zIndex: 10000, backgroundColor: "rgba(56,56,56, 1)", }}>
          {curapp === null ? null : (
            <img
              alt={selectedResult.action.app_name}
              src={selectedResult === undefined ? theme.palette.defaultImage : selectedResult.action.app_name === "shuffle-subflow" ? triggers[3].large_image : selectedResult.action.app_name === "User Input" ? triggers[4].large_image : selectedResult.action !== undefined && selectedResult.action.large_image !== undefined && selectedResult.action.large_image !== null && selectedResult.action.large_image !== "" ? selectedResult.action.large_image : curapp !== undefined ? curapp.large_image : theme.palette.defaultImage}
              style={{
                marginRight: 20,
                width: imgsize,
                height: imgsize,
                border: `2px solid ${statusColor}`,
				filter: curapp === undefined ? "grayscale(100%)" : null,
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
              <b>{selectedResult.action.label.replaceAll("_", " ")}</b>
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", }}>{selectedResult.action.name}</div>
          </div>
        </div>


	  	{currentSuggestion.length > 0 ?
			<div style={{ marginBottom: 5 }}>
			  <b style={{color: "rgba(214,110,117)", }}>Debug:</b> {currentSuggestion}
			</div>
		: 
			<div style={{ marginBottom: 5 }}>
			  <b>Status </b> {selectedResult.status}
			</div>
		}

        {validate.valid ? (
          <ReactJson
            src={validate.result}
            theme={theme.palette.jsonTheme}
            style={theme.palette.reactJsonStyle}
            collapsed={selectedResult.result.length < 10000 ? false : true}
			shouldCollapse={(jsonField) => {
			  return collapseField(jsonField)
			}}
		  	iconStyle={theme.palette.jsonIconStyle}
		  	collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
		  	displayArrayKey={false}
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
            <b>Result</b>
			<br/>
            <span
			  style={{
			  	wordBreak: "break-word",
			    display: "inline-block",
			    whiteSpace: "pre-wrap",
			  }}

              onClick={() => {
                to_be_copied = selectedResult.result;
                var copyText = document.getElementById(
                  "copy_element_shuffle"
                );

                if (copyText !== null && copyText !== undefined) {
                  const clipboard = navigator.clipboard;
                  if (clipboard === undefined) {
                    toast("Can only copy over HTTPS (port 3443)");
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
                Variables <span style={{ fontSize: 10 }}>(click to expand)</span>
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
                  <AppResultVariable key={index} data={data} action={selectedResult.action} />
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
        {workflow.id === undefined || workflow.id === null || appsLoaded === false ? (
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
		  <span>
          {/*<Fade in={true} timeout={1000} style={{ transitionDelay: `${150}ms` }}>*/}
            <CytoscapeComponent
              elements={elements}
              minZoom={0.35}
              maxZoom={2.0}
              wheelSensitivity={0.25}
              style={{
                width: cytoscapeWidth,
                height: bodyHeight - appBarSize - 5,
                backgroundColor: theme.palette.surfaceColor,
              }}
              stylesheet={cystyle}
              boxSelectionEnabled={true}
              autounselectify={false}
              showGrid={true}
              id="cytoscape_view"
              cy={(incy) => {
                // FIXME: There's something specific loading when
                // you do the first hover of a node. Why is this different?
                

			    setCy(incy);
              }}
            />
		  </span>
        )}
      </div>
      {executionModal}

      <RightSideBar />  
      {
        rightSideBarOpen && Object.getOwnPropertyNames(selectedAction).length > 0 ? 
		<Fade in={true} timeout={250} style={{ transitionDelay: `${0}ms` }}>
        	<div id="rightside_actions" style={rightsidebarStyle}>
			  <ParsedAction
				id="rightside_subactions"
				files={files}
				isCloud={isCloud}
				getParents={getParents}
				toolsAppId={toolsApp.id}
				setShowVideo={setShowVideo}
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
				aiSubmit={aiSubmit}
				listCache={listCache}
				setActiveDialog={setActiveDialog}
				apps={apps}
				expansionModalOpen={codeEditorModalOpen}
				setExpansionModalOpen={setCodeEditorModalOpen}
				setEditorData={setEditorData}
				setAiQueryModalOpen={setAiQueryModalOpen}
			  />
        	</div> 
		</Fade>
		  : null
      }
	  {/* Looks for triggers" */}
	  {/* Only fixed the ones that require scrolling on a small screen */}
	  {/* Most important: Actions. But these are a lot more complex */}
	  {rightSideBarOpen && (selectedTrigger.trigger_type === "SCHEDULE" || selectedTrigger.trigger_type === "WEBHOOK" || selectedTrigger.trigger_type === "PIPELINE" || selectedTrigger.trigger_type === "USERINPUT") ?
		  <div id="rightside_actions" style={rightsidebarStyle}>
			  {Object.getOwnPropertyNames(selectedTrigger).length > 0 ? 
				selectedTrigger.trigger_type === "SCHEDULE" ? 
					ScheduleSidebar 
				: selectedTrigger.trigger_type === "PIPELINE" ? 
					PipelineSidebar 
				: selectedTrigger.trigger_type === "WEBHOOK" ? 
					WebhookSidebar
        : selectedTrigger.trigger_type === "USERINPUT" ? 
          UserinputSidebar
				: null 
			  : null}
		  </div>
	  : null}

    {
      rightSideBarOpen && selectedTrigger.trigger_type === "SUBFLOW"&& Object.getOwnPropertyNames(selectedTrigger).length > 0   ? 
      <div id="rightside_actions" style={rightsidebarStyle}>
        <SubflowSidebar/>
        </div> : null
    }
	  
	  {/*
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
	  */}

	  {showWorkflowRevisions ? null :
	  	<span>
			{/*<BottomAvatars />*/}
  			{shownErrors} 
			<BottomCytoscapeBar />
			<TopCytoscapeBar />
			<RightsideBar />
		</span>
	  }
    </div>
  );


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
          setNewVariableValue("");

          setExecutionVariablesModalOpen(false);
        }}
        PaperProps={{
          style: {
            pointerEvents: "auto",
            color: "white",
            border: theme.palette.defaultBorder,
            maxWidth: isMobile ? bodyWidth - 100 : 800,
						minWidth: isMobile ? bodyWidth - 100 : 800,
          },
        }}
      >
        <FormControl>
          <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
            <span style={{ color: "white" }}>Runtime Variable</span>
          </DialogTitle>
          <DialogContent>
            Runtime Variables are TEMPORARY variables that you can only be set
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
				label="Name"
              fullWidth
              defaultValue={newVariableName}
            />
            <TextField
              onBlur={(event) => setNewVariableValue(event.target.value)}
              color="primary"
              placeholder="Default Value (optional)"
              style={{ marginTop: 25 }}
              InputProps={{
                style: {
                  color: "white",
                },
              }}
              margin="dense"
							label="Default Value (optional)"
              fullWidth
              defaultValue={newVariableValue}
            />
          </DialogContent>
          <DialogActions>
            <Button
              style={{ borderRadius: "0px" }}
              onClick={() => {
                setNewVariableName("");
                setNewVariableValue("");
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

									if (newVariableValue.length > 0) {
										workflow.execution_variables[found].value = newVariableValue;
									}
                } else {
                  workflow.execution_variables.push({
                    name: newVariableName,
                    value: newVariableValue,
                    description: "An execution variable",
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
                )
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
            color: "white",
            border: theme.palette.defaultBorder,
            maxWidth: isMobile ? bodyWidth - 100 : "100%",
          },
        }}
      >
        <FormControl>
          <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
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
          <Typography variant="h4" id="draggable-dialog-title" style={{ cursor: "move", }}>
            {selectedApp.name} does not require authentication
          </Typography>
        </DialogContent>
      );
    }

    authenticationOption.app.actions = [];

    for (let paramkey in selectedApp.authentication.parameters) {
      if (
        authenticationOption.fields[
        selectedApp.authentication.parameters[paramkey].name
        ] === undefined
      ) {
        authenticationOption.fields[
          selectedApp.authentication.parameters[paramkey].name
        ] = "";
      }
    }

    const handleSubmitCheck = () => {
      if (authenticationOption.label.length === 0) {
        authenticationOption.label = `Auth for ${selectedApp.name}`;
      }

      // Automatically mapping fields that already exist (predefined).
      // Warning if fields are NOT filled
      for (let paramkey in selectedApp.authentication.parameters) {
        if (
          authenticationOption.fields[
            selectedApp.authentication.parameters[paramkey].name
          ].length === 0
        ) {
          if (
            selectedApp.authentication.parameters[paramkey].value !== undefined &&
            selectedApp.authentication.parameters[paramkey].value !== null &&
            selectedApp.authentication.parameters[paramkey].value.length > 0
          ) {
            authenticationOption.fields[
              selectedApp.authentication.parameters[paramkey].name
            ] = selectedApp.authentication.parameters[paramkey].value;
          } else {
            if (
              selectedApp.authentication.parameters[paramkey].schema.type === "bool"
            ) {
              authenticationOption.fields[
                selectedApp.authentication.parameters[paramkey].name
              ] = "false";
            } else {
              toast(
                "Field " +
                selectedApp.authentication.parameters[paramkey].name +
                " can't be empty"
              );
              return;
            }
          }
        }
      }

      selectedAction.authentication_id = authenticationOption.id;
      selectedAction.selectedAuthentication = authenticationOption;

	  console.log("auth option 4: ", authenticationOption)

      if (selectedAction.authentication === undefined || selectedAction.authentication === null) {

        selectedAction.authentication = [authenticationOption]
      } else {

		try {
        	selectedAction.authentication.push(authenticationOption)
		} catch (e) {
			//console.log("Error: ", e)
		}
      }

      setSelectedAction(selectedAction)

      var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
      var newFields = [];
	  console.log("Fields: ", newAuthOption.fields)
      for (let authkey in newAuthOption.fields) {
        const value = newAuthOption.fields[authkey];
        newFields.push({
          "key": authkey,
          "value": value,
        });
      }

      newAuthOption.fields = newFields
      setNewAppAuth(newAuthOption)

      if (configureWorkflowModalOpen) {
        setSelectedAction({})
      }

      setUpdate(authenticationOption.id)
    }

	if (authenticationOption.label === null || authenticationOption.label === undefined) {
	  authenticationOption.label = selectedApp.name + " authentication";
    }

    return (
      <div>
        <DialogTitle id="draggable-dialog-title" style={{ cursor: "move", }}>
          <div style={{ color: "white" }}>
            Authentication for {selectedApp.name.replaceAll("_", " ", -1)}
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
          <b>Label for you to remember</b>
          <TextField
            style={{
              backgroundColor: theme.palette.inputColor,
              borderRadius: theme.palette?.borderRadius,
            }}
            InputProps={{
              style: {
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
			// FIXME: Look for relevant fields in the action that may already be filled in with the same name
			if (data.value === "" || data.value === null || data.value === undefined || data.name === "url") {
				if (selectedAction !== undefined && selectedAction !== null && selectedAction.parameters !== undefined && selectedAction.parameters !== null) {
					for (var fieldkey in selectedAction.parameters) {
						const field = selectedAction.parameters[fieldkey]
						if (field.name !== data.name) {
							continue
						}

						if (field.value !== undefined && field.value !== null && field.value.length > 0) {
							data.value = field.value
							data.autocomplete = true
							break
						}
					}
				}
			}


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
                      backgroundColor: theme.palette.inputColor,
                      borderRadius: theme.palette?.borderRadius,
                    }}
                    InputProps={{
                      style: {
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
            style={{}}
            onClick={() => {
              setAuthenticationModalOpen(false);
            }}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            style={{}}
			variant="outlined"
            onClick={() => {
              setAuthenticationOptions(authenticationOption);
              handleSubmitCheck()
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
            color: "white",
            minWidth: 650,
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
            color: "white",
          }}
          onClick={() => {
            setConfigureWorkflowModalOpen(false);
          }}
        >
          <CloseIcon />
        </IconButton>
		<div style={{height: 75, width: "100%", background: `linear-gradient(to right, #f86a3e, #fc3922)`, position: "relative",}} />
		<div style={{ padding: "50px 0px 50px 0px", }}>
			<ConfigureWorkflow
			  workflow={workflow}
			  userdata={userdata}
			  globalUrl={globalUrl}
			  apps={apps}
			  setAuthenticationType={setAuthenticationType}
			  setSelectedAction={setSelectedAction}
			  setSelectedApp={setSelectedApp}
			  setAuthenticationModalOpen={setAuthenticationModalOpen}
			  appAuthentication={appAuthentication}
			  selectedAction={selectedAction}
			  setConfigureWorkflowModalOpen={setConfigureWorkflowModalOpen}
			  saveWorkflow={saveWorkflow}
			  newWebhook={newWebhook}
			  submitSchedule={submitSchedule}
			  referenceUrl={referenceUrl}
			  workflowExecutions={workflowExecutions}
			  getWorkflowExecution={getWorkflowExecution}
			  isCloud={isCloud}
			/>
		</div>
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
		  //
		setSelectedMeta(undefined)
      }}
      PaperProps={{
        style: {
          pointerEvents: "auto",
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
          right: 75,
          height: 50,
          width: 50,
        }}
      >
        { selectedApp.reference_info === undefined ||
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
                borderRadius: theme.palette?.borderRadius,
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
                borderRadius: theme.palette?.borderRadius,
                maxWidth: 30,
                maxHeight: 30,
                overflow: "hidden",
                fontSize: 8,
              }}
            />
          </a>
        )}
      </div>
	  <Tooltip
		color="primary"
		title={`Move window`}
		placement="left"
	  >
		  <IconButton
			id="draggable-dialog-title"
			style={{
			  zIndex: 5000,
			  position: "absolute",
			  top: 14,
			  right: 50,
			  color: "grey",

			  cursor: "move", 
			}}
		  >
			<DragIndicatorIcon />
		  </IconButton>
	  </Tooltip>
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
            minHeight: isMobile ? "90%" : 700,
            maxHeight: isMobile ? "90%" : 700,
            overflowY: "auto",
            overflowX: isMobile ? "auto" : "hidden",
          }}
        >
          {authenticationType.type === "oauth2" || authenticationType.type === "oauth2-app"  ? 
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
              isCloud={isCloud}
            />
           : 
            <AuthenticationData app={selectedApp} />
          }
        </div>
        <div
          style={{
            flex: 3,
            borderLeft: `1px solid ${theme.palette.inputColor}`,
            padding: "70px 30px 30px 30px",
            maxHeight: 630,
            minHeight: 630,
            overflowY: "auto",
            overflowX: "hidden",
          }}
	  	  onLoad={() => {
			  /*
			if (isCloud && ReactGA !== undefined) {
				toast("Sending GA info")
				// Google analytics info about what app people are looking at 
				ReactGA.event({
					category: "workflow",
					action: `documentation_load`,
					label: selectedApp.name,
				})

			}
			*/
		  }}
        >
          {selectedApp.documentation === undefined ||
            selectedApp.documentation === null ||
            selectedApp.documentation.length === 0 ? (
            <span 
				style={{ textAlign: "center" }}
			>
			  <div style={{textAlign: "left", }}>
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
						maxWidth: "100%", 
						minWidth: "100%", 
						textAlign: "left", 
					}}
				  >
					{selectedApp.description}
				  </Markdown>
			  </div>
              <Divider
                style={{
                  marginTop: 25,
                  marginBottom: 25,
                  backgroundColor: "rgba(255,255,255,0.6)",
                }}
              />

			  <div
                    style={{
                        backgroundColor: theme.palette.inputColor,
                        padding: 15,
                        borderRadius: theme.palette?.borderRadius,
                        marginBottom: 30,
                    }}
                >
				  <Typography variant="h6" style={{marginBottom: 25, }}>
					There is no Shuffle-specific documentation for this app yet outside of the general description above. Documentation is written for each api, and is a community effort. We hope to see your contribution!
				  </Typography>
				  <Button 
						variant="contained" 
						color="primary"
						onClick={() => {
							toast.success("Opening remote Github documentation link. Thanks for contributing!")

							setTimeout(() => {
								window.open(`https://github.com/Shuffle/openapi-apps/new/master/docs?filename=${selectedApp.name.toLowerCase()}.md`, "_blank")
							}, 2500)
						}}
				   >
					  <EditIcon /> &nbsp;&nbsp;Create Docs
				   </Button>
                </div>

              <Typography variant="body1" style={{ marginTop: 25 }}>
                Want to help the making of, or improve this app?{" "}
				<br />
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
			<div>
			  {selectedMeta !== undefined && selectedMeta !== null && Object.getOwnPropertyNames(selectedMeta).length > 0 && selectedMeta.name !== undefined && selectedMeta.name !== null ? 
				<div
					style={{
						backgroundColor: theme.palette.inputColor,
						padding: 15,
						borderRadius: theme.palette?.borderRadius,
						marginBottom: 30,
						display: "flex",
					}}
				>
				<div style={{ flex: 3, display: "flex", vAlign: "center", position: "sticky", top: 50, }}>
					{isMobile ? null : (
						<Typography style={{ display: "inline", marginTop: 6 }}>
							<a
								rel="noopener noreferrer"
								target="_blank"
								href={selectedMeta.link}
								style={{ textDecoration: "none", color: "#f85a3e" }}
							>
								<Button style={{ color: "white", }} variant="outlined" color="secondary">
									<EditIcon /> &nbsp;&nbsp;Edit
								</Button>
							</a>
						</Typography>
					)}
					{isMobile ? null : (
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
					{isMobile ||
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
		    : null}

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
			  {selectedApp.documentation}
		    </Markdown>
			</div>
          )}
        </div>
      </div>
    </Dialog>
  ) : null;

  const tenzirConfigModal = !tenzirConfigModalOpen ? null : 
      <Dialog
        PaperComponent={PaperComponent}
        hideBackdrop={true}
        disableEnforceFocus={true}
        disableBackdropClick={true}
        style={{ pointerEvents: "none" }}
        open={tenzirConfigModalOpen}
        PaperProps={{
          style: {
            pointerEvents: "auto",
            color: "white",
            minWidth: 600,
            minHeight: 250,
            maxHeight: 250,
            padding: 50,
            overflow: "hidden",
            zIndex: 10012,
            border: theme.palette.defaultBorder,
          },
        }}
      >
        <DialogTitle id="tenzir-config-modal" style={{ cursor: "move" }}>
          <div style={{ color: "white" }}>Run a Tenzir Pipeline</div>
		  <Typography variant="body2" color="textSecondary" style={{ marginTop: 10, }}>
			Runs a Tenzir pipeline. You can use the output of the pipeline in your workflow.
		  </Typography>
        </DialogTitle>
        <DialogContent>
            <div>
              <b>Pipeline</b>
              <TextField
                id="topic"
                style={{
                  backgroundColor: theme.palette.inputColor,
                  borderRadius: theme.palette?.borderRadius,
                }}
                InputProps={{
                  style: {},
                }}
                fullWidth
                color="primary"
                placeholder={""}
  				defaultValue={selectedOption}
              />
            </div>

        </DialogContent>
  
        <DialogActions>
          <Button
            style={{ borderRadius: "0px" }}
            onClick={() => {
              setTenzirConfigModalOpen(false);
            }}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            style={{ borderRadius: "0px" }}
			variant="contained"
            onClick={() => {
              handleSubmit(selectedTrigger);
            }}
            color="primary"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

	const SuggestionBoxUi = () => {
		const [suggestionValue, setSuggestionValue] = useState("");
		const [suggestionLoading, setSuggestionLoading] = useState(false);
		const [responseMsg, setResponseMsg] = useState("");

		if (suggestionBox === undefined || suggestionBox.open === false) {
			return false
		}

		return ( 
			<div style={{width: 350, padding: 15, position: "fixed", top: suggestionBox.position.top, left: suggestionBox.position.left, borderRadius: theme.palette?.borderRadius, backgroundColor: theme.palette.surfaceColor, border: "1px solid rgba(255,255,255,0.3)", }}>
				{/*
				<AutoFixHighIcon style={{height: 12, width: 12, color: "white", position: "absolute", top: 10, right: 24, }} />
				*/}
				<Tooltip
					title="Close"
					placement="top"
					style={{ zIndex: 10011 }}
				>
					<IconButton
						style={{ zIndex: 5000, position: "absolute", top: 0, right: 0}}
						onClick={(e) => {
							e.preventDefault();
							setSuggestionBox({
								"position": {
									"top": 500,
									"left": 500,
								},
								"open": false,
								"value": "",
								"loading": false,
							});
						}}
					>
						<CloseIcon style={{ color: "white", height: 12, width: 12, }} />
					</IconButton>
				</Tooltip>
				<form onSubmit={(e, value) => {
					e.preventDefault();
					aiSubmit(suggestionValue, setResponseMsg, setSuggestionLoading)
				}}>
					<TextField
						id="suggestion-textfield"
						style={{width: "90%"}}
						disabled={suggestionLoading}
						label="What action do you want to add?"
						onChange={(e) => {
							setSuggestionValue(e.target.value)
						}}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<Tooltip title="Run search" placement="top">
										<SendIcon style={{ cursor: "pointer" }} onClick={(e) => {
											e.preventDefault();
											aiSubmit(suggestionValue, setResponseMsg, setSuggestionLoading)
										}} />
									</Tooltip>
								</InputAdornment>
							),
						}}
					/>
				</form>
				{suggestionLoading === true ?
					<CircularProgress style={{height: 15, width: 15, marginTop: 5, }} />
				: null}
				{responseMsg.length > 0 ?	
					<Typography variant="body2">
						{responseMsg}
					</Typography>
				: null}
			</div>
		)
	}

	  
	  /*else if (selectedRevision === undefined || selectedRevision === null || selectedRevision == {} && originalWorkflow !== undefined && originalWorkflow !== null && originalWorkflow !== {}) {
		  console.log("Setting original workflow as selected revision")
		  setSelectedRevision(originalWorkflow)
	  }*/

  	const RevisionBox = (props) => {
		  const { revision, showBorder,  } = props 
		  if (revision === undefined || revision === null) {
			  return null
		  }

		  var newrevision = JSON.parse(JSON.stringify(revision))
		  // Make unix timestamp into ISO timestamp in the format July 27th, 3:05 AM
		  // Format: July 27th, 3:05 AM	
		  //console.log("Edited time: ", revision.edited)
		  // Convert 1692128391 to valid timestamp
		  const validTimestamp = newrevision.edited.toString().length === 10 ? newrevision.edited * 1000 : newrevision.edited
		  const translatedDate = new Date(validTimestamp).toLocaleString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })

		  var workflowStatus = newrevision.status !== undefined  && newrevision.status !== null && newrevision.status !== "" ? newrevision.status : "test"
		  if (newrevision.name !== undefined && newrevision.name !== null && newrevision.name !== "") {
			  if (newrevision.name.toLowerCase().includes("test")) {
				  workflowStatus = "test"
			  }

			  if (newrevision.name.toLowerCase().includes("dev") || newrevision.name.toLowerCase().includes("staging") || newrevision.name.toLowerCase().includes("rollback")) {
				  workflowStatus = "dev"
			  }

			  if (newrevision.name.toLowerCase().includes("prod") || newrevision.name.toLowerCase().includes("main")) {
				  workflowStatus = "prod"
			  }
		  }

		  return (
		  	<Paper 
				style={{padding: "15px 15px 15px 25px", minHeight: 105, maxHeight: 105, cursor: "pointer", backgroundColor: newrevision.edited === selectedVersion.edited ? "rgba(255,255,255,0.3)" : theme.palette.surfaceColor, border: showBorder === true ? `1px solid ${green}` : "1px solid rgba(255,255,255,0.3)", marginBottom: 10, 
				}} onClick={(e) => {
					if (newrevision.edited === selectedVersion.edited) {
						console.log("Same revision! No setting.")
						return
					}

					// Should render if it's not the same as workflow.edited
					console.log("Clicked revision: ", newrevision)
  					setLastSaved(false)
          			setSelectedVersion(newrevision);
					setWorkflow(newrevision)
                	setSelectedAction({});
  					setSelectedApp({})

  					// Remove all cytoscape triggers first?
					if (cy !== undefined && cy !== null) {
            			cy.removeListener("select");
						cy.removeListener("unselect");

          				cy.removeListener("add");
          				cy.removeListener("remove");

						cy.removeListener("mouseover");
						cy.removeListener("mouseout");

						cy.removeListener("drag");
						cy.removeListener("free");
						cy.removeListener("cxttap");

  						setElements([])

						cy.remove('*')
						cy.edges().remove()
						cy.nodes().remove()
					}


					// Remove all cy nodes
					setTimeout(() => {
						//toast("Running setupgraph with new revision. Actions: " + newrevision.actions.length)
  						setupGraph(newrevision) 
					}, 250)


					// Re-adding cytoscape triggers
					if (cy !== undefined && cy !== null) {
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
					

						if (selectedAction.id !== undefined && selectedAction.id !== null && selectedAction.id !== "") { 
							setTimeout(() => {
								const foundaction = cy.$id(selectedAction.id)
								if (foundaction !== undefined && foundaction !== null) { 
									foundaction.select()
								}
							}, 250)
						}
					}



					// Need to run through graph setup with this one
			}}>
				<div style={{display: "flex", }}>
					<span style={{flex: 5, }}>
						<Typography variant="body1">
							{translatedDate}
               {/* {newrevision.edited.toString().slice(6,10)} | {newrevision.revision_id.slice(0,5)} */}
						</Typography>
					</span>
					<span style={{flex: 2, }}>
			  			<Tooltip title="Workflow status. Change in the Edit Workflow panel" placement="top">
							<Chip
								style={{marginLeft: 10, padding: 0, }}
								label={workflowStatus}
								variant="outlined"
								color="secondary"
							/>
			  			</Tooltip>
					</span>
				</div>
				{/*revision.edited === originalWorkflow.edited ?
					<Typography variant="body2">
						Current version
					</Typography>
				: null*/}
					<div style={{display: "flex", }}>
					  {revision.actions !== undefined && revision.actions !== null ?
						  <Tooltip
							color="primary"
							title="Amount of actions"
							placement="bottom"
						  >
							<span
							  style={{ color: "#979797", display: "flex" }}
							>
							  <AppsIcon 
								style={{
								  color: "#979797",
								  marginTop: "auto",
								  marginBottom: "auto",
								}}
							  />
							  <Typography
								style={{
								  marginLeft: 5,
								  marginTop: "auto",
								  marginBottom: "auto",
								}}
							  >
								{revision.actions.length}
							  </Typography>
							</span>
						  </Tooltip>
					  : null}
					  {revision.triggers !== undefined && revision.triggers !== null  ?
						  <Tooltip
							color="primary"
							title="Amount of triggers"
							placement="bottom"
						  >
							<span
							  style={{ marginLeft: 15, color: "#979797", display: "flex" }}
							>
							  <RestoreIcon
								style={{
								  color: "#979797",
								  marginTop: "auto",
								  marginBottom: "auto",
								}}
							  />
							  <Typography
								style={{
								  marginLeft: 5,
								  marginTop: "auto",
								  marginBottom: "auto",
								}}
							  >
								{revision.triggers.length}
							  </Typography>
							</span>
						  </Tooltip>
					  : null}
					</div>
				{revision.updated_by !== undefined && revision.updated_by !== null && revision.updated_by !== "" ?
					<Typography variant="body2" style={{marginTop: 2, }}>
						{revision.updated_by}
					</Typography>
				: null}
			</Paper>
		  )
	  }

	  const drawerData = originalWorkflow !== undefined && originalWorkflow !== null ?
      <div style={{ height: "100%"}}>
      	<Typography variant="h4" style={{ paddingLeft: 25, paddingTop:25, backgroundColor: theme.palette.surfaceColor, }}>
			Version History
		</Typography>
		<Typography variant="body2" color="textSecondary" style={{ paddingLeft: 25, paddingTop: 5, paddingBottom: 5, backgroundColor: theme.palette.surfaceColor, }}>
			Versions are stored for every change made, up to once per minute. When restoring a version, the changes will not take effect until you save the workflow.
		</Typography>
		<Divider style={{marginTop: 25, }}/>
      	  <div style={{height: "100%", }}>
			  {/*
			  <div style={{paddingLeft: "25px", paddingRight: "25px", paddingTop: "10px"}}>
				  <div style={{marginBottom: "20px", }}>
					  <Typography variant="h6" style={{marginTop: 10, marginBottom: 5, }}>
						  Current Version
						</Typography>
						<RevisionBox 
						  revision={selectedVersion}
						/>
					</div>

					<Divider
						style={{
							marginBottom: 15,
							height: 1,
							width: "100%",
							backgroundColor: "rgb(91, 96, 100)",
						  }}
					/>
          		</div>
				*/}


          {allRevisions.length > 0 ?
            <div style={{overflow: "auto", width: "100%" , height: "75%", paddingLeft: "25px", paddingRight: "20px", paddingTop: "10px", paddingBottom: "10px"}}>
              {
                 allRevisions.map((revision, index) => {
					 /*
                  if(revision.edited === selectedVersion.edited){
                    return null
                  }
				  */

                  return (
                    <RevisionBox 
                      revision={revision} 
                      key={index} 
                      index={index} 

					  showBorder={revision.edited === selectedVersion.edited}
                    />
                  )
                })
              }
            </div>

          : 
            <div style={{padding: 5, }}>
              <Typography variant="body2">
                No other revisions found. Save your workflow with changes to create a revision.
              </Typography>
            </div>
          }
		  </div>
    </div>
		: null

	const workflowRevisions = !showWorkflowRevisions ? null : 
	  	<div style={{position: "absolute", }}>
		  <Drawer
			anchor={"left"}
			open={showWorkflowRevisions}
			onClose={() => {
			  //setShowWorkflowRevisions(false)
			}}
			style={{ resize: "both", overflow: "hidden", zIndex: 10005 }}
			hideBackdrop={true}
			variant="persistent"
			BackdropProps={{
				style: {
			  		//backgroundColor: "transparent",
				}
			}}
			PaperProps={{
				style: {
				  resize: "both",
          overflow: "hidden",
				  minWidth: isMobile ? "100%" : 360,
				  maxWidth: isMobile ? "100%" : 360,
				  backgroundColor: theme.palette.platformColor,
				  color: "white",
				  fontSize: 18,
				  zIndex: 15001,
				  borderRight: theme.palette.defaultBorder,
				},
			}}
		  >
			{drawerData}
		  </Drawer>
			<div style={{position: "fixed", top: 0, left: 0, width: "100%", zIndex: 15000, backgroundColor: theme.palette.platformColor, display: "flex", height: 70, }}>
				<div style={{flex: 1, display: "flex", paddingLeft: 30, paddingTop: 20, }}>
					{/*selectedRevision.edited !== undefined && selectedRevision.edited !== null && selectedRevision.edited !== originalWorkflow.edited ?
						<Button
							variant="contained"
							color="primary"
							style={{marginLeft: 50, }}
							onClick={() => {
								console.log("Select and close")
							}}
						>
							Restore Version
						</Button>
					: null*/}
				</div>
				<div style={{textAlign: "center", color: "white", flex: 1, paddingTop: 20, }}>
					<Typography variant="h6">
						{selectedVersion?.name}
					</Typography>
				</div>
				{/* Cross icon to close it */}
				<div style={{flex: 1, itemAlign: "right", textAlign: "right", paddingRight: 25, paddingTop: 10, }}>
					<IconButton
						onClick={() => {
							setShowWorkflowRevisions(false)
						}}
						style={{color: "white", height: 50, width: 50, }}
					>
						<CloseIcon />
					</IconButton>
				</div>
			</div>
		</div>

	const changeActionParameterCodeMirror = (event, count, data, actionlist) => {
		// Check if event.target.value is an array. If it is, split with comma

		if (data.startsWith("${") && data.endsWith("}")) {
			// PARAM FIX - Gonna use the ID field, even though it's a hack
			const paramcheck = selectedAction.parameters.find(param => param.name === "body")
			if (paramcheck !== undefined) {
				// Escapes all double quotes
				const toReplace = event.target.value.trim().replaceAll("\\\"", "\"").replaceAll("\"", "\\\"");
				if (paramcheck["value_replace"] === undefined || paramcheck["value_replace"] === null) {
					paramcheck["value_replace"] = [{
						"key": data.name,
						"value": toReplace,
					}]

				} else {
					const subparamindex = paramcheck["value_replace"].findIndex(param => param.key === data.name)
					if (subparamindex === -1) {
						paramcheck["value_replace"].push({
							"key": data.name,
							"value": toReplace,
						})
					} else {
						paramcheck["value_replace"][subparamindex]["value"] = toReplace 
					}
				}

				if (paramcheck["value_replace"] === undefined) {
					selectedAction.parameters[count]["value_replace"] = paramcheck
				} else {
					//selectedActionParameters[count]["value_replace"] = paramcheck["value_replace"]
					selectedAction.parameters[count]["value_replace"] = paramcheck["value_replace"]
				}
				setSelectedAction(selectedAction)
				//setUpdate(Math.random())
				return
			}
		}

		if (event.target.value[event.target.value.length-1] === "." && actionlist.length > 0) {
			var curstring = ""
			var record = false
			for (let [key,keyval] in Object.entries(selectedAction.parameters[count].value)) {
				const item = selectedAction.parameters[count].value[key]
				if (record) {
					curstring += item
				}

				if (item === "$") {
					record = true
					curstring = ""
				}
			}

			if (curstring.length > 0 && actionlist !== null) {
				// Search back in the action list
				curstring = curstring.split(" ").join("_").toLowerCase()
				var actionItem = actionlist.find(data => data.autocomplete.split(" ").join("_").toLowerCase() === curstring)
				if (actionItem !== undefined) {
					console.log("Found item: ", actionItem)

					var jsonvalid = true
					try {
						const tmp = String(JSON.parse(actionItem.example))
						if (!actionItem.example.includes("{") && !actionItem.example.includes("[")) {
							jsonvalid = false
						}
					} catch (e) {
						jsonvalid = false
					}
				}
			}
		} 

		if (selectedAction.app_name === "Shuffle Tools" && selectedAction.name === "filter_list" && count === 0) {
			const parsedvalue = data
			if (parsedvalue.includes("#")) {
				const splitparsed = parsedvalue.split(".#.")
				//console.log("Cant contain #: ", splitparsed)
				if (splitparsed.length > 1) {
					//data.value = splitparsed[0]

					selectedAction.parameters[0].value = splitparsed[0]
					selectedAction.parameters[1].value = splitparsed[1] 

					selectedAction.parameters[0].autocompleted = true 
					selectedAction.parameters[1].autocompleted = true 
					setUpdate(Math.random())
				} 
			}
		} else {
			if (selectedAction.parameters !== undefined && selectedAction.parameters !== null && selectedAction.parameters.length > count) {
				selectedAction.parameters[count].autocompleted = false 
				selectedAction.parameters[count].value = data
			}
		}

		setSelectedAction(selectedAction)
		//setUpdate(Math.random())
	}

  /*
  var foundusecase = {}
  if (workflow.actions !== undefined && workflow.actions !== null && workflow.actions.length > 0 && userdata !== undefined && userdata !== null && userdata.priorities !== undefined && userdata.priorities !== null && userdata.priorities.length > 0) {
	  for (let priokey in userdata.priorities) {
		  const prio = userdata.priorities[priokey]
		  if (prio.type !== "usecase") {
			  continue
		  }

		  const descsplit = prio.description.split("&")
		  var srcapp = ""
		  var dstapp = ""
		  if (descsplit.length > 0) {
			  srcapp = descsplit[0].toLowerCase().replaceAll(" ", "_")

			  if (descsplit.length > 2) {
				  dstapp = descsplit[2].toLowerCase().replaceAll(" ", "_")
			  }
		  }

		  if (srcapp.length > 0 && dstapp.length > 0) {
			  for (let actionkey in workflow.actions) {
				  const curaction = workflow.actions[actionkey]
				  const appname = curaction.app_name.toLowerCase().replaceAll(" ", "_")
				  if (appname === srcapp || appname === dstapp) {
					  foundusecase = prio
					  break
				  }
			  }
		  }

		  if (foundusecase.name !== undefined && foundusecase.name !== null && foundusecase.name !== "") {
			  break
		  }
	  }
  }

  const templatePopup = foundusecase.name === undefined || foundusecase.name === null || foundusecase.name === "" ? null :
	<Slide direction="down" in={true} mountOnEnter unmountOnExit>
		<div style={{position: "fixed", top: "10%", left: "37%", border: "1px solid rgba(255,255,255,0.3)", backgroundColor: theme.palette.inputColor, borderRadius: theme.palette?.borderRadius, display: "flex", }}>
			<WorkflowTemplatePopup 
				isLoggedIn={isLoggedIn}
				userdata={userdata}
				globalUrl={globalUrl}

				title={foundusecase.name.split("Suggested Usecase: ")[1]}
				description={"Suggested usecase based on usage"}

				srcapp={foundusecase.description.split("&")[0]}
				img1={foundusecase.description.split("&")[1]}
				dstapp={foundusecase.description.split("&")[2]}
				img2={foundusecase.description.split("&")[3]}
			/>
		</div>
	</Slide>
	*/

  const loadedCheck =
    isLoaded && workflowDone ? (
      <div>
        {newView}
        <VariablesModal variableInfo={variableInfo} setVariableInfo={setVariableInfo} />
        <ExecutionVariableModal variableInfo={variableInfo} setVariableInfo={setVariableInfo} />
  		{aiQueryModal}
        {conditionsModal}
        {codePopoutModal}
		{workflowRevisions}
        {authenticationModal}
        {tenzirConfigModal}
        {/*editWorkflowModal*/}
  		{authgroupModal} 
  		{executionArgumentModal}
        {configureWorkflowModal}
		{/*usecaseSlidein*/}

		<SuggestionBoxUi />

  		{codeEditorModalOpen ?
	  		<ShuffleCodeEditor
				expansionModalOpen={codeEditorModalOpen}
				setExpansionModalOpen={setCodeEditorModalOpen}
				isCloud={isCloud}
				globalUrl={globalUrl}
				workflowExecutions={workflowExecutions}
				getParents={getParents}
				selectedAction={selectedAction}
				aiSubmit={aiSubmit}
				toolsAppId={toolsApp.id}

				codedata={editorData.value}
				setcodedata={setcodedata}

				// Not working out of the box
				parameterName={editorData.name}
				fieldCount={editorData.field_number}
				actionlist={editorData.actionlist}
				fieldname={editorData.field_id}
				editorData={editorData}

				changeActionParameterCodeMirror={changeActionParameterCodeMirror}
				activeDialog={activeDialog}
				setActiveDialog={setActiveDialog}

  				setAiQueryModalOpen={setAiQueryModalOpen}
	  		/>
		: null}

        {editWorkflowModalOpen === true ?
          <EditWorkflow
            workflow={workflow}
            setWorkflow={setWorkflow}
            modalOpen={editWorkflowModalOpen}
            setModalOpen={setEditWorkflowModalOpen}
            isEditing={true}
            userdata={userdata}
            usecases={usecases}
          />
          : null}
        
        {/*selectionOpen === true ?
          <div style={{ borderRadius: theme.palette?.borderRadius, backgroundColor: theme.palette.surfaceColor, zIndex: 12501,position:"fixed", left: 190, bottom: 20,top:70, width: 950, overflowY: "scroll"}}>
            <div>
            <IconButton
              style={{
                zIndex: 12502,
                position: "absolute",
                top: 6,
                right: 6,
                color: "white",
              }}
              onClick={() => {
                setSelectionOpen(false)
              }}
            >
              <CloseIcon />
            </IconButton>
            </div>
            <div style={{marginTop: 60, marginLeft: 55}}>
            <AppStats 
              globalUrl={globalUrl}
              workflowId={workflow.id}
              {...props}
            />
            </div>
          </div>
        : null*/}

        {showVideo !== undefined && showVideo.length > 0 ?
          <div style={{ borderRadius: theme.palette?.borderRadius, zIndex: 12501, position: "fixed", left: 40, bottom: 150, width: 300, }}>
            <IconButton
              style={{
                zIndex: 12502,
                position: "absolute",
                top: 6,
                right: 6,
                color: "white",
              }}
              onClick={() => {
                setShowVideo("")
              }}
            >
              <CloseIcon />
            </IconButton>
            <iframe
              src={showVideo}
              frameBorder={"false"}
              webkitallowfullscreen={"true"}
              mozallowFullscreen={true}
              allowFullScreen={true}
              style={{
                "top": 0,
                "left": 0,
                "maxWidth": 300,
                "minWidth": 300,
              }}
            />
          </div>
          : null}

        <TextField
          id="copy_element_shuffle"
          value={to_be_copied}
          style={{ display: "none" }}
        />
      </div>
    ) : (
      <div style={{width: 200, margin: "auto", marginTop: 300, textAlign: "center", }}>
		<CircularProgress style={{}} />
		<Typography variant="body2" color="textSecondary" style={{marginTop: 10, }}>
			Loading Workflow & Apps...
		</Typography>
	  </div>
    );

  // Awful way of handling scroll
  if (scrollConfig !== undefined && setScrollConfig !== undefined && Object.getOwnPropertyNames(selectedAction).length !== 0) {
    const rightSideActionView = document.getElementById("rightside_actions");
    if (rightSideActionView !== undefined && rightSideActionView !== null) {
      if (scrollConfig.top !== null && scrollConfig.top !== undefined && scrollConfig.top !== 0) {
        setTimeout(() => {
          if (scrollConfig.selected !== undefined && scrollConfig.selected !== null) {
            const selectedField = document.getElementById(scrollConfig.selected)
            if (selectedField !== undefined && selectedField !== null) {
              selectedField.focus()
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
