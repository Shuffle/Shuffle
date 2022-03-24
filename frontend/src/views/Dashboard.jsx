import React, { useState, useEffect } from "react";
import { useInterval } from "react-powerhooks";
import DetectionFramework from "../components/DetectionFramework.jsx";
// nodejs library that concatenates classes
import classNames from "classnames";
import theme from '../theme';
import { useNavigate, Link, useParams } from "react-router-dom";

// react plugin used to create charts
//import { Line, Bar } from "react-chartjs-2";
import { useAlert } from "react-alert";

import {
	Tooltip,
	TextField,
	IconButton,
	Button,
	Typography,
	Grid,
	Paper,
	Chip,
} from "@material-ui/core";

import {
  Close as CloseIcon,
	DoneAll as DoneAllIcon,
	Description as DescriptionIcon,
	PlayArrow as PlayArrowIcon,
	Edit as EditIcon,
} from "@material-ui/icons";

import WorkflowPaper from "../components/WorkflowPaper.jsx"

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

const UsecaseListComponent = ({keys, isCloud, globalUrl, frameworkData, isLoggedIn}) => {
	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [expandedItem, setExpandedItem] = useState(-1);
	const [inputUsecase, setInputUsecase] = useState({});

	const [editing, setEditing] = useState(false);
	const [description, setDescription] = useState("");
	const [video, setVideo] = useState("");
	const [blogpost, setBlogpost] = useState("");

	const [mitreTags, setMitreTags] = useState([]);
	let navigate = useNavigate();
	if (keys === undefined || keys === null || keys.length === 0) {
		return null
	}

	const getUsecase = (name, index, subindex) => {
    fetch(`${globalUrl}/api/v1/workflows/usecases/${escape(name.replaceAll(" ", "_"))}`, {
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
				setInputUsecase({
					"name": name,
				})
			} else {
				setInputUsecase(responseJson)
			}

			setExpandedIndex(index)
			setExpandedItem(subindex)

			setTimeout(() => {
				//console.log("Scroll!")
				const found = document.getElementById("selected_box");
				console.log("Found to scroll: ", found)
				if (found !== undefined && found !== null) {
					//console.log("FOUND!!")
					found.scrollTo({
						top: 100,
						behavior: "smooth",
					})
				}
			}, 100);
})
		.catch((error) => {
			//alert.error(error.toString());
			setInputUsecase({})
			setExpandedIndex(index)
			setExpandedItem(subindex)
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
						//alert.error("Failed updating: " + responseJson.reason)
					} else {
						//alert.error("Failed to update framework for your org.")
					}
				} else {
					//alert.info("Updated usecase.")
				}
			})
      .catch((error) => {
        //alert.error(error.toString());
				//setFrameworkLoaded(true)
      })
		}

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
								if (subcase.matches === undefined || subcase.matches === null) {
									subcase.matches = []
								}

								const selectedItem = subindex === expandedItem && index === expandedIndex
								if (selectedItem && subcase.name !== undefined && inputUsecase.name !== undefined) { 
									if (subcase.name.toLowerCase().replaceAll(" ", "_") === inputUsecase.name.toLowerCase().replaceAll(" ", "_")) {
										console.log("Input: ", inputUsecase)
										if (inputUsecase.description !== undefined && inputUsecase.description !== null) {
											subcase.description = inputUsecase.description
										}

										if (inputUsecase.blogpost !== undefined && inputUsecase.blogpost !== null) {
											subcase.blogpost = inputUsecase.blogpost
										}

										if (inputUsecase.video !== undefined && inputUsecase.video !== null) {
											subcase.video = inputUsecase.video
										}
									}
								}

								const finished = subcase.matches.length > 0
								//const backgroundColor = selectedItem ? "inherit" : finished ?  "inherit" : usecase.color
								const backgroundColor = "inherit"
								const itemBorder = `${selectedItem ? "3px" : expandedItem >= 0 ? "0px" : "1px"} solid ${usecase.color}`

								return (
      						<Grid item xs={selectedItem ? 12 : 4} key={subindex} style={{minHeight: 110,}} onClick={() => {
										if (selectedItem) {
										} else {
											//if (subcase.description !== undefined && subcase.description !== null && subcase.description.length > 0) {
											getUsecase(subcase.name, index, subindex) 
											//}
										}
									}}>
										<Paper style={{padding: "30px 30px 30px 30px", minHeight: 75, cursor: !selectedItem ? "pointer" : "default", border: itemBorder, backgroundColor: backgroundColor,}} onClick={() => {
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
												<div style={{textAlign: "left", position: "relative",}} id="selected_box">
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
													<div style={{marginTop: 25, display: "flex", minHeight: 400, maxHeight: 400, }}>
														{editing ? 
															<div style={{flex: 1, marginRight: 50, }}>
																<Typography variant="h6">
																	Editing!
																</Typography>
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
																			setEditing(false)
																			setUsecaseItem(inputUsecase) 
																			setDescription("")
																			setVideo("")
																			setBlogpost("")
																		}}
																	>
																		Save	
																	</Button>
																</div>
															</div>
															: 
																<div style={{flex: 1, textAlign: "left", marginRight: 10, }}>
																	<Typography variant="body1">
																		{subcase.description}
																	</Typography>
																	<Typography variant="h6" style={{marginTop: 15, }}>
																		Your workflow{subcase.matches.length === 1 ? "" : "s"} ({subcase.matches.length})
																	</Typography>
																	{subcase.matches.length > 0 ? 
																		<Grid container xs={3} style={{maxWidth: 325, marginTop: 10, }}>
																			{subcase.matches.map((workflow, workflowindex) => {
																				return (
																					<Grid key={workflowindex} item index={workflowindex} xs={12}>
																						<WorkflowPaper key={workflowindex} data={workflow} />
																					</Grid>
																				)
																			})}
																		</Grid>
																	: 
																		<div>
																			<Typography variant="body1" color="textSecondary">
																				No workflow selected yet.
																			</Typography>
																		</div>
																	}
																	{isCloud !== false ? 
																		<div>
																			<Typography variant="h6" style={{marginTop: 15, cursor: "pointer",}} onClick={() => {
																				navigate("/search?tab=workflows&q="+subcase.name)
																			}}>
																				Public workflows	
																			</Typography>
																			{/*
																			<div>
																				<Typography variant="body1" color="textSecondary">
																					No workflows yet.
																				</Typography>
																			</div>
																			*/}
																		</div>
																	: null}
																</div>
															}
															<div style={{
																	height: 400, 
																	width: 400, 
																	borderRadius: theme.palette.borderRadius,
																	border: "1px solid rgba(255,255,255,0.3)",
																}}>
																<DetectionFramework 
																	inputUsecase={inputUsecase}
																	frameworkData={frameworkData}
																	selectedOption={"Draw"}
																	showOptions={false}
																	isLoaded={true}
																	isLoggedIn={true}
																	globalUrl={globalUrl}
																	size={0.7}
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
  const { globalUrl, isLoggedIn } = props;
  const alert = useAlert();
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

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

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
					if (responseJson.reason !== undefined) {
						//alert.error("Failed loading: " + responseJson.reason)
					} else {
						//alert.error("Failed to load framework for your org.")
					}
				} else {
					setFrameworkData(responseJson)
				}
			})
      .catch((error) => {
        alert.error(error.toString());
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

			console.log("Resp: ", responseJson)
			if (responseJson !== undefined) {
				//setWorkflows(responseJson);
				//fetchUsecases(responseJson)
			}
		})
		.catch((error) => {
			fetchUsecases()
			//alert.error(error.toString());
		});
	}

	useEffect(() => {
		console.log("Changed: ", selectedUsecaseCategory)
		if (selectedUsecaseCategory.length === 0) {
			setSelectedUsecases(usecases)
		} else {
			const foundUsecase = usecases.find(data => data.name === selectedUsecaseCategory)
			if (foundUsecase !== undefined && foundUsecase !== null) {
				console.log("FOUND: ", foundUsecase)
				setSelectedUsecases([foundUsecase])
			}
		}
	}, [selectedUsecaseCategory])

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
				if (responseJson.success !== false) {
					console.log("Usecases: ", responseJson)
					if (workflows !== undefined && workflows !== null && workflows.length > 0) {
						console.log("Got workflows: ", workflows)
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
												console.log("Got match: ", workflow.usecase_ids[usecasekey])

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

						console.log("Categories: ", newcategories)
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
        //alert.error("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

  useEffect(() => {
  	getAvailableWorkflows() 
		getFramework() 
		//fetchUsecases()
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
        //alert.error("ERROR: " + error.toString());
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
    console.log("HELO");
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
				isLoggedIn={isLoggedIn}
				frameworkData={frameworkData}
				keys={selectedUsecases} 
				isCloud={isCloud} 
				globalUrl={globalUrl} 
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
