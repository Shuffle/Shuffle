import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";

import Dropzone from "../components/Dropzone.jsx";
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";
import theme from "../theme.jsx";

const Files = (props) => {
  const { globalUrl, userdata, serverside, selectedOrganization, isCloud,isSelectedFiles } = props;

  const [files, setFiles] = React.useState([]);
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

  //const alert = useAlert();
  const allowedFileTypes = ["txt", "py", "yaml", "yml","json", "html", "js", "csv", "log", "eml", "msg", "md", "xml", "sh", "bat", "ps1", "psm1", "psd1", "ps1xml", "pssc", "psc1", "response"]
  var upload = "";

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {

      console.log('do validate')
      console.log("new namespace name->",event.target.value);      
      fileCategories.push(event.target.value);
      setSelectedCategory(event.target.value);
      setRenderTextBox(false);
    }

    if (event.key === 'Escape'){ // not working for some reasons
      console.log('escape pressed')
      setRenderTextBox(false);  
    }

  }

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
		} else {
          setFiles([]);
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
      onClose={() => {}}
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
          style={{ backgroundColor: theme.palette.inputColor }}
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
              style={{ backgroundColor: theme.palette.inputColor }}
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
                style={{ backgroundColor: theme.palette.inputColor }}
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
            style={{ flex: 1, backgroundColor: theme.palette.inputColor }}
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
            style={{ flex: 1, backgroundColor: theme.palette.inputColor }}
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
          style={{ borderRadius: "0px" }}
          onClick={() => setLoadFileModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        <Button
		  variant="contained"
          style={{ borderRadius: "0px" }}
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
    }, 2500);
  };

  const uploadFile = (e) => {
    const isDropzone =
      e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;

    //const reader = new FileReader();
    //toast("Starting fileupload")
    uploadFiles(files);
  };

	return (
		<Dropzone
			style={{
				maxWidth: window.innerWidth > 1366 ? 1366 : 1200,
				margin: "auto",
				padding: isSelectedFiles ? null : 20,
			}}
			onDrop={uploadFile}
		>
			<div style={{position: "relative", width: isSelectedFiles? 1030: null, padding:isSelectedFiles?27:null, height: isSelectedFiles?"auto":null, color: isSelectedFiles?'#ffffff':null, backgroundColor: isSelectedFiles?'#212121':null, borderRadius: isSelectedFiles?'16px':null,}}>

        		<Tooltip color="primary" title={"Import files to Shuffle from Git"} placement="top">
				  <IconButton
        		    color="secondary"
        		    style={{position: "absolute", right: 0, top: isSelectedFiles?null:0, left: isSelectedFiles? 990:null }}
        		    variant="text"
        		    onClick={() => setLoadFileModalOpen(true)}
        		  >
        		    <CloudDownloadIcon />
        		  </IconButton>
        		</Tooltip>

				{fileDownloadModal} 

				<div style={{ marginTop: isSelectedFiles ? 2: 20, marginBottom:20 }}>
					<h2 style={{ display: isSelectedFiles ? null : "inline", marginTop: isSelectedFiles?0:null, marginBottom: isSelectedFiles?8:null }}>Files</h2>
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
					style={{backgroundColor: isSelectedFiles?'rgba(255, 132, 68, 0.2)':null, color:isSelectedFiles?"#FF8444":null, borderRadius:isSelectedFiles?200:null, width:isSelectedFiles?162:null, height:isSelectedFiles?40:null, boxShadow: isSelectedFiles?'none':null,}}
				>
					<PublishIcon /> Upload files
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
					style={{ marginLeft: 5, marginRight: 15, backgroundColor:isSelectedFiles?"#2F2F2F":null,borderRadius:isSelectedFiles?200:null, width:isSelectedFiles?81:null, height:isSelectedFiles?40:null, boxShadow: isSelectedFiles?'none':null, }}
					variant="contained"
					color="primary"
					onClick={() => getFiles(selectedCategory)}
				>
					<CachedIcon />
				</Button>



				{fileCategories !== undefined &&
				fileCategories !== null &&
				fileCategories.length > 1 ? (
					<FormControl style={{ minWidth: 150, maxWidth: 150 }}>
						<InputLabel id="input-namespace-label">File Category</InputLabel>
						<Select
							labelId="input-namespace-select-label"
							id="input-namespace-select-id"
							style={{
								color: "white",
								minWidth: 150,
								maxWidth: 150,
								float: "right",
							}}
							value={selectedCategory}
							onChange={(event) => {
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
					</FormControl>
				) : null}
				<div style={{display: "inline-flex", position:"relative"}}>
				{renderTextBox ? 
				
					<Tooltip title={"Close"} style={{}} aria-label={""}>
						<Button
							style={{ marginLeft: 5, marginRight: 15 }}
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
							style={{ marginLeft: 5, marginRight: 15 }}
							color="primary"
							onClick={() => {
								setRenderTextBox(true);
								}}
						>
							<AddIcon/>
						</Button>
					</Tooltip> 
				}

				{renderTextBox && <TextField
					onKeyPress={(event)=>{
						handleKeyDown(event);
					}}
					InputProps={{
						style: {
							color: "white",
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
						backgroundColor: theme.palette.inputColor,
					}}
				/>}

				<List style={{borderRadius: isSelectedFiles?8:null, border:isSelectedFiles?"1px solid #494949":null, marginTop:isSelectedFiles?24:null}}>
					<ListItem style={{width:isSelectedFiles?"100%":null, borderBottom:isSelectedFiles?"1px solid #494949":null}}>
						{/*
						<ListItemText
							primary="Updated"
							style={{ maxWidth: 185, minWidth: 185 }}
						/>
						*/}
						<ListItemText
							primary="Name"
							style={{
								maxWidth: 250,
								minWidth: 250,
								overflow: "hidden",
								marginLeft: 10,
							}}
						/>
						<ListItemText
							primary="Workflow"
							style={{ maxWidth: 100, minWidth: 100, overflow: "hidden" }}
						/>
						<ListItemText
							primary="Md5"
							style={{ minWidth: 300, maxWidth: 300,  overflow: "hidden" }}
						/>
						<ListItemText
							primary="Status"
							style={{ minWidth: 75, maxWidth: 75, marginLeft: 10 }}
						/>
						<ListItemText
							primary="Filesize"
							style={{ minWidth: 125, maxWidth: 125 }}
						/>
						<ListItemText primary="Actions" />
					</ListItem>
					{files === undefined || files === null || files.length === 0 ? null :
						files.map((file, index) => {
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

							const filenamesplit = file.filename.split(".")
							const iseditable = file.filesize < 2000000 && file.status === "active" && allowedFileTypes.includes(filenamesplit[filenamesplit.length-1])

							return (
								<ListItem
									key={index}
									style={{
										backgroundColor: bgColor,
										maxHeight: 100,
										overflow: "hidden",
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
											maxWidth: 250,
											minWidth: 250,
											overflow: "hidden",
											marginLeft: 10,
										}}
										primary={file.filename}
									/>
									<ListItemText
										primary={
											file.workflow_id === "global" || file.workflow_id === "" || file.workflow_id === null || file.workflow_id === undefined ?
												<IconButton
													disabled={file.workflow_id === "global"}
												>
													<OpenInNewIcon
														style={{
															color:
																file.workflow_id !== "global"
																	? "white"
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
															>
																<OpenInNewIcon
																	style={{
																		color:
																			file.workflow_id !== "global"
																				? "white"
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
											minWidth: 100,
											maxWidth: 100,
											overflow: "hidden",
											textAlign: isSelectedFiles?"center":null
										}}
									/>
									<ListItemText
										primary={file.md5_sum}
										style={{
											minWidth: 300,
											maxWidth: 300,
											marginLeft:isSelectedFiles? 15:null,
											overflow: isSelectedFiles?"auto":"hidden",
										}}
									/>
									<ListItemText
										primary={file.status}
										style={{
											minWidth: 75,
											maxWidth: 75,
											overflow: "hidden",
											textAlign:isSelectedFiles?"center":null,
											marginLeft: 10,
										}}
									/>
									<ListItemText
										primary={file.filesize}
										style={{
											minWidth: isSelectedFiles?80:125,
											maxWidth: isSelectedFiles?80:125,
											marginLeft: isSelectedFiles?15:null,
											overflow: "hidden",
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
														disabled={!iseditable}
														style = {{padding: "6px"}}
														onClick={() => {
															setOpenEditor(true)
															setOpenFileId(file.id)
															readFileData(file)
														}}
													>
														<EditIcon
															style={{color: iseditable ? "white" : "grey",}}
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
														<CloudDownloadIcon
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
											<Tooltip
												title={"Copy file ID"}
												style={{}}
												aria-label={"copy"}
											>
												<IconButton
													style = {{padding: "6px"}}
													onClick={() => {
														const elementName = "copy_element_shuffle";
														var copyText =
															document.getElementById(elementName);
														if (
															copyText !== null &&
															copyText !== undefined
														) {
															const clipboard = navigator.clipboard;
															if (clipboard === undefined) {
																toast(
																	"Can only copy over HTTPS (port 3443)"
																);
																return;
															}

															navigator.clipboard.writeText(file.id);
															copyText.select();
															copyText.setSelectionRange(
																0,
																99999
															); /* For mobile devices */

															/* Copy the text inside the text field */
															document.execCommand("copy");

															toast(file.id + " copied to clipboard");
														}
													}}
												>
													<FileCopyIcon style={{ color: "white" }} />
												</IconButton>
											</Tooltip>
											<Tooltip
												title={"Delete file"}
												style={{marginLeft: isSelectedFiles?5:15, }}
												aria-label={"Delete"}
											>
												<span>
													<IconButton
														disabled={file.status !== "active"}
														style = {{padding: "6px"}}
														onClick={() => {
															deleteFile(file)
														}}
													>
														<DeleteIcon
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
										</span>
										style={{
											minWidth: 250,
											maxWidth: 250,
											// overflow: "hidden",
										}}
									/>
								</ListItem>
							);
						})
					}
				</List>
			</div>
		</Dropzone>
	)
}

export default Files;
