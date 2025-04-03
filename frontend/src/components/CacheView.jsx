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
    Chip,
    Checkbox,
    MenuItem,
    DialogContent,
	FormControl,
	Select,
} from "@mui/material";

import {
	Link as LinkIcon,
    AutoFixHigh as AutoFixHighIcon,
    AutoFixNormal as AutoFixNormalIcon,
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
	Clear as ClearIcon,
	Add as AddIcon,
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
    const { globalUrl, userdata, serverside, orgId, isSelectedDataStore, selectedOrganization } = props;
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
    const [showDistributionPopup, setShowDistributionPopup] = useState(false);
    const [selectedSubOrg, setSelectedSubOrg] = useState([]);
    const [selectedCacheKey, setSelectedCacheKey] = useState("");

	// Direct category migration from ../components/Files.jsx
    const [selectAllChecked, setSelectAllChecked] = React.useState(false)
  	const [renderTextBox, setRenderTextBox] = React.useState(false);
  	const [fileCategories, setFileCategories] = React.useState(["default"]);
	const [selectedCategory, setSelectedCategory] = React.useState("default");
	const [selectedFileId, setSelectedFileId] = React.useState("");
    const [updateToThisCategory, setUpdateToThisCategory] = useState("")
	const [showFileCategoryPopup, setShowFileCategoryPopup] = React.useState(false);
  	const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        if (orgId?.length > 0) {
            listOrgCache(orgId, selectedCategory)
        }
    }, [orgId])

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        fileCategories.push(event.target.value);
        setSelectedCategory(event.target.value);
        setRenderTextBox(false);
      }

      if (event.key === 'Escape'){ // not working for some reasons
        console.log('escape pressed')
        setRenderTextBox(false);  
      }
    }


    const listOrgCache = (orgId, category) => {
		const url = `${globalUrl}/api/v1/orgs/${orgId}/list_cache${category !== undefined ? `?category=${category.replaceAll(" ", "%20")}` : ""}`
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
				console.log("Status not 200 for list cache :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.success === true) {
				setListCache(responseJson.keys);
                setCachedLoaded(true);

				if (fileCategories.length === 1 && fileCategories[0] === "default") {
					var newcategories = ["default"]
					for (var key in responseJson.keys) {
						var category = responseJson.keys[key].category
						if (category !== undefined && category !== null && category !== ""){
							category = category.replaceAll(" ", "_")

							if (!newcategories.includes(category)) {
								newcategories.push(category)
							}
						}
					}

					setFileCategories(newcategories)
				}
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
		const method = "POST"
        const url = `${globalUrl}/api/v1/orgs/${orgId}/delete_cache`
		const parsed = {
			"org_id": orgId,
			"key": key,
			"category": selectedCategory === "" || selectedCategory === "default" ? "" : selectedCategory,
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
                        listOrgCache(orgId, selectedCategory)
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
        const cache = { 
			key: dataValue.key, 
			value: value,
			category: selectedCategory, 
		}

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
                listOrgCache(orgId, selectedCategory);
                setModalOpen(false);
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const addOrgCache = (orgId) => {
        const cache = { 
			key: key, 
			value: value,
			category: selectedCategory, 
		}

        setCacheInput([cache]);

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
                toast("New key added Successfully!");
                listOrgCache(orgId, selectedCategory);
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
			toast.info("Invalid JSON.", {
				autoClose: 1500,
			})
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
                    { editCache ? "Edit Key" : "Add Key"}{selectedCategory === "" || selectedCategory === "default" ? "" : ` in category '${selectedCategory}'`}
                </span>

            </DialogTitle>
            <div style={{ paddingLeft: "30px", paddingRight: '30px', backgroundColor: "#212121", }}>
                Key
                <TextField
                    color="primary"
					disabled={editCache}
                    style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
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
							<AutoFixNormalIcon /> 
						</IconButton>
					</Tooltip>
				</div>
                <TextField
                    color="primary"
                    style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor, marginTop: 0, }}
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
                        setKey("")
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
                        if (value === "") {
                            toast("Key or Value can not be empty");
                            return;
                        }
                        {editCache ? editOrgCache(orgId) : addOrgCache(orgId)}
						setKey("")
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

    const handleSelectSubOrg = (id, action) => {
        if (action === "all") {
            const childOrgs = userdata.orgs.filter(
                (data) => data.creator_org === userdata.active_org.id
            );
            setSelectedSubOrg((prev) => {
                if (prev.length === childOrgs.length) {
                    // If all child orgs are already selected, clear the selection
                    return [];
                } else {
                    // Otherwise, select all child org IDs
                    return childOrgs.map((data) => data.id);
                }
            });
        } else if (action === "none") {
            setSelectedSubOrg([]);
        } else {
            setSelectedSubOrg((prev) => {
                if (prev.includes(id)) {
                    return prev.filter((data) => data !== id);
                } else {
                    return [...prev, id];
                }
            });
        }
    };

    const changeDistribution = (id, selectedSubOrg) => {	

		editFileConfig(id, [...new Set(selectedSubOrg)], selectedCategory)
	}


    const editFileConfig = (id, selectedSubOrg, category) => {
		const data = {
			Key: id,
			action: "suborg_distribute",
			selected_suborgs: selectedSubOrg,
			category: category === undefined || category === "" || category === "default" ? "" : category,
		}

		console.log("data: ", data);	
		
		const url = `${globalUrl}/api/v1/orgs/${orgId}/cache/config`;

		fetch(url, {
			mode: "cors",
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
			crossDomain: true,
			withCredentials: true,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		})
			.then((response) =>
				response.json().then((responseJson) => {
					if (responseJson["success"] === false) {
						toast("Failed overwriting datastore");
					} else {
						toast("Successfully updated datastore!");
						setTimeout(() => {
							listOrgCache(orgId, selectedCategory);
							setShowDistributionPopup(false);
						}, 1000);
					}
				})
			)
			.catch((error) => {
				toast("Err: " + error.toString());
			});
        };


    const cacheDistributionModal = showDistributionPopup ? (
        <Dialog
		open={showDistributionPopup}
		onClose={() => setShowDistributionPopup(false)}
		PaperProps={{
			sx: {
				borderRadius: theme?.palette?.DialogStyle?.borderRadius,
				border: theme?.palette?.DialogStyle?.border,
				fontFamily: theme?.typography?.fontFamily,
				backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
				zIndex: 1000,
				minWidth: "600px",
				minHeight: "320px",
				overflow: "auto",
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
			<div style={{ color: "rgba(255,255,255,0.9)" }}>
				Select sub-org to distribute Datastore key
			</div>
		</DialogTitle>
		<DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
			<MenuItem value="none" onClick={()=> {handleSelectSubOrg(null, "none")}}>None</MenuItem>
			<MenuItem value="all" onClick={()=> {handleSelectSubOrg(null, "all")}}>All</MenuItem>
			{userdata.orgs.map((data, index) => {
				if (data.creator_org !== userdata.active_org.id) {
					return null;
				}

				const imagesize = 22;
				const imageStyle = {
					width: imagesize,
					height: imagesize,
					pointerEvents: "none",
					marginRight: 10,
					marginLeft: data.id === userdata.active_org.id ? 0 : 20,
				};

				const image = data.image === "" ? (
					<img alt={data.name} src={theme.palette.defaultImage} style={imageStyle} />
				) : (
					<img alt={data.name} src={data.image} style={imageStyle} />
				);

				return (
					<MenuItem
						key={index}
						value={data.id}
						onClick={() => handleSelectSubOrg(data.id)}
						style={{ display: "flex", alignItems: "center" }}
					>
						<Checkbox
							checked={selectedSubOrg.includes(data.id)}
						/>
						{image}
						<span style={{ marginLeft: 8 }}>{data.name}</span>
					</MenuItem>
				);
			})}

			<div style={{ display: "flex", marginTop: 20 }}>
				<Button
					style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#ff8544"  }}
					onClick={() => setShowDistributionPopup(false)}
					color="primary"
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#1a1a1a", backgroundColor: "#ff8544", marginLeft: 10 }}
					onClick={() => {
						changeDistribution(selectedCacheKey, selectedSubOrg);
					}}
					color="primary"
				>
					Submit
				</Button>
			</div>
		</DialogContent>
		</Dialog>
    ) : null;

    return (
        <div style={{paddingBottom: isSelectedDataStore?null:250, minHeight: 1000, boxSizing: "border-box", width: isSelectedDataStore? "100%" :null, transition: "width 0.3s ease", padding:isSelectedDataStore?"27px 10px 27px 27px":null, height: isSelectedDataStore?"100%":null, color: isSelectedDataStore?'#ffffff':null, backgroundColor: isSelectedDataStore?'#212121':null, borderTopRightRadius: isSelectedDataStore?'8px':null, borderBottomRightRadius: isSelectedDataStore?'8px':null, borderLeft: "1px solid #494949" }}>
            {modalView}
            {cacheDistributionModal}
            <div style={{height: "100%", maxHeight: 1700, overflowY: "auto", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
              <div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'  }}>
              <div style={{ marginTop: isSelectedDataStore?null:20, marginBottom: 20 }}>
                <h2 style={{ display: isSelectedDataStore?null: "inline" }}>Shuffle Datastore {selectedCategory === "" || selectedCategory === "default" ? "" : `- Category '${selectedCategory}'`}</h2>
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
                Add Key 
            </Button>
            <Button
                style={{ marginLeft: 16, marginRight: 15, backgroundColor: isSelectedDataStore?"#2F2F2F":null, boxShadow: isSelectedDataStore ? "none":null,textTransform: isSelectedDataStore ? 'capitalize':null,borderRadius:isSelectedDataStore?4:null, width:isSelectedDataStore?81:null, height:isSelectedDataStore?40:null,  }}
                variant="contained"
                color="primary"
                onClick={() => listOrgCache(orgId,selectedCategory)}
            >
                <CachedIcon />
            </Button>

			{fileCategories !== undefined &&
				fileCategories !== null &&
				fileCategories.length > 1 ? (
					<FormControl style={{ minWidth: 150, maxWidth: 150 }}>
						<Select
							labelId="input-namespace-select-label"
							id="input-namespace-select-id"
							style={{
								color: "white",
								minWidth: 122,
								maxWidth: 122,
								height: 35,
								float: "right",
								position: 'relative',
								top: 8
							}}
							value={selectedCategory}
							onChange={(event) => {
								//if (selectAllChecked || listCache.length > 0) {
								if (selectAllChecked || selectedFiles.length > 0) {
									setUpdateToThisCategory(event.target.value)
									setShowFileCategoryPopup(true)
									return
								}

								setSelectedCategory(event.target.value)
								if (event.target.value === "all" || event.target.value === "default") {
    								listOrgCache(orgId) 
								} else {
    								listOrgCache(orgId, event.target.value)
								}
									

								// Add it to the url as a query
								if (window.location.search.includes("category=")) {
									const newurl = window.location.href.replace(/category=[^&]+/, `category=${event.target.value}`)
									window.history.pushState({ path: newurl }, "", newurl)
								} else {
									window.history.pushState({ path: window.location.href }, "", `${window.location.href}&category=${event.target.value}`)
								}
							}}
						>
							{fileCategories.map((data, index) => {
								return (
									<MenuItem
										key={index}
										value={data}
										style={{ color: "white" }}
									>
										{data.replaceAll("_", " ")}
									</MenuItem>
								);
							})}
						</Select>
						<Dialog 
							PaperProps={{
								sx: {
									borderRadius: theme?.palette?.DialogStyle?.borderRadius,
									border: theme?.palette?.DialogStyle?.border,
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
							open={showFileCategoryPopup} 
							onClose={() => {
								setShowFileCategoryPopup(false)
							}}
						>
							<DialogTitle>File Categories</DialogTitle>
							<DialogContent>
								Please note that your selected files ({selectedFileId?.length}) will be moved to the <kbd>{updateToThisCategory}</kbd> category.
							</DialogContent>
							<DialogActions>
								<Button 
									onClick={() => {
										setShowFileCategoryPopup(false)
									}} 
									style={{fontSize: 16, textTransform: 'none'}}
								>
									Close
								</Button>
								<Button 
									onClick={() => {
										//handleUpdateFileCategory(updateToThisCategory)
										toast.error("Not implemented.")
									}} 
									style={{fontSize: 16, textTransform: 'none', color: "#1a1a1a", backgroundColor: "#ff8544"}}
								>
									Update
								</Button>
							</DialogActions>
						</Dialog>
					</FormControl>
				) : null}

			<div style={{display: "inline-flex", position:"relative", top: 8}}>
				{renderTextBox ? 
					<Tooltip title={"Close"} style={{}} aria-label={""}>
						<Button
							style={{ marginLeft: 5, marginRight: 15, height: 35, borderRadius: 4, backgroundColor: "#494949", textTransform: 'none', fontSize: 16, color: "#f1f1f1" }}
							color="primary"
							onClick={() => {
								setRenderTextBox(false);
								console.log(" close clicked")
								}}
						>
							<ClearIcon/>
						</Button>
					</Tooltip>
					:
					<Tooltip title={"Add new file category"} style={{}} aria-label={""}>
						<Button
							style={{ marginLeft: 5, marginRight: 15, width: 169, height: 35, borderRadius: 4, backgroundColor: "#494949", textTransform: 'none', fontSize: 16, color: "#f1f1f1" }}
							color="primary"
							onClick={() => {
								setRenderTextBox(true);
								}}
						>
							<AddIcon/>
							Category (beta)
						</Button>
					</Tooltip> 
				}

				{renderTextBox && <TextField
					onKeyPress={(event)=>{
						handleKeyDown(event);
						if(event.key === 'Enter' && selectedFileId.length > 0){
							//setShowFileCategoryPopup(true)
							setUpdateToThisCategory(event.target.value)
						}
							
					}}
					style={{
						height: 35,
						width: 200,
						marginTop: 0,
					}}
					InputProps={{
						style: {
							color: "white",
							height: 35,
							fontSize: 16,
							borderRadius: 4,
							paddingTop: 0,
						},
					}}
					color="primary"
					placeholder="Category name"
					required
					margin="dense"
					defaultValue={""}
					autoFocus
				/>}</div>
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
                {["Key", "Value", "Actions", "Updated", "Distribution"].map((header, index) => (
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
                            {Array(5)
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
                        <ListItem style={{ display: "table-row" }}>
                            {Array(5).fill().map((_, index) => (
                                <ListItemText
                                    key={index}
                                    style={{
                                        display: "table-cell",
                                        padding: "8px",
                                        textAlign: index === 0 ? "center" : "left",
                                    }}
                                    primary={index === 2 ? "No key found." : null}
                                    colSpan={index === 0 ? 5 : undefined}
                                />
                            ))}
                        </ListItem>

                    ): listCache?.map((data, index) => {
						var category = selectedCategory 
						if (selectedCategory === "default") { 
							category = ""
						}

						if (data?.category === undefined && category === "") {
						} else if (data?.category !== category) {
							return null
						}

                        var bgColor = isSelectedDataStore? "#212121":"#27292d";
                        if (index % 2 === 0) {
                            bgColor = isSelectedDataStore? "#1A1A1A":"#1f2023";
                        }

              			const validate = validateJson(data.value);
                        const isDistributed = data?.suborg_distribution?.length > 0 ? true : false;
                        return (
                            <ListItem key={index} style={{display:'table-row', backgroundColor: bgColor, maxHeight: 300, overflow: "auto", borderBottomLeftRadius: listCache?.length - 1 === index ? 8 : 0, borderBottomRightRadius: listCache?.length - 1 === index ? 8 : 0,}}>
                                <ListItemText
                                    style={{
                                        display: "table-cell",
                                        overflow: "hidden",
                                        verticalAlign: "middle",
                                        padding: "8px 8px 8px 15px",
                                        maxWidth: 200,
                                        overflowX: "auto",
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
                                        maxWidth: 300,
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
                                            title={data?.org_id !== selectedOrganization.id ? "You can not edit this cache as it is controlled by parent organization." : "Edit this key" }
                                            style={{}}
                                            aria-label={"Edit"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
                                                    disabled={data.org_id !== selectedOrganization.id ? true : false}
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
                                            title={data?.org_id !== selectedOrganization.id ? "You can not access public URL for this key as it is controlled by parent organization." : "Public URL (types: text, raw, json)" }
                                            style={{ marginLeft: 0, }}
                                            aria-label={"Public URL"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
													disabled={data.public_authorization === undefined || data.public_authorization === null || data.public_authorization === "" || data.org_id !== selectedOrganization.id ? true : false}
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
                                            title={selectedOrganization?.id !== undefined && data?.org_id !== selectedOrganization.id ? "You can not delete this key as it is controlled by parent organization." : "Delete this key" }
                                            aria-label={"Delete"}
                                        >
                                            <span>
                                                <IconButton
                                                    style={{ padding: "6px" }}
                                                    disabled={selectedOrganization?.id === undefined ? false : data.org_id !== selectedOrganization.id ? true : false}
                                                    onClick={() => {
                                                        deleteCache(orgId, data.key);
                                                        //deleteFile(orgId);
                                                    }}
                                                >
                                                    <svg
															width="24"
															height="24"
															viewBox="0 0 24 24"
															xmlns="http://www.w3.org/2000/svg"
															style={{
																stroke: data.org_id === selectedOrganization.id ? "#fd4c62" : "#c8c8c8",
															}}
															>
															<path
																d="M5 7.20001H6.6H19.4"
																strokeLinecap="round"
																strokeLinejoin="round"
																fill="none"
															/>
															<path
																d="M17.7996 7.2V18.4C17.7996 18.8243 17.631 19.2313 17.331 19.5314C17.0309 19.8314 16.624 20 16.1996 20H8.19961C7.77526 20 7.3683 19.8314 7.06824 19.5314C6.76818 19.2313 6.59961 18.8243 6.59961 18.4V7.2M8.99961 7.2V5.6C8.99961 5.17565 9.16818 4.76869 9.46824 4.46863C9.7683 4.16857 10.1753 4 10.5996 4H13.7996C14.224 4 14.6309 4.16857 14.931 4.46863C15.231 4.76869 15.3996 5.17565 15.3996 5.6V7.2"
																strokeLinecap="round"
																strokeLinejoin="round"
																fill="none"
															/>
															</svg>
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
                                {selectedOrganization.id !== undefined && data?.org_id !== selectedOrganization.id ?
                                      <ListItemText
                                        primary={
                                            <Tooltip
                                          title="Parent organization controlled datastore. You can use, but not modify this key. Contact an admin of your parent organization if you need changes to this."
                                          placement="top"
                                      >
                                          <Chip
                                              label={"Parent"}
                                              variant="contained"
                                              color="secondary"
                                          />
                                      </Tooltip>
                                        }
                                        style={{display: "table-cell", textAlign: 'center', verticalAlign: 'middle', }}
                                        />
                                      :
                                      <ListItemText
                                        primary={
                                            <Tooltip
                                          title="Distributed to sub-organizations. This means the sub organizations can use this datastore key, but can not modify it."
                                          placement="top"
                                      >
                                          <Checkbox
                                              disabled={ userdata?.active_org?.role !== "admin" || (selectedOrganization.creator_org !== undefined && selectedOrganization.creator_org !== null && selectedOrganization.creator_org !== "" )? true : false}
                                              checked={isDistributed}
                                              style={{ margin: "auto" }}
                                              color="secondary"
                                              onClick={() => {
												setShowDistributionPopup(true)
												if(data?.suborg_distribution?.length > 0){
													setSelectedSubOrg(data.suborg_distribution)
												}else{
													setSelectedSubOrg([])
												}
												setSelectedCacheKey(data.key)
                                              }}
                                          />
                                      </Tooltip>
                                        }
                                        style={{display: "table-cell", textAlign: 'center', verticalAlign: 'middle', }}
                                        />
                                  }
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
