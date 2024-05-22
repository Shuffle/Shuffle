import React, { useState, useEffect } from "react"
import { useInterval } from "react-powerhooks"
import AppFramework from "../components/AppFramework.jsx"
import { makeStyles, } from "@mui/styles"
import classNames from "classnames"
import theme from '../theme.jsx'
import { useNavigate, Link, useParams } from "react-router-dom"
import WorkflowTemplatePopup from "../components/WorkflowTemplatePopup.jsx"
import { ToastContainer, toast } from "react-toastify" 
import { parsedDatatypeImages } from "../components/AppFramework.jsx"
import { findSpecificApp } from "../components/AppFramework.jsx"

import {
	Autocomplete,
	Tooltip,
	TextField,
	IconButton,
	Button,
	Typography,
	Grid,
	Paper,
	Chip,
	Checkbox,
} from "@mui/material";

import {
  Close as CloseIcon,
	DoneAll as DoneAllIcon,
	Description as DescriptionIcon,
	PlayArrow as PlayArrowIcon,
	Edit as EditIcon,
	CheckBox as CheckBoxIcon,
	CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
	OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";

import WorkflowPaper from "../components/WorkflowPaper.jsx"
import { removeParam } from "../views/AngularWorkflow.jsx"

// core components
//import {
//  chartExample1,
//  chartExample2,
//  chartExample3,
//  chartExample4,
//} from "../charts.js";

import { 
	RadialBarChart, 
	RadialAreaChart, 
	RadialAxis,
	StackedBarSeries,
	TooltipArea,
	ChartTooltip,
	TooltipTemplate,
	RadialAreaSeries,
	RadialPointSeries,
	RadialArea,
	RadialLine,
	TreeMap,
	TreeMapSeries,
	TreeMapLabel,
	TreeMapRect,
} from 'reaviz';

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
  root: {
    "& .MuiAutocomplete-listbox": {
      border: "2px solid #f85a3e",
      color: "white",
      fontSize: 18,
      "& li:nth-child(even)": {
        backgroundColor: "#CCC",
      },
      "& li:nth-child(odd)": {
        backgroundColor: "#FFF",
      },
    },
  },
  inputRoot: {
    color: "white",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#f86a3e",
    },
  },
});



const UsecaseListComponent = (props) => {
	const { keys, userdata, isCloud, globalUrl, frameworkData, isLoggedIn, workflows, setWorkflows, getFramework, setFrameworkData, } = props


	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [expandedItem, setExpandedItem] = useState(-1);
	const [inputUsecase, setInputUsecase] = useState({});

	const [prevSubcase, setPrevSubcase] = useState({})

	const [editing, setEditing] = useState(false);
	const [description, setDescription] = useState("");
	const [video, setVideo] = useState("");
	const [blogpost, setBlogpost] = useState("");
	const [workflowOutline, setWorkflowOutline] = useState("");

	const [selectedWorkflows, setSelectedWorkflows] = useState([])
	const [firstLoad, setFirstLoad] = useState(true)
	const [apps, setApps] = useState([])


    const classes = useStyles();
	let navigate = useNavigate();

	const [mitreTags, setMitreTags] = useState([]);


	const parseUsecase = (subcase) => {
	  const srcdata = findSpecificApp(frameworkData, subcase.type)
	  const dstdata = findSpecificApp(frameworkData, subcase.last)
	
	  if (srcdata !== undefined && srcdata !== null) { 
		subcase.srcimg = srcdata.large_image 
		subcase.srcapp = srcdata.name
	  }

	  if (dstdata !== undefined && dstdata !== null) {
		  subcase.dstimg = dstdata.large_image
		  subcase.dstapp = dstdata.name
	  }

	  return subcase 
  }

	useEffect(() => {
		//console.log("Frameworkdata changed. Use to set inputUsecase: ", frameworkData, prevSubcase)
		if (frameworkData === undefined || prevSubcase === undefined) {
			return
		}

		var parsedUsecase = inputUsecase
		const subcase = parseUsecase(prevSubcase)

		parsedUsecase.srcimg = subcase.srcimg
		parsedUsecase.srcapp = subcase.srcapp
		parsedUsecase.dstimg = subcase.dstimg
		parsedUsecase.dstapp = subcase.dstapp

		setInputUsecase(parsedUsecase)
	}, [frameworkData])

	const loadApps = () => {
		fetch(`${globalUrl}/api/v1/apps`, {
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  credentials: "include",
		})
      	.then((response) => {
        	return response.json();
      	})
      	.then((responseJson) => {
			if (responseJson === null) {
			  console.log("null-response from server")
			  const pretend_apps = [{
				"name": "TBD",
				"app_name": "TBD",
				"app_version": "TBD",
				"description": "TBD",
				"version": "TBD",
				"large_image": "",
			  }]
				
			  setApps(pretend_apps)
			  return
			}

			if (responseJson.success === false) {
				console.log("error loading apps: ", responseJson)
			  	return
			}
        
			setApps(responseJson);
		})
		.catch((error) => {
        	console.log("App loading error: " + error.toString());
		})
	}

	  useEffect(() => {
		loadApps() 
	  }, [])

	if (keys === undefined || keys === null || keys.length === 0) {
		return null
	}	

  

  // Timeout 50ms to delay it slightly 
  const getUsecase = (subcase, index, subindex) => {
	subcase = parseUsecase(subcase)
	setPrevSubcase(subcase)

    fetch(`${globalUrl}/api/v1/workflows/usecases/${escape(subcase.name.replaceAll(" ", "_"))}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
	.then((response) => {
		if (response.status !== 200) {
			console.log("Status not 200 for framework!");
		}

		return response.json();
	})
	.then((responseJson) => {
		var parsedUsecase = responseJson

		if (responseJson.success === false) {
			parsedUsecase = subcase
		} else {
			parsedUsecase = responseJson

			parsedUsecase.srcimg = subcase.srcimg
			parsedUsecase.srcapp = subcase.srcapp
			parsedUsecase.dstimg = subcase.dstimg
			parsedUsecase.dstapp = subcase.dstapp
		}

		// Look for the type of app and fill in img1, srcapp...
		setInputUsecase(parsedUsecase)
		setExpandedIndex(index)
		setExpandedItem(subindex)

		setTimeout(() => {
			const found = document.getElementById("selected_box");
			if (found !== undefined && found !== null) {
				//console.log("FOUND!!")

				//found.scrollTo({
				//	top: 100,
				//	behavior: "smooth",
				//})
			} else {
				//console.log("NOT FOUND!!")
			}

			setFirstLoad(true)
			setSelectedWorkflows([])
		}, 100)
	})
	.catch((error) => {
		//toast(error.toString());
		setInputUsecase({})
		setExpandedIndex(index)
		setExpandedItem(subindex)

		setFirstLoad(true)
		setSelectedWorkflows([])
	})
  }

	const setUsecaseItem = (inputUsecase) => {
		var parsedUsecase = inputUsecase

		if (blogpost !== inputUsecase.blogpost) {
			inputUsecase.blogpost = blogpost
			parsedUsecase.blogpost = blogpost 
		}

		if (video !== inputUsecase.video) {
			inputUsecase.video = video 
			parsedUsecase.video = video 
		}

		if (description !== inputUsecase.description) {
			inputUsecase.description = description 
			parsedUsecase.description = description
		}

		if (mitreTags !== inputUsecase.mitre) {
			inputUsecase.mitre = mitreTags
			parsedUsecase.mitre = mitreTags 
		}

		if (workflowOutline !== inputUsecase.workflow_outline) {
			inputUsecase.workflow_outline = workflowOutline 
			parsedUsecase.workflow_outline = workflowOutline
		}

    fetch(globalUrl + "/api/v1/workflows/usecases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(parsedUsecase),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for framework!");
        }

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson.success === false) {
					if (responseJson.reason !== undefined) {
						//toast("Failed updating: " + responseJson.reason)
					} else {
						//toast("Failed to update framework for your org.")
					}
				} else {
					//toast("Updated usecase.")
				}
			})
      .catch((error) => {
        //toast(error.toString());
		//setFrameworkLoaded(true)
      })
	}

  const setWorkflow = (workflowdata) => {
		const new_url = `${globalUrl}/api/v1/workflows/${workflowdata.id}`

    fetch(new_url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(workflowdata),
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
			if (responseJson.success === false) {
				if (responseJson.reason !== undefined) {
					toast("Error updating workflow: ", responseJson.reason)
				} else {
					toast("Error updating workflow.")
				}

				return
			}

			return responseJson;
		})
		.catch((error) => {
			toast("Problem setting workflow: ", error.toString());
		});
  };

	return (
		<div style={{marginTop: 25, minHeight: 1000,}}>
			<Typography variant="h1">
				Shuffle usecases
			</Typography>
			<Typography variant="body1">
				Usecases in Shuffle are divided into {keys.length} type{keys.length === 1 ? "" : "s"}. 
			</Typography>
			{keys.map((usecase, index) => {
				return (
					<div key={index} style={{marginTop: index === 0 ? 50 : 100}}>
						<Typography variant="h6">
							{usecase.name}
						</Typography>
      			<Grid container spacing={3} style={{marginTop: 25}}>
							{usecase.list.map((subcase, subindex) => {
								const selectedItem = subindex === expandedItem && index === expandedIndex

								if (subcase.matches === undefined || subcase.matches === null) {
									subcase.matches = []
								} else {
									if (selectedItem && subcase.matches.length > 0 && selectedWorkflows.length === 0 && firstLoad === true) {
										setFirstLoad(false)
										setSelectedWorkflows(subcase.matches)

									}
								}

								if (selectedItem && subcase.name !== undefined && inputUsecase.name !== undefined) { 
									if (subcase.name.toLowerCase().replaceAll(" ", "_") === inputUsecase.name.toLowerCase().replaceAll(" ", "_")) {
										if (inputUsecase.description !== undefined && inputUsecase.description !== null) {
											subcase.description = inputUsecase.description
										}

										if (inputUsecase.blogpost !== undefined && inputUsecase.blogpost !== null) {
											subcase.blogpost = inputUsecase.blogpost
										}

										if (inputUsecase.video !== undefined && inputUsecase.video !== null) {
											subcase.video = inputUsecase.video
										}

										if (inputUsecase.extra_buttons !== undefined && inputUsecase.extra_buttons !== null) {
											subcase.extra_buttons = inputUsecase.extra_buttons
										}

										if (inputUsecase.workflow_outline !== undefined && inputUsecase.workflow_outline !== null) {
											subcase.workflow_outline = inputUsecase.workflow_outline
										}
									}
								}

								const finished = subcase.matches.length > 0
								const backgroundColor = theme.palette.surfaceColor
								const itemBorder = `${selectedItem ? "3px" : expandedItem >= 0 ? "0px" : "1px"} solid ${usecase.color}`

								const fixedName = subcase.name.toLowerCase().replace("_", " ")

								return (
      								<Grid id={fixedName} item xs={selectedItem ? 12 : 4} key={subindex} style={{minHeight: 110,}} onClick={() => {
										if (fixedName === "increase authentication") {
											getUsecase(subcase, index, subindex) 
											return
										}

										//setSelectedWorkflows([])
										if (selectedItem) {
										} else {
											getUsecase(subcase, index, subindex) 
											navigate(`/usecases?selected_object=${fixedName}`)
										}
									}}>
										<Paper style={{padding: 25, minHeight: isCloud ? 75 : 122, cursor: !selectedItem ? "pointer" : "default", border: itemBorder, backgroundColor: backgroundColor,}} onClick={() => {
										}}>
											{!selectedItem ? 
												<div style={{textAlign: "left", position: "relative",}}>
													<Typography variant="h6" style={{maxWidth: 215}}>
														<b>{subcase.name}</b>
													</Typography>
															{finished ? 
																<Tooltip
																	title="A workflow has been assigned for this use case"
																	placement="top"
																>
																	<IconButton
																		style={{
																				position: "absolute",
																				bottom: 15,
																				right: -15,
																		}}
																		onClick={(e) => {
																		}}
																	>
																		<DoneAllIcon style={{ color: usecase.color }} />
																	</IconButton>
																</Tooltip>
															: null}
															{subcase.blogpost !== null && subcase.blogpost !== undefined && subcase.blogpost.length > 0 ? 
																<a 
																	href={subcase.blogpost}
																	rel="noopener noreferrer"
																	target="_blank"
                  								style={{ textDecoration: "none", color: "#f85a3e" }}
																>
																	<Tooltip
																		title="Click to visit the blogpost"
																		placement="top"
																	>
																		<IconButton
																			style={{
																				position: "absolute",
																				bottom: -25,
																				right: -15,
																			}}
																			onClick={(e) => {
																			}}
																		>
																			<DescriptionIcon style={{ color: usecase.color }} />
																		</IconButton>
																	</Tooltip>
																</a>
															: null}
															{subcase.video !== null && subcase.video !== undefined && subcase.video.length > 0 ? 
																<a 
																	href={subcase.video}
																	rel="noopener noreferrer"
																	target="_blank"
																	style={{ textDecoration: "none", color: "#f85a3e" }}
																>
																	<Tooltip
																		title="Click to see a video for this usecase"
																		placement="top"
																	>
																		<IconButton
																			style={{
																				position: "absolute",
																				bottom: -65,
																				right: -15,
																			}}
																			onClick={(e) => {
																			}}
																		>
																			<PlayArrowIcon style={{ color: usecase.color }} />
																		</IconButton>
																	</Tooltip>
																</a>
															: null}
												</div>
											: 
												<div style={{textAlign: "left", position: "relative", }} id="selected_box">
													<Typography variant="h6">
														<b>{subcase.name}</b>
													</Typography>
													<div style={{ position: "absolute", top: 0, right: 0 }}>
														{isLoggedIn === true ? 
															<Tooltip
																title="Click to edit"
																placement="top"
															>
																<IconButton
																	style={{paddingTop: 5, }}
																	onClick={(e) => {
																		setEditing(true)
																		if (subcase.description !== undefined && subcase.description !== null) {
																			setDescription(subcase.description)
																		}

																		if (subcase.blogpost !== undefined && subcase.blogpost !== null) {
																			setBlogpost(subcase.blogpost)
																		}

																		if (subcase.video !== undefined && subcase.video !== null) {
																			setVideo(subcase.video)
																		}

																		if (subcase.mitre !== undefined && subcase.mitre !== null) {
																			setMitreTags(subcase.mitre)
																		}

																		if (subcase.workflow_outline !== undefined && subcase.workflow_outline !== null) {
																			setWorkflowOutline(subcase.workflow_outline)
																		} else {
																			setWorkflowOutline("")
																		}
																	}}
																>
																	<EditIcon style={{ color: usecase.color }} />
																</IconButton>
															</Tooltip>
														: null}
														{subcase.blogpost !== null && subcase.blogpost !== undefined && subcase.blogpost.length > 0 ? 
																<a 
																	href={subcase.blogpost}
																	rel="noopener noreferrer"
																	target="_blank"
                  								style={{ textDecoration: "none", color: "#f85a3e" }}
																>
																	<Tooltip
																		title="Click to visit the blogpost"
																		placement="top"
																	>
																		<IconButton
																			style={{paddingTop: 5, }}
																			onClick={(e) => {
																			}}
																		>
																			<DescriptionIcon style={{ color: usecase.color }} />
																		</IconButton>
																	</Tooltip>
																</a>
															: null}
															{subcase.video !== null && subcase.video !== undefined && subcase.video.length > 0 ? 
																<a 
																	href={subcase.video}
																	rel="noopener noreferrer"
																	target="_blank"
                  								style={{ textDecoration: "none", color: "#f85a3e" }}
																>
																	<Tooltip
																		title="See video for this use case"
																		placement="top"
																	>
																		<IconButton
																			style={{paddingTop: 5,}}
																			onClick={(e) => {
																			}}
																		>
            													<PlayArrowIcon style={{ color: usecase.color }} />
																		</IconButton>
																	</Tooltip>
																</a>
														: null}
          									<Tooltip
          									  title="Close window"
          									  placement="top"
          									  style={{ zIndex: 10011 }}
          									>
          									  <IconButton
          									    style={{}}
												index="close_selection"
          									    onClick={(e) => {
													setExpandedItem(-1)
													setExpandedIndex(-1)
													setEditing(false)
													setInputUsecase({})
          									    }}
          									  >
          									    <CloseIcon style={{ color: "white" }} />
          									  </IconButton>
          									</Tooltip>
													</div>
													<div style={{marginTop: 25, display: "flex", minHeight: 400, maxHeight: 400, marginRight: 15, }}>
														{editing ? 
															<div style={{flex: 1, marginRight: 50, }}>
																<TextField
          											  style={{
          											    marginTop: 10,
          											    marginRight: 10,
          											  }}
																	variant="outlined"
          											  fullWidth
          											  color="primary"
																	label="Description"
          											  placeholder={"Description"}
																	value={description}
																	onChange={(event) => {
																		setDescription(event.target.value)
																	}}
          											  id="descriptionEditng"
          											/>
																<TextField
          											  style={{
          											    marginTop: 10,
          											    marginRight: 10,
          											  }}
																	variant="outlined"
          											  fullWidth
          											  color="primary"
																	label="Blogpost"
          											  placeholder={"Blogpost"}
																	value={blogpost}
																	onChange={(event) => {
																		setBlogpost(event.target.value)
																	}}
          											  id="blogpostEditing"
          											/>
																<TextField
          											  style={{
          											    marginTop: 10,
          											    marginRight: 10,
          											  }}
																	variant="outlined"
          											  fullWidth
          											  color="primary"
																	label="Video"
          											  placeholder={"Video"}
																	value={video}
																	onChange={(event) => {
																		setVideo(event.target.value)
																	}}
          											  id="videoEditing"
          											/>
																<TextField
          											  style={{
          											    marginTop: 10,
          											    marginRight: 10,
          											  }}
																	variant="outlined"
          											  fullWidth
          											  color="primary"
																	label="Workflow Outline"
          											  placeholder={"Workflow Outline"}
																	value={workflowOutline}
																	multiline
																	minRows={3}
																	onChange={(event) => {
																		setWorkflowOutline(event.target.value)
																	}}
          											  id="workflowOutline"
																	tabIndex="-1"
          											/>

																<div
																	style={{
																		display: 'flex',
																	}}
																>
																	<Button
																		style={{
																			color: "white",
																			background: "#383b49",
																			border: "none",
																			height: 35,
																			flex: 1,
																			marginLeft: 5,
																			marginTop: 20,
																			cursor: "pointer"
																		}}
																		onClick={() => {
																			setDescription("")
																			setVideo("")
																			setBlogpost("")
																			setWorkflowOutline("")
																			setEditing(false)
																		}}
																	>
																		Cancel
																	</Button>
																	<Button
																		style={{
																			color: "white",
																			background: "#f85a3e",
																			border: "none",
																			height: 35,
																			flex: 1, 
																			marginLeft: 10,
																			marginTop: 20,
																			cursor: "pointer"
																		}}
																		onClick={(event) => {
																			setUsecaseItem(inputUsecase) 
																			setEditing(false)
																			setDescription("")
																			setVideo("")
																			setWorkflowOutline("")
																			setBlogpost("")
																		}}
																	>
																		Save	
																	</Button>
																</div>
															</div>
															: 
												<div style={{flex: 1, textAlign: "left", marginRight: 10, }}>
													<Typography variant="body1" color="textSecondary">
														{subcase.description}
													</Typography>

													{workflows !== undefined && workflows !== null && workflows.length > 0 ?
														<Typography variant="body1" style={{marginTop: 15, marginBottom: 10, }}>
															Select relevant workflows
														</Typography>
													: 
														<span style={{display: "flex"}}>
															<Typography variant="body1" style={{marginTop: 15, marginBottom: 10, }}>
																Find workflows related to this usecase: 
																	
															</Typography>
															<a href={`https://shuffler.io/search?tab=workflows&q=${subcase.name}`} style={{textDecoration: "none", }} target="_blank" rel="noopener noreferrer">
																<IconButton style={{paddingTop: 15, }}>
																	<OpenInNewIcon   style={{color: "#f85a3e", }}/>
																</IconButton>
															</a>
														</span>
													}

													{workflows !== undefined && workflows !== null && workflows.length > 0 ?
														<Autocomplete
															  multiple
          													  id="workflow_matching"
          													  options={workflows}
          													  autoHighlight
              											  	  value={selectedWorkflows}
          													  classes={{ inputRoot: classes.inputRoot }}
          													  ListboxProps={{
          													    style: {
          													      backgroundColor: theme.palette.inputColor,
          													      color: "white",
          													    },
          													  }}
															  getOptionSelected={(option, value) => option.id === value.id}
          													  getOptionLabel={(option) => {

          													    if (
          													      option === undefined ||
          													      option === null ||
          													      option.name === undefined ||
          													      option.name === null 
          													    ) {
          													      return "No Workflow Selected";
          													    }

          													    const newname = (option.name.charAt(0).toUpperCase() + option.name.substring(1)).replaceAll("_", " ");

          													    return newname;
          													  }}
          													  fullWidth
          													  style={{
          													    backgroundColor: theme.palette.inputColor,
          													    height: 50,
          													    borderRadius: theme.palette.borderRadius,
          													  }}
          													  onChange={(event, newValue) => {
																//handleWorkflowSelectionUpdate({ target: { value: newValue} })
																//setSelectedWorkflows=
																//var newvalue = []
																//for (var key in newValue) {
																//	if (newValue[key].id !== undefined) {
																//		newvalue.push(newValue[key].id)
																//	}
																//}

																// Doing this way as you may want to remove some too
																for (var key in workflows) {
																	if (!newValue.find(data => data.id === workflows[key].id)) {
																		// Check if it has the one in it
																		if (workflows[key]["usecase_ids"] !== undefined && workflows[key]["usecase_ids"] !== null && workflows[key]["usecase_ids"].includes(subcase.name)) {
																			const filtered = workflows[key]["usecase_ids"].filter(data => data !== subcase.name)
																			if (filtered !== undefined && filtered !== null) {
																				workflows[key]["usecase_ids"] = filtered
																	
																				setWorkflow(workflows[key]) 
																			}
																		}

																		continue
																	}

																	if (workflows[key]["usecase_ids"] === undefined || workflows[key]["usecase_ids"] === null) {
																		workflows[key]["usecase_ids"] = [subcase.name]
																		setWorkflow(workflows[key]) 

																	} else if (!workflows[key]["usecase_ids"].includes(subcase.name)) {
																		workflows[key]["usecase_ids"].push(subcase.name)
																		setWorkflow(workflows[key]) 

																	}
																}

																setWorkflows(workflows)
																setSelectedWorkflows(newValue)
                												//setUpdate(Math.random())
          													  }}
            	  										      renderOption={(props, data, state) => {
																	var newname = data.name
																	if (newname === undefined || newname === null) {
																		newname = "placeholder"
																	}

																	if (newname.length > 2) {
																		newname = newname.charAt(0).toUpperCase() + newname.substring(1)
																	}
																	return (
																		<li {...props}>
																			<Tooltip arrow placement="left" title={
																				<span style={{}}>
																					{data.image !== undefined && data.image !== null && data.image.length > 0 ? 
																						<img src={data.image} alt={newname} style={{backgroundColor: theme.palette.surfaceColor, maxHeight: 200, minHeigth: 200, borderRadius: theme.palette.borderRadius, }} />
																					: null}
																					<Typography>
																						Choose {newname}
																					</Typography>
																				</span>
																				} placement="bottom">
																				<span>
																					<Checkbox
																						icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
																						checkedIcon={<CheckBoxIcon fontSize="small" />}
																						style={{ marginRight: 8 }}
																						checked={selectedWorkflows.find(wf => wf.id === data.id) !== undefined}
																					/>
																					{newname}
																				</span>
																			</Tooltip>
																		</li>
																	)
															  }}
          													  renderInput={(params) => {
          													    return (
																	<TextField
																		style={{
																			backgroundColor: theme.palette.inputColor,
																			borderRadius: theme.palette.borderRadius,
																		}}
																		{...params}
																		label="Find your workflows"
																		variant="outlined"
          													      	/>
          													    );
          													  }}
          													/>
															: null}
															<span style={{top: 30, position: "relative",}}>
																<Typography 
																	variant="body2" 
																	color="textSecondary"
																	style={{marginTop: 0, marginLeft: 5, }} 
																	onClick={() => {}}
																>
																	Try it out:
																</Typography>
																{frameworkData !== undefined && frameworkData !== null && Object.keys(frameworkData).length > 0 ?
																	<WorkflowTemplatePopup 
																		isLoggedIn={isLoggedIn}
																		appFramework={frameworkData}
																		userdata={userdata}
																		globalUrl={globalUrl}
																		img1={inputUsecase.srcimg}
																		srcapp={inputUsecase.srcapp}
																		img2={inputUsecase.dstimg}
																		dstapp={inputUsecase.dstapp}
																		title={inputUsecase.name}
																		description={inputUsecase.description}
																		apps={apps}
																		getAppFramework={getFramework}
																		//appSetupDone={appSetupDone}
																		//setAppSetupDone={setAppSetupDone}
																	/>
																: null}
															</span>
															{/*


																	{subcase.extra_buttons !== undefined && subcase.extra_buttons !== null && subcase.extra_buttons.length > 0 ?
																		<div style={{marginTop: 25, }}>
																			<Typography variant="body1" style={{marginTop: 0,}} onClick={() => {}}>
																				Examples
																			</Typography>
																			<div style={{display: "flex"}}>
																				{subcase.extra_buttons.map((subdata, index) => {
																					var highlight = false
																					var baseTypeInfo = subcase.type !== undefined ? subcase.type : "communication"
																					if (frameworkData !== undefined && frameworkData !== null) {
																						if (frameworkData[baseTypeInfo] !== undefined && frameworkData[baseTypeInfo] !== null && subdata.app !== undefined && subdata.app !== null) {
																							if (frameworkData[baseTypeInfo].name !== undefined && frameworkData[baseTypeInfo].name.toLowerCase().replaceAll("_", " ") === subdata.app.toLowerCase().replaceAll("_", " ")) {
																								highlight = true
																							}
																						}
																					}

																					var marginTop = 6
																					if (subdata.name.includes(" ") && subdata.name.length > 10) {
																						marginTop = 0
																					}

																					return (
																						<a 
																							key={index}
																							href={subdata.link}
																							rel="noopener noreferrer"
																							target="_blank"
																							style={{ textDecoration: "none", color: "rgba(255,255,255,0.7)", marginRight: 5, }}
																						>
																							<div style={{width: 160, display: "flex", borderRadius: theme.palette.borderRadius, cursor: "pointer", border: highlight ? "2px solid #f86a3e" : "1px solid rgba(255,255,255,0.7)", backgroundColor: theme.palette.inputColor, padding: "0px 0px 15px 15px", overflow: "hidden",}}>
																								<img src={subdata.image} style={{width: 40, height: 40, borderRadius: theme.palette.borderRadius, marginTop: 15, }} />
																								<Typography variant="body1" style={{lineHeight: "95%", marginLeft: 12, marginTop: marginTop === 0 ? 19 : 25, maxHeight: 34, }}>
																									{subdata.name}
																								</Typography>
																							</div>
																						</a>
																					)
																				})}
																			</div>
																		</div>
																	: null}
																	<div style={{marginTop: 20}}>
																		<a
																			href={`https://shuffler.io/search?tab=workflows&q=${subcase.name}`}
																			rel="noopener noreferrer"
																			target="_blank"
																			style={{ textDecoration: "none", color: "white", marginRight: 5, }}
																		>
																			<Typography variant="body1" style={{marginTop: 15, cursor: "pointer",}} onClick={() => {}}>
																				See other Public Workflows for {} <OpenInNewIcon style={{marginTop: 5, marginLeft: 15, }}/>
																			</Typography>
																		</a>
																	</div>
															*/}
																</div>
															}
															<div style={{
																	height: 350, 
																	width: 350, 
																	borderRadius: theme.palette.borderRadius,
																	border: "1px solid rgba(255,255,255,0.3)",
																	padding: 5,
																	backgroundColor: theme.palette.backgroundColor,
																}}>
																<AppFramework
																	inputUsecase={inputUsecase}
																	selectedOption={"Draw"}
																	showOptions={false}
																	isLoaded={true}
																	isLoggedIn={true}
																	globalUrl={globalUrl}
																	size={0.6}

																	frameworkData={frameworkData}
																	setFrameworkData={setFrameworkData}
																/>
															</div>
														</div>
												</div>
											}
										</Paper>
      						</Grid>
								)
							})}
      			</Grid>
					</div>
				)
			})}
		</div>
	)
}

const TreeChart = ({keys}) => {
  const [hovered, setHovered] = useState("");

	return (
		<div style={{cursor: "pointer",}} onClick={() => {
			console.log("Click: ", hovered)	
		}}>
			<TreeMap
				id="all_categories"
				data={keys}
				margins={10}
				series={
					<TreeMapSeries
						colorScheme={(info) => {
							return info.color
						}}
						label={
							<TreeMapLabel 
								fontSize="15px"
								fill="#ffffff"
								wrap={false}
							/>
						}
						rect={
							<TreeMapRect 
								cursor="pointer"
								animated={true}
								onClick={(event) => {
									console.log("Click: ", event)
								}}
							/>
						}
					/>
				}
			/>
		</div>
	)
  //axis={<RadialAxis type="category" />}
}
    

const RadialChart = ({keys, setSelectedCategory}) => {
  const [hovered, setHovered] = useState("");

	return (
		<div style={{cursor: "pointer",}} onClick={() => {
			console.log("Click: ", hovered)	
			if (setSelectedCategory !== undefined) {
				setSelectedCategory(hovered)
			}
		}}>
			<RadialAreaChart
				id="workflow_categories"
				height={500}
				width={500}
				data={keys}
    		axis={<RadialAxis type="category" />}
				series={
					<RadialAreaSeries 
						interpolation="smooth"
						colorScheme={(colorInput) => {
							return '#f86a3e'
						}}
						animated={false}
						id="workflow_series_id"
						style={{cursor: "pointer",}}
						line={
							<RadialLine
								color={"#000000"}
								data={(data, color) => {
									console.log("INFO: ", data, color)
									return (
										null
									)
								}}
							/>
						}
						tooltip={
							<TooltipArea
								color={"#000000"}
								style={{
									backgroundColor: "red",
								}}
								isRadial={true}
								onValueEnter={(event) => {
									if (hovered !== event.value.x) {
										setHovered(event.value.x)
									}
								}}
								tooltip={
									<ChartTooltip
										followCursor={true}
										modifiers={{
											offset: '5px, 5px'
										}}
										content={(data, color) => {
											return (
												<div style={{borderRadius: theme.palette.borderRadius, backgroundColor: theme.palette.inputColor, border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: 5, cursor: "pointer",}}>
													<Typography variant="body1">
														{data.x}
													</Typography>
												</div>
											)
											/*
												<TooltipTemplate
													color={"#ffffff"}
													value={{
														x: data.x,
													}}
												/>
											)
											*/
										}
									}
									/>
								}
							/>
	
						}
					/>
				}
			/>
		</div>
	)
  //axis={<RadialAxis type="category" />}
}

// This is the start of a dashboard that can be used.
// What data do we fill in here? Idk
const Dashboard = (props) => {
  const { globalUrl, isLoggedIn, userdata } = props;
  //const alert = useAlert();
  const [bigChartData, setBgChartData] = useState("data1");
  const [dayAmount, setDayAmount] = useState(7);
  const [firstRequest, setFirstRequest] = useState(true);
  const [stats, setStats] = useState({});
  const [changeme, setChangeme] = useState("");
  const [statsRan, setStatsRan] = useState(false);
	const [keys, setKeys] = useState([])
	const [treeKeys, setTreeKeys] = useState([])

  const [selectedUsecaseCategory, setSelectedUsecaseCategory] = useState("");
  const [selectedUsecases, setSelectedUsecases] = useState([]);
  const [usecases, setUsecases] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [frameworkData, setFrameworkData] = useState(undefined);

	let navigate = useNavigate();
  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";


	useEffect(() => {
		if (selectedUsecaseCategory.length === 0) {
			setSelectedUsecases(usecases)
		} else {
			const foundUsecase = usecases.find(data => data.name === selectedUsecaseCategory)
			if (foundUsecase !== undefined && foundUsecase !== null) {
				setSelectedUsecases([foundUsecase])
			}
		}
	}, [selectedUsecaseCategory])

	const checkSelectedParams = () => {
		const urlSearchParams = new URLSearchParams(window.location.search)
		const params = Object.fromEntries(urlSearchParams.entries())

		const curpath = typeof window === "undefined" || window.location === undefined ? "" : window.location.pathname;
		const cursearch = typeof window === "undefined" || window.location === undefined ? "" : window.location.search;

		const foundQuery = params["selected"]
		if (foundQuery !== null && foundQuery !== undefined) {
			setSelectedUsecaseCategory(foundQuery)

      	const newitem = removeParam("selected", cursearch);
			navigate(curpath + newitem)
		}

		const baseItem = document.getElementById("increase authentication")
		if (baseItem !== undefined && baseItem !== null) {
			baseItem.click()

			// Find close window button -> go to top
			const foundButton = document.getElementById("close_selection")
			if (foundButton !== undefined && foundButton !== null) {
				foundButton.click()
			}

			// Scroll back to top
			window.scrollTo(0, 0)
		}

		const foundQuery2 = params["selected_object"]
		if (foundQuery2 !== null && foundQuery2 !== undefined) {
			// Take a random object, quickly click it, then go to this one
			// Something is weird with loading apps without it

			const queryName = foundQuery2.toLowerCase().replaceAll("_", " ")
			// Waiting a bit for it to render
			setTimeout(() => {
				const foundItem = document.getElementById(queryName)
				if (foundItem !== undefined && foundItem !== null) { 
					foundItem.click()
					// Scroll to it

					setTimeout(() => {
						foundItem.scrollIntoView({
							behavior: "smooth", 
							block: "center", 
							inline: "center"
						})
					}, 100)
				} else { 
					//console.log("Couldn't find item with name ", queryName)
				}
			}, 1000);
		}

	}

	useEffect(() => {
		if (usecases.length > 0) {
			//console.log(usecases)
			checkSelectedParams()
		}
	}, [usecases])

  const getFramework = () => {
    fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for framework!");
        }

        return response.json();
      })
      .then((responseJson) => {
			if (responseJson.success === false) {
				const preparedData = {
					"siem": findSpecificApp({}, "SIEM"), 
					"communication": findSpecificApp({}, "COMMUNICATION"),
					"assets": findSpecificApp({}, "ASSETS"),
					"cases": findSpecificApp({}, "CASES"),
					"network": findSpecificApp({}, "NETWORK"),
					"intel": findSpecificApp({}, "INTEL"),
					"edr": findSpecificApp({}, "EDR"),
					"iam": findSpecificApp({}, "IAM"),
					"email": findSpecificApp({}, "EMAIL"),
				}

				console.log("Got error for framework! ", preparedData) 
				setFrameworkData(preparedData)
			} else {
				setFrameworkData(responseJson)
			}
	  })
      .catch((error) => {
        toast(error.toString());
      })
	}


  const getAvailableWorkflows = () => {
    fetch(globalUrl + "/api/v1/workflows", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				fetchUsecases()
				console.log("Status not 200 for workflows :O!: ", response.status);
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			fetchUsecases(responseJson)

			if (responseJson !== undefined) {
				setWorkflows(responseJson);
			}
		})
		.catch((error) => {
			fetchUsecases()
			//toast(error.toString());
		});
	}


  document.title = "Shuffle - usecases";
  var dayGraphLabels = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];
  var dayGraphData = [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130];

	const handleKeysetting = (categorydata) => {
		var allCategories = []
		var treeCategories = []
		for (key in categorydata) {
			const category = categorydata[key]
			allCategories.push({"key": category.name, "data": category.list.length, "color": category.color})
			treeCategories.push({"key": category.name, "data": 100, "color": category.color,})
			for (var subkey in category.list) {
				treeCategories.push({"key": category.list[subkey].name, "data": 20, "color": category.color})
			}
		} 

		setKeys(allCategories)
		setTreeKeys(treeCategories)
	}

  const fetchUsecases = (workflows) => {
    fetch(globalUrl + "/api/v1/workflows/usecases", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for usecases");
        }

        return response.json();
      })
      .then((responseJson) => {
				// Matching workflows with usecases
				if (responseJson.success !== false) {
					if (workflows !== undefined && workflows !== null && workflows.length > 0) {
						var categorydata = responseJson

						var newcategories = []
						for (var key in categorydata) {
							var category = categorydata[key]
							category.matches = []

							for (var subcategorykey in category.list) {
								var subcategory = category.list[subcategorykey]
								subcategory.matches = []

								for (var workflowkey in workflows) {
									const workflow = workflows[workflowkey]

									if (workflow.usecase_ids !== undefined && workflow.usecase_ids !== null) {
										for (var usecasekey in workflow.usecase_ids) {
											if (workflow.usecase_ids[usecasekey].toLowerCase() === subcategory.name.toLowerCase()) {

												category.matches.push({
													"workflow": workflow.id,
													"category": subcategory.name,
												})

												subcategory.matches.push(workflow)
												break
											}
										}
									}

									if (subcategory.matches.length > 0) {
										break
									}
								}
							}

							newcategories.push(category)
						} 

						if (newcategories !== undefined && newcategories !== null && newcategories.length > 0) {
							handleKeysetting(newcategories)
							setUsecases(newcategories)
							setSelectedUsecases(newcategories)
						} else {
							handleKeysetting(responseJson)
							setUsecases(responseJson)
							setSelectedUsecases(responseJson)
						}
					} else {
						handleKeysetting(responseJson)
						setUsecases(responseJson)
						setSelectedUsecases(responseJson)
					}
				}
      })
      .catch((error) => {
        //toast("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

  useEffect(() => {
  	getAvailableWorkflows() 
	getFramework() 
  }, []);

  const fetchdata = (stats_id) => {
    fetch(globalUrl + "/api/v1/stats/" + stats_id, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for " + stats_id);
        }

        return response.json();
      })
      .then((responseJson) => {
        stats[stats_id] = responseJson;
        setStats(stats);
        // Used to force updates
        setChangeme(stats_id);
      })
      .catch((error) => {
        //toast("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

  let chart1_2_options = {
    maintainAspectRatio: false,
    legend: {
      display: false,
    },
    tooltips: {
      backgroundColor: "#f5f5f5",
      titleFontColor: "#333",
      bodyFontColor: "#666",
      bodySpacing: 4,
      xPadding: 12,
      mode: "nearest",
      intersect: 0,
      position: "nearest",
    },
    responsive: true,
    scales: {
      yAxes: [
        {
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: "rgba(29,140,248,0.0)",
            zeroLineColor: "transparent",
          },
          ticks: {
            suggestedMin: 60,
            suggestedMax: 125,
            padding: 20,
            fontColor: "#9a9a9a",
          },
        },
      ],
      xAxes: [
        {
          barPercentage: 1.6,
          gridLines: {
            drawBorder: false,
            color: "rgba(29,140,248,0.1)",
            zeroLineColor: "transparent",
          },
          ticks: {
            padding: 20,
            fontColor: "#9a9a9a",
          },
        },
      ],
    },
  };

  const dayGraph = {
    data: (canvas) => {
      let ctx = canvas.getContext("2d");

      let gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

      gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
      gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
      gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

      return {
        labels: dayGraphLabels,
        datasets: [
          {
            label: "My First dataset",
            fill: true,
            backgroundColor: gradientStroke,
            borderColor: "#1f8ef1",
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: "#1f8ef1",
            pointBorderColor: "rgba(255,255,255,0)",
            pointHoverBackgroundColor: "#1f8ef1",
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: dayGraphData,
          },
        ],
      };
    },
    options: chart1_2_options,
  };

  // All these are currently tracked.
  const variables = [
    "backend_executions",
    "workflow_executions",
    "workflow_executions_aborted",
    "workflow_executions_success",
    "total_apps_created",
    "total_apps_loaded",
    "openapi_apps_created",
    "total_apps_deleted",
    "total_webhooks_ran",
    "total_workflows",
    "total_workflow_actions",
    "total_workflow_triggers",
  ];

  const runUpdate = () => {
    for (var key in variables) {
      fetchdata(variables[key]);
    }
  };

  // Refresh every 60 seconds
  const autoUpdate = 60000;
  const { start, stop } = useInterval({
    duration: autoUpdate,
    startImmediate: false,
    callback: () => {
      runUpdate();
    },
  });

  if (firstRequest) {
    setFirstRequest(false);
    //start();
    //runUpdate();
  } else if (!statsRan) {
    // FIXME: Run this under runUpdate schedule?
    // 1. Fix labels in dayGraphy.data
    // 2. Add data to the daygraph

    // Every time there's an update :)

    // This should probably be done in the backend.. bleh
    if (
      stats["workflow_executions"] !== undefined &&
      stats["workflow_executions"] !== null &&
      stats["workflow_executions"].data !== undefined
    ) {
      setStatsRan(true);
      //console.log("NEW DATA?: ", stats)
      console.log("SET WORKFLOW: ", stats["workflow_executions"]);
      //var curday = startDate.getDate()

      // Index = what day are we on

      // 0 = today
      var newDayGraphLabels = [];
      var newDayGraphData = [];
      for (var i = dayAmount; i > 0; i--) {
        var enddate = new Date();
        enddate.setDate(-i);
        enddate.setHours(23, 59, 59, 999);

        var startdate = new Date();
        startdate.setDate(-i);
        startdate.setHours(0, 0, 0, 0);

        var endtime = enddate.getTime() / 1000;
        var starttime = startdate.getTime() / 1000;

        console.log(
          "START: ",
          starttime,
          "END: ",
          endtime,
          "Data: ",
          stats["workflow_executions"]
        );
        for (var key in stats["workflow_executions"].data) {
          const item = stats["workflow_executions"]["data"][key];
          console.log("ITEM: ", item.timestamp, endtime);
          console.log(endtime - starttime);
          if (
            endtime - starttime > endtime - item.timestamp &&
            endtime.timestamp >= 0
          ) {
            console.log("HIT? ");
          }
          console.log(item.timestamp - endtime);
          //console.log(item.timestamp-endtime)
          break;
          if (item.timestamp > endtime && item.timestamp < starttime) {
            if (newDayGraphData[i - 1] === undefined) {
              newDayGraphData[i - 1] = 1;
            } else {
              newDayGraphData[i - 1] += 1;
            }

            //break
          }
        }

        newDayGraphLabels.push(i);
      }

      console.log(newDayGraphLabels);
      console.log(newDayGraphData);
    }
  }

  const newdata =
    Object.getOwnPropertyNames(stats).length > 0 ? (
      <div>
        Autoupdate every {autoUpdate / 1000} seconds
        {variables.map((data) => {
          if (stats[data] === undefined || stats[data] === null) {
            return null;
          }

          if (stats[data].total === undefined) {
            return null;
          }

          return (
            <div>
              {data}: {stats[data].total}
            </div>
          );
        })}
      </div>
    ) : null;

  const data = (
    <div className="content" style={{width: 1000, margin: "auto", paddingBottom: 200, textAlign: "center",}}>
			<div style={{width: 500, margin: "auto"}}>
				{keys.length > 0 ?
					<RadialChart keys={keys} setSelectedCategory={setSelectedUsecaseCategory} />
				: null}
			</div>

			{usecases !== null && usecases !== undefined && usecases.length > 0 ? 
				<div style={{ display: "flex", marginLeft: 180, }}>
					{usecases.map((usecase, index) => {
						return (
							<Chip
								key={usecase.name}
								style={{
									backgroundColor: selectedUsecaseCategory === usecase.name ? usecase.color : theme.palette.surfaceColor,
									marginRight: 10, 
									paddingLeft: 5,
									paddingRight: 5,
									height: 28,
									cursor: "pointer",
									border: `1px solid ${usecase.color}`,
									color: "white",
								}}
								label={`${usecase.name} (${usecase.list.length})`}
								onClick={() => {
									console.log("Clicked: ", usecase.name)
									if (selectedUsecaseCategory === usecase.name) {
										setSelectedUsecaseCategory("")
									} else {
										setSelectedUsecaseCategory(usecase.name)
									}
									//addFilter(usecase.name.slice(3,usecase.name.length))
								}}
								variant="outlined"
								color="primary"
							/>
						)
					})}
				</div>
			: null}

			<UsecaseListComponent 
	  			userdata={userdata}
				isLoggedIn={isLoggedIn}
				keys={selectedUsecases} 
				isCloud={isCloud} 
				globalUrl={globalUrl} 
				workflows={workflows}
				setWorkflows={setWorkflows}

				frameworkData={frameworkData}
	  			setFrameworkData={setFrameworkData}
	  			getFramework={getFramework}
			/>

			{treeKeys.length > 0 ? 
				<TreeChart keys={treeKeys} />
			: null}

      {newdata}
    </div>
  );

  const dataWrapper = (
    <div style={{ maxWidth: 1366, margin: "auto" }}>{data}</div>
  );

  return dataWrapper;
};

export default Dashboard;
