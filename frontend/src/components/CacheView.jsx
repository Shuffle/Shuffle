import React, { useState, useEffect } from "react";
import theme from "../theme.jsx";
import { toast } from 'react-toastify';
import ReactJson from "react-json-view-ssr";

import {
	Typography,
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
} from "@mui/material";

import {
	Link as LinkIcon,
    AutoFixHigh as AutoFixHighIcon,
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
} from "@mui/icons-material";
import { validateJson, } from "../views/Workflows.jsx";

const scrollStyle1 = {
    height: 100,
    width: 225,
    overflow: "hidden",
    position: "relative",
}

const scrollStyle2 = {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: "-20px",
    right: "-20px",
    overflow: "scroll",
}


const CacheView = (props) => {
    const { globalUrl, userdata, serverside, orgId, isSelectedDataStore } = props;
    const [orgCache, setOrgCache] = React.useState("");
    const [listCache, setListCache] = React.useState([]);
    const [addCache, setAddCache] = React.useState("");
    const [editedCache, setEditedCache] = React.useState("");
    const [modalOpen, setModalOpen] = React.useState(false);
    const [key, setKey] = React.useState("");
    const [value, setValue] = React.useState("");
    const [cacheInput, setCacheInput] = React.useState("");
    const [cacheCursor, setCacheCursor] = React.useState("");
    const [dataValue, setDataValue] = React.useState({});
    const [editCache, setEditCache] = React.useState(false);
    const [show, setShow] = useState({});

    useEffect(() => {
        listOrgCache(orgId);
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
				console.log("Status not 200 for list cache :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success === true) {
				setListCache(responseJson.keys);
			}

			if (responseJson.cursor !== undefined && responseJson.cursor !== null && responseJson.cursor !== "") {
				setCacheCursor(responseJson.cursor);
			}
		})
		.catch((error) => {
			toast(error.toString());
		});
    };


    const deleteCache = (orgId, key) => {
        //toast("Attempting to delete Cache");

        // method: "DELETE",
		const method = "POST"
        //const url = `${globalUrl}/api/v1/orgs/${orgId}/cache/${key}`
        const url = `${globalUrl}/api/v1/orgs/${orgId}/delete_cache`
		const parsed = {
			"org_id": orgId,
			"key": key,
		}

        fetch(url, {
			method: method,
            headers: {
                Accept: "application/json",
            },
			body: JSON.stringify(parsed),
            credentials: "include",
        })
            .then((response) => {
                if (response.status === 200) {
                    toast("Successfully deleted Cache");
                    setTimeout(() => {
                        listOrgCache(orgId);
                    }, 1000);
                } else {
                    toast("Failed deleting Cache. Does it still exist?");
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const editOrgCache = (orgId) => {
        const cache = { key: dataValue.key , value: value };
        setCacheInput([cache]);

        fetch(globalUrl + `/api/v1/orgs/${orgId}/set_cache`, {

            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify(cache),
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for Cache :O!");
                    return;
                }

                return response.json();
            })
            .then((responseJson) => {
                setAddCache(responseJson);
                toast("Cache Edited Successfully!");
                listOrgCache(orgId);
                setModalOpen(false);
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const addOrgCache = (orgId) => {
        const cache = { key: key, value: value };
        setCacheInput([cache]);
        console.log("cache input:", cacheInput)

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
                toast("New Cache Added Successfully!");
                listOrgCache(orgId);
                setModalOpen(false);
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const isValidJson = validateJson(value)
	const autoFixJson = (inputvalue) => {
		console.log("inputvalue: ", inputvalue)
		try {
			var parsedjson = JSON.parse(inputvalue)

			// setValue() with the parsed json as string
			setValue(JSON.stringify(parsedjson, null, 2))
		} catch (e) {
			console.log("Error parsing JSON: ", e)
			//return JSON.stringify(inputvalue);
		}
	}

    const modalView = (
        // console.log("key:", dataValue.key),
        //console.log("value:",dataValue.value),
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
                    { editCache ? "Edit Cache" : "Add Cache" }
                </span>
            </DialogTitle>
            <div style={{ paddingLeft: "30px", paddingRight: '30px' }}>
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
                    value={editCache ? dataValue.key : key}
                    onChange={(e) => setKey(e.target.value)}
                />
            </div>
            <div style={{ paddingLeft: 30, paddingRight: 30 }}>
				<div style={{display: "flex", }}>
					<Typography style={{marginTop: 25, marginBottom: 0, flex: 20, }}>
						Value - ({isValidJson.valid === true ? "Valid" : "Invalid"} JSON)
					</Typography>
					<Tooltip title="Auto Fix JSON" placement="right">
						<IconButton
							style={{flex: 1, }}
							onClick={() => {
								autoFixJson(value)
							}}
						>
							<AutoFixHighIcon /> 
						</IconButton>
					</Tooltip>
				</div>
                <TextField
                    color="primary"
                    style={{ backgroundColor: theme.palette.inputColor, marginTop: 0, }}
                    InputProps={{
                        style: {
                            color: "white",
                            fontSize: "1em",
                        },
                    }}
                    required
                    fullWidth
                    autoComplete="Value"
                    placeholder="123"
                    id="Valuefield"
                    margin="normal"
                    variant="outlined"
					multiline
					minRows={4}
					maxRows={12}
                    //defaultValue={editCache ? dataValue.value : ""}
					value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
            <DialogActions style={{ paddingLeft: "30px", paddingRight: '30px' }}>
                <Button
                    style={{ borderRadius: "0px" }}
                    onClick={() => {
						setModalOpen(false)
						setValue("")
						setDataValue({})
					}}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "0px" }}
                    onClick={() => {
                        {editCache ? editOrgCache(orgId) : addOrgCache(orgId)}
						
						setValue("")
						setDataValue({})
                    }}
                    color="primary"
                >
                    {editCache ? "Edit":"Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (

        <div style={{paddingBottom: isSelectedDataStore?null:250, width: isSelectedDataStore?1030:null, padding:isSelectedDataStore?27:null, height: isSelectedDataStore?"auto":null, color: isSelectedDataStore?'#ffffff':null, backgroundColor: isSelectedDataStore?'#212121':null, borderRadius: isSelectedDataStore?'16px':null, }}>
            {modalView}
            <div style={{ marginTop: isSelectedDataStore?null:20, marginBottom: 20 }}>
                <h2 style={{ display: isSelectedDataStore?null: "inline" }}>Shuffle Datastore</h2>
                <span style={{ marginLeft: isSelectedDataStore?null:25, color:isSelectedDataStore?"#9E9E9E":null}}>
                    Datastore is a permanent key-value database for storing data that can be used cross-workflow. <br/>You can store anything from lists of IPs to complex configurations.&nbsp;
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="/docs/organizations#datastore"
                        style={{ textDecoration: isSelectedDataStore?null:"none", color: isSelectedDataStore?"#FF8444":"#f85a3e" }}
                    >
                        Learn more
                    </a>
                </span>
            </div>
            <Button
                style={{backgroundColor: isSelectedDataStore?'rgba(255, 132, 68, 0.2)':null, boxShadow: isSelectedDataStore ? "none":null,textTransform: isSelectedDataStore ? 'capitalize':null, color:isSelectedDataStore?"#FF8444":null, borderRadius:isSelectedDataStore?200:null, width:isSelectedDataStore?162:null, height:isSelectedDataStore?40:null}}
                variant="contained"
                color="primary"
                onClick={() =>{ 
                    setEditCache(false)
                    setModalOpen(true)

					setValue("")
                }}
            >
                Add Cache
            </Button>
            <Button
                style={{ marginLeft: 5, marginRight: 15, backgroundColor: isSelectedDataStore?"#2F2F2F":null, boxShadow: isSelectedDataStore ? "none":null,textTransform: isSelectedDataStore ? 'capitalize':null,borderRadius:isSelectedDataStore?200:null, width:isSelectedDataStore?81:null, height:isSelectedDataStore?40:null,  }}
                variant="contained"
                color="primary"
                onClick={() => listOrgCache(orgId)}
            >
                <CachedIcon />
            </Button>
            {isSelectedDataStore? null :<Divider
                style={{
                    marginTop: 20,
                    marginBottom: 20,
                }}
            />}
            <List style={{borderRadius: isSelectedDataStore?8:null, border:isSelectedDataStore?"1px solid #494949":null, marginTop:isSelectedDataStore?24:null}}>
                <ListItem style={{width: isSelectedDataStore?"100%":null, borderBottom:isSelectedDataStore?"1px solid #494949":null}}>
                    <ListItemText
                        primary="Key"
                    	style={{ minWidth: isSelectedDataStore?200:250, maxWidth: isSelectedDataStore?200:250, }}
                    />
                    <ListItemText
                        primary="Value"
                    	style={{ minWidth: isSelectedDataStore?300:400, maxWidth: isSelectedDataStore?300:400, overflowX: "auto", overflowY: "hidden", }}
                    />
                    <ListItemText
                        primary="Actions"
                    	style={{ minWidth: 150, maxWidth: 150, marginLeft: isSelectedDataStore?80:null,}}
                    />
                    <ListItemText
                        style={{textAlign:isSelectedDataStore?"center":null}}
                        primary="Updated"
                    />
                </ListItem>
                {listCache === undefined || listCache === null
                    ? null
                    : listCache.map((data, index) => {
                        var bgColor = isSelectedDataStore? "#212121":"#27292d";
                        if (index % 2 === 0) {
                            bgColor = isSelectedDataStore? "#1A1A1A":"#1f2023";
                        }

              			const validate = validateJson(data.value);
                        return (
                            <ListItem key={index} style={{ backgroundColor: bgColor, maxHeight: 300, overflow: "auto", }}>
                                <ListItemText
                                    style={{
                                        maxWidth: 200,
                                        minWidth: 200,
                                        overflow: "hidden",
                                    }}
                                    primary={data.key}
                                />
                                <ListItemText
                                    style={{
										minWidth: 300,
										maxWidth: 300,
                                        // height:200,
                                        overflowX: "hidden",
									}}
                                    primary={validate.valid ? 
                      					<ReactJson
                      					  src={validate.result}
                      					  theme={theme.palette.jsonTheme}
                      					  style={theme.palette.reactJsonStyle}
                      					  collapsed={true}
                      					  enableClipboard={(copy) => {
                      					    //handleReactJsonClipboard(copy);
                      					  }}
                      					  displayDataTypes={false}
                      					  onSelect={(select) => {
                      					    //HandleJsonCopy(showResult, select, data.action.label);
                      					    //console.log("SELECTED!: ", select);
                      					  }}
                      					  name={"value"}
                      					/>
										:
										data.value
									}
								/>
                                <ListItemText
                                    style={{
                                        maxWidth: 200,
                                        minWidth: 200,
										marginLeft: 50,
                                    }}
                                    primary=<span style={{ display: "inline" }}>
                                        <Tooltip
                                            title="Edit item"
                                            style={{}}
                                            aria-label={"Edit"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
                                                    onClick={() => {
                                                        setEditCache(true)
                                                        setDataValue({
															"key": data.key,
															"value":data.value
														})
														setValue(data.value)
                                                        setModalOpen(true)
                                                    }}
                                                >
                                                    <EditIcon
                                                        style={{ color: "white" }}
                                                    />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip
                                            title={"Public URL (types: text, raw, json)"}
                                            style={{ marginLeft: 0, }}
                                            aria-label={"Public URL"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
													disabled={data.public_authorization === undefined || data.public_authorization === null || data.public_authorization === "" ? true : false}
                                                    onClick={() => {
														window.open(`${globalUrl}/api/v1/orgs/${orgId}/cache/${data.key}?type=text&authorization=${data.public_authorization}`, "_blank");
                                                    }}
                                                >
													<LinkIcon
													/>
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip
                                            title={"Delete item"}
                                            style={{ marginLeft: 25, }}
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
								<ListItemText
									style={{
										maxWidth: 225,
										minWidth: 225,
									}}
									primary={new Date(data.edited * 1000).toISOString()}
								/>
                            </ListItem>
                        );
                    })}
            </List>
        </div>

    );
}
export default CacheView;
