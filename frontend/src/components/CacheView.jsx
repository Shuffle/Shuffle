import React, { useState, useEffect } from "react";
import theme from "../theme.jsx";
import {
    Tooltip,
    Divider,
    TextField,
    Button,
    Tabs,
    Tab,
    Grid,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogActions,
} from "@material-ui/core";
import { useAlert } from "react-alert";

import {
    Edit as EditIcon,
    FileCopy as FileCopyIcon,
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
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from "@material-ui/icons";

const CacheView = (props) => {
    const { globalUrl, userdata, serverside, orgId } = props;
    const [orgCache, setOrgCache] = React.useState("");
    const [listCache, setListCache] = React.useState([]);
    const [addCache, setAddCache] = React.useState("");
    const [modalOpen, setModalOpen] = React.useState(false);
    const [key, setKey]= React.useState(""); 
    const [value, setValue]= React.useState(""); 
    const [cacheInput, setCacheInput]= React.useState("");
    const [cacheCursor, setCacheCursor]= React.useState("");

    const alert = useAlert();
    useEffect(() => {
        listOrgCache(orgId);
        console.log("orgid", orgId);
    }, []);

    const listOrgCache = (orgId) => {
        fetch(globalUrl + `/api/v1/orgs/${orgId}/list_cache`, {
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
						setListCache(responseJson.keys);
					}

					if (responseJson.cursor !== undefined && responseJson.cursor !==  null && responseJson.cursor !== "") {
						setCacheCursor(responseJson.cursor);
					}
				})
				.catch((error) => {
						alert.error(error.toString());
				});
    };

    // const getCacheList = (orgId) => {
    //     fetch(`${globalUrl}/api/v1/orgs/${orgId}/get_cache`, {
    //       method: "GET",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Accept: "application/json",
    //       },
    //       credentials: "include",
    //     })
    //       .then((response) => {
    //         if (response.status !== 200) {
    //           console.log("Status not 200 for WORKFLOW EXECUTION :O!");
    //         }
    
    
    //         return response.json();
    //       })
    //       .then((responseJson) => {
    //         if (responseJson.success !== false) {
    //           console.log("Found cache: ", responseJson)
    //           setListCache(responseJson)
    //         } else {
    //           console.log("Couldn't find the creator profile (rerun?): ", responseJson)
    //           // If the current user is any of the Shuffle Creators 
    //           // AND the workflow doesn't have an owner: allow editing.
    //           // else: Allow suggestions?
    //           //console.log("User: ", userdata)
    //           //if (rerun !== true) {
    //           //	getUserProfile(userdata.id, true)
    //           //}
    //         }
    //       })
    //       .catch((error) => {
    //         console.log("Get userprofile error: ", error);
    //       })
    //   }
    

    const deleteCache = (orgId, key) => {
        alert.info("Attempting to delete Cache");
        fetch(globalUrl + `/api/v1/orgs/${orgId}/cache/${key}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        })
          .then((response) => {
            if (response.status === 200) {
              alert.success("Successfully deleted Cache");
              setTimeout(() => {
                listOrgCache(orgId);
              }, 1000);
            } else {
              alert.error("Failed deleting Cache. Does it still exist?");
            }
          })
          .catch((error) => {
            alert.error(error.toString());
          });
      };

    const addOrgCache = (orgId) => {
        const cache={key:key,value:value}; 
	    setCacheInput([cache]);
        console.log("cache input:",cacheInput)
        
        fetch(globalUrl + `/api/v1/orgs/${orgId}/set_cache`, {

            method: "POST",
            body: JSON.stringify(cache),
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
                setAddCache(responseJson);
                alert.success("New Cache Added Successfully!");
                listOrgCache(orgId);
                setModalOpen(false);
            })
            .catch((error) => {
                alert.error(error.toString());
            });
    };

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
                    Add Cache
                </span>
            </DialogTitle>
            <div  style={{paddingLeft: "30px", paddingRight: '30px'}}>
                Key
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
                    autoComplete="Key"
                    placeholder="abc"
                    id="keyfield"
                    margin="normal"
                    variant="outlined"
                    value={key} 
                    onChange={(e)=>setKey(e.target.value)}
                />
            </div>
            <div  style={{paddingLeft: "30px", paddingRight: '30px'}}>
                Value
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
                    autoComplete="Value"
                    placeholder="123"
                    id="Valuefield"
                    margin="normal"
                    variant="outlined"
                    value={value} 
                    onChange={(e)=>setValue(e.target.value)}
                />
            </div>
            <DialogActions  style={{paddingLeft: "30px", paddingRight: '30px'}}>
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
                        addOrgCache(orgId)
                    }}
                    color="primary"
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (

        <div>
            {modalView}
            <div style={{ marginTop: 20, marginBottom: 20 }}>
                <h2 style={{ display: "inline" }}>Shuffle Datastore</h2>
                <span style={{ marginLeft: 25 }}>
										Datastore is a key-value store for storing data that can be used cross-workflow.&nbsp; 
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="/docs/organizations#datastore"
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
                Add Cache
            </Button>
            <Button
                style={{ marginLeft: 5, marginRight: 15 }}
                variant="contained"
                color="primary"
                onClick={() => listOrgCache(orgId)}
            >
                <CachedIcon />
            </Button>
            <Divider
                style={{
                    marginTop: 20,
                    marginBottom: 20,
                }}
            />
            <List>
                <ListItem>
                    <ListItemText
                        primary="Key"
                        // style={{ minWidth: 150, maxWidth: 150 }}
                    />
                    <ListItemText
                        primary="value"
                        // style={{ minWidth: 150, maxWidth: 150 }}
                    />
                    <ListItemText
                        primary="Updated"
                        // style={{ minWidth: 150, maxWidth: 150 }}
                    />
                    <ListItemText
                        primary="Actions"
                        // style={{ minWidth: 150, maxWidth: 150 }}
                    />
                </ListItem>
                {listCache === undefined || listCache === null
                    ? null
                    : listCache.map((data, index) => {
                        var bgColor = "#27292d";
                        if (index % 2 === 0) {
                            bgColor = "#1f2023";
                        }

                        return (
                            <ListItem key={index} style={{ backgroundColor: bgColor }}>
                                <ListItemText
                                style={{
                                    maxWidth: 225,
                                    minWidth: 225,
                                    overflow: "hidden",
                                }}
                                    primary={data.key}
                                />
                                <ListItemText
                                style={{
                                    maxWidth: 225,
                                    minWidth: 225,
                                    overflow: "hidden",
                                    paddingLeft: "52px",
                                }}
                                    // style={{ maxWidth: 100, minWidth: 100 }}
                                    primary={data.value} />
                                <ListItemText
                                    style={{
                                        maxWidth: 225,
                                        minWidth: 225,
                                        overflow: "hidden",
                                    }}
                                    primary={new Date(data.edited * 1000).toISOString()}
                                />
                                <ListItemText
                                    style={{
                                        minWidth: 250,
                                        maxWidth: 250,
                                        overflow: "hidden",
                                        paddingLeft: "155px",
                                    }}
                                    primary=<span style={{ display: "inline" }}>
                                        {/* <Tooltip
                                            title="Edit"
                                            style={{}}
                                            aria-label={"Edit"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
                                                    onClick={() => {

                                                    }}
                                                >
                                                    <EditIcon
                                                        style={{ color: "white" }}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip> */}
                                        <Tooltip
                                            title={"Delete Cache"}
                                            style={{ marginLeft: 15, }}
                                            aria-label={"Delete"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
                                                    onClick={() => {
                                                        deleteCache(orgId, data.key);
                                                        //deleteFile(orgId);
                                                    }}
                                                >
                                                    <DeleteIcon
                                                        style={{ color: "white" }}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </span>
                                />
                            </ListItem>
                        );
                    })}
            </List>
        </div>

    );
}
export default CacheView;
