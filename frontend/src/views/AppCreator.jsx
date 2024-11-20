import React, { useState, useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { BrowserView, MobileView } from "react-device-detect";
import theme from '../theme.jsx';

import {
  Paper,
  Typography,
  FormControlLabel,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Breadcrumbs,
  Drawer,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";

import {
  Publish as PublishIcon,
  LockOpen as LockOpenIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  AttachFile as AttachFileIcon,
  Apps as AppsIcon,
  ErrorOutline as ErrorOutlineIcon,
	AddAPhoto as AddAPhotoIcon, 
	AddAPhotoOutlined as AddAPhotoOutlinedIcon, 
	ZoomInOutlined as ZoomInOutlinedIcon,
	ZoomOutOutlined as ZoomOutOutlinedIcon,
	Loop as LoopIcon,
	AddPhotoAlternate as AddPhotoAlternateIcon,
	CallMerge as CallMergeIcon,
  CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";

import { v4 as uuidv4 } from "uuid";
import { useNavigate, Link, useParams } from "react-router-dom";
import YAML from "yaml";
import { MuiChipsInput } from "mui-chips-input";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import words from "shellwords";

import AvatarEditor from "react-avatar-editor";

const surfaceColor = "#27292D";
const inputColor = "#383B40";

const bodyDivStyle = {
  margin: "auto",
  width: "900px",
};

const actionListStyle = {
  paddingLeft: "10px",
  paddingRight: "10px",
  paddingBottom: "10px",
  paddingTop: "10px",
  marginTop: "5px",
  backgroundColor: inputColor,
  display: "flex",
  color: "white",
	position: "relative",
};

const boxStyle = {
  color: "white",
  flex: "1",
  marginLeft: "10px",
  marginRight: "10px",
  paddingLeft: "30px",
  paddingRight: "30px",
  paddingBottom: "30px",
  paddingTop: "30px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: surfaceColor,
};

const dividerStyle = {
  marginBottom: "10px",
  marginTop: "10px",
  height: "1px",
  width: "100%",
  backgroundColor: "grey",
};

const appIconStyle = {
  marginLeft: "5px",
};

export const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const rewrite = (args) => {
  return args.reduce(function (args, a) {
    if (0 === a.indexOf("-X")) {
      args.push("-X");
      args.push(a.slice(2));
    } else {
      args.push(a);
    }

    return args;
  }, []);
};

const parseField = (s) => {
  return s.split(/: (.+)/);
};

const isURL = (s) => {
  return /^https?:\/\//.test(s);
};

// Parses CURL to a real request
const parseCurl = (s) => {
  //console.log("CURL: ", s)

  if (0 != s.indexOf("curl ")) {
    console.log("Not curl start");
    return "";
  }

  try {
    var args = rewrite(words.split(s));
  } catch (e) {
    return s;
  }

  var out = { method: "GET", header: {} };
  var state = "";

  args.forEach(function (arg) {
    switch (true) {
      case isURL(arg):
        out.url = arg;
        break;

      case arg === "-A" || arg === "--user-agent":
        state = "user-agent";
        break;

      case arg === "-H" || arg === "--header":
        state = "header";
        break;

      case arg === "-d" || arg === "--data" || arg === "--data-ascii":
        state = "data";
        break;

      case arg === "-u" || arg === "--user":
        state = "user";
        break;

      case arg === "-I" || arg === "--head":
        out.method = "HEAD";
        break;

      case arg === "-X" || arg === "--request":
        state = "method";
        break;

      case arg === "-b" || arg === "--cookie":
        state = "cookie";
        break;

      case arg === "--compressed":
        out.header["Accept-Encoding"] =
          out.header["Accept-Encoding"] || "deflate, gzip";
        break;

      case !!arg:
        switch (state) {
          case "header":
            var field = parseField(arg);
            out.header[field[0]] = field[1];
            state = "";
            break;
          case "user-agent":
            out.header["User-Agent"] = arg;
            state = "";
            break;
          case "data":
            if (out.method === "GET" || out.method === "HEAD")
              out.method = "POST";

            out.header["Content-Type"] = out.header["Content-Type"] || "application/x-www-form-urlencoded";
              
            out.body = out.body ? out.body + "&" + arg : arg;
            state = "";
            break;
          case "user":
            out.header["Authorization"] = "Basic " + btoa(arg);
            state = "";
            break;
          case "method":
            out.method = arg;
            state = "";
            break;
          case "cookie":
            out.header["Set-Cookie"] = arg;
            state = "";
            break;
        }
        break;
    }
  });

  return out;
};

// Basically CRUD for each category + special
// These are already tracked in the shuffle/shuffle-shared/blobs.go file
// as backend should be used for managing this long-term
export const appCategories = [
	{
		"name": "Communication",
		"color": "#FFC107",
		"icon": "communication",
		"action_labels": ["List Messages", "Send Message", "Get Message", "Search messages", "List Attachments", "Get Attachment", "Get Contact"],
	}, 
	{
		"name": "SIEM",
		"color": "#FFC107",
		"icon": "siem",
		"action_labels": ["Search", "List Alerts", "Close Alert",  "Get Alert",  "Create detection", "Add to lookup list", "Isolate endpoint",],
	}, {
		"name": "Eradication",
		"color": "#FFC107",
		"icon": "eradication",
		"action_labels": ["List Alerts", "Close Alert", "Get Alert", "Create detection", "Block hash", "Search Hosts", "Isolate host", "Unisolate host", "Trigger host scan",],
	}, {
		"name": "Cases",
		"color": "#FFC107",
		"icon": "cases",
		"action_labels": ["List tickets", "Get ticket", "Create ticket", "Close ticket", "Add comment", "Update ticket", "Search tickets"],
	}, {
		"name": "Assets",
		"color": "#FFC107",
		"icon": "assets",
		"action_labels": ["List Assets", "Get Asset", "Search Assets", "Search Users", "Search endpoints", "Search vulnerabilities"],
	}, {
		"name": "Intel",
		"color": "#FFC107",
		"icon": "intel",
		"action_labels": ["Get IOC", "Search IOC", "Create IOC", "Update IOC", "Delete IOC",],
	}, {
		"name": "IAM",
		"color": "#FFC107",
		"icon": "iam",
		"action_labels": ["Reset Password", "Enable user", "Disable user", "Get Identity", "Get Asset", "Search Identity", "Get KMS Key",],
	}, {
		"name": "Network",
		"color": "#FFC107",
		"icon": "network",
		"action_labels": ["Get Rules", "Allow IP", "Block IP",],
	}, {
		"name": "Other",
		"color": "#FFC107",
		"icon": "other",
		"action_labels": ["Update Info", "Get Info", "Get Status", "Get Version", "Get Health", "Get Config", "Get Configs", "Get Configs by type", "Get Configs by name", "Run script"],
	},
]

export const base64_decode = (str) => {
	return decodeURIComponent(
		atob(str).split("").map(function (c) {
			return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
		}).join("")
	);
};

// Loops through properties to find the actual JSON output to use
const getJsonObject = (properties) => {
	// Loop inside the JSON object and get the value of each key
	let jsonObject = {};
	for (let key in properties) {
		const property = properties[key];

		let subloop = false
		if (property.hasOwnProperty("type")) {
			if (property.type === "object" || property.type === "array") {
				subloop = true
			}
		} 

		if (subloop) {
			if (property.hasOwnProperty("items") && property.items.hasOwnProperty("properties")) {

				const jsonret = getJsonObject(property.items.properties);
				if (property.type === "array") {
					//console.log("ARRAY!!")
					jsonObject[key] = [jsonret];
				} else {
					jsonObject[key] = jsonret;
				}
			} else {
				if (property.hasOwnProperty("properties")) {
					const jsonret = getJsonObject(property.properties);
					if (property.type === "array") {
						//console.log("ARRAY2!!")
						jsonObject[key] = [jsonret];
					} else {
						jsonObject[key] = jsonret;
					}
				} else { 
					//console.log("No items or properties found: ", property);
				}
			}

		} else {
			if (property.hasOwnProperty("example")) {
				jsonObject[key] = property.example;
			} else if (property.hasOwnProperty("enum") && property.enum.length > 0) {
				jsonObject[key] = property.enum[0];
			} else if (property.hasOwnProperty("default")) {
				jsonObject[key] = property.default;
			} else if (property.hasOwnProperty("maximum")) {
				jsonObject[key] = property.maximum;
			} else if (property.hasOwnProperty("minimum")) {
				jsonObject[key] = property.minimum;
			} else if (property.hasOwnProperty("type")) {
				if (property.type === "integer" || property.type === "number") {
					jsonObject[key] = 0;
				} else if (property.type === "boolean") {
					jsonObject[key] = false;
				} else if (property.type === "string") {
					jsonObject[key] = "";
				} else {
					console.log("Unknown type: ", property);
				}
			} else {
				console.log("No example or enum found: ", property);
			}
		}
	}

	return jsonObject
}

// Should be different if logged in :|
const AppCreator = (defaultprops) => {
  const { globalUrl, isLoaded } = defaultprops;
  const classes = useStyles();
  //const alert = useAlert();

	const params = useParams();
	var props = JSON.parse(JSON.stringify(defaultprops))
	props.match = {}
	props.match.params = params

  var upload = "";
  let navigate = useNavigate();

  const increaseAmount = 50;
  const actionNonBodyRequest = ["GET", "HEAD", "CONNECT"];
  const actionBodyRequest = ["POST", "PUT", "PATCH", "DELETE"];
  const authenticationOptions = [
    "No authentication",
    "API key",
    "Bearer auth",
    "Basic auth",
    "JWT",
    "Oauth2",
  ];
  const apikeySelection = ["Header", "Query"];

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [file, setFile] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const [authenticationOption, setAuthenticationOption] = useState(
    authenticationOptions[0]
  );
  const [newWorkflowTags, setNewWorkflowTags] = React.useState([]);
  const [newWorkflowCategories, setNewWorkflowCategories] = React.useState([]);
  const [parameterName, setParameterName] = useState("");
  const [parameterLocation, setParameterLocation] = useState(
    apikeySelection.length > 0 ? apikeySelection[0] : ""
  );
  const [refreshUrl, setRefreshUrl] = useState("");
  const [projectCategories, setProjectCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [update, setUpdate] = useState("");
  const [urlPathParameters] = useState([]);
  const [basedata, setBasedata] = React.useState({});
  const [actions, setActions] = useState([]);
  const [filteredActions, setFilteredActions] = useState([]);
  const [errorCode, setErrorCode] = useState("");
  const [appBuilding, setAppBuilding] = useState(false);
  const [fileDownloadEnabled, setFileDownloadEnabled] = useState(false);
  const [actionAmount, setActionAmount] = useState(increaseAmount);

  const [oauth2Scopes, setOauth2Scopes] = useState([]);
  const [oauth2Type, setOauth2Type] = useState("delegated");

  //client_credentials
  const [oauth2GrantType, setOauth2GrantType] = useState("");
  const defaultAuth = {
    name: "",
    type: "header",
    example: "",
  };

  const [extraAuth, setExtraAuth] = useState([]);
  const [app, setApp] = useState({});
  const [appAuthentication, setAppAuthentication] = React.useState([]);
  const [selectedAction, setSelectedAction] = useState({});
  const [authLoaded, setAuthLoaded] = useState(false);

	// From 2023: Example to handle action labels
	// Goal: Make this dynamically load from the backend
	// and make categories + labels modifyable.
	// Categories are the main categories in the App Framework
  const [categories, setCategories] = useState(appCategories)

  

  const redirectOpenApi = () => {
    navigate(`/apps/new?id=${appValidation}`)
  }

  const newUpload = React.useRef(null);
  const [openApiError, setOpenApiError] = React.useState("");
  const [validation, setValidation] = React.useState("");
  const [appValidation, setAppValidation] = React.useState("");
  const [openApi, setOpenApi] = React.useState("");
  const [openApiData, setOpenApiData] = React.useState("");
  const [openApiModal, setOpenApiModal] = React.useState(false);

  const [appDownloadData, setAppDownloadData] = React.useState("");

  useEffect(() => {
	  console.log("In useEffect for openApiData: ", openApiData)
  }, [openApiData]);

  const uploadFile = (e) => {
	console.log("In uploadFile")
    const isDropzone =
      e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;
    const reader = new FileReader();

    try {
      reader.addEventListener("load", (e) => {
        const content = e.target.result;
		console.log("set openapi data! ", content)
        setOpenApiData(content);
        setOpenApiModal(true);
      });
    } catch (e) {
      console.log("Error in dropzone: ", e);
    }

    try {
      reader.readAsText(files[0]);
    } catch (error) {
      toast("Failed to read file");
    }
  }

  const escapeApiData = (apidata) => {
    //console.log(apidata)
    try {
      return JSON.stringify(JSON.parse(apidata));
    } catch (error) {
      console.log("JSON DECODE ERROR - TRY YAML");
    }

    try {
      const parsed = YAML.parse(YAML.stringify(apidata));
      //const parsed = YAML.parse(apidata))
      return YAML.stringify(parsed);
    } catch (error) {
      console.log("YAML DECODE ERROR - TRY SOMETHING ELSE?: " + error);
      setOpenApiError("Local error: " + error.toString());
    }

    return "";
  }

  const validateOpenApi = (openApidata) => {
    var newApidata = escapeApiData(openApidata);
    if (newApidata === "") {
      // Used to return here
      newApidata = openApidata;
      return;
    }

    //console.log(newApidata)

    setValidation(true);
    fetch(globalUrl + "/api/v1/validate_openapi", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: openApidata,
      credentials: "include",
    })
      .then((response) => {
        setValidation(false);
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success) {
          setAppValidation(responseJson.id);
        } else {
          if (responseJson.reason !== undefined) {
            setOpenApiError(responseJson.reason);
          }
          toast("An error occurred in the response");
        }
      })
      .catch((error) => {
        setValidation(false);
        toast(error.toString());
        setOpenApiError(error.toString());
      });
  };
  

  const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");

  useEffect(() => {
		if (window.location.pathname.includes("apps/edit")) {
			setIsEditing(true);
			handleEditApp(props.match.params.appid);
		} else {
			checkQuery();
		}
  }, []);

  const handleEditApp = (appid) => {
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
          window.location.pathname = "/apps";
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false) {
          toast("Failed to get the app");
          setIsAppLoaded(true);
          window.location.pathname = "/search";
        } else {
          parseIncomingOpenapiData(responseJson);
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  // Checks if there is an ID in the query, and gets it if it doesn't exist.
  const checkQuery = () => {
    var urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("id")) {
      setActionAmount(0);

      setIsAppLoaded(true);
      return;
    }
  
		//handleEditApp(urlParams.get("id")) 

		// THIS has to stay due to ID may not exist as normal app yet
    fetch(globalUrl + "/api/v1/get_openapi/" + urlParams.get("id"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error("NOT 200 :O");
        }

        return response.json();
      })
      .then((responseJson) => {
        setIsAppLoaded(true);
        if (!responseJson.success) {
          toast("Failed to get app config. Do you have access?");
        } else {
          parseIncomingOpenapiData(responseJson);
        }
      })
      .catch((error) => {
        console.log("Error: ", error.toString());
        toast(error.toString());
      });
  };

  const setFileFromb64 = () => {
    //const img = document.getElementById('logo')
    //var canvas = document.createElement('canvas')
    //var ctx = canvas.getContext('2d')
    //img.onload = function() {
    //	console.log("LOADED?")
    //	ctx.drawImage(img, 0, 0)
    //	const canvasUrl = canvas.toDataURL()
    //	console.log(canvasUrl)
    //	setFileBase64(canvasUrl)
    //}
  };

  const handleGetRef = (parameter, data) => {
    try {
      if (parameter === null || parameter["$ref"] === undefined) {
        //console.log("$ref not found in getref for: ", parameter)
        return parameter;
      }
    } catch (e) {
      console.log("Failed getting $ref of ", parameter);
      return parameter;
    }

    const paramsplit = parameter["$ref"].split("/");
    if (paramsplit[0] !== "#") {
      console.log("Bad param: ", paramsplit);
      return parameter;
    }

    var newitem = data;
    for (let paramkey in paramsplit) {
      var tmpparam = paramsplit[paramkey];
      if (tmpparam === "#") {
        continue;
      }

      if (newitem[tmpparam] === undefined) {
        return parameter;
      }

      newitem = newitem[tmpparam];
    }

    return newitem;
  };



  // Sets the data up as it should be at later points
  // This is the data FROM the database, not what's being saved
  const parseIncomingOpenapiData = (data) => {
	
		var parsedDecoded = ""
		try { 
			const decoded = base64_decode(data.openapi)
			parsedDecoded = decoded
    } catch (e) {
			console.log("Failed JSON parsing: ", e)
			parsedDecoded = data
		}

		if (data.openapi === null)  {
			toast("Failed to load OpenAPI for app. Please contact support if this persists.")
    		setIsAppLoaded(true);
			return
		}

		//console.log("Decoded: ", parsedDecoded)
    const parsedapp =
      data.openapi === undefined || data.openapi === null 
        ? data
        : JSON.parse(parsedDecoded);

    data = parsedapp.body === undefined ? parsedapp : parsedapp.body;

    var jsonvalid = false;
    var tmpvalue = "";
    try {
      data = JSON.parse(data);
      jsonvalid = true;
    } catch (e) {
      console.log("Error JSON: ", e);
    }

    if (!jsonvalid) {
      try {
        data = YAML.parse(data);
        jsonvalid = true;
      } catch (e) {
        console.log("Error YAML: ", e);
      }
    }

    if (!jsonvalid) {
      toast("OpenAPI data is invalid.");
      return;
    }

    setBasedata(data);
		console.log("Info: ", data)

		try { 
			if (data.info !== null && data.info !== undefined) {
				if (data.info.title !== undefined && data.info.title !== null) {
					if (data.info.title.endsWith(" API")) {
						data.info.title = data.info.title.substring(0, data.info.title.length - 4)
					} else if (data.info.title.endsWith("API")) {
						data.info.title = data.info.title.substring(0, data.info.title.length - 3)
					}

					if (data.info.title.length > 29) {
						setName(data.info.title.slice(0, 29));
					} else {
						setName(data.info.title);
					}
				}

				setDescription(data.info.description);
				document.title = "Apps - " + data.info.title;

				if (data.info["x-logo"] !== undefined) {
					if (data.info["x-logo"].url !== undefined) {
						//console.log("PARSED LOGO: ", data.info["x-logo"].url);
						setFileBase64(data.info["x-logo"].url);
					} else {
						setFileBase64(data.info["x-logo"]);
					}
					//console.log("");
					//console.log("");
					//console.log("LOGO: ", data.info["x-logo"]);
					//console.log("");
					//console.log("");
				}

				if (data.info.contact !== undefined) {
					setContact(data.info.contact);
				}

				if (data.info["x-categories"] !== undefined && data.info["x-categories"].length > 0) {
					if (typeof data.info["x-categories"] === "array") {
					} else {
					}
					setNewWorkflowCategories(data.info["x-categories"]);
				}
			}
		} catch (e) {
			console.log("Failed setting info: ", e)
		}

		console.log("Tags: ", data.tags)
		try {
			if (data.tags !== undefined && data.tags.length > 0) {
				var newtags = [];
				for (let tagkey in data.tags) {
					if (data.tags[tagkey].name.length > 50) {
						console.log("Skipping tag because it's too long: ",data.tags[tagkey].name.length);

						continue;
					}

					newtags.push(data.tags[tagkey].name);
				}

				if (newtags.length > 10) {
					newtags = newtags.slice(0, 9);
				}

				setNewWorkflowTags(newtags);
			}
		} catch (e) {
			console.log("Failed to parse tags: ", e)
		}

    // This is annoying (:
		console.log("Security schemes 1: ", data.securitySchemes)

		// Weird generator problems to be handle
		var securitySchemes = undefined
		try { 
			if (data.securitySchemes !== undefined) {
				securitySchemes = data.securitySchemes
				if (securitySchemes === undefined) {
					securitySchemes = data.securityDefinitions;
				}
			}
			
			if (securitySchemes === undefined && data.components !== undefined) { 
				securitySchemes = data.components.securitySchemes;
				if (securitySchemes === undefined) {
					securitySchemes = data.components.securityDefinitions;
				}
			}
		} catch (e) {
			console.log("Failed to parse security schemes: ", e)
		}

		console.log("Security schemes 2: ", securitySchemes)

    const allowedfunctions = [
      "GET",
      "CONNECT",
      "HEAD",
      "DELETE",
      "POST",
      "PATCH",
      "PUT",
    ];


    var newActions = [];
    var wordlist = {};
    var all_categories = [];
	var parentUrl = ""

	console.log("Paths: ", data.paths)
    if (data.paths !== null && data.paths !== undefined) {
      for (let [path, pathvalue] of Object.entries(data.paths)) {

        for (let [method, methodvalue] of Object.entries(pathvalue)) {
          if (methodvalue === null) {
            toast("Skipped method (null)" + method);
            continue;
          }

          if (!allowedfunctions.includes(method.toUpperCase())) {
            // Typical YAML issue
            if (method !== "parameters") {
              console.log("Invalid method: ", method, "data: ", methodvalue);
              //toast("Skipped method (not allowed): " + method);
            }
            continue;
          }

					//console.log("METHOD: ", methodvalue)
          var tmpname = methodvalue.summary;
          if (
            methodvalue.operationId !== undefined &&
            methodvalue.operationId !== null &&
            methodvalue.operationId.length > 0 &&
            (tmpname === undefined || tmpname.length === 0)
          ) {
            tmpname = methodvalue.operationId;
          }

			if (tmpname !== undefined && tmpname !== null) {
	tmpname = tmpname.replaceAll(".", " ");
			}

			if ((tmpname === undefined || tmpname === null) && methodvalue.description !== undefined && methodvalue.description !== null && methodvalue.description.length > 0) {
				tmpname = methodvalue.description.replaceAll(".", " ").replaceAll("_", " ")
			}

            var newaction = {
              name: tmpname,
              description: methodvalue.description,
              url: path,
              file_field: "",
              method: method.toUpperCase(),
              headers: "",
              queries: [],
              paths: [],
              body: "",
              errors: [],
              example_response: "",
		      action_label: "No Label",
		      required_bodyfields: [],
            };

			if (methodvalue["x-label"] !== undefined && methodvalue["x-label"] !== null) {
				console.log("LABEL: ", methodvalue["x-label"])
		
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

				console.log("LABEL: ", correctlabel)
				// FIX: Map labels only if they're actually in the category list
				//newaction.action_label = methodvalue["x-label"]
				newaction.action_label = correctlabel
			}

			if (methodvalue["x-required-fields"] !== undefined && methodvalue["x-required-fields"] !== null) {
				newaction.required_bodyfields = methodvalue["x-required-fields"]
			}

			if (newaction.url !== undefined && newaction.url !== null && newaction.url.includes("_shuffle_replace_")) {
				//const regex = /_shuffle_replace_\d/i;
				const regex = /_shuffle_replace_\d+/i
				
				newaction.url = newaction.url.replaceAll(new RegExp(regex, 'g'), "")
			}

          // Finding category
          if (path.includes("/")) {
            const pathsplit = path.split("/");
            var categoryindex = -1;
            // Stupid way of finding a category/grouping
            for (let splitkey in pathsplit) {
				if (pathsplit[splitkey].includes("_shuffle_replace_")) {
					//const regex = /_shuffle_replace_\d/i;
					const regex = /_shuffle_replace_\d+/i
					//console.log("NEW: ", 
					pathsplit[splitkey] = pathsplit[splitkey].replaceAll(new RegExp(regex, 'g'), "")
				}

              if (
                pathsplit[splitkey].length > 0 &&
                pathsplit[splitkey] !== "v1" &&
                pathsplit[splitkey] !== "v2" &&
                pathsplit[splitkey] !== "api" &&
                pathsplit[splitkey] !== "1.0" &&
                pathsplit[splitkey] !== "apis"
              ) {
                newaction["category"] = pathsplit[splitkey];
                if (!all_categories.includes(pathsplit[splitkey])) {
                  all_categories.push(pathsplit[splitkey]);
                }
                break;
              }
            }
          }
					
			if (path === "/files/{file_id}/content") {
				//console.log("FILE DOWNLOAD Method: ", path, method, methodvalue)
			}


          // Typescript? I think not ;)
          if (methodvalue["requestBody"] !== undefined) {
            if (methodvalue["requestBody"]["$ref"] !== undefined && methodvalue["requestBody"]["$ref"] !== null) {
							// Handle ref
							//
							console.log("Ref: ", methodvalue["requestBody"]["$ref"])
              const parameter = handleGetRef({ $ref:  methodvalue["requestBody"]["$ref"]}, data);
							console.log("PARAM: ", parameter)
							if (parameter.content !== undefined && parameter.content !== null) {
								methodvalue["requestBody"]["content"] = parameter.content
								console.log("Set content!")
							}
						}

						if (methodvalue["requestBody"]["content"] !== undefined) {
							// Handle content - XML or JSON
							//
              if (
                methodvalue["requestBody"]["content"]["application/json"] !==
                undefined
              ) {
                //newaction["headers"] = ""
                //"Content-Type=application/json\nAccept=application/json";
                if (
                  methodvalue["requestBody"]["content"]["application/json"]["schema"] !== undefined && methodvalue["requestBody"]["content"]["application/json"]["schema"] !== null
                ) {
                  //console.log("Schema: ", methodvalue["requestBody"]["content"]["application/json"]["schema"])

									try {
										if (methodvalue["requestBody"]["content"]["application/json"]["schema"]["properties"] !== undefined) {
											// Read out properties from a JSON object
											const jsonObject = getJsonObject(methodvalue["requestBody"]["content"]["application/json"]["schema"]["properties"])
											//console.log("JSON OBJECT: ", jsonObject)
											if (jsonObject !== undefined && jsonObject !== null) {
												try {
													newaction["body"] = JSON.stringify(jsonObject, null, 2)
												} catch (e) {
													console.log("JSON object parse error: ", e)
												}
											}


											//newaction["body"] = JSON.stringify(jsonObject, null, 2);

											var tmpobject = {};
											for (let prop of methodvalue["requestBody"]["content"]["application/json"]["schema"]["properties"]) {
												tmpobject[prop] = `\$\{${prop}\}`;
											}

											//console.log("Data: ", data)
											for (let subkey in methodvalue["requestBody"]["content"]["application/json"]["schema"]["required"]) {
												const tmpitem = methodvalue["requestBody"]["content"]["application/json"]["schema"]["required"][subkey];
												tmpobject[tmpitem] = `\$\{${tmpitem}\}`;
											}

											newaction["body"] = JSON.stringify(tmpobject, null, 2);

										} else if (

											methodvalue["requestBody"]["content"]["application/json"]["schema"]["$ref"] !== undefined && methodvalue["requestBody"]["content"]["application/json"]["schema"]["$ref"] !== null) {
											const retRef = handleGetRef(methodvalue["requestBody"]["content"]["application/json"]["schema"], data);
											
											var newbody = {};
											// Can handle default, required, description and type
											for (let propkey in retRef.properties) {
												console.log("replace: ", propkey)

												const parsedkey = propkey.replaceAll(" ", "_").toLowerCase();
												newbody[parsedkey] = "${" + parsedkey + "}";
											}

											newaction["body"] = JSON.stringify(newbody, null, 2);
										}
									} catch (e) {
										console.log("RequestBody json error: ", e, path)
									}
                }
              } else if (
                methodvalue["requestBody"]["content"]["application/xml"] !==
                undefined
              ) {
                console.log("METHOD XML: ", methodvalue);
                //newaction["headers"] = ""
                //"Content-Type=application/xml\nAccept=application/xml";
                if (
                  methodvalue["requestBody"]["content"]["application/xml"][
                    "schema"
                  ] !== undefined &&
                  methodvalue["requestBody"]["content"]["application/xml"][
                    "schema"
                  ] !== null
                ) {
					try {
						if (
							methodvalue["requestBody"]["content"]["application/xml"][
								"schema"
							]["properties"] !== undefined
						) {
							var tmpobject = {};
							for (let [prop, propvalue] of Object.entries(methodvalue["requestBody"]["content"]["application/xml"]["schema"]["properties"])) {
							
								tmpobject[prop] = `\$\{${prop}\}`;
							}

							for (let [subkey,subkeyval] in Object.entries(methodvalue["requestBody"]["content"]["application/xml"]["schema"]["required"])) {
								const tmpitem =
									methodvalue["requestBody"]["content"][
										"application/xml"
									]["schema"]["required"][subkey];
								tmpobject[tmpitem] = `\$\{${tmpitem}\}`;
							}

							//console.log("OBJ XML: ", tmpobject)
							//newaction["body"] = XML.stringify(tmpobject, null, 2)
						}
					} catch (e) {
						console.log("RequestBody xml error: ", e, path)
					}
                }
              } else {
                if (methodvalue["requestBody"]["content"]["example"] !== undefined) {
                  if (methodvalue["requestBody"]["content"]["example"]["example"] !== undefined) {
                      newaction["body"] = methodvalue["requestBody"]["content"]["example"]["example"]
                  }
                } 
		  
				if (methodvalue["requestBody"]["content"]["multipart/form-data"] !== undefined) {
                  if (
                    methodvalue["requestBody"]["content"][
                      "multipart/form-data"
                    ]["schema"] !== undefined &&
                    methodvalue["requestBody"]["content"][
                      "multipart/form-data"
                    ]["schema"] !== null
                  ) {
										try {
											if (methodvalue["requestBody"]["content"]["multipart/form-data"]["schema"]["type"] === "object") {
												const fieldname =
													methodvalue["requestBody"]["content"][
														"multipart/form-data"
													]["schema"]["properties"]["fieldname"];

												if (fieldname !== undefined) {
													//console.log("FIELDNAME: ", fieldname);
													newaction.file_field = fieldname["value"];
												} else {
													for (const [subkey, subvalue] of Object.entries(methodvalue["requestBody"]["content"]["multipart/form-data"]["schema"]["properties"])) {
														if (subkey.includes("file")) {
															console.log("Found subkey field for file: ", path, method, methodvalue["requestBody"]["content"]["multipart/form-data"]["schema"]["properties"])
															newaction.file_field = subkey
															break
														}
													}

													if (newaction.file_field === undefined || newaction.file_field === null || newaction.file_field.length === 0) {
														console.log("No file fieldname found: ", methodvalue["requestBody"]["content"]["multipart/form-data"]["schema"]["properties"])
													}
												}
											} else {
												console.log("No type found: ", methodvalue["requestBody"]["content"]["multipart/form-data"]["schema"])
											}
										} catch (e) {
											console.log("Multipart/form error: ", e, path)
										}
                  }
                } else {
                  var schemas = [];
                  const content = methodvalue["requestBody"]["content"];
                  if (content !== undefined && content !== null) {
                    //console.log("CONTENT: ", content)
                    for (const [subkey, subvalue] of Object.entries(content)) {
                      if (subvalue["schema"] !== undefined && subvalue["schema"] !== null) {
                        console.log("SCHEMA: ", subvalue["schema"])
                        if (subvalue["schema"]["$ref"] !== undefined && subvalue["schema"]["$ref"] !== null) {

                          console.log("SCHEMA FOUND REF!")
                          if (!schemas.includes(subvalue["schema"]["$ref"])) {
                            schemas.push(subvalue["schema"]["$ref"]);
                          }
                        }
                      } else {
												if (subvalue["example"] !== undefined && subvalue["example"] !== null) {
                    			newaction["body"] = subvalue["example"]
												} else {
                        	console.log("ERROR: couldn't find schema for ", subvalue, method, path);
												}
                      }
                    }
                  }

									try {
                  	if (schemas.length === 1) {
                  	  const parameter = handleGetRef({ $ref: schemas[0] }, data);

											console.log("Reading type from parameter: ", parameter)
                  	  if (parameter.properties !== undefined && parameter["type"] === "object") {
                  	  
                  	    var newbody = {};
                  	    for (let propkey in parameter.properties) {
													console.log("propkey2: ", propkey)
                  	    	const parsedkey = propkey.replaceAll(" ", "_").toLowerCase();
                  	      if (parameter.properties[propkey].type === undefined) {
                  	        console.log(
                  	          "Skipping (4): ",
                  	          parameter.properties[propkey]
                  	        );
                  	        continue;
                  	      }

                  	      if (parameter.properties[propkey].type === "string") {
                  	        if (
                  	          parameter.properties[propkey].description !==
                  	          undefined
                  	        ) {
                  	          newbody[parsedkey] =
                  	            parameter.properties[propkey].description;
                  	        } else {
                  	          newbody[parsedkey] = "";
                  	        }
                  	      } else if (
                  	        parameter.properties[propkey].type.includes("int") ||
                  	        parameter.properties[propkey].type.includes("uint64")
                  	      ) {
                  	        newbody[parsedkey] = 0;
                  	      } else if (
                  	        parameter.properties[propkey].type.includes("boolean")
                  	      ) {
                  	        newbody[parsedkey] = false;
                  	      } else if (
                  	        parameter.properties[propkey].type.includes("array")
                  	      ) {
                  	        newbody[parsedkey] = [];
                  	      } else {
                  	        console.log(
                  	          "CANT HANDLE JSON TYPE (4)",
                  	          parameter.properties[propkey].type,
                  	          parameter.properties[propkey],
															path
                  	        );
                  	        newbody[parsedkey] = [];
                  	      }
                  	    }

                  	    newaction["body"] = JSON.stringify(newbody, null, 2);
                  	  } else {
                  	    console.log(
                  	      "CANT HANDLE PARAM: (4) ",
                  	      parameter.properties,
													path
                  	    );
                  	  }
                  	}
				  } catch (e) {
				  	console.log("Param Error: ", e, path)
				  }
                }
              }
            }
          }

          if (
            methodvalue.responses !== undefined &&
            methodvalue.responses !== null
          ) {
            if (methodvalue.responses.default !== undefined) {
              if (methodvalue.responses.default.content !== undefined) {
                if (
                  methodvalue.responses.default.content["text/plain"] !==
                  undefined
                ) {
                  if (
                    methodvalue.responses.default.content["text/plain"]["schema"] !== undefined) {
                    if (methodvalue.responses.default.content["text/plain"]["schema"]["example"] !== undefined) {
                      newaction.example_response = methodvalue.responses.default.content["text/plain"]["schema"]["example"]
                        
                        

                    }

                    if (methodvalue.responses.default.content["text/plain"]["schema"]["format"] === "binary" && methodvalue.responses.default.content["text/plain"]["schema"]["type"] === "string") {
                  		newaction.example_response = "shuffle_file_download"
					}
                  }
                }
              }
            } else {
              var selectedReturn = "";
              if (methodvalue.responses["200"] !== undefined) {
                selectedReturn = "200";
              } else if (methodvalue.responses["201"] !== undefined) {
                selectedReturn = "201";
              }

              // Parsing examples. This should be standardized lol
              if (methodvalue.responses[selectedReturn] !== undefined) {
                const selectedExample = methodvalue.responses[selectedReturn];
                if (selectedExample["content"] !== undefined) {
                  if (
                    selectedExample["content"]["application/json"] !== undefined
                  ) {
                    if (
                      selectedExample["content"]["application/json"]["schema"] !== undefined &&
                    	selectedExample["content"]["application/json"]["schema"] !== null
                    ) {
											//console.log("JSON Output: ", selectedExample["content"]["application/json"]["schema"])

											if (selectedExample["content"]["application/json"]["schema"]["properties"] !== undefined && selectedExample["content"]["application/json"]["schema"]["properties"] !== null) {
												const jsonObject = getJsonObject(selectedExample["content"]["application/json"]["schema"]["properties"]) 
												if (jsonObject !== undefined && jsonObject !== null) {
													try {
                          	newaction.example_response = JSON.stringify(jsonObject, null, 2)
													} catch (e) {
														console.log("JSON object output parse error: ", e)
													}
												}
											}

                      if (selectedExample["content"]["application/json"]["schema"]["$ref"] !== undefined) {
                        //console.log("REF EXAMPLE: ", selectedExample["content"]["application/json"]["schema"])
                        const parameter = handleGetRef(
                          selectedExample["content"]["application/json"][
                            "schema"
                          ],
                          data
                        );

                        //console.log("Reading parameter type 2", parameter)
                        if (parameter.properties !== undefined && parameter["type"] === "object") {
                          var newbody = {};
                          for (let propkey in parameter.properties) {
														//console.log("propkey3: ", propkey)

                            const parsedkey = propkey.replaceAll(" ", "_").toLowerCase();
                            if (parameter.properties[propkey].type === undefined) {
                              console.log(
                                "Skipping (1): ",
                                parameter.properties[propkey]
                              );
                              continue;
                            }

                            if (
                              parameter.properties[propkey].type === "string"
                            ) {
                              if (
                                parameter.properties[propkey].description !==
                                undefined
                              ) {
                                newbody[parsedkey] =
                                  parameter.properties[propkey].description;
                              } else {
                                newbody[parsedkey] = "";
                              }
                            } else if (
                              parameter.properties[propkey].type.includes("int")
                            ) {
                              newbody[parsedkey] = 0;
                            } else if (
                              parameter.properties[propkey].type.includes(
                                "boolean"
                              )
                            ) {
                              newbody[parsedkey] = false;
                            } else if (
                              parameter.properties[propkey].type.includes(
                                "array"
                              )
                            ) {
                              //console.log("Added empty array. Base is: ", parameter.properties[propkey].type)

                              //const parameter = handleGetRef(selectedExample["content"]["application/json"]["schema"], data)
                              newbody[parsedkey] = [];
                            } else {
                              console.log("CANT HANDLE JSON TYPE ", parameter.properties[propkey].type,parameter.properties[propkey]
                              );
                              newbody[parsedkey] = [];
                            }
                          }
                          newaction.example_response = JSON.stringify(
                            newbody,
                            null,
                            2
                          );
                        } else {
                          console.log(
                            "CANT HANDLE PARAM: (1) ",
                            parameter.properties
                          );
                        }
                      } else {
                        // Just selecting the first one. bleh.
                        if (
                          selectedExample["content"]["application/json"][
                            "schema"
                          ]["allOf"] !== undefined
                        ) {
                          //console.log("ALLOF: ", selectedExample["content"]["application/json"]["schema"]["allOf"])
                          //console.log("BAD EXAMPLE: (SKIP ALLOF) ", selectedExample["content"]["application/json"]["schema"]["allOf"])
                          var selectedComponent =
                            selectedExample["content"]["application/json"][
                              "schema"
                            ]["allOf"];
                          if (selectedComponent.length >= 1) {
                            selectedComponent = selectedComponent[0];

                            const parameter = handleGetRef(
                              selectedComponent,
                              data
                            );

														console.log("Reading parameter type 3!")
                            if (parameter.properties !== undefined && parameter["type"] === "object") {
                              var newbody = {};
                              for (let propkey in parameter.properties) {
																console.log("propkey4: ", propkey)
                                const parsedkey = propkey.replaceAll(" ", "_").toLowerCase();
                                if (
                                  parameter.properties[propkey].type ===
                                  undefined
                                ) {
                                  console.log(
                                    "Skipping (2): ",
                                    parameter.properties[propkey]
                                  );
                                  continue;
                                }

                                if (
                                  parameter.properties[propkey].type ===
                                  "string"
                                ) {
                                  if (
                                    parameter.properties[propkey]
                                      .description !== undefined
                                  ) {
                                    newbody[parsedkey] =
                                      parameter.properties[propkey].description;
                                  } else {
                                    newbody[parsedkey] = "";
                                  }
                                } else if (
                                  parameter.properties[propkey].type.includes(
                                    "int"
                                  )
                                ) {
                                  newbody[parsedkey] = 0;
                                } else if (
                                  parameter.properties[propkey].type.includes(
                                    "boolean"
                                  )
                                ) {
                                  newbody[parsedkey] = false;
                                } else {
                                  console.log(
                                    "CANT HANDLE JSON TYPE (2) ",
                                    parameter.properties[propkey].type
                                  );
                                  newbody[parsedkey] = [];
                                }
                              }

                              newaction.example_response = JSON.stringify(
                                newbody,
                                null,
                                2
                              );
                              //newaction.example_response = JSON.stringify(parameter.properties, null, 2)
                            } else {
                              //newaction.example_response = parameter.properties
                              console.log(
                                "CANT HANDLE PARAM: (3) ",
                                parameter.properties
                              );
                            }
                          } else {
                          }
                        } else if (
                          selectedExample["content"]["application/json"][
                            "schema"
                          ]["properties"] !== undefined
                        ) {
                          if (
                            selectedExample["content"]["application/json"][
                              "schema"
                            ]["properties"]["data"] !== undefined
                          ) {
                            const parameter = handleGetRef(
                              selectedExample["content"]["application/json"][
                                "schema"
                              ]["properties"]["data"],
                              data
                            );

														console.log("Reading type 3: ", parameter)
                            if (parameter.properties !== undefined && parameter["type"] === "object") {
                              var newbody = {};
                              for (let propkey in parameter.properties) {
																console.log("propkey5: ", propkey)
                                const parsedkey = propkey
                                  .replaceAll(" ", "_")
                                  .toLowerCase();
                                if (
                                  parameter.properties[propkey].type ===
                                  undefined
                                ) {
                                  console.log(
                                    "Skipping (3): ",
                                    parameter.properties[propkey]
                                  );
                                  continue;
                                }

                                if (
                                  parameter.properties[propkey].type ===
                                  "string"
                                ) {
                                  if (
                                    parameter.properties[propkey]
                                      .description !== undefined
                                  ) {
                                    newbody[parsedkey] =
                                      parameter.properties[propkey].description;
                                  } else {
                                    newbody[parsedkey] = "";
                                  }
                                  console.log(parameter.properties[propkey]);
                                } else if (
                                  parameter.properties[propkey].type.includes(
                                    "int"
                                  )
                                ) {
                                  newbody[parsedkey] = 0;
                                } else {
                                  console.log(
                                    "CANT HANDLE JSON TYPE (3) ",
                                    parameter.properties[propkey].type
                                  );
                                  newbody[parsedkey] = [];
                                }
                              }

                              newaction.example_response = JSON.stringify(
                                newbody,
                                null,
                                2
                              );
                              //newaction.example_response = JSON.stringify(parameter.properties, null, 2)
                            } else {
                              //newaction.example_response = parameter.properties
                              console.log(
                                "CANT HANDLE PARAM: (3) ",
                                parameter.properties
                              );
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          for (let paramkey in methodvalue.parameters) {
            const parameter = handleGetRef(methodvalue.parameters[paramkey], data);
            if (parameter.in === "query") {
              var tmpaction = {
                description: parameter.description,
                name: parameter.name,
                required: parameter.required,
                in: "query",
              };

			  if (parameter.example !== undefined && parameter.example !== null) {
				  tmpaction.example = parameter.example
			  }

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
              if (parameter.example !== undefined && parameter.example !== null) {
				  if (newaction.body === undefined || newaction.body === null || newaction.body.length < 5) {
                	newaction.body = parameter.example
				  }
              }
            } else if (parameter.in === "header") {
              newaction.headers += `${parameter.name}=${parameter.example}\n`;
            } else {
              console.log(
                "WARNING: don't know how to handle this param: ",
                parameter
              );
            }
          }

		  // Check if body is valid JSON. 
		  if (newaction.body !== undefined && newaction.body !== null && newaction.body.length > 0) {
			  // Trim starting / ending newlines, spaces and tabs
			  newaction.body = newaction.body.trim()
		  }


          if (newaction.name === "" || newaction.name === undefined) {
            // Find a unique part of the string
            // FIXME: Looks for length between /, find the one where they differ
            // Should find others with the same START to their path
            // Make a list of reserved names? Aka things that show up only once
            if (Object.getOwnPropertyNames(wordlist).length === 0) {
              for (let [newpath, pathvalue] of Object.entries(data.paths)) {
                const newpathsplit = newpath.split("/");

                for (let splitkey in newpathsplit) {
                  const pathitem = newpathsplit[splitkey].toLowerCase();
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
              for (let urlkey in urlsplit) {
                var subpath = urlsplit[urlkey];
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

					//newaction.action_label = "No Label"
          newActions.push(newaction);
        }
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
            for (let foundkey in found) {
              const item = found[foundkey].slice(1, found[foundkey].length - 1);
              const foundVar = data.servers[0].variables[item];
              if (foundVar["default"] !== undefined) {
                firstUrl = firstUrl.replace(found[foundkey], foundVar["default"]);
              }
            }
          }
        }

        if (firstUrl.endsWith("/")) {
          setBaseUrl(firstUrl.slice(0, firstUrl.length - 1));
					parentUrl = firstUrl.slice(0, firstUrl.length - 1)
        } else {
          setBaseUrl(firstUrl)
					parentUrl = firstUrl
        }
      }
    }

    if (securitySchemes !== undefined) {
      
	  //console.log("SECURITY: ", securitySchemes)
	  var newauth = [];
	  try {
		var optionset = false 
      	for (const [key, value] of Object.entries(securitySchemes)) {
      	  //console.log("AUTH: ", key, value);

      	  if (key === "jwt") {
      	    setAuthenticationOption("JWT");
      	    setAuthenticationRequired(true);

      	    if (
      	      value.in !== undefined &&
      	      value.in !== null &&
      	      value.in.length > 0
      	    ) {
      	      setParameterName(value.in);
				optionset = true 
      	    }

      	  } else if (value.scheme === "bearer") {
      	    setAuthenticationOption("Bearer auth");
      	    setAuthenticationRequired(true);
						optionset = true 

      	  } else if (key === "ApiKeyAuth" || key === "Token" || ((value.in === "header" || value.in === "query") && value.name !== undefined)) {
						//if (optionset === false) {
						//	optionset = true 
						//}

						if (optionset === false) {
							optionset = true 
      	    	value.in = value.in.charAt(0).toUpperCase() + value.in.slice(1)

      	    	setParameterLocation(value.in);
      	    	if (!apikeySelection.includes(value.in)) {
      	    	  console.log("APIKEY SELECT: ", apikeySelection);
      	    	  toast("Might be error in setting up API key authentication");
      	    	}

      	    	console.log("PARAM NAME: ", value.name);
      	    	setAuthenticationOption("API key");
      	    	setParameterName(value.name);
      	    	setAuthenticationRequired(true);

      	    	newauth.push({
      	    		"name": key,
      	    		"type": value.in.toLowerCase(),
					"in": value.in.toLowerCase(),
      	    		"example": "",
				})
				} else {
					newauth.push({
						"name": key,
						"type": value.in.toLowerCase(),
						"in": value.in.toLowerCase(),
						"example": "",
					})
				}

      	    if (value.description !== undefined && value.description !== null && value.description.length > 0) {
			// Don't want a real description - just the ones we're replacing with
				if ((value.description.split(" ").length - 1) <= 2) {
					setRefreshUrl(value.description)
				}
			}

      	  } else if (value.scheme === "basic") {
      	    setAuthenticationOption("Basic auth");
      	    setAuthenticationRequired(true);
						optionset = true 

      	  } else if (value.scheme === "oauth2") {
			setAuthenticationOption("Oauth2");
			setAuthenticationRequired(true);
			optionset = true 

      	  } else if (value.type === "oauth2" || key === "Oauth2" || key === "Oauth2c" || (key !== undefined && key !== null && key.toLowerCase().includes("oauth2"))) {
      	    //toast("Can't handle Oauth2 auth yet.")
      	    setAuthenticationOption("Oauth2");
      	    setAuthenticationRequired(true);
				optionset = true 

      	    //console.log("FLOW-1: ", value)
      	    const flowkey = value.flow === undefined ? "flows" : "flow";
      	    //console.log("FLOW: ", value[flowkey])
			

		    // Doesn't seem to be used for now
      	    const basekey = value[flowkey].authorizationCode !== undefined ? "authorizationCode" : "implicit";
			  
		    // Kind of fucked up, but it works for now?
		    if (value["x-grant-type"] !== undefined && value["x-grant-type"] !== null && value["x-grant-type"].length !== 0) {
		        setOauth2GrantType(value["x-grant-type"])
		    }

      	    //console.log("FLOW2: ", value[flowkey][basekey])
      	    if (value[flowkey] !== undefined && value[flowkey][basekey] !== undefined
      	    ) {
			  var newparamname = parameterName
      	      if (value[flowkey][basekey].authorizationUrl !== undefined && value[flowkey][basekey].authorizationUrl !== null && value[flowkey][basekey].authorizationUrl.length !== 0 && parameterName.length === 0) {
      	          setParameterName(value[flowkey][basekey].authorizationUrl);
			  } else {
				  setOauth2Type("application")

			  }

      	      var tokenUrl = "";
      	      if (value[flowkey][basekey].tokenUrl !== undefined) {
      	        setParameterLocation(value[flowkey][basekey].tokenUrl);
      	        tokenUrl = value[flowkey][basekey].tokenUrl;
      	      } else {
      	        setParameterLocation("");
      	      }

      	      if (value[flowkey][basekey].refreshUrl !== undefined) {
      	        setRefreshUrl(value[flowkey][basekey].refreshUrl);
      	      } else if (tokenUrl.length > 0) {
      	        setRefreshUrl(tokenUrl);
      	      }

      	      if (
      	        value[flowkey][basekey].scopes !== undefined &&
      	        value[flowkey][basekey].scopes !== null
      	      ) {
      	        if (value[flowkey][basekey].scopes.length > 0) {
      	          setOauth2Scopes(value[flowkey][basekey].scopes);
      	        } else {
      	          var newscopes = [];
      	          for (let [scopekey, scopevalue] of Object.entries(value[flowkey][basekey].scopes)) {
      	            if (scopekey.startsWith("http")) {
      	              const scopekeysplit = scopekey.split("/");
      	              if (scopekeysplit.length < 5) {
      	                console.log("Skipping scope: ", scopekey);
      	                toast("Skipping scope: " + scopekey);
      	                continue;
      	              }

      	              //console.log("Checking scope for: ", scopekey, scopekeysplit.length)
      	            }

      	            newscopes.push(scopekey);
      	          }

      	          setOauth2Scopes(newscopes);
      	        }
      	      }
      	    } else {
      	      console.log(
      	        "Bad flowkey and basekey for oauth2: ",
      	        flowkey,
      	        basekey
      	      );
      	    }
      	  } else {
      	    toast("Couldn't handle AUTH type: ", key);
      	    //newauth.push({
      	    //	"name": key,
      	    //	"type": value.in,
      	    //	"example": "",
      	    //})
      	  }
      	}
			} catch (e) {
				toast("Failed to handle auth")
				console.log("Error: ", e)
			}

      if (newauth.length > 0) {
				newauth = newauth.filter(data => data.name != "ApiKeyAuth")
        setExtraAuth(newauth);
      }
    }

		console.log("PARent: ", parentUrl)
		var prefixCheck = "/v1"
		if (parentUrl.includes("/")) {
			const urlsplit = parentUrl.split("/")
			if (urlsplit.length > 2) {
				// Skip if http:// in it too
				prefixCheck = "/" + urlsplit.slice(3).join("/")
			}

			console.log("Prefix: ", prefixCheck)
			if (prefixCheck.length > 0 && prefixCheck !== "/" && prefixCheck.startsWith("/")) {
				for (var actionKey in newActions) {
					const action = newActions[actionKey]

					if (action.url !== undefined && action.url !== null && action.url.startsWith(prefixCheck)) {
						newActions[actionKey].url = action.url.slice(prefixCheck.length, action.url.length)
					}

					console.log("Action: ", newActions[actionKey].url)
				}
			}
		}

		console.log("Actions: ", newActions.length, " BaseURL: ", parentUrl)
	
		var newActions2 = []
		// Remove with duplicate action URLs
		for (var actionKey in newActions) {
			const action = newActions[actionKey]
			if (action.url === undefined || action.url === null) {
				continue
			}

			var found = false
			for (var actionKey2 in newActions2) {
				const action2 = newActions2[actionKey2]
				if (action2.url === undefined || action2.url === null) {
					continue
				}

				if (action.url === action2.url) {
					found = true
					break
				}
			}

			if (!found) {
				newActions2.push(action)
			} else {
				//console.log("NOT skipping duplicate action: ", action.url, ". Should merge contents")
				newActions2.push(action)
			}
		}

		//console.log("Actions: ", newActions.length, " Actions2: ", newActions2.length)
		newActions = newActions2
    if (newActions.length > increaseAmount - 1) {
      setActionAmount(increaseAmount);
    } else {
      setActionAmount(newActions.length);
    }

    //const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io"
    if (newActions.length > 1000 && isCloud) {
      toast("Cut down actions from " + newActions.length + " to 999 because of limit");
      newActions = newActions.slice(0, 999);
    }

    setProjectCategories(all_categories);

	// Rearrange them by which has action_label
	const firstActions = newActions.filter(data => data.action_label !== undefined && data.action_label !== null && data.action_label !== "No Label")
	console.log("First actions: ", firstActions)
	const secondActions = newActions.filter(data => data.action_label === undefined || data.action_label === null || data.action_label === "No Label")
	newActions = firstActions.concat(secondActions)
    setActions(newActions);
		//data.paths[item.url][item.method.toLowerCase()]["x-label"] = item.action_label


    setFilteredActions(newActions);
    setIsAppLoaded(true);
  };

  // Saving the app that's been configured.
	// Save SAVE app
  const submitApp = () => {
    toast("Uploading and building app " + name);
    setAppBuilding(true);
    setErrorCode("");

    // Format the information
    const splitBase = baseUrl.split("/");
    const host = splitBase[2];
    const schemes = [splitBase[0]];
    const basePath = "/" + splitBase.slice(3).join("/");

    const data = {
      openapi: "3.0.0",
      info: {
        title: name,
        description: description,
        version: "1.0",
        "x-logo": fileBase64,
      },
      servers: [{ url: baseUrl }],
      host: host,
      basePath: basePath,
      schemes: schemes,
      paths: {},
      editing: isEditing,
      components: {
        securitySchemes: {},
      },
      id: props.match.params.appid,
    };

		if (isEditing === false) {
			var urlParams = new URLSearchParams(window.location.search);
			if (urlParams !== undefined && urlParams !== null && urlParams.has("id")) {
				data.id = urlParams.get("id")
			}

      //id: props.match.params.appid,
		}

    if (basedata.info !== undefined && basedata.info.contact !== undefined) {
      data.info["contact"] = basedata.info.contact;
    } else if (contact === "") {
      data.info["contact"] = {
        name: "@Anonymous Shuffle User",
        url: "https://twitter.com/shuffleio",
        email: "support@shuffler.io",
      };
    } else {
      data.info["contact"] = contact;
    }

    if (newWorkflowTags.length > 0) {
      var newtags = [];
      for (let tagkey in newWorkflowTags) {
        newtags.push({ name: newWorkflowTags[tagkey] });
      }

      data["tags"] = newtags;
    }

    if (newWorkflowCategories.length > 0) {
      data["info"]["x-categories"] = newWorkflowCategories;
    }

    // Handles actions
		var handledPaths = []
    for (let actionkey in actions) {
      var item = JSON.parse(JSON.stringify(actions[actionkey]))
      if (item.errors.length > 0) {
        toast("Saving with error in action " + item.name);
      }

      if (item.name === undefined && item.description !== undefined) {
        item.name = item.description;
      }


			// Basic way to allow multiple of the same path 
			var pathjoin = item.url+"_"+item.method.toLowerCase()
			if (handledPaths.includes(pathjoin)) {

				// Max 1000 of same. Will it be ok for graphql longterm?
				const baseurl = item.url
				for (let i = 0; i < 1000; i++) {
					item.url = baseurl+"_shuffle_replace_"+i

					pathjoin = item.url+"_"+item.method.toLowerCase()
					if (handledPaths.includes(pathjoin)) {
						continue
					}

					break
				}
			}

			handledPaths.push(pathjoin)

      if (data.paths[item.url] === null || data.paths[item.url] === undefined) {
        data.paths[item.url] = {};
      }

      const regex = /[A-Za-z0-9 _]/g;
      if (item.name === undefined) {
        console.log("Skipping action ", item);
        continue;
      }

      const found = item.name.match(regex);
      if (found !== null) {
        item.name = found.join("");
      }

			// Workaround for proper responses. No default as JSON for now
      data.paths[item.url][item.method.toLowerCase()] = {
        responses: {
          default: {
            description: "default",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "",
                },
              },
            },
          },
        },
        summary: item.name,
        operationId: item.name.split(" ").join("_"),
        description: item.description,
        parameters: [],
        requestBody: {
          content: {},
        },
      };

			if (item.action_label !== undefined && item.action_label !== "" && item.action_label !== "No Label") {
				//console.log("Action label: ", item.action_label)
				data.paths[item.url][item.method.toLowerCase()]["x-label"] = item.action_label
			}

			if (item.required_bodyfields !== undefined && item.required_bodyfields !== null && item.required_bodyfields.length > 0) {
				console.log("Required bodyfields: ", item.required_bodyfields)
				data.paths[item.url][item.method.toLowerCase()]["x-required-fields"] = item.required_bodyfields
			}

      //console.log("ACTION: ", item)

      if (item.example_response !== undefined && item.example_response !== null && item.example_response.length > 0) {

				if (item["example_response"] === "shuffle_file_download") {
					data.paths[item.url][item.method.toLowerCase()].responses["default"]["content"]["text/plain"].schema.type = "string"
					data.paths[item.url][item.method.toLowerCase()].responses["default"]["content"]["text/plain"].schema.format = "binary"

					/*
					schema:
						type: object
						properties:
							username:
								type: string
							avatar:          # <-- image embedded into JSON
								type: string
								format: byte
								description: Base64-encoded contents of the avatar image
					*/

				} else {
					// FIXME: Shallow copy of the string
					var showResult = Object.assign("", item.example_response).trim();
					showResult = showResult.split(" None").join(' "None"');
					showResult = showResult.split("'").join('"');
					showResult = showResult.split(" False").join(" false");
					showResult = showResult.split(" True").join(" true");

					var jsonvalid = true;
					try {
						const tmp = String(JSON.parse(showResult));
						if (!showResult.includes("{") && !showResult.includes("[")) {
							jsonvalid = false;
						}
					} catch (e) {
						jsonvalid = false;
					}

					data.paths[item.url][item.method.toLowerCase()].responses["default"][
						"content"
					]["text/plain"].schema.type = "string";
					if (jsonvalid) {
						// FIXME: Add a JSON parser here - don't run it as a string.
						data.paths[item.url][item.method.toLowerCase()].responses["default"][
							"content"
						]["text/plain"].schema.example = showResult;
					} else {
						data.paths[item.url][item.method.toLowerCase()].responses["default"][
							"content"
						]["text/plain"].schema.example = item.example_response;
					}
				}
      }

      if (item.queries.length > 0) {
        var skipped = false;
				var querynames = []
        for (let querykey in item.queries) {
          const queryitem = item.queries[querykey];

					if (queryitem === undefined || queryitem === null || queryitem.name === undefined || queryitem.name === null || queryitem.name === "") {
						continue
					}

					// A fix for duplicate items
					if (querynames.includes(queryitem.name.toLowerCase())) {
						continue
					}

					querynames.push(queryitem.name.toLowerCase())
          if (queryitem.name.toLowerCase() == "url") {
            console.log(item.name + " uses a bad query: url");
            continue;
            //skipped = true
            //break
          }

          if (queryitem.name.toLowerCase() == "file_id") {
			item.queries[querykey].name = "fileid"
            continue;
            //skipped = true
            //break
          }

          if (
            queryitem.name.toLowerCase() == "url" ||
            queryitem.name.toLowerCase() == "body" ||
            queryitem.name.toLowerCase() == "self" ||
            queryitem.name.toLowerCase() == "query" ||
            queryitem.name.toLowerCase() == "ssl_verify" ||
            queryitem.name.toLowerCase() == "queries" ||
            queryitem.name.toLowerCase() == "headers" ||
            queryitem.name.toLowerCase() == "list" ||
            queryitem.name.toLowerCase() == "dict" ||
            queryitem.name.toLowerCase() == "str" ||
            queryitem.name.toLowerCase() == "int" ||
            queryitem.name.toLowerCase() == "access_token") {
						/*

            queryitem.name.includes("[") ||
            queryitem.name.includes("]") ||
            queryitem.name.includes("{") ||
            queryitem.name.includes("}") ||
            queryitem.name.includes("(") ||
            queryitem.name.includes(")") ||
            queryitem.name.includes("!") ||
            queryitem.name.includes("@") ||
            queryitem.name.includes("#") ||
            queryitem.name.includes("$") ||
            queryitem.name.includes("%") ||
            queryitem.name.includes("^") ||
            queryitem.name.includes("&") ||
            queryitem.name.includes(":") ||
            queryitem.name.includes(";") ||
            queryitem.name.includes("<") ||
            queryitem.name.includes(">") ||
            queryitem.name.includes('"') ||
            queryitem.name.includes("'")
          ) {
							*/
            console.log(item.name + " error: uses a bad query - not adding: ",queryitem.name)
            

						// Find a replacement for the invalid ones first.

            continue;
          }

          var newitem = {
            in: "query",
            name: queryitem.name,
            description: "Generated by shuffler.io OpenAPI",
            required: queryitem.required,
            schema: {
              type: "string",
            },
          };

		  if (queryitem.example !== undefined) {
		  	newitem.example = queryitem.example
		  }

          if (queryitem.description !== undefined) {
            newitem.description = queryitem.description;
          }

          data.paths[item.url][item.method.toLowerCase()].parameters.push(
            newitem
          );
          //console.log(queryitem)
        }

        // Bad code as it doesn't allow for "anything".
        if (skipped) {
          toast(
            "Bad configuration of " +
              item.name +
              ". Skipping because queries are invalid."
          );
          continue;
        }
      }
      //data.paths[item.url][item.method.toLowerCase()].parameters.push(newitem)

      if (item.paths.length > 0) {
        for (let querykey in item.paths) {
          const queryitem = item.paths[querykey];

          if (queryitem.toLowerCase() == "url") {
            queryitem = "action_url";
          }

          if (queryitem.toLowerCase() == "apikey") {
            queryitem = "action_apikey";
          }

          newitem = {
            in: "path",
            name: queryitem,
            description: "Generated by shuffler.io OpenAPI",
            required: true,
            schema: {
              type: "string",
            },
          };

          if (queryitem.description !== undefined) {
            newitem.description = queryitem.description;
          }

          data.paths[item.url][item.method.toLowerCase()].parameters.push(newitem);
          //console.log(queryitem)
        }
      } else {
        // Always goes here if they didn't click anything :/
        const values = getCurrentPaths(item.url);
        const paths = values[0];

        for (let querykey in paths) {
          const queryitem = paths[querykey];
          newitem = {
            in: "path",
            name: queryitem,
            description: "Generated by shuffler.io OpenAPI",
            required: false,
            schema: {
              type: "string",
            },
          };

          if (queryitem.description !== undefined) {
            newitem.description = queryitem.description;
          }

          data.paths[item.url][item.method.toLowerCase()].parameters.push(
            newitem
          );
          //console.log(queryitem)
        }
      }

			const methodname = item.method.toLowerCase()
			if (methodname === "post" || methodname === "put" || methodname === "patch" || methodname === "delete") {
      	if (
      	  item.body !== undefined &&
      	  item.body !== null &&
      	  item.body.length > 0
      	) {
					//console.log("GOT BODY: ", item.url, item.method, item.body)

					// Replacing dollarsign insertions that aren't escaped
					// This is to stop it from messing with systems in Shuffle.
					// This MAY cause it to be a little weird in other systems however,
					// but it's the only way we can properly support e.g. GraphQL
					// with good examples
					var newbody = ""
					for (let bodykey in item.body) {
						if (item.body[bodykey] === "$") {
							if (bodykey > 0) {

								const newkey = parseInt(bodykey, 10)
								if (item.body[newkey-1] !== "\\") {
									if (item.body[newkey+1] !== "\{") {
										newbody += "\\"
									} 
								} 

								newbody += item.body[bodykey]
							} else {
								newbody += "\\"
								newbody += item.body[bodykey]
							}

						} else {
							newbody += item.body[bodykey]
						}
					}

					//console.log("New body: ", newbody)
					if (newbody !== item.body) {
						item.body = newbody
					}

					//var pathjoin = item.url+"_"+item.method.toLowerCase()

      	  const required = false;
      	  newitem = {
      	    in: "body",
      	    name: "body",
      	    multiline: true,
      	    description: "Generated by shuffler.io OpenAPI",
      	    required: required,
      	    example: item.body,
      	    schema: {
      	      type: "string",
      	    },
      	  };

      	  // FIXME - add application/json if JSON example?
      	  data.paths[item.url][item.method.toLowerCase()]["requestBody"] = {
      	    description: "Generated by Shuffler.io",
      	    required: required,
      	    content: {
      	      example: {
      	        example: item.body,
      	      },
      	    },
      	  };

      	  data.paths[item.url][item.method.toLowerCase()].parameters.push(
      	    newitem
      	  );
      	} else if (actionBodyRequest.includes(item.method.toUpperCase())) {
      	  // Appending an empty field
      	  const required = false;
      	  newitem = {
      	    in: "body",
      	    name: "body",
      	    multiline: true,
      	    description: "Generated by shuffler.io OpenAPI",
      	    required: required,
      	    example: "",
      	    schema: {
      	      type: "string",
      	    },
      	  };

      	  // FIXME - add application/json if JSON example?
      	  data.paths[item.url][item.method.toLowerCase()]["requestBody"] = {
      	    description: "Generated by Shuffler.io",
      	    required: required,
      	    content: {
      	      example: {
      	        example: "",
      	      },
      	    },
      	  };

      	  data.paths[item.url][item.method.toLowerCase()].parameters.push(
      	    newitem
      	  );
      	} else {
      	  //console.log("Nothing to append?")
      	}
			}

      // https://swagger.io/docs/specification/describing-request-body/file-upload/
      if (item.file_field !== undefined && item.file_field !== null && item.file_field.length > 0) {
        data.paths[item.url][item.method.toLowerCase()]["requestBody"][
          "content"
        ]["multipart/form-data"] = {
          schema: {
            type: "object",
            properties: {
              fieldname: {
                type: "string",
                value: item.file_field,
              },
            },
          },
        };

        //console.log(data.paths[item.url][item.method.toLowerCase()]["requestBody"]["content"]["multipart/form-data"])
      }

      if (item.headers.length > 0) {
        const required = false;

        const headersSplit = item.headers.split("\n");
        for (let headerkey in headersSplit) {
          const header = headersSplit[headerkey];

					var innerkey = ""
          var value = "";
          if (header.length > 0 && header.includes("= ")) {
            const headersplit = header.split("= ");
            innerkey = headersplit[0];
            value = headersplit[1];
          } else if (header.length > 0 && header.includes(" =")) {
            const headersplit = header.split(" =");
            innerkey = headersplit[0];
            value = headersplit[1];
          } else if (header.length > 0 && header.includes("=")) {
            const headersplit = header.split("=");
            innerkey = headersplit[0];
            value = headersplit[1];
          } else if (header.length > 0 && header.includes(": ")) {
            const headersplit = header.split(": ");
            innerkey = headersplit[0];
            value = headersplit[1];
          } else if (header.length > 0 && header.includes(" :")) {
            const headersplit = header.split(" :");
            innerkey = headersplit[0];
            value = headersplit[1];
          } else if (header.length > 0 && header.includes(":")) {
            const headersplit = header.split(":");
            innerkey = headersplit[0];
            value = headersplit[1];
          } else {
            continue;
          }

          if (innerkey.length > 0 && value.length > 0) {
            newitem = {
              in: "header",
              name: innerkey,
              multiline: false,
              description: "Header generated by shuffler.io OpenAPI",
              required: false,
              example: value,
              schema: {
                type: "string",
              },
            };

            data.paths[item.url][item.method.toLowerCase()].parameters.push(
              newitem
            );
          }
        }
      }
    }

    if (authenticationOption === "API key") {
      if (parameterName.length === 0) {
        toast("A field name for the APIkey must be defined");
        setAppBuilding(false);
        return;
      }

			console.log("Paramname: ", parameterName)
      var newparamName = parameterName.replaceAll('"', "");
      newparamName = newparamName.replaceAll("'", "");

      data.components.securitySchemes["ApiKeyAuth"] = {
        type: "apiKey",
        in: parameterLocation.toLowerCase(),
        name: newparamName,
				description: refreshUrl,
      }

			console.log("Full auth component: ", data.components.securitySchemes["ApiKeyAuth"])

    } else if (authenticationOption === "Bearer auth") {
      data.components.securitySchemes["BearerAuth"] = {
        type: "http",
        scheme: "bearer",
        bearerFormat: "UUID",
      };
    } else if (authenticationOption === "JWT") {
      data.components.securitySchemes["jwt"] = {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: parameterName,
      };

      console.log("SECURITYSCHEMES: ", data.components);
    } else if (authenticationOption === "Basic auth") {
      data.components.securitySchemes["BasicAuth"] = {
        type: "http",
        scheme: "basic",
      };
    } else if (authenticationOption === "Oauth2") {
	  console.log("oauth2: ", parameterName)
      var newparamName = parameterName.replaceAll('"', "");
      newparamName = newparamName.replaceAll("'", "");

	  // FIXME - this is a hack to get around the fact that the oauth2 
	  // flow is not properly defined 
	  if (oauth2Type === "application") {
		  newparamName = ""
	  }

      //parameterName, parameterValue, revocationUrl
      data.components.securitySchemes["Oauth2"] = {
        type: "oauth2",
        description: "Oauth2.0 authorizationCode authentication",
        flow: {
          authorizationCode: {
            authorizationUrl: newparamName,
            tokenUrl: parameterLocation,
            refreshUrl: refreshUrl,
            scopes:
              oauth2Scopes === undefined || oauth2Scopes === null
                ? []
                : oauth2Scopes,
          },
        },
      };


	  //if (value[flowkey][basekey]["x-grant-type"] !== undefined && value[flowkey][basekey]["x-grant-type"] !== null && value[flowkey][basekey]["x-grant-type"].length !== 0) {
	  if (oauth2GrantType.length > 0) { 
		  data.components.securitySchemes["Oauth2"]["x-grant-type"] = oauth2GrantType;
	  }

		console.log("SECURITYSCHEMES: ", data.components);
    }

    if (setExtraAuth.length > 0) {
      for (let authkey in extraAuth) {
        const curauth = extraAuth[authkey];

        if (curauth.name.length === 0 || curauth.name.toLowerCase() == "url") {
          toast("Can't add extra auth with empty name or Name URL");
          setAppBuilding(false);
          return;
        }

        data.components.securitySchemes[curauth.name] = {
          type: "apiKey",
          in: curauth.type,
          name: curauth.name,
        };
      }
    }

	setAppDownloadData(JSON.stringify(data, null, 4))

    fetch(globalUrl + "/api/v1/verify_openapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data, null, 4),
      credentials: "include",
    })
      .then((response) => {
        //if (response.status !== 200) {
        //	setErrorCode("An error occurred during validation")
        //	throw new Error("NOT 200 :O")
        //}

        setAppBuilding(false);
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
		  if (responseJson.extra !== undefined && responseJson.extra !== null) {
			toast("Failed building: " + responseJson.extra);
		  }

          if (responseJson.reason !== undefined) {
            setErrorCode(responseJson.reason);

			if (responseJson.extra === undefined && responseJson.extra === null) {
            	toast("Failed to verify: " + responseJson.reason);
			}
          }
        } else {
          toast("Successfully uploaded openapi");
          if (window.location.pathname.includes("/new")) {
            if (responseJson.id !== undefined && responseJson.id !== null) {
              window.location = `/apps/edit/${responseJson.id}`;
            }
          }
        }
      })
      .catch((error) => {
        setAppBuilding(false);
        setErrorCode(error.toString());
        toast(error.toString());
      });
  };

  const bearerAuth =
    authenticationOption === "Bearer auth" ? (
      <div style={{ color: "white" }}>
        <h4>
          <a
            target="_blank"
            href="https://swagger.io/docs/specification/authentication/bearer-authentication/"
            style={{ textDecoriation: "none", color: "#f85a3e" }}
          >
            Bearer auth
          </a>
        </h4>
        Users will be required to submit their API as the header "Authorization:
        Bearer APIKEY"
      </div>
    ) : null;

  // Basicauth
  const basicAuth =
    authenticationOption === "Basic auth" ? (
      <div style={{ color: "white" }}>
        <h4>
          <a
            target="_blank"
            href="https://swagger.io/docs/specification/authentication/basic-authentication/"
            style={{ textDecoriation: "none", color: "#f85a3e" }}
          >
            Basic authentication
          </a>
        </h4>
        Users will be required to submit a valid username and password before
        using the API
      </div>
    ) : null;

  const testAction = (index) => {
    console.log("Should test action at index " + index);
    console.log(actions[index]);
  };

  

  const duplicateAction = (index) => {
    var newAction = JSON.parse(JSON.stringify(actions[index]));
    newAction.name = newAction.name + "_copy";
    newAction.errors.push("Can't have the same name");

    actions.push(newAction);

    if (actions.length > actionAmount) {
      setActionAmount(actions.length);
    }

    setActions(actions);
    setFilteredActions(actions);
    setUpdate(Math.random());
  };

  const deleteAction = (index) => {
    actions.splice(index, 1);
    //setCurrentAction({
    //  name: "",
    //  description: "",
    //  url: "",
    //  file_field: "",
    //  headers: "",
    //  paths: [],
    //  queries: [],
    //  body: "",
    //  errors: [],
    //  method: actionNonBodyRequest[0],
    //});

    setActions(actions);
    setFilteredActions(actions);
    setActionAmount(actionAmount - 1);
    setUpdate(Math.random());
  };

  //console.log("Option: ", authenticationOption)
  //console.log("Location: ", parameterLocation)
  //console.log("Name: ", parameterName)
	//const extraKeys = 
  const extraKeys = authenticationOption === "Oauth2" ? null : 
    <div style={{ marginTop: 50, marginRight: 25, }}>
      <div style={{ display: "flex" }}>
        <Typography variant="body1">Extra authentication</Typography>
        {extraAuth.length === 0 ? (
          <Button
            color="primary"
            style={{ maxWidth: 50, marginLeft: 15 }}
            variant="outlined"
            onClick={() => {
              console.log("ADD NEW!");
              extraAuth.push(defaultAuth);
              setExtraAuth(extraAuth);
              setUpdate(Math.random());
            }}
          >
            <AddIcon style={{}} />
          </Button>
        ) : (
          <span style={{ width: 50 }} />
        )}
      </div>

      {extraAuth.map((value, index) => {
        return (
          <span
            key={index}
            style={{ display: "flex", height: 50, marginTop: 5 }}
          >
            <TextField
              required
              style={{
                height: 50,
                flex: 2,
                marginTop: 0,
                marginBottom: 0,
                backgroundColor: inputColor,
                marginRight: 5,
              }}
              fullWidth={true}
              placeholder="Name"
              id="standard-required"
              margin="normal"
              variant="outlined"
              defaultValue={extraAuth[index].name}
              onChange={(e) => {
                extraAuth[index].name = e.target.value;
                setExtraAuth(extraAuth);
              }}
              InputProps={{
                classes: {
                  notchedOutline: classes.notchedOutline,
                },
                style: {
                  color: "white",
                  minHeight: 50,
                  marginLeft: 5,
                  maxWidth: "95%",
                  fontSize: "1em",
                },
              }}
            />
            <TextField
              required
              style={{
                height: 50,
                marginTop: 0,
                marginBottom: 0,
                flex: 2,
                backgroundColor: inputColor,
                marginRight: 5,
              }}
              fullWidth={true}
              placeholder="Example - input an example for the user"
              id="standard-required"
              margin="normal"
              variant="outlined"
              defaultValue={extraAuth[index].example}
              onChange={(e) => {
                extraAuth[index].example = e.target.value;
                setExtraAuth(extraAuth);
              }}
              InputProps={{
                style: {
                  color: "white",
                  minHeight: 50,
                  marginLeft: 5,
                  maxWidth: "95%",
                  fontSize: "1em",
                },
              }}
            />
            <Select
              fullWidth
              onChange={(e) => {
                extraAuth[index].type = e.target.value;
                setUpdate(Math.random());
                setExtraAuth(extraAuth);
              }}
              value={extraAuth[index].type}
              style={{
                flex: 1,
                backgroundColor: inputColor,
                paddingLeft: "10px",
                color: "white",
                height: 50,
                borderRadius: theme.shape.borderRadius,
              }}
              inputProps={{
                name: "age",
                id: "outlined-age-simple",
              }}
            >
              <MenuItem
                key={index}
                style={{ backgroundColor: inputColor, color: "white" }}
                value={"header"}
              >
                Header
              </MenuItem>
              <MenuItem
                key={index}
                style={{ backgroundColor: inputColor, color: "white" }}
                value={"query"}
              >
                Query
              </MenuItem>
            </Select>
            <div style={{ display: "flex", width: 100 }}>
              {index === extraAuth.length - 1 ? (
                <Button
                  color="primary"
                  style={{}}
                  variant="outlined"
                  onClick={() => {
                    extraAuth.push(defaultAuth);
                    setExtraAuth(extraAuth);
                    setUpdate(Math.random());
                  }}
                >
                  <AddIcon style={{}} />
                </Button>
              ) : (
                <span style={{}} />
              )}
              <Button
                color="primary"
                style={{}}
                variant="outlined"
                onClick={() => {
                  const tmpAuth = extraAuth.filter(
                    (item) =>
                      item.type === value.type && item.name !== value.name
                  );
                  setExtraAuth(tmpAuth);
                  console.log(tmpAuth);
                  setUpdate(Math.random());
                }}
              >
                <RemoveIcon style={{}} />
              </Button>
            </div>
          </span>
        );
      })}
    </div>
  //);

  const jwtAuth =
    authenticationOption === "JWT" ? (
      <div style={{ color: "white", marginTop: 20 }}>
        <Typography variant="body1">JWT authentication</Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginTop: 10 }}
        >
          Authentication path
        </Typography>
        <TextField
          required
          style={{ margin: 0, flex: "1", backgroundColor: inputColor }}
          fullWidth={true}
          placeholder="/security/user/authenticate"
          id="standard-required"
          margin="normal"
          variant="outlined"
          defaultValue={parameterName}
          helperText={
            <span style={{ color: "white", marginBottom: "2px" }}>
              Must start with / and be a valid path
            </span>
          }
          onBlur={(e) => setParameterName(e.target.value)}
          InputProps={{
            classes: {
              notchedOutline: classes.notchedOutline,
            },
            style: {
              color: "white",
            },
          }}
        />
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginTop: 10 }}
        >
			Optional: Authentication queries 
        </Typography>
		{/*
        <TextField
          style={{ margin: 0, flex: "1", backgroundColor: inputColor }}
          fullWidth={true}
          placeholder="grant_type=client_credentials&scope=connect.api.read"
          id=""
          margin="normal"
          variant="outlined"
          defaultValue={parameterName}
          helperText={
            <span style={{ color: "white", marginBottom: "2px" }}>
			  Must use 'key=value&key=value' format
            </span>
          }
          onBlur={(e) => {
			  //setParameterName(e.target.value)
		  }}
          InputProps={{
            classes: {
              notchedOutline: classes.notchedOutline,
            },
            style: {
              color: "white",
            },
          }}
        />
		*/}
      </div>
    ) : null;

  const oauth2Auth =
    authenticationOption === "Oauth2" ? (
      <div style={{ color: "white", marginTop: 20 }}>
        <Typography variant="body1">Oauth2 authentication</Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginTop: 10 }}
        >
			{oauth2Type === "delegated" ?
				"Find the Authorization URL, Token URL and scopes in question for the API. Ensure your app in the service uses redirect url https://shuffler.io/set_authentication"
				:
				"Find the Token URL and scopes in question for the API"
			}
        </Typography>

		{oauth2Type === "delegated" ? 
			<span>
        		<Typography
        		  variant="body2"
        		  color="textSecondary"
        		  style={{ marginTop: 10 }}
        		>
        		  Authorization URL for Oauth2
        		</Typography>
        		<TextField
        		  required
        		  style={{ margin: 0, flex: "1", backgroundColor: inputColor }}
        		  fullWidth={true}
        		  placeholder="https://.../oauth2/authorize"
        		  type="name"
        		  id="standard-required"
        		  margin="normal"
        		  variant="outlined"
        		  value={parameterName}
        		  onChange={(e) => setParameterName(e.target.value)}
					onBlur={(event) => {
        		    var tmpstring = event.target.value.trim();

        		    if (
        		      tmpstring.length > 4 &&
        		      !tmpstring.startsWith("http") &&
        		      !tmpstring.startsWith("ftp")
        		    ) {
        		      toast("Auth URL must start with http(s)://");
        		    }

					if (tmpstring.includes("?")) {
						var newtmp = tmpstring.split("?")
						if (tmpstring.length > 1) {
							tmpstring = newtmp[0]
						}
					}

					setParameterName(tmpstring)
						}}
        		  InputProps={{
        		    classes: {
        		      notchedOutline: classes.notchedOutline,
        		    },
        		    style: {
        		      color: "white",
        		    },
        		  }}
        		/>
			</span>
		: null}
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginTop: 10 }}
        >
          Token URL for Oauth2
        </Typography>
        <TextField
          required
          style={{ margin: 0, flex: "1", backgroundColor: inputColor }}
          fullWidth={true}
          placeholder="https://.../oauth2/token"
          type="name"
          id="standard-required"
          margin="normal"
          variant="outlined"
          value={parameterLocation}
          onChange={(e) => {
						setParameterLocation(e.target.value)
					}}
					onBlur={(event) => {
            var tmpstring = event.target.value.trim();

            if (
              tmpstring.length > 4 &&
              !tmpstring.startsWith("http") &&
              !tmpstring.startsWith("ftp")
            ) {
              toast("Token URL must start with http(s)://");
            }

						if (tmpstring.includes("?")) {
							var newtmp = tmpstring.split("?")
							if (tmpstring.length > 1) {
								tmpstring = newtmp[0]
							}
						}

						setParameterLocation(tmpstring)
					}}
          InputProps={{
            classes: {
              notchedOutline: classes.notchedOutline,
            },
            style: {
              color: "white",
            },
          }}
        />
		{oauth2Type === "delegated" ? 
			<span>
        		<Typography
        		  variant="body2"
        		  color="textSecondary"
        		  style={{ marginTop: 10 }}
        		>
        		  Refresh-token URL for Oauth2 (Optional)
        		</Typography>
        		<TextField
        		  style={{ 
					margin: 0, flex: "1", backgroundColor: inputColor,
				  	border: refreshUrl.length > 0 && (!refreshUrl.startsWith("http") || refreshUrl.includes("//shuffler.")) ? "2px solid red" : "inherit",
				  }}
        		  fullWidth={true}
        		  placeholder="The URL to retrieve refresh-tokens at"
        		  type="name"
        		  id="standard-required"
        		  margin="normal"
        		  variant="outlined"
        		  value={refreshUrl}
				  helperText={!refreshUrl.startsWith("http") || refreshUrl.includes("//shuffler.")? "Must start with http(s):// and can not contain shuffler.io" : ""}
        		  onChange={(e) => setRefreshUrl(e.target.value)}
				  onBlur={(event) => {
        		    var tmpstring = event.target.value.trim();

        		    if (
        		      tmpstring.length > 4 &&
        		      !tmpstring.startsWith("http") &&
        		      !tmpstring.startsWith("ftp")
        		    ) {
        		      toast("Refresh URL must start with http(s)://");
        		    }

								if (tmpstring.includes("?")) {
									var newtmp = tmpstring.split("?")
									if (tmpstring.length > 1) {
										tmpstring = newtmp[0]
									}
								}

								setRefreshUrl(tmpstring)
							}}
        		  InputProps={{
        		    style: {
        		      color: "white",
        		    },
        		  }}
        		/>
			</span>
		: null}
		<Typography
		  variant="body2"
		  color="textSecondary"
		  style={{ marginTop: 10 }}
		>
		  Scopes for Oauth2
		</Typography>
		<MuiChipsInput
		  required
		  InputProps={{
			style: {
			  color: "white",
			  maxHeight: 160,
			},
		  }}
		  style={{ minHeight: 160, maxHeight: 160, overflowX: "hidden", overflowY: "auto" }}
		  placeholder="Available Oauth2 Scopes"
		  color="primary"
		  fullWidth
		  value={oauth2Scopes}
		  onChange={(chips) => {
			  setOauth2Scopes(chips)
			  setUpdate(Math.random())
		  }}
		/>
      </div>
    ) : null;

  const apiKey =
    authenticationOption === "API key" ? (
      <div style={{ color: "white", marginTop: 20 }}>
        <Typography variant="body1">API key authentication</Typography>
        <Typography variant="body2" color="textSecondary">
          Add the name of the field used for authentication, e.g. "X-APIKEY". Should NOT be your actual API-key.
        </Typography>
				<div style={{display: "flex", marginTop: 10, }}>
					<div style={{flex: 4,}}>
        				Key	
						<TextField
							required
							style={{ marginTop: 0, backgroundColor: inputColor }}
							fullWidth={true}
							placeholder="The Key to use as the header/query - NOT your actual API-key"
							type="name"
							id="standard-required"
							margin="normal"
							variant="outlined"
							value={parameterName}
							helperText={
								<span style={{ color: "white", marginBottom: "2px" }}>
									Can't be empty or contain any of the following: !#$%&'^"+-._~|]+$:=
								</span>
							}
							onChange={(e) => {
								setParameterName(e.target.value);
							}}
							onBlur={(event) => {
								var tmpstring = event.target.value.trim()

								// Check if tmpstring has any of the illegal characters in it
							}}
							InputProps={{
								classes: {
									notchedOutline: classes.notchedOutline,
								},
								style: {
									color: "white",
								},
							}}
						/>
					</div>
					<div style={{marginLeft: 5, flex: 1,}}>
        		Field type
        		<Select
        		  fullWidth
        		  onChange={(e) => {
        		    setParameterLocation(e.target.value);
        		  }}
        		  value={parameterLocation}
        		  style={{
        		    borderRadius: theme.shape.borderRadius,
        		    backgroundColor: inputColor,
        		    paddingLeft: 10,
        		    color: "white",
        		    height: 57,
        		  }}
        		  inputProps={{
        		    name: "age",
        		    id: "outlined-age-simple",
        		  }}
        		>
        		  {apikeySelection.map((data, index) => {
        		    if (data === undefined) {
        		      return null;
        		    }

        		    return (
        		      <MenuItem
        		        key={index}
        		        style={{ backgroundColor: inputColor, color: "white" }}
        		        value={data}
        		      >
        		        {data}
        		      </MenuItem>
        		    );
        		  })}
        		</Select>
					</div>
					<div style={{marginLeft: 5, flex: 1,}}>
        				Prefix	
						<TextField
							style={{ marginTop: 0, flex: "1", backgroundColor: inputColor }}
							fullWidth={true}
							placeholder="Token, SSWS..."
							type="name"
							id="standard-notrequired"
							margin="normal"
							variant="outlined"
							value={refreshUrl}
							onChange={(e) => {
								// Just reusing this state
      	        				setRefreshUrl(e.target.value);
							}}
						/>
					</div>
				</div>
      </div>
    ) : null;

  

		const getCurrentPaths = (urlPath) => {
  	  var paths = [];
  	  var queries = [];

  	  if (urlPath.includes("{") && urlPath.includes("}")) {
  	    var tmpWord = "";
  	    var record = false;

  	    var query = false;
  	    for (var key in urlPath) {
  	      if (urlPath[key] === "?") {
  	        query = true;
  	      }

  	      if (urlPath[key] === "}") {
  	        if (tmpWord === parameterName) {
  	          tmpWord = "";
  	          record = false;
  	          continue;
  	        } else if (query) {
  	          queries.push(tmpWord);
  	        } else {
  	          paths.push(tmpWord);
  	        }

  	        tmpWord = "";
  	        record = false;
  	      }

  	      if (record) {
  	        tmpWord += urlPath[key];
  	      }

  	      //if (urlPath[key] === "{" && urlPath[key-1] === "/") {
  	      if (urlPath[key] === "{") {
  	        record = true;
  	      }
  	    }
  	  }

  	  if (urlPath.includes("<") && urlPath.includes(">")) {
  	    var tmpWord = "";
  	    var record = false;

  	    var query = false;
  	    for (var key in urlPath) {
  	      if (urlPath[key] === "?") {
  	        query = true;
  	      }

  	      if (urlPath[key] === ">") {
  	        if (tmpWord === parameterName) {
  	          tmpWord = "";
  	          record = false;
  	          continue;
  	        } else if (query) {
  	          queries.push(tmpWord);
  	        } else {
  	          paths.push(tmpWord);
  	        }

  	        tmpWord = "";
  	        record = false;
  	      }

  	      if (record) {
  	        tmpWord += urlPath[key];
  	      }

  	      //if (urlPath[key] === "{" && urlPath[key-1] === "/") {
  	      if (urlPath[key] === "<") {
  	        record = true;
  	      }
  	    }
  	  }

  	  return [paths, queries];
  	};

	const foundCategory = newWorkflowCategories !== undefined && newWorkflowCategories !== null && newWorkflowCategories.length > 0 ? categories.find((x) => x.name === newWorkflowCategories[0]) : undefined
	const actionLabels = foundCategory !== undefined && foundCategory !== null  && foundCategory.action_labels.length > 0 ? ["No Label"].concat(foundCategory.action_labels) : []

	const ActionPaper = (props) => {
		const { data, index } = props

  	const [updater, setUpdater] = useState("tmp");
  	const [actionsModalOpen, setActionsModalOpen] = useState(false);
  	const [urlPath, setUrlPath] = useState("");
  	const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  	const [currentActionMethod, setCurrentActionMethod] = useState(actionNonBodyRequest[0])
  	const [extraBodyFields, setExtraBodyFields] = useState([]);
  	const [urlPathQueries, setUrlPathQueries] = useState([]);
		const [currentAction, setCurrentAction] = useState({
			name: "",
			file_field: "",
			description: "",
			url: "",
			headers: "",
			paths: [],
			queries: [],
			body: "",
			errors: [],
			example_response: "",
			method: actionNonBodyRequest[0],
			action_label: "No Label",
			required_bodyfields: [],
		});

		const findBodyParams = (body) => {
			const regex = /\${(\w+)}/g;
			const found = body.match(regex);
			if (found === null) {
				setExtraBodyFields([]);
			} else {
				setExtraBodyFields(found);
			}
  	};

		const UrlPathParameters = () => {
			const values = getCurrentPaths(urlPath);
			const paths = values[0];
			const queries = values[1];

			if (currentAction.paths !== paths && urlPath.length > 0) {
				//console.log("IN PATHS SETTER: !", paths)
				setActionField("paths", paths);
			}

			var tmpQueries = [];

			// No overlapping of names
			for (var key in queries) {
				const tmpquery = queries[key];
				const found = tmpQueries.find((query) => query.name === tmpquery);
				if (found === undefined) {
					tmpQueries.push({ name: queries[key], required: true });
				}
			}

			// FIXME: Frontend isn't updating..
			if (tmpQueries.length > 0 && JSON.stringify(tmpQueries) !== JSON.stringify(urlPathQueries)) {
				setUrlPathQueries(tmpQueries);
			}

			return paths.length > 0 ? (
				<div>Required parameters: {paths.join(", ")}</div>
			) : null;
		};


		const HandleIndividualChip = (props) => {
    		const { chipData, index } = props;
    		const [chipRequired, setChipRequired] = useState(currentAction.required_bodyfields !== undefined ? currentAction.required_bodyfields.includes(chipData) : false);

				const parsedChip = chipData.startsWith("${") && chipData.endsWith("}") ? chipData.substring(2, chipData.length - 1) : chipData

    		return (
    		  <Tooltip title={chipRequired ? "Make not required" : "Make required"}>
    		    <Chip
    		      style={{
    		        backgroundColor: chipRequired ? "#f86a3e" : "#3d3f43",
    		        height: 30,
    		        margin: 3,
    		        paddingLeft: 5,
    		        paddingRight: 5,
    		        height: 28,
    		        cursor: "pointer",
    		        borderColor: "#3d3f43",
    		        color: "white",
    		      }}
    		      label={parsedChip}
    		      onClick={() => {
						if (chipRequired) {
							currentAction["required_bodyfields"].splice(currentAction["required_bodyfields"].indexOf(chipData), 1)
						} else {
						currentAction["required_bodyfields"].push(chipData) 
						}

					setCurrentAction(currentAction);
    		        setChipRequired(!chipRequired);
    		      }}
    		    />
    		  </Tooltip>
    		);
  	};

		const setActionField = (field, value) => {
			currentAction[field] = value
			setCurrentAction(currentAction)

			//setUrlPathQueries(currentAction.queries)
		};

		const addPathQuery = () => {
  	  urlPathQueries.push({ name: "", required: true, example: "", });
  	  if (updater === "addupdater") {
  	    setUpdater("updater");
  	  } else {
  	    setUpdater("addupdater");
  	  }
  	  setUrlPathQueries(urlPathQueries);
  	};

  	const flipRequired = (index) => {
  	  urlPathQueries[index].required = !urlPathQueries[index].required;
  	  if (updater === "flipupdater") {
  	    setUpdater("updater");
  	  } else {
  	    setUpdater("flipupdater");
  	  }
  	  setUrlPathQueries(urlPathQueries);
  	};

  	const deletePathQuery = (index) => {
	  console.log("Should delete index: ", index)
	  var tmpqueries = JSON.parse(JSON.stringify(urlPathQueries))
	  tmpqueries.splice(index, 1)

	  console.log("Queries: ", tmpqueries)
  	  setUrlPathQueries(tmpqueries);

  	  if (updater === "deleteupdater") {
  	    setUpdater("updater");
  	  } else {
  	    setUpdater("deleteupdater");
  	  }
  	};

		const loopQueries = urlPathQueries.length === 0 ? null : (
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
        {urlPathQueries.map((query, queryIndex) => {
          const requiredColor = query.required === true ? "green" : "red";
          //const required = data.required === true ? <div style={{color: "green", cursor: "pointer"}}>{data.required.toString()}</div> : <div onClick={() => {flipRequired(index)}} style={{display: "inline", color: "red", cursor: "pointer"}}>{data.required.toString()}</div>
          return (
            <Paper key={queryIndex} style={actionListStyle}>
              <div style={{ marginLeft: "5px", width: "100%" }}>
								<div style={{display: "flex"}}>
									<TextField
										required
										fullWidth={true}
										defaultValue={query.name}
										placeholder={"Query name (key)"}
										label={"Query Key"}
										helperText={
											<span style={{ color: "white", marginBottom: "2px" }}>
												Click required to flip 
											</span>
										}
										onBlur={(e) => {
											console.log("IN BLUR: ", e.target.value);
											urlPathQueries[queryIndex].name = e.target.value.replaceAll("=", "");
											setUrlPathQueries(urlPathQueries);
										}}
										style={{flex: 3}}
										InputProps={{
											style: {
												color: "white",
											},
										}}
									/>
									<TextField
										fullWidth={true}
										defaultValue={query.example}
										placeholder={"Default value"}
										label={"Example"}
										onBlur={(e) => {
											urlPathQueries[queryIndex].example = e.target.value.replaceAll(
												"=",
												""
											)

											setUrlPathQueries(urlPathQueries)
										}}
										style={{flex: 2}}
										InputProps={{
											style: {
												color: "white",
											},
										}}
									/>
								</div>
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    flipRequired(queryIndex);
                  }}
                >
                  Required:{" "}
                  <div style={{ display: "inline", color: requiredColor }}>
                    {query.required.toString()}
                  </div>
                </div>
              </div>
              <div
                style={{ float: "right", color: "#f85a3e", cursor: "pointer" }}
                onClick={() => {
                  deletePathQuery(queryIndex);
                }}
              >
  							<DeleteIcon />
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

  	const SetExtraBodyField = (props) => {
  	  const { extraBodyFields } = props;

  	  if (extraBodyFields === undefined || extraBodyFields === null) {
  	    return null;
  	  }

  	  //const parsedlist = extraBodyFields.join(", ")
  	  //console.log("LIST: ", parsedlist)

  	  return (
  	    <span>
  	      {extraBodyFields.map((data, index) => {
  	        return <HandleIndividualChip key={index} chipData={data} />;
  	      })}
  	    </span>
  	  );
  	};

  	const bodyInfo = actionBodyRequest.includes(currentActionMethod) ? (
  	  <div style={{ marginTop: 10 }}>
  	    <b>Request Body</b>:{" "}
  	    {extraBodyFields.length > 0 ? (
  	      <Typography style={{ display: "inline-block" }}>
  	        <SetExtraBodyField extraBodyFields={extraBodyFields} />
  	      </Typography>
  	    ) : (
  	      <Typography style={{ display: "inline-block" }}>
  	        {`Add variables with \$\{ variable_name }`}
  	      </Typography>
  	    )}
  	    <TextField
  	      required
  	      style={{ flex: "1", marginRight: "15px", backgroundColor: inputColor }}
  	      fullWidth={true}
  	      placeholder={
  	        '{\n\t"example": "${example}",\n\t"apikey": "${apikey}",\n\t"search": "1.2.3.5"\n}'
  	      }
  	      margin="normal"
  	      variant="outlined"
  	      multiline
  	      minRows="5"
  	      defaultValue={currentAction["body"]}
  	      onChange={(e) => {
  	        setActionField("body", e.target.value);
  	        findBodyParams(e.target.value);
  	      }}
  	      key={currentAction}
  	      helperText={
  	        <span style={{ color: "white", marginBottom: "2px" }}>
  	          Shows an example body to the user. ${} creates variables.
  	        </span>
  	      }
  	      InputProps={{
  	        classes: {
  	          notchedOutline: classes.notchedOutline,
  	        },
  	        style: {
  	          color: "white",
  	        },
  	      }}
  	    />
  	    <div></div>
  	  </div>
  	) : null;

  	const exampleResponse = fileDownloadEnabled ? null : (
  	  <div style={{}}>
  	    <b>Example success response</b>
  	    <TextField
  	      required
  	      style={{ flex: "1", marginRight: "15px", backgroundColor: inputColor }}
  	      fullWidth={true}
  	      placeholder={
  	        '{\n\t"email": "testing@test.com",\n\t"firstname": "testing"\n}'
  	      }
  	      margin="normal"
  	      variant="outlined"
  	      multiline
  	      minRows="2"
  	      defaultValue={currentAction["example_response"]}
  	      onChange={(e) => setActionField("example_response", e.target.value)}
  	      helperText={
  	        <span style={{ color: "white", marginBottom: "2px" }}>
  	          Helps with autocompletion and understanding of the endpoint
  	        </span>
  	      }
  	      key={currentAction}
  	      InputProps={{
  	        style: {
  	          color: "white",
  	        },
  	      }}
  	    />
  	  </div>
  	);

  	const addActionToView = (errors) => {
  	  currentAction.errors = errors;
  	  currentAction.queries = urlPathQueries;
  	  setUrlPathQueries([]);

  	  const actionIndex = actions.findIndex((data) => data.name === currentAction.name);
  	  
  	  if (actionIndex < 0) {
  	    actions.push(currentAction);
  	  } else {
  	    actions[actionIndex] = currentAction;
  	  }

  	  if (actions.length > actionAmount) {
  	    setActionAmount(actions.length);
  	  }

  	  setActions(actions);
  	  setFilteredActions(actions);
  	};

  	const getActionErrors = () => {
  	  var errormessage = [];
  	  if (currentAction.name === undefined || currentAction.name.length === 0) {
  	    errormessage.push("Name can't be empty");
  	  }

  	  // Url verification
  	  //if (currentAction.url.length === 0) {
  	  //	errormessage.push("URL path can't be empty.")
  	  if (!currentAction.url.startsWith("/") && baseUrl.length > 0 && currentAction.url.length > 0) {
  	    errormessage.push("URL must start with /");
  	  }

  	  const check = urlPathQueries.findIndex((data) => data.name.length === 0);
  	  if (check >= 0) {
  	    errormessage.push("All queries must have a value");
  	  }

  	  return errormessage;
  	};


	  const getBackgroundColor = (data) => {
		var bgColor = "#61afee";
		if (data === "POST") {
			bgColor = "#49cc90";
		} else if (data === "PUT") {
			bgColor = "#fca130";
		} else if (data === "PATCH") {
			bgColor = "#50e3c2";
		} else if (data === "DELETE") {
			bgColor = "#f93e3e";
		} else if (data === "HEAD") {
			bgColor = "#9012fe";
		}

		return bgColor;
	  }


		const newActionModal = (
			<Drawer
			  anchor={"right"}
    		  open={actionsModalOpen}
    		  fullWidth
			  PaperProps={{
    		    style: {
    		      backgroundColor: surfaceColor,
    		      color: "white",
    		      minWidth: 700,
    		      maxWidth: 700,
    		    },
    		  }}
    		  onClose={() => {
			    console.log("Closing modal");

			    console.log(currentAction);
			    const errors = getActionErrors();
			    addActionToView(errors);
			    setActionsModalOpen(false);
			    setUrlPathQueries([]);
			    setUrlPath("");
			    setFileUploadEnabled(false);
    		  }}
    		>
    		  <FormControl style={{ backgroundColor: surfaceColor, color: "white" }}>
    		    <DialogTitle style={{marginTop: 45, }}>
    		      <div style={{ color: "white" }}>New action</div>
    		    </DialogTitle>
    		    <DialogContent style={{paddingBottom: 100, }}>
    		      <a
    		        target="_blank"
    		        href="https://shuffler.io/docs/app_creation#actions"
    		        style={{ textDecoration: "none", color: "#f85a3e" }}
    		      >
    		        Learn more about actions
    		      </a>
    		      <div style={{ marginTop: "15px" }} />
    		      Name
    		      <TextField
    		        required
    		        style={{
    		          flex: "1",
    		          marginTop: 5,
    		          marginRight: 15,
    		          backgroundColor: inputColor,
    		        }}
    		        fullWidth={true}
    		        placeholder="Name"
    		        type="name"
    		        id="standard-required"
    		        margin="normal"
    		        variant="outlined"
    		        defaultValue={currentAction["name"]}
    		        onChange={(e) => {
					  var trimmed = e.target.value.trim();
    		          setActionField("name", trimmed)
    		        }}
    		        onBlur={(e) => {
    		          // Fix basic issues in frontend. Python functions run a-zA-Z0-9_
    		          const regex = /[A-Za-z0-9 _]/g;
    		          const found = e.target.value.match(regex);
    		          if (found !== null) {
    		            setActionField("name", found.join(""));
    		          }

					  // Look through all actions and see if there is one with the same name
					  if (currentAction.url === "" && actions !== undefined && actions !== null && actions.length > 0) { 
					    for (var i = 0; i < actions.length; i++) {
						  if (actions[i].name.toLowerCase() === e.target.value.toLowerCase()) {
						    toast("Action with name " + e.target.value + " already exists. If you keep this, it will be overwritten.") 
						    break
						  }
					    }

					  }

    		        }}
    		        key={currentAction}
    		        InputProps={{
    		          classes: {
    		            notchedOutline: classes.notchedOutline,
    		          },
    		          style: {
    		            color: "white",
    		          },
    		        }}
    		      />
    		      <div style={{ marginTop: 10 }} />
    		      Description
    		      <TextField
    		        required
    		        style={{
    		          flex: "1",
    		          marginTop: "5px",
    		          marginRight: "15px",
    		          backgroundColor: inputColor,
    		        }}
    		        fullWidth={true}
    		        placeholder="Description"
    		        type="description"
    		        id="standard-required"
    		        margin="normal"
    		        variant="outlined"
    		        defaultValue={currentAction["description"]}
    		        onChange={(e) => setActionField("description", e.target.value)}
    		        InputProps={{
    		          style: {
    		            color: "white",
    		          },
    		        }}
    		      />
    		      <Divider
    		        style={{
    		          marginBottom: "10px",
    		          marginTop: "30px",
    		          height: "1px",
    		          width: "100%",
    		          backgroundColor: "grey",
    		        }}
    		      />
    		      <h2>Request</h2>
    		      <Select
    		        fullWidth
    		        onChange={(e) => {
    		          setActionField("method", e.target.value);
    		          setCurrentActionMethod(e.target.value);
    		        }}
    		        value={currentActionMethod}
    		        style={{
    		          backgroundColor: inputColor,
    		          paddingLeft: "10px",
    		          color: "white",
    		          height: "50px",
    		        }}
    		        inputProps={{
    		          name: "Method",
    		          id: "method-option",
    		        }}
    		      >

					// Add actionBodyRequest to actionNonBodyRequest
					{actionNonBodyRequest.concat(actionBodyRequest).map((data, index) => {
					  const backgroundColor = getBackgroundColor(data);
    		          return (
    		            <MenuItem
    		              key={index}
    		              style={{}}
    		              value={data}
    		            >
						  <Chip
						  	style={{
						  		color: "white",
						  		borderRadius: theme.shape.borderRadius,
						  		minWidth: 80,
						  		marginRight: 10,
						  		marginTop: 2,
						  		cursor: "pointer",
						  		fontSize: 14,
								fontWeight: "bold",
								backgroundColor: backgroundColor,
						  	}}
						  	label={data}
						  />
    		            </MenuItem>
    		          );
    		        })}
    		      </Select>
    		      <div style={{ marginTop: "15px" }} />
    		      URL path / Curl statement
    		      <TextField
    		        required
    		        style={{
    		          flex: "1",
    		          marginRight: "15px",
    		          marginTop: "5px",
    		          backgroundColor: inputColor,
    		        }}
    		        fullWidth={true}
    		        placeholder="URL path"
    		        id="standard-required"
    		        margin="normal"
    		        variant="outlined"
    		        value={urlPath}
    		        onChange={(e) => {
    		          setActionField("url", e.target.value);
    		          setUrlPath(e.target.value);
    		        }}
    		        helperText={
    		          <span style={{ color: "white", marginBottom: "2px" }}>
    		            The path to use. Must start with /. Use {"{variablename}"} to
    		            have path variables
    		          </span>
    		        }
    		        InputProps={{
    		          classes: {
    		            notchedOutline: classes.notchedOutline,
    		            input: classes.input,
    		          },
    		          style: {
    		            color: "white",
    		          },
    		        }}
    		        onBlur={(event) => {
    		          var parsedurl = event.target.value;
    		          //console.log("URL: ", parsedurl)
    		          if (parsedurl.includes("   ")) {
    		            parsedurl = parsedurl.replaceAll("   ", " ");
    		          }

    		          if (parsedurl.includes("  ")) {
    		            parsedurl = parsedurl.replaceAll("  ", " ");
    		          }

    		          if (parsedurl.includes("[") && parsedurl.includes("]")) {
    		            //console.log("REPLACE1")
    		            parsedurl = parsedurl.replaceAll("[", "{");
    		            parsedurl = parsedurl.replaceAll("]", "}");
    		          }

    		          if (parsedurl.includes("<") && parsedurl.includes(">")) {
    		            //console.log("REPLACE2")
    		            parsedurl = parsedurl.replaceAll("<", "{");
    		            parsedurl = parsedurl.replaceAll(">", "}");
    		          }

    		          //console.log("URL2: ", parsedurl)
    		          if (
    		            parsedurl.startsWith("PUT ") ||
    		            parsedurl.startsWith("GET ") ||
    		            parsedurl.startsWith("POST ") ||
    		            parsedurl.startsWith("DELETE ") ||
    		            parsedurl.startsWith("PATCH ") ||
    		            parsedurl.startsWith("CONNECT ")
    		          ) {
    		            const tmp = parsedurl.split(" ");

    		            if (tmp.length > 1) {
    		              parsedurl = tmp[1].trim();
    		              setActionField("url", parsedurl);

    		              setCurrentActionMethod(tmp[0].toUpperCase());
    		              setActionField("method", tmp[0].toUpperCase());
    		            }

    		            console.log("URL3: ", parsedurl);

    		            //setUpdate(Math.random());
    		          } else if (parsedurl.startsWith("curl")) {
    		            console.log("URL4: ", parsedurl);

    		            const request = parseCurl(event.target.value);
    		            if (
    		              request !== event.target.value &&
    		              request.method !== undefined &&
    		              request.method !== null
    		            ) {
    		              if (request.method.toUpperCase() !== currentAction.Method) {
    		                setCurrentActionMethod(request.method.toUpperCase());
    		                setActionField("method", request.method.toUpperCase());
    		              }

    		              if (request.header !== undefined && request.header !== null) {
    		                var headers = [];
    		                for (let [key, value] of Object.entries(request.header)) {
													if (value === undefined) {
														if (key.includes(":")) {
															const keysplit = key.split(":")
															key = keysplit[0].trim()
															value = keysplit[1].trim()

														} else if (key.includes("=")) {
															const keysplit = key.split("=")
															key = keysplit[0].trim()
															value = keysplit[1].trim()

														} else {
															toast("Removed key: ", key)
															continue
														}
													}

    		                  if (
    		                    parameterName !== undefined &&
    		                    key.toLowerCase() === parameterName.toLowerCase()
    		                  ) {
    		                    continue;
    		                  }

    		                  if (key === "Authorization") {
    		                    continue;
    		                  }

    		                  headers += key + "=" + value + "\n";
    		                }

												try {
    		                	setActionField("headers", headers.trim());
												} catch (e) {
													console.log("Failed to parse header: ", e)
												}
    		              }

    		              if (request.body !== undefined && request.body !== null) {
    		                setActionField("body", request.body);
    		              }

    		              // Parse URL
    		              if (request.url !== undefined) {
    		                parsedurl = request.url;
    		              }
    		            }

    		            console.log("PARSED: ", parsedurl);
    		            if (parsedurl !== undefined) {
    		              if (parsedurl.includes("<") && parsedurl.includes(">")) {
    		                parsedurl = parsedurl.split("<").join("{");
    		                parsedurl = parsedurl.split(">").join("}");
    		              }

    		              if (
    		                parsedurl.startsWith("http") ||
    		                parsedurl.startsWith("ftp")
    		              ) {
    		                if (
    		                  parsedurl !== undefined &&
    		                  parsedurl.includes(parameterName)
    		                ) {
    		                  // Remove <> etc.
    		                  //

    		                  console.log("IT HAS THE PARAM NAME!");
    		                  const newurl = new URL(encodeURI(parsedurl));
    		                  newurl.searchParams.delete(parameterName);
    		                  parsedurl = decodeURI(newurl.href);
    		                }

    		                // Remove the base URL itself
    		                if (
    		                  parsedurl !== undefined &&
    		                  baseUrl !== undefined &&
    		                  baseUrl.length > 0 &&
    		                  parsedurl.includes(baseUrl)
    		                ) {
    		                  parsedurl = parsedurl.replace(baseUrl, "");
    		                }

    		                // Check URL query && headers
    		                //setActionField("url", parsedurl)
    		              }
    		            }
    		          }

									if (baseUrl !== undefined && baseUrl !== null && parsedurl.startsWith(baseUrl)) {
    		  					parsedurl = parsedurl.replaceAll(baseUrl, "");
									}

									if (parsedurl.includes("?")) {
										const parsedurlsplit = parsedurl.split("?")
										parsedurl = parsedurlsplit[0]
										
										//var newqueries = selectedAction.queries === undefined || selectedAction.queries === null ? [] : selectedAction.queries

										const datasplit = parsedurlsplit[1].split("&")
										for (var key in datasplit) {
											//console.log("Data: ", datasplit[key])
											var actualkey = datasplit[key]
											var example = ""
											if (datasplit[key].includes("=")) {
												actualkey = datasplit[key].split("=")[0]
												example = datasplit[key].split("=")[1]
											}

											const foundPath = urlPathQueries.find(data => data.name === actualkey)
											if (foundPath === null || foundPath === undefined) {
												urlPathQueries.push({ name: actualkey, example: example, required: true })
											}
										}
									}

									// Found that dashes in the URL doesn't work
									//parsedurl = parsedurl.replace("-", "_")
									//console.log("Actions: ", actions)

									if (baseUrl.length === 0 && parsedurl.includes("http")) {
										try {
											const newurl = new URL(encodeURI(parsedurl))
											newurl.searchParams.delete(parameterName)
											console.log("New url: ", newurl)
											parsedurl = newurl.pathname
											setBaseUrl(newurl.origin)
										} catch (e) {
											console.log("Failed to parse URL: ", e)
										}
									}

    		          if (event.target.value !== parsedurl) {
    		            setUrlPath(parsedurl);
    		            setActionField("url", parsedurl);
    		          }
    		          //console.log("URL: ", request.url)
    		        }}
    		      />
    		      <UrlPathParameters />
    		      {loopQueries}
    		      <Button
    		        color="primary"
    		        style={{
    		          marginTop: "5px",
    		          marginBottom: "10px",
    		          borderRadius: "0px",
    		        }}
    		        variant="outlined"
    		        onClick={() => {
    		          addPathQuery();
    		        }}
    		      >
    		        New query
    		      </Button>
    		      {currentActionMethod === "POST" ? (
    		        <Button
    		          color="primary"
    		          variant={fileUploadEnabled ? "contained" : "outlined"}
    		          style={{
    		            marginLeft: 10,
    		            marginTop: "5px",
    		            marginBottom: "10px",
    		            borderRadius: "0px",
    		          }}
    		          onClick={() => {
    		            setFileUploadEnabled(!fileUploadEnabled);
    		            if (
    		              fileUploadEnabled &&
    		              currentAction["file_field"].length > 0
    		            ) {
    		              setActionField("file_field", "");
    		            }
    		            //setUpdate(Math.random());
    		          }}
    		        >
    		          Enable Fileupload
    		        </Button>
    		      ) : null}
    		      {/*currentActionMethod === "GET" ? (
    		        <Button
    		          color="primary"
    		          variant={fileDownloadEnabled ? "contained" : "outlined"}
    		          style={{
    		            marginLeft: 10,
    		            marginTop: "5px",
    		            marginBottom: "10px",
    		            borderRadius: "0px",
    		          }}
    		          onClick={() => {
    		            setFileDownloadEnabled(!fileDownloadEnabled);
    		            if (fileDownloadEnabled) {
    		              setActionField("example_response", "");
										} else {
    		              setActionField("example_response", "shuffle_file_download");
										}
    		            //setUpdate(Math.random());
    		          }}
    		        >
									Download as file
    		        </Button>
    		      ) : null*/}
    		      {fileUploadEnabled ? (
    		        <TextField
    		          required
    		          style={{
    		            backgroundColor: inputColor,
    		            display: "inline-block",
    		            marginLeft: 10,
    		            maxWidth: 210,
    		            marginTop: 7,
    		          }}
    		          placeholder={"file"}
    		          margin="normal"
    		          variant="outlined"
    		          id="standard-required"
    		          defaultValue={currentAction["file_field"]}
    		          onChange={(e) => setActionField("file_field", e.target.value)}
    		          helperText={
    		            <span style={{ color: "white", marginBottom: "2px" }}>
    		              The File field to interact with
    		            </span>
    		          }
    		          InputProps={{
    		            classes: {
    		              notchedOutline: classes.notchedOutline,
    		            },
    		            style: {
    		              color: "white",
    		            },
    		          }}
    		        />
    		      ) : null}
    		      <div />
							{fileUploadEnabled ? null :
								<span>
									<b>Headers</b>
									<TextField
										required
										style={{
											flex: "1",
											marginRight: "15px",
											marginTop: "5px",
											backgroundColor: inputColor,
										}}
										fullWidth={true}
										placeholder={
											"Accept: application/json\r\nContent-Type: application/json"
										}
										margin="normal"
										variant="outlined"
										id="standard-required"
										defaultValue={currentAction["headers"]}
										multiline
										minRows="2"
										onChange={(e) => setActionField("headers", e.target.value)}
										helperText={
											<span style={{ color: "white", marginBottom: "2px" }}>
												Headers that are part of the request. Default: EMPTY
											</span>
										}
										InputProps={{
											style: {
												color: "white",
											},
										}}
									/>
								</span>
							}
    		      {bodyInfo}
    		      <Divider
    		        style={{
    		          backgroundColor: "rgba(255,255,255,0.5)",
    		          marginTop: 15,
    		          marginBottom: 15,
    		        }}
    		      />
    		      {exampleResponse}
    		    </DialogContent>
    		    <div style={{position: "fixed", backgroundColor: theme.palette.surfaceColor, bottom: 0, width: "100%", padding: 25, borderTop: "1px solid rgba(255,255,255,0.3)", }}>
    		      <Button
    		        color="primary"
    		        variant={urlPath.length > 0 ? "contained" : "outlined"}
    		        style={{ }}
    		        onClick={() => {
    		          //console.log(urlPathQueries)
    		          //console.log(urlPath)
    		          console.log(currentAction);
    		          const errors = getActionErrors();
    		          addActionToView(errors);
    		          setActionsModalOpen(false);
    		          setUrlPathQueries([]);
    		          setUrlPath("");
    		          setFileUploadEnabled(false);
    		        }}
    		      >
    		        Submit
    		      </Button>
				  {/*
    		      <Button
    		        style={{ marginLeft: 10,  }}
    		        onClick={() => {
    		          setActionsModalOpen(false);
    		        }}
    		      >
    		        Cancel
    		      </Button>
				  */}
    		    </div>
    		  </FormControl>
    		</Drawer>
  		);


		var error =
			data.errors.length > 0 ? (
				<Tooltip
					color="primary"
					title={data.errors.join("\n")}
					placement="bottom"
				>
					<ErrorOutlineIcon />
				</Tooltip>
			) : (
				<Tooltip
					color="secondary"
					title={data.errors.join("\n")}
					placement="bottom"
				>
					<CheckCircleIcon style={{ marginTop: 6 }} />
				</Tooltip>
			);

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

		const url = data.url;
		const hasFile = (data["file_field"] !== undefined && data["file_field"] !== null && data["file_field"].length > 0) || data["example_response"] === "shuffle_file_download"
			
				
		return (
			<Paper key={index} style={actionListStyle}>
        {newActionModal}

				{error}
				<Tooltip title="Edit action" placement="bottom">
					<div
						id={data.name}
						style={{
							marginLeft: "5px",
							width: "100%",
							cursor: "pointer",
							maxWidth: 725,
							overflowX: "hidden",
						}}
						onClick={() => {
							//console.log("Data: ", data)
							if (hasFile) {
								//setActionField("headers", "")
								//console.log("It has a file: ", data["file_field"])
								
								setFileUploadEnabled(true);
								data.headers = ""
							} else {
								console.log("No file")
							}

							setCurrentAction(data);
							setCurrentActionMethod(data.method);

							console.log("QUERIES: ", data.queries)
							setUrlPathQueries(data.queries);
							setUrlPath(data.url);
							setActionsModalOpen(true);

							if (data["body"] !== undefined && data["body"] !== null && data["body"].length > 0) {
								findBodyParams(data["body"]);
							} else {
								console.log("No body param")
							}

						}}
					>
						<div style={{ display: "flex" }}>
							<Chip
								style={{
									backgroundColor: bgColor,
									color: "white",
									borderRadius: theme.shape.borderRadius,
									minWidth: 80,
									marginRight: 10,
									marginTop: 2,
									cursor: "pointer",
									fontSize: 14,
								}}
								label={data.method}
							/>
							<span
								style={{
									fontSize: 16,
									marginTop: "auto",
									marginBottom: "auto",
								}}
							>
								{hasFile ? (
									<AttachFileIcon style={{ height: 20, width: 20 }} />
								) : null}{" "}
								{url} - {data.name}
							</span>
						</div>
					</div>
				</Tooltip>
				{/*
			<Tooltip title="Test action" placement="bottom">
				<div style={{color: "#f85a3e", cursor: "pointer", marginRight: "10px", }} onClick={() => {testAction(index)}}>
					Test
				</div>
			</Tooltip>
			*/}

				{/* From 2023: Example of handling action labels */}
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
								}
							}}
							value={data?.action_label?.replace(" ", "_").toLowerCase()}
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
								return (
									<MenuItem
										key={labelindex}
										value={label.replace(" ", "_").toLowerCase()}
										style={{ 
										}}
									>
										{label}
									</MenuItem>
								)
							})}
						</Select>
				: null}

				<Tooltip
					title="Duplicate action"
					placement="bottom"
					style={{ minWidth: 60 }}
				>
					<div
						style={{
							color: "#f85a3e",
							cursor: "pointer",
							marginRight: 15,
						}}
						onClick={() => {
							duplicateAction(index);
						}}
					>
						<FileCopyIcon color="secondary" />
					</div>
				</Tooltip>
				<Tooltip
					title="Delete action"
					placement="bottom"
					style={{ minWidth: 60 }}
				>
					<div
						style={{ color: "#f85a3e", cursor: "pointer" }}
						onClick={() => {
							deleteAction(index);
						}}
					>
						<DeleteIcon color="secondary" />
					</div>
				</Tooltip>


				{ index === filteredActions.length - 1 || index === actionAmount - 1 ?
          <Button
            color="primary"
            style={{ borderRadius: 0, position: "absolute", top: 70, }}
            variant={actions.length === 0 ? "contained" : "outlined"}
            onClick={(e) => {
			  e.preventDefault();

              setCurrentActionMethod(actionNonBodyRequest[0]);
              setCurrentAction({
                name: "",
                description: "",
                url: "",
                file_field: "",
                headers: "",
                queries: [],
                paths: [],
                body: "",
                errors: [],
                method: actionNonBodyRequest[0],
				action_label: "No Label",
				required_bodyfields: [],
              });
              setActionsModalOpen(true);
            }}
          >
            New action
          </Button>
				: null}
			</Paper>
		)
	}

  const LoopActions = (props) => {
	const { filteredActions } = props;

	//console.log("Actions: ", filteredActions)
    if (filteredActions === null || filteredActions === undefined || filteredActions.length === 0) {
		return null
	}
		
	return (
      <div>
        {filteredActions.slice(0, actionAmount).map((data, index) => {
					//console.log("Found action: ", data)
        	return (
				<ActionPaper key={index} index={index} data={data} />
		  	)
		})}
	  </div>
	)
  }



  const tagView = (
    <div style={{ color: "white" }}>
      {/*
			<ChipInput
				style={{marginTop: 10}}
				InputProps={{
					style:{
						color: "white",
					},
				}}
				placeholder="Categories"
				color="primary"
				fullWidth
				value={newWorkflowCategories}
				onAdd={(chip) => {
					newWorkflowCategories.push(chip)
					setNewWorkflowCategories(newWorkflowCategories)
					setUpdate("added "+chip)
				}}
				onDelete={(chip, index) => {
					newWorkflowCategories.splice(index, 1)
					setNewWorkflowCategories(newWorkflowCategories)
					setUpdate("delete "+chip)
				}}
			/>
			*/}
      <h4>Choose a Category</h4>
      <Select
        fullWidth
        SelectDisplayProps={{
          style: {
            marginLeft: 10,
          },
        }}
        onChange={(e) => {
          setNewWorkflowCategories([e.target.value]);
          setUpdate("added " + e.target.value);
        }}
        value={newWorkflowCategories.length === 0 ? "Select a category" : newWorkflowCategories[0]}
        
        style={{ backgroundColor: inputColor, color: "white", height: "50px" }}
      >
        {categories.map((data, index) => {
					if (data === undefined || data === null || data === "" || data === undefined || data === null || data === "") {
						return null
					}

					return (
						<MenuItem
							key={index}
							style={{ backgroundColor: inputColor, color: "white" }}
							value={data.name}
						>
							{data.name}
						</MenuItem>
        	)
				})}
      </Select>
      <h4>Tags</h4>
      <MuiChipsInput
        style={{ marginTop: 10 }}
        InputProps={{
          style: {
            color: "white",
          },
        }}
        placeholder="Tags"
        color="primary"
        fullWidth
        value={newWorkflowTags}
	    onChange={(chips) => {
			setNewWorkflowTags(chips)
			setUpdate("added "+chips)
	    }}

      />
    </div>
  );

  const ParsedActionHandler = () => {
    const passedOrg = { id: "", name: "" };
    const owner = "";
    const passedTags = ["single test"];

    const [, setUpdate] = useState();
    const [authenticationModalOpen, setAuthenticationModalOpen] =
      useState(false);
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
      app.authentication !== null &&
        app.authentication !== undefined &&
        app.authentication.required &&
        app.authentication.parameters !== undefined &&
        app.authentication.parameters !== null
        ? true
        : false
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
            newfields[item.fields[filterkey].key] =
              item.fields[filterkey].value;
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
      console.log(selectedAction);
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
          }

          return response.json();
        })
        .then((responseJson) => {
          if (
            responseJson.success &&
            responseJson.data !== undefined &&
            responseJson.data !== null &&
            responseJson.data.length !== 0
          ) {
            var newauth = [];
            for (var key in responseJson.data) {
              if (responseJson.data[key].defined === false) {
                continue;
              }

              newauth.push(responseJson.data[key]);
            }

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

                const found = selectedAction.parameters.find(
                  (param) => param.name === item.name
                );
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
    } 

		/*
		else if (selectedAction.id === undefined && currentAction.name !== undefined && currentAction.name !== null && currentAction.name.length > 0) {
      var methodName = `${currentAction.method}_${currentAction.name}`;
      if (currentAction.method.toLowerCase() === "custom" ||
        currentAction.name.toLowerCase().startsWith(currentAction.method.toLowerCase())) {
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
		*/

    const setNewAppAuth = (appAuthData) => {
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
          toast(error.toString());
        });
    };

    const AuthenticationData = (props) => {
      const selectedApp = props.app;
      console.log("APP: ", selectedApp);

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
        //console.log("NEW AUTH: ", authenticationOption);
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
            return null;
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

      console.log("PRE RETURN");
      return (
        <div>
          <DialogContent>
            <a
              target="_blank"
              rel="norefferer"
              href="https://shuffler.io/docs/app_creation#authentication"
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
            {selectedApp.authentication.parameters.map((data, index) => {
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
                      data.example !== undefined && data.example.includes("***")
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
  };

  const actionView = (
    <div style={{ color: "white", position: "relative" }}>
      <div style={{ position: "absolute", right: 0, top: 0 }}>
        {actionAmount > 0 && actionAmount < filteredActions.length ? (
          <Button
            color="primary"
            style={{ float: "right", borderRadius: 0, textAlign: "center" }}
            variant="outlined"
            onClick={() => {
              setActionAmount(filteredActions.length);
              /*
						if (actionAmount+increaseAmount > filteredActions.length) {
							setActionAmount(filteredActions.length)
						} else {
							setActionAmount(actionAmount+increaseAmount)
						}
						*/
            }}
          >
            See all actions
          </Button>
        ) : null}
      </div>
      <Typography variant="h6">
        Actions{" "}
        {actionAmount > 0 ? (
          <span>
            ({actionAmount} / {filteredActions.length})
          </span>
        ) : null}
      </Typography>
      <Typography variant="body2" style={{ marginTop: 10, marginBottom: 10 }}>
        Actions are the tasks performed by an app - usually single URL paths for
        REST API's.
      </Typography>

      {projectCategories !== undefined &&
      projectCategories !== null &&
      projectCategories.length > 1 ? (
        <div style={{ marginTop: 10, marginBottom: 10 }}>
          {projectCategories.map((tag, index) => {
            const newname = tag.charAt(0).toUpperCase() + tag.slice(1);

			//var regex = /_shuffle_replace_\d/i;
			////console.log("NEW: ", 
			//newname = newname.replaceAll(regex, "")
			//console.log("Replaced: ", newname) 

            return (
              <Chip
                key={index}
                style={{
                  backgroundColor:
                    tag === selectedCategory ? "#f86a3e" : "#3d3f43",
                  height: 30,
                  margin: 3,
                  paddingLeft: 5,
                  paddingRight: 5,
                  height: 28,
                  cursor: "pointer",
                  borderColor: "#3d3f43",
                  color: "white",
                }}
                label={newname}
                onClick={() => {
                  if (selectedCategory === tag) {
                    setFilteredActions(actions);
                    setSelectedCategory("");
                    setActionAmount(50);
                    return;
                  }

                  const foundActions = actions.filter(
                    (data) => data.category === tag
                  );
                  setFilteredActions(foundActions);
                  setSelectedCategory(tag);
                  if (actionAmount > foundActions.length) {
                    setActionAmount(foundActions.length);
                  }

                  //{filteredActions.slice(0,actionAmount).map((data, index) => {

                  //console.log("Found: ", foundActions)
                  //{filteredActions.slice(0,actionAmount).map((data, index) => {
                  //{actions.slice(0,actionAmount).map((data, index) => {
                }}
                variant={selectedCategory === tag ? "contained " : "outlined"}
                color={selectedCategory === tag ? "primary" : "secondary"}
              />
            );
          })}
        </div>
      ) : null}
      <div>
        <LoopActions filteredActions={filteredActions} />
				{ actions.length === 0 || filteredActions.length === 0 ? 
          <Button
            color="primary"
            style={{ borderRadius: 0, marginTop: 15, marginBottom: 10, }}
            variant={actions.length === 0 ? "contained" : "outlined"}
            onClick={(e) => {
              actions.push({
                name: "Change Me",
                description: "",
                url: "",
                file_field: "",
                headers: "",
                queries: [],
                paths: [],
                body: "",
                errors: [],
                method: actionNonBodyRequest[0],
								action_label: "No Label",
								required_bodyfields: [],
              });

							console.log("Added: ", actions)
              setActions(actions)
							setFilteredActions(actions)
              setActionAmount(50);
    					setUpdate(Math.random());
            }}
          >
            New action
          </Button>
					: null}
				{/*
        <div style={{ display: "flex" }}>
          <Button
            color="primary"
            style={{ marginTop: "20px", borderRadius: "0px" }}
            variant={actions.length === 0 ? "contained" : "outlined"}
            onClick={() => {
  	    			//actions.push({
              //  name: "Change name",
              //  description: "",
              //  url: "",
              //  file_field: "",
              //  headers: "",
              //  queries: [],
              //  paths: [],
              //  body: "",
              //  errors: [],
              //  method: actionNonBodyRequest[0],
							//	action_label: "No Label",
							//	required_bodyfields: [],
              //})
							//setActions(actions)
							//setFilteredActions(actions)
    					//setUpdate(Math.random());

    					//const foundPaper = document.getElementById("Change name");
							//if (foundPaper !== null) {
							//	console.log("Found: ", foundPaper)
							//} else {
							//	console.log("Not found")
							//}

							// Find the item and click if possible

              //setCurrentActionMethod(actionNonBodyRequest[0]);
              //setCurrentAction({
              //  name: "",
              //  description: "",
              //  url: "",
              //  file_field: "",
              //  headers: "",
              //  queries: [],
              //  paths: [],
              //  body: "",
              //  errors: [],
              //  method: actionNonBodyRequest[0],
              //});
              //setActionsModalOpen(true);
            }}
          >
            New action
          </Button>
						{actionAmount} {actions.length}
        </div>
				*/}
      </div>
    </div>
  );

  const testView = (
    <div style={{ color: "white" }}>
      <h2>Test</h2>
      Test an action to see whether it performs in an expected way.
      <a
        target="_blank"
        href="https://shuffler.io/docs/app_creation#testing"
        style={{ textDecoration: "none", color: "#f85a3e" }}
      >
        &nbsp;TBD: Click here to learn more about testing
      </a>
      .<div>Test :)</div>
    </div>
  );

  var image = "";
  const editHeaderImage = (event) => {
    const file = event.target.value;
    const actualFile = event.target.files[0];
    const fileObject = URL.createObjectURL(actualFile);
    setFile(fileObject);
  };

  if (file !== "") {
    const img = document.getElementById("logo");
    var canvas = document.createElement("canvas");
    canvas.width = 174;
    canvas.height = 174;
    var ctx = canvas.getContext("2d");

    if (img)
      img.onload = function () {
        // img, x, y, width, height
        //ctx.drawImage(img, 174, 174)
        //console.log("IMG natural: ", img.naturalWidth, img.naturalHeight)
        //ctx.drawImage(img, 0, 0, 174, 174)
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        try {
          const canvasUrl = canvas.toDataURL();
          if (canvasUrl !== fileBase64) {
            //console.log("SET URL TO: ", canvasUrl)
            setFileBase64(canvasUrl);
          }
        } catch (e) {
          toast("Failed to parse canvasurl!");
        }
      };

    //console.log(img.width)
    //console.log(img.width)
    //canvas.width = img.width
    //canvas.height = img.height
  }

  const [imageUploadError, setImageUploadError] = useState("");
  const [openImageModal, setOpenImageModal] = useState("");
  const [scale, setScale] = useState(1);
  const [rotate, setRotatation] = useState(0);
  const [disableImageUpload, setDisableImageUpload] = useState(true);

  let imageData = fileBase64;
  let croppedData = file.length > 0 ? file : fileBase64;

  const imageInfo = (
    <img
      crossOrigin="anonymous"
      src={imageData}
      id="logo"
      style={{
        maxWidth: 174,
        maxHeight: 174,
        minWidth: 174,
        minHeight: 174,
        objectFit: "contain",
      }}
    />
  );

  const alternateImg = (
    <AddPhotoAlternateIcon
      style={{
        width: 100,
        height: 100,
        flex: "1",
        display: "flex",
        flexDirection: "row",
        margin: "auto",
        marginTop: 30,
        marginLeft: 40,
      }}
      onClick={() => {
        upload.click();
      }}
    />
  );

  const zoomIn = () => {
    console.log("ZOOOMING IN");
    setScale(scale + 0.1);
  };

  const zoomOut = () => {
    setScale(scale - 0.1);
  };
  const rotatation = () => {
    setRotatation(rotate + 10);
  };

  const onPositionChange = () => {
    setDisableImageUpload(false);
  };

  const onCancelSaveAppIcon = () => {
    setFile("");
    setOpenImageModal(false);
    setImageUploadError("");
  };

  let editor;
  const setEditorRef = (imgEditor) => {
    editor = imgEditor;
  };

  const onSaveAppIcon = () => {
    if (editor) {
      try {
        setFile("");
        const canvas = editor.getImageScaledToCanvas();
        setFileBase64(canvas.toDataURL());
        setOpenImageModal(false);
        setDisableImageUpload(true);
      } catch (e) {
        toast("Failed to set image. Replace it if this persists.");
      }
    }
  };

  const errorText =
    imageUploadError.length > 0 ? (
      <div style={{ marginTop: 10 }}>Error: {imageUploadError}</div>
    ) : null;

  const imageUploadModalView = openImageModal ? (
    <Dialog
      open={openImageModal}
      onClose={onCancelSaveAppIcon}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: "300px",
          minHeight: "300px",
        },
      }}
    >
      <FormControl>
        <DialogTitle>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>Upload App Icon</div>
        </DialogTitle>
        {errorText}
        <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
          <AvatarEditor
            ref={setEditorRef}
            image={croppedData}
            width={174}
            height={174}
            border={50}
            color={[0, 0, 0, 0.6]} // RGBA
            scale={scale}
            rotate={rotate}
            onImageChange={onPositionChange}
            onLoadSuccess={() => setRotatation(0)}
          />
          <Divider style={dividerStyle} />
          <Tooltip title={"New Icon"}>
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={appIconStyle}
            >
              <AddAPhotoOutlinedIcon
                onClick={() => {
                  upload.click();
                }}
                color="primary"
              />
            </Button>
          </Tooltip>
          <Tooltip title={"Zoom In"}>
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={appIconStyle}
            >
              <ZoomInOutlinedIcon onClick={zoomIn} color="primary" />
            </Button>
          </Tooltip>
          <Tooltip title={"Zoom out"}>
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={appIconStyle}
            >
              <ZoomOutOutlinedIcon onClick={zoomOut} color="primary" />
            </Button>
          </Tooltip>
          <Tooltip title={"Rotate"}>
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={appIconStyle}
            >
              <LoopIcon onClick={rotatation} color="primary" />
            </Button>
          </Tooltip>
          <Divider style={dividerStyle} />
        </DialogContent>
        <DialogActions>
          <Button
            style={{ borderRadius: "0px" }}
            onClick={onCancelSaveAppIcon}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{ borderRadius: "0px" }}
            disabled={disableImageUpload}
            onClick={() => {
              onSaveAppIcon();
            }}
            color="primary"
          >
            Continue
          </Button>
        </DialogActions>
        {/*<ParsedActionHandler />*/}
      </FormControl>
    </Dialog>
  ) : null;

  const validateRemote = () => {
    setValidation(true);

    fetch(globalUrl + "/api/v1/get_openapi_uri", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify(openApi),
      credentials: "include",
    })
      .then((response) => {
        setValidation(false);
        if (response.status !== 200) {
          return response.json();
        }

        return response.text();
      })
      .then((responseJson) => {
        if (typeof responseJson !== "string" && !responseJson.success) {
          console.log(responseJson.reason);
          if (responseJson.reason !== undefined) {
            setOpenApiError(responseJson.reason);
          } else {
            setOpenApiError("Undefined issue with OpenAPI validation");
          }
          return;
        }

        console.log("Validating response!");
        validateOpenApi(responseJson);
      })
      .catch((error) => {
        toast(error.toString());
        setOpenApiError(error.toString());
      });
  }

  const circularLoader = validation ? (
    <CircularProgress color="primary" />
  ) : null;

  const newApimodalView = openApiModal ? 
    <Dialog
      open={openApiModal}
      onClose={() => {
        setOpenApiModal(false)
      }}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
        },
      }}
    >
      <FormControl>
        <DialogTitle>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>
			Merge with another OpenAPI document. You will get to choose Actions before they are merged.
          </div>
        </DialogTitle>
        <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
          Paste in the URI for the OpenAPI
          <TextField
            style={{ backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
              endAdornment: (
                <Button
                  style={{
                    borderRadius: "0px",
                    marginTop: "0px",
                    height: "50px",
                  }}
                  variant="contained"
                  disabled={openApi.length === 0 || appValidation.length > 0}
                  color="primary"
                  onClick={() => {
                    setOpenApiError("");
                    validateRemote();
                  }}
                >
                  Validate
                </Button>
              ),
            }}
            onChange={(e) => {
              setOpenApi(e.target.value);
            }}
            helperText={
              <span style={{ color: "white", marginBottom: "2px" }}>
                Must point to a version 2 or 3 OpenAPI specification.
              </span>
            }
            placeholder="OpenAPI URI"
            fullWidth
          />
          {/*
					  <div style={{marginTop: "15px"}}/>
					  Example: 
					  <div />
					  https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/json/uber.json
						*/}
          <p>Or upload a YAML/JSON specification</p>
          <input
            hidden
            type="file"
            ref={newUpload}
            accept="application/JSON,application/YAML,application/yaml,text/yaml,text/x-yaml,application/x-yaml,application/vnd.yaml,.yml,.yaml"
            multiple={false}
            onChange={uploadFile}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => newUpload.current.click()}
          >
            Upload
          </Button>
          {errorText}
        </DialogContent>
        <DialogActions>
          {circularLoader}
          <Button
            style={{ borderRadius: "0px" }}
            onClick={() => {
              setOpenApiModal(false);
              setAppValidation("");
              setOpenApiError("");
              setOpenApi("");
              setOpenApiData("");
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{ borderRadius: "0px" }}
            disabled={appValidation.length === 0}
            onClick={() => {
              redirectOpenApi();
            }}
            color="primary"
          >
            Continue
          </Button>
        </DialogActions>
      </FormControl>
    </Dialog>
   : null

  // Random names for type & autoComplete. Didn't research :^)
  const landingpageDataBrowser = (
    <div style={{ paddingBottom: 100, color: "white" }}>
      <Breadcrumbs
        aria-label="breadcrumb"
        separator="›"
        style={{ color: "white" }}
      >
        <Link to="/apps" style={{ textDecoration: "none", color: "inherit" }}>
          <h2 style={{ color: "rgba(255,255,255,0.5)" }}>
            <AppsIcon style={{ marginRight: 10 }} />
            Apps
          </h2>
        </Link>
        <h2>
          {name}{" "}
          {actions === null ||
          actions === undefined ||
          actions.length === 0 ? null : (
            <span>({actions.length})</span>
          )}
        </h2>
      </Breadcrumbs>
      {imageUploadModalView}
      <input
        hidden
        type="file"
        ref={(ref) => (upload = ref)}
        onChange={editHeaderImage}
      />
      <Paper style={boxStyle}>
	  	<div style={{display: "flex", }}>
			<div style={{flex: 1, }}>
				<h2 style={{ marginBottom: "10px", color: "white" }}>
				  General information
				</h2>
			</div>
			<div style={{flex: 1, itemAlign: "right", textAlign: "right",}}>
          		<Tooltip title="Merge with another API (coming soon)" placement="bottom">
					<IconButton
						disabled
						onClick={() => {
							setOpenApiModal(true)
						}}
					>
						<CallMergeIcon 
							style={{}} 
							onClick={() => {
								setOpenApiModal(true)
							}}
						/>
					</IconButton>
				</Tooltip>
			</div>
		</div>
        <a
          target="_blank"
          href="https://shuffler.io/docs/app_creation#app-creator-instructions"
          style={{ textDecoration: "none", color: "#f85a3e" }}
        >
          Click here to learn more about app creation
        </a>
        <div
          style={{
            color: "white",
            flex: "1",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Tooltip title="Click to edit the app's image" placement="bottom">
            <div
              style={{
                flex: "1",
                margin: 10,
                border: "1px solid #f85a3e",
                cursor: "pointer",
                backgroundColor: inputColor,
                maxWidth: 174,
                maxHeight: 174,
              }}
              onClick={() => {
                /*
									if (fileBase64.length === 0) {
										upload.click()
									}
									*/

                setOpenImageModal(true);
              }}
            >
              {imageData ? imageInfo : alternateImg}
              <input
                hidden
                type="file"
                ref={(ref) => (upload = ref)}
                onChange={editHeaderImage}
              />
            </div>
          </Tooltip>
          <div style={{ flex: "3", color: "white" }}>
            <div style={{ marginTop: "10px" }} />
            Name
            <TextField
              required
              style={{
                flex: "1",
                marginTop: "5px",
                marginRight: "15px",
                backgroundColor: inputColor,
              }}
              fullWidth={true}
              placeholder="Name"
              type="name"
              id="standard-required"
              margin="normal"
              variant="outlined"
              value={name}
              onChange={(e) => {
                const invalid = ["#", ":", "."];
                for (var key in invalid) {
                  if (e.target.value.includes(invalid[key])) {
                    toast("Can't use " + invalid[key] + " in name");
										setName(e.target.value.replaceAll(".", "").replaceAll("#", "").replaceAll(":", "").replaceAll(",", ""))

                    return;
                  }
                }

                if (e.target.value.length > 29) {
                  toast("Choose a shorter name (max 29).");
									setName(e.target.value.slice(0,28))
                  return;
                }

                //e.target.value.trim()

                setName(e.target.value);
              }}
              onBlur={(e) => {
                setName(e.target.value.trim());
              }}
              color="primary"
              InputProps={{
                style: {
                  color: "white",
                  height: "50px",
                  fontSize: "1em",
                },
                classes: {
                  notchedOutline: classes.notchedOutline,
                },
              }}
            />
            <div style={{ marginTop: "10px" }} />
            Description
            <TextField
              required
              style={{
                flex: "1",
                marginTop: "5px",
                marginRight: "15px",
                backgroundColor: inputColor,
								maxHeight: 250,
								overflow: "auto",
              }}
              fullWidth={true}
              type="name"
              id="outlined-with-placeholder"
              margin="normal"
							multiline
              variant="outlined"
              placeholder="A description for the service"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              InputProps={{
                classes: {
                  notchedOutline: classes.notchedOutline,
                },
                style: {
                  color: "white",
                },
              }}
            />
          </div>
        </div>
        <Divider
          style={{
            marginBottom: 10,
            marginTop: 30,
            height: 1,
            width: "100%",
            backgroundColor: "grey",
          }}
        />
        <Typography
          variant="h6"
          style={{ marginTop: 10, marginBottom: 10, color: "white" }}
        >
          API information
        </Typography>
        <Typography variant="body1">
          Base URL - used as suggestion to the user
        </Typography>
        <TextField
          color="primary"
          style={{ backgroundColor: inputColor, marginTop: "5px" }}
          InputProps={{
            classes: {
              notchedOutline: classes.notchedOutline,
            },
            style: {
              height: "50px",
              color: "white",
              fontSize: "1em",
            },
          }}
          required
          fullWidth={true}
          type="name"
          id="standard-required"
          margin="normal"
          variant="outlined"
          value={baseUrl}
          helperText={
            <span style={{ color: "white", marginBottom: "2px" }}>
              Must start with http(s):// and CANT end with /.{" "}
            </span>
          }
          placeholder="https://api.example.com"
          onChange={(e) => setBaseUrl(e.target.value)}
          onBlur={(event) => {
            var tmpstring = event.target.value.trim();
            if (tmpstring.endsWith("/")) {
              tmpstring = tmpstring.slice(0, -1);
            }

            if (
              tmpstring.length > 4 &&
              !tmpstring.startsWith("http") &&
              !tmpstring.startsWith("ftp")
            ) {
              toast("URL must start with http(s)://");
            }

						if (tmpstring.includes("?")) {
							var newtmp = tmpstring.split("?")
							if (tmpstring.length > 1) {
								tmpstring = newtmp[0]
							}
						}

            setBaseUrl(tmpstring);
          }}
        />
				<div style={{padding: 25, border: "2px solid rgba(255,255,255,0.7)", borderRadius: theme.palette?.borderRadius, }}>
	  				<span style={{display: "flex", }}>
					<FormControl style={{ }} variant="outlined">
						<Typography variant="h6">Authentication</Typography>
						<a
							target="_blank"
							href="https://shuffler.io/docs/app_creation#authentication"
							style={{ textDecoration: "none", color: "#f85a3e" }}
						>
							Learn more about app authentication
						</a>
						<Select
							fullWidth
							onChange={(e) => {
								setAuthenticationOption(e.target.value);
								if (e.target.value === "No authentication") {
									setAuthenticationRequired(false);
								} else {
									setAuthenticationRequired(true);
								}

								if (e.target.value === "Oauth2") {
									if (parameterLocation === "Header") {
										setParameterLocation("")
									}

									setExtraAuth([])
								}
							}}
							value={authenticationOption}
							style={{
								backgroundColor: inputColor,
								color: "white",
								height: "50px",
							}}
						>
							{authenticationOptions.map((data, index) => (
								<MenuItem
									key={index}
									style={{ backgroundColor: inputColor, color: "white" }}
									value={data}
								>
									{data}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					{authenticationOption === "Oauth2" ? 
						<FormControl style={{ marginLeft: 310, maxWidth: 240, }} variant="outlined">
							{/*
							<Typography variant="body2">
								- Delegated: The user will get a popup for access their personal data.
								- Application: Permissions are set by the app creator in the 3rd party platform. 
							</Typography>
							*/}
							<div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", }}>
								<Typography variant="body2" style={{ marginTop: 10, marginRight: 10, }} color="textSecondary">Oauth2 type</Typography>
								<Select
									fullWidth
									onChange={(e) => {
										setOauth2Type(e.target.value)

										if (e.target.value === "application" && oauth2GrantType === "") {
											setOauth2GrantType("client_credentials")
        		  							setParameterName("")
										} 

										if (e.target.value === "delegated") {
											setOauth2GrantType("")
										}
									}}
									value={oauth2Type}
									style={{
										backgroundColor: inputColor,
										color: "white",
										height: "50px",
									}}
								>
									{["delegated", "application"].map((data, index) => (
										<MenuItem
											key={index}
											style={{ backgroundColor: inputColor, color: "white" }}
											value={data}
										>
											{data}
										</MenuItem>
									))}
								</Select>
							</div>

							{oauth2Type === "application" ?
								<div style={{display: "flex", }}>
									<Typography variant="body2" style={{ marginTop: 10, marginRight: 10, }} color="textSecondary">Grant Type</Typography>
									<Select
										fullWidth
										label="Grant Type"
										onChange={(e) => {
											setOauth2GrantType(e.target.value);
										}}
										value={oauth2GrantType}
										style={{
											backgroundColor: inputColor,
											color: "white",
											height: "50px",
										}}
									>
										{["client_credentials", "password"].map((data, index) => (
											<MenuItem
												key={index}
												style={{ backgroundColor: inputColor, color: "white" }}
												value={data}
											>
												{data}
											</MenuItem>
										))}
									</Select>
								</div>
							: null}
						</FormControl>
					: null}
	  				</span> 


					<div style={{marginTop: 15 }} />
					{basicAuth}
					{bearerAuth}
					{apiKey}
					{oauth2Auth}
					{jwtAuth}
					{extraKeys}
				</div>

        {/*authenticationOption === "No authentication" ? null :
						<FormControlLabel
							style={{color: "white", marginBottom: 0, marginTop: 20}}
							label=<div style={{color: "white"}}>Authentication required (default true)</div>
							control={<Switch checked={authenticationRequired} onChange={() => {
								setAuthenticationRequired(!authenticationRequired)
							}} />}
					/>*/}
        <Divider
          style={{
            marginBottom: "10px",
            marginTop: "30px",
            height: "1px",
            width: "100%",
            backgroundColor: "grey",
          }}
        />
        <div style={{ marginTop: "25px" }}>{actionView}</div>

        <Divider
          style={{
            marginBottom: 10,
            marginTop: 70,
            height: 1,
            width: "100%",
            backgroundColor: "grey",
          }}
        />
        <div style={{ marginTop: "25px" }}>{tagView}</div>
        {/*
					{/*
					<Divider style={{marginBottom: "10px", marginTop: "30px", height: "1px", width: "100%", backgroundColor: "grey"}}/>
						{testView}
					*/}

	  	<div style={{display: "flex", marginTop: 35, }}>
			{appDownloadData.length > 0 ?
				<Tooltip title="Download the OpenAPI specification for the App" placement="bottom">
					<IconButton
						style={{marginRight: 25, }} 
						onClick={() => {
							toast(`Downloading OpenAPI JSON data for for ${name}`)
							// Download as file
          					var blob = new Blob([appDownloadData], {
          					  type: "application/octet-stream",
          					});

          					var url = URL.createObjectURL(blob);
							var link = document.createElement("a");
						    link.setAttribute("href", url);
						    link.setAttribute("download", `${name}.json`);
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
						}}
					>
						<CloudDownloadIcon />
					</IconButton>
				</Tooltip>
			: null}
			<Button
			  disabled={appBuilding}
			  color="primary"
			  variant="contained"
	  		  fullWidth
			  style={{ height: "50px", flex: 1,  }}
			  onClick={() => {
				submitApp();
			  }}
			>
			  {appBuilding ? <CircularProgress /> : "Save"}
			</Button>
	  		{appDownloadData.length > 0 ?
				<div style={{width: 50, }}/>
			: null}
	  	</div>

		<Typography style={{ marginTop: 25, textAlign: "center", }}>
		  {errorCode.length > 0 ? `Upload Error: ${errorCode}` : null}
		</Typography>

      </Paper>
    </div>
  );

  const loadedCheck =
    isLoaded && isAppLoaded ? (
      <div>
        <div style={bodyDivStyle}>{landingpageDataBrowser}</div>
  		{newApimodalView} 
      </div>
    ) : (
      <div></div>
    );

  return <div>{loadedCheck}</div>;
};
export default AppCreator;
