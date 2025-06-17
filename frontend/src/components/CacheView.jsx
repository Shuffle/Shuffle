import React, { useState, useEffect, useContext, memo } from "react";
import { makeStyles } from "@mui/styles";
import { getTheme } from "../theme.jsx";
import { toast } from 'react-toastify';

import ReactJson from "react-json-view-ssr";
import { GetIconInfo } from "../views/Workflows2.jsx";
import { red } from "../views/AngularWorkflow.jsx";
import CollectIngestModal from "../components/CollectIngestModal.jsx";
import {
	Typography,
    Tooltip,
    Divider,
    TextField,
    Button,
    Tabs,
    Tab,
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
	Autocomplete,
	ButtonGroup,
	InputLabel,
	Pagination,
	PaginationItem,
} from "@mui/material";

import { 
	DataGrid, 
	GridColDef,
} from '@mui/x-data-grid';

import {
	Link as LinkIcon,
    AutoFixHigh as AutoFixHighIcon,
    AutoFixNormal as AutoFixNormalIcon,
    Edit as EditIcon,
    FileCopy as FileCopyIcon,
    SelectAll as SelectAllIcon,
	DeleteOutline as DeleteOutlineIcon,
    OpenInNew as OpenInNewIcon,
    CloudDownload as CloudDownloadIcon,
    Description as DescriptionIcon,
    Polymer as PolymerIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Apps as AppsIcon,
    Image as ImageIcon,
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
	Rocket as RocketIcon, 
	Webhook as WebhookIcon, 
	Air as AirIcon, 
	RocketLaunch as RocketLaunchIcon, 
	Send as SendIcon,
	SmartToy as SmartToyIcon,
	Settings as SettingsIcon,
	FilterAlt as FilterAltIcon,
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

const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important",
	},
});

// 

//const CacheView = (props) => {
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
    const [dataValue, setDataValue] = React.useState({});
    const [editCache, setEditCache] = React.useState(false);
    const [cachedLoaded, setCachedLoaded] = React.useState(false);
    const [show, setShow] = useState({});
    const [showDistributionPopup, setShowDistributionPopup] = useState(false);
    const [selectedSubOrg, setSelectedSubOrg] = useState([]);
    const [selectedCacheKey, setSelectedCacheKey] = useState("");
	const [totalAmount, setTotalAmount] = useState(0);
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(50)
	const [cursors, setCursors] = useState({
		0: "",
	})
	const [_, setUpdate] = useState(Math.random()) 
	const [selectedRows, setSelectedRows] = useState([]);

	// Direct category migration from ../components/Files.jsx
    const [selectAllChecked, setSelectAllChecked] = React.useState(false)
  	const [renderTextBox, setRenderTextBox] = React.useState(false);
  	const [datastoreCategories, setDatastoreCategories] = React.useState(["default"]);
	const [selectedCategory, setSelectedCategory] = React.useState("default");
	const [selectedFileId, setSelectedFileId] = React.useState("");
    const [updateToThisCategory, setUpdateToThisCategory] = useState("")
	const [workflows, setWorkflows] = useState([]);

    const [selectedFiles, setSelectedFiles] = useState([]);
	const [showAutomationMenu, setShowAutomationMenu] = useState(false);
	const [showSettingsMenu, setShowSettingsMenu] = useState(false);
	const [showCollectIngestMenu, setShowCollectIngestMenu] = useState(false);

	const defaultAutomation = [
		{
			"name": "Run workflow",
			"description": "Runs a workflow with the updated value.",
			"options": [{
				"key": "workflow_id",
				"value": "",
			}],
			"icon": <AirIcon />, 
			"enabled": false,
		},
		{
			"name": "Send message",
			"description": "",
			"type": "singul",
			"options": [{
				"key": "app",
				"value": "",
			}],
			"icon": <SendIcon />,
			"disabled": true,
			"enabled": false,
		},
		{
			"name": "Enrich",
			"description": "",
			"type": "singul",
			"options": [{
				"key": "",
				"value": "",
			}],
			"icon": "/images/logos/singul.svg",
			"enabled": false,
			"disabled": true,
		},
		{
			"name": "Run AI Agent",
			"description": "",
			"options": [{
				"key": "",
				"value": "",
			}],
			"icon": <SmartToyIcon />,
			"enabled": false,
			"disabled": true,
		},
		{
			"name": "Send webhook",
			"description": "Sends the updated value to a specified webhook URL.",
			"options": [{
				"key": "webhook_url",
				"value": "",
			}],
			"icon": <WebhookIcon />, 
			"enabled": false,
		},
	]

	const [categoryAutomations, setCategoryAutomations] = useState(defaultAutomation)
	const [categoryConfig, setCategoryConfig] = useState(undefined)
    
    const { themeMode, brandColor } = useContext(Context);
    const theme = getTheme(themeMode, brandColor);
	const classes = useStyles();


	const getWorkflows = () => {
		const url = `${globalUrl}/api/v1/workflows`
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
				console.log("Status not 200 for workflows :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson?.success !== true) {
				setWorkflows(responseJson)
			} else {
				toast.warn("Failed to load workflows. Please try again or contact support@shuffler if this persists.")
			}
		})
		.catch((error) => {
			toast(error.toString());
		});
	}

	useEffect(() => {
		setCursors({
			0: "",
		})
		setPage(0)
		setSelectedRows([])
	}, [selectedCategory])

    useEffect(() => {
		getWorkflows()
        listOrgCache(orgId, selectedCategory, 0, pageSize, page)
    }, [])


    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        datastoreCategories.push(event.target.value);
        setSelectedCategory(event.target.value);
        setRenderTextBox(false);
      }

      if (event.key === 'Escape'){ // not working for some reasons
        console.log('escape pressed')
        setRenderTextBox(false);  
      }
    }

    const listOrgCache = (orgId, category, index, amount, page, keyValue) => {
        setCachedLoaded(false)
		if (index === undefined || index === null) {
			index = 0
		}

		var url = `${globalUrl}/api/v1/orgs/${orgId}/list_cache`

		if (category !== undefined && category !== null && category !== "default" && category !== "") {
			url += "?category=" + category.replaceAll(" ", "_")
		} else {
			url += "?category=default"
			category = "default"
		}

		if (amount !== undefined && amount !== null && amount > 0) {
			url += "&top=" + amount
		}

		if (page !== undefined && page !== null && page >= 0) {
			if (cursors[page-1] !== undefined && cursors[page-1] !== null && cursors[page-1] !== "") {
				url += "&cursor=" + cursors[page-1] 
			}
		}

		if (keyValue !== undefined && keyValue !== null && keyValue !== "") {
			url += "&key=" + keyValue

			setCursors({
				0: "",
			})
			setPage(0)
			setSelectedRows([])
		}

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
            setCachedLoaded(true);
			if (responseJson?.success === true) {
				setListCache(responseJson.keys)

				if (responseJson.total_amount !== undefined && responseJson.total_amount !== null && responseJson.total_amount > 0) {
					setTotalAmount(responseJson.total_amount)
				} else {
					setTotalAmount(responseJson.keys.length)
				}

				if (responseJson?.cursor !== undefined && responseJson?.cursor !== null && responseJson?.cursor !== "") {
					cursors[page] = responseJson.cursor
				}

				// Especially important during first load
				if (index < 2 && (category === "default" || category === "" || category === undefined)) { 
					// If it exists and isn't blank/default, load it 
					const urlParams = new URLSearchParams(window.location.search);
					const categoryParam = urlParams.get("category");
					if (categoryParam && categoryParam !== undefined && categoryParam !== "default" && categoryParam !== "") {
						setSelectedCategory(categoryParam);
						if (index === undefined || index === null) {
							index = 0
						}
	
						listOrgCache(orgId, categoryParam, index+1, amount, page)
					} else {
						setSelectedCategory("default");
					}
				}

				if ((category === undefined || category === "default" || category === "") && datastoreCategories.length === 1 && datastoreCategories[0] === "default") {
					var newcategories = ["default"]
					for (var key in responseJson.keys) {
						var foundcategory = responseJson.keys[key].category
						if (foundcategory !== undefined && foundcategory !== null && foundcategory !== ""){
							foundcategory = category.replaceAll(" ", "_")

							if (!newcategories.includes(foundcategory)) {
								newcategories.push(foundcategory)
							}
						}
					}

					if (responseJson?.categories !== undefined && responseJson?.categories !== null && responseJson?.categories.length > 0) {
						for (var i = 0; i < responseJson.categories.length; i++) {
							const foundcategory = responseJson.categories[i].replaceAll(" ", "_")
							if (foundcategory !== undefined && foundcategory !== null && foundcategory !== "" && foundcategory !== "default" && !newcategories.includes(foundcategory)) {
								newcategories.push(responseJson.categories[i]);
							}
						}
					}

					setDatastoreCategories(newcategories)
				}


				if (responseJson?.category_config !== undefined && responseJson?.category_config !== null) {

					if (responseJson?.category_config?.id !== undefined && responseJson?.category_config?.id !== null && responseJson?.category_config?.id !== "") {
						setCategoryConfig(responseJson.category_config)
					}

					// Handle other configs here.
					if (responseJson?.category_config?.automations !== undefined && responseJson?.category_config?.automations !== null && responseJson?.category_config?.automations.length > 0) {
						// Find icons if they exist
						for (var key in responseJson.category_config.automations) {
							//if (responseJson.category_config.automations[key].icon === undefined || responseJson.category_config.automations[key].icon === null || responseJson.category_config.automations[key].icon === "") {
							const foundItem = defaultAutomation.find((automation) => automation.name === responseJson.category_config.automations[key].name)
							if (foundItem) {
								responseJson.category_config.automations[key].disabled = foundItem.disabled
								responseJson.category_config.automations[key].icon = foundItem.icon
								responseJson.category_config.automations[key].type = foundItem?.type
							} else {
								responseJson.category_config.automations[key].icon = <RocketIcon />
							}
						}

						for (var key in defaultAutomation) {
							if (!responseJson.category_config.automations.some((automation) => automation.name === defaultAutomation[key].name)) {
								// If the automation doesn't exist in the response, add it with default values
								responseJson.category_config.automations.push(defaultAutomation[key])
							}
						}

						setCategoryAutomations(responseJson.category_config.automations)
					} else {
						setCategoryAutomations(defaultAutomation)
					}
				} 
			} else {
				toast.warn("Failed to load keys. Please try again or contact support@shuffler if this persists.")
			}
		})
		.catch((error) => {
			toast(error.toString());
		});
    };


    const deleteEntry = (orgId, key, itemCategory, refreshList) => {
		const method = "POST"
        const url = `${globalUrl}/api/v1/orgs/${orgId}/delete_cache`
		var parsed = {
			"org_id": orgId,
			"key": key,
			"category": selectedCategory === "" || selectedCategory === "default" ? "" : selectedCategory,
		}

		if (itemCategory !== undefined) {
			parsed["category"] = itemCategory.replaceAll(" ", "_");
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
					if (refreshList === undefined || refreshList === null || refreshList === true) {

                    	toast.success("Deleted datastore entry");
						setTimeout(() => {
							listOrgCache(orgId, selectedCategory, 0, pageSize, page)
						}, 1000);
					}
                } else {
                    toast.error(`Failed deleting entry ${key} in category ${itemCategory || selectedCategory}. If this persists, please contact support@shuffler.io.`)
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const editOrgCache = (orgId) => {
        var entry = { 
			key: dataValue.key, 
			value: value,
			category: selectedCategory,
		}

		if (dataValue?.category !== "" && dataValue?.category !== "default") {
			entry.category = dataValue.category.replaceAll(" ", "_");

		}

        if (listCache.length > 0) {
            const selectedCache = listCache.find((data) => data.key === dataValue.key);
            if (selectedCache?.suborg_distribution?.length > 0) {
                entry.suborg_distribution = selectedCache.suborg_distribution;
            }
        }

        setCacheInput([entry]);

        fetch(globalUrl + `/api/v1/orgs/${orgId}/set_cache`, {

            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify(entry),
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
                toast.success("Edit saved");
                listOrgCache(orgId, selectedCategory, 0, pageSize, page);
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
                listOrgCache(orgId, selectedCategory, 0, pageSize, page);
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


	const timestamp = (timestamp) => {
		if (timestamp === undefined || timestamp === null || timestamp === "") {
			return null
		}

		const date = new Date(timestamp * 1000);
		if (date.toString() === "Invalid Date" || date.toString() === "Invalid Date NaN") {
			return null
		}

		return date.toISOString()?.slice(0, 19)?.replace("T", " ")
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
                <span style={{ color: theme.palette.text.primary }}>
                    { editCache ? "Edit Key" : "Add Key"}{selectedCategory === "" || selectedCategory === "default" ? "" : ` in category '${selectedCategory}'`}
                </span>

            </DialogTitle>
            <div style={{ paddingLeft: "30px", paddingRight: '30px', backgroundColor: theme.palette.DialogStyle.backgroundColor, }}>
                Key
                <TextField
                    color="primary"
					disabled={editCache}
                    style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
                    autoFocus
                    InputProps={{
                        style: {
                            height: "50px",
                            color: theme.palette.textFieldStyle.color,
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
            <div style={{ paddingLeft: 30, paddingRight: 30, backgroundColor: theme.palette.DialogStyle.backgroundColor }}>
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
                            color: theme.palette.textFieldStyle.color,
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


				{editCache ? 
					<div>
						<Typography variant="body2" color="textSecondary" style={{ marginTop: 10, }}>
							Created: {timestamp(dataValue?.created)}
						</Typography>
						<Typography variant="body2" color="textSecondary" style={{ }}>
							Edited: {timestamp(dataValue?.edited)}
						</Typography>
						{dataValue?.workflow_id !== "" ?
							<Typography variant="body2" color="textSecondary" style={{ }}>
								Workflow: {dataValue.workflow_id}
							</Typography>
						: null}
						{dataValue?.category !== "" && dataValue?.category !== "default" ?
							<Typography variant="body2" color="textSecondary" style={{ }}>
								Category: {dataValue.category}
							</Typography>
						: null}

					</div>
				: null}
            </div>
            <DialogActions style={{ paddingLeft: "30px", paddingRight: '30px' }}>
                <Button
                    style={{ borderRadius: "2px", fontSize: 16, color: theme.palette.primary.main, textTransform:"none" }}
                    onClick={() => {
						setModalOpen(false)
                        setKey("")
						setValue("")
						setDataValue({})
					}}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "2px", textTransform:"none" }}
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
						toast.error("Failed overwriting datastore");
					} else {
						toast.success("Successfully updated datastore!");
						setTimeout(() => {
							listOrgCache(orgId, selectedCategory, 0, pageSize, page);
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
			<Typography variant="h5" color="textPrimary">
				Select sub-org to distribute Datastore key
			</Typography>
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
					style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: theme.palette.primary.main  }}
					onClick={() => setShowDistributionPopup(false)}
					color="primary"
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, marginLeft: 10 }}
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

	const saveAutomation = (allAutomation, settings) => {
		// Check if icon is a string. Otherwise make it empty.
		var removedIcons = {}
		allAutomation.forEach((automation) => {
			const originalIcon = automation.icon
			if (typeof automation.icon !== "string") {
				automation.icon = "";
			} 
		})

		const url = `${globalUrl}/api/v2/datastore/automate`
		const data = {
			"category": selectedCategory === "" || selectedCategory === "default" ? "" : selectedCategory,
			"automations": allAutomation,
		}

		if (settings !== undefined && settings !== null && Object.keys(settings).length > 0) {
			data["settings"] = settings 
		}

		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(data),
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for automations :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson?.success === true) {
				toast.success("Saved successfully!")
			} else {
				toast.warn("Failed to save automations. Please try again or contact support@shuffler if this persists.")
			}
		})
		.catch((error) => {
			toast.error(error.toString());
		})
	}


	const AutomationOptions = ({ automation, index }) => {
		const [showOptions, setShowOptions] = useState(false);
		const [hovered, setHovered] = useState(false);

		const [updated, setUpdated] = useState(false);
		const [updatedAutomation, setUpdatedAutomation] = useState(automation);
		const [_, setUpdate] = useState(Math.random()) // Force re-render

		if (automation.icon === undefined || automation.icon === null || automation.icon === "") {
			for (var i = 0; i < defaultAutomation.length; i++) {
				if (defaultAutomation[i].name === automation.name) {
					automation.icon = defaultAutomation[i].icon
					break;
				}
			}
		}

		const runSave = () => { 
			setUpdated(false)

			const newAutomations = [...categoryAutomations]
			newAutomations[index] = updatedAutomation

			setCategoryAutomations(newAutomations)
			setUpdate(Math.random()) // Force re-render

			saveAutomation(newAutomations)
		}

		return (
			<div key={index} style={{ 
					marginBottom: 10, 
					backgroundColor: hovered ? theme.palette.hoverColor : "transparent",
					paddingTop: 5, 
				}} 
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<div style={{display: "flex", }}>
					<Tooltip title={automation.enabled ? "Disable Automation" : "Enable Automation"} style={{}} aria-label={""}>
						<Checkbox
							style={{ marginRight: 10, marginTop: -10, }}
							checked={automation.enabled}
							// Check if automation options have a value
							disabled={automation?.disabled === true || automation.options.length === 0 || automation.options.some((option) => option.value === "")}
							onChange={(e) => {
								e.stopPropagation()
								e.preventDefault()

								updatedAutomation.enabled = !updatedAutomation.enabled
								setUpdatedAutomation(updatedAutomation)
								setUpdated(true)

								setUpdate(Math.random()) 
							}}
						/>
					</Tooltip>
					<div 
						style={{
							display: "flex",
							cursor: !automation?.disabled ? "pointer" : "not-allowed",
							width: "100%", 
						}}
						disabled={automation?.disabled === true}
						onClick={() => {
							if (automation?.disabled === true) {
								return
							}

							setShowOptions(!showOptions)

							// Auto saves when the options are closed/saved
							if (updated && showOptions) {
								runSave()
							}
						}}
					>
						{typeof automation?.icon === "string" && automation?.icon?.length > 0 ? 
							<img src={automation.icon} alt={automation.name} style={{ width: 20, height: 20, }} />
							:
							automation.icon
						}

						<Typography variant="body1" style={{ 
							color: automation?.disabled === true ? theme.palette.text.secondary : theme.palette.text.primary, 
							marginLeft: 10, 
						}}>
							{automation.name}
						</Typography>
					</div>

					{automation?.disabled !== true ? 
						<Button
							style={{ 
								borderRadius: theme.palette.borderRadius,
								textTransform: 'none', 
								color: updated ? theme.palette.primary.main : theme.palette.text.secondary,
								marginTop: -6,

								position: "absolute",
								right: 25, 
							}}
							disabled={!updated}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();

								runSave()
							}}
						>
							Save
						</Button>
					: null}
				</div>

				{showOptions && (
					updatedAutomation.options.map((option, optionIndex) => {
						if (option?.key === "workflow_id") {
							return ( 
								<Autocomplete
									key={optionIndex}

									multiple
									label="Find a workflow"
									id="workflow_search"
									autoHighlight
									freeSolo
									value={workflows?.filter(w => option?.value.includes(w.id)) || []}
									classes={{ inputRoot: classes.inputRoot }}
									ListboxProps={{
										style: {
											backgroundColor: theme.palette.surfaceColor,
											color: theme.palette.text.primary,
											borderRadius: theme.palette.borderRadius,
										},
									}}
									onChange={(event, newValue) => {
										option.value = ""
										for (var i = 0; i < newValue.length; i++) {
											option.value += newValue[i].id + ","
										}

										if (newValue.length > 0) {
											updatedAutomation.enabled = true
										} else {
											updatedAutomation.enabled = false 
										}

										updatedAutomation.options[optionIndex] = option
										setUpdatedAutomation(updatedAutomation)
										setUpdated(true)

										setUpdate(Math.random()) // Force re-render
									}}

									getOptionLabel={(option) => {
										if (
											option === undefined ||
											option === null ||
											option?.name === undefined ||
											option?.name === null
										) {
											return "No Workflows Selected";
										}

										const newname = (
											option.name.charAt(0).toUpperCase() + option.name.substring(1)
										).replaceAll("_", " ")

										return newname
									}}
									options={workflows}
									fullWidth
									style={{
										backgroundColor: theme.palette.textFieldStyle.backgroundColor,
										borderRadius: theme.palette.textFieldStyle.borderRadius,
										color: theme.palette.textFieldStyle.color,
										height: 35,
										marginBottom: 40,
									}}
									renderOption={(props, data, state) => {
										/*
										if (data.id === option?.value) {
											data = workflow;
										}
										*/

										return (
											<Tooltip arrow placement="left" title={
												<span style={{}}>
													{data.image !== undefined && data.image !== null && data.image.length > 0 ?
														<img src={data.image} alt={data.name} style={{ backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette?.borderRadius, }} />
														: null}
													<Typography>
														Choose {data.name}
													</Typography>
												</span>
											} >
												<MenuItem
													{...props}
													style={{
														backgroundColor: theme.palette.surfaceColor,
														color: data.id === option?.value ? "red" : theme.palette.text.primary,
														borderBottom: data.id === "parent" ? "2px solid rgba(255,255,255,0.5)" : null
													}}
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
												{...params}
												style={{
													backgroundColor: theme.palette.textFieldStyle.backgroundColor,
													color: theme.palette.textFieldStyle.color,
													borderRadius: theme.palette.textFieldStyle.borderRadius,
													height: 35,
													fontSize: 16,
													marginTop: "16px"
												}}
												InputProps={{
													...params.InputProps,
													style: {
														height: 35,
														display: "flex",
														alignItems: "center",
														padding: "0px 8px",
														fontSize: 16,
														borderRadius: 4,
													},
													inputProps: {
														...params.inputProps,
														style: {
															height: "100%",
															boxSizing: "border-box",
														}

													}
												}}
												variant="outlined"
												placeholder="Select workflows to run"
											/>
										)
									}}
								/>
							)
						}

						return (
							<TextField
								key={optionIndex}
								fullWidth
								style={{
									...theme.palette.textFieldStyle,
									marginBottom: 20, 
									marginTop: 10, 
								}}
            					InputProps={{
								  style: {
									backgroundColor: theme.palette.textFieldStyle.backgroundColor,
									color: theme.palette.textFieldStyle.color,
								  },
								}}
								label={option.key}
								defaultValue={option.value}
								onBlur={(e) => {
									if (e.target.value === "") {
										updatedAutomation.enabled = false 
									} else {
										updatedAutomation.enabled = true 
									}

									updatedAutomation.options[optionIndex].value = e.target.value;
									setUpdatedAutomation(updatedAutomation)
									setUpdated(true)
								}}
							/>
						)
					})
				)}
			</div>
		)
	}


	const setCategorySettingsField = (field, value) => {
		// Check if categoryConfig.settings is set or not. Otherwise set it.
		var categoryConfig2 = categoryConfig 
		if (categoryConfig === undefined || categoryConfig === null) {
			categoryConfig2 = {}
		}

		if (categoryConfig?.settings === undefined || categoryConfig?.settings === null) {
			categoryConfig2.settings = {}
		}

		categoryConfig2.settings[field] = value
		setCategoryConfig(categoryConfig2)

		saveAutomation(
			categoryAutomations, 
			categoryConfig2.settings,
		)
	}

	const columns: GridColDef<(typeof rows)[number]>[] = [
	  { 
		  field: 'key', 
		  headerName: 'Key', 
		  width: 200, 
		  filterable: true,
		  sortable: true,
	  },
	  {
		width: 600,
		field: 'value',
		filterable: true,
		headerName: 'Value',
		renderCell: (props) => {
			const data = props.row
        	const validate = validateJson(data.value)

			return (
				<div onClick={(e) => {
					e.preventDefault()
					e.stopPropagation()
				}}
				>
					{validate.valid ?
						<ReactJson
							id={"reactjson_" + data.key}
							src={validate.result}
							theme={theme.palette.jsonTheme}
							style={{
								...theme.palette.reactJsonStyle,
								backgroundColor: theme.palette.platformColor,
								border: theme.palette.defaultBorder,
								padding: 5,
								minWidth: 600, 
								maxHeight: 600,
								overflowY: "auto",
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
							name={null}
							/>
					:
					<Typography variant="body2" style={{maxHeight: 200, overflow: "hidden", }}>
						{data.value}
					</Typography>
					}
				</div>
			)
		}
	  },
	  {
		field: 'actions',
		headerName: 'Actions',
		description: 'Actions for this key.',
		width: 175,
		filterable: false,
		  sortable: false,

		renderCell: (props) => {
			const data = props.row

			return ( 
				<span style={{ display: "flex" }}>
					{data?.workflow_id === "" || data?.workflow_id === null || data?.workflow_id === undefined ?
						<IconButton
							disabled={data.workflow_id?.length === 0}
							style={{}}
						>
							<OpenInNewIcon
								style={{
									color:
										data.workflow_id?.length !== 0
											? "#FF8444"
											: "grey",
								}}
							/>
						</IconButton>
						: (
						<Tooltip
							title={"Go to workflow"}
							style={{}}
							aria-label={"Download"}
						>
							<span>
								<a
									rel="noopener noreferrer"
									style={{
										textDecoration: "none",
											color: "#f85a3e",
										}}
										href={`/workflows/${data.workflow_id}`}
										target="_blank"
									>
										<IconButton
											disabled={data.workflow_id?.length ===0}
											style={{marginLeft: 10}}
										>
											<OpenInNewIcon
												style={{
													width: 24, height: 24,
													color:
														data.workflow_id?.length !== 0
															? "#FF8444"
															: "grey",
												}}
											/>
										</IconButton>
									</a>
								</span>
							</Tooltip>
						)}

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
										// Try to make the value JSON indented 
										const valid = validateJson(data.value)
										var newvalue = data.value
										if (valid.valid) {
											// JSON stringify with indentation
											newvalue = JSON.stringify(valid.result, null, 2)
										}


										setEditCache(true)
										setDataValue({
											"key": data.key,
											"value": newvalue,

											"edited": data.edited,
											"created": data.created,
											"workflow_id": data.workflow_id,
											"category": data.category,
										})
										setValue(newvalue)
										setModalOpen(true)
									}}
								>
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										>
										<path
											d="M16.1038 4.66848C16.3158 4.45654 16.5674 4.28843 16.8443 4.17373C17.1212 4.05903 17.418 4 17.7177 4C18.0174 4 18.3142 4.05903 18.5911 4.17373C18.868 4.28843 19.1196 4.45654 19.3315 4.66848C19.5435 4.88041 19.7116 5.13201 19.8263 5.40891C19.941 5.68582 20 5.9826 20 6.28232C20 6.58204 19.941 6.87882 19.8263 7.15573C19.7116 7.43263 19.5435 7.68423 19.3315 7.89617L8.43807 18.7896L4 20L5.21038 15.5619L16.1038 4.66848Z"
											stroke={themeMode=== "dark" ? "#F1F1F1" : "#333"}
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										</svg>
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
										deleteEntry(orgId, data.key, data.category)
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
			)
		}
	  },
	  {
		field: 'distribution',
		headerName: 'Distribution',
		description: 'Controls whether this key is distributed to sub-organizations.',
		width: 100,
		filterable: false,
		  sortable: false,

		renderCell: (props) => {
			const data = props.row
            const isDistributed = data?.suborg_distribution?.length > 0 ? true : false;

			return (
				<div>
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
				</div>
			)
		}
	  },
	];


	const isAutomating = categoryAutomations?.find((automation) => automation.enabled) !== undefined
    return (
        <div style={{
			minHeight: 2000, 
			height: isSelectedDataStore?"100%":null, 

			paddingBottom: isSelectedDataStore?null:250, 
			boxSizing: "border-box", 
			width: isSelectedDataStore? "100%" :null, 
			transition: "width 0.3s ease", 
			padding:isSelectedDataStore?"27px 10px 27px 27px":null, 
			color: isSelectedDataStore?'#ffffff':null, 
			backgroundColor: isSelectedDataStore? theme.palette.platformColor :null, 
			borderTopRightRadius: isSelectedDataStore?'8px':null, 
			borderBottomRightRadius: isSelectedDataStore?'8px':null, 
			borderLeft: theme.palette.defaultBorder 
		}}>
            {modalView}

			<CollectIngestModal 
				globalUrl={globalUrl}
				open={showCollectIngestMenu}
				setOpen={setShowCollectIngestMenu}

				workflows={workflows}
				getWorkflows={getWorkflows}
			/>

            {cacheDistributionModal}

            <div style={{height: "100%", overflowY: "auto", scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin'}}>
              <div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin'  }}>
              <div style={{ marginTop: isSelectedDataStore?null:20, marginBottom: 20 }}>

				<div style={{display: "flex", position: "relative", }}>

					<Typography variant="h5" style={{ display: isSelectedDataStore?null: "inline", fontWeight: 500 }}>
						Shuffle Datastore
					</Typography>

					{userdata?.support === true ? 
						<Tooltip title={"Collect (support only)"} style={{}} aria-label={""}>
							<span style={{position: "absolute", right: 0, }}>
								<Button
									style={{ 
										whiteSpace: "nowrap", 
										height: 35, 
										textTransform: 'none', 

										//border: isAutomating ? `1px solid ${theme.palette.primary.main}` : null,
									}}
									variant="outlined"
									color="secondary"
									onClick={() => {
										setShowCollectIngestMenu(true)
									}}
								>
									<FilterAltIcon style={{marginRight: 10, }}/>
									Collect (beta) 
								</Button>
							</span>
						</Tooltip> 
					: null}
				</div>

                <Typography variant="body2" color="textSecondary" style={{ marginLeft: isSelectedDataStore?null:25, marginTop: 10}}>
                    Datastore is a permanent key-value database for storing data which can be used for automation. &nbsp;
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="/docs/organizations#datastore"
                        style={{ textDecoration: isSelectedDataStore?null:"none", color: theme.palette.linkColor }}
                    >
                        Learn more
                    </a>
                </Typography>
            </div>

			<div style={{width: "100%", position: "relative", }}>
				<ButtonGroup>
					<Button
						style={{textTransform: isSelectedDataStore ? 'capitalize':null, width : isSelectedDataStore ? 120 : null, height:isSelectedDataStore?40:null}}
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
						style={{ marginRight: 15, width:isSelectedDataStore ? 81:null, height:isSelectedDataStore?40:null,  }}
						variant="contained"
						color="secondary"
						onClick={() => {
							listOrgCache(orgId, selectedCategory, 0, pageSize, page);
						}}
					>
						<CachedIcon />
					</Button>
				</ButtonGroup>

				<ButtonGroup style={{marginTop: 0, }}>
				{datastoreCategories !== undefined &&
					datastoreCategories !== null &&
					datastoreCategories.length > 1 ? (

						<FormControl style={{ minWidth: 150, maxWidth: 150, marginTop: 8, }}>
						    <InputLabel id="category-choice" style={{
								color: "rgba(255, 255, 255, 0.65)",
							}}>
								Category
							</InputLabel>
							<Select
								labelId="category-choice"
								style={{
									minWidth: 150,
									maxWidth: 150,
									height: 35,
									borderRadius: "5px 0px 0px 5px",
								}}
								value={selectedCategory}
								onChange={(event) => {
									setCategoryConfig(undefined)
									setCategoryAutomations(defaultAutomation)

									//if (selectAllChecked || listCache.length > 0) {
									if (selectAllChecked || selectedFiles.length > 0) {
										setUpdateToThisCategory(event.target.value)
										return
									}


									setSelectedCategory(event.target.value)
									if (event.target.value === "all" || event.target.value === "default") {
    									listOrgCache(orgId, "", 0, pageSize, page)
									} else {
    									listOrgCache(orgId, event.target.value, 0, pageSize, page)
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
								{datastoreCategories.map((data, index) => {
									// Should find the icon for things
									// Fix uppercase at start of words
									const fixedname = data?.charAt(0)?.toUpperCase() + data?.slice(1)?.replaceAll("_", " ")
									const iconDetails = GetIconInfo({
										"app_name": fixedname,
										"name": fixedname,
									})

									return (
										<MenuItem
											key={index}
											value={data}
											style={{ 
												color: theme.palette.textFieldStyle.color, 
												display: "flex", 
												borderBottom: theme.palette.defaultBorder,
											}}
										>
											<Typography style={{display: "flex", marginTop: 5, }}>
												<div style={{marginRight: 10, }}>
													{iconDetails?.originalIcon && (
														iconDetails?.originalIcon
													)}
												</div>

												{fixedname}
											</Typography>
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
					) : null}

				<div style={{display: "inline-flex", position:"relative", top: 8}}>
					{renderTextBox ? 
						<Tooltip title={"Close"} style={{}} aria-label={""}>
							<Button
								style={{ 
									height: 35, 
									borderRadius: 4,  
									textTransform: 'none', 
									fontSize: 16,
									borderRadius: "0px 5px 5px 0px",

									marginRight: 10, 
								}}
								color="secondary"
            	                variant="contained"
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
								style={{ 
									whiteSpace: "nowrap", 
									width: datastoreCategories !== undefined && datastoreCategories !== null && datastoreCategories.length > 1 ? 50 : 169, 
									height: 35, 
									textTransform: 'none', 
									fontSize: 16, 

									borderRadius: "0px 5px 5px 0px",
								}}
								variant="outlined"
								color="secondary"
            	                onClick={() => {
									setRenderTextBox(true);
								}}
							>
								<AddIcon/>
								{datastoreCategories !== undefined && datastoreCategories !== null && datastoreCategories.length > 1 ? "" : "Category"}
							</Button>
						</Tooltip> 
					}

					{renderTextBox && <TextField
						onKeyPress={(event)=>{
							handleKeyDown(event);
							if(event.key === 'Enter' && selectedFileId.length > 0){
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
								color: theme.palette.textFieldStyle.color,
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
					/>}
				</div>
				</ButtonGroup>


				<ButtonGroup style={{ position: "absolute", right: 0, top: 5, }}>
					<Tooltip title={"Automate current Category"} style={{}} aria-label={""}>
						<span>
							<Button
								style={{ 
									whiteSpace: "nowrap", 
									height: 35, 
									textTransform: 'none', 

									border: isAutomating ? `1px solid ${theme.palette.primary.main}` : null,
								}}
								variant="contained"
								color="secondary"
								disabled={selectedCategory === undefined || selectedCategory === "" || selectedCategory === "default"}
								onClick={() => {
									// Set up: 
									// Workflow triggers for when a key is added/edited/deleted. 
									// Automatic ingest mechanisms: 
									//   - IOCs (monitor URLs)
									//   - Singul ingest
									setShowAutomationMenu(true)
								}}
							>
								{isAutomating ? <RocketLaunchIcon style={{color: theme.palette.primary.main, marginRight: 10 }}/> : <RocketIcon style={{marginRight: 10, color: theme.palette.secondary.main, }} />}
								Automate (beta) 
							</Button>
						</span>
					</Tooltip> 

					<Tooltip title={"Other category settings"} style={{}} aria-label={""}>
						<Button
							style={{ 
								whiteSpace: "nowrap", 
								height: 35, 
								textTransform: 'none', 
								marginLeft: 3, 
							}}
							variant="outlined"
							color="secondary"
							disabled={selectedCategory === undefined || selectedCategory === "" || selectedCategory === "default"}
							onClick={() => {
								setShowSettingsMenu(true)
							}}
						>
							<SettingsIcon style={{color: theme.palette.secondary.main, }} />
						</Button>
					</Tooltip> 
				</ButtonGroup>

				{showAutomationMenu || showSettingsMenu ? 
					<Dialog
						open={showAutomationMenu || showSettingsMenu}
						onClose={() => {
							setShowAutomationMenu(false)
							setShowSettingsMenu(false)
						}}
						PaperProps={{
							sx: {
								borderRadius: theme?.palette?.DialogStyle?.borderRadius,
								border: theme?.palette?.DialogStyle?.border,
								minWidth: 500,
								minHeight: 700,
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
						</DialogTitle>
						<DialogContent style={{ paddingLeft: "30px", paddingRight: '30px', backgroundColor: theme.palette.DialogStyle.backgroundColor, }}>
							{showSettingsMenu === true ? 
								<div>
									<Typography variant="h6" style={{ color: theme.palette.text.primary, marginBottom: 20 }}>
										<SettingsIcon style={{ verticalAlign: "middle", marginRight: 10 }} />
										Settings for category '{selectedCategory}'
									</Typography>

									<div style={{display: "flex", marginTop: 50,  }}>
										<div style={{flex: 2, }}>
											<Typography variant="body1" style={{ color: theme.palette.text.primary, }}>
												Timeout	
											</Typography>
											<Typography variant="body2" style={{ color: theme.palette.text.secondary, marginBottom: 20 }}>
												You can set a timeout for the category. This will delete all keys in this category after the specified time. Timeout is in seconds and based on last <b>EDITED</b> time.
											</Typography>
										</div>
										<TextField
											style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor, marginLeft: 20, flex: 1, }}
											InputProps={{
												style: {
													color: theme.palette.textFieldStyle.color,
													fontSize: "1em",
												},
											}}
											fullWidth
											autoComplete="Timeout"
											placeholder="86400"
											id="Timeoutfield"
											margin="normal"
											variant="outlined"
											label="Timeout (seconds)"
											defaultValue={categoryConfig?.settings?.timeout || ""}
											onBlur={(e) => {
												// Check if it's a number or not
												var timeoutValue = 0
												if (isNaN(e.target.value) || e.target.value === "" || e.target.value === null) {
													toast.info("Timeout must be a number. Setting to 0.")
												} else {
													timeoutValue = parseInt(e.target.value, 10)
													if (timeoutValue < 60) { 
														toast.info("Timeout must be between 60 seconds or more. Setting to 0.")
													}

													if (timeoutValue === categoryConfig?.settings?.timeout) {
														return
													}
												}

												setCategorySettingsField("timeout", timeoutValue)
											}}
										/>
									</div>

									<div style={{display: "flex", marginTop: 25,  }}>
										<div style={{flex: 3, }}>
											<Typography variant="body1" style={{ color: theme.palette.text.primary, }}>
												{categoryConfig?.settings?.public === true ? "" : "NOT"} Public 
											</Typography>
											<Typography variant="body2" style={{ color: theme.palette.text.secondary, marginBottom: 20 }}>
												This will make the url for this category public. Metadata will be cleared, except for timestamps. Types: keys,ndjson,csv,values,json,meta

												<div style={{marginTop: 20, }}>
													<div><b>URL (when public):</b></div> {globalUrl}/api/v2/datastore/category/{selectedCategory}?top=10000&type=keys&org_id={orgId}
												</div>
											</Typography>
										</div>
										<div style={{flex: 1, marginLeft: 60, marginTop: 25, }}>
											<Tooltip title={categoryConfig?.settings?.public === true ? "Disable public access for this category" : "Enable public access to data in this category"} style={{}} aria-label={""}>
												<Checkbox
													checked={categoryConfig?.settings?.public === true}
													onChange={(e) => {
														setCategorySettingsField("public", e.target.checked)
														setUpdate(Math.random()) // Force update to re-render the component
													}}
													style={{marginTop: 10, }}
													color="secondary"
												/>
											</Tooltip>
										</div>
									</div>

									<div style={{display: "flex", marginTop: 25,  }}>
										<div style={{flex: 2, }}>
											<Typography variant="body1" style={{ color: theme.palette.text.primary, }}>
												Subscribing
											</Typography>
											<Typography variant="body2" style={{ color: theme.palette.text.secondary, marginBottom: 20 }}>
												Enabling this feature will allow other organizations to subscribe to this category. This is NOT fully available yet.
											</Typography>
										</div>
									</div>
								</div>
								:
								<div>
									<Typography variant="h6" style={{ color: theme.palette.text.primary, marginBottom: 20 }}>
										<RocketIcon style={{ verticalAlign: "middle", marginRight: 10 }} />
										Automation for category '{selectedCategory}'
									</Typography>

									<Typography variant="body2" style={{ color: theme.palette.text.secondary, marginBottom: 20, marginTop: 20, }}>
										When
									</Typography>
									<Typography variant="body1" style={{ color: theme.palette.text.primary, marginBottom: 20 }}>
										A key is edited 
									</Typography>

									<Typography variant="body2" style={{ color: theme.palette.text.secondary, marginTop: 100, marginBottom: 20 }}>
										Do
									</Typography>
									{categoryAutomations.map((automation, index) => {

										return (
											<AutomationOptions 
												key={index}
												automation={automation} 
												index={index} 
											/>	
										)
									})}
								</div>
							}
							
						</DialogContent>
					</Dialog>
				: null}
			</div>

            {isSelectedDataStore? null :<Divider
                style={{
                    marginTop: 20,
                    marginBottom: 20,
                }}
            />}

		      <DataGrid
				rows={listCache}
				columns={columns}

				checkboxSelection
				disableRowSelectionOnClick
				rowSelectionModel={selectedRows}
				onRowSelectionModelChange={(newSelection) => {
					setSelectedRows(newSelection)
				}}
				keepNonExistentRowsSelected={false}
				getRowId={(row) => row.key}

				autoHeight={true}
				sx={{
					marginTop: 1, 
					height: listCache.length*52+500,
					width: "100%",
					'.MuiTablePagination-selectLabel, .MuiTablePagination-select, .MuiTablePagination-selectIcon': {
					  display: 'none',
					},
					marginBottom: 20, 
				}}

				loading={cachedLoaded === false}
				pagination
				paginationMode="server"
				page={page}
				rowCount={totalAmount}
				onPageChange={(newPage, second) => {
    				listOrgCache(orgId, selectedCategory, 0, pageSize, newPage)

					setPage(newPage)
				}}
				onPageSizeChange={(newSize) => {
					setPageSize(newSize);
					setPage(0)
					setSelectedRows([])

					setCursors({
						0: "",
					}) 
				}}


				filterMode="client"
				onFilterModelChange={(model) => {
					// Specific search for the key itself to find it fast across the index
					if (model?.items?.length === 1) {
						if (model?.items[0]?.operatorValue === "equals" && model?.items[0]?.columnField === "key") {
							// Run backend search for a specific key
							listOrgCache(orgId, selectedCategory, 0, pageSize, page, model?.items[0]?.value)
						}
					}
				}}

				getRowHeight={() => {
					return "auto"
				}}

				hideFooterSelectedRowCount={true}
				hideFooter={true}
			  />

			  <div
				style={{
				  position: 'fixed',
				  bottom: 10,
				  left: 250,
				  right: 0,
				  height: 52,
				  zIndex: 1000,
				  display: 'flex',
				  alignItems: 'center',
				  paddingLeft: 16,
				}}
			  >
				<div style={{
					width: 1200, 
					margin: "auto", 
					padding: 10, 
					backgroundColor: theme.palette.platformColor,
					borderRadius: 4,
					border: "1px solid rgba(255, 255, 255, 0.5)",

					display: "flex",
					textAlign: "center", 
				}}>
					<Typography variant="body2" style={{ color: theme.palette.text.primary, marginRight: 50, marginTop: 6, marginLeft: 350, }}>
						{page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalAmount)} of {totalAmount}
					</Typography>
					
					<Pagination
					  count={Number.parseInt(totalAmount/pageSize*100/2)}
					  page={page+1}
					  renderItem={(item) => {
						  var disabled = false
						  if (item?.type === "page") {
							  if (cursors[item.page-1] === undefined) {
								  disabled = true 
							  }
						  }
						  if (item?.type === "previous") {
							  disabled = page === 0
						  }

						  if (cachedLoaded === false) {
							  disabled = true 
						  }

						  return (
							<PaginationItem
							  {...item}
							  style={{
								  marginLeft: 4,
								  marginRight: 4,
								  height: 35,
								  width: 35,
							  }}

							  disabled={disabled}
							/>
						  )

					  }}
					  onChange={(e, value) => {
						if (value < 1) {
							return
						}

						const newPage = value-1

						listOrgCache(orgId, selectedCategory, 0, pageSize, newPage)

						setPage(newPage)
					  }}
					/>

					{selectedRows.length > 0 ?
						<Button
							style={{ marginLeft: 50, }}
							onClick={() => {
								setCachedLoaded(false)
								for (var key in selectedRows) {
									// Find the item and its category
									var foundCategory = ""
									for (var i = 0; i < listCache.length; i++) {
										if (listCache[i].key === selectedRows[key]) {
											foundCategory = listCache[i].category
											break
										}
									}

									deleteEntry(orgId, selectedRows[key], foundCategory, false)
								}

								setSelectedRows([])
								setTimeout(() => {
									// Refresh the list
									listOrgCache(orgId, selectedCategory, 0, pageSize, page)
									toast.success("Deleted " + selectedRows.length + " keys from datastore")
								}, 2500)

							}}
							variant={"outlined"}
							color="secondary"
						>
							<DeleteOutlineIcon 
								style={{
									color: red,
									marginRight: 10, 
								}}
							/>
							Delete {selectedRows.length} Key{ selectedRows.length > 1 ? "s" : "" }
						</Button>
					: null}
				</div>
			  </div>

              </div>
            </div>
        </div>
    );
})

//export default CacheView;
export default memo(CacheView);
