import React, { useEffect, useContext, memo } from "react";

import { useInterval } from "react-powerhooks";
import theme from '../theme.jsx';

import {
  IconButton,
  Typography,
  Grid,
  Select,
  Paper,
  Divider,
  ButtonBase,
  Button,
  TextField,
  FormControl,
  MenuItem,
  Tooltip,
  FormControlLabel,
  Switch,
  Input,
  Breadcrumbs,
  Chip,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  Zoom,
  InputAdornment,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
} from "@mui/material";

import {
  AutoFixHigh as AutoFixHighIcon,
  LockOpen as LockOpenIcon,
  OpenInNew as OpenInNewIcon,
  Apps as AppsIcon,
  Cached as CachedIcon,
  Publish as PublishIcon,
  CloudDownload as CloudDownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
	Search as SearchIcon,
	Folder as FolderIcon,
	LibraryBooks as LibraryBooksIcon,
} from "@mui/icons-material";
import { Context } from "../context/ContextApi.jsx";

import {
	ForkRight as ForkRightIcon,
} from '@mui/icons-material';

import aa from 'search-insights'
import { InstantSearch, Configure, connectSearchBox, connectHits, Index } from 'react-instantsearch-dom';
import algoliasearch from 'algoliasearch/lite';

import YAML from "yaml";
import { useNavigate, Link, useParams } from "react-router-dom";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import Dropzone from "../components/Dropzone.jsx";

const surfaceColor = "#27292D";
const inputColor = "#383B40";

const chipStyle = {
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

// Fixes names by making them uppercase and such
// Used for labels. A lot of places don't use this yet
export const FixName = (name) => {
  if (name === undefined || name === null) {
	return ""
  }	

  const newAppname = (
    name.charAt(0).toUpperCase() + name.substring(1)
  ).replaceAll("_", " ")

  return newAppname
}


// Takes input of e.g. $node.data.#.asd and a matching value from a json blob
// Returns 
export const FindJsonPath = (path, inputdata) => {
	const splitkey = ".";
	var parsedValues = [];

	if (inputdata === undefined || inputdata === null) {
		console.log("Input is ", inputdata, ". Returning.")
		return inputdata
	}

	if (typeof inputdata !== "object") {
		console.log("Input is NOT an object. Returning.")
		return inputdata
	}

	var keysplit = path.split(splitkey)
	if (path.startsWith("$") && keysplit.length > 1) {
		keysplit = keysplit.slice(1,)
	}

	if (keysplit.length === 0) {
		console.log("Couldn't find key: length is 0 for keysplit.")
		return inputdata
	}

	// FIXME: Check list - always getting FIRST item, not digging too deep.
	// If object, send further
	if (keysplit[0].includes("#")) {
		if (Object.prototype.toString.call(inputdata) === '[object Array]') {
			if (inputdata.length === 0) {
				return ""
			} else {

				// Fix the list
				if (keysplit.length === 1) {
					return inputdata[0] 
				} else {
					const joinedsplit = keysplit.slice(1,).join(".")
					return FindJsonPath(joinedsplit, inputdata[0]) 
				}
			}
		} else {
			return "" 
		}
	}

	var found = false
	for (const [key, value] of Object.entries(inputdata)) {
		const newkey = key.valueOf().toLowerCase().replaceAll(" ", "_")
		if (key === keysplit[0] || newkey === keysplit[0]) {
			found = true 

			// Return if no more keys
			// Else, dig deeper
			if (keysplit.length === 1) {
				return value
			} else {
				const joinedsplit = keysplit.slice(1,).join(".")
				return FindJsonPath(joinedsplit, value) 
			}
		} else {
			//console.log("N: ", key)
		}
	}

	return inputdata 
}

export const internalIds = ["shuffle tools", "http", "email"];

// Parses JSON data into keys that can be used everywhere :)
// Reverse of this is FindJsonPath 
export const GetParsedPaths = (inputdata, basekey) => {
  const splitkey = ".";
  var parsedValues = [];
  if (inputdata === undefined || inputdata === null) {
    return parsedValues;
  }

  if (typeof inputdata !== "object") {
    return parsedValues;
  }

  for (const [key, value] of Object.entries(inputdata)) {
    // Check if loop or JSON
    const extra = basekey.length > 0 ? splitkey : "";
    const basekeyname = `${basekey
      .slice(1, basekey.length)
      .split(".")
      .join(splitkey)}${extra}${key}`;

    // Handle direct loop!
    if (!isNaN(key) && basekey === "") {
      parsedValues.push({
        type: "object",
        name: "Node",
        autocomplete: `${basekey.replaceAll(" ", "_")}`,
      });

      //parsedValues.push({
      //  type: "value",
      //  name: `${basekey} length`,
      //  autocomplete: `{{ ${basekey.replaceAll(" ", "_")} | size }}`,
      //});

      parsedValues.push({
        type: "list",
        name: `${splitkey}list`,
        autocomplete: `${basekey.replaceAll(" ", "_")}.#`,
      });
      const returnValues = GetParsedPaths(value, `${basekey}.#`);
      for (var subkey in returnValues) {
        parsedValues.push(returnValues[subkey]);
      }

      return parsedValues;
    }

    //console.log("KEY: ", key, "VALUE: ", value, "BASEKEY: ", basekeyname)
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        // Check if each item is object
        parsedValues.push({
          type: "object",
          name: basekeyname,
          autocomplete: `${basekey}.${key.replaceAll(" ", "_")}`,
        });

        //parsedValues.push({
        //  type: "value",
        //  name: `${basekeyname} length`,
        //  autocomplete: "{{ "+`${basekey}.${key.replaceAll(" ", "_")} | size }}`,
        //});

        parsedValues.push({
          type: "list",
          name: `${basekeyname}${splitkey}list`,
          autocomplete: `${basekey}.${key.replaceAll(" ", "_")}.#`,
        });

        // Only check the first. This would be probably be dumb otherwise.
        for (var subkey in value) {
          if (typeof value === "object") {
            const returnValues = GetParsedPaths(
              value[subkey],
              `${basekey}.${key}.#`
            );
            for (var subkey in returnValues) {
              parsedValues.push(returnValues[subkey]);
            }
          }

          // Don't need else as # (all items) is already defined before the loop

          break;
        }
        //console.log(key+" is array")
      } else {
        parsedValues.push({
          type: "object",
          name: basekeyname,
          autocomplete: `${basekey}.${key.replaceAll(" ", "_")}`,
        });
        const returnValues = GetParsedPaths(value, `${basekey}.${key}`);
        for (var subkey in returnValues) {
          parsedValues.push(returnValues[subkey]);
        }
      }
    } else {
      parsedValues.push({
        type: "value",
        name: basekeyname,
        autocomplete: `${basekey}.${key.replaceAll(" ", "_")}`,
        value: value,
      });
    }
  }

  return parsedValues;
};

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const Apps = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata, serverside, } = props;


  //const [workflows, setWorkflows] = React.useState([]);
  const baseRepository = "https://github.com/frikky/shuffle-apps";
  //const alert = useAlert();
	let navigate = useNavigate();

  const [selectedApp, setSelectedApp] = React.useState({});
  const [firstrequest, setFirstrequest] = React.useState(true);
  const [apps, setApps] = React.useState([]);
  const [filteredApps, setFilteredApps] = React.useState([]);
  const [validation, setValidation] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [appSearchLoading, setAppSearchLoading] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState({});
  const [searchBackend, setSearchBackend] = React.useState(false);
  const [searchableApps, setSearchableApps] = React.useState([]);
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);

  const [openApi, setOpenApi] = React.useState("");
  const [openApiData, setOpenApiData] = React.useState("");
  const [appValidation, setAppValidation] = React.useState("");
  const [loadAppsModalOpen, setLoadAppsModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [openApiModal, setOpenApiModal] = React.useState(false);
  const [generateAppModal, setGenerateAppModal] = React.useState(false);

  const [openApiModalType, setOpenApiModalType] = React.useState("");
  const [openApiError, setOpenApiError] = React.useState("");
  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");
  const [cursearch, setCursearch] = React.useState("");
  const [sharingConfiguration, setSharingConfiguration] = React.useState("you");
  const [downloadBranch, setDownloadBranch] = React.useState("master");
  const [creatorProfile, setCreatorProfile] = React.useState({});
  const [contact, setContact] = React.useState("");

  const [isDropzone, setIsDropzone] = React.useState(false);
  const upload = React.useRef(null);
  const [firstLoad, setFirstLoad] = React.useState(true);
  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io"
      ? true
      : false;
  const borderRadius = 3;
  const viewWidth = 590;

  const { start, stop } = useInterval({
    duration: 5000,
    startImmediate: false,
    callback: () => {
      getApps();
    },
  });

  useEffect(() => {
	  console.log("APPVALID: ", appValidation)
	  redirectOpenApi()
  }, [appValidation])

  const getUserProfile = (username) => {
    if (serverside === true || !isCloud) {
	  setCreatorProfile({})
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
        } else {
		  setCreatorProfile({})
		}
      })
      .catch((error) => {
        console.log(error);
	    setCreatorProfile({})
      });
  };

  useEffect(() => {
    if (apps.length <= 0 && firstrequest) {
      document.title = "Shuffle - Apps";

      if (!isLoggedIn && isLoaded) {
				if (isCloud) {
        	navigate("/search?tab=apps")
        } else {
        	navigate("/login")
				}
      }

      setFirstrequest(false);
      getApps();
    }
  });

  function sortByKey(array, key) {
    if (array === undefined || array === null) {
      return array;
    }

    return array.sort(function (a, b) {
      var x = a[key];
      var y = b[key];

      if (typeof x == "string") {
        x = ("" + x).toLowerCase();
      }
      if (typeof y == "string") {
        y = ("" + y).toLowerCase();
      }

      return x < y ? 1 : x > y ? -1 : 0;
    });
  }

  const appViewStyle = {
    color: "#ffffff",
    width: "100%",
    display: "flex",
    margin: "auto",
  };

  const paperAppStyle = {
    minHeight: 130,
    maxHeight: 130,
    minWidth: "100%",
    maxWidth: 612.5,
    marginBottom: 5,
    borderRadius: theme.palette?.borderRadius,
    color: "white",
    backgroundColor: surfaceColor,
    cursor: "pointer",
    display: "flex",
  };

  const getApps = () => {
	// Get apps from localstorage
	var storageApps = []
	try {
		const appstorage = localStorage.getItem("apps")
		storageApps = JSON.parse(appstorage)
		if (storageApps === null || storageApps === undefined || storageApps.length === 0) {
			storageApps = []
		} else {
			setApps(storageApps)
			setFilteredApps(storageApps)
			setAppSearchLoading(false)
		}
	} catch (e) {
		//console.log("Failed to get apps from localstorage: ", e)
	}

    fetch(globalUrl + "/api/v1/apps", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        setIsLoading(false);
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");

          //if (isCloud) {
          //  window.location.pathname = "/search";
          //}
        }

        return response.json();
      })
      .then((responseJson) => {
        //responseJson = sortByKey(responseJson, "large_image")
        //responseJson = sortByKey(responseJson, "is_valid")
        //setFilteredApps(responseJson.filter(app => !internalIds.includes(app.name) && !(!app.activated && app.generated)))

        var privateapps = [];
        var valid = [];
        var invalid = [];
        for (var key in responseJson) {
          const app = responseJson[key];
          if (app.is_valid && !(!app.activated && app.generated)) {
            privateapps.push(app);
          } else if (
            app.private_id !== undefined &&
            app.private_id.length > 0
          ) {
            valid.push(app);
          } else {
            invalid.push(app);
          }
        }

        //console.log(privateapps)
        //console.log(valid)
        //console.log(invalid)
        //console.log(privateapps)
        //privateapps.reverse()
        privateapps.push(...valid);
        privateapps.push(...invalid);

        setApps(privateapps);
        setCursearch("");

        //handleSearchChange(event.target.value)
        //setCursearch(event.target.value)
        setFilteredApps(privateapps);
        if (privateapps.length > 0) {
          if (selectedApp.id === undefined || selectedApp.id === null) {
			if (privateapps[0].owner !== undefined && privateapps[0].owner !== null) {
			  getUserProfile(privateapps[0].owner);
			}

    		setContact(privateapps[0].contact_info)

            setSelectedApp(privateapps[0]);
			setSharingConfiguration(privateapps[0].sharing === true ? "public" : "you")
          }

          if (
            privateapps[0].actions !== null &&
            privateapps[0].actions.length > 0
          ) {
            setSelectedAction(privateapps[0].actions[0]);
          } else {
            setSelectedAction({});
          }
        }

		if (privateapps.length > 0 && storageApps.length === 0) {
			try {
				localStorage.setItem("apps", JSON.stringify(privateapps))
			} catch (e) {
				console.log("Failed to set apps in localstorage: ", e)
			}
		}

				//setTimeout(() => {
				//	setFirstLoad(false)
				//}, 5000)
      })
      .catch((error) => {
        toast(error.toString());
        setIsLoading(false);
      });
  };

  const downloadApp = (inputdata) => {
    const id = inputdata.id;

    toast("Downloading..");
    fetch(globalUrl + "/api/v1/apps/" + id + "/config", {
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
        if (!responseJson.success) {
          toast("Failed to download file");
        } else {
          console.log(responseJson);
          const basedata = atob(responseJson.openapi);
          console.log("BASE: ", basedata);
          var inputdata = JSON.parse(basedata);
          console.log("POST INPUT: ", inputdata);
          inputdata = JSON.parse(inputdata.body);

          const newpaths = {};
          if (inputdata["paths"] !== undefined) {
            Object.keys(inputdata["paths"]).forEach(function (key) {
              newpaths[key.split("?")[0]] = inputdata.paths[key];
            });
          }

          inputdata.paths = newpaths;
          console.log("INPUT: ", inputdata);
          var name = inputdata.info.title;
          name = name.replace(/ /g, "_", -1);
          name = name.toLowerCase();

          delete inputdata.id;
          delete inputdata.editing;

          const data = YAML.stringify(inputdata);
          var blob = new Blob([data], {
            type: "application/octet-stream",
          });

          var url = URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `${name}.yaml`);
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
          //link.parentNode.removeChild(link)
        }
      })
      .catch((error) => {
        console.log(error);
        toast(error.toString());
      });
  };

  // dropdown with copy etc I guess
  const AppPaper = (props) => {
	const { app } = props
	const data = app

    if (data.name === "" && data.id === "") {
      return null;
    }

    var boxWidth = "2px";
    if (selectedApp.id === data.id) {
      boxWidth = "4px";
    }

    var boxColor = "orange";
    if (data.is_valid) {
      boxColor = "green";
    }

    if (!data.activated && data.generated) {
      boxColor = "orange";
    }

    if (data.invalid) {
      boxColor = "red";
    }

    //<div style={{backgroundColor: theme.palette.inputColor, height: 100, width: 100, borderRadius: 3, verticalAlign: "middle", textAlign: "center", display: "table-cell"}}>
    // <div style={{width: "100px", height: "100px", border: "1px solid black", verticalAlign: "middle", textAlign: "center", display: "table-cell"}}>
    var imageline =
      data.large_image === undefined || data.large_image.length === 0 ? (
        <img
          alt={data.title}
		  src={theme.palette.defaultImage}
          style={{
            borderRadius: borderRadius,
            width: 100,
            height: 100,
            backgroundColor: theme.palette.inputColor,
          }}
        />
      ) : (
        <img
          alt={data.title}
          src={data.large_image}
          style={{
            borderRadius: borderRadius,
            maxWidth: 100,
            minWidth: 100,
            maxHeight: "100%",
            display: "block",
            margin: "0 auto",
          }}
          onLoad={(event) => {
            //console.log("IMG LOADED!: ", event.target)
          }}
        />
      );

    var newAppname = data.name;
    if (newAppname === undefined) {
      newAppname = "Undefined";
    } else {
      newAppname = newAppname.charAt(0).toUpperCase() + newAppname.substring(1);
      newAppname = newAppname.replaceAll("_", " ");
    }

    var sharing = "public";
    if (!data.sharing) {
      sharing = "private";
    }

    var valid = "true";
    if (!data.valid) {
      valid = "false";
    }

	if (data.actions === undefined || data.actions === null) {
		// Check if data type undefined/bool
		if (typeof data === "boolean") {
			data = {}
		}
		
		data.actions = []
	}

    if (data === undefined || data.actions === undefined || data.actions === null || data.actions.length === 0) {
      valid = "false"
    }

    var description = data.description;
    const maxDescLen = 60;
    if (description.length > maxDescLen) {
      description = data.description.slice(0, maxDescLen) + "...";
    }

    const version = data.app_version;
    return (
      <Paper
        square
        key={data.id}
        style={paperAppStyle}
        onClick={() => {
          if (selectedApp.id !== data.id) {

			if (data.owner !== undefined && data.owner !== null) {
			  getUserProfile(data.owner);
			}

    		setContact(data.contact_info)

            data.name = newAppname;
            setSelectedApp(data);
			setSharingConfiguration(data.sharing === true ? "public" : "you")

            if (
              data.actions !== undefined &&
              data.actions !== null &&
              data.actions.length > 0
            ) {
              setSelectedAction(data.actions[0]);
            } else {
              setSelectedAction({});
            }

            if (data.sharing) {
              setSharingConfiguration("public");
            }
          }
        }}
      >
        <Grid
          container
          style={{ margin: 10, flex: "10", maxHeight: 110, overflow: "hidden" }}
        >
          <ButtonBase
            style={{
              backgroundColor: theme.palette.surfaceColor,
              maxHeight: 100,
              marginTop: 5,
            }}
          >
            {imageline}
          </ButtonBase>
          <div
            style={{
              marginLeft: "10px",
              marginTop: 5,
              marginBottom: 5,
              width: boxWidth,
              backgroundColor: boxColor,
            }}
          />
          <Grid container style={{ margin: "0px 0px 10px 10px", flex: "1" }}>
            <Grid style={{ display: "flex", flexDirection: "column" }}>
              <Grid item style={{ flex: "1" }}>
                <Typography
                  variant="body1"
                  style={{ marginBottom: "0px", marginTop: 5 }}
                >
                  {newAppname}
                </Typography>
              </Grid>
              <div style={{ display: "flex", flex: "1", marginTop: 5 }}>
                <Grid
                  item
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    overflow: "hidden",
                    maxHeight: 43,
                    overflow: "hidden",
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    {description}
                  </Typography>
                </Grid>
              </div>
              <Grid
                item
                style={{ flex: 1, justifyContent: "center", marginTop: 8 }}
              >
                {data.tags === null || data.tags === undefined
                  ? null
                  : data.tags.map((tag, index) => {
                      if (index >= 3) {
                        return null;
                      }

                      return (
                        <Chip
                          key={index}
                          style={chipStyle}
                          label={tag}
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            //console.log("SEARCH: ", event.target.value)
                            handleSearchChange(tag);
                            setCursearch(tag);
                            //id="app_search_field"
                            const searchfield =
                              document.getElementById("app_search_field");
                            if (
                              searchfield !== null &&
                              searchfield !== undefined
                            ) {
                              console.log("SEARCHFIELD: ", searchfield);
                              searchfield.value = tag;
                            }
                          }}
                        />
                      );
                    })}
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {data.activated &&
        data.private_id !== undefined &&
        data.private_id.length > 0 &&
        data.generated ? (
          <Grid
            container
            style={{ margin: "10px 10px 10px 10px", flex: "1" }}
            onClick={() => {
              downloadApp(data);
            }}
          >
            <Tooltip
              title={"Download OpenAPI"}
              style={{ marginTop: "28px", width: "100%" }}
              aria-label={data.name}
            >
              <CloudDownloadIcon />
            </Tooltip>
          </Grid>
        ) : null}
      </Paper>
    );
  };

  const dividerColor = "rgb(225, 228, 232)";
  const uploadViewPaperStyle = {
    minWidth: viewWidth,
    maxWidth: viewWidth,
    color: "white",
    borderRadius: theme.palette?.borderRadius,
    backgroundColor: surfaceColor,
    //display: "flex",
    marginBottom: 10,
    overflow: "hidden",
  };

  const UploadView = () => {
    //var imageline = selectedApp.large_image === undefined || selectedApp.large_image.length === 0 ?
    //	<img alt="" style={{width: "80px"}} />
    //	:
    //	<img alt="PICTURE" src={selectedApp.large_image} style={{width: "80px", height: "80px"}} />
    // FIXME - add label to apps, as this might be slow with A LOT of apps
    var newAppname = selectedApp.name;
    if (newAppname !== undefined && newAppname.length > 0) {
      newAppname = newAppname.replaceAll("_", " ");
      newAppname = newAppname.charAt(0).toUpperCase() + newAppname.substring(1);
    } else {
      newAppname = "";
    }

    var description = selectedApp.description;

    const editUrl = "/apps/edit/" + selectedApp.id;
    const activateUrl = "/apps/new?id=" + selectedApp.id;

    var downloadButton =
      selectedApp.activated &&
      selectedApp.private_id !== undefined &&
      selectedApp.private_id.length > 0 &&
      selectedApp.generated ? (
        <Tooltip title={"Download OpenAPI"}>
          <Button
            onClick={() => {
              downloadApp(selectedApp);
            }}
            variant="outlined"
            component="label"
            color="primary"
            style={{ marginTop: 10, marginRight: 8 }}
          >
            <CloudDownloadIcon />
          </Button>
        </Tooltip>
      ) : null;

		// Should always reference the original ID.
		//if (selectedApp.name !== undefined && selectedApp.name !== null && selectedApp.name.includes("New")) {
		//}
    
		var editButton =
      selectedApp.activated &&
      selectedApp.private_id !== undefined &&
      selectedApp.private_id.length > 0 &&
      selectedApp.generated ? (
        <Link to={editUrl} style={{ textDecoration: "none" }}>
          <Tooltip title={"Edit OpenAPI app"}>
            <Button
              variant="contained"
              component="label"
              color="primary"
              style={{ marginTop: 10, marginRight: 10 }}
            >
              <EditIcon />
            </Button>
          </Tooltip>
        </Link>
      ) : null;

    //var editNewButton = editButton === null ?
    var editNewButton = selectedApp.generated && selectedApp.activated && props.userdata.id !== selectedApp.owner && isCloud ? 
					<Link to={activateUrl} style={{ textDecoration: "none" }}>
						<Tooltip title={"Fork and Edit this public app to your liking"}>
							<Button
								variant="contained"
								component="label"
								color="primary"
								style={{ marginTop: 10, marginRight: 10 }}
							>
								<ForkRightIcon />
							</Button>
						</Tooltip>
					</Link>
			: null

    const activateButton = 
      selectedApp.generated && !selectedApp.activated ? (
        <div>
          <Link to={activateUrl} style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              component="label"
              color="primary"
              style={{ marginTop: 10 }}
            >
              Activate App
            </Button>
          </Link>
          <Tooltip title={"Delete app (confirm box will show)"}>
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={{ marginLeft: 5, marginTop: 10 }}
              onClick={() => {
                setDeleteModalOpen(true);
              }}
		  	  disabled={sharingConfiguration === undefined || sharingConfiguration === null || sharingConfiguration == "public"}
            >
              <DeleteIcon />
            </Button>
          </Tooltip>
        </div>
      ) : null;

    const deleteButton =
      ((selectedApp.private_id !== undefined &&
        selectedApp.private_id.length > 0 &&
        selectedApp.generated) ||
        (selectedApp.downloaded !== undefined && selectedApp.downloaded == true) ||
        !selectedApp.generated) &&
      activateButton === null ? (
        <Tooltip title={"Delete app (confirm box will show)"}>
          <Button
            variant="outlined"
            component="label"
            color="primary"
            style={{ marginLeft: 5, marginTop: 10 }}
            onClick={() => {
              setDeleteModalOpen(true);
            }}
		    disabled={sharingConfiguration === undefined || sharingConfiguration === null || sharingConfiguration == "public"}
          >
            <DeleteIcon />
          </Button>
        </Tooltip>
      ) : null;

    var imageline =
      selectedApp.large_image === undefined ||
      selectedApp.large_image.length === 0 ? (
        <img
          alt={selectedApp.title}
          style={{
            borderRadius: borderRadius,
            width: 100,
            height: 100,
            backgroundColor: theme.palette.inputColor,
          }}
        />
      ) : (
        <img
          alt={selectedApp.title}
          src={selectedApp.large_image}
          style={{
            borderRadius: borderRadius,
            maxWidth: 100,
            height: "auto",
            backgroundColor: theme.palette.inputColor,
          }}
        />
      );

    const GetAppExample = () => {
      if (selectedAction.returns === undefined) {
        return null;
      }

      var showResult = selectedAction.returns.example;
      if (
        showResult === undefined ||
        showResult === null ||
        showResult.length === 0
      ) {
        return null;
      }

      var jsonvalid = true;
      try {
        const tmp = String(JSON.parse(showResult));
        if (!tmp.includes("{") && !tmp.includes("[")) {
          jsonvalid = false;
        }
      } catch (e) {
        jsonvalid = false;
      }

      // FIXME: In here -> parse the values into a list or something
      if (jsonvalid) {
        const paths = GetParsedPaths(JSON.parse(showResult), "");
        console.log("PATHS: ", paths);

        return (
          <div>
            {paths.map((data, index) => {
              const circleSize = 10;
              return (
                <MenuItem
                  key={index}
                  style={{ backgroundColor: inputColor, color: "white" }}
                  value={data}
                  onClick={() => console.log(data.autocomplete)}
                >
                  {data.name}
                </MenuItem>
              );
            })}
          </div>
        );
      }

      return (
        <div style={{ marginTop: 10 }}>
          <b>Example return</b>
          <div />
          {selectedAction.returns.example}
        </div>
      );
    };

    const userRoles = ["you", "public"];

	// Admin in org or creator of app
	// FIXME: Missing check for if same creator account
	const canEditApp = userdata !== undefined && (userdata.admin === "true" || userdata.id === selectedApp.owner || selectedApp.owner === "" || (userdata.admin === "true" && userdata.active_org.id === selectedApp.reference_org)) || !selectedApp.generated 

    //fetch(globalUrl+"/api/v1/get_openapi/"+urlParams.get("id"),
    var baseInfo =
      newAppname.length > 0 ? (
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                marginRight: 15,
                marginTop: 10,
                backgroundColor: theme.palette.surfaceColor,
              }}
            >
              {imageline}
            </div>
            <div style={{ maxWidth: "85%", overflow: "hidden" }}>
              <Typography variant="h6" style={{ marginBottom: 0 }}>
                {newAppname}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Version {selectedApp.app_version}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{
                  marginTop: 5,
                  marginBottom: 0,
                  maxHeight: 150,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {description}
              </Typography>
            </div>
          </div>
          {selectedApp.versions !== null &&
          selectedApp.versions !== undefined &&
          selectedApp.versions.length > 1 ? (
            <Select
              defaultValue={selectedApp.app_version}
              onChange={(event) => {
                console.log("Changing version to index " + event.target.value);
                const newversion = selectedApp.versions.find(
                  (tmpApp) => tmpApp.version == event.target.value
                );
                console.log("New version: ", newversion);
                selectedApp.app_version = selectedApp.app_version;
                setSelectedApp(selectedApp);
				setSharingConfiguration(selectedApp.sharing === true ? "public" : "you")

                if (newversion !== undefined && newversion !== null) {
                  getApp(newversion.id, true);
                }
              }}
              style={{
                position: "absolute",
                top: -10,
                right: isCloud ? 50 : 0,
                backgroundColor: theme.palette.surfaceColor,
                backgroundColor: inputColor,
                color: "white",
                height: 35,
                marginleft: 10,
              }}
              SelectDisplayProps={{
                style: {
                  marginLeft: 10,
                },
              }}
            >
              {selectedApp.versions.map((data, index) => {
                return (
                  <MenuItem
                    key={data.version}
                    style={{ backgroundColor: inputColor, color: "white" }}
                    value={data.version}
                  >
                    {data.version}
                  </MenuItem>
                );
              })}
            </Select>
          ) : null}
          {isCloud ? (
            <a
              rel="noopener noreferrer"
              href={"https://shuffler.io/apps/" + selectedApp.id}
              style={{ textDecoration: "none", color: "#f85a3e" }}
              target="_blank"
            >
              <IconButton
                style={{
                  top: -10,
                  right: 0,
                  position: "absolute",
                  color: "#f85a3e",
                }}
              >
                <OpenInNewIcon style={{}} />
              </IconButton>
            </a>
          ) : null}

          {activateButton}

		  { /* editNewButton === null && */ }

          {canEditApp ? (
            <div>
              {editButton}
              {downloadButton}
              {deleteButton}
            </div>
          ) : 
						<div>
        			{editNewButton}
						</div>
					}

		{canEditApp 
			? (
            <div style={{ marginTop: 15, display: "flex", }}>
              {/*<p><b>ID:</b> {selectedApp.id}</p>*/}
              
              <b style={{ marginRight: 15 }}>Sharing </b>
              <Select
                value={sharingConfiguration}
                onChange={(event) => {

                  setSharingConfiguration(event.target.value);

                  if (event.target.value === "you") {
                  	toast("Changing sharing to " + event.target.value);
                    updateAppField(selectedApp.id, "sharing", false);
                  } else if (
                    event.target.value === "everyone" ||
                    event.target.value === "public"
                  ) {

					if (!isCloud) {
  						setPublishModalOpen(true)
					} else {
                    	updateAppField(selectedApp.id, "sharing", true);
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
                  backgroundColor: inputColor,
                  color: "white",
                  height: 35,
                  marginleft: 10,
                }}
                SelectDisplayProps={{
                  style: {
                    marginLeft: 10,
                  },
                }}
              >
                {userRoles.map((data) => {
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

		    {/*isCloud && (selectedApp.sharing === true || selectedApp.public === true || creatorProfile.github_avatar !== undefined) && !internalIds.includes(selectedApp.name.toLowerCase()) */} 

		    {isCloud && !internalIds.includes(selectedApp.name.toLowerCase()) ? 
				<Tooltip title="Deactivates this app for the current organisation. This means the app will not be usable again until you re-activate it." placement="top">
            		<Button
            		  variant={selectedApp.reference_org === userdata.active_org.id ? "outlined" : "contained"}
            		  component="label"
            		  color="primary"
            		  onClick={() => {
						if (selectedApp.reference_org === userdata.active_org.id) {
							toast.info("Can't deactivate apps made in this org. Please contact support if you want to deactivate this app.")
							return
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
            		          objectIDs: [selectedApp.id],
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

            		    activateApp(selectedApp.id, true, true)
            		  }}
            		  style={{ height: 35, marginTop: 0, marginLeft: 10, }}
            		>
					  Deactivate 
            		</Button>
				</Tooltip>
				: null}
            </div>
          ) : null}

		  <div style={{display: "flex", }}>
		  	{isCloud && Object.getOwnPropertyNames(creatorProfile).length !== 0 && creatorProfile.github_avatar !== undefined && creatorProfile.github_avatar !== null ? 
          	      <div style={{ display: "flex", marginTop: 15,  }}>
          	        <IconButton
          	          color="primary"
          	          style={{ padding: 0, marginRight: 10 }}
          	          aria-controls="simple-menu"
          	          aria-haspopup="true"
          	          onClick={(event) => {
          	            //setAnchorElAvatar(event.currentTarget);
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
		  	  	  </Typography>
		  	      </div>
		  	: null}
          	{selectedApp.tags !== undefined && selectedApp.tags !== null ? (
          	  <div
          	    style={{
          	      marginLeft: 20,
				  marginTop: 15, 
          	    }}
          	  >
          	    {selectedApp.tags.map((tag, index) => {
          	      if (index >= 3) {
          	        return null;
          	      }

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
          	) : null}
		  </div>
          {/*<p><b>Owner:</b> {selectedApp.owner}</p>*/}
          {selectedApp.privateId !== undefined &&
          selectedApp.privateId.length > 0 ? (
            <p>
              <b>PrivateID:</b> {selectedApp.privateId}
            </p>
          ) : null}
          <Divider
            style={{
              marginBottom: 10,
              marginTop: 10,
              backgroundColor: dividerColor,
            }}
          />
          <div style={{ paddingTop: 20, paddingBottom: 20 }}>
            {selectedApp.link.length > 0 ? (
              <p>
                <b>URL:</b> {selectedApp.link}
              </p>
            ) : null}
            <div style={{ marginTop: 15, marginBottom: 15 }}>
              <b>Actions</b>
              {selectedApp.actions !== null &&
              selectedApp.actions.length > 0 ? (
                <Select
                  fullWidth
                  value={selectedAction}
                  onChange={(event) => {
                    setSelectedAction(event.target.value);
                  }}
                  style={{
                    backgroundColor: inputColor,
                    color: "white",
                    height: "50px",
                  }}
                  SelectDisplayProps={{
                    style: {
                      marginLeft: 10,
                    },
                  }}
                >
                  {selectedApp.actions.map((data) => {
                    var newActionname =
                      data.label !== undefined && data.label.length > 0
                        ? data.label
                        : data.name;
                    newActionname = newActionname.replaceAll("_", " ");
                    newActionname =
                      newActionname.charAt(0).toUpperCase() +
                      newActionname.substring(1);
                    return (
                      <MenuItem
                        key={data.name}
                        style={{ backgroundColor: inputColor, color: "white" }}
                        value={data}
                      >
                        {newActionname}
                      </MenuItem>
                    );
                  })}
                </Select>
              ) : (
                <div style={{ marginTop: 10 }}>
                  There are no actions defined for this app.
                </div>
              )}
            </div>

            {selectedAction.parameters !== undefined &&
            selectedAction.parameters !== null ? (
              <div style={{ marginTop: 15, marginBottom: 15 }}>
                <b>Parameters</b>
                {selectedAction.parameters.map((data) => {
                  var itemColor = "#f85a3e";
                  if (!data.required) {
                    itemColor = "#ffeb3b";
                  }

                  const circleSize = 10;
                  return (
                    <MenuItem
                      key={data.name}
                      style={{ backgroundColor: inputColor, color: "white" }}
                      value={data}
                    >
                      {data.configuration === true ? (
                        <Tooltip
                          color="primary"
                          title={`Authenticate ${selectedApp.name}`}
                          placement="top"
                        >
                          <LockOpenIcon
                            style={{
                              cursor: "pointer",
                              width: 24,
                              height: 24,
                              marginRight: 10,
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <div
                          style={{
                            width: 17,
                            height: 17,
                            borderRadius: 17 / 2,
                            backgroundColor: itemColor,
                            marginRight: 10,
                            marginTop: 2,
                            marginTop: "auto",
                            marginBottom: "auto",
                          }}
                        />
                      )}
                      {data.name}
                    </MenuItem>
                  );
                })}
              </div>
            ) : null}
            {selectedAction.description !== undefined &&
            selectedAction.description !== null &&
            selectedAction.description.length > 0 ? (
              <div>
                <b>Action Description</b>
                <div />
                {selectedAction.description}
              </div>
            ) : null}
            <GetAppExample />
          </div>
        </div>
      ) : null;

	const AppCreateButton = (props) => {
		const { text, func, icon } = props;

		const [hover, setHover] = React.useState(false);

		const makeFancy = text?.includes("Generate") 

		var parsedStyle = {
			flex: 1, 
			padding: 15, 
			margin: 10, 
			paddingTop: 25,
			backgroundColor: hover ? theme.palette.surfaceColor : "transparent",
			cursor: hover ? "pointer" : "default",
			textAlign: "center",
			minHeight: 150, 
			maxHeight: 150, 

			borderRadius: theme.palette?.borderRadius,
		}

		if (!makeFancy) { 
			parsedStyle.border = hover ? "1px solid #f85a3e" : "1px solid rgba(255,255,255,0.3)"
		} else {
    		parsedStyle.border = "1px solid transparent"
    		parsedStyle.borderImage = "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) 1"
			parsedStyle.borderRadius = 0 // This doesn't work. Try to hover with a high one, and it's weird due to borderImage
		}

		return (
			<Paper 
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				onClick={func}
				style={parsedStyle}
			>
				{icon} 
				<Typography>
					{text}
				</Typography>
			</Paper>
		)
	}

    return (
      <div style={{}}>
        <Paper square style={uploadViewPaperStyle}>
          <div style={{ margin: 25 }}>
            <h2 style={{
				textAlign: "center",
			}}>
				App Creator
			</h2>
			<div style={{display: "flex"}}>
				<AppCreateButton 
					text="Upload OpenAPI or Swagger"
					func={() => {
                  		setOpenApiModal(true)
					}}
					icon={<PublishIcon style={{minHeight: 50, maxHeigth: 50, }} />}
				/>
				<AppCreateButton 
					text="Generate from Documentation"
					func={() => {
  						setGenerateAppModal(true)
					}}
					icon={<AutoFixHighIcon style={{minHeight: 50, maxHeigth: 50, }} />}
				/>
			</div>
		    <Link
		      to="/apps/new"
		      style={{
		        marginLeft: 5,
		        textDecoration: "none",
		        color: "#f85a3e",
		      }}
		    >
		      <Button
		        variant="outlined"
		        component="label"
		        color="secondary"
		        style={{}}
				fullWidth
		      >
		        Create from scratch
		      </Button>
		    </Link>
			{/*
            <a
              rel="noopener noreferrer"
              href="https://shuffler.io/docs/apps"
              style={{ textDecoration: "none", color: "#f85a3e" }}
              target="_blank"
            >
              How it works
            </a>
            &nbsp;-{" "}
            <a
              rel="noopener noreferrer"
              href="https://github.com/frikky/security-openapis"
              style={{ textDecoration: "none", color: "#f85a3e" }}
              target="_blank"
            >
              Security API's
            </a>
            &nbsp;-{" "}
            <a
              rel="noopener noreferrer"
              href="https://github.com/APIs-guru/openapi-directory/tree/main/APIs"
              style={{ textDecoration: "none", color: "#f85a3e" }}
              target="_blank"
            >
              OpenAPI directory
            </a>
            &nbsp;-{" "}
            <a
              rel="noopener noreferrer"
              href="https://editor.swagger.io/"
              style={{ textDecoration: "none", color: "#f85a3e" }}
              target="_blank"
            >
              OpenAPI Validator
            </a>
            <div />
            <Typography variant="body2" color="textSecondary">
              Apps interact with eachother in workflows. They are created with
              the app creator, using OpenAPI specification or manually in
              python. The links above are references to OpenAPI tools and other
              app repositories. There's thousands of them.
            </Typography>
            <div />
            <Divider
              style={{
                height: 1,
                backgroundColor: dividerColor,
                marginTop: 20,
                marginBottom: 20,
              }}
            />
            <div style={{}}>
              <Button
                variant="contained"
                component="label"
                color="primary"
                style={{ marginRight: 10 }}
                onClick={() => {
                  setOpenApiModal(true);
                }}
              >
                <PublishIcon style={{ marginRight: 5 }} /> Create from OpenAPI
              </Button>
              &nbsp;OR&nbsp;
              <Link
                to="/apps/new"
                style={{
                  marginLeft: 5,
                  textDecoration: "none",
                  color: "#f85a3e",
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  color="primary"
                  style={{}}
                >
                  Create from scratch
                </Button>
              </Link>
            </div>
		    */}
          </div>
        </Paper>
        <Paper square style={uploadViewPaperStyle}>
          <div style={{ margin: 25 }}>{baseInfo}</div>
        </Paper>
      </div>
    );
  };

  const handleSearchChange = (search) => {
    if (apps === undefined || apps === null || apps.length === 0) {
      return;
    }

    const searchfield = search.toLowerCase();
    var newapps = apps.filter(
      (data) =>
        data.name.toLowerCase().includes(searchfield) ||
        data.description.toLowerCase().includes(searchfield) ||
        (data.tags !== null && data.tags.includes(search))
    );
    var tmpapps = searchableApps.filter(
      (data) =>
        data.name.toLowerCase().includes(searchfield) ||
        data.description.toLowerCase().includes(searchfield) ||
        (data.tags !== null && data.tags.includes(search))
    );
    newapps.push(...tmpapps);

    //console.log(newapps)
    setFilteredApps(newapps);
    //if ((newapps.length === 0 || searchBackend) && !appSearchLoading) {

    //	//setAppSearchLoading(true)
    //	//runAppSearch(searchfield)
    //} else {
    //}
  };

  const uploadFileDocumentation = (e) => {
    const isDropzone = e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;

    const reader = new FileReader();

    try {
      reader.addEventListener("load", (e) => {
        const content = e.target.result;
        setOpenApiData(content);
        setIsDropzone(isDropzone);
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
  };

  const uploadFile = (e) => {
    const isDropzone =
      e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;

    const reader = new FileReader();

    try {
      reader.addEventListener("load", (e) => {
        const content = e.target.result;
        setOpenApiData(content);
        setIsDropzone(isDropzone);
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
  };

  useEffect(() => {
    if (openApiData.length > 0) {
      setOpenApiError("");
      validateOpenApi(openApiData);
    }
  }, [openApiData]);

  useEffect(() => {
    if (appValidation && isDropzone) {
      redirectOpenApi();
      setIsDropzone(false);
    }
  }, [appValidation, isDropzone]);

	var appDelay = -75 

	const leftBarSize = viewWidth 
	const SearchBox = ({ currentRefinement, refine, isSearchStalled, }) => {

      useEffect(() => {
        if (document !== undefined) {
          const appsearchValue = document.getElementById("app_search_field")
          if (appsearchValue !== undefined && appsearchValue !== null) {
            console.log("Value2: ", appsearchValue.value)
            if (appsearchValue.value !== undefined && appsearchValue.value !== null && appsearchValue.value.length > 0) {
              refine(appsearchValue.value)
            }
          }
          //}
        }
      }, [])

      return (
        <form id="search_form" noValidate type="searchbox" action="" role="search" style={{ margin: 0, display: "none", }} onClick={() => {
        }}>
          <TextField
            fullWidth
            style={{ backgroundColor: theme.palette.inputColor, borderRadius: theme.palette?.borderRadius, maxWidth: leftBarSize - 20, }}
            InputProps={{
              style: {
                color: "white",
                fontSize: "1em",
                height: 50,
                margin: 0,
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
            onClick={(event) => {
              console.log("Click!")
            }}
            onBlur={(event) => {
              //setSearchOpen(false)
            }}
            onChange={(event) => {
              //if (event.currentTarget.value.length > 0 && !searchOpen) {
              //	setSearchOpen(true)
              //}

              refine(event.currentTarget.value)
            }}
          />
          {/*isSearchStalled ? 'My search is stalled' : ''*/}
        </form>
      )
    }

	const activateApp = (appid, refresh, deactivate) => {
		const appExists = userdata.active_apps !== undefined && userdata.active_apps !== null && userdata.active_apps.includes(appid)
		const url = deactivate === true ? 
			`${globalUrl}/api/v1/apps/${appid}/deactivate`
			:
			appExists ? `${globalUrl}/api/v1/apps/${appid}/deactivate` : `${globalUrl}/api/v1/apps/${appid}/activate`

		fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Failed to deactivate")
				}

				return response.json()
			})
			.then((responseJson) => {
				if (responseJson.success === false) {
        	if (responseJson.reason !== undefined) {
            toast("Failed to activate the app: "+responseJson.reason);
          } else {
            toast("Failed to activate the app");
          }
				} else {
					//toast("App activated for your organization! Refresh the page to use the app.")
				    if (appExists) {
				        toast("App deactivated for your organization! Existing workflows with the app will continue to work.")
				    } else {
				        toast("App activation changed for your organization!")
				    }

					if (refresh === true) {
						getApps()
					}
				}
			})
			.catch(error => {
				//toast(error.toString())
				console.log("Deactivate app error: ", error.toString())
			});
		}


		const AppHits = ({ hits }) => {
      const [mouseHoverIndex, setMouseHoverIndex] = React.useState(0)

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

                return (
                  <div style={{ textDecoration: "none", color: "white", }} onClick={(event) => {
                    //if (!isCloud) {
                    //	toast("Since this is an on-prem instance. You will need to activate the app yourself. Opening link to download it in a new window.")
                    //	setTimeout(() => {
                    //		event.preventDefault()
                    //		window.open(parsedUrl, '_blank')
                    //	}, 2000)
                    //} else {
                    toast(`Activating ${name}`)
                    //}

                    console.log("CLICK: ", hit)

                    const queryID = hit.__queryID
                    console.log("QUERY: ", queryID)

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
                    }

                    activateApp(hit.objectID, true)
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
                )
              })
            }
          </List>
        </div>
      )
    }


	const CustomSearchBox = connectSearchBox(SearchBox)
	const CustomAppHits = connectHits(AppHits)
              
  const appView = isLoggedIn ? (
    <Dropzone
      style={{ width: viewWidth * 2 + 20, margin: "auto", padding: 20 }}
      onDrop={uploadFile}
    >
      <div style={appViewStyle}>
        <div style={{ flex: 1, maxWidth: viewWidth, marginRight: 10 }}>
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            style={{ color: "white" }}
          >
            <Link
              to="/apps"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="h6"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <AppsIcon style={{ marginRight: 10 }} />
                App upload
              </Typography>
            </Link>
            {selectedApp.activated &&
            selectedApp.private_id !== undefined &&
            selectedApp.private_id.length > 0 &&
            selectedApp.generated ? (
              <Link
                to={`/apps/edit/${selectedApp.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Typography variant="h6">{FixName(selectedApp.name)}</Typography>
              </Link>
            ) : null}
          </Breadcrumbs>
          <div style={{ marginTop: 15 }} />
          <UploadView />
        </div>
        <div style={{ flex: 1, marginLeft: 10, maxWidth: viewWidth }}>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, marginBottom: 15 }}>
              <Typography variant="h6">
                Activated apps ({apps.length + searchableApps.length})
              </Typography>
            </div>
            {isCloud ? null : (
              <span>
                {userdata === undefined || userdata === null || isLoading ? null : (
                  <Tooltip
                    title={"Reload apps locally"}
                    style={{ marginTop: "28px", width: "100%" }}
                    aria-label={"Upload"}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      color="primary"
                      style={{ margin: 5, maxHeight: 50, marginTop: 10 }}
                      disabled={isLoading}
                      onClick={() => {
                        hotloadApps();
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={25} />
                      ) : (
                        <CachedIcon />
                      )}
                    </Button>
                  </Tooltip>
                )}

                {userdata === undefined || userdata === null || userdata.admin === "false" ? null : 
									<Tooltip
										title={"Download from Github"}
										style={{ marginTop: "28px", width: "100%" }}
										aria-label={"Upload"}
									>
										<Button
											variant="outlined"
											component="label"
											color="primary"
											style={{ margin: 5, maxHeight: 50, marginTop: 10 }}
											disabled={isLoading}
											onClick={() => {
												setOpenApi(baseRepository);
												setLoadAppsModalOpen(true);
											}}
										>
											{isLoading ? (
												<CircularProgress size={25} />
											) : (
												<CloudDownloadIcon />
											)}
										</Button>
									</Tooltip>
								}
              </span>
            )}
          </div>
          <div style={{ height: 50 }}>
            <TextField
              style={{ backgroundColor: inputColor, borderRadius: theme.palette?.borderRadius, }}
              InputProps={{
                style: {
                },
              }}
              disabled={
                apps === undefined || apps === null || apps.length === 0
              }
              fullWidth
              color="primary"
              id="app_search_field"
              placeholder={"Search your apps"}
              onChange={(event) => {
                handleSearchChange(event.target.value);
                setCursearch(event.target.value);
              }}
            />
          </div>
          <div style={{ marginTop: 15 }}>
            {apps.length > 0 ? (
              filteredApps.length > 0 ? (
                <div style={{ height: "75vh", overflowY: "auto" }}>
                  {filteredApps.map((app, index) => {
					if (firstLoad) {
						appDelay += 75
					} else {
						//return returnData 
                    	return <AppPaper app={app} />
					}

                    return (
						<Zoom key={index} in={true} style={{ transitionDelay: `${appDelay}ms` }}>
							<div>
								<AppPaper app={app} />
							</div>
						</Zoom>
					)
                  })}
                  {cursearch.length > 0
                    ? null
                    : searchableApps.map((app, index) => {
                        return (
							<AppPaper app={app} />
						)
                      })}
                </div>
              ) : (
                <Paper square style={{
    							minWidth: viewWidth,
    							maxWidth: viewWidth,
    							color: "white",
    							borderRadius: theme.palette?.borderRadius,
    							//display: "flex",
    							marginBottom: 10,
    							overflow: "hidden",
									backgroundColor: theme.palette.platformColor,
									border: null,
								}}>
                  {appSearchLoading ? (
                    <CircularProgress
                      color="primary"
                      style={{ margin: "auto" }}
                    />
                  ) : null}

            			<div
            			  style={{ textAlign: "center", width: leftBarSize, marginTop: 10 }}
            			  onLoad={() => {
            			    console.log("Should load in extra apps?")
            			  }}
            			>
            			  <Typography variant="body1" color="textSecondary">
            			    Couldn't find the app you're looking for? Searching unactivated apps. Click one of the below apps to Activate it for your organization.
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
                </Paper>
              )
            ) : isLoading ? (
              <CircularProgress
                style={{ width: 40, height: 40, margin: "auto" }}
              />
            ) : (
              <Paper square style={uploadViewPaperStyle}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ margin: 10 }}
                >
                  No apps have been created, uploaded or downloaded yet. Click
                  "Load existing apps" above to get the baseline. This may take
                  a while as its building docker images.
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ margin: 10 }}
                >
                  If you're still not able to see any apps, please follow our{" "}
                  <a
                    href={
                      "https://shuffler.io/docs/troubleshooting#load_all_apps_locally"
                    }
                    style={{ textDecoration: "none", color: "#f85a3e" }}
                    target="_blank"
                  >
                    troubleshooting guide for loading apps!
                  </a>
                </Typography>
              </Paper>
            )}
          </div>
        </div>
      </div>
    </Dropzone>
  ) : null;

  // Load data e.g. from github
  const getSpecificApps = (url, forceUpdate) => {
    setValidation(true);

    setIsLoading(true);
    //start()

    const parsedData = {
      url: url,
      branch: downloadBranch || "master",
    };

    if (field1.length > 0) {
      parsedData["field_1"] = field1;
    }

    if (field2.length > 0) {
      parsedData["field_2"] = field2;
    }

    parsedData["force_update"] = forceUpdate;

    toast("Getting specific apps from your URL.");
    var cors = "cors";
    fetch(globalUrl + "/api/v1/apps/get_existing", {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify(parsedData),
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          toast("Loaded existing apps!");
        }

        //stop()
        setIsLoading(false);
        setValidation(false);
        return response.json();
      })
      .then((responseJson) => {
        console.log("DATA: ", responseJson);
        if (responseJson.reason !== undefined) {
          toast("Failed loading: " + responseJson.reason);
        }
      })
      .catch((error) => {
        console.log("ERROR: ", error.toString());
        //toast(error.toString());
        //stop()
        
				setIsLoading(false);
        setValidation(false);
      });
  };

  // Locally hotloads app from folder
  const hotloadApps = () => {
    toast("Hotloading apps from location in .env");
    setIsLoading(true);
    fetch(globalUrl + "/api/v1/apps/run_hotload", {
	  method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          //toast("Hotloaded apps!")
          getApps();
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          toast("Successfully finished hotload");
        } else {
          toast("Failed hotload: ", responseJson.reason);
          //(responseJson.reason !== undefined && responseJson.reason.length > 0) {
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  // Gets the URL itself (hopefully this works in most cases?
  // Will then forward the data to an internal endpoint to validate the api
  const validateUrl = () => {
    setValidation(true);

    var cors = "cors";
    if (openApi.includes("= localhost")) {
      cors = "no-cors";
    }

    fetch(openApi, {
      method: "GET",
      mode: "cors",
    })
      .then((response) => {
        response.text().then(function (text) {
          validateOpenApi(text);
        });
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const getApp = (appId, setApp) => {
    fetch(globalUrl + "/api/v1/apps/" + appId + "/config?openapi=false", {
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          //toast("Successfully GOT app "+appId)
        } else {
          toast("Failed getting app");
        }

        return response.json();
      })
      .then((responseJson) => {
        console.log(responseJson);

        if (setApp) {
          if (
            selectedApp.versions !== undefined &&
            selectedApp.versions !== null
          ) {
            responseJson.versions = selectedApp.versions;
          }

          if (
            selectedApp.loop_versions !== undefined &&
            selectedApp.loop_versions !== null
          ) {
            responseJson.loop_versions = selectedApp.loop_versions;
          }

          //toast("Should set app to selected")
          if (
            responseJson.actions !== undefined &&
            responseJson.actions !== null &&
            responseJson.actions.length > 0
          ) {
            setSelectedAction(responseJson.actions[0]);
          } else {
            setSelectedAction({})
          }

          setSelectedApp(responseJson);
		  setSharingConfiguration(responseJson.sharing === true ? "public" : "you")
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const deleteApp = (appId) => {
    toast("Attempting to delete app");
    fetch(globalUrl + "/api/v1/apps/" + appId, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          toast("Successfully deleted app");
          setTimeout(() => {
            getApps();
          }, 1000);
        } else {
          toast("Failed deleting app. Does it still exist?");
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

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

  const runAppSearch = (searchterm) => {
    const data = { search: searchterm };

    fetch(globalUrl + "/api/v1/apps/search", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        setAppSearchLoading(false);
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success) {
          if (
            responseJson.reason !== undefined &&
            responseJson.reason.length > 0
          ) {
            setSearchableApps(responseJson.reason);
            //setFilteredApps(responseJson.reason)
          }
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const validateDocumentationUrl  = () => {
    setValidation(true);

	// curl https://doc-to-openapi-stbuwivzoq-nw.a.run.app/doc_to_openapi -d '{"url": "https://gitlab.com/rhab/PyOTRS/-/raw/main/pyotrs/lib.py?ref_type=heads"}' -H "Content-Type: application/json"
	const urldata = {
		"url": openApi,
	}

    //fetch("http://localhost:8080/doc_to_openapi", {
    //fetch("https://doc-to-openapi-stbuwivzoq-nw.a.run.app/doc_to_openapi", {
    fetch("https://doc-to-openapi-stbuwivzoq-nw.a.run.app/api/v1/doc_to_openapi", {
      method: "POST",
      headers: {
        "Accept": "application/json",
		"Content-Type": "application/json",
      },
      body: JSON.stringify(urldata),
    })
    .then((response) => {
      setValidation(false);
      if (response.status !== 200) {
	    toast("Error in generation: "+response.status);
	    setOpenApiError("Error in generation - bad status: "+response.status);
		return response.text();
      }

      return response.json();
    })
    .then((responseJson) => {
		// Check if openapi or swagger in string of the json
		var parsedtext = responseJson
		try {
			parsedtext = JSON.stringify(responseJson);
			if (parsedtext.indexOf("openapi") === -1 && parsedtext.indexOf("swagger") === -1) {
				setValidation(false)
				setOpenApiError("Error in generation: "+parsedtext)

				return
			}
		} catch (e) {
			setValidation(false);
			setOpenApiError("Error in generation (2): "+e.toString());
			return;
		}

	    console.log("Validating response!");
	    validateOpenApi(parsedtext)
    })
    .catch((error) => {
      setValidation(false);
      toast(error.toString());
      setOpenApiError(error.toString());
    });
  }

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
  };

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
  };

  // Sends the data to backend, which should return a version 3 of the same API
  // If 200 - continue, otherwise, there's some issue somewhere
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

  const redirectOpenApi = () => {
	if (appValidation === undefined || appValidation === null || appValidation.length === 0) {
		return
	}

	toast.success("Successfully validated OpenAPI. Redirecting to app creation. Remember to save the app to be able to use it.", {
		// Disable autoclose
		autoClose: 10000,
	})
    navigate(`/apps/new?id=${appValidation}`)
  }

  const handleGithubValidation = (forceUpdate) => {
    getSpecificApps(openApi, forceUpdate);
    setLoadAppsModalOpen(false);
  };

  const publishModal = publishModalOpen ? (
    <Dialog
      open={publishModalOpen}
      onClose={() => {
        setPublishModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.surfaceColor,
          color: "white",
          minWidth: 500,
          padding: 50,
        },
      }}
    >
      <DialogTitle style={{ marginBottom: 0 }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
          Are you sure you want to PUBLISH this app?
        </div>
      </DialogTitle>
      <DialogContent
        style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
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
          style={{}}
          onClick={() => {
			updateAppField(selectedApp.id, "sharing", true);
            setPublishModalOpen(false);
          }}
          color="primary"
        >
          Yes
        </Button>
        <Button
          style={{}}
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

  const deleteModal = deleteModalOpen ? (
    <Dialog
      open={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: 500,
        },
      }}
    >
      <DialogTitle>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
          Are you sure? <div />
          Some workflows may stop working.
        </div>
      </DialogTitle>
      <DialogContent
        style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
      >
        <Button
          style={{}}
          onClick={() => {
            deleteApp(selectedApp.id);
            setDeleteModalOpen(false);
          }}
          color="primary"
        >
          Yes
        </Button>
        <Button
          variant="outlined"
          style={{}}
          onClick={() => {
            setDeleteModalOpen(false);
          }}
          color="primary"
        >
          No
        </Button>
      </DialogContent>
    </Dialog>
  ) : null;

  const circularLoader = validation ? (
    <CircularProgress color="primary" />
  ) : null;

  const appsModalLoad = loadAppsModalOpen ? (
    <Dialog
      open={loadAppsModalOpen}
      onClose={() => {
        setOpenApi("");
        setLoadAppsModalOpen(false);
        setField1("");
        setField2("");
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
      <DialogTitle>
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          Load from github repo
        </div>
      </DialogTitle>
      <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
        Repository (supported: github, gitlab, bitbucket)
        <TextField
          style={{ backgroundColor: inputColor }}
          variant="outlined"
          margin="normal"
          defaultValue={"https://github.com/frikky/shuffle-apps"}
          InputProps={{
            style: {
              color: "white",
              height: "50px",
              fontSize: "1em",
            },
          }}
          onChange={(e) => setOpenApi(e.target.value)}
          placeholder="https://github.com/frikky/shuffle-apps"
          fullWidth
        />
        <span style={{ marginTop: 10 }}>
          Branch (default value is "master"):
        </span>
        <div style={{ display: "flex" }}>
          <TextField
            style={{ backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            defaultValue={downloadBranch}
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
            }}
            onChange={(e) => setDownloadBranch(e.target.value)}
            placeholder="master"
            fullWidth
          />
        </div>
        <span style={{ marginTop: 10 }}>
          Authentication (optional - private repos etc):
        </span>
        <div style={{ display: "flex" }}>
          <TextField
            style={{ flex: 1, backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
            }}
            onChange={(e) => setField1(e.target.value)}
            type="username"
            placeholder="Username / APIkey (optional)"
            fullWidth
          />
          <TextField
            style={{ flex: 1, backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
            }}
            onChange={(e) => setField2(e.target.value)}
            type="password"
            placeholder="Password (optional)"
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        {circularLoader}
        <Button
          style={{ borderRadius: "0px" }}
          onClick={() => setLoadAppsModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        {isCloud ? null : (
          <Button
            style={{ borderRadius: "0px" }}
            disabled={openApi.length === 0 || !openApi.includes("http")}
            onClick={() => {
              handleGithubValidation(true);
            }}
            color="primary"
          >
            Force update
          </Button>
        )}
        <Button
          variant="outlined"
          style={{ float: "left", borderRadius: "0px" }}
          disabled={openApi.length === 0 || !openApi.includes("http")}
          onClick={() => {
            handleGithubValidation(false);
          }}
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  const errorText = openApiError.length > 0 ? ( <div style={{ marginTop: 10 }}>Error: {openApiError}</div>) : null;

  const generateAppView = generateAppModal ? (
    <Dialog
      open={generateAppModal}
      onClose={() => {
        setGenerateAppModal(false);
        setOpenApiModal(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.platformColor,
		  borderRadius: theme.palette?.borderRadius,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
		  padding: 50, 
        },
      }}
    >
      <FormControl>
        <DialogTitle>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>
		  	Generate an app based on documentation (beta)
          </div>
        </DialogTitle>
        <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
		  <Typography variant="body1">
		  	Paste in a URL, and we will make it into an app for you. This may take multiple minutes based on the size of the documentation. <b>{isCloud ? "" : "Uses Shuffle Cloud (https://shuffler.io) for processing (for now)."}</b> 
		  </Typography>
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
                  disabled={openApi.length === 0 || appValidation.length > 0 || validation}
                  color="primary"
                  onClick={() => {
                    setOpenApiError("");
                    validateDocumentationUrl();
                  }}
                >
				  Generate
                </Button>
              ),
            }}
            onChange={(e) => {
              setOpenApi(e.target.value);
            }}
            helperText={
              <span style={{ color: "white", marginBottom: "2px" }}>
			  	Should be a documentation page containing an API.
              </span>
            }
            placeholder="API Documentation URL"
            fullWidth
          />
          {errorText}
        </DialogContent>
        <DialogActions>
          {circularLoader}
          <Button
            style={{ borderRadius: "0px" }}
            onClick={() => {
        	  setGenerateAppModal(false);
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
        </DialogActions>
	  </FormControl>
	</Dialog>
  ) : null
    

  const modalView = openApiModal ? (
    <Dialog
      open={openApiModal}
      onClose={() => {
        setOpenApiModal(false);
		setGenerateAppModal(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.platformColor,
		  borderRadius: theme.palette?.borderRadius,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
		  padding: 50, 
        },
      }}
    >
      <FormControl>
        <DialogTitle>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>
            Create a new app from OpenAPI / Swagger
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
          <p>Or upload a YAML or JSON specification</p>
          <input
            hidden
            type="file"
            ref={upload}
            accept="application/JSON,application/YAML,application/yaml,text/yaml,text/x-yaml,application/x-yaml,application/vnd.yaml,.yml,.yaml"
            multiple={false}
            onChange={uploadFile}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => upload.current.click()}
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
  ) : null;

  const loadedCheck = isLoaded && !firstrequest ? (
    <SidebarAdjustWrapper userdata={userdata}>
      <AppsWrapper
        userdata={userdata}
        appView={appView}
        modalView={modalView}
        publishModal={publishModal}
        generateAppView={generateAppView}
        appsModalLoad={appsModalLoad}
        deleteModal={deleteModal}
      />
    </SidebarAdjustWrapper>
  ) : (
    <div></div>
  );

  return loadedCheck;
};

export default Apps;


const AppsWrapper = memo(({ appView, modalView, userdata, publishModal, generateAppView, appsModalLoad, deleteModal }) => (
  <>
    {appView}
    {modalView}
    {publishModal}
    {generateAppView}
    {appsModalLoad}
    {deleteModal}
  </>
));


const SidebarAdjustWrapper = memo(({ userdata, children }) => {

  const {leftSideBarOpenByClick } = useContext(Context)
  const marginLeft = userdata?.support
    ? leftSideBarOpenByClick ? 250 : 80
    : 0;

  return (
    <div style={{ marginLeft, transition: 'margin-left 0.3s ease' }}>
      {children}
    </div>
  );
});
