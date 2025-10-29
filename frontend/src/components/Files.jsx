import React, { useState, useEffect, useContext, memo } from "react";
import { toast } from 'react-toastify';
import { GetIconInfo, } from "../views/Workflows2.jsx";

import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Skeleton,
  Checkbox,
  Chip,
  Menu,
  Pagination,
  PaginationItem,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import {
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Cached as CachedIcon,
  Publish as PublishIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  SelectAll,
} from "@mui/icons-material";

import Dropzone from "../components/Dropzone.jsx";
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";
import {getTheme} from "../theme.jsx";
import { Context } from "../context/ContextApi.jsx";
import { red } from "../views/AngularWorkflow.jsx";

const Files = memo((props) => {
  const { globalUrl, userdata, serverside, selectedOrganization, isCloud,isSelectedFiles } = props;

  const [files, setFiles] = React.useState([]);
  const [showLoader, setShowLoader] =  useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState("default");
  const [openFileId, setOpenFileId] = React.useState(false);
  const [fileCategories, setFileCategories] = React.useState([]);
  const [fileContent, setFileContent] = React.useState("");
  const [openEditor, setOpenEditor] = React.useState(false);
  const [renderTextBox, setRenderTextBox] = React.useState(false);
  const [loadFileModalOpen, setLoadFileModalOpen] = React.useState(false);
  const { themeMode, brandColor } = useContext(Context);
  const theme = getTheme(themeMode, brandColor);

  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");
  const [downloadUrl, setDownloadUrl] = React.useState("https://github.com/shuffle/standards")
  const [downloadBranch, setDownloadBranch] = React.useState("main");
  const [downloadFolder, setDownloadFolder] = React.useState("translation_standards");
  const [contentLoading, setContentLoading] = React.useState(false)
  const [selectAllChecked, setSelectAllChecked] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState([])
  const [showFileCategoryPopup, setShowFileCategoryPopup] = useState(false)
  const [updateToThisCategory, setUpdateToThisCategory] = useState("")
  const [showDistributionPopup, setShowDistributionPopup] = useState(false)
  const [selectedSubOrg, setSelectedSubOrg] = useState([])
  const [fileIdSelectedForDistribution, setFileIdSelectedForDistribution] = useState("")
  const [totalAmount, setTotalAmount] = useState(0);
const [page, setPage] = useState(0);
const [pageSize, setPageSize] = useState(50)
const [selectedRows, setSelectedRows] = useState([]);
const [filesLoaded, setFilesLoaded] = useState(false);
  //const alert = useAlert();
  const allowedFileTypes = ["txt", "py", "yaml", "yml","json", "html", "js", "csv", "log", "eml", "msg", "md", "xml", "sh", "bat", "ps1", "psm1", "psd1", "ps1xml", "pssc", "psc1", "response"]
  var upload = "";
	const paginatedRows = files.slice(page * pageSize, (page + 1) * pageSize);

  const columns = [
	{
		field : 'filename',
		headerName: 'Name',
		filterable: true,
		sortable: true,
		width: 250,
		renderCell: (params) => {
			if (params.row.filename === undefined || params.row.filename === null || params.row.filename.length < 1) {
				return (
					<Typography variant="body2" style={{ color: "grey" }}>
						No name
					</Typography>
				)
			} 

			return (
				<Tooltip 
					title={params.row.filename} 
					placement="left" 
					arrow
				>
					<Typography variant="body2" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
						{params.row.filename}
					</Typography>
				</Tooltip>
			);
		}
	},
	{
  field: 'Workflow',
  headerName: 'Workflow',
  renderCell: (params) => {
    const file = params.row;
    return (
      file.workflow_id === "global" || !file.workflow_id ? (
        <IconButton
          disabled={file.workflow_id === "global"}
          style={{ marginLeft: 10 }}
        >
          <OpenInNewIcon
            style={{
              color: file.workflow_id !== "global" ? "#FF8444" : "grey",
            }}
          />
        </IconButton>
      ) : (
        <Tooltip title={"Go to workflow"} aria-label={"Download"}>
          <span>
            <a
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                color: "#f85a3e",
              }}
              href={`/workflows/${file.workflow_id}`}
              target="_blank"
            >
              <IconButton style={{ marginLeft: 10 }}>
                <OpenInNewIcon
                  style={{
                    width: 24,
                    height: 24,
                    color: "#FF8444",
                  }}
                />
              </IconButton>
            </a>
          </span>
        </Tooltip>
      )
    );
  },
},
{
		field: 'md5_sum',
		headerName: 'MD5',
		width: 100,
	},
	{
		field: "Status",
		headerName: "Status",
		renderCell: (params) => {
			const file = params.row;
			return (
				<Typography variant="body2" style={{ color: file.status === "active" ? "#2BC07E" : "#FD4C62", fontWeight: "bold" }}>
					{file.status.charAt(0).toUpperCase() + file.status.slice(1)}
				</Typography>
			);
		}
	},
	{
		field: "filesize",
		headerName: "Filesize",

	},
	{
		field: "actions",
		headerName: "Actions",
		width: 200,
		renderCell: (params) => {
			const file = params.row;
			const filenamesplit = file.filename.split(".")
			const iseditable = file.filesize < 2000000 && file.status === "active" && (allowedFileTypes.includes(filenamesplit[filenamesplit.length-1]) || !file?.filename.includes("."))
			return (
				<span style={{ display:"inline"}}>
					<Tooltip
						title={`Edit File (${allowedFileTypes.join(", ")}). Max size 2MB`}
						style={{}}
						aria-label={"Edit"}
					>
						<span>
							<IconButton
								disabled={!iseditable || file.org_id !== selectedOrganization.id}
								style = {{padding: "6px", }}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									setOpenEditor(true)
									setOpenFileId(file.id)
									readFileData(file)
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
					{/*
					<Tooltip
						title={"Public URL"}
						style={{}}
					>
						<span>
							<IconButton
								style = {{padding: "6px"}}
								disabled={file.status !== "active"}
								onClick={() => {
									// Open the file, without downloading it
									window.open(`${globalUrl}/api/v1/files/${file.id}/content?type=text&authorization=${file.public_authorization}`, "_blank noreferrer noopener")
								}}
							>
								<LinkIcon
									style={{
										color:
											file.status === "active"
												? "white"
												: "grey",
									}}
								/>
							</IconButton>
						</span>
					</Tooltip>
					*/}
					<Tooltip
						title={"Download file"}
						style={{}}
						aria-label={"Download"}
					>
						<span>
							<IconButton
								style = {{padding: "6px"}}
								disabled={file.status !== "active"}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									downloadFile(file);
								}}
							>
								<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								>
								<rect
									width="24"
									height="24"
									fill={themeMode === "dark" ? "#212121" : "#EDEDED"}
									fillOpacity="0.02"
								/>
								<path
									d="M8.22595 16.4463L11.7792 19.9995L15.3324 16.4463"
									stroke={file.status === "active" ? (themeMode === "dark" ? "#F1F1F1" : "black") : "grey"}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M11.7792 12.0049V19.9997"
									stroke={file.status === "active" ? (themeMode === "dark" ? "#F1F1F1" : "black") : "grey"}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M19.6676 17.415C20.4399 16.8719 21.019 16.0968 21.321 15.2023C21.6229 14.3078 21.632 13.3403 21.3468 12.4403C21.0617 11.5402 20.4971 10.7545 19.7352 10.197C18.9732 9.6396 18.0534 9.33948 17.1092 9.34021H15.99C15.7228 8.299 15.2229 7.33196 14.5279 6.5119C13.8329 5.69184 12.961 5.04013 11.9777 4.60583C10.9944 4.17153 9.92534 3.96596 8.85109 4.00459C7.77684 4.04322 6.72535 4.32505 5.77578 4.82886C4.82621 5.33267 4.00331 6.04534 3.36902 6.9132C2.73474 7.78106 2.30559 8.78151 2.11391 9.83922C1.92222 10.8969 1.97297 11.9844 2.26236 13.0196C2.55174 14.0549 3.07221 15.011 3.78459 15.816"
									stroke={file.status === "active" ? (themeMode === "dark" ? "#F1F1F1" : "black") : "grey"}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								</svg>

							</IconButton>
						</span>
					</Tooltip>
					<Tooltip
						title={"Copy file ID"}
						style={{}}
						aria-label={"copy"}
					>
						<IconButton
							style = {{padding: "6px"}}
							onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									navigator.clipboard.writeText(file.id);
									document.execCommand("copy");

									toast(file.id + " copied to clipboard");
							}}
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								>
								<rect
									width="24"
									height="24"
									fillOpacity="1"
								/>
								<path
									d="M14 4H7.6C7.17565 4 6.76869 4.16857 6.46863 4.46863C6.16857 4.76869 6 5.17565 6 5.6V18.4C6 18.8243 6.16857 19.2313 6.46863 19.5314C6.76869 19.8314 7.17565 20 7.6 20H17.2C17.6243 20 18.0313 19.8314 18.3314 19.5314C18.6314 19.2313 18.8 18.8243 18.8 18.4V8.8L14 4Z"
									stroke={themeMode === "dark" ? "#F1F1F1" : "#333"}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M14 4V8.8H18.8"
									stroke={themeMode === "dark" ? "#F1F1F1" : "#333"}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								</svg>
						</IconButton>
					</Tooltip>
					<Tooltip
						title={"Delete file"}
						style={{}}
						aria-label={"Delete"}
						placement="right"
					>
						<span>
							<IconButton
								disabled={file.status !== "active" || file.org_id !== selectedOrganization.id}
								style={{ padding: "6px" }}
								onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								deleteFile(file.id, true);
								}}
							>
								<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								style={{
									stroke: file.status === "active"  && file.org_id === selectedOrganization.id ? "#fd4c62" : "#c8c8c8",
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
		field: "distribution",
		headerName: "Distribution",
		renderCell: (params) => {
			const file = params.row;
			const isDistributed = file?.suborg_distribution?.length > 0 ? true : false;

			return (
				<>
					{selectedOrganization.id !== undefined && file?.org_id !== selectedOrganization.id ?
						<Tooltip
							title="Parent organization controlled file. You can use, but not modify this file. Contact an admin of your parent organization if you need changes to this."
							placement="top"
						>
							<Chip
								label={"Parent"}
								variant="contained"
								color="secondary"
								style={{display: "table-cell",}}
							/>
						</Tooltip>
						:
						<Tooltip
							title="Distributed to sub-organizations. This means the sub organizations can use this file, but can not modify it."
							placement="top"
						>
							<Checkbox
								disabled={userdata?.active_org?.role !== "admin" || (selectedOrganization.creator_org !== undefined && selectedOrganization.creator_org !== null && selectedOrganization.creator_org !== "" ) ? true : false}
								checked={isDistributed}
								style={{ }}
								onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								setShowDistributionPopup(true)
								if(file?.suborg_distribution?.length > 0){
									setSelectedSubOrg(file.suborg_distribution)
								}else{
									setSelectedSubOrg([])
								}
								setFileIdSelectedForDistribution(file.id)
								}}
							/>
						</Tooltip>
					}
				</>
			)
		}
	}
 ]


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

	const changeDistribution = (id, selectedSubOrg) => {	

		editFileConfig(id, "suborg_distribute", [...new Set(selectedSubOrg)])
	}
	
	const editFileConfig = (id, parentAction, selectedSubOrg) => {
			const data = {
				id: id,
				action: parentAction !== undefined && parentAction !== null ? parentAction : "change_category",
				selected_suborgs: selectedSubOrg,
			}

			const url = globalUrl + "/api/v1/files/" + id + "/config";

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
							toast.error("Failed overwriting files");
						} else {
							toast.success("File updated!");
							setTimeout(() => {
								getFiles();
							}, 1000);
						}
					})
				)
				.catch((error) => {
					toast("Err: " + error.toString());
				});
	};

	const handleFileCheckboxChange = (index) => {
		setSelectedFiles((prevSelected) => {
			const updatedSelected = [...prevSelected];
			updatedSelected[index] = !updatedSelected[index];
			return updatedSelected;
		});
	};

  const runUpdateText = (text) =>{
    fetch(`${globalUrl}/api/v1/files/${openFileId}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body:text,
      credentials: "include",
    })
	.then((response) => {
        if (response.status !== 200) {
          console.log("Can't update file");
        }
        return response.json();
    })
	.then((responseJson) => {
		if (responseJson.success === true) {
			toast("Successfully updated file");
		}
	})
    .catch((error) => {
		toast("Error updating file: " + error.toString());
	})
  }

  const getFiles = (namespace) => {
	setFilesLoaded(false)
    var parsedurl = `${globalUrl}/api/v1/files`

	if (namespace === undefined || namespace === null || namespace === "default") {

	} else if (namespace !== undefined && namespace !== null && namespace !== "") {
	  	parsedurl = `${globalUrl}/api/v1/files/namespaces/${namespace}?ids=true`
	} else if (selectedCategory !== undefined && selectedCategory !== null && selectedCategory !== "default" && selectedCategory !== "") {
		parsedurl = `${globalUrl}/api/v1/files/namespaces/${selectedCategory}?ids=true`
	}

    fetch(parsedurl, {
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
        if (responseJson.files !== undefined && responseJson.files !== null) {
          	setFiles(responseJson.files);
			if (responseJson.total_amount !== undefined && responseJson.total_amount !== null && responseJson.total_amount > 0) {
					setTotalAmount(responseJson.total_amount)
			} else {
				setTotalAmount(responseJson.files.length)
			}
			setShowLoader(false)
			setShowDistributionPopup(false)
        } else if (responseJson.list !== undefined && responseJson.list !== null) {
			// Set the "namespace" field in all items
			if (namespace !== undefined && namespace !== null) {
				responseJson.list.forEach((item) => {
					item.namespace = namespace
					item.filename = item.name
					item.workflow_id = "global" 
				})
			}

			setFiles(responseJson.list);
			setShowLoader(false)
		} else {
          setFiles([]);
		  setShowLoader(false)
		  setShowDistributionPopup(false)
        }

	    if (namespace === undefined || namespace === null || namespace === "default") {
			if (responseJson.namespaces !== undefined && responseJson.namespaces !== null && (fileCategories.length === 0 || responseJson.namespaces.length > fileCategories.length)) {
			  setFileCategories(responseJson.namespaces)
			}
		}
      })
      .catch((error) => {
        toast(error.toString());
      }).finally(() => {
		setFilesLoaded(true)
	  });
  };

	useEffect(() => {
		getFiles("default")

		setTimeout(() => {
			var category = selectedCategory
			if (window.location.search.includes("category=")) {
				const urlParams = new URLSearchParams(window.location.search)
				category = urlParams.get("category")
			}

			if (category !== undefined && category !== null && category.length > 0 && category !== "default") {
				setSelectedCategory(category)
			}

			getFiles(category)
		}, 1000)
	}, []);

  const importStandardsFromUrl = (url, folder) => {
	if (url === undefined || url === null || url.length < 5) {
		toast("Please enter a valid URL");
		return; 
	}

	if (folder === undefined || folder === null || folder.length < 1) {
		toast("Please enter a valid folder name. For Root: /")
		return
	}

    const parsedData = {
      url: url,
	  path: folder,
      field_3: downloadBranch || "master",

	  namespace: selectedCategory !== undefined && selectedCategory !== null && selectedCategory !== "default" ? selectedCategory : "",
    };

    if (field1.length > 0) {
      parsedData["field_1"] = field1;
    }

    if (field2.length > 0) {
      parsedData["field_2"] = field2;
    }

    toast(`Getting files from url ${url}. This may take a while if the repository is large. Please wait...`);
    fetch(globalUrl + "/api/v1/files/download_remote", {
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
          toast("Successfully loaded files from " + downloadUrl);
    	  setLoadFileModalOpen(false);
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          if (responseJson.reason !== undefined) {
            toast("Failed loading: " + responseJson.reason);
          } else {
            toast("Failed loading");
          }
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  }

  const handleGithubValidation = () => {
    importStandardsFromUrl(downloadUrl, downloadFolder);
  }

  const fileDownloadModal = loadFileModalOpen ? 
    <Dialog
      open={loadFileModalOpen}
      PaperProps={{
		sx: {
		  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
		  border: theme?.palette?.DialogStyle?.border,
		  fontFamily: theme?.typography?.fontFamily,
		  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
		  zIndex: 1000,
		  minWidth: "800px",
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
		}
	  }}
    >
      <DialogTitle>
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          Load Files from Github
        </div>
		<Typography variant="body2" color="textSecondary">
			Files will be loaded from the repository and branch you specify, with the focus on files in one folder at a time. This is NOT recursive.
		</Typography>
      </DialogTitle>
      <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
        Repository URL (supported: github, gitlab, bitbucket)
        <TextField
          style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
          variant="outlined"
          margin="normal"
          defaultValue={downloadUrl}
          InputProps={{
            style: {
              color: "white",
              height: "50px",
              fontSize: "1em",
            },
          }}
          onChange={(e) => setDownloadUrl(e.target.value)}
          placeholder="https://github.com/shuffle/standards"
          fullWidth
        />
        <div style={{ display: "flex" }}>
		  <span>
			<span style={{ marginTop: 10 }}>
			  Branch (default value is "main"):
			</span>
            <TextField
              style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
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
		  </span>
		  <span>
			<span style={{ marginTop: 10 }}>
			  Folder (can use / for subfolders):
			</span>
		    <TextField
                style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
                variant="outlined"
                margin="normal"
                defaultValue={downloadFolder}
                InputProps={{
                  style: {
                    color: "white",
                    height: "50px",
                    fontSize: "1em",
                  },
                }}
                onChange={(e) => setDownloadFolder(e.target.value)}
                placeholder="translation_standards"
                fullWidth
              />
		  </span>
		</div>
        <span style={{ marginTop: 10 }}>
          Authentication (optional - private repos etc):
        </span>
        <div style={{ display: "flex" }}>
          <TextField
            style={{ flex: 1, backgroundColor: theme.palette.textFieldStyle.backgroundColork }}
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
            style={{ flex: 1, backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
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
        <Button
          style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: theme.palette.primary.main }}
          onClick={() => setLoadFileModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        <Button
		  variant="contained"
          style={{ borderRadius: "2px", textTransform: 'none', fontSize:16,  }}
          disabled={downloadUrl.length === 0 || !downloadUrl.includes("http")}
          onClick={() => {
            handleGithubValidation();
          }}
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
   : null

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

  const fileDistributionModal = showDistributionPopup ? (
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
			<Typography variant="h5" color="textPrimary" >
				Select sub-org to distribute files
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
					style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: theme.palette.primary.main }}
					onClick={() => setShowDistributionPopup(false)}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, marginLeft: 10 }}
					onClick={() => {
						changeDistribution(fileIdSelectedForDistribution, selectedSubOrg);
					}}
					color="primary"
				>
					Submit
				</Button>
			</div>
		</DialogContent>
		</Dialog>

  ): null

  const deleteFile = (fileId, showSinglDeleteToast) => {

	console.log("Deleting file with ID: ", fileId)
	console.log("showSinglDeleteToast: ", showSinglDeleteToast)

    fetch(globalUrl + "/api/v1/files/" + fileId, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for file delete :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success && showSinglDeleteToast === true) {
          toast.success("Deleted file") 
        } else if (
          responseJson.reason !== undefined &&
          responseJson.reason !== null
        ) {
          toast.error("Failed to delete file: " + responseJson.reason);
        }

        if (showSinglDeleteToast === true) {
			setTimeout(() => {
  				getFiles(selectedCategory)
        	}, 1500);
		}
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const readFileData = (file) => {
	setContentLoading(true)

    fetch(globalUrl + "/api/v1/files/" + file.id + "/content", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
		setContentLoading(false)
        if (response.status !== 200) {
          console.log("Status not 200 for file :O!");
          return "";
        }
        return response.text();
      })
      .then((respdata) => {
          // console.log("respdata ->", respdata);
          // console.log("respdata type ->", typeof(respdata));
        
        if (respdata.length === 0) {
          toast("Failed getting file. Is it deleted?");
          return;
        }
        return respdata
      })
      .then((responseData) => {
		  setFileContent(responseData);
		  //console.log("filecontent state ",fileContent);
      })
      .catch((error) => {
		setContentLoading(false)
        toast(error.toString())
      });
  };

	const downloadFile = (file) => {
		fetch(globalUrl + "/api/v1/files/" + file.id + "/content", {
		  method: "GET",
		  credentials: "include",
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for apps :O!");
				return "";
			}

			console.log("Resp: ", response)

			return response.blob()
		})
      .then((respdata) => {
        if (respdata.length === 0) {
          toast("Failed getting file. Is it deleted?");
          return;
        }

        var blob = new Blob([respdata], {
          type: "application/octet-stream",
        });

        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${file.filename}`);
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

        //return response.json()
      })
      .then((responseJson) => {
        //console.log(responseJson)
        //setSchedules(responseJson)
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const handleCreateFile = (filename, file) => {
    var data = {
      filename: filename,
      org_id: selectedOrganization.id,
      workflow_id: "global",
    };

    if (
      selectedCategory !== undefined &&
      selectedCategory !== null &&
      selectedCategory.length > 0 &&
      selectedCategory !== "default"
    ) {
      data.namespace = selectedCategory;
    }

    fetch(globalUrl + "/api/v1/files/create", {
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
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("RESP: ", responseJson)
        if (responseJson.success === true) {
          handleFileUpload(responseJson.id, file);
        } else {
          toast("Failed to upload file ", filename);
        }
      })
      .catch((error) => {
        toast("Failed to upload file ", filename);
        console.log(error.toString());
      });
  };



	const handleFileUpload = (file_id, file) => {
    //console.log("FILE: ", file_id, file)
    fetch(`${globalUrl}/api/v1/files/${file_id}/upload`, {
      method: "POST",
      credentials: "include",
      body: file,
    })
      .then((response) => {
        if (response.status !== 200 && response.status !== 201) {
          console.log("Status not 200 for apps :O!");
          toast("File was created, but failed to upload.");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        //console.log("RESPONSE: ", responseJson)
        //setFiles(responseJson)
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const uploadFiles = (files) => {
    for (var key in files) {
      try {
        const filename = files[key].name;
        var filedata = new FormData();
        filedata.append("shuffle_file", files[key]);

        if (typeof files[key] === "object") {
          handleCreateFile(filename, filedata);
        }

        /*
				reader.addEventListener('load', (e) => {
					var data = e.target.result;
					setIsDropzone(false)
					console.log(filename)	
					console.log(data)
					console.log(files[key])
				})
				reader.readAsText(files[key])
				*/
      } catch (e) {
        console.log("Error in dropzone: ", e);
      }
    }

    setTimeout(() => {
      getFiles()
    }, 3000);
  };

  const uploadFile = (e) => {
    const isDropzone =
      e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;

    //const reader = new FileReader();
    //toast("Starting fileupload")
    uploadFiles(files);
  };


  const handleUpdateFileCategory = (namespace) => {
	
	if (selectedFiles.length === 0 && !selectAllChecked) {
		toast("Please select files to update category")
		return
	}

	if (namespace === undefined || namespace === null || namespace === "") {
		toast("Please select a category to update files to")
		return
	}	

	const url = globalUrl + `/api/v1/files/namespaces/${namespace}/share`

	const data = {
		SelectedFiles: selectedFileId,
	}

	setShowLoader(true)

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
					toast("Failed overwriting files");
				} else {
					setSelectAllChecked(false)
					setSelectedFiles([])
					setSelectedFileId([])
					setShowFileCategoryPopup(false)
					setSelectedCategory(namespace)
					setTimeout(() => {
						getFiles();
						toast("Successfully updated file!");
						if (window.location.search.includes("category=")) {
							const newurl = window.location.href.replace(/category=[^&]+/, `category=${namespace}`)
							window.history.pushState({ path: newurl }, "", newurl)
						} else {
							window.history.pushState({ path: window.location.href }, "", `${window.location.href}&category=${namespace}`)
						}

					}, 1000);
				}
			}
		))
		.catch((error) => {
			toast("Err: " + error.toString());
		});
		
  }

	return (
		<Dropzone
			style={{
				margin: "auto",
				padding: isSelectedFiles ? null : 20,
				width: '100%',
				height: "100%",
			}}
			onDrop={uploadFile}
		>
			{fileDistributionModal}
			<div style={{width: "100%", minHeight: 1100, boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: theme.palette.platformColor,borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: theme.palette.defaultBorder, }}>

        		<div style={{height: "100%", }}>
					<div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin' }}>
					<DownloadFileIcon setLoadFileModalOpen={setLoadFileModalOpen} isSelectedFiles={isSelectedFiles} />

				{fileDownloadModal} 

				<div style={{ marginTop: isSelectedFiles ? 2: 20, marginBottom:20 }}>
					<Typography variant="h5" color="textPrimary" style={{ display: isSelectedFiles ? null : "inline", marginTop: isSelectedFiles?0:null, marginBottom: isSelectedFiles?8:null, fontWeight: 500}}>Files</Typography>
					<Typography variant="body2" color="textSecondary" style={{ marginLeft: isSelectedFiles ? null : 25,}}>
						Files from Workflows are a way to store as well as edit files.{" "}
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://shuffler.io/docs/organizations#files"
							style={{ textDecoration: isSelectedFiles ? null:"none", color: theme.palette.linkColor }}
						>
							Learn more
						</a>
					</Typography>
				</div>



				<ButtonGroup style={{top: -10, position: "relative", }}>
					<Button
						color="primary"
						variant="contained"
						onClick={() => {
							upload.click();
						}}
						style={{ textTransform: 'none',fontSize: 16, width:isSelectedFiles?143:null, height:isSelectedFiles?35:null, boxShadow: isSelectedFiles?'none':null,}}
					>
			    	 Upload files
					</Button>
					{/* <FileCategoryInput
									 isSet={renderTextBox} /> */}
					<input
						hidden
						type="file"
						multiple
						ref={(ref) => (upload = ref)}
						onChange={(event) => {
							//const file = event.target.value
							//const fileObject = URL.createObjectURL(actualFile)
							//setFile(fileObject)
							//const files = event.target.files[0]
							uploadFiles(event.target.files);

						}}
					/>
					<Button
						style={{ width:isSelectedFiles?81:null, height:isSelectedFiles?35:null, boxShadow: isSelectedFiles?'none':null, }}
						variant="contained"
						color="secondary"
						onClick={() => getFiles(selectedCategory)}
					>
						<CachedIcon />
					</Button>
				</ButtonGroup>

				<ButtonGroup style={{marginLeft: 10, }}>
			    {/* <div style={{height: 35, width: 1, color: "#494949"}}></div> */}

				{selectedCategory === "sigma" || selectedCategory === "yara" ? 
					<Tooltip title={"Open Detection Tab"} style={{}} aria-label={""}>
						<a href={`/detections/${selectedCategory}`} target="_blank" rel="noopener noreferrer">
							<OpenInNewIcon 
								color="primary"
								style={{
									marginLeft: 10, 
									marginRight: 10,
									top: 7, 
									position: 'relative',
								}} 
							/>
						</a>
					</Tooltip>
				: null}

				{fileCategories !== undefined &&
				fileCategories !== null &&
				fileCategories.length > 1 ? (
					<FormControl style={{ minWidth: 175, maxWidth: 175, }}>
						<InputLabel id="category-choice" style={{
							color: "rgba(255, 255, 255, 0.65)",
						}}>
							Category
						</InputLabel>
						<Select
							labelId="category-choice"
							id="input-namespace-select-id"
							style={{
								minWidth: 175,
								maxWidth: 175,
								height: 35,
								borderRadius: "5px 0px 0px 5px",
								overflow: "hidden",
							}}
							value={selectedCategory}
							onChange={(event) => {
								if (selectAllChecked || selectedFiles.length > 0) {
									setUpdateToThisCategory(event.target.value)
									setShowFileCategoryPopup(true)
									return
								}
								setSelectedCategory(event.target.value)
								if (event.target.value === "all" || event.target.value === "default") {
  									getFiles() 
								} else {
									getFiles(event.target.value)
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
						}} open={showFileCategoryPopup} onClose={() => setShowFileCategoryPopup(false)}>
							<DialogTitle>File Categories</DialogTitle>
							<DialogContent>
								Please note that your selected files ({selectedFileId?.length}) will be moved to the <kbd>{updateToThisCategory}</kbd> category.
							</DialogContent>
							<DialogActions>
								<Button onClick={() => setShowFileCategoryPopup(false)} style={{fontSize: 16, textTransform: 'none', color: theme.palette.primary.main }}>Close</Button>
								<Button variant="contained" color="primary" onClick={() => handleUpdateFileCategory(updateToThisCategory)} style={{fontSize: 16, textTransform: 'none', }}>Update</Button>
							</DialogActions>
						</Dialog>
					</FormControl>
				) : null}


				{/*<div style={{display: "inline-flex", position:"relative", top: 8}}>*/}
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
									width: fileCategories !== undefined && fileCategories !== null && fileCategories.length > 1 ? 50 : 169, 
									height: 35, 
									textTransform: 'none', 
									fontSize: 16, 
								}}
								variant="outlined"
								color="secondary"
								onClick={() => {
									setRenderTextBox(true);
								}}
							>
								<AddIcon/>
							</Button>
						</Tooltip> 
					}
				</ButtonGroup>

				{renderTextBox && <TextField
					onKeyPress={(event)=>{
						handleKeyDown(event);
						if(event.key === 'Enter' && selectedFileId.length > 0){
							setShowFileCategoryPopup(true)
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
							backgroundColor: theme.palette.textFieldStyle.backgroundColor,
							height: 35,
							fontSize: 16,
							borderRadius: 4,
							paddingTop: 0,
						},
					}}
					color="primary"
					placeholder="File category name"
					required
					margin="dense"
					defaultValue={""}
					autoFocus
				/>}

				<ShuffleCodeEditor
					isCloud={isCloud}
					expansionModalOpen={openEditor}
					setExpansionModalOpen={setOpenEditor}
					setcodedata = {setFileContent}
					codedata={fileContent}
					isFileEditor = {true}
					key = {fileContent} //https://reactjs.org/docs/reconciliation.html#recursing-on-children
					runUpdateText = {runUpdateText}
					contentLoading = {contentLoading}
				/>
				{isSelectedFiles?null:
				<Divider
					style={{
						marginTop: 20,
						marginBottom: 20,
						backgroundColor: theme.palette.textFieldStyle.backgroundColor,
					}}
				/>}
				<div style={{ height: '100%', width: '100%',  }}>
					<DataGrid 
						rows={paginatedRows} 
						columns={columns} 
						checkboxSelection
						disableRowSelectionOnClick
						selectionModel={selectedRows}
						onSelectionModelChange={(newSelection) => {
							setSelectedRows(newSelection);
						}}
						sx={{
							marginTop: 1, 
							height: files.length*52,
							width: "100%",
							'.MuiTablePagination-selectLabel, .MuiTablePagination-select, .MuiTablePagination-selectIcon': {
							display: 'none',
							},
							marginBottom: 20, 
						}}
						hideFooterSelectedRowCount={true}
						hideFooter={true}
						pagination
						autoHeight={true}
						getRowId={(row) => row.id}
						keepNonExistentRowsSelected={false}
						loading={filesLoaded === false}
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
								count={Math.ceil(files.length / pageSize)}
								page={page+1}
								renderItem={(item) => {

									return (
									<PaginationItem
										{...item}
										style={{
											marginLeft: 4,
											marginRight: 4,
											height: 35,
											width: 35,
										}}
									/>
									)

								}}
								onChange={(e, value) => {
								if (value < 1) {
									return
								}

								const newPage = value-1
								console.log("New page: ", value)
								// handleChangePage()

								setPage(newPage)
								}}
							/>

							{selectedRows.length > 0 ?
								<Button
									style={{ marginLeft: 50, }}
									onClick={() => {
									if (selectedRows.length === 0) {
										toast("Please select files to delete");
										return;
									}

									for (let i = 0; i < selectedRows.length; i++) {
										const fileIdToDelete = selectedRows[i];
										deleteFile(fileIdToDelete, false);

										if (i === selectedRows.length - 1) {
										setTimeout(() => {
											setSelectedRows([]);
											getFiles(selectedCategory);
											toast.success(
											`Deleted ${selectedRows.length} file${selectedRows.length === 1 ? "" : "s"}`
											);
										}, 2500);
										}
									}
									}}
									variant={"outlined"}
									color="secondary"
									startIcon={
										<DeleteIcon
											style={{
												color: red,
												marginRight: 10, 
											}}
									/>
									}
								>
									Delete {selectedRows.length} File{ selectedRows.length > 1 ? "s" : "" }
								</Button>
							: null}
						</div>
						</div>
				</div>
				</div>
			</div>
			</div>
		</Dropzone>
	)
})

export default memo(Files);


const DownloadFileIcon = memo(({ setLoadFileModalOpen, isSelectedFiles }) => {
	
    return (
        <Tooltip color="primary" title={"Import files to Shuffle from Git"} placement="top">
            <IconButton
                color="secondary"
                onClick={() => setLoadFileModalOpen(true)}
                sx={{
                    position: "absolute",
                    right: 0,
                    top: isSelectedFiles ? null : 0,
                    left: isSelectedFiles
                        ? "93%"
                        : null,
                    transition: "left 0.3s ease",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                }}
            >
                <CloudDownloadIcon />
            </IconButton>
        </Tooltip>
    );
});

