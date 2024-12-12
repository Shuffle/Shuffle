import React, { useState, useEffect, useContext, memo } from "react";
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
    Skeleton,
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
import { Context } from "../context/ContextApi.jsx";

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


const CacheView = memo((props) => {
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
    const [cachedLoaded, setCachedLoaded] = React.useState(false);
    const [show, setShow] = useState({});
    useEffect(() => {
        if(orgId?.length >0){
            listOrgCache(orgId);
        }
    }, [orgId]);

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
                setCachedLoaded(true);
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

    const handleReactJsonClipboard = (copy) => {
        const elementName = "copy_element_shuffle";
        let copyText = document.getElementById(elementName);
    
        if (copyText) {
          if (copy.namespace && copy.name && copy.src) {
            copy = copy.src;
          }
    
          const clipboard = navigator.clipboard;
          if (!clipboard) {
            toast("Can only copy over HTTPS (port 3443)");
            return;
          }
    
          let stringified = JSON.stringify(copy);
          if (stringified.startsWith('"') && stringified.endsWith('"')) {
            stringified = stringified.slice(1, -1);
          }
    
          navigator.clipboard.writeText(stringified);
          toast("Copied value to clipboard, NOT json path.");
        } else {
          console.log("Failed to copy from " + elementName + ": ", copyText);
        }
      };


    const modalView = (
        // console.log("key:", dataValue.key),
        //console.log("value:",dataValue.value),
        <Dialog
            open={modalOpen}
            onClose={() => {
                setModalOpen(false);
            }}
            PaperProps={{
                sx: {
                    borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                    border: theme?.palette?.DialogStyle?.border,
                    minWidth: "800px",
                    minHeight: "320px",
                    fontFamily: theme?.typography?.fontFamily,
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    zIndex: 1000,
                    '& .MuiDialogContent-root': {
                      backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    },
                    '& .MuiDialogTitle-root': {
                      backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    },
                    '& .MuiDialogActions-root': {
                      backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    },
                },
            }}
        >
            <DialogTitle>
                <span style={{ color: "white" }}>
                    { editCache ? "Edit Cache" : "Add Cache" }
                </span>
            </DialogTitle>
            <div style={{ paddingLeft: "30px", paddingRight: '30px', backgroundColor: "#212121", }}>
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
            <div style={{ paddingLeft: 30, paddingRight: 30, backgroundColor: "#212121" }}>
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
                    style={{ borderRadius: "2px", fontSize: 16, color: "#ff8544", textTransform:"none" }}
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
                    style={{ borderRadius: "2px", backgroundColor: "#ff8544",color: "#1a1a1a", textTransform:"none" }}
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
        <div style={{paddingBottom: isSelectedDataStore?null:250, minHeight: 1000, boxSizing: "border-box", width: isSelectedDataStore? "100%" :null, transition: "width 0.3s ease", padding:isSelectedDataStore?"27px 10px 27px 27px":null, height: isSelectedDataStore?"100%":null, color: isSelectedDataStore?'#ffffff':null, backgroundColor: isSelectedDataStore?'#212121':null, borderTopRightRadius: isSelectedDataStore?'8px':null, borderBottomRightRadius: isSelectedDataStore?'8px':null, borderLeft: "1px solid #494949" }}>
            {modalView}
            <div style={{height: "100%", maxHeight: 1700, overflowY: "auto", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
              <div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'  }}>
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
                style={{backgroundColor: isSelectedDataStore? "#ff8544":null, fontSize: 16, boxShadow: isSelectedDataStore ? "none":null,textTransform: isSelectedDataStore ? 'capitalize':null, color:isSelectedDataStore?"#1a1a1a":null, borderRadius:isSelectedDataStore?4:null, width:isSelectedDataStore?162:null, height:isSelectedDataStore?40:null}}
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
                style={{ marginLeft: 16, marginRight: 15, backgroundColor: isSelectedDataStore?"#2F2F2F":null, boxShadow: isSelectedDataStore ? "none":null,textTransform: isSelectedDataStore ? 'capitalize':null,borderRadius:isSelectedDataStore?4:null, width:isSelectedDataStore?81:null, height:isSelectedDataStore?40:null,  }}
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
            <div
                style={{
                borderRadius: 4,
                marginTop: 24,
                border: "1px solid #494949",
                width: "100%",
                overflowX: "auto", 
                paddingBottom: 0,
                }}
            >
            <List 
             style={{
                borderRadius: 4,
                paddingBottom: 0,
                tableLayout: "auto", 
                display: "table", 
                width: '100%',
                minWidth: 800,
                overflowX: "auto",
             }}>
                <ListItem style={{width: isSelectedDataStore?"100%":null, borderBottom:isSelectedDataStore?"1px solid #494949":null, display: "table-row"}}>
                {["Key", "Value", "Actions", "Updated"].map((header, index) => (
                        <ListItemText
                            key={index}
                            primary={header}
                            style={{
                                display: "table-cell",
                                padding: index === 0 ? "0px 8px 8px 15px": "0px 8px 8px 8px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                borderBottom: "1px solid #494949"
                            }}
                        />
                    ))}
                </ListItem>
                {cachedLoaded === false
                    ? [...Array(6)].map((_, rowIndex) => (
                        <ListItem
                            key={rowIndex}
                            style={{
                                display: "table-row",
                                backgroundColor: "#212121",
                            }}
                        >
                            {Array(4)
                                .fill()
                                .map((_, colIndex) => (
                                    <ListItemText
                                        key={colIndex}
                                        style={{
                                            display: "table-cell",
                                            padding: "8px",
                                        }}
                                    >
                                        <Skeleton
                                            variant="text"
                                            animation="wave"
                                            sx={{
                                                backgroundColor: "#1a1a1a",
                                                height: "20px",
                                                borderRadius: "4px",
                                            }}
                                        />
                                    </ListItemText>
                                ))}
                        </ListItem>
                    ))
                    : listCache?.length === 0 ? (
                        <Typography style={{ textAlign: "center", marginTop: 20, marginBottom: 20, minWidth: 1000, }}>
                            No Keys Found
                        </Typography>
                    ): listCache?.map((data, index) => {
                        var bgColor = isSelectedDataStore? "#212121":"#27292d";
                        if (index % 2 === 0) {
                            bgColor = isSelectedDataStore? "#1A1A1A":"#1f2023";
                        }

              			const validate = validateJson(data.value);
                        return (
                            <ListItem key={index} style={{display:'table-row', backgroundColor: bgColor, maxHeight: 300, overflow: "auto", borderBottomLeftRadius: listCache?.length - 1 === index ? 8 : 0, borderBottomRightRadius: listCache?.length - 1 === index ? 8 : 0,}}>
                                <ListItemText
                                    style={{
                                        display: "table-cell",
                                        overflow: "hidden",
                                        verticalAlign: "middle",
                                        padding: "8px 8px 8px 15px"
                                    }}
                                    primary={data.key}
                                />
                                <ListItemText
                                    style={{
										display: "table-cell",
                                        overflowY: "auto",
                                        overflowX: "auto",
                                        borderRadius: 4,
                                        padding: "15px 5px",
                                        maxHeight: 300,
                                        verticalAlign: "middle",
									}}
                                    primary={validate.valid ?
                                            <ReactJson
                                                src={validate.result}
                                                theme={theme.palette.jsonTheme}
                                                style={{
                                                    padding: 5,
                                                    maxHeight: 300,
                                                    overflowY: "auto",
                                                    backgroundColor: "#151515",
                                                    border: "1px solid rgba(255,255,255,0.7)",
                                                }}
                                                collapsed={true}
                                                enableClipboard={(copy) => {
                                                    // handleReactJsonClipboard(copy);
                                                }}
                                                collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
                                                iconStyle={theme.palette.jsonIconStyle}
                                                displayDataTypes={false}
                                                onSelect={(select) => {
                                                    // HandleJsonCopy(showResult, select, data.action.label);
                                                    console.log("SELECTED!: ", select);
                                                }}
                                                name={"value"}
                                                />
										:
										data.value
									}
								/>
                                <ListItemText
                                    style={{
                                        display: "table-cell",
                                        verticalAlign: "middle",
                                        padding: 8
                                    }}
                                    primary={(
                                        <span style={{ display: "inline" }}>
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
                                                    <img src="/icons/editIcon.svg" alt="edit" />
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
                                                    <img src="/icons/deleteIcon.svg" alt="delete" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </span>
                                    )}
                                />
								<ListItemText
									style={{
										display: "table-cell",
                                        verticalAlign: "middle",
                                        padding: 8
									}}
									primary={new Date(data.edited * 1000).toISOString()}
								/>
                            </ListItem>
                        );
                    })}
            </List>
            </div>
              </div>
            </div>
        </div>
    );
});

export default memo(CacheView);
