import React, { useState, useEffect, useContext, memo } from "react";
import { toast } from 'react-toastify';

import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
	Button,
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
} from "@mui/material";

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
import theme from "../theme.jsx";
import { Context } from "../context/ContextApi.jsx";

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
  //const alert = useAlert();
  const allowedFileTypes = ["txt", "py", "yaml", "yml","json", "html", "js", "csv", "log", "eml", "msg", "md", "xml", "sh", "bat", "ps1", "psm1", "psd1", "ps1xml", "pssc", "psc1", "response"]
  var upload = "";

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
							toast("Failed overwriting files");
						} else {
							toast("Successfully updated file!");
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

	if (folder === undefined || folder === null || folder.length < 2) {
		toast("Please enter a valid folder name")
		return
	}

    const parsedData = {
      url: url,
	  path: folder,
      field_3: downloadBranch || "master",
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
          style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#ff8544"  }}
          onClick={() => setLoadFileModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        <Button
		  variant="contained"
          style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#1a1a1a", backgroundColor: "#ff8544" }}
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
			<div style={{ color: "rgba(255,255,255,0.9)" }}>
				Select sub-org to distribute files
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

  const deleteFile = (file) => {
    fetch(globalUrl + "/api/v1/files/" + file.id, {
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
        if (responseJson.success) {
          toast("Successfully deleted file") 
        } else if (
          responseJson.reason !== undefined &&
          responseJson.reason !== null
        ) {
          toast("Failed to delete file: " + responseJson.reason);
        }

        setTimeout(() => {
  			getFiles(selectedCategory)
        }, 1500);
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
			<div style={{width: "100%", minHeight: 1100, boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: '#212121',borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: "1px solid #494949", }}>

        		<div style={{height: "100%", maxHeight: 1700,overflowY: 'auto', scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
					<div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin' }}>
					<DownloadFileIcon setLoadFileModalOpen={setLoadFileModalOpen} isSelectedFiles={isSelectedFiles} />

				{fileDownloadModal} 

				<div style={{ marginTop: isSelectedFiles ? 2: 20, marginBottom:20 }}>
					<h2 style={{ display: isSelectedFiles ? null : "inline", marginTop: isSelectedFiles?0:null, marginBottom: isSelectedFiles?8:null, color: "#FFFFFF"}}>Files</h2>
					<span style={{ marginLeft: isSelectedFiles ? null : 25, color:isSelectedFiles?"#9E9E9E":null}}>
						Files from Workflows are a way to store as well as edit files.{" "}
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://shuffler.io/docs/organizations#files"
							style={{ textDecoration: isSelectedFiles ? null:"none", color: isSelectedFiles? "#FF8444": "#f85a3e" }}
						>
							Learn more
						</a>
					</span>
				</div>



				<Button
					color="primary"
					variant="contained"
					onClick={() => {
						upload.click();
					}}
					style={{backgroundColor: isSelectedFiles?'#ff8544':null, color:isSelectedFiles?"#212121":null, textTransform: 'none',fontSize: 16, borderRadius:isSelectedFiles?4:null, width:isSelectedFiles?143:null, height:isSelectedFiles?35:null, boxShadow: isSelectedFiles?'none':null,}}
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
					style={{ marginLeft: 16, marginRight: 15, backgroundColor:isSelectedFiles?"#2F2F2F":null,borderRadius:isSelectedFiles?4:null, width:isSelectedFiles?81:null, height:isSelectedFiles?35:null, boxShadow: isSelectedFiles?'none':null, }}
					variant="contained"
					color="primary"
					onClick={() => getFiles(selectedCategory)}
				>
					<CachedIcon />
				</Button>

			    {/* <div style={{height: 35, width: 1, color: "#494949"}}></div> */}

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
						}} open={showFileCategoryPopup} onClose={() => setShowFileCategoryPopup(false)}>
							<DialogTitle>File Categories</DialogTitle>
							<DialogContent>
								Please note that your selected files ({selectedFileId?.length}) will be moved to the <kbd>{updateToThisCategory}</kbd> category.
							</DialogContent>
							<DialogActions>
								<Button onClick={() => setShowFileCategoryPopup(false)} style={{fontSize: 16, textTransform: 'none'}}>Close</Button>
								<Button onClick={() => handleUpdateFileCategory(updateToThisCategory)} style={{fontSize: 16, textTransform: 'none', color: "#1a1a1a", backgroundColor: "#ff8544"}}>Update</Button>
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
							File Category
						</Button>
					</Tooltip> 
				}

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
							color: "white",
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
				/>}</div>
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
						width: '100%', 
						tableLayout: "auto", 
						display: "table", 
						minWidth: 800,
						overflowX: "auto",
						paddingBottom: 0,
					}}
					>
					<ListItem
						style={{
							borderBottom: "1px solid #494949" ,
							display: "table-row"
						}}
						>
						{[
							<Tooltip title={"Select all files"} style={{}} aria-label={""}>
								<Checkbox 
								sx={{padding: 0}}
								onChange={() => {
									setSelectAllChecked((prev) => !prev);
									setSelectedFiles((prev) => {
										if (prev.length === files.length) {
											return []
										} else {
											return files.map((_, index) => !prev.includes(index))
										}
									})
									if (selectAllChecked) {
										setSelectedFileId([])
									} else {
										setSelectedFileId(
											files
												.filter((file) => file.namespace === selectedCategory)
												.map((file) => file.id) 
										);
									}
								}}
							/>
							</Tooltip>,
							"Name",
							"Workflow",
							"Md5",
							"Status",
							"Filesize",
							"Actions",
							"Distribution"
						]
							.filter(Boolean)
							.map((header, index) => (
							<ListItemText
								key={index}
								primary={header}
								style={{
								display: "table-cell",
								padding: index === 0 ? "0px 8px 8px 15px" : "0px 8px 8px 8px",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
								borderBottom: "1px solid #494949",
								verticalAlign: "middle"
								}}
								primaryTypographyProps={{
								style: {
									paddingLeft: 10
								}
								}}
							/>
							))}
						</ListItem>
					{showLoader ? 
					[...Array(6)].map((_, rowIndex) => (
                        <ListItem
                            key={rowIndex}
                            style={{
                                display: "table-row",
                                backgroundColor: "#212121",
                            }}
                        >
                            {Array(8)
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
                    )):
						files.length === 0 ? (
							<div style={{textAlign: "center"}}>
								<Typography style={{padding: 25, fontSize: 18, textAlign: 'center'}}>
								No files found
							</Typography>
							</div>
						):(
							files?.map((file, index) => {
								if (file.namespace === "") {
									file.namespace = "default";
								}
	
								if (file.namespace !== selectedCategory) {
									return null;
								}
	
								var bgColor = isSelectedFiles ? "#212121":"#27292d";
								if (index % 2 === 0) {
									bgColor = isSelectedFiles ? "#1A1A1A":"#1f2023";
								}
								const isDistributed = file?.suborg_distribution?.length > 0 ? true : false;
								const filenamesplit = file.filename.split(".")
								const iseditable = file.filesize < 2000000 && file.status === "active" && (allowedFileTypes.includes(filenamesplit[filenamesplit.length-1]) || !file?.filename.includes("."))
								return (
									<ListItem
										key={index}
										style={{
											display: 'table-row',
											backgroundColor: bgColor,
											maxHeight: 100,
											overflow: "hidden",
											borderBottomLeftRadius: files?.length - 1 === index ? 8 : 0, 
											borderBottomRightRadius: files?.length - 1 === index ? 8 : 0,
										}}
									>
										{/*
										<ListItemText
											style={{
												maxWidth: isSelectedFiles ? 170:225,
												minWidth: isSelectedFiles ? 170:225,
												overflow: "hidden",
											}}
											primary={new Date(file.updated_at * 1000).toISOString()}
										/>
										*/}
										<ListItemText
											style={{
												display: 'table-cell',
												overflow: "hidden",
												textAlign: "center",
											}}
										>
											<Checkbox
												style={{ padding: 0 }}
												disabled={file.org_id !== selectedOrganization.id}
												checked={!!selectedFiles[index] || selectAllChecked}
												onChange={() => {handleFileCheckboxChange(index); setSelectedFileId(prev => {
													if (prev.includes(file.id)) {
														return prev.filter((item) => item !== file.id)
													} else {
														return [...prev, file.id]
													}
												})}}
											/>
										</ListItemText>
										<ListItemText
											primaryTypographyProps={{
												style: {
												  maxWidth: "170px",
												  whiteSpace: 'nowrap',
												  textOverflow: 'ellipsis',
												  overflow: 'hidden',
												  padding: "8px 8px 8px 20px"
												}
											}}
											primary={file.filename}
										/>
										<ListItemText
											primary={
												file.workflow_id === "global" || file.workflow_id === "" || file.workflow_id === null || file.workflow_id === undefined ?
													<IconButton
														disabled={file.workflow_id === "global"}
														style={{marginLeft: 10}}
													>
														<OpenInNewIcon
															style={{
																color:
																	file.workflow_id !== "global"
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
																href={`/workflows/${file.workflow_id}`}
																target="_blank"
															>
																<IconButton
																	disabled={file.workflow_id === "global"}
																	style={{marginLeft: 10}}
																>
																	<OpenInNewIcon
																		style={{
																			width: 24, height: 24,
																			color:
																				file.workflow_id !== "global"
																					? "#FF8444"
																					: "grey",
																		}}
																	/>
																</IconButton>
															</a>
														</span>
													</Tooltip>
												)
											}
											style={{
												display: 'table-cell',
												overflow: "hidden",
											}}
										/>
										<ListItemText
											primary={(
												<Tooltip title={file.md5_sum}>
													{file.md5_sum}
												</Tooltip>
											)}
											primaryTypographyProps={{
												style:{
													display: 'table-cell',
													marginLeft:isSelectedFiles? 15:null,
													overflow: "hidden",
													whiteSpace: 'nowrap',
													textOverflow: 'ellipsis',
													maxWidth: 200,
												}
											}}
										/>
										<ListItemText
											primary={file.status}
											style={{
												display: 'table-cell',
												overflow: "hidden",
												textAlign:isSelectedFiles?"center":null,
												color: file.status === "active" ? "#2BC07E" : "#FD4C62"
											}}
										/>
										<ListItemText
											primary={file.filesize}
											style={{
												display: 'table-cell',
												overflow: "hidden",
												textAlign:'center'
											}}
										/>
										<ListItemText
											primary=<span style={{ display:"inline"}}>
												<Tooltip
													title={`Edit File (${allowedFileTypes.join(", ")}). Max size 2MB`}
													style={{}}
													aria-label={"Edit"}
												>
													<span>
														<IconButton
															disabled={!iseditable || file.org_id !== selectedOrganization.id}
															style = {{padding: "6px", }}
															onClick={() => {
																setOpenEditor(true)
																setOpenFileId(file.id)
																readFileData(file)
															}}
														>
															<img src="/icons/editIcon.svg" alt="edit icon"
																style={{color: iseditable ? "white" : "grey", width: 24, height: 24}}
															/>
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
															onClick={() => {
																downloadFile(file);
															}}
														>
															<img src="/icons/downloadIcon.svg" alt="download icon"
																style={{
																	width: 24, height: 24,
																	color:
																		file.status === "active"
																			? "white"
																			: "grey",
																}}
															/>
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
														onClick={() => {
																navigator.clipboard.writeText(file.id);
																document.execCommand("copy");
	
																toast(file.id + " copied to clipboard");
														}}
													>
														<img src="/icons/copyIcon.svg" alt="copy icon" style={{ color: "white", width: 24, height: 24 }} />
													</IconButton>
												</Tooltip>
												<Tooltip
													title={"Delete file"}
													style={{marginLeft: isSelectedFiles?5:15, }}
													aria-label={"Delete"}
												>
													<span>
														<IconButton
															disabled={file.status !== "active" || file.org_id !== selectedOrganization.id}
															style={{ padding: "6px" }}
															onClick={() => {
															deleteFile(file);
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
											style={{
												display: 'table-cell',
												textAlign:'center'
												// overflow: "hidden",
											}}
										/>
										<ListItemText primaryTypographyProps={{
                                    style: {
                                      padding: 8
                                    }
                                  }} style={{ display: "table-cell", textAlign: 'center', verticalAlign: 'middle'}} >
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
                                              color="secondary"
                                              onClick={() => {
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
                              </ListItemText>
									</ListItem>
								);
							})
						)
					}
				</List>
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
