import React, { useState, useEffect,useContext } from "react"
import { useNavigate, Link, useParams } from "react-router-dom"
import { useInterval } from "react-powerhooks"
import WorkflowTemplatePopup2 from "../components/WorkflowTemplatePopup2.jsx"

import AppFramework, { parsedDatatypeImages, findSpecificApp, } from "../components/AppFramework.jsx"
import { Context } from "../context/ContextApi.jsx"

import { ToastContainer, toast } from "react-toastify" 
import { makeStyles, } from "@mui/styles"
import classNames from "classnames"
import theme from '../theme.jsx'

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
	Fade, 
	Skeleton,
} from "@mui/material";

import {
  Close as CloseIcon,
	DoneAll as DoneAllIcon,
	Description as DescriptionIcon,
	PlayArrow as PlayArrowIcon,
	Edit as EditIcon,
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

import { isMobile } from "react-device-detect"

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

const ParseUsecaseDesc = (priority, appFramework) => {

	var realignedSrc = false
	var realignedDst = false
	let newdescription = priority.description

	if (priority.description === undefined || priority.description === null) {	
		return ["", "", "", ""]
	}

	const descsplit = priority.description.split("&")
	if (appFramework !== undefined && descsplit.length === 5 && priority.description.includes(":default")) {
		if (descsplit[1] === "") {
			const item = findSpecificApp(appFramework, descsplit[0])

			if (item !== null) {
				descsplit[1] = item.large_image

				if (descsplit[0].includes(":default")) {
					realignedSrc = true 
				}

				descsplit[0] = descsplit[0].split(":")[0]
			}
		}

		if (descsplit[3] === "") {
			const item = findSpecificApp(appFramework, descsplit[2])
			//console.log("item: ", item)
			realignedDst = true 
			if (item !== null) {
				descsplit[3] = item.large_image

				if (descsplit[2].includes(":default")) {
					realignedDst = true 
				}

				descsplit[2] = descsplit[2].split(":")[0]
			}

		}

		newdescription = descsplit.join("&")
	}

	return descsplit
}

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

	const [autoOpenUsecase, setAutoOpenUsecase] = useState(null);

    const classes = useStyles();
	let navigate = useNavigate();

	const [mitreTags, setMitreTags] = useState([]);

	// Add loading state
	const [isLoading, setIsLoading] = useState(true);

		// Add this useEffect to handle URL parameters on load
		useEffect(() => {
			const urlSearchParams = new URLSearchParams(window.location.search);
			const params = Object.fromEntries(urlSearchParams.entries());
			
			const selectedUsecase = params["selected_object"];
			if (selectedUsecase && keys.length > 0) {
				const usecaseName = selectedUsecase.toLowerCase().replaceAll("_", " ");
				
				// Find the matching usecase in the keys
				for (const category of keys) {
					const foundUsecase = category.list.find(
						usecase => usecase.name.toLowerCase().replaceAll("_", " ") === usecaseName
					);
					
					if (foundUsecase) {
						setAutoOpenUsecase(foundUsecase);
						
						// Wait for render then scroll
						setTimeout(() => {
							const element = document.getElementById(usecaseName);
							if (element) {
								element.scrollIntoView({
									behavior: "smooth",
									block: "center",
									inline: "center"
								});
							}
						}, 1000);
						
						break;
					}
				}
			}
		}, [keys]);
	
		// Add useEffect to handle auto-opening
		useEffect(() => {
			if (autoOpenUsecase) {
				getUsecase(autoOpenUsecase, 0, 0);
				setAutoOpenUsecase(null);
			}
		}, [autoOpenUsecase]);
	
			// Loading skeleton component
	const LoadingSkeleton = () => (
		<div style={{paddingTop: 75, minHeight: 1000, textAlign: "left"}}>
			{/* Header skeleton */}
			<Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'grey.800' }} />
			<Skeleton variant="text" width="60%" height={24} sx={{ marginTop: 3, bgcolor: 'grey.800' }} />

			{/* Apps selection skeleton */}
			<Skeleton variant="text" width={150} height={24} sx={{ marginTop: 5, marginBottom: 10 }} />
			<Paper style={{
				height: 60, 
				width: "97.5%", 
				backgroundColor: theme.palette.platformColor, 
				borderRadius: theme.palette?.borderRadius || 5,
				display: "flex", 
				padding: "0 25px",
			}}>
				{/* App icons skeleton */}
				<div style={{flex: 10, display: "flex", gap: 25, alignItems: "center"}}>
					{[1, 2, 3, 4, 5].map((app) => (
						<Skeleton
							key={app}
							variant="circular"
							width={40}
							height={40}
							sx={{ bgcolor: 'grey.800' }}
						/>
					))}
				</div>
				{/* Add more apps button skeleton */}
				<Skeleton 
					variant="rectangular" 
					width={150} 
					height={40} 
					sx={{ 
						marginTop: "10px",
						borderRadius: 20,
						bgcolor: 'grey.800'
					}} 
				/>
			</Paper>

			{/* Usecase categories skeleton - 3 sections: Collect, Enrich, Detect */}
			{[1, 2, 3,4,5].map((category) => (
				<div key={category} style={{marginTop: category === 1 ? 20: 45}}>
					{/* Category title with color indicator */}
					<Typography variant="body1" style={{marginBottom: 15}}>
						<Skeleton 
							variant="text" 
							width={200} 
							height={24} 
							sx={{ 
								bgcolor: category === 1 ? '#f85a3e33' : 
										category === 2 ? '#ffb00d33' : 
										category === 3 ? '#2196f333' : 
										category === 4 ? '#4caf5033' : 
										category === 5 ? '#9c27b033' : '#00000033'
							}} 
						/>
					</Typography>
					<Grid container spacing={1}>
						{[1, 2, 3].map((item) => (
							<Grid item xs={isMobile ? 12 : 4} key={item}>
								<Paper 
									style={{
										backgroundColor: theme.palette.platformColor,
										borderRadius: theme.palette?.borderRadius || 5,
										padding: "10px 20px",
										height: 80,
										display: "flex",
										alignItems: "center",
										gap: 15
									}}
								>
									{/* App icons container */}
									<div style={{display: "flex", gap: 5}}>
										<Skeleton 
											variant="circular" 
											width={30} 
											height={30} 
											sx={{ bgcolor: 'grey.800' }} 
										/>
										<Skeleton 
											variant="circular" 
											width={30} 
											height={30} 
											sx={{ bgcolor: 'grey.800' }} 
										/>
									</div>
									{/* Usecase title */}
									<Skeleton 
										variant="text" 
										width="70%" 
										height={24} 
										sx={{ bgcolor: 'grey.800' }} 
									/>
								</Paper>
							</Grid>
						))}
					</Grid>
				</div>
			))}
		</div>
	);



	const parseUsecase = (subcase, inputFramework) => {
	  var useFramework = frameworkData
	  if (inputFramework !== undefined && inputFramework !== null) {
		  useFramework = inputFramework
	  }

	  const srcdata = findSpecificApp(useFramework, subcase.type)
	  const dstdata = findSpecificApp(useFramework, subcase.last)

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
		setIsLoading(true);
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
			setIsLoading(false);
		})
		.catch((error) => {
        	console.log("App loading error: " + error.toString());
			setIsLoading(false);
		})
	}

	  useEffect(() => {
		loadApps() 
	  }, [])

	if (keys === undefined || keys === null || keys.length === 0) {
		return <LoadingSkeleton />;
	}	

  

  // Timeout 50ms to delay it slightly 
  const getUsecase = (subcase, index, subindex) => {
    // Update URL with selected usecase
    const usecaseName = subcase.name.toLowerCase().replaceAll(" ", "_")
    const newUrl = `?selected_object=${usecaseName}`

    // Force URL update even if it's the same usecase
    navigate(newUrl, { replace: true })

    // Parse and fetch usecase data
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

	var usecaseCnt = 0
	var parsedframework = []
	if (frameworkData !== undefined && frameworkData !== null) {
		for (var key in frameworkData) {
			var item = frameworkData[key]
			if (item.name !== "" && item.large_image !== "") {
				item.type = key
				parsedframework.push(item)

			}
		}
	}

	// Then, add a cleanup function for URL params when drawer closes
	const handleUsecaseClose = () => {
	  // Remove the selected_object parameter from URL
	  navigate("/usecases", { replace: true })
	  	  
	  // Reset relevant state
	  setInputUsecase({})
	  setExpandedIndex(-1)
	  setExpandedItem(-1)
	  setFirstLoad(false)
	  setSelectedWorkflows([])
	}

	return (
		<div style={{paddingTop: 75, minHeight: 1000, textAlign: "left",}}>
			<Typography variant="h4" style={{color: "white", }}>
				<b>Usecases</b>
			</Typography>
			<Typography variant="body1" style={{marginTop: 25, }}>
				Choose a template tailored to your automation requirements, ready for immediate use.
			</Typography>

			{isLoggedIn === false ? null : 
				<span>
					<Typography variant="body1" style={{marginTop: 25, }}>
						<b>
							Your selected apps:
						</b>
					</Typography>
				
					<Paper style={{height: 60, marginTop: 10, width: "97.5%", backgroundColor: theme.palette.platformColor, borderRadius: theme.palette?.borderRadius, display: "flex", paddingLeft: 25, }}>
						<div style={{flex: 10, display: "flex", }}>
							{parsedframework.map((app, index) => {
								return (
									<div style={{marginRight: 25, }}>
										<Tooltip title={`${app.type}: ${app.name}`} placement="top">
											<img 
												src={app.large_image} 
												style={{
													height: 40, 
													width: 40, 
													marginTop: 10,
													borderRadius: 50,
												}} 
											/>
										</Tooltip> 
									</div>
								)
							})}
						</div>

						<Button
							style={{
								height: 50, 
								borderRadius: 40, 
								marginTop: 5, 
								flex: 1.5, 
								marginRight: 10, 
							}}
							onClick={() => {
								navigate("/welcome?tab=2")
							}}
							variant="outlined"
						>
							Add more apps
						</Button>
					</Paper>
				</span>
			}

			{/*userdata.priorities === null || userdata.priorities === undefined || userdata.priorities.length === 0 ? null : 
				<span>
					<Typography variant="body1" style={{marginTop: 25, }}>
						<b>
							Usecases based on your apps:
						</b>
					</Typography>

					<Grid container spacing={1} style={{}}>
						{userdata.priorities.map((priority, index) => {
								if (priority.active === false) {
									return null
								}

								if (priority.type !== "usecase") {
									return null
								}

								if (usecaseCnt > 3) {
									return null
								}

								usecaseCnt += 1

								const parsedusecase = ParseUsecaseDesc(priority, frameworkData)
								const newname = priority.name.slice(19, 100)
								var parsedColor = priority.color === undefined ? "" : priority.color

								// Search through usecases and find color
								for (var usecasekey in keys) {
									const usecase = keys[usecasekey]
									for (var subcasekey in usecase.list) {
										const subcase = usecase.list[subcasekey]
										if (subcase.name.toLowerCase().includes(newname.toLowerCase())) {
											parsedColor = usecase.color
											break
										}
									}

									if (parsedColor !== "") {
										break
									}
								}

								var srcname = parsedusecase[0] === "" ? "TBD" : parsedusecase[0].toUpperCase()
								var destname = parsedusecase[2] === "" ? "TBD" : parsedusecase[2].toUpperCase()
								if (parsedusecase[1] != undefined && parsedusecase[1] != null && parsedusecase[1].includes("svg") && parsedusecase[1].includes("248,90,62")) {
									if (!srcname.includes(":default")) {
										srcname += ":default"
									}
								}

								if (parsedusecase[3] != undefined && parsedusecase[3] != null && parsedusecase[3].includes("svg") && parsedusecase[3].includes("248,90,62")) {
									if (!destname.includes(":default")) {
										destname += ":default"
									}
								}

								return (
									<Grid item xs={isMobile ? 12 : 4} key={index} style={{minHeight: 110,}}>
										<WorkflowTemplatePopup2
											isLoggedIn={isLoggedIn}
											appFramework={frameworkData}
											userdata={userdata}
											globalUrl={globalUrl}
											img1={parsedusecase[1]}
											srcapp={srcname}
											img2={parsedusecase[3]}
											dstapp={destname}

											title={newname}
											description={""}

											apps={apps}
											getAppFramework={getFramework}
									
											showTryit={true}
											shownColor={parsedColor}
											workflowBuilt={false}
										/>
									</Grid>
								)
							})}
					</Grid>
				</span>
			*/}


			{keys.map((usecase, index) => {
				return (
					<div key={index} style={{marginTop: 75, }}>
						<Typography variant="body1" style={{color: usecase.color, textAlign: "left", marginBottom: 10, }}>
							<b>{index+1}. {usecase.name.slice(3, 100)}</b>
						</Typography>
      					<Grid container spacing={1}>

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

								//const parsedusecase = ParseUsecaseDesc(priority, frameworkData)
								const newsubcase = parseUsecase(subcase, frameworkData)
								var parsedUsecase = inputUsecase
								parsedUsecase.srcimg = newsubcase.srcimg
								parsedUsecase.srcapp = newsubcase.srcapp
								parsedUsecase.dstimg = newsubcase.dstimg
								parsedUsecase.dstapp = newsubcase.dstapp


								var workflowBuilt = "" 
								const newname = subcase.name.toLowerCase().replaceAll(" ", "_")
								for (var workflowkey in workflows) {
									const workflow = workflows[workflowkey]
									if (workflow.usecase_ids === undefined || workflow.usecase_ids === null || workflow.usecase_ids.length === 0) {
										continue
									}

									const newusecases = workflow.usecase_ids.map((usecase) => {
										return usecase.toLowerCase().replaceAll("Suggested Usecase: ", "").replaceAll(" ", "_")
									})

									//console.log("WORKFLOW: ", newname, newusecases)
									if (newusecases.includes(newname)) {
										workflowBuilt = workflow.id 
										break
									}
								}

								const usecaseDetails = parsedUsecase.name === undefined ? undefined : parsedUsecase.name.toLowerCase().replaceAll(" ", "_") === subcase.name.toLowerCase().replaceAll(" ", "_") ? parsedUsecase : undefined


								return (
      								<Grid id={fixedName} item xs={isMobile ? 12 :  4} key={subindex} style={{}} onClick={() => {
										// if (fixedName === "reporting") {
										// 	getUsecase(subcase, index, subindex) 
										// 	return
										// }

										//setSelectedWorkflows([])
										if (selectedItem) {
										} else {
											getUsecase(subcase, index, subindex) 
											//navigate(`/usecases?selected_object=${fixedName}`)
										}
									}}>
										<WorkflowTemplatePopup2
											isLoggedIn={isLoggedIn}
											appFramework={frameworkData}
											userdata={userdata}
											globalUrl={globalUrl}
											img1={  parsedUsecase.srcimg}
											srcapp={parsedUsecase.srcapp}
											img2={  parsedUsecase.dstimg}
											dstapp={parsedUsecase.dstapp}

											title={subcase.name}
											description={""}

											apps={apps}
											getAppFramework={getFramework}
									
											showTryit={false}
											shownColor={""}
											workflowBuilt={workflowBuilt} 
											inputWorkflowId={workflowBuilt}
											usecaseDetails={usecaseDetails}
											isModalOpenDefault={autoOpenUsecase?.name === subcase.name}
											onClose={handleUsecaseClose}
										/>

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

// This is the start of a dashboard that can be used.
// What data do we fill in here? Idk
const Usecases2 = (props) => {
  const { globalUrl, isLoggedIn, userdata } = props;
  //const alert = useAlert();
  const { leftSideBarOpenByClick} = useContext(Context);
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
  const [usecases, setUsecases] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [frameworkData, setFrameworkData] = useState(undefined);

	let navigate = useNavigate();
  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

  const [isLoading, setIsLoading] = useState(true);

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

  const getFramework = () => {
    setIsLoading(true);
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
        setIsLoading(false);
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
		if (responseJson.success === false) {
			return
		} 

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
    ) : null

  const data = 
    <div className="content" style={{width: isMobile ? "100%": leftSideBarOpenByClick ? 1000: 1200, margin: "auto", paddingBottom: 200, textAlign: "center", paddingLeft: leftSideBarOpenByClick ? 50 : 0, transition: "padding-left 0.3s ease, width 0.3s ease"}}>
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

      {newdata}
    </div>

  const dataWrapper = 
		<Fade in={true} timeout={1250}>
			<div style={{ maxWidth: 1366, margin: "auto", zoom: 0.8, }}>
				{data}
			</div>
		</Fade>
  

  return dataWrapper
};

export default Usecases2;
