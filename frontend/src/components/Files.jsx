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
} from "@mui/material";

import {
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

//import { useAlert 
import Dropzone from "../components/Dropzone.jsx";
import CodeEditor from "../components/ShuffleCodeEditor.jsx";
import theme from "../theme.jsx";

const Files = (props) => {
  const { globalUrl, userdata, serverside, selectedOrganization, isCloud, } = props;

  const [files, setFiles] = React.useState([]);
  const [selectedNamespace, setSelectedNamespace] = React.useState("default");
  const [openFileId, setOpenFileId] = React.useState(false);
  const [fileNamespaces, setFileNamespaces] = React.useState([]);
  const [fileContent, setFileContent] = React.useState("");
  const [openEditor, setOpenEditor] = React.useState(false);
  const [renderTextBox, setRenderTextBox] = React.useState(false);

  //const alert = useAlert();
  const allowedFileTypes = ["txt", "py", "yaml", "yml","json", "html", "js", "csv", "log"]
  var upload = "";

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {

      console.log('do validate')
      console.log("new namespace name->",event.target.value);      
      fileNamespaces.push(event.target.value);
      setSelectedNamespace(event.target.value);
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
    }).then((response) => {
        if (response.status !== 200) {
          console.log("Can't update file");
        }
        return response.json();
      })
    //console.log(text);
  }

	const getFiles = () => {
    fetch(globalUrl + "/api/v1/files", {
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
        } else {
          setFiles([]);
        }

        if (responseJson.namespaces !== undefined && responseJson.namespaces !== null) {
          setFileNamespaces(responseJson.namespaces);
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

	useEffect(() => {
		getFiles();
	}, []);

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
          toast("Successfully deleted file " + file.name);
        } else if (
          responseJson.reason !== undefined &&
          responseJson.reason !== null
        ) {
          toast("Failed to delete file: " + responseJson.reason);
        }
        setTimeout(() => {
          getFiles();
        }, 1500);

        console.log(responseJson);
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const readFileData = (file) => {
    fetch(globalUrl + "/api/v1/files/" + file.id + "/content", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
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
        toast(error.toString());
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
      selectedNamespace !== undefined &&
      selectedNamespace !== null &&
      selectedNamespace.length > 0 &&
      selectedNamespace !== "default"
    ) {
      data.namespace = selectedNamespace;
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
      getFiles();
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
				padding: 20,
			}}
			onDrop={uploadFile}
		>
			<div>
				<div style={{ marginTop: 20, marginBottom: 20 }}>
					<h2 style={{ display: "inline" }}>Files</h2>
					<span style={{ marginLeft: 25 }}>
						Files from Workflows.{" "}
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://shuffler.io/docs/organizations#files"
							style={{ textDecoration: "none", color: "#f85a3e" }}
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
					style={{ marginLeft: 5, marginRight: 15 }}
					variant="contained"
					color="primary"
					onClick={() => getFiles()}
				>
					<CachedIcon />
				</Button>

				{fileNamespaces !== undefined &&
				fileNamespaces !== null &&
				fileNamespaces.length > 1 ? (
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
							value={selectedNamespace}
							onChange={(event) => {
								console.log("CHANGE NAMESPACE: ", event.target);
								setSelectedNamespace(event.target.value);
							}}
						>
							{fileNamespaces.map((data, index) => {
								return (
									<MenuItem
										key={index}
										value={data}
										style={{ color: "white" }}
									>
										{data}
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
				</Tooltip> }
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

				<CodeEditor
					isCloud={isCloud}
					expansionModalOpen={openEditor}
					setExpansionModalOpen={setOpenEditor}
					setcodedata = {setFileContent}
					codedata={fileContent}
					isFileEditor = {true}
					key = {fileContent} //https://reactjs.org/docs/reconciliation.html#recursing-on-children
					runUpdateText = {runUpdateText}
				/>

				<Divider
					style={{
						marginTop: 20,
						marginBottom: 20,
						backgroundColor: theme.palette.inputColor,
					}}
				/>

				<List>
					<ListItem>
						<ListItemText
							primary="Updated"
							style={{ maxWidth: 225, minWidth: 225 }}
						/>
						<ListItemText
							primary="Name"
							style={{
								maxWidth: 150,
								minWidth: 150,
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
							style={{ minWidth: 300, maxWidth: 300, overflow: "hidden" }}
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

							if (file.namespace !== selectedNamespace) {
								return null;
							}

							var bgColor = "#27292d";
							if (index % 2 === 0) {
								bgColor = "#1f2023";
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
									<ListItemText
										style={{
											maxWidth: 225,
											minWidth: 225,
											overflow: "hidden",
										}}
										primary={new Date(file.updated_at * 1000).toISOString()}
									/>
									<ListItemText
										style={{
											maxWidth: 150,
											minWidth: 150,
											overflow: "hidden",
											marginLeft: 10,
										}}
										primary={file.filename}
									/>
									<ListItemText
										primary={
											file.workflow_id === "global" ? (
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
											) : (
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
										}}
									/>
									<ListItemText
										primary={file.md5_sum}
										style={{
											minWidth: 300,
											maxWidth: 300,
											overflow: "hidden",
										}}
									/>
									<ListItemText
										primary={file.status}
										style={{
											minWidth: 75,
											maxWidth: 75,
											overflow: "hidden",
											marginLeft: 10,
										}}
									/>
									<ListItemText
										primary={file.filesize}
										style={{
											minWidth: 125,
											maxWidth: 125,
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
												style={{marginLeft: 15, }}
												aria-label={"Delete"}
											>
												<span>
													<IconButton
														disabled={file.status !== "active"}
														style = {{padding: "6px"}}
														onClick={() => {
															deleteFile(file);
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
