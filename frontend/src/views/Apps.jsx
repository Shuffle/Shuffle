import React, { useEffect } from "react";

import { useInterval } from "react-powerhooks";

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
} from "@material-ui/core";

import {
  LockOpen as LockOpenIcon,
  OpenInNew as OpenInNewIcon,
  Apps as AppsIcon,
  Cached as CachedIcon,
  Publish as PublishIcon,
  CloudDownload as CloudDownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@material-ui/icons";

import { useTheme } from "@material-ui/core/styles";

import YAML from "yaml";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAlert } from "react-alert";
import Dropzone from "../components/Dropzone";

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
  const newAppname = (
    name.charAt(0).toUpperCase() + name.substring(1)
  ).replaceAll("_", " ");
  return newAppname;
};

// Parses JSON data into keys that can be used everywhere :)
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
      console.log("Handling direct loop.");
      parsedValues.push({
        type: "object",
        name: "Node",
        autocomplete: `${basekey.replaceAll(" ", "_")}`,
      });
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

const Apps = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata } = props;

  //const [workflows, setWorkflows] = React.useState([]);
  const theme = useTheme();
  const baseRepository = "https://github.com/frikky/shuffle-apps";
  const alert = useAlert();
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

  const [openApi, setOpenApi] = React.useState("");
  const [openApiData, setOpenApiData] = React.useState("");
  const [appValidation, setAppValidation] = React.useState("");
  const [loadAppsModalOpen, setLoadAppsModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [openApiModal, setOpenApiModal] = React.useState(false);
  const [openApiModalType, setOpenApiModalType] = React.useState("");
  const [openApiError, setOpenApiError] = React.useState("");
  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");
  const [cursearch, setCursearch] = React.useState("");
  const [sharingConfiguration, setSharingConfiguration] = React.useState("you");
  const [downloadBranch, setDownloadBranch] = React.useState("master");

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
    borderRadius: 5,
    color: "white",
    backgroundColor: surfaceColor,
    cursor: "pointer",
    display: "flex",
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
        //console.log("Apps: ", responseJson)
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
            setSelectedApp(privateapps[0]);
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

				//setTimeout(() => {
				//	setFirstLoad(false)
				//}, 5000)
      })
      .catch((error) => {
        alert.error(error.toString());
        setIsLoading(false);
      });
  };

  const downloadApp = (inputdata) => {
    const id = inputdata.id;

    alert.info("Downloading..");
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
          alert.error("Failed to download file");
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
        alert.error(error.toString());
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
			data.actions = []
		}

    if (data === undefined || data.actions === undefined || data.actions === null || data.actions.length === 0) {
      valid = "false";
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
            data.name = newAppname;
            setSelectedApp(data);

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
              setSharingConfiguration(isCloud ? "public" : "everyone");
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
    borderRadius: 5,
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

		// FIXME: Add /apps/new?id=<PUBLIC> to allow for changes of the original
		// Should always reference the original ID.
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
    var editNewButton = selectedApp.generated && selectedApp.activated && props.userdata.id !== selectedApp.owner ? 
				isCloud ? 
					<Link to={activateUrl} style={{ textDecoration: "none" }}>
						<Tooltip title={"Edit this public app to your liking"}>
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
				: null
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
          <Tooltip title={"Delete app"}>
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={{ marginLeft: 5, marginTop: 10 }}
              onClick={() => {
                setDeleteModalOpen(true);
              }}
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
        (selectedApp.downloaded !== undefined &&
          selectedApp.downloaded == true) ||
        !selectedApp.generated) &&
      activateButton === null ? (
        <Tooltip title={"Delete app"}>
          <Button
            variant="outlined"
            component="label"
            color="primary"
            style={{ marginLeft: 5, marginTop: 10 }}
            onClick={() => {
              setDeleteModalOpen(true);
            }}
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

    const userRoles = ["you", isCloud ? "public" : "everyone"];

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
        	{editNewButton}
          {(props.userdata !== undefined && 
            (props.userdata.role === "admin" ||
              props.userdata.id === selectedApp.owner ||
							selectedApp.owner === "" 
							)) || !selectedApp.generated ? (
            <div>
              {editButton}
              {downloadButton}
              {deleteButton}
            </div>
          ) : null}
          {selectedApp.tags !== undefined && selectedApp.tags !== null ? (
            <div
              style={{
                display: "inline-block",
                marginLeft: 15,
                float: "right",
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
          {props.userdata !== undefined &&
          props.userdata.id === selectedApp.owner ? (
            <div style={{ marginTop: 15 }}>
              {/*<p><b>ID:</b> {selectedApp.id}</p>*/}
              <b style={{ marginRight: 15 }}>Sharing </b>
              <Select
                value={sharingConfiguration}
                onChange={(event) => {
                  alert.info("Changing sharing to " + event.target.value);

                  setSharingConfiguration(event.target.value);

                  if (event.target.value === "you") {
                    updateAppField(selectedApp.id, "sharing", false);
                  } else if (
                    event.target.value === "everyone" ||
                    event.target.value === "public"
                  ) {
                    updateAppField(selectedApp.id, "sharing", true);
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
            </div>
          ) : null}
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

    return (
      <div style={{}}>
        <Paper square style={uploadViewPaperStyle}>
          <div style={{ margin: 25 }}>
            <h2>App Creator</h2>
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
      alert.error("Failed to read file");
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
                <Typography variant="h6">{selectedApp.name}</Typography>
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
                {isLoading ? null : (
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
              </span>
            )}
          </div>
          <div style={{ height: 50 }}>
            <TextField
              style={{ backgroundColor: inputColor, borderRadius: 5 }}
              InputProps={{
                style: {
                  color: "white",
                  minHeight: "50px",
                  marginLeft: "5px",
                  maxWidth: "95%",
                  fontSize: "1em",
                  borderRadius: 5,
                },
              }}
              disabled={
                apps === undefined || apps === null || apps.length === 0
              }
              fullWidth
              color="primary"
              id="app_search_field"
              placeholder={"Search apps"}
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
												<span>
													<AppPaper app={app} />
												</span>
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
                <Paper square style={uploadViewPaperStyle}>
                  <Typography style={{ margin: 10 }}>
                    <span>
                      <a
                        rel="noopener noreferrer"
                        href={"https://shuffler.io/search"}
                        style={{ textDecoration: "none", color: "#f85a3e" }}
                        target="_blank"
                      >
                        Click here
                      </a>{" "}
                      to search ALL apps, not just your activated ones.
                    </span>
                  </Typography>
                  <div />

                  {appSearchLoading ? (
                    <CircularProgress
                      color="primary"
                      style={{ margin: "auto" }}
                    />
                  ) : null}
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

    alert.success("Getting specific apps from your URL.");
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
          alert.success("Loaded existing apps!");
        }

        //stop()
        setIsLoading(false);
        setValidation(false);
        return response.json();
      })
      .then((responseJson) => {
        console.log("DATA: ", responseJson);
        if (responseJson.reason !== undefined) {
          alert.error("Failed loading: " + responseJson.reason);
        }
      })
      .catch((error) => {
        console.log("ERROR: ", error.toString());
        alert.error(error.toString());

        //stop()
        setIsLoading(false);
        setValidation(false);
      });
  };

  // Locally hotloads app from folder
  const hotloadApps = () => {
    alert.info("Hotloading apps from location in .env");
    setIsLoading(true);
    fetch(globalUrl + "/api/v1/apps/run_hotload", {
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          //alert.success("Hotloaded apps!")
          getApps();
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          alert.info("Successfully finished hotload");
        } else {
          alert.error("Failed hotload: ", responseJson.reason);
          //(responseJson.reason !== undefined && responseJson.reason.length > 0) {
        }
      })
      .catch((error) => {
        alert.error(error.toString());
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
        alert.error(error.toString());
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
          //alert.success("Successfully GOT app "+appId)
        } else {
          alert.error("Failed getting app");
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

          //alert.info("Should set app to selected")
          if (
            responseJson.actions !== undefined &&
            responseJson.actions !== null &&
            responseJson.actions.length > 0
          ) {
            setSelectedAction(responseJson.actions[0]);
          } else {
            setSelectedAction({});
          }
          setSelectedApp(responseJson);
        }
      })
      .catch((error) => {
        alert.error(error.toString());
      });
  };

  const deleteApp = (appId) => {
    alert.info("Attempting to delete app");
    fetch(globalUrl + "/api/v1/apps/" + appId, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          alert.success("Successfully deleted app");
          setTimeout(() => {
            getApps();
          }, 1000);
        } else {
          alert.error("Failed deleting app");
        }
      })
      .catch((error) => {
        alert.error(error.toString());
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
        //alert.info(responseJson)
        if (responseJson.success) {
          alert.success("Successfully updated app configuration");
        } else {
					if (responseJson.reason !== undefined && responseJson.reason !== null) {
          	alert.error("Error: "+responseJson.reason);
					} else {
          	alert.error("Error updating app configuration");
					}
        }
      })
      .catch((error) => {
        alert.error(error.toString());
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
        alert.error(error.toString());
      });
  };

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
        alert.error(error.toString());
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
          alert.error("An error occurred in the response");
        }
      })
      .catch((error) => {
        setValidation(false);
        alert.error(error.toString());
        setOpenApiError(error.toString());
      });
  };

  const redirectOpenApi = () => {
    navigate(`/apps/new?id=${appValidation}`)
  };

  const handleGithubValidation = (forceUpdate) => {
    getSpecificApps(openApi, forceUpdate);
    setLoadAppsModalOpen(false);
  };

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

  const errorText =
    openApiError.length > 0 ? (
      <div style={{ marginTop: 10 }}>Error: {openApiError}</div>
    ) : null;
  const modalView = openApiModal ? (
    <Dialog
      open={openApiModal}
      onClose={() => {
        setOpenApiModal(false);
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
            Create a new integration
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
            accept="application/JSON, application/YAML, text/yaml, text/x-yaml, application/x-yaml, application/vnd.yaml"
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

  const loadedCheck =
    isLoaded && !firstrequest ? (
      <div>
        {appView}
        {modalView}
        {appsModalLoad}
        {deleteModal}
      </div>
    ) : (
      <div></div>
    );

  // Maybe use gridview or something, idk
  return loadedCheck;
};

export default Apps;
