import React, { useEffect} from 'react';
import { useInterval } from 'react-powerhooks';
import { makeStyles } from '@material-ui/core/styles';
import { useTheme } from '@material-ui/core/styles';

import {Avatar, Grid, Paper, Tooltip, Divider, Button, TextField, FormControl, IconButton, Menu, MenuItem, FormControlLabel, Chip, Switch, Typography, Zoom, CircularProgress, Dialog, DialogTitle, DialogActions, DialogContent} from '@material-ui/core';
import {GridOn as GridOnIcon, List as ListIcon, Close as CloseIcon, Compare as CompareIcon, Maximize as MaximizeIcon, Minimize as MinimizeIcon, AddCircle as AddCircleIcon, Toc as TocIcon, Send as SendIcon, Search as SearchIcon, FileCopy as FileCopyIcon, Delete as DeleteIcon, BubbleChart as BubbleChartIcon, Restore as RestoreIcon, Cached as CachedIcon, GetApp as GetAppIcon, Apps as AppsIcon, Edit as EditIcon, MoreVert as MoreVertIcon, PlayArrow as PlayArrowIcon, Add as AddIcon, Publish as PublishIcon, CloudUpload as CloudUploadIcon, CloudDownload as CloudDownloadIcon} from '@material-ui/icons';
import NestedMenuItem from "material-ui-nested-menu-item";
//import {Search as SearchIcon, ArrowUpward as ArrowUpwardIcon, Visibility as VisibilityIcon, Done as DoneIcon, Close as CloseIcon, Error as ErrorIcon, FindReplace as FindreplaceIcon, ArrowLeft as ArrowLeftIcon, Cached as CachedIcon, DirectionsRun as DirectionsRunIcon, Add as AddIcon, Polymer as PolymerIcon, FormatListNumbered as FormatListNumberedIcon, Create as CreateIcon, PlayArrow as PlayArrowIcon, AspectRatio as AspectRatioIcon, MoreVert as MoreVertIcon, Apps as AppsIcon, Schedule as ScheduleIcon, FavoriteBorder as FavoriteBorderIcon, Pause as PauseIcon, Delete as DeleteIcon, AddCircleOutline as AddCircleOutlineIcon, Save as SaveIcon, KeyboardArrowLeft as KeyboardArrowLeftIcon, KeyboardArrowRight as KeyboardArrowRightIcon, ArrowBack as ArrowBackIcon, Settings as SettingsIcon, LockOpen as LockOpenIcon, ExpandMore as ExpandMoreIcon, VpnKey as VpnKeyIcon} from '@material-ui/icons';

//https://next.material-ui.com/components/material-icons/
import {DataGrid, GridToolbarContainer, GridDensitySelector, GridToolbar} from '@material-ui/data-grid';

//import JSONPretty from 'react-json-pretty';
//import JSONPrettyMon from 'react-json-pretty/dist/monikai'
import Dropzone from '../components/Dropzone';

import {Link} from 'react-router-dom';
import { useAlert } from "react-alert";
import ChipInput from 'material-ui-chip-input'
import { v4 as uuidv4 } from 'uuid';
import CytoscapeWrapper from '../components/RenderCytoscape'

//import mobileImage from '../assets/img/mobile.svg';
//import bagImage from '../assets/img/bag.svg';
//import bookImage from '../assets/img/book.svg';

const inputColor = "#383B40"
const surfaceColor = "#27292D"
const svgSize = 24
const imagesize = 22

const flexContainerStyle = {
	display: "flex",
	flexDirection: "row",
	justifyContent: "left",
	alignContent: "space-between",
}

const flexBoxStyle = {
	height: 125,
	borderRadius: 4,
	boxSizing: "border-box",
	letterSpacing: "0.4px",
	color: "#D6791E",
	margin: 10, 
	flex: 1, 
}

const useStyles = makeStyles((theme) => ({
	datagrid: {
		border: 0,
		'& .MuiDataGrid-columnsContainer': {
			backgroundColor: theme.palette.type === 'light' ? '#fafafa' : theme.palette.inputColor,
		},
		'& .MuiDataGrid-iconSeparator': {
			display: 'none',
		},
		'& .MuiDataGrid-colCell, .MuiDataGrid-cell': {
		borderRight: `1px solid ${
			theme.palette.type === 'light' ? 'white' : '#303030'
		}`,
		},
		'& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
		borderBottom: `1px solid ${
			theme.palette.type === 'light' ? '#f0f0f0' : '#303030'
		}`,
		},
		'& .MuiDataGrid-cell': {
		color:
			theme.palette.type === 'light'
			? 'white'
			: 'rgba(255,255,255,0.65)',
		},
		'& .MuiPaginationItem-root, .MuiTablePagination-actions, .MuiTablePagination-caption': {
		borderRadius: 0,
		color: "white",
		},
	},
}));


// Takes an action in Shuffle and 
// Returns information about the icon, the color etc to be used
// This can be used for actions of all types
export const GetIconInfo = (action) => {
	// Finds the icon based on the action. Should be verbs.
	const iconList = [
		{"key": "cache_add", "values": ["set_cache"]},
		{"key": "cache_get", "values": ["get_cache"]},
		{"key": "filter", "values": ["filter", "route", "router",]},
		{"key": "merge", "values": ["join", "merge"]},
		{"key": "search", "values": ["search", "find", "locate", "index", "analyze", "anal", "match"]},
		{"key": "list", "values": ["list", "head", "options"]},
		{"key": "download", "values": ["capture", "get", "download", "return", "hello_world", "curl", "request", "export", "preview"]},
		{"key": "add", "values": ["add"]},
		{"key": "delete", "values": ["delete", "remove", "clear", "clean",]},
		{"key": "send", "values": ["send", "dispatch", "mail", "forward", "post", "submit", "mark", "set", "release", ]},
		{"key": "repeat", "values": ["repeat", "retry", "pause", "skip", "copy", "replicat", ]},
		{"key": "execute", "values": ["execute", "run", "play", "raise",]},
		{"key": "extract", "values": ["extract", "unpack", "decompress", "open"]},
		{"key": "inflate", "values": ["inflate", "pack", "compress",]},
		{"key": "edit", "values": ["modify", "update", "create", "edit", "put", "patch", "change", "replace", "conver", "map", "format", "escape", "describe", ]},
		{"key": "compare", "values": ["compare", "convert", "to", "filter", "translate", "parse"]},
		{"key": "close", "values": ["close", "stop", "cancel", "block", ]},
	]

	var selectedKey = ""
	if (action.name === undefined || action.name === null) {
	} else {
		const actionname = action.name.toLowerCase()
		for (var key in iconList) {
			//console.log(iconList[key], actionname)
			const found = iconList[key].values.find(value => actionname.includes(value))
			if (found !== null && found !== undefined) {
				selectedKey = iconList[key].key
				break
			}
		}
	}
		
	// Some of these are manually parsed or created instead of material ui
	//M8 0C3.58 0 0 1.79 0 4C0 6.21 3.58 8 8 8C12.42 8 16 6.21 16 4C16 1.79 12.42 0 8 0ZM0 6V9C0 11.21 3.58 13 8 13C12.42 13 16 11.21 16 9V6C16 8.21 12.42 10 8 10C3.58 10 0 8.21 0 6ZM0 11V14C0 16.21 3.58 18 8 18C9.41 18 10.79 17.81 12 17.46V14.46C10.79 14.81 9.41 15 8 15C3.58 15 0 13.21 0 11ZM17 11V14H14V16H17V19H19V16H22V14H19V11
	//https://www.figma.com/file/uCfnMs5w6wnLx6ehPHEV74/Figma-Material-Design-System-v3_0?node-id=834%3A21
	//COLORS: https://www.pinterest.co.uk/pin/326299935499972946/
	const defaultColor = "#f76b1c"
	const defaultGradient = ["#fad961", "#f76b1c"]
	const parsedIcons = {
		"cache_add": {
			"icon": "M11 3C6.58 3 3 4.79 3 7C3 9.21 6.58 11 11 11C15.42 11 19 9.21 19 7C19 4.79 15.42 3 11 3ZM3 9V12C3 14.21 6.58 16 11 16C15.42 16 19 14.21 19 12V9C19 11.21 15.42 13 11 13C6.58 13 3 11.21 3 9ZM3 14V17C3 19.21 6.58 21 11 21C12.41 21 13.79 20.81 15 20.46V17.46C13.79 17.81 12.41 18 11 18C6.58 18 3 16.21 3 14ZM20 14V17H17V19H20V22H22V19H25V17H22V14",
			"iconColor": "white",
			"iconBackgroundColor": "#8acc3f",
			"originalIcon": "",
			"fillGradient": ["#8acc3f", "#459622"]
		},
		"cache_get": {
			"icon": "M12 2C7.58 2 4 3.79 4 6C4 8.06 7.13 9.74 11.15 9.96C12.45 8.7 14.19 8 16 8C16.8 8 17.59 8.14 18.34 8.41C19.37 7.74 20 6.91 20 6C20 3.79 16.42 2 12 2ZM4 8V11C4 12.68 6.08 14.11 9 14.71C9.06 13.7 9.32 12.72 9.77 11.82C6.44 11.34 4 9.82 4 8ZM15.93 9.94C14.75 9.95 13.53 10.4 12.46 11.46C8.21 15.71 13.71 22.5 18.75 19.17L23.29 23.71L24.71 22.29L20.17 17.75C22.66 13.97 19.47 9.93 15.93 9.94ZM15.9 12C17.47 11.95 19 13.16 19 15C19 15.7956 18.6839 16.5587 18.1213 17.1213C17.5587 17.6839 16.7956 18 16 18C13.33 18 12 14.77 13.88 12.88C14.47 12.29 15.19 12 15.9 12ZM4 13V16C4 18.05 7.09 19.72 11.06 19.95C10.17 19.07 9.54 17.95 9.22 16.74C6.18 16.17 4 14.72 4 13Z",
			"iconColor": "white",
			"iconBackgroundColor": "#8acc3f",
			"originalIcon": "",
			"fillGradient": ["#8acc3f", "#459622"]
		},
		"repeat": {
			"icon": "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <CachedIcon />,
		},
		"add": {
			"icon": "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <AddIcon />,
		},
		"edit": {
			"icon": "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <EditIcon />,
		},
		"filter": {
			"icon": "M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z",
			"iconColor": "white",
			"iconBackgroundColor": "#f5515f",
			"originalIcon": "",
			"fillGradient": ["#f5515f", "#a1051d"],
		},
		"merge": {
			"icon": "M17 20.41 18.41 19 15 15.59 13.59 17 17 20.41zM7.5 8H11v5.59L5.59 19 7 20.41l6-6V8h3.5L12 3.5 7.5 8z",
			"iconColor": "white",
			"iconBackgroundColor": "#f5515f",
			"originalIcon": "",
			"fillGradient": ["#f5515f", "#a1051d"],
		},
		"compare": {
			"icon": "M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <CompareIcon />,
		},
		"extract": {
			"icon": "M3 3h18v2H3z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <MaximizeIcon />,
		},
		"inflate": {
			"icon": "M6 19h12v2H6z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <MinimizeIcon />,
		},
		"list": {
			"icon": "M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <TocIcon />,
		},
		"execute": {
			"icon": "M8 5v14l11-7z",
			"iconColor": "white",
			"iconBackgroundColor": defaultColor,
			"originalIcon": <PlayArrowIcon />,
		},
		"delete": {
			"icon": "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
			"iconColor": "white",
			"iconBackgroundColor": "#03030e",
			"originalIcon": <DeleteIcon />,
			"fillGradient": ["#03030e", "#205d66"]
		},
		"close": {
			"icon": "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
			"iconColor": "white",
			"iconBackgroundColor": "#03030e",
			"originalIcon": <CloseIcon />,
			"fillGradient": ["#03030e", "#205d66"]
		},
		"send": {
			"icon": "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
			"iconColor": "white",
			"iconBackgroundColor": "#0373da",
			"originalIcon": <SendIcon />,
			"fillGradient": ["#0bc8bf", "#0373da"]
		},
		"download": {
			"icon": "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
			"iconColor": "white",
			"iconBackgroundColor": "#0373da",
			"originalIcon": <GetAppIcon />,
			"fillGradient": ["#0bc8bf", "#0373da"]
		},
		"search": {
			"icon": "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
			"iconColor": "white",
			"iconBackgroundColor": "green",
			"originalIcon": <SearchIcon />,
		}
	}


	var selectedItem = parsedIcons[selectedKey]
	if (selectedItem === undefined || selectedItem === null) {
		return {
			"icon": "",
			"iconColor": "",
			"iconBackground": "black",
			"originalIcon": "",
		}
	}

	if (selectedItem.fillGradient === undefined) {
			selectedItem.fillGradient = defaultGradient
			selectedItem.iconBackgroundColor = defaultColor 
	}

	if (selectedItem.icon === "" || selectedItem.icon === undefined) {
		console.log(`MISSING PATH FOR ${selectedKey} (find in scope): `, selectedItem.originalIcon.type.type)
	} 
	
	if (selectedItem.originalIcon === undefined || selectedItem.originalIcon === "" && (selectedItem.icon !== "" && selectedItem.icon !== undefined)) {
			const svg_pin = <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} version="1.1" xmlns="http://www.w3.org/2000/svg"><path d={selectedItem.icon} fill={selectedItem.iconColor}></path></svg>
			//const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin)
			selectedItem.originalIcon = svg_pin
			//parsedIcons[selectedKey].originalIcon = svg_pin
			//console.log("ADDED ICON: ", svg_pin)
	}

	return selectedItem
}

//const activeWorkflowStyle = {backgroundColor: "#FFF5EE"}
//const notificationStyle = {backgroundColor: "#E5F9FF"}
//const activeWorkflowStyle = {backgroundColor: "#3d3f43"}
const availableWorkflowStyle = {backgroundColor: "#3d3f43"}
const notificationStyle = {backgroundColor: "#3d3f43"}
const activeWorkflowStyle = {backgroundColor: "#3d3f43"}

const fontSize_16 = {fontSize: "16px",}
const counterStyle = {fontSize: "36px",fontWeight:"bold"}
const blockRightStyle = {textAlign: "right",padding: "20px 20px 0px 0px",width:"100%"}

const chipStyle = {
	backgroundColor: "#3d3f43", height: 30, marginRight: 5, paddingLeft: 5, paddingRight: 5, height: 28, cursor: "pointer", borderColor: "#3d3f43", color: "white", 
}

const flexContentStyle = {
	display: "flex", 
	flexDirection: "row"
}

const iconStyle = {
	width: "75px",
	height: "75px",
	padding: "20px"
}

export const validateJson = (showResult) => {
	//showResult = showResult.split(" None").join(" \"None\"")
	showResult = showResult.split(" False").join(" false")
	showResult = showResult.split(" True").join(" true")

	var jsonvalid = true
	try {
		const tmp = String(JSON.parse(showResult))
		if (!showResult.includes("{") && !showResult.includes("[")) {
			jsonvalid = false
		}
	} catch (e) {
		showResult = showResult.split("\'").join("\"")

		try {
			const tmp = String(JSON.parse(showResult))
			if (!showResult.includes("{") && !showResult.includes("[")) {
				jsonvalid = false
			}
		} catch (e) {
			jsonvalid = false
		}
	}

	const result = jsonvalid ? JSON.parse(showResult) : showResult
	//console.log("VALID: ", jsonvalid, result)
	return {
		"valid": jsonvalid, 
		"result": result,
	}
}

const Workflows = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, removeCookie, cookies, userdata} = props;
	document.title = "Shuffle - Workflows"
	const theme = useTheme();
	const alert = useAlert()
	const classes = useStyles(theme);

	const referenceUrl = globalUrl+"/api/v1/hooks/"

	var upload = ""
	const [file, setFile] = React.useState("");

	const [workflows, setWorkflows] = React.useState([]);
	const [filteredWorkflows, setFilteredWorkflows] = React.useState([]);
	const [selectedWorkflow, setSelectedWorkflow] = React.useState({});
	const [selectedExecution, setSelectedExecution] = React.useState({});
	const [workflowExecutions, setWorkflowExecutions] = React.useState([]);
	const [firstrequest, setFirstrequest] = React.useState(true)
	const [workflowDone, setWorkflowDone] = React.useState(false)
	const [, setTrackingId] = React.useState("")
	const [selectedWorkflowId, setSelectedWorkflowId] = React.useState("")

	const [collapseJson, setCollapseJson] = React.useState(false)
	const [field1, setField1] = React.useState("")
	const [field2, setField2] = React.useState("")
	const [downloadUrl, setDownloadUrl] = React.useState("https://github.com/frikky/shuffle-workflows")
	const [downloadBranch, setDownloadBranch] = React.useState("master")
	const [loadWorkflowsModalOpen, setLoadWorkflowsModalOpen] = React.useState(false)
	const [exportModalOpen, setExportModalOpen] = React.useState(false)
	const [exportData, setExportData] = React.useState("");

	const [modalOpen, setModalOpen] = React.useState(false);
	const [newWorkflowName, setNewWorkflowName] = React.useState("");
	const [newWorkflowDescription, setNewWorkflowDescription] = React.useState("");
	const [newWorkflowTags, setNewWorkflowTags] = React.useState([]);

	const [showExtraOptions, setShowExtraOptions] = React.useState(true);
	const [defaultReturnValue, setDefaultReturnValue] = React.useState("");

	const [update, setUpdate] = React.useState("test");
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [publishModalOpen, setPublishModalOpen] = React.useState(false);
	const [editingWorkflow, setEditingWorkflow] = React.useState({})
	const [executionLoading, setExecutionLoading] = React.useState(false)
	const [importLoading, setImportLoading] = React.useState(false)
	const [isDropzone, setIsDropzone] = React.useState(false);
	const [view, setView] = React.useState("grid")
	const [filters, setFilters] = React.useState([])
	const [submitLoading, setSubmitLoading] = React.useState(false)

	const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" 

	const findWorkflow = (filters) => {
		if (filters.length === 0) {
			setFilteredWorkflows(workflows)
			return
		}

		var newWorkflows = []
		for (var workflowKey in workflows) {
			const curWorkflow = workflows[workflowKey]

			var found = [false]
			if (curWorkflow.tags === undefined || curWorkflow.tags === null) {
				found = filters.map(filter => curWorkflow.name.toLowerCase().includes(filter))
			} else {
				found = filters.map(filter => {
					if (filter === undefined) {
						return false
					}

					if (curWorkflow.name.toLowerCase().includes(filter.toLowerCase())) {
						return true
					} else if (curWorkflow.tags.includes(filter)) {
						return true
					} else if (curWorkflow.owner === filter) {
						return true
					} else if (curWorkflow.org_id === filter) {
						return true
					} else if (curWorkflow.actions !== null && curWorkflow.actions !== undefined) {
						const newfilter = filter.toLowerCase()
						for (var key in curWorkflow.actions) {
							const action = curWorkflow.actions[key]
							if (action.app_name.toLowerCase().includes(newfilter)) {
								return true
							}
						}
					}

					return false
				})
			}

			//console.log("FOUND: ", found)
			//if (found) {
			if (found.every(v => v === true)) {
				newWorkflows.push(curWorkflow)
				continue
			}
		}

		if (newWorkflows.length !== workflows.length) {
			setFilteredWorkflows(newWorkflows)
		}
	}

	const addFilter = (data) => {
		if (data === null || data === undefined) {
			return
		}

		if (data.includes("<") && data.includes(">")) {
			return
		}

		if (filters.includes(data)) {
			return
		}

		filters.push(data.toLowerCase())
		setFilters(filters)

		findWorkflow(filters)
	}

	const removeFilter = (index) => {
		var newfilters = filters

		if (index < 0) {
			console.log("Can't handle index: ", index)
			return
		}


		//console.log("Removing filter index", index)
		newfilters.splice(index, 1)
		//console.log("FILTER LENGTH: ", filters.length)

		if (newfilters.length === 0) {
			newfilters = []
			setFilters(newfilters)
		} else {
			setFilters(newfilters)
		}
		//console.log("FILTERS: ", newfilters)

		findWorkflow(newfilters) 
	}

	const exportVerifyModal = exportModalOpen ? 
		<Dialog
			open={exportModalOpen}
			onClose={() => {
				setExportModalOpen(false)
				setSelectedWorkflow({})
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 500,
					padding: 30,
				},
			}}
		>
			<DialogTitle style={{marginBottom: 0, }}>
				<div style={{textAlign: "center", color: "rgba(255,255,255,0.9)"}}>
					Want to auto-sanitize this workflow before exporting?
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)", textAlign: "center"}}>
				<Typography variant="body1" style={{}}>
					This will make potentially sensitive fields such as username, password, url etc. empty 
				</Typography>
				<Button variant="contained" style={{marginTop: 20, }} onClick={() => {
					setExportModalOpen(false)
					exportWorkflow(exportData, true)		
					setExportData("")
				}} color="primary">
					Yes
				</Button>
				<Button style={{marginTop: 20, }} onClick={() => {
					setExportModalOpen(false)
					exportWorkflow(exportData, false)		
					setExportData("")
				}} color="primary">
					No
				</Button>
			</DialogContent>
			
		</Dialog>
	: null

	const publishModal = publishModalOpen ? 
		<Dialog
			open={publishModalOpen}
			onClose={() => {
				setPublishModalOpen(false)
				setSelectedWorkflow({})
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 500,
					padding: 50,
				},
			}}
		>
			<DialogTitle style={{marginBottom: 0, }}>
				<div style={{textAlign: "center", color: "rgba(255,255,255,0.9)"}}>
					Are you sure you want to PUBLISH this workflow? 
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)", textAlign: "center"}}>
				<div>
					<Typography variant="body1" style={{marginBottom: 20,}}>
						Before publishing, we will sanitize all inputs, remove references to you, randomize ID's and remove your authentication.
					</Typography>
				</div>
				<Button variant="contained" style={{}} onClick={() => {
					publishWorkflow(selectedWorkflow) 
					setPublishModalOpen(false)
				}} color="primary">
					Yes
				</Button>
				<Button style={{}} onClick={() => {
					setPublishModalOpen(false)
				}} color="primary">
					No
				</Button>
			</DialogContent>
			
		</Dialog>
	: null

	const deleteModal = deleteModalOpen ? 
		<Dialog
			open={deleteModalOpen}
			onClose={() => {
				setDeleteModalOpen(false)
				setSelectedWorkflowId("")
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: 500,
				},
			}}
		>
			<DialogTitle>
				<div style={{textAlign: "center", color: "rgba(255,255,255,0.9)"}}>
					Are you sure you want to delete this workflow? <div/>Other workflows relying on this one may stop working
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)", textAlign: "center"}}>
				<Button style={{}} onClick={() => {
					console.log("Editing: ", editingWorkflow)
					if (selectedWorkflowId) {
						deleteWorkflow(selectedWorkflowId)		
						setTimeout(() => {
							getAvailableWorkflows() 
						}, 1000)
					}
					setDeleteModalOpen(false)
				}} color="primary">
					Yes
				</Button>
				<Button variant="outlined" style={{}} onClick={() => {setDeleteModalOpen(false)}} color="primary">
					No
				</Button>
			</DialogContent>
			
		</Dialog>
	: null

	const uploadFile = (e) => {
		const isDropzone = e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
		const files = isDropzone ? e.dataTransfer.files : e.target.files;
		
    const reader = new FileReader();
		alert.info("Starting upload. Please wait while we validate the workflows")

		try {
			reader.addEventListener('load', (e) => {
				var data = e.target.result;
				setIsDropzone(false)
				try {
					data = JSON.parse(reader.result)
				} catch (e) {
					alert.error("Invalid JSON: "+e)
					return
				}

				// Initialize the workflow itself
				const ret = setNewWorkflow(data.name, data.description, data.tags, data.default_return_value, {}, false)
				.then((response) => {
					if (response !== undefined) {
						// SET THE FULL THING
						data.id = response.id

						// Actually create it
						const ret = setNewWorkflow(data.name, data.description, data.tags, data.default_return_value, data, false)
						.then((response) => {
							if (response !== undefined) {
								alert.success(`Successfully imported ${data.name}`)
							}
						})
					}
				})
				.catch(error => {
					alert.error("Import error: "+error.toString())
				});
			})
		} catch (e) {
			console.log("Error in dropzone: ", e)
		}

		reader.readAsText(files[0]);
  }

	useEffect(() => {
		if (isDropzone) {
			//redirectOpenApi();
			setIsDropzone(false);
		}
  }, [isDropzone]);

	const getAvailableWorkflows = () => {
		fetch(globalUrl+"/api/v1/workflows", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  		credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!: ", response.status)

				if (isCloud) {
					window.location.pathname = "/login"
				}

				alert.info("Failed getting workflows.")
				setWorkflowDone(true)

				return 
			}
			return response.json()
		})
    .then((responseJson) => {
			setSelectedExecution({})
			setWorkflowExecutions([])
			//console.log(responseJson)

			if (responseJson !== undefined) {
				setWorkflows(responseJson)
				setFilteredWorkflows(responseJson)
				setWorkflowDone(true)
			} else {
				if (isLoggedIn) {
					alert.error("An error occurred while loading workflows")
				}

				return
			}

			if (responseJson.length > 0){
				//setSelectedWorkflow(responseJson[0])
				//getWorkflowExecution(responseJson[0].id)
			}
    	})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	useEffect(() => {
		if (workflows.length <= 0 && firstrequest) {
			const tmpView = localStorage.getItem('view');
			if (tmpView !== undefined && tmpView !== null) {
				setView(tmpView)
			}

			setFirstrequest(false)
			getAvailableWorkflows()
		}
	})

	const viewStyle = {
		color: "#ffffff",
		width: "100%",
		display: "flex",
		minWidth: 1024,
		maxWidth: 1024,
		margin: "auto",
		/*maxHeight: "90vh",*/
	}

	const emptyWorkflowStyle = {
		paddingTop: "200px", 
		width: 1024,
		margin: "auto",
	}

	const boxStyle = {
		padding: "20px 20px 20px 20px",
		width: "100%",
		height: "250px",
		color: "white",
		backgroundColor: surfaceColor,
		display: "flex", 
		flexDirection: "column",
	}


	const scrollStyle = {
		marginTop: "10px",
		overflow: "scroll",
		height: "90%",
		overflowX: "hidden",
		overflowY: "auto",
	}

	const paperAppContainer = {
		display: "flex",
		flexWrap: 'wrap',
		alignContent: "space-between",
	}

	const paperAppStyle = {
		minHeight: 130,
		maxHeight: 130,
		overflow: "hidden",
		width: "100%",
		color: "white",
		backgroundColor: surfaceColor,
		padding: "12px 12px 0px 15px", 
		borderRadius: 5, 
		display: "flex",
		boxSizing: "border-box",
		position: "relative",
	}


	const gridContainer = {
		height: "auto",
		color: "white",
		margin: "10px",
		backgroundColor: surfaceColor,
	}

	const workflowActionStyle = {
		display: "flex", 
		width: 160, 
		height: 44,
		justifyContent: "space-between", 
	}

	const executeWorkflow = (id) => {
		alert.show("Executing workflow "+id)
		setTrackingId(id)
		fetch(globalUrl+"/api/v1/workflows/"+id+"/execute", {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for WORKFLOW EXECUTION :O!")
			} 

			return response.json()
		})
    .then((responseJson) => {
			if (!responseJson.success) {
				alert.error(responseJson.reason)
			}
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}

	function sleep (time) {
		return new Promise((resolve) => setTimeout(resolve, time));
	}

	const exportAllWorkflows = () => {
		for (var key in workflows) {
			exportWorkflow(workflows[key], false)
		}
	}

	const deduplicateIds = (data) => {
		if (data.triggers !== null && data.triggers !== undefined) {
			for (var key in data.triggers) {
				const trigger = data.triggers[key]
				if (trigger.app_name === "Shuffle Workflow") {
					if (trigger.parameters.length > 2) {
						trigger.parameters[2].value = ""
					}
				} 
				
				if (trigger.status == "running") {
					trigger.status = "stopped"
				}

				const newId = uuidv4()
				if (trigger.trigger_type === "WEBHOOK") {
					const hookname = "webhook_"+newId
					if (trigger.parameters !== undefined && trigger.parameters !== null && trigger.parameters.length === 2) {
						trigger.parameters[0].value = referenceUrl+"webhook_"+trigger.id
						trigger.parameters[1].value = "webhook_"+trigger.id
					} else if (trigger.parameters !== undefined && trigger.parameters !== null && trigger.parameters.length === 3) {
						trigger.parameters[0].value = referenceUrl+"webhook_"+trigger.id
						trigger.parameters[1].value = "webhook_"+trigger.id
						// FIXME: Add auth here?
					} else {
						alert.info("Something is wrong with the webhook in the copy")
					}
				}

				for (var branchkey in data.branches) {
					const branch = data.branches[branchkey]
					if (branch.source_id === trigger.id) {
						branch.source_id = newId
					} 

					if (branch.destination_id === trigger.id) {
						branch.destination_id = newId
					}
				}

				trigger.environment = isCloud ? "cloud" : "Shuffle"
				trigger.id = newId
			}
		}

		if (data.actions !== null && data.actions !== undefined) {
			for (var key in data.actions) {
				data.actions[key].authentication_id = ""

				for (var subkey in data.actions[key].parameters) {
					const param = data.actions[key].parameters[subkey]
					if (param.name.includes("key") || param.name.includes("user") || param.name.includes("pass") || param.name.includes("api") || param.name.includes("auth") || param.name.includes("secret") || param.name.includes("domain") || param.name.includes("url") || param.name.includes("mail")) {
						// FIXME: This may be a vuln if api-keys are generated that start with $
						if (param.value.startsWith("$")) {
							console.log("Skipping field, as it's referencing a variable")
						} else {
							param.value = ""
							param.is_valid = false
						}
					}
				}

				const newId = uuidv4()
				for (var branchkey in data.branches) {
					const branch = data.branches[branchkey]
					if (branch.source_id === data.actions[key].id) {
						branch.source_id = newId
					} 

					if (branch.destination_id === data.actions[key].id) {
						branch.destination_id = newId
					}
				}

				if (data.actions[key].id === data.start) {
					data.start = newId
				}

				//data.actions[key].environment = isCloud ? "cloud" : "Shuffle"
				data.actions[key].environment = ""
				data.actions[key].id = newId
			}
		}

		if (data.workflow_variables !== null && data.workflow_variables !== undefined) {
			for (var key in data.workflow_variables) {
				const param = data.workflow_variables[key]
				if (param.name.includes("key") || param.name.includes("user") || param.name.includes("pass") || param.name.includes("api") || param.name.includes("auth") || param.name.includes("secret") || param.name.includes("email")) {
					param.value = ""
					param.is_valid = false
				}
			}
		}

		return data
	}

	const sanitizeWorkflow = (data) => {
		data = JSON.parse(JSON.stringify(data))
		data["owner"] = ""
		console.log("Sanitize start: ", data)
		data = deduplicateIds(data)

		data["org"] = []
		data["org_id"] = ""
		data["execution_org"] = {}

		// These are backwards.. True = saved before. Very confuse.
		data["previously_saved"] = false
		data["first_save"] = false
		console.log("Sanitize end: ", data)

		return data
	}

	const exportWorkflow = (data, sanitize) => {
		data = JSON.parse(JSON.stringify(data))
		let exportFileDefaultName = data.name+'.json';

		if (sanitize === true) {
			data = sanitizeWorkflow(data)	
		}
		//return

		// Add correct ID's for triggers
		// Add mag

		let dataStr = JSON.stringify(data)
		let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
		let linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	}

	const publishWorkflow = (data) => {
		data = JSON.parse(JSON.stringify(data))
		data = sanitizeWorkflow(data) 
		alert.info("Sanitizing and publishing "+data.name)

		// This ALWAYS talks to Shuffle cloud
		fetch(globalUrl+"/api/v1/workflows/"+data.id+"/publish", {
    	  method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(data),
	  		credentials: "include",
    	})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflow publish :O!")
			} else {
				if (isCloud) { 
					alert.success("Successfully published workflow")
				} else {
					alert.success("Successfully published workflow to https://shuffler.io")
				}
			}

			return response.json()
		})
    .then((responseJson) => {
			if (responseJson.reason !== undefined) {
				alert.error("Failed publishing: ", responseJson.reason) 
			}

			getAvailableWorkflows()
    })
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const copyWorkflow = (data) => {
		data = JSON.parse(JSON.stringify(data))
		alert.success("Copying workflow "+data.name)
		data.id = ""
		data.name = data.name+"_copy"
		data = deduplicateIds(data) 
		//console.log("COPIED DATA: ", data)
		//return

		fetch(globalUrl+"/api/v1/workflows", {
    	  method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(data),
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!")
				return 
			}
			return response.json()
		})
    .then((responseJson) => {
			setTimeout(() => {
				getAvailableWorkflows()
			}, 1000)
    })
		.catch(error => {
			alert.error(error.toString())
		})
	}


	const deleteWorkflow = (id) => {
		fetch(globalUrl+"/api/v1/workflows/"+id, {
    	  method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
	  			credentials: "include",
    		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for setting workflows :O!")
				alert.error("Failed deleting workflow")
			} else {
				alert.success("Deleted workflow "+id)
			}

			return response.json()
		})
		.then((responseJson) => {
			setTimeout(() => {
				getAvailableWorkflows()
			}, 1000)
		})
		.catch(error => {
			alert.error(error.toString())
		});
	}


	const handleChipClick = (e) => {
		addFilter(e.target.innerHTML)
	}


	const NewWorkflowPaper = (props) => {
		const [hover, setHover] = React.useState(false)

		const innerColor = "rgba(255,255,255,0.3)"
		const setupPaperStyle = {
			minHeight: paperAppStyle.minHeight,
			width: paperAppStyle.width,
			color: innerColor,
			padding: paperAppStyle.padding, 
			borderRadius: paperAppStyle.borderRadius, 
			display: "flex",
			boxSizing: "border-box",
			position: "relative",
			border: `2px solid ${innerColor}`,
			cursor: "pointer",
			backgroundColor: hover ? "rgba(39,41,45,0.5)" : "rgba(39,41,45,1)",
		}

		return(
			<Grid item xs={4} style={{padding: "12px 10px 12px 10px",}}>
				<Paper square style={setupPaperStyle} onClick={() => setModalOpen(true)} onMouseOver={() => {setHover(true)}} onMouseOut={() => {setHover(false)}}>	
					<Tooltip title={`New Workflow`} placement="bottom">
						<span style={{textAlign: "center", width: 300, margin: "auto",}}>
							<AddCircleIcon style={{height: 65, width: 65, }}/>
						</span>
					</Tooltip>
				</Paper>
			</Grid>
		)
	}

	const WorkflowPaper = (props) => {
  	const { data } = props;
		const [open, setOpen] = React.useState(false);
		const [anchorEl, setAnchorEl] = React.useState(null);

		var boxWidth = "2px"
		if (selectedWorkflow.id === data.id) {
			boxWidth = "4px"
		}

		var boxColor = "#FECC00"
		if (data.is_valid) {
			boxColor = "#86c142"
		}

		if (!data.previously_saved) {
			boxColor = "#f85a3e"
		}

		const menuClick = (event) => {
			setOpen(!open)
			setAnchorEl(event.currentTarget);
		}

		var parsedName = data.name
		if (parsedName !== undefined && parsedName !== null && parsedName.length > 20) {
			parsedName = parsedName.slice(0,21)+".." 
		}

		const actions = data.actions !== null ? data.actions.length : 0
		const [triggers, schedules, webhooks, subflows] = getWorkflowMeta(data)


		const workflowMenuButtons = <Menu
				id="long-menu"
				anchorEl={anchorEl}
				keepMounted
				open={open}
				onClose={() => {
					setOpen(false)
					setAnchorEl(null)
				}}
			>
				<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
					//console.log("DATA:" ,data)
					setModalOpen(true)
					setEditingWorkflow(data)
					setNewWorkflowName(data.name)
					setNewWorkflowDescription(data.description)
					setDefaultReturnValue(data.default_return_value)
					if (data.tags !== undefined && data.tags !== null) {
						setNewWorkflowTags(JSON.parse(JSON.stringify(data.tags)))
					}
				}} key={"change"}>
					<EditIcon style={{marginLeft: 0, marginRight: 8}}/>
					{"Change details"}
				</MenuItem>
				<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
					setSelectedWorkflow(data) 
					setPublishModalOpen(true)
				}} key={"publish"}>
					<CloudUploadIcon style={{marginLeft: 0, marginRight: 8}}/>
					{"Publish Workflow"}
				</MenuItem>
				<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
					copyWorkflow(data)		
					setOpen(false)
				}} key={"duplicate"}>
					<FileCopyIcon style={{marginLeft: 0, marginRight: 8}}/>
					{"Duplicate Workflow"}
				</MenuItem>
				<NestedMenuItem disabled={userdata.orgs === undefined || userdata.orgs === null || userdata.orgs.length === 1 || userdata.orgs.length >= 0} style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
					//copyWorkflow(data)		
					//setOpen(false)
				}} key={"duplicate"}>
					<FileCopyIcon style={{marginLeft: 0, marginRight: 8}}/>
					{"Copy to Child Org"}
				</NestedMenuItem>
				<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
					setExportModalOpen(true)
					setExportData(data)
					setOpen(false)
				}} key={"export"}>
					<GetAppIcon style={{marginLeft: 0, marginRight: 8}}/>
					{"Export Workflow"}
				</MenuItem>
				<MenuItem style={{backgroundColor: inputColor, color: "white"}} onClick={() => {
					setDeleteModalOpen(true)
					setSelectedWorkflowId(data.id)
					setOpen(false)
				}} key={"delete"}>
					<DeleteIcon style={{marginLeft: 0, marginRight: 8}}/>
					{"Delete Workflow"}
				</MenuItem>
			</Menu>

		var image = ""
		var orgName = ""
		var orgId = ""
		if (userdata.orgs !== undefined) {
			const foundOrg = userdata.orgs.find(org => org.id === data["org_id"])
			if (foundOrg !== undefined && foundOrg !== null) {
				//position: "absolute", bottom: 5, right: -5, 
				const imageStyle = {width: imagesize, height: imagesize, pointerEvents: "none", marginRight: 10, marginLeft: data.creator_org !== undefined && data.creator_org.length > 0 ? 20 : 0, borderRadius: 10, border: foundOrg.id === userdata.active_org.id ? `3px solid ${boxColor}` : null, cursor: "pointer", marginRight: 10, }

				//<Tooltip title={`Org: ${foundOrg.name}`} placement="bottom">
				image = foundOrg.image === "" ? 
					<img alt={foundOrg.name} src={theme.palette.defaultImage} style={imageStyle} />
					:
					<img alt={foundOrg.name} src={foundOrg.image} style={imageStyle} onClick={() => {
						//setFilteredWorkflows(newWorkflows)
					}}/>

				orgName = foundOrg.name
				orgId = foundOrg.id
			}
		}

		return (
			<Grid item xs={4} style={{padding: "12px 10px 12px 10px",}}>
				<Paper square style={paperAppStyle}  >	
					<div style={{position: "absolute", bottom: 1, left: 1, height: 12, width: 12, backgroundColor: boxColor, borderRadius: "0 100px 0 0",}} />
					<Grid item style={{display: "flex", flexDirection: "column", width: "100%"}}>
						<Grid item style={{display: "flex", maxHeight: 34,}}>
							<Tooltip title={`Org "${orgName}"`} placement="bottom">
								<div styl={{cursor: "pointer"}} onClick={() => {
									addFilter(orgId) 
									//setFilters(["Org "+orgName])
									//setFilteredWorkflows(newWorkflows)
								}}>
									{image}
								</div>
							</Tooltip>
							<Tooltip title={`Edit ${data.name}`} placement="bottom">
								<Typography variant="body1" style={{marginBottom: 0, paddingBottom: 0, maxHeight: 30, flex: 10,}}>
									<Link to={"/workflows/"+data.id} style={{textDecoration: "none", color: "inherit",}}>
										{parsedName}
									</Link>
								</Typography>
							</Tooltip>
						</Grid>
						<Grid item style={workflowActionStyle}>
							<Tooltip color="primary" title="Action amount" placement="bottom">
								<span style={{color: "#979797", display: "flex"}}>
									<BubbleChartIcon style={{marginTop: "auto", marginBottom: "auto",}} /> 
									<Typography style={{marginLeft: 5, marginTop: "auto", marginBottom: "auto",}}>
										{actions}
									</Typography>
								</span>
							</Tooltip>
							<Tooltip color="primary" title="Trigger amount" placement="bottom">
								<span style={{marginLeft: 15, color: "#979797", display: "flex"}}>
									<RestoreIcon style={{color: "#979797", marginTop: "auto", marginBottom: "auto",}}/> 
									<Typography style={{marginLeft: 5, marginTop: "auto", marginBottom: "auto",}}>
										{triggers}
									</Typography>
								</span>
							</Tooltip>
							<Tooltip color="primary" title="Subflows used" placement="bottom">
								<span style={{marginLeft: 15, display: "flex", color: "#979797", cursor: "pointer"}} onClick={() => {
									if (subflows === 0) {
										alert.info("No subflows for "+data.name)
										return
									}

									var newWorkflows = [data]
									for (var key in data.triggers) {
										const trigger = data.triggers[key]
										if (trigger.app_name !== "Shuffle Workflow") {
											continue
										}

										if (trigger.parameters !== undefined && trigger.parameters !== null && trigger.parameters.length > 0 && trigger.parameters[0].name === "workflow") {
											const newWorkflow = workflows.find(item => item.id === trigger.parameters[0].value)	
											if (newWorkflow !== null && newWorkflow !== undefined) {
												newWorkflows.push(newWorkflow)
												continue
											}
										}
									}

									setFilters(["Subflows of "+data.name])
									setFilteredWorkflows(newWorkflows)
								}}>
									<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{color: "#979797", marginTop: "auto", marginBottom: "auto",}}>
										<path d="M0 0H15V15H0V0ZM16 16H18V18H16V16ZM16 13H18V15H16V13ZM16 10H18V12H16V10ZM16 7H18V9H16V7ZM16 4H18V6H16V4ZM13 16H15V18H13V16ZM10 16H12V18H10V16ZM7 16H9V18H7V16ZM4 16H6V18H4V16Z" fill="#979797"/>
									</svg>
									<Typography style={{marginLeft: 5, marginTop: "auto", marginBottom: "auto",}}>
										{subflows}
									</Typography>
								</span>
							</Tooltip>
							{/*
							<Tooltip color="primary" title={`Actions: ${data.actions.length}`} placement="bottom">
								<AppsIcon />
							</Tooltip>
								<Tooltip color="primary" title={`Webhooks: ${webhooks}`} placement="bottom">
										<RestoreIcon />
								</Tooltip>
							: null}
							{schedules > 0 ? 
								<Tooltip color="primary" title={`Schedules: ${schedules}`} placement="bottom">
										<RestoreIcon />
								</Tooltip>
							: null}
							*/}
						</Grid>
						<Grid item style={{justifyContent: "left", overflow: "hidden", marginTop: 5,}}>
							{data.tags !== undefined ?
								data.tags.map((tag, index) => {
									if (index >= 3) {
										return null
									}


									return (
										<Chip
											key={index}
											style={chipStyle}
											label={tag}
											onClick={handleChipClick}
											variant="outlined"
											color="primary"
										/>
									)
								})
							: null}
						</Grid>
					</Grid>
				{data.actions !== undefined && data.actions !== null ? 
					<Grid item style={{display:"flex",flexDirection:"column", justifyContent:"space-between"}}>
						<Grid>
							<IconButton
								aria-label="more"
								aria-controls="long-menu"
								aria-haspopup="true"
								style={{color: "white"}}
								onClick={menuClick}
								style={{padding:"0px",color:"white", color:"#979797"}}
								>
								<MoreVertIcon />
							</IconButton>
							{workflowMenuButtons}	
						</Grid>
						{/*
						<Grid>
							<Link to={"/workflows/"+data.id}>
								<Tooltip title="Edit workflow" placement="bottom">
									<EditIcon style={{borderRadius: "4px", color: "#F85A3E", height: 20, width: 20, padding: 7, fontSize: "small"}} />
								</Tooltip>
							</Link>	
						</Grid>
						*/}
					</Grid>
					: null}
				</Paper>
			</Grid>
		)
	}



	const dividerColor = "rgb(225, 228, 232)"

	const resultPaperAppStyle = {
		minHeight: "100px",
		minWidth: "100%",
		overflow: "hidden",
		maxWidth: "100%",
		marginTop: "5px",
		color: "white",
		backgroundColor: surfaceColor,
		cursor: "pointer",
		display: "flex",
	}

	function replaceAll(string, search, replace) {
		return string.split(search).join(replace);
	}



	const resultsLength = Object.getOwnPropertyNames(selectedExecution).length > 0 && selectedExecution.results !== null ? selectedExecution.results.length : 0 	



	// Can create and set workflows
	const setNewWorkflow = (name, description, tags, defaultReturnValue, editingWorkflow, redirect) => {

		var method = "POST"
		var extraData = ""
		var workflowdata = {}

		if (editingWorkflow.id !== undefined) {
			console.log("Building original workflow")
			method = "PUT"
			extraData = "/"+editingWorkflow.id+"?skip_save=true"
			workflowdata = editingWorkflow

			console.log("REMOVING OWNER")
			workflowdata["owner"] = ""	
			// FIXME: Loop triggers and turn them off?
		}

		workflowdata["name"] = name 
		workflowdata["description"] = description 
		if (tags !== undefined) {
			workflowdata["tags"] = tags 
		}

		if (defaultReturnValue !== undefined) {
			workflowdata["default_return_value"] = defaultReturnValue 
			//console.log("WORKFLOW: ", workflowdata)
		}

		//console.log(workflowdata)
		//return

		return fetch(globalUrl+"/api/v1/workflows"+extraData, {
    	  method: method,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify(workflowdata),
	  		credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!")
				return 
			}
			setSubmitLoading(false)

			return response.json()
		})
    .then((responseJson) => {
			if (method === "POST" && redirect) {
				window.location.pathname = "/workflows/"+responseJson["id"] 
				setModalOpen(false)
			} else if (!redirect) {
				// Update :)		
				setTimeout(() => {
					getAvailableWorkflows()
				}, 1000)
				setImportLoading(false)
				setModalOpen(false)
			} else { 
				alert.info("Successfully changed basic info for workflow")
				setModalOpen(false)
			}

			return responseJson
    })
		.catch(error => {
			alert.error(error.toString())
			setImportLoading(false)
			setModalOpen(false)
			setSubmitLoading(false)
		});
	}


	const importFiles = (event) => {
		console.log("Importing!")

		setImportLoading(true)
		const file = event.target.value
		if (event.target.files.length > 0) {
			for (var key in event.target.files) {
				const file = event.target.files[key]
				if (file.type !== "application/json") {
					if (file.type !== undefined) {
						alert.error("File has to contain valid json")
					}

					continue
				}

  			const reader = new FileReader()
				// Waits for the read
	  		reader.addEventListener('load', (event) => {
					var data = reader.result
					try {
						data = JSON.parse(reader.result)
					} catch (e) {
						alert.error("Invalid JSON: "+e)
						setImportLoading(false)
						return
					}

					// Initialize the workflow itself
					const ret = setNewWorkflow(data.name, data.description, data.tags, data.default_return_value, {}, false)
					.then((response) => {
						if (response !== undefined) {
							// SET THE FULL THING
							data.id = response.id
							data.first_save = false
							data.previously_saved = false 
							data.is_valid = false

							// Actually create it
							const ret = setNewWorkflow(data.name, data.description, data.tags, data.default_return_value, data, false)
							.then((response) => {
								if (response !== undefined) {
									alert.success("Successfully imported "+data.name)
								}
							})
						}
					})
					.catch(error => {
						alert.error("Import error: "+error.toString())
					});
				})

				// Actually reads
		  	reader.readAsText(file)
			}
		}

		setLoadWorkflowsModalOpen(false)
	}

	const getWorkflowMeta = (data) => {
		let triggers = 0
		let schedules = 0
		let webhooks = 0
		let subflows = 0
		if (data.triggers !== undefined && data.triggers !== null && data.triggers.length > 0) {
			triggers = data.triggers.length
			for (let key in data.triggers) {

				if (data.triggers[key].app_name === "Webhook") {
					webhooks += 1
					//webhookImg = data.triggers[key].large_image
				} else if (data.triggers[key].app_name === "Schedule") {
					schedules += 1
					//scheduleImg = data.triggers[key].large_image
				} else if (data.triggers[key].app_name === "Shuffle Workflow") {
					subflows += 1
				}
			}
		}

		return [triggers, schedules, webhooks, subflows]
	}

	const WorkflowListView = () => {
			let workflowData = "";
			if (workflows.length > 0) {
				const columns = [
					{ field: 'image', headerName: 'Logo', width: 42, renderCell: (params) => {
						const data = params.row.record

						var boxColor = "#FECC00"
						if (data.is_valid) {
							boxColor = "#86c142"
						}

						if (!data.previously_saved) {
							boxColor = "#f85a3e"
						}

						var image = ""
						var orgName = ""
						var orgId = ""
						if (userdata.orgs !== undefined) {
							const foundOrg = userdata.orgs.find(org => org.id === data["org_id"])
							if (foundOrg !== undefined && foundOrg !== null) {
								//position: "absolute", bottom: 5, right: -5, 
								const imageStyle = {width: imagesize+7, height: imagesize+7, pointerEvents: "none", marginLeft: data.creator_org !== undefined && data.creator_org.length > 0 ? 20 : 0, borderRadius: 10, border: foundOrg.id === userdata.active_org.id ? `3px solid ${boxColor}` : null, cursor: "pointer", marginTop: 5, }

								//<Tooltip title={`Org: ${foundOrg.name}`} placement="bottom">
								image = foundOrg.image === "" ? 
									<img alt={foundOrg.name} src={theme.palette.defaultImage} style={imageStyle} />
									:
									<img alt={foundOrg.name} src={foundOrg.image} style={imageStyle} onClick={() => {
										//setFilteredWorkflows(newWorkflows)
									}}/>

								orgName = foundOrg.name
								orgId = foundOrg.id
							}
						}

						return (
							<div styl={{cursor: "pointer"}} onClick={() => {
								//addFilter(orgId) 
								//setFilters(["Org "+orgName])
								//setFilteredWorkflows(newWorkflows)
							}}>
								{image}
							</div>
						)
					}},
					{ field: 'title', headerName: 'Title', width: 330, renderCell: (params) => {
						const data = params.row.record

						return (
							<Grid item>
								<Link to={`/workflows/{data.id}`} style={{textDecoration: "none", color: "inherit",}}>
									<Typography>
										{data.name}
									</Typography>
								</Link>
							</Grid>
						)
					}},
					{/* field: 'category', headerName: 'category', width: 140, renderCell: (params) => {
						const data = params.row.record
						const category = data.category === undefined ? "not defined" : data.category
						return (
							<Typography>
								{category}
							</Typography>
						)
					} */},
					{ field: 'options', headerName: 'Options', width: 200, sortable: false, 
						disableClickEventBubbling: true,
						renderCell: (params) => {
							const data = params.row.record;
							const actions = data.actions !== null ? data.actions.length : 0
							let [triggers, schedules, webhooks, subflows] = getWorkflowMeta(data);

							return (
								<Grid item>
									<div style={{display: "flex"}}>
										<Tooltip color="primary" title="Action amount" placement="bottom">
											<span style={{color: "#979797", display: "flex"}}>
												<BubbleChartIcon style={{marginTop: "auto", marginBottom: "auto",}} /> 
												<Typography style={{marginLeft: 5, marginTop: "auto", marginBottom: "auto",}}>
													{actions}
												</Typography>
											</span>
										</Tooltip>
										<Tooltip color="primary" title="Trigger amount" placement="bottom">
											<span style={{marginLeft: 15, color: "#979797", display: "flex"}}>
												<RestoreIcon style={{color: "#979797", marginTop: "auto", marginBottom: "auto",}}/> 
												<Typography style={{marginLeft: 5, marginTop: "auto", marginBottom: "auto",}}>
													{triggers}
												</Typography>
											</span>
										</Tooltip>
										<Tooltip color="primary" title="Subflows used" placement="bottom">
											<span style={{marginLeft: 15, display: "flex", color: "#979797", cursor: "pointer"}} onClick={() => {
												if (subflows === 0) {
													alert.info("No subflows for "+data.name)
													return
												}

												var newWorkflows = [data]
												for (var key in data.triggers) {
													const trigger = data.triggers[key]
													if (trigger.app_name !== "Shuffle Workflow") {
														continue
													}

													if (trigger.parameters !== undefined && trigger.parameters !== null && trigger.parameters.length > 0 && trigger.parameters[0].name === "workflow") {
														const newWorkflow = workflows.find(item => item.id === trigger.parameters[0].value)	
														if (newWorkflow !== null && newWorkflow !== undefined) {
															newWorkflows.push(newWorkflow)
															continue
														}
													}
												}

												setFilters(["Subflows of "+data.name])
												setFilteredWorkflows(newWorkflows)
											}}>
												<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{color: "#979797", marginTop: "auto", marginBottom: "auto",}}>
													<path d="M0 0H15V15H0V0ZM16 16H18V18H16V16ZM16 13H18V15H16V13ZM16 10H18V12H16V10ZM16 7H18V9H16V7ZM16 4H18V6H16V4ZM13 16H15V18H13V16ZM10 16H12V18H10V16ZM7 16H9V18H7V16ZM4 16H6V18H4V16Z" fill="#979797"/>
												</svg>
												<Typography style={{marginLeft: 5, marginTop: "auto", marginBottom: "auto",}}>
													{subflows}
												</Typography>
											</span>

										</Tooltip>
									</div>
								</Grid>
							)
						}
					},
					{ field: 'tags', headerName: 'Tags', maxHeight: 15, width: 300, sortable: false, 
						disableClickEventBubbling: true,
						renderCell: (params) => {
							const data = params.row.record;
							return (
								<Grid item>
										{data.tags !== undefined ?
											data.tags.map((tag, index) => {
												if (index >= 3) {
													return null
												}

												return (
													<Chip
														key={index}
														style={chipStyle}
														label={tag}
														variant="outlined"
														color="primary"
													/>
												)
											})
										: null}
									</Grid>
								)
							}
					},
					{ field: '', headerName: '', maxHeight: 15, width: 100, sortable: false, 
						disableClickEventBubbling: true,
						renderCell: (params) => {
						}
					}
				];
				let rows = [];
				rows = workflows.map((data, index) => {
					let obj = {
						"id":index+1, 
						"title":data.name, 
						"record":data,
					}

					return obj;
				});
				workflowData = 
					<DataGrid 
						color="primary" 
						className={classes.datagrid}
						rows={rows} 
						columns={columns} 
						pageSize={20} 
						checkboxSelection 
						autoHeight 
						density="standard" 
						components={{
							Toolbar: GridToolbar,
						}} 
					/>
			}
			return (
				<div style={gridContainer}>
					{workflowData}
				</div>	
			);
		}

	const modalView = modalOpen ? 
		<Dialog 
			open={modalOpen} 
			onClose={() => {setModalOpen(false)}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
				},
			}}
		>
			<DialogTitle>
				<div style={{color: "rgba(255,255,255,0.9)"}}>
					{editingWorkflow.id !== undefined ? "Editing" : "New"} workflow
					<div style={{float: "right"}}>
						<Tooltip color="primary" title={"Import manually"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
								<PublishIcon />
							</Button> 				
						</Tooltip>
					</div>
				</div>
			</DialogTitle>
			<FormControl>
				<DialogContent>
					<TextField
						onBlur={(event) => setNewWorkflowName(event.target.value)}
						InputProps={{
							style:{
								color: "white",
							},
						}}
						color="primary"
						placeholder="Name"
						margin="dense"
						defaultValue={newWorkflowName}
						autoFocus
						fullWidth
					  />
					<TextField
						onBlur={(event) => setNewWorkflowDescription(event.target.value)}
						InputProps={{
							style:{
								color: "white",
							},
						}}
						color="primary"
						defaultValue={newWorkflowDescription}
						placeholder="Description"
						rows="3"
						multiline
						margin="dense"
						fullWidth
					  />
					<ChipInput
						style={{marginTop: 10, }}
						InputProps={{
							style:{
								color: "white",
							},
						}}
						placeholder="Tags"
						color="primary"
						fullWidth
						value={newWorkflowTags}
						onAdd={(chip) => {
							newWorkflowTags.push(chip)
							setNewWorkflowTags(newWorkflowTags)
						}}
						onDelete={(chip, index) => {
							newWorkflowTags.splice(index, 1)
							setNewWorkflowTags(newWorkflowTags)
							setUpdate("delete "+chip)
						}}
					/>
					{showExtraOptions ? 
						<TextField
							onBlur={(event) => setDefaultReturnValue(event.target.value)}
							InputProps={{
								style:{
									color: "white",
								},
							}}
							color="primary"
							defaultValue={defaultReturnValue}
							placeholder="Default return value (used for Subflows if the subflow fails)"
							rows="3"
							multiline
							margin="dense"
							fullWidth
							/>
						: null}
				</DialogContent>
				<DialogActions>
					<Button style={{}} onClick={() => {
						setNewWorkflowName("")
						setNewWorkflowDescription("")
						setDefaultReturnValue("")
						setEditingWorkflow({})
						setNewWorkflowTags([])
						setModalOpen(false)
					}} color="primary">
						Cancel
					</Button>
					<Button variant="contained" style={{}} disabled={newWorkflowName.length === 0} onClick={() => {
						console.log("Tags: ", newWorkflowTags)
						if (editingWorkflow.id !== undefined) {
							setNewWorkflow(newWorkflowName, newWorkflowDescription, newWorkflowTags, defaultReturnValue, editingWorkflow, false)
							setNewWorkflowName("")
							setDefaultReturnValue("")
							setNewWorkflowDescription("")
							setEditingWorkflow({})
							setNewWorkflowTags([])
						} else {
							setNewWorkflow(newWorkflowName, newWorkflowDescription, newWorkflowTags, defaultReturnValue, {}, true)
						}

						setSubmitLoading(true)

					}} color="primary">
						{submitLoading ? 
							<CircularProgress />
							:
	        		"Submit"
						}
	        </Button>
				</DialogActions>
			</FormControl>
		</Dialog>
		: null

		
		const viewSize = {
			workflowView: 4,
			executionsView: 3,
			executionResults: 4,
		}

		const workflowViewStyle = {
			flex: viewSize.workflowView, 
			marginLeft: "10px", 
			marginRight: "10px", 
		}

		if (viewSize.workflowView === 0) {
			workflowViewStyle.display = "none"
		}

		const workflowButtons = 
			<span>
				{/*workflows.length > 0 ?
					<Tooltip color="primary" title={"Create new workflow"} placement="top">
						<Button color="primary" style={{}} variant="text" onClick={() => setModalOpen(true)}><AddIcon /></Button> 				
					</Tooltip>
				: null*/}
				{view === "list" && (
					<Tooltip color="primary" title={"Grid View"} placement="top">
						<Button color="primary" variant="text" onClick={() => {
							localStorage.setItem('view', "grid");
							setView("grid")
						}}><GridOnIcon /></Button>
					</Tooltip>
				)}
				{view === "grid" && (
					<Tooltip color="primary" title={"List View"} placement="top">
						<Button color="primary" variant="text" onClick={() => {
							localStorage.setItem('view', "list");
							setView("list")
						}}><ListIcon /></Button>
					</Tooltip>
				)}
				<Tooltip color="primary" title={"Import workflows"} placement="top">
					{importLoading ? 
						<Button color="primary" style={{}} variant="text" onClick={() => {}}>
							<CircularProgress style={{maxHeight: 15, maxWidth: 15,}} />
						</Button> 				
						: 
						<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
							<PublishIcon />
						</Button> 				
					}
				</Tooltip>
				<input hidden type="file" multiple="multiple" ref={(ref) => upload = ref} onChange={importFiles} />
				{workflows.length > 0 ? 
					<Tooltip color="primary" title={`Download ALL workflows (${workflows.length})`} placement="top">
						<Button color="primary" style={{}} variant="text" onClick={() => {
							exportAllWorkflows()
						}}>
							<GetAppIcon />
						</Button> 				
					</Tooltip>
				: null}
				{isCloud ? null :
				<Tooltip color="primary" title={"Download workflows"} placement="top">
					<Button color="primary" style={{}} variant="text" onClick={() => setLoadWorkflowsModalOpen(true)}>
						<CloudDownloadIcon />
					</Button> 				
				</Tooltip>
				}
			</span>

		const WorkflowView = () => {
			if (workflows.length === 0) {
				return (
					<div style={emptyWorkflowStyle}>	
						<Paper style={boxStyle}>
							<div>
								<h2>Welcome to Shuffle</h2>
							</div>
							<div>
								<p>
									<b>Shuffle</b> is a flexible, easy to use, automation platform allowing users to integrate their services and devices freely. It's made to significantly reduce the amount of manual labor, and is focused on security applications. <a href="/docs/about" style={{textDecoration: "none", color: "#f85a3e"}}>Click here to learn more.</a>
								</p>
							</div>
							<div>
								If you want to jump straight into it, click here to create your first workflow: 
							</div>
							<div style={{display: "flex"}}>
								<Button color="primary" style={{marginTop: "20px",}} variant="outlined" onClick={() => setModalOpen(true)}>New workflow</Button> 				
								<span style={{paddingTop: 20, display: "flex",}}>
									<Typography style={{marginTop: 5, marginLeft: 30, marginRight: 15}}>
										..OR
									</Typography>
									{workflowButtons}
								</span>
							</div>
						</Paper>
					</div>
				)
			}

		return (
			<div style={viewStyle}>	
				<div style={workflowViewStyle}>
					<div style={{display: "flex"}}>
						<div style={{flex: 3}}>
							<h2>Workflows</h2>
						</div>
					</div>

					{/*
					<div style={flexContainerStyle}>
						<div style={{...flexBoxStyle, ...activeWorkflowStyle}}>
							<div style={flexContentStyle}>
								<div ><img src={mobileImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>ACTIVE WORKFLOWS</div>
								</div>
							</div>
						</div>
						<div style={{...flexBoxStyle, ...availableWorkflowStyle}}>
							<div style={flexContentStyle}>
								<div><img src={bookImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>AVAILABE WORKFLOWS</div>
								</div>
							</div>
						</div>
						<div style={{...flexBoxStyle, ...notificationStyle}}>
							<div style={flexContentStyle}>
								<div><img src={bagImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>NOTIFICATIONS</div>
								</div>
							</div>
						</div>
					</div>
					*/}

					{/*
					chipRenderer={({ value, isFocused, isDisabled, handleClick, handleRequestDelete }, key) => {
						console.log("VALUE: ", value)

						return (
							<Chip
								key={key}
								style={chipStyle}

							>
								{value}
							</Chip>
						)
					}}
					*/}
					<div style={{display: "flex", margin: "0px 0px 20px 0px"}}>
						<div style={{flex: 1}}>
							<Typography style={{marginTop: 7, marginBottom: "auto"}}>
								<a rel="norefferer" target="_blank" href="https://shuffler.io/docs/workflows" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>Learn more about Workflows</a>
							</Typography>
						</div>
						<div style={{flex: 1, float: "right",}}>
							<ChipInput
								style={{}}
								InputProps={{
									style:{
										color: "white",
										//backgroundColor: inputColor,
									},
								}}
								placeholder="Add Filter"
								color="primary"
								fullWidth
								value={filters}
								onAdd={(chip) => {
									addFilter(chip)
								}}
								onDelete={(chip, index) => {
									removeFilter(index)
								}}
							/>
						</div>
						<div style={{float: "right", flex: 1, textAlign: "right",}}>
							{workflowButtons}
						</div>
					</div>
					<div style={{marginTop: 15,}} />
					{view === "grid" ?
						<Grid container spacing={4} style={paperAppContainer}>
							<NewWorkflowPaper />
							{filteredWorkflows.map((data, index) => {
								return (
									<WorkflowPaper key={index} data={data} />
								)
							})}
						</Grid>
						:
						<WorkflowListView />
					}

					<div style={{marginBottom: 100}}/>
				</div>
			</div>
		)
	}

	const importWorkflowsFromUrl = (url) => {
		console.log("IMPORT WORKFLOWS FROM ", downloadUrl)

		const parsedData = {
			"url": url,
			"field_3": downloadBranch || 'master'
		}

		if (field1.length > 0) {
			parsedData["field_1"] = field1
		}

		if (field2.length > 0) {
			parsedData["field_2"] = field2
		}

		alert.success("Getting specific workflows from your URL.")
		var cors = "cors"
		fetch(globalUrl+"/api/v1/workflows/download_remote", {
    	method: "POST",
			mode: "cors",
			headers: {
				'Accept': 'application/json',
			},
			body: JSON.stringify(parsedData),
	  	credentials: "include",
		})
		.then((response) => {
			if (response.status === 200) {
				alert.success("Successfully loaded workflows from "+downloadUrl)
				setTimeout(() => {
					getAvailableWorkflows()
				}, 1000)
			}

			return response.json()
		})
    .then((responseJson) => {
				//console.log("DATA: ", responseJson)
				if (!responseJson.success) {
					if (responseJson.reason !== undefined) {
						alert.error("Failed loading: "+responseJson.reason)
					} else {
						alert.error("Failed loading")
					}
				}
		})
		.catch(error => {
			alert.error(error.toString())
		})
	}

	const handleGithubValidation = () => {
		importWorkflowsFromUrl(downloadUrl)
		setLoadWorkflowsModalOpen(false)
	}

	const workflowDownloadModalOpen = loadWorkflowsModalOpen ? 
		<Dialog 
			open={loadWorkflowsModalOpen}
			onClose={() => {
			}}
			PaperProps={{
				style: {
					backgroundColor: surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle>
				<div style={{color: "rgba(255,255,255,0.9)"}}>
					Load workflows from github repo
					<div style={{float: "right"}}>
						<Tooltip color="primary" title={"Import manually"} placement="top">
							<Button color="primary" style={{}} variant="text" onClick={() => upload.click()}>
								<PublishIcon />
							</Button> 				
						</Tooltip>
					</div>
				</div>
			</DialogTitle>
			<DialogContent style={{color: "rgba(255,255,255,0.65)"}}>
				Repository (supported: github, gitlab, bitbucket)
				<TextField
					style={{backgroundColor: inputColor}}
					variant="outlined"
					margin="normal"
					defaultValue={downloadUrl}
					InputProps={{
						style:{
							color: "white",
							height: "50px",
							fontSize: "1em",
						},
					}}
					onChange={e => setDownloadUrl(e.target.value)}
					placeholder="https://github.com/frikky/shuffle-apps"
					fullWidth
				/>

					<span style={{marginTop: 10}}>Branch (default value is "master"):</span>
					<div style={{display: "flex"}}>
						<TextField
							style={{backgroundColor: inputColor}}
							variant="outlined"
							margin="normal"
							defaultValue={downloadBranch}
							InputProps={{
								style:{
									color: "white",
									height: "50px",
									fontSize: "1em",
								},
							}}
							onChange={e => setDownloadBranch(e.target.value)}
							placeholder="master"
							fullWidth
							/>
					</div>

				<span style={{marginTop: 10}}>Authentication (optional - private repos etc):</span>
				<div style={{display: "flex"}}>
					<TextField
						style={{flex: 1, backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
						}}
						onChange={e => setField1(e.target.value)}
						type="username"
						placeholder="Username / APIkey (optional)"
						fullWidth
						/>
					<TextField
						style={{flex: 1, backgroundColor: inputColor}}
						variant="outlined"
						margin="normal"
						InputProps={{
							style:{
								color: "white",
								height: "50px",
								fontSize: "1em",
							},
						}}
						onChange={e => setField2(e.target.value)}
						type="password"
						placeholder="Password (optional)"
						fullWidth
						/>
				</div>
			</DialogContent>
			<DialogActions>
				<Button style={{borderRadius: "0px"}} onClick={() => setLoadWorkflowsModalOpen(false)} color="primary">
					Cancel
				</Button>
	      <Button style={{borderRadius: "0px"}} disabled={downloadUrl.length === 0 || !downloadUrl.includes("http")} onClick={() => {
					handleGithubValidation() 
				}} color="primary">
						Submit
					
	        Submit	
	      </Button>
			</DialogActions>
		</Dialog>
		: null

	const loadedCheck = isLoaded && isLoggedIn && workflowDone ? 
		<div>
			<Dropzone style={{maxWidth: window.innerWidth > 1366 ? 1366 : 1200, margin: "auto", padding: 20 }} onDrop={uploadFile}>
				<WorkflowView />
			</Dropzone>
			{modalView}
			{deleteModal}
			{exportVerifyModal}
			{publishModal} 
			{workflowDownloadModalOpen}
		</div>
		:
		<div style={{paddingTop: 250, width: 250, margin: "auto", textAlign: "center"}}>
			<CircularProgress />
			<Typography>
				Loading Workflows
			</Typography>
		</div>


	// Maybe use gridview or something, idk
	return (
		<div>
			{loadedCheck}
		</div>
	)
}

export default Workflows 
