
import React, { memo, useCallback } from "react";
import { useState, useEffect, useContext, Suspense } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../context/ContextApi.jsx";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Collapse,
  ListItem,
  Typography,
  Tab,
  Button,
  Dialog,
  Tooltip,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";

import { validateJson, } from "../views/Workflows.jsx";
import { isMobile } from "react-device-detect"
import theme  from "../theme.jsx";
import PaperComponent from "../components/PaperComponent.jsx";
import { CodeHandler, Img, OuterLink, } from '../views/Docs.jsx'
import { v4 as uuidv4} from "uuid";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIndicatorIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import Markdown from "react-markdown";
import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import algoliasearch from "algoliasearch/lite";
import { green } from "../views/AngularWorkflow.jsx"

const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
)

// Lazy loading of ApiExplorer component to reduce initial load time
const ApiExplorer = React.lazy(() => import("../components/ApiExplorer.jsx"));


const ApiExplorerWrapper = (props) => {
  const { globalUrl, serverside, userdata, isLoggedIn, isLoaded} = props;
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io"
  const location = useLocation();
  const navigate = useNavigate();
  const [openapi, setOpenapi] = useState({});
  const [selectedAppData, setSelectedAppData] = useState({})
  const [selectedAuthentication, setSelectedAuthentication] = useState({});
  const [authenticationModalOpen, setAuthenticationModalOpen] = useState(false)
  const [authenticationType, setAuthenticationType] = React.useState("");
  const [appAuthentication, setAppAuthentication] = useState([]);
  const [selectedMeta, setSelectedMeta] = useState(undefined);
  const [appLoaded, setAppLoaded] = useState(false);
  const [selectedAction, setSelectedAction] = useState(
    {
      "app_name": selectedAppData.name,
      "app_id": selectedAppData.id,
      "app_version": selectedAppData.version,
      "large_image": selectedAppData.large_image,
    }
  )
  const [authHighlighted, setAuthHighlighted] = useState(false)
  const [locations, setLocations] = React.useState([])
  const [selectedLocation, setSelectedLocation] = React.useState("")

  const appid = location.pathname.split("/")[2];
  const base64_decode = (str) => {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  };

  useEffect(() => {
	  if (openapi?.id === "HTTP") {
		  selectedAppData.name = "HTTP"
	  }

	  if (selectedAppData !== undefined && selectedAppData !== null && Object.getOwnPropertyNames(selectedAppData).length > 0) {
		HandleAppAuthentication(selectedAppData?.name)
	  }
  }, [selectedAppData, openapi])

  useEffect(() => {
    getAppData(appid)
    if (appid !== undefined && appid !== null && appid.length !== 0) {
  	  HandleGetLocations() 
    }

    if (appAuthentication.length === 0 || selectedAuthentication.length === 0) {
      HandleAppAuthentication()
    }
  }, [appid]);

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

  const runAlgoliaAppSearch = (appname) => {
    const index = searchClient.initIndex("appsearch");

	if (appname === "HTTP" || appname === "http") {
		navigate("/apis")
		return
	}

    index
      .search(appname)
      .then(({ hits }) => {

		if (hits !== undefined && hits !== null && hits.length > 0) {
        	const appsearchname = appname.replaceAll("_", " ").toLowerCase()
			var found = false
			for (var key in hits) {
				const hit = hits[key]
				const newname = hit.name.replaceAll("_", " ").toLowerCase()

				if (newname?.includes(appsearchname)) {
					found = true

					getAppData(hit.objectID)
					break
				}
			}

			if (!found) {
				toast.error(`Failed to get API data for '${appname}' (1). Contact support@shuffler.io if this persists.`, {
					"autoClose": 10000,
				})

				setTimeout(()=>{
					navigate("/search?tab=apps");
				},3000)
			}
		} else {
			toast.error(`Failed to get API data for '${appname}' (2). Contact support@shuffler.io if this persists.`, {
				"autoClose": 10000,
			})
			setTimeout(()=>{
				navigate("/search?tab=apps");
			},3000)
		}
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Fetch data when appid is available
  const getAppData = useCallback((appid) => {
    if (appid === undefined || appid === null || appid.length === 0) {
	  toast.warning("No app ID loaded. Showing default API testing window. ") 
  	  setOpenapi({
		  "id": "HTTP",
		  "servers": [
			  {"url": "https://shuffler.io"},
		  ],
		  "info": {
			  "title": "HTTP",
			  "x-logo": theme.palette?.defaultImage,
		  },
		  "paths": {
			  "/api/v1/workflows/usecases": {
			  	"get": {
					"summary": "Custom Action",
				}
			  }
		  }
	  })
	  setAppLoaded(true)
        
	  //setTimeout(() => {
	  //	navigate("/search?tab=apps")
	  //}, 3000)
      return
    }
	
	if (appid.length !== 32) {
        runAlgoliaAppSearch(appid)
		return
	}

    const url = `${globalUrl}/api/v1/apps/${appid}/config`

    fetch(url, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status !== 200) {
          toast.error("Failed to get app data or App doesn't exist (3). Redirecting..");
          setTimeout(() => {
            navigate("/search?tab=apps")
          }, 3000)
          return;
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
		  if (responseJson.openapi === undefined || responseJson.openapi === null) {
			  toast.warning("Loaded App, but no API found. Redirecting back to app..")
			  navigate(`/apps/${appid}`)
		  } else {
          	handleDecodeOfOpenApiData(responseJson);
		  }
        } else {
          toast.error("Failed to get app data or App doesn't exist (4)");
        }
      })
      .catch((error) => {
        console.error("error for app is :", error);
      });
  },[appid]);

  const handleDecodeOfOpenApiData = (data) => {
    var appexists = false;
    var parsedapp = {};

    if (data.app !== undefined && data.app !== null) {
      var parsedBaseapp = "";
      try {
        parsedBaseapp = base64_decode(data.app);
      } catch (e) {
        parsedBaseapp = data;
      }

      parsedapp = JSON.parse(parsedBaseapp);
      parsedapp.name = parsedapp.name.replaceAll("_", " ");

      appexists =
        parsedapp.name !== undefined &&
        parsedapp.name !== null &&
        parsedapp.name.length !== 0;
      if(parsedapp?.id.length > 0){
        setSelectedAppData(parsedapp)
        handleAppAuthenticationType(parsedapp)
        const apptype = selectedAppData?.generated === false ? "python" : "openapi"
        getAppDocs(parsedapp.name, apptype, parsedapp.version);
      }
    }

    if (data.openapi === undefined || data.openapi === null) {
      return;
    }

    var parsedDecoded = "";
    try {
      parsedDecoded = base64_decode(data.openapi);
    } catch (e) {
      parsedDecoded = data;
    }

    parsedapp = JSON.parse(parsedDecoded);
    data =
      parsedapp.body === undefined ? parsedapp : JSON.parse(parsedapp.body);

    setOpenapi(data);
    setAppLoaded(true);
  };

  const handleAppAuthenticationType = (selectedAppData) => {

    if (selectedAppData.authentication === undefined || selectedAppData.authentication === null) {
      setAuthenticationType({
      type: "",
      })

      selectedAppData.authentication = {
        type: "",
        required: false,
      }
    } else {
      setAuthenticationType(
        selectedAppData.authentication.type === "oauth2-app" || (selectedAppData.authentication.type === "oauth2" && selectedAppData.authentication.redirect_uri !== undefined && selectedAppData.authentication.redirect_uri !== null) ? {
        type: selectedAppData.authentication.type,
        redirect_uri: selectedAppData.authentication.redirect_uri,
        refresh_uri: selectedAppData.authentication.refresh_uri,
        token_uri: selectedAppData.authentication.token_uri,
        scope: selectedAppData.authentication.scope,
        client_id: selectedAppData.authentication.client_id,
        client_secret: selectedAppData.authentication.client_secret,
        grant_type: selectedAppData.authentication.grant_type,
      } : {
        type: "",
      }
      )
    }
  }

  const fix_url = (newUrl) => {
    if (newUrl.includes("hhttp")) {
      newUrl = newUrl.replace("hhttp", "http");
    }

    if (newUrl.includes("http:/") && !newUrl.includes("http://")) {
      newUrl = newUrl.replace("http:/", "http://");
    }
    if (newUrl.includes("https:/") && !newUrl.includes("https://")) {
      newUrl = newUrl.replace("https:/", "https://");
    }
    if (newUrl.includes("http:///")) {
      newUrl = newUrl.replace("http:///", "http://");
    }
    if (newUrl.includes("https:///")) {
      newUrl = newUrl.replace("https:///", "https://");
    }
    if (!newUrl.includes("http://") && !newUrl.includes("https://")) {
      newUrl = `http://${newUrl}`;
    }
    return newUrl;
  };  

  function isValidMethod(method) {
    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
    method = method.toUpperCase();

    if (validMethods.includes(method)) {
        return method;
    } else {
        throw new Error(`Invalid HTTP method: ${method}`);
    }
  }      
  function fixHeader(headers) {
    if (Array.isArray(headers)) {
        return headers.reduce((acc, header) => {
            if (header.key.trim() !== "" || header.value.trim() !== "") {
                acc[header.key.trim()] = header.value.trim();
            }
            return acc;
        }, {});
    }

    const parsedHeaders = {};
    
    if (typeof headers === 'string' && headers) {
        const splitHeaders = headers.split(`\n`)
        
        splitHeaders.forEach(header => {
            let splitItem;
            if (header.includes(":")) {
                splitItem = ":";
            } else if (header.includes("=")) {
                splitItem = "=";
            } else {
                return;
            }

            const splitHeader = header.split(splitItem);
            if (splitHeader.length >= 2) {
                const key = splitHeader[0].trim();
                const value = splitHeader.slice(1).join(splitItem).trim();
                parsedHeaders[key] = value;
            }
        });
    }

    return parsedHeaders;
  }

  function fixParams(queries) {
    if (Array.isArray(queries)) {
      return queries
        .filter(query => query.key.trim() !== "" || query.value.trim() !== "")
        .map(query => ({ key: query.key.trim(), value: query.value.trim() }));
    }
    
    const parsedQueries = [];
    if (typeof queries === 'string') {
      if (!queries.trim()) return parsedQueries;
      const cleanedQueries = queries.trim().replace(/\s+/g, " ");
      const splittedQueries = cleanedQueries.split("&");
      splittedQueries.forEach(query => {
        if (!query.includes("=")) {
          console.info("Skipping as there is no '=' in the query");
          return;
        }
        const [key, value] = query.split("=");
        if (!key.trim() || !value.trim()) {
          console.info("Skipping because either key or value is not present in query");
          return;
        }
        parsedQueries.push({ key: key.trim(), value: value.trim() });
      });
    }
    
    return parsedQueries;
  }

  const UpdateAppAuthentication = useCallback((data, appname) => {
    if (data === undefined || data === null) {
      return
    }

	if (appname !== undefined && appname !== null && appname.length > 0) {
		selectedAppData.name = appname
	}

	console.log("APPNAME: ", appname, openapi.id)
	if (openapi?.id === "HTTP" || appname === "HTTP" || appname === "http") {
		setAppAuthentication(data)
		setSelectedAuthentication({})
		return
	}

    const filteredData = data.filter((appAuth) => appAuth?.app?.id === appid || appAuth?.app?.name?.replaceAll(" ", "_").toLowerCase() === selectedAppData?.name?.replaceAll(" ", "_").toLowerCase());
    if (filteredData.length === 0) {
      setAppAuthentication([])
      setSelectedAuthentication({})
    } else {
      setAppAuthentication(filteredData)
      setSelectedAuthentication(filteredData[0])
    }
  }, [appid])

  const HandleGetLocations = () => {
	const url = `${globalUrl}/api/v1/environments`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then((response) => {
      if (response.status !== 200) {
        return
      }

      return response.json()
    }).then((responseJson) => {
		if (responseJson.success !== false) {
			setLocations(responseJson)
		}
    }).catch((error) => {
      console.error("Error loading locations:", error);
    })
  }

  const HandleAppAuthentication = useCallback((appname) =>{

    const url = `${globalUrl}/api/v1/apps/authentication`;

    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then((response) => {
      if (response.status !== 200) {
        return;
      }
      return response.json();
    }).then((responseJson) => {
      if (responseJson.success === true) {
        UpdateAppAuthentication(responseJson.data, appname)
      } else {
        toast.error("Failed to get app authentication data");
      }
    }).catch((error) => {
      console.error("error for app is :", error);
    });
  })

  const HandleApiExecution =  useCallback(async (selectedMethod, url, path, RequestHeader, RequestBody, RequestParams, info, action, setCurTab, executionLocation) => {

    let validMethod;
    try {
        validMethod = isValidMethod(selectedMethod);
    } catch (error) {
        console.error(error);
        toast.error(error.message);
        return { error: error.message };
    }

    const headers = {};
    RequestHeader.forEach((header) => {
      if (header.key.length > 0 && header.value.length > 0) {
        headers[header.key] = header.value;
      }
    });

    const formatArrayToString = (array) => {
      return array
        .map(item => (item.key.trim().length > 0 && item.value.trim().length > 0 ? `${item.key}=${item.value}` : ""))
        .filter(str => str.length > 0)
        .join(``);
    }; 

    var appid = "";

    if (selectedAppData?.id?.length > 0) {
      appid = selectedAppData?.id;
    }else if (openapi?.id?.length > 0) {
      appid = openapi?.id;
    }else{
      toast.error("App id is missing and we can't run the API. Please contact support@shuffler.io if this persists.");
      return;
    }

      const fullUrl = `${globalUrl}/api/v1/apps/${appid}/run`;

      var actionData = {
			name: "custom_action",
			app_name: info?.title,
			app_version: info?.version,
			app_id: appid,
			authentication_id: selectedAuthentication?.id?.length > 0 ? selectedAuthentication?.id : "",
			auth_not_required: false,
			environment: isCloud ? "cloud" : "Shuffle",
			node_type: "action",
			parameters: [{ name: "url", value: fix_url(url)}],
      }

	  if (selectedLocation?.length > 0 && selectedLocation?.toLowerCase() !== "default") {
		  actionData.environment = selectedLocation

		  // Find the env
		  for (var envkey in locations) {
			  const env = locations[envkey]
			  if (env.Name !== selectedLocation) {
				  continue
			  }

			  if (env.Type === "cloud" || (env.running_ip !== undefined && env.running_ip !== null && env.running_ip.length > 0)) {
			  } else {
				  toast.warn(`Location ${env.Name} is not running and may not work as expected`)
			  }
			  break
		  }
	  }

	  
      const body = RequestBody;
      const header = formatArrayToString(RequestHeader);
      const param = fixParams(RequestParams);

	  var hasBody = false
      if (body.length > 0 && body !== "{}" && validMethod !== "GET"  && validMethod !== "HEAD" && validMethod !== "OPTIONS" && validMethod !== "CONNECT" && validMethod !== "TRACE") {
	  	hasBody = true 
        actionData.parameters.push({
          name: "body",
          value: body,
        });
      }

      if (header.length > 0) {
        actionData.parameters.push({
          name: "headers",
          value: header,
        });
      }

      if (param.length > 0) {
        const paramsString = new URLSearchParams(param.map(param => [param.key, param.value])).toString();
        actionData.parameters.push({
          name: "queries",
          value: paramsString,
        });
      }
      if ( validMethod.length > 0) {
        actionData.parameters.push({
          name: "method",
          value: validMethod,
        });
      }

      if (path.length > 0) {
        actionData.parameters.push({
          name: "path",
          value: path,
        });
      }

      const options = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
        credentials: 'include', 
      };
      
      try {
        const response = await fetch(fullUrl, options)
        const data = await response.json()

		if (data.success === false) {
			if (data.reason !== undefined && data.reason !== null && data.reason.length > 0) {

				if (data.reason.includes("authenticate")) {
					toast.error("Authenticate the app first or add authentication headers");

					setAuthHighlighted(true)
					if (setCurTab !== undefined) {
						if (hasBody) {
							setCurTab(3)
						} else {
							setCurTab(2)
						}
					}
				}
			}
		} else {
			if (data.result !== undefined && data.result !== null && data.result.length > 0) {
    			const validate = validateJson(data.result)
				if (validate.valid === true) {
					if (validate.result.status === 401 || validate.result.status === 403) {
						setAuthHighlighted(true)

						toast.info("You need to authenticate the app first, either with an API-key directly in the headers or with the Shuffle auth system")

						if (setCurTab !== undefined) {
							if (hasBody) {
								setCurTab(3)
							} else {
								setCurTab(2)
							}
						}
					} else if (validate.result.status === 404) {
						//toast.error("Page not found. Please try a different URL.")
					} else if (validate.result.error !== undefined && validate.result.error !== null && validate.result.error.length > 0) {
						if (validate.result.error.toLowerCase().includes("max retries")) {
							toast.error("Are you sure the URL is correct? It seems like the server is not responding.")
						}
					}
				}

				if (data.result.includes("custom_action doesn't exist")) {
					// No timeout error
					toast.info("This API is being rebuilt due to missing functionality. Please wait a minute or two, then try again. If this persists, please report to support@shuffler.io", {
						"autoClose": 90000,
					})
				} else if (data.result.includes("authentication") && data.result.includes("Oauth2")) {
					toast.error("Oauth2 apps require authentication") 

					setAuthHighlighted(true)
					if (setCurTab !== undefined) {
						if (hasBody) {
							setCurTab(3)
						} else {
							setCurTab(2)
						}
					}
				}

				if (validate.valid === true) {
					return validate.result
				}
			}
		}

        return data
    
      } catch (error) {
        console.error("Error during API execution:", error);
        toast.error(`${error.message} Please ensure all fields are filled out correctly and try again.`);
        return { error: error.message };
      }
    
  },[selectedAuthentication, selectedAppData, openapi]);


  const AuthenticationList = () => {
    const [openId, setOpenId] = useState(null);
    const name = selectedAuthentication?.app?.name?.length > 0 ? selectedAuthentication?.label : "No Selection";
    const [authenticationName, setAuthenticationName] = useState(name)
  
    const toggleScope = (id, event) => {
      event.stopPropagation();
      setOpenId((prevOpenId) => (prevOpenId === id ? null : id));
    };
  
    return (
      <Select
        id="authentication-list"
        value={authenticationName}
        MenuProps={{
          PaperProps: {
            sx: {
              '& .MuiList-root': {
                backgroundColor: "#1f1f1f",
              },
			  maxWidth: 500, 
            },
          }
        }}
        renderValue={() => {
          if (selectedAuthentication) {
            return authenticationName
          }

          return "No Selection";
        }}
        sx={{
          backgroundColor: '#1f1f1f',
          color: 'white',
		  maxWidth: 200,
        }}
      >
		  <MenuItem
			value={"No Selection"}
			sx={{
			  display: 'flex',
			  justifyContent: 'space-between',
			  color: 'white',
			}}
			onClick={(e) => {
			  setSelectedAuthentication({})
			  setAuthenticationName("No Selection")
			}}
		  >
			No Selection
		  </MenuItem>
		<Divider />

        {appAuthentication?.length > 0 ? appAuthentication.map((appAuth) => (
          <div
            key={appAuth?.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1f1f1f',
              color: 'white',
              padding: '5px',
			  textAlign: "left", 
            }}
          >
              <MenuItem
                value={appAuth?.id}
                sx={{
                  display: 'flex',
                  color: 'white',
                }}
                onClick={(e) => {
                  setSelectedAuthentication(appAuth);
                  setAuthenticationName(appAuth.app?.name) 
                }}
              >
				  {appAuth?.app?.large_image !== undefined && appAuth?.app?.large_image !== null && appAuth?.app?.large_image.length > 0 ?
					  <Tooltip title={appAuth?.app?.name} placement="top">
					  	<img src={appAuth?.app?.large_image} alt={appAuth?.app?.name} style={{ maxWidth: 20, maxHeight: 20, marginRight: 10, borderRadius: 5 }} />
					  </Tooltip>
				  : null}
				  {appAuth?.validation?.valid === true ? 
					<Tooltip title="Validated" placement="top">
  						<CheckCircleIcon style={{ color: green, marginRight: 10,  }} />
					</Tooltip> 
				  : null}
                  {appAuth?.label}
              </MenuItem>
  
			{/*<Collapse in={openId === appAuth.id}>
              <Stack
                sx={{
                  paddingLeft: 2,
                  paddingTop: 1,
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {appAuth.label.split(' ').map((url) => (
                  <ListItem
                    key={url}
                    disablePadding
                    sx={{
                      paddingLeft: 4,
                      color: 'lightgray',
                      padding: 1,
                    }}
                  >
                    <Typography variant="body2">{url}</Typography>
                  </ListItem>
                ))}
              </Stack>
            </Collapse>*/}
          </div>
        )): (
          <MenuItem value="No authentication" sx={{ color: 'white', '&:hover' : {backgroundColor: 'transparent'}, cursor: 'default'}}>
            No authentication Found
          </MenuItem>
        )}
      </Select>
    );
  };  

  const SkeletonLoader = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        padding: 0,
      }}
    >
      <Box
        sx={{
          width: "20%",
          minWidth: 300,
          padding: 2,
          boxSizing: "border-box",
        }}
      >
        <Stack spacing={2} sx={{ width: "100%" }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={40}
            sx={{ borderRadius: "8px" }}
          />
          <Skeleton variant="text" width="100%" height={40} />
          <Skeleton variant="text" width="100%" height={40} />
          <Skeleton variant="text" width="100%" height={40} />
          <Skeleton variant="text" width="100%" height={40} />
        </Stack>
      </Box>
  
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "80%",
          boxSizing: "border-box",
          padding: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Box
            sx={{
              flex: 1,
              padding: 3,
              display: "flex",
              overflow: "auto",
              boxSizing: "border-box",
              flexDirection: "column",
              width: "100%",
              justifyContent: "center",
              paddingLeft: 4,
            }}
          >
            <Skeleton variant="text" width="100%" height={40} />
  
            <Skeleton
              variant="text"
              width={100}
              height={20}
              sx={{ marginTop: 1 }}
            />
  
            <Skeleton
              variant="rectangular"
              width="100%"
              height={30}
              sx={{ borderRadius: "8px", marginTop: 1 }}
            />
  
            <Stack
              spacing={2}
              direction="row"
              sx={{
                marginTop: 2,
                display: "flex",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Skeleton variant="text" width={50} height={30} />
              <Skeleton variant="text" width={50} height={30} />
              <Skeleton variant="text" width={50} height={30} />
            </Stack>
  
            <Skeleton
              variant="rectangular"
              width="100%"
              height={400}
              sx={{ borderRadius: "8px", marginTop: 2 }}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              padding: 3,
              display: "flex",
              overflow: "auto",
              boxSizing: "border-box",
              flexDirection: "column",
              width: "100%",
              marginTop: 2,
              paddingLeft: 4,
            }}
          >
            <Skeleton variant="text" width={400} height={40} />
            <Skeleton
              variant="rectangular"
              width={400}
              height={30}
              sx={{ borderRadius: "8px", marginTop: 1 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
  

  const AuthenticationData = (props) => {
    const selectedApp = props.app;

    const [authenticationOption, setAuthenticationOptions] = React.useState({
      app: JSON.parse(JSON.stringify(selectedApp)),
      fields: {},
      label: "",
      usage: [
        {
          // workflow_id: workflow.id,
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
    
    const setNewAppAuth = (appAuthData, refresh) => {
      setSelectedAuthentication(appAuthData);
      var headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      }
    
        headers["Org-Id"] = userdata?.active_org?.id
    
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
              toast.error("Error: " + responseJson.reason, {
          "autoClose": false,
          })
    
            } else {
              HandleAppAuthentication()
              setAuthenticationModalOpen(false)
            }
          })
          .catch((error) => {
            console.log("New auth error: ", error.toString());
          });
      };

    const handleSubmitCheck = () => {
      if (authenticationOption.label.length === 0) {
        authenticationOption.label = `Auth for ${selectedApp.name}`;
      }
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

      var newAuthOption = JSON.parse(JSON.stringify(authenticationOption));
      var newFields = [];
      for (let authkey in newAuthOption.fields) {
        const value = newAuthOption.fields[authkey];
        newFields.push({
          "key": authkey,
          "value": value,
        });
      }

      newAuthOption.fields = newFields
      setNewAppAuth(newAuthOption)
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
      if (data.value === "" || data.value === null || data.value === undefined || data.name === "url") {
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
              setSelectedAppData(prevState => ({
                ...prevState,
                documentation: newdata,
              }));
            }
          }
        }

      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const authenticationModal = authenticationModalOpen ? (
    <Dialog
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      hideBackdrop={true}
      disableEnforceFocus={true}
      disableBackdropClick={true}
      style={{ pointerEvents: "none" }}
      open={authenticationModalOpen}
      onClose={() => {setSelectedMeta(undefined)}}
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
        { selectedAppData.reference_info === undefined ||
          selectedAppData.reference_info === null ||
          selectedAppData.reference_info.github_url === undefined ||
          selectedAppData.reference_info.github_url === null ||
          selectedAppData.reference_info.github_url.length === 0 ? (

          <a
            rel="noopener noreferrer"
            target="_blank"
            href={"https://github.com/shuffle/python-apps"}
            style={{ textDecoration: "none", color: "#f86a3e" }}
          >
            <img
              alt={`Documentation image for ${selectedAppData.name}`}
              src={selectedAppData.large_image}
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
            href={selectedAppData.reference_info.github_url}
            style={{ textDecoration: "none", color: "#f86a3e" }}
          >
            <img
              alt={`Documentation image for ${selectedAppData.name}`}
              src={selectedAppData.large_image}
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
              selectedApp={selectedAppData}
              selectedAction={{
                "app_name": selectedAppData.name,
                "app_id": selectedAppData.id,
                "app_version": selectedAppData.version,
                "large_image": selectedAppData.large_image,
              }}
              authenticationType={authenticationType}
              getAppAuthentication={HandleAppAuthentication}
              appAuthentication={appAuthentication}
              setAuthenticationModalOpen={setAuthenticationModalOpen}
              isCloud={isCloud}
              org_id={userdata?.active_org?.id}
              setSelectedAction={setSelectedAction}
            />
           : 
            <AuthenticationData app={selectedAppData} />
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
        >
          {selectedAppData.documentation === undefined ||
            selectedAppData.documentation === null ||
            selectedAppData.documentation.length === 0 ? (
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
          {selectedAppData?.description}
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
                window.open(`https://github.com/Shuffle/openapi-apps/new/master/docs?filename=${selectedAppData.name.toLowerCase()}.md`, "_blank")
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
              {selectedAppData.reference_info === undefined ||
                selectedAppData.reference_info === null ||
                selectedAppData.reference_info.github_url === undefined ||
                selectedAppData.reference_info.github_url === null ||
                selectedAppData.reference_info.github_url.length === 0 ? (
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
                      href={selectedAppData.reference_info.github_url}
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
        {selectedAppData.documentation}
        </Markdown>
      </div>
          )}
        </div>
      </div>
    </Dialog>
) : null;

  const ConfigurationTab = memo((props) => {
    return (
      <div
        style={{
          padding: 20,
          width: "95%",
          borderRadius: theme.palette.borderRadius,
          border: "1px solid rgba(255,255,255,0.1)",
          justifyContent: "space-between",
        }}
      >
		<div style={{display: "flex", }}>
			<div style={{width: 600, margin: "auto", display: "flex", }}>
				{openapi?.id === "HTTP" ? 
					null
					: isLoggedIn === true ? 
					<Button
					  variant={authHighlighted ? "contained" : "outlined"}
					  style={{
						margin: "auto", 
						textTransform: 'none',
						fontSize: 16,
						height: '50px',
						display: 'flex',
						alignItems: 'center',
						flex: 1, 
					  }}
					  onClick={() => {if (!isLoggedIn){toast.error("Please login to authenticate app"); return;} setAuthenticationModalOpen(true)}}
					>
						{appAuthentication?.length > 0 ? "Re-Authenticate API" : "Authenticate API"}
					</Button>
				: 
					<Link to={`/register?view=${window.location.pathname}`} style={{textDecoration: "none"}}>
						<Button
						  variant={authHighlighted ? "contained" : "outlined"}
						  style={{
							margin: "auto", 
							textTransform: 'none',
							fontSize: 16,
							height: '50px',
							display: 'flex',
							alignItems: 'center',
							flex: 1, 
						  }}
						>
							Register to save authentication
						</Button>
					</Link>
				}

				{appAuthentication?.length > 0 ? 
					<div style={{display: "flex", flex: 2, textAlign: "center", }}>
						{openapi?.id === "HTTP" ? null : 
							<Typography style={{textAlign: "center", flex: 1, color: "white", marginTop: 15, }} variant="body1">
								or use	
							</Typography>
						}

						<div style={{
						  flex: 1, 
						  display: 'flex',
						  flexDirection: 'column',
						  justifyContent: 'center',
						  margin: 'auto',
						  maxWidth: 200, 
						}}>
						  <AuthenticationList /> 
						</div>
					</div>
				: null}
			</div>
		</div> 

		{locations !== undefined && locations !== null && locations.length > 0 ?
		  <div style={{maxWidth: 600, margin: "auto", display: "flex", flexDirection: "column", marginTop: 20, }}>
			<Typography style={{color: "white", marginTop: 15, }} variant="body1">
				Runtime <a href="/admin?tab=locations" style={{textDecoration: "none", color: "#f85a3e"}} target="_blank" rel="noopener noreferrer">location</a>
			</Typography>
		  	<Select
		  	  id="location-list"
			  disabled={true}
		  	  value={selectedLocation === "" ? "Default" : selectedLocation}
		  	  MenuProps={{
		  	    PaperProps: {
		  	  	sx: {
		  	  	  '& .MuiList-root': {
		  	  		backgroundColor: "#1f1f1f",
		  	  	  },
		  	  	},
		  	    }
		  	  }}
		  	  renderValue={() => {
          		if (selectedLocation.length > 0) {
		  		  return selectedLocation
				}

		  	    return "Default"
		  	  }}
		  	  sx={{
		  	    backgroundColor: '#1f1f1f',
		  	    color: 'white',
		  	    maxWidth: 200,
		  	  }}
			  onChange={(e) => {
			  	toast.info("Changing location to " + e.target.value)
			  	setSelectedLocation(e.target.value)
			  }}
		  	>
		  	  <MenuItem
		  	  	value={"Default"}
		  	  	sx={{
		  	  	  color: 'white',
		  	  	}}
		  	  >
				Default
			  </MenuItem>
		  	  <Divider />
			  {locations?.map((location, index) => {
			  	if (location.archived) {
			  		return null
			  	}

			  	return ( 
			  	  <MenuItem
			  		value={location.Name}
			  		sx={{
			  		  color: 'white',
			  		}}
			  	  >
			  		  {location.Type === "cloud" || (location.running_ip !== undefined && location.running_ip !== null && location.running_ip.length > 0) ?
			  			<Tooltip title={`Running on ${location.running_ip}`}  placement="top">
			  				<CheckCircleIcon style={{ color: green, marginRight: 10,  }} />
			  			</Tooltip> 
			  		  : null}
			  		  {location.Name}
			  	  </MenuItem>
			  	)
			  })} 
			</Select>
		  </div>
		: null}
      </div>
  )});

  return (
    <Wrapper isLoggedIn={isLoggedIn} isLoaded={isLoaded}>
          {appLoaded === false ? (
            <SkeletonLoader />
          ) : (
            <Suspense fallback={SkeletonLoader}>
            {authenticationModal}
            <ApiExplorer
              openapi={openapi}
              globalUrl={globalUrl}
              serverside={serverside}
              userdata={userdata}
              HandleApiExecution={HandleApiExecution}
              selectedAppData={selectedAppData}
              ConfigurationTab={ConfigurationTab}
              isLoggedIn={isLoggedIn}
              isLoaded={isLoaded}
            />
          </Suspense>
        )}
    </Wrapper>
  );
};

export default ApiExplorerWrapper;


const Wrapper = ({children, isLoaded,isLoggedIn})=>{

  const { leftSideBarOpenByClick } = useContext(Context);

  return(
    
    <div className="api-explorer-wrapper" style={{ paddingLeft: (isLoggedIn && isLoaded) ? leftSideBarOpenByClick ? 280 : 100 : 0, transition: 'padding-left 0.3s ease' }}>
      {children}
    </div>
  )
}
