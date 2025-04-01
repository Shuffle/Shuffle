// React & Core imports
import React, { useEffect, useContext, memo, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import ReactDOM from "react-dom"

// Material UI Icons
import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import GridOnIcon from '@mui/icons-material/GridOn';
import ListIcon from '@mui/icons-material/List';
import PublishIcon from '@mui/icons-material/Publish';
import GetAppIcon from '@mui/icons-material/GetApp';

// Material UI & Components
import { makeStyles } from "@mui/styles";
import { Navigate } from "react-router-dom";
import SecurityFramework from '../components/SecurityFramework.jsx';
import EditWorkflow from "../components/EditWorkflow.jsx"
import Priority from "../components/Priority.jsx";
import { Context } from "../context/ContextApi.jsx";
import { isMobile } from "react-device-detect"

// Material UI Components
import {
    Tab,
    InputAdornment,
    Tabs,
    Box,
    ButtonBase,
    Badge,
    Divider,
    Avatar,
    Drawer,
    Grid,
    InputLabel,
    Select,
    ListSubheader,
    Paper,
    Tooltip,
    Button,
    TextField,
    FormControl,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Typography,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Checkbox,
    LinearProgress,
    ListItemText,
    AvatarGroup,
    Zoom,
    Collapse,
    Skeleton,
} from "@mui/material";

// Material UI Icons
import {
    Close as CloseIcon,
    Compare as CompareIcon,
    Maximize as MaximizeIcon,
    Minimize as MinimizeIcon,
    AddCircle as AddCircleIcon,
    Toc as TocIcon,
    Send as SendIcon,
    Search as SearchIcon,
    FileCopy as FileCopyIcon,
    Delete as DeleteIcon,
    BubbleChart as BubbleChartIcon,
    Restore as RestoreIcon,
    Cached as CachedIcon,
    Apps as AppsIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    PlayArrow as PlayArrowIcon,
    Add as AddIcon,
    CloudUpload as CloudUploadIcon,
    CloudDownload as CloudDownloadIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    Done as DoneIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    ArrowLeft as ArrowLeftIcon,
    ArrowRight as ArrowRightIcon,
    Visibility as VisibilityIcon,
    EditNote as EditNoteIcon,
	ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";

// Additional Components
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Dropzone from "../components/Dropzone.jsx";

// Third Party Libraries
import { ToastContainer, toast } from "react-toastify"
import { MuiChipsInput } from "mui-chips-input";
import { v4 as uuidv4 } from "uuid";
import theme from "../theme.jsx";
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, connectHits, connectSearchBox, connectRefinementList } from 'react-instantsearch-dom';
import { debounce } from "lodash";
import { removeQuery } from "../components/ScrollToTop.jsx";

import {green, yellow, red, grey } from "../views/AngularWorkflow.jsx"


const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240");

const svgSize = 24;
const imagesize = 22;

const useStyles = makeStyles(() => {

    return {
        datagrid: {
            border: 0,
            "& .MuiDataGrid-columnsContainer": {
                backgroundColor:
                    theme?.palette?.type === "light" ? "#fafafa" : theme?.palette?.inputColor,
            },
            "& .MuiDataGrid-iconSeparator": {
                display: "none",
            },
            "& .MuiDataGrid-colCell, .MuiDataGrid-cell": {
                borderRight: `1px solid ${theme?.palette?.type === "light" ? "white" : "#303030"
                    }`,
            },
            "& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell": {
                borderBottom: `1px solid ${theme?.palette?.type === "light" ? "#f0f0f0" : "#303030"
                    }`,
            },
            "& .MuiDataGrid-cell": {
                color:
                    theme?.palette?.type === "light" ? "white" : "rgba(255,255,255,0.65)",
            },
            "& .MuiPaginationItem-root, .MuiTablePagination-actions, .MuiTablePagination-caption":
            {
                borderRadius: 0,
                color: "white",
            },
        },
    }
})





// Takes an action in Shuffle and
// Returns information about the icon, the color etc to be used
// This can be used for actions of all types
export const GetIconInfo = (action) => {
    // Finds the icon based on the action. Should be verbs.
    const iconList = [
        { key: "cases", values: ["cases"] },
        { key: "cache_add", values: ["set_cache"] },
        { key: "cache_get", values: ["get_cache"] },
        { key: "filter", values: ["filter"] },
        { key: "merge", values: ["join", "merge", "route", "router"] },
        {
            key: "search",
            values: ["search", "find", "locate", "index", "analyze", "anal", "match", "check cache", "check", "verify", "validate"],
        },
        { key: "list", values: ["list", "head", "options"] },
        {
            key: "download",
            values: [
                "capture",
                "get",
                "download",
                "return",
                "hello_world",
                "curl",
                "request",
                "export",
                "preview",
            ],
        },
        { key: "add", values: ["add", "accept",] },
        { key: "delete", values: ["delete", "remove", "clear", "clean", "dismiss",] },
        {
            key: "send",
            values: [
                "send",
                "dispatch",
                "mail",
                "forward",
                "post",
                "submit",
                "mark",
                "set",
                "release",
            ],
        },
        {
            key: "repeat",
            values: ["repeat", "retry", "pause", "skip", "copy", "replicat", "demo",],
        },
        { key: "execute", values: ["execute", "run", "play", "raise"] },
        { key: "extract", values: ["extract", "unpack", "decompress", "open"] },
        { key: "inflate", values: ["inflate", "pack", "compress"] },
        {
            key: "edit",
            values: [
                "modify",
                "update",
                "create",
                "edit",
                "put",
                "patch",
                "change",
                "replace",
                "conver",
                "map",
                "format",
                "escape",
                "describe",
            ],
        },
        {
            key: "compare",
            values: ["compare", "convert", "to", "filter", "translate", "parse"],
        },
        { key: "close", values: ["close", "stop", "cancel", "block"] },
        { key: "communication", values: ["communication", "comms", "email", "mail",] },
    ];

    var selectedKey = ""
    if (action.app_name == "Integration Framework") {
        selectedKey = "magic"
    } else if (action.name === undefined || action.name === null) {
    } else {
        const actionname = action.name.toLowerCase()
        for (var key in iconList) {
            //console.log(iconList[key], actionname)
            const found = iconList[key].values.find((value) =>
                actionname.includes(value)
            )
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
    const defaultColor = "#f76b1c";
    const defaultGradient = ["#fad961", "#f76b1c"];
    const parsedIcons = {
        magic: {
            icon: "M7.5 5.6 10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.9959.9959 0 0 0-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41zm-1.03 5.49-2.12-2.12 2.44-2.44 2.12 2.12z",
            iconColor: "white",
            iconBackgroundColor: "red",
            originalIcon: "",
            fillGradient: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8A2BE2"],
        },
        communication: {
            icon: "M9.89516 7.71433H8.60945V5.1429H9.89516V7.71433ZM9.89516 10.2858H8.60945V9.00004H9.89516V10.2858ZM14.3952 2.57147H4.10944C3.76845 2.57147 3.44143 2.70693 3.20031 2.94805C2.95919 3.18917 2.82373 3.51619 2.82373 3.85719V15.4286L5.39516 12.8572H14.3952C14.7362 12.8572 15.0632 12.7217 15.3043 12.4806C15.5454 12.2395 15.6809 11.9125 15.6809 11.5715V3.85719C15.6809 3.14361 15.1023 2.57147 14.3952 2.57147Z",
            iconColor: "white",
            iconBackgroundColor: "#8acc3f",
            originalIcon: "",
            fillGradient: ["#8acc3f", "#459622"],
        },
        cases: {
            icon: "M15.6408 8.39233H18.0922V10.0287H15.6408V8.39233ZM0.115234 8.39233H2.56663V10.0287H0.115234V8.39233ZM9.92083 0.21051V2.66506H8.28656V0.21051H9.92083ZM3.31839 2.25596L5.05889 4.00687L3.89856 5.16051L2.15807 3.42596L3.31839 2.25596ZM13.1485 3.99869L14.8808 2.25596L16.0493 3.42596L14.3088 5.16051L13.1485 3.99869ZM9.10369 4.30142C10.404 4.30142 11.651 4.81863 12.5705 5.73926C13.4899 6.65989 14.0065 7.90854 14.0065 9.21051C14.0065 11.0269 13.0178 12.6141 11.5551 13.4651V14.9378C11.5551 15.1548 11.469 15.3629 11.3158 15.5163C11.1625 15.6698 10.9547 15.756 10.738 15.756H7.46943C7.25271 15.756 7.04487 15.6698 6.89163 15.5163C6.73839 15.3629 6.6523 15.1548 6.6523 14.9378V13.4651C5.18963 12.6141 4.2009 11.0269 4.2009 9.21051C4.2009 7.90854 4.71744 6.65989 5.63689 5.73926C6.55635 4.81863 7.80339 4.30142 9.10369 4.30142ZM10.738 16.5741V17.3923C10.738 17.6093 10.6519 17.8174 10.4986 17.9709C10.3454 18.1243 10.1375 18.2105 9.92083 18.2105H8.28656C8.06984 18.2105 7.862 18.1243 7.70876 17.9709C7.55552 17.8174 7.46943 17.6093 7.46943 17.3923V16.5741H10.738ZM8.28656 14.1196H9.92083V12.3769C11.3345 12.0169 12.3722 10.7323 12.3722 9.21051C12.3722 8.34253 12.0279 7.5101 11.4149 6.89634C10.8019 6.28259 9.97056 5.93778 9.10369 5.93778C8.23683 5.93778 7.40546 6.28259 6.79249 6.89634C6.17953 7.5101 5.83516 8.34253 5.83516 9.21051C5.83516 10.7323 6.87292 12.0169 8.28656 12.3769V14.1196Z",
            iconColor: "white",
            iconBackgroundColor: "#8acc3f",
            originalIcon: "",
            fillGradient: ["#8acc3f", "#459622"],
        },
        cache_add: {
            icon: "M11 3C6.58 3 3 4.79 3 7C3 9.21 6.58 11 11 11C15.42 11 19 9.21 19 7C19 4.79 15.42 3 11 3ZM3 9V12C3 14.21 6.58 16 11 16C15.42 16 19 14.21 19 12V9C19 11.21 15.42 13 11 13C6.58 13 3 11.21 3 9ZM3 14V17C3 19.21 6.58 21 11 21C12.41 21 13.79 20.81 15 20.46V17.46C13.79 17.81 12.41 18 11 18C6.58 18 3 16.21 3 14ZM20 14V17H17V19H20V22H22V19H25V17H22V14",
            iconColor: "white",
            iconBackgroundColor: "#8acc3f",
            originalIcon: "",
            fillGradient: ["#8acc3f", "#459622"],
        },
        cache_get: {
            icon: "M12 2C7.58 2 4 3.79 4 6C4 8.06 7.13 9.74 11.15 9.96C12.45 8.7 14.19 8 16 8C16.8 8 17.59 8.14 18.34 8.41C19.37 7.74 20 6.91 20 6C20 3.79 16.42 2 12 2ZM4 8V11C4 12.68 6.08 14.11 9 14.71C9.06 13.7 9.32 12.72 9.77 11.82C6.44 11.34 4 9.82 4 8ZM15.93 9.94C14.75 9.95 13.53 10.4 12.46 11.46C8.21 15.71 13.71 22.5 18.75 19.17L23.29 23.71L24.71 22.29L20.17 17.75C22.66 13.97 19.47 9.93 15.93 9.94ZM15.9 12C17.47 11.95 19 13.16 19 15C19 15.7956 18.6839 16.5587 18.1213 17.1213C17.5587 17.6839 16.7956 18 16 18C13.33 18 12 14.77 13.88 12.88C14.47 12.29 15.19 12 15.9 12ZM4 13V16C4 18.05 7.09 19.72 11.06 19.95C10.17 19.07 9.54 17.95 9.22 16.74C6.18 16.17 4 14.72 4 13Z",
            iconColor: "white",
            iconBackgroundColor: "#8acc3f",
            originalIcon: "",
            fillGradient: ["#8acc3f", "#459622"],
        },
        repeat: {
            icon: "M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <CachedIcon />,
        },
        add: {
            icon: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <AddIcon />,
        },
        edit: {
            icon: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <EditIcon />,
        },
        filter: {
            icon: "M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z",
            iconColor: "white",
            iconBackgroundColor: "#f5515f",
            originalIcon: "",
            fillGradient: ["#f5515f", "#a1051d"],
        },
        merge: {
            icon: "M17 20.41 18.41 19 15 15.59 13.59 17 17 20.41zM7.5 8H11v5.59L5.59 19 7 20.41l6-6V8h3.5L12 3.5 7.5 8z",
            iconColor: "white",
            iconBackgroundColor: "#f5515f",
            originalIcon: "",
            fillGradient: ["#f5515f", "#a1051d"],
        },
        compare: {
            icon: "M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 15H5l5-6v6zm9-15h-5v2h5v13l-5-6v9h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <CompareIcon />,
        },
        extract: {
            icon: "M3 3h18v2H3z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <MaximizeIcon />,
        },
        inflate: {
            icon: "M6 19h12v2H6z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <MinimizeIcon />,
        },
        list: {
            icon: "M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <TocIcon />,
        },
        execute: {
            icon: "M8 5v14l11-7z",
            iconColor: "white",
            iconBackgroundColor: defaultColor,
            originalIcon: <PlayArrowIcon />,
        },
        delete: {
            icon: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
            iconColor: "white",
            iconBackgroundColor: "#03030e",
            originalIcon: <DeleteIcon />,
            fillGradient: ["#03030e", "#205d66"],
        },
        close: {
            icon: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
            iconColor: "white",
            iconBackgroundColor: "#03030e",
            originalIcon: <CloseIcon />,
            fillGradient: ["#03030e", "#205d66"],
        },
        send: {
            icon: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
            iconColor: "white",
            iconBackgroundColor: "#0373da",
            originalIcon: <SendIcon />,
            fillGradient: ["#0bc8bf", "#0373da"],
        },
        download: {
            icon: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
            iconColor: "white",
            iconBackgroundColor: "#0373da",
            originalIcon: <GetAppIcon />,
            fillGradient: ["#0bc8bf", "#0373da"],
        },
        search: {
            icon: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
            iconColor: "white",
            iconBackgroundColor: "green",
            originalIcon: <SearchIcon />,
        },
    };

    var selectedItem = parsedIcons[selectedKey];
    if (selectedItem === undefined || selectedItem === null) {
        return {
            icon: "",
            iconColor: "",
            iconBackground: "black",
            originalIcon: "",
        };
    }

    if (selectedItem.fillGradient === undefined) {
        selectedItem.fillGradient = defaultGradient;
        selectedItem.iconBackgroundColor = defaultColor;
    }

    if (selectedItem.icon === "" || selectedItem.icon === undefined) {
        console.log(
            `MISSING PATH FOR ${selectedKey} (find in scope): `,
            selectedItem.originalIcon.type.type
        );
    }

    if (
        (selectedItem.originalIcon === undefined ||
            selectedItem.originalIcon === "") &&
        selectedItem.icon !== "" &&
        selectedItem.icon !== undefined
    ) {
        const svg_pin = (
            <svg
                width={svgSize}
                height={svgSize}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d={selectedItem.icon} fill={selectedItem.iconColor}></path>
            </svg>
        );
        selectedItem.originalIcon = svg_pin;
    }

    return selectedItem;
};

const chipStyle = {
    backgroundColor: "#2F2F2F",
    marginRight: 5,
    paddingLeft: 5,
    paddingRight: 5,
    height: 35,
    cursor: "pointer",
    borderColor: "#2F2F2F",
    color: "#C8C8C8",
    fontSize: "14px",
    fontFamily: theme?.typography?.fontFamily,
    borderRadius: "17.5px"
};

export const collapseField = (field) => {
    if (field === undefined || field === null) {
        return true
    }

    if (field.name === "headers" || field.name === "cookies") {
        return true
    }

    if (field.type === "array") {
        return true
    }

    // If more than 10 keys in object, collapse
    if (field.type === "object") {
        if (Object.keys(field.src).length > 7) {
            return true
        }
    }

    return false
}

export const validateJson = (showResult) => {
    if (showResult === undefined || showResult === null) {
        return {
            valid: false,
            result: "",
        }
    }

    if (typeof showResult === 'string') {
        showResult = showResult.split(" False").join(" false")
        showResult = showResult.split(" True").join(" true")

        showResult.replaceAll("False,", "false,")
        showResult.replaceAll("True,", "true,")
    }

    if (typeof showResult === "object" || typeof showResult === "array") {
        return {
            valid: true,
            result: showResult,
        }
    }

    if (showResult[0] === "\"") {
        return {
            valid: false,
            result: showResult,
        }
    }

    var jsonvalid = true
    try {
        if (!showResult.includes("{") && !showResult.includes("[")) {
            jsonvalid = false

            return {
                valid: jsonvalid,
                result: showResult,
            };
        }
    } catch (e) {

        try {
            showResult = showResult.split("'").join('"');
            if (!showResult.includes("{") && !showResult.includes("[")) {
                jsonvalid = false;
            }
        } catch (e) {

            jsonvalid = false;
        }
    }

    var result = showResult;
    try {
        result = jsonvalid ? JSON.parse(showResult, { "storeAsString": true }) : showResult;
    } catch (e) {
        ////console.log("Failed parsing JSON even though its valid: ", e)
        jsonvalid = false;
    }

    if (jsonvalid === false) {

        if (typeof showResult === 'string') {
            showResult = showResult.trim()
        }

        try {
            var newstr = showResult.replaceAll("'", '"')

            // Basic workarounds for issues with Python Dicts -> JSON
            if (newstr.includes(": None")) {
                newstr = newstr.replaceAll(": None", ': null')
            }

            if (newstr.includes("[\"{") && newstr.includes("}\"]")) {
                newstr = newstr.replaceAll("[\"{", '[{')
                newstr = newstr.replaceAll("}\"]", '}]')
            }

            if (newstr.includes("{\"[") && newstr.includes("]\"}")) {
                newstr = newstr.replaceAll("{\"[", '[{')
                newstr = newstr.replaceAll("]\"}", '}]')
            }

            result = JSON.parse(newstr)
            jsonvalid = true
        } catch (e) {

            //console.log("Failed parsing JSON even though its valid (2): ", e)
            jsonvalid = false
        }
    }

    if (jsonvalid && typeof result === "number") {
        jsonvalid = false
    }

    // This is where we start recursing
    if (jsonvalid) {
        // Check fields if they can be parsed too 
        try {
            for (const [key, value] of Object.entries(result)) {
                if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
                    //console.log("CHECKING STRING: ", value)

                    const inside_result = validateJson(value)
                    if (inside_result.valid) {
                        //console.log("INSIDE RESULT: ", inside_result.result)

                        if (typeof inside_result.result === "string") {
                            const newres = JSON.parse(inside_result.result)

                            result[key] = newres
                        } else {
                            result[key] = inside_result.result
                        }
                    }
                } else {

                    // Usually only reaches here if raw array > dict > value
                    if (typeof showResult !== "array") {
                        for (const [subkey, subvalue] of Object.entries(value)) {
                            if (typeof subvalue === "string" && (subvalue.startsWith("{") || subvalue.startsWith("["))) {
                                const inside_result = validateJson(subvalue)
                                if (inside_result.valid) {
                                    if (typeof inside_result.result === "string") {
                                        const newres = JSON.parse(inside_result.result)
                                        result[key][subkey] = newres
                                    } else {
                                        result[key][subkey] = inside_result.result
                                    }
                                }
                            }

                        }
                    }
                }
            }
        } catch (e) {
            //console.log("Failed parsing inside json subvalues: ", e)
        }
    }

    return {
        valid: jsonvalid,
        result: result,
    };
};

//Custom hook for handling styling of the dropzone
const useDropzoneStyles = () => {
    const { leftSideBarOpenByClick } = useContext(Context);

    return {
        paddingTop: 70,
        // minHeight: 1000,
        backgroundColor: "#1A1A1A",
        fontFamily: theme?.typography?.fontFamily,
        // maxWidth: window.innerWidth > 1366 ? 1366 : isMobile ? "100%" : 1200,
        paddingLeft: leftSideBarOpenByClick ? 200 : 0,
        transition: "padding-left 0.3s ease",
    };
};

//Wrapper for the dropzone component
const DropzoneWrapper = memo(({ onDrop, WorkflowView }) => {
    const dropzoneStyles = useDropzoneStyles();
    return (
        <Dropzone style={dropzoneStyles} onDrop={onDrop}>
            <WorkflowView />
        </Dropzone>
    );
});



const Workflows2 = (props) => {
    const { globalUrl, isLoggedIn, isLoaded, userdata, checkLogin } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const [currTab, setCurrTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState([]);
    const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
    const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
    const [isLoadingPublicWorkflow, setIsLoadingPublicWorkflow] = useState(false);
    const [view, setView] = useState(localStorage?.getItem("workflowView") || "grid");
    const classes = useStyles(theme)
    const imgSize = 60;

    const referenceUrl = globalUrl + "/api/v1/hooks/";

    var upload = "";

    const [workflows, setWorkflows] = React.useState([]);
    const [_, setUpdate] = React.useState(""); // Used for rendering, don't remove
    const [selectedUsecases, setSelectedUsecases] = React.useState([]);
    const [filteredWorkflows, setFilteredWorkflows] = React.useState([]);
    const [orgWorkflows, setOrgWorkflows] = React.useState([]);
    const [myWorkflows, setMyWorkflows] = React.useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = React.useState({});
    const [workflowDone, setWorkflowDone] = React.useState(false);
    const [selectedWorkflowId, setSelectedWorkflowId] = React.useState("");

    const [field1, setField1] = React.useState("");
    const [field2, setField2] = React.useState("");
    const [downloadUrl, setDownloadUrl] = React.useState("https://github.com/shuffle/workflows")
    const [downloadBranch, setDownloadBranch] = React.useState("master");
    const [loadWorkflowsModalOpen, setLoadWorkflowsModalOpen] =
        React.useState(false);
    const [exportModalOpen, setExportModalOpen] = React.useState(false);
    const [exportData, setExportData] = React.useState("");
    const [dialogModalOpen, setDialogModalOpen] = React.useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(true);
    const [newWorkflowName, setNewWorkflowName] = React.useState("");
    const [newWorkflowDescription, setNewWorkflowDescription] =
        React.useState("");
    const [newWorkflowTags, setNewWorkflowTags] = React.useState([]);

    const [defaultReturnValue, setDefaultReturnValue] = React.useState("");
    const [blogpost, setBlogpost] = React.useState("");
    const [status, setStatus] = React.useState("test");

    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [publishModalOpen, setPublishModalOpen] = React.useState(false);
    const [editingWorkflow, setEditingWorkflow] = React.useState({});
    const [isDropzone, setIsDropzone] = React.useState(false);
    const [filters, setFilters] = React.useState([]);
    const [submitLoading, setSubmitLoading] = React.useState(false);
    const [actionImageList, setActionImageList] = React.useState([{ "large_image": "" }])

    const [firstLoad, setFirstLoad] = React.useState(true);
    const [showMoreClicked, setShowMoreClicked] = React.useState(false);
    const [usecases, setUsecases] = React.useState([]);
    const [allUsecases, setAllUsecases] = React.useState({
        "success": false,
    });
    const [appFramework, setAppFramework] = React.useState({});
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [videoViewOpen, setVideoViewOpen] = React.useState(false)
    const [gettingStartedItems, setGettingStartedItems] = React.useState([])
    const [selectedWorkflowIndexes, setSelectedWorkflowIndexes] = React.useState([])
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(100);
    const [highlightIds, setHighlightIds] = React.useState([])

    const [apps, setApps] = React.useState([]);

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    document.title = "Shuffle - Workflows";

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tabParam = queryParams.get('tab');
        if (tabParam !== null && tabParam !== undefined) {
            if (tabParam === 'org_workflows' && currTab !== 0) {
                setCurrTab(0);
            } else if (tabParam === 'my_workflows' && currTab !== 1) {
                setCurrTab(1);
            } else if (tabParam === 'all_workflows' && currTab !== 2) {
                setCurrTab(2);
            }
        }
    }, [location.search]);

    const handleTabChange = (event, newValue) => {
        setCurrTab(newValue);
        // Update URL query params based on tab index
        const tabMapping = {
            0: 'org_workflows',
            1: 'my_workflows',
            2: 'all_workflows'
        };
        const queryParams = new URLSearchParams(location.search);
        queryParams.set('tab', tabMapping[newValue]);


        navigate(`${location.pathname}?${queryParams.toString()}`);
    };




    const handleCreateWorkflow = () => {
        setModalOpen(true)
        setIsEditing(false)
        setNewWorkflowName("")
        setNewWorkflowDescription("")
        setDefaultReturnValue("")
        setEditingWorkflow({})
        setNewWorkflowTags([])
        setSelectedUsecases([])

    };


    const drawerWidth = drawerOpen ? 325 : 0

    const sidebarKey = "getting_started_sidebar"
    if (isLoggedIn === true && gettingStartedItems.length === 0 && (userdata.tutorials !== undefined && userdata.tutorials !== null && userdata.tutorials.length > 0) && workflowDone === true) {

        const activeFiltered = userdata.tutorials.filter((item) => item.active === true)
        if (activeFiltered.length > 0) {
            var newfiltered = []
            for (var key in activeFiltered) {
                if (activeFiltered[key].name === "Discover Usecases") {
                    if (workflows.length > 1) {
                        activeFiltered[key].done = true
                        activeFiltered[key].description = `${workflows.length} workflows created`
                    }
                }

                newfiltered.push(activeFiltered[key])
            }
            setGettingStartedItems(activeFiltered)

            /*
                const sidebar = localStorage.getItem(sidebarKey)
            if (sidebar === null || sidebar === undefined) {
              console.log("No sidebar defined")
                
              localStorage.setItem(sidebarKey, "open");
              setDrawerOpen(true)
            } else {
                if (sidebar === "open") {
                    setDrawerOpen(true)
                } else {
                    setDrawerOpen(false)
                }
            }
            */
        }

    }

    //const isCloud =
    //    window.location.host === "localhost:3002" ||
    //    window.location.host === "shuffler.io";
	const isCloud = false

    const findWorkflow = (filters) => {
        console.log("Using filters: ", filters)
        if (filters.length === 0) {
            setFilteredWorkflows(workflows);
            handleKeysetting(allUsecases, workflows)
            return;
        }

        var newWorkflows = [];
        for (var workflowKey in workflows) {
            const curWorkflow = workflows[workflowKey];

            var found = [false];
            if (curWorkflow.tags === undefined || curWorkflow.tags === null) {
                found = filters.map((filter) =>
                    curWorkflow.name.toLowerCase().includes(filter)
                );
            }

            if (curWorkflow.tags !== undefined && curWorkflow.tags !== null && curWorkflow.tags.length > 0) {
                // Make them all lowercase
                curWorkflow.tags = curWorkflow.tags.map((tag) => tag.toLowerCase())
            }


            if (found.every((v) => v !== true)) {
                found = filters.map((filter) => {
                    if (filter === undefined || filter === null) {
                        return false;
                    }

                    const newfilter = filter.toLowerCase();

                    if (curWorkflow.name.toLowerCase().includes(filter.toLowerCase())) {
                        return true;
                    } else if (curWorkflow.tags !== undefined && curWorkflow.tags !== null && curWorkflow.tags.includes(filter.toLowerCase())) {
                        return true;
                    } else if (curWorkflow.owner === filter) {
                        return true;
                    } else if (curWorkflow.org_id === filter) {
                        return true;
                    } else if (curWorkflow.usecase_ids !== undefined && curWorkflow.usecase_ids !== null && curWorkflow.usecase_ids.length > 0) {
                        // Check if the usecase is the right category
                        for (var key in usecases) {
                            if (usecases[key].name.toLowerCase() !== newfilter) {
                                continue
                            }

                            for (var subkey in usecases[key].list) {
                                if (curWorkflow.usecase_ids.includes(usecases[key].list[subkey].name)) {
                                    return true
                                }
                            }
                        }
                    } else if (
                        curWorkflow.actions !== null &&
                        curWorkflow.actions !== undefined
                    ) {
                        for (var key in curWorkflow.actions) {
                            const action = curWorkflow.actions[key];

                            if (
                                action.app_name.toLowerCase() === newfilter ||
                                action.app_name.toLowerCase().includes(newfilter)
                            ) {
                                return true;
                            }
                        }
                    }

                    return false;
                });
            }

            if (found.every((v) => v === true)) {
                newWorkflows.push(curWorkflow);
                continue;
            }
        }

        console.log("Changing workflow filter, and finding new usecase mappings!")
        if (newWorkflows.length !== workflows.length) {
            handleKeysetting(allUsecases, newWorkflows)

            setFilteredWorkflows(newWorkflows);
        }
    };

    const getApps = () => {
        try {
            const appstorage = localStorage.getItem("apps")
            const privateapps = JSON.parse(appstorage)
            setApps(privateapps)
        } catch (e) {
            //console.log("Failed to get apps from localstorage: ", e)
        }

        fetch(`${globalUrl}/api/v1/apps`, {
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
                }

                return response.json();
            })
            .then((responseJson) => {
                setApps(responseJson);
            })
            .catch((error) => {
                console.log("App loading error: " + error.toString());
            });
    }

    const addFilter = (data) => {
        if (data === null || data === undefined) {
            console.log("No filter data")
            return;
        }

        if (data.includes("<") && data.includes(">")) {
            console.log("Filter includes < or >")
            return;
        }

        if (filters.includes(data) || filters.includes(data.toLowerCase())) {
            console.log("Filter already has the data")
            return;
        }

        filters.push(data.toLowerCase());
        setFilters(filters);

        findWorkflow(filters);
    };

    const removeFilter = (index) => {
        var newfilters = filters;

        if (index < 0) {
            console.log("Can't handle index (remove): ", index);
            return;
        }

        newfilters.splice(index, 1);

        if (newfilters.length === 0) {
            newfilters = [];
            setFilters(newfilters);
        } else {
            setFilters(newfilters);
        }

        findWorkflow(newfilters);
    };

    const exportVerifyModal = exportModalOpen ? (
        <Dialog
            open={exportModalOpen}
            onClose={() => {
                setExportModalOpen(false);
                setSelectedWorkflow({});
            }}
            PaperProps={{
                style: {
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    minWidth: 500,
                    padding: 30,
                },
            }}
        >
            <DialogTitle style={{ marginBottom: 0 }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
                    Want to auto-sanitize this workflow before exporting?
                </div>
            </DialogTitle>
            <DialogContent
                style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
            >
                <Typography variant="body1" style={{}}>
                    This will make potentially sensitive fields such as username,
                    password, url etc. empty
                </Typography>
                <Button
                    variant="contained"
                    style={{ marginTop: 20 }}
                    onClick={() => {
                        setExportModalOpen(false);
                        exportWorkflow(exportData, true);
                        setExportData("");
                    }}
                    color="primary"
                >
                    Yes
                </Button>
                <Button
                    style={{ marginTop: 20 }}
                    onClick={() => {
                        setExportModalOpen(false);
                        exportWorkflow(exportData, false);
                        setExportData("");
                    }}
                    color="primary"
                >
                    No
                </Button>
            </DialogContent>
        </Dialog>
    ) : null;

    const publishModal = publishModalOpen ? (
        <Dialog
            open={publishModalOpen}
            onClose={() => {
                setPublishModalOpen(false);
                setSelectedWorkflow({});
            }}
            PaperProps={{
                style: {
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    minWidth: 500,
                    padding: 50,
                },
            }}
        >
            <DialogTitle style={{ marginBottom: 0 }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
                    Are you sure you want to PUBLISH this workflow?
                </div>
            </DialogTitle>
            <DialogContent
                style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
            >
                <div>
                    <Typography variant="body1" style={{ marginBottom: 20 }}>
                        Before publishing, we will sanitize all inputs, remove references to
                        you, randomize ID's and remove your authentication.
                    </Typography>
                    <Typography variant="body1" style={{ marginBottom: 20 }}>
                        The published workflow is yours, and you can always change your public workflows after they are released.
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    style={{}}
                    onClick={() => {
                        publishWorkflow(selectedWorkflow);
                        setPublishModalOpen(false);
                    }}
                    color="primary"
                >
                    Yes
                </Button>
                <Button
                    style={{}}
                    onClick={() => {
                        setPublishModalOpen(false);
                    }}
                    color="primary"
                >
                    No
                </Button>
            </DialogContent>
        </Dialog>
    ) : null;

    const deleteModal = deleteModalOpen ? (
        <Dialog
            open={deleteModalOpen}
            onClose={() => {
                setDeleteModalOpen(false);
                setSelectedWorkflowId("");
            }}
            PaperProps={{
                style: {
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    minWidth: 500,
                    padding: 50,
                },
            }}
        >
            <DialogTitle>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
                    Are you sure you want to delete {selectedWorkflowId.length > 0 ? filteredWorkflows.find((w) => w.id === selectedWorkflowId)?.name : `${selectedWorkflowIndexes.length} workflow${selectedWorkflowIndexes.length === 1 ? '' : 's'}`}? <div />

                    Other workflows relying on {selectedWorkflowIndexes.length > 0 ? "them" : "it"} one will stop working
                </div>
            </DialogTitle>
            <DialogContent
                style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
            >
                <Button
                    style={{}}
                    onClick={() => {
                        if (selectedWorkflowId) {
                            deleteWorkflow(selectedWorkflowId)

                        } else if (selectedWorkflowIndexes.length > 0) {
                            // Do backwards so it doesn't change 
                            toast("Starting deletion of workflows. This might take a while.")
                            for (var i = selectedWorkflowIndexes.length - 1; i >= 0; i--) {
                                const workflow = filteredWorkflows[selectedWorkflowIndexes[i] - 1]
                                if (workflow !== undefined && workflow !== null && workflow.id !== undefined && workflow.id !== null) {
                                    deleteWorkflow(workflow.id, true)
                                }
                            }

							setTimeout(() => {
								getAvailableWorkflows()
							}, 5000)
                            setSelectedWorkflowIndexes([]);
                        }

                        setDeleteModalOpen(false)
                    }}
                    color="primary"
                >
                    Yes
                </Button>
                <Button
                    variant="outlined"
                    style={{}}
                    onClick={() => {
                        setDeleteModalOpen(false);
                    }}
                    color="primary"
                >
                    No
                </Button>
            </DialogContent>
        </Dialog>
    ) : null;

    const uploadFile = (e) => {
        const isDropzone =
            e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
        const files = isDropzone ? e.dataTransfer.files : e.target.files;

        const reader = new FileReader();
        toast("Starting upload. Please wait while we validate the workflows");

        try {
            reader.addEventListener("load", (e) => {
                var data = e.target.result;
                setIsDropzone(false);
                try {
                    data = JSON.parse(reader.result);
                } catch (e) {
                    toast("Invalid JSON: " + e);
                    return;
                }

                // Initialize the workflow itself
                setNewWorkflow(
                    data.name,
                    data.description,
                    data.tags,
                    data.default_return_value,
                    {},
                    false,
                    [],
                    "",
                    data.status,
                )
				.then((response) => {
					if (response !== undefined) {
						// SET THE FULL THING
						data.id = response.id;

						// Actually create it
						setNewWorkflow(
							data.name,
							data.description,
							data.tags,
							data.default_return_value,
							data,
							false,
							[],
							"",
							data.status
						).then((response) => {
							if (response !== undefined) {
								toast(`Successfully imported ${data.name}`);
							}
						});
					}
				})
				.catch((error) => {
					toast("Import error: " + error.toString());
				});
            });
        } catch (e) {
            console.log("Error in dropzone: ", e);
        }

        reader.readAsText(files[0]);
    };

    useEffect(() => {
        if (isDropzone) {
            setIsDropzone(false);
        }

    }, [isDropzone]);



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
                    setAppFramework({})
                    if (responseJson.reason !== undefined) {
                        //toast("Failed loading: " + responseJson.reason)
                    } else {
                        //toast("Failed to load framework for your org.")
                    }
                } else {
                    setAppFramework(responseJson)
                }
            })
            .catch((error) => {
                console.log("err in framework: ", error.toString());
            })
    }



    const getAvailableWorkflows = (amount) => {
        var storageWorkflows = []
        setIsLoadingWorkflow(true)
        try {
            const storagewf = localStorage.getItem("workflows")
            storageWorkflows = JSON.parse(storagewf)
            if (storageWorkflows === null || storageWorkflows === undefined || storageWorkflows.length === 0) {
                storageWorkflows = []
            } else {
                setWorkflows(storageWorkflows)
                setFilteredWorkflows(storageWorkflows)
                fetchUsecases(storageWorkflows)
                setWorkflowDone(true)
            }
        } catch (e) {
            //console.log("Failed to get workflows from localstorage: ", e)
        }

        var url = `${globalUrl}/api/v1/workflows`
        if (amount !== undefined && amount !== null) {
            url += `?top=${amount}`
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
                    console.log("Status not 200 for workflows :O!: ", response.status);

                    //if (isCloud) {
                    //  navigate("/search?tab=workflows")
                    //}

                    toast("Failed getting workflows. Are you logged in?");
                    return
                }

                return response.json();
            })
            .then((responseJson) => {
                if (responseJson !== undefined && responseJson !== null) {
					if (responseJson.success === false) {
					} else if (responseJson.length === 0) {
                        // When there are no workflows, we can set the loading to false
                        setIsLoadingWorkflow(false)
						if (currTab !== 2) {
							toast("No workflows found. Showing workflow discovery")
							setCurrTab(2)
						}
					}

                    var newarray = []
                    for (var wfkey in responseJson) {
                        const wf = responseJson[wfkey]
                        if (wf.public === true || wf.hidden === true) {
                            continue
                        }

                        newarray.push(wf)
                    }

                    var setProdFilter = false

                    var actionnamelist = [];
                    var parsedactionlist = [];
                    for (var key in newarray) {
                        const workflow = newarray[key]
                        //if (workflow.status === "production") {
                        //	setProdFilter = true 
                        //}

                        for (var actionkey in newarray[key].actions) {
                            const action = newarray[key].actions[actionkey];
                            //console.log("Action: ", action)
                            if (actionnamelist.includes(action.app_name)) {
                                continue;
                            }

                            actionnamelist.push(action.app_name);
                            parsedactionlist.push(action);
                        }
                    }

                    try {
                        localStorage.setItem("workflows", JSON.stringify(newarray))
                    } catch (e) {
                        console.log("Failed to set workflows in localstorage: ", e)
                    }

                    // Ensures the zooming happens only once per load
                    setTimeout(() => {
                        fetchUsecases(newarray)

                        setActionImageList(parsedactionlist);
                        if (setProdFilter === true) {
                            const newWorkflows = newarray.filter(workflow => workflow.status === "production")
                            if (newWorkflows !== undefined && newWorkflows !== null) {
                                setFilteredWorkflows(newWorkflows);
                            } else {
                                setFilteredWorkflows(newarray);
                            }

                            setFilters(["status:production"]);
                        } else {
                            setFilteredWorkflows(newarray)
                        }

                        setFirstLoad(false)
                    }, 250)

                    /*
                    setTimeout(() => {
                        var timeout = 0
                        for (var key in newarray) {
                            const wf = newarray[key]
                            if (wf.actions === undefined || wf.actions === null || wf.actions.length === 0) {
                                setTimeout(() => {
                                    sideloadWorkflow(wf.id, false)
                                }, timeout)
                                	
                                timeout += 1000 
                            }
        
                        }
                    }, 1000)
                    */

                } else {
                    if (isLoggedIn) {
                        toast("An error occurred while loading workflows");
                    }

                    return;
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    }

    const findMatches = (category, workflows) => {
        category.matches = []
        for (var subcategorykey in category.list) {
            var subcategory = category.list[subcategorykey]
            subcategory.matches = []

            for (var workflowkey in workflows) {
                const workflow = workflows[workflowkey]

                if (workflow.usecase_ids !== undefined && workflow.usecase_ids !== null) {
                    for (var usecasekey in workflow.usecase_ids) {

                        if (workflow.usecase_ids[usecasekey].toLowerCase() === subcategory.name.toLowerCase()) {
                            //console.log("Got match: ", workflow.usecase_ids[usecasekey])

                            category.matches.push({
                                "workflow": workflow.id,
                                "category": subcategory.name,
                            })
                            subcategory.matches.push(workflow.id)
                            break
                        }
                    }
                }

                if (subcategory.matches.length > 0) {
                    break
                }
            }
        }

        return category
    }

    const handleKeysetting = (categorydata, workflows) => {
        if (workflows !== undefined && workflows !== null) {
            var newcategories = []
            for (var key in categorydata) {
                var category = categorydata[key]
                // Check if category is bool
                if (typeof category === "boolean") {
                    continue
                }

                category = findMatches(category, workflows)
                newcategories.push(category)
            }

            setUsecases(newcategories)
        } else {
            setUsecases(categorydata)
        }
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
                setWorkflows(workflows);
                setWorkflowDone(true);

                if (responseJson.success !== false) {
                    setAllUsecases(responseJson);
                    handleKeysetting(responseJson, workflows)
                }
            })
            .catch((error) => {
                //toast("ERROR: " + error.toString());
                console.log("ERROR: " + error.toString());
                setWorkflows(workflows);
                setWorkflowDone(true);
            });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (workflows.length <= 0) {
            const tmpView = localStorage.getItem("view");
            if (tmpView !== undefined && tmpView !== null) {
                setView(tmpView);
            }

            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            const foundTab = params["top"];
            if (foundTab !== null && foundTab !== undefined) {
                // Check if it's a number
                if (isNaN(foundTab)) {
                    getAvailableWorkflows()
                } else {
                    getAvailableWorkflows(foundTab)
                }
            } else {
                getAvailableWorkflows()
            }

            getApps()
            getFramework()
        }
    }, [])

    const viewStyle = {
        color: "#ffffff",
        width: "100%",
        display: "flex",
        minWidth: isMobile ? "100%" : 1024,
        maxWidth: isMobile ? "100%" : 1024,
        margin: drawerWidth === 0 ? "auto" : `auto ${drawerWidth + 100} auto auto`,
        paddingBottom: 200,
    };

    const emptyWorkflowStyle = {
        paddingTop: "200px",
        width: 1024,
        margin: "auto",
    };

    const boxStyle = {
        padding: "20px 20px 20px 20px",
        width: "100%",
        height: "250px",
        color: "white",
        backgroundColor: theme.palette.surfaceColor,
        display: "flex",
        flexDirection: "column",
    };

    //flexDirection: !isMobile ? "column" : "row",
    const paperAppContainer = {
        //display: "flex",
        //flexWrap: "wrap",
        //alignContent: "space-between",
    };

    const paperAppStyle = {
        minHeight: 146,
        maxHeight: 146,
        overflow: "hidden",
        width: "100%",
        color: "white",
        display: "flex",
        fontFamily: theme?.typography?.fontFamily,
        boxSizing: "border-box",
        position: "relative",
        borderRadius: "8px",
        // backgroundColor: "#212121",
        padding: "15px 15px 0px 20px",
    };

    const gridContainer = {
        height: "auto",
        color: "white",
        margin: "10px",
        backgroundColor: "#212121",
        position: "relative",
    };

    const workflowActionStyle = {
        display: "flex",
        width: 160,
        height: 44,
        justifyContent: "space-between",
        fontFamily: theme?.typography?.fontFamily,
    };

    const exportAllWorkflows = (allWorkflows) => {
        for (var i = 0; i < allWorkflows.length; i++) {
            const wf = allWorkflows[i]

            if (wf === undefined || wf.id === undefined) {
                continue
            }

            console.log("Exporting workflow: ", wf)
            setTimeout(() => {
                exportWorkflow(JSON.parse(JSON.stringify(wf)), false)
            }, i * 100);
        }

        toast(`Exporting and keeping original for all ${allWorkflows.length} workflows`);
    }

    const deduplicateIds = (data, skip_sanitize) => {
        if (data.triggers !== null && data.triggers !== undefined) {
            for (var key in data.triggers) {
                const trigger = data.triggers[key];
                if (skip_sanitize !== true) {
                    if (trigger.app_name === "Shuffle Workflow") {
                        if (trigger.parameters !== null && trigger.parameters !== undefined) {
                            if (trigger.parameters.length > 2) {
                                trigger.parameters[2].value = "";
                            }
                        }
                    }
                }

                if (trigger.status === "running") {
                    trigger.status = "stopped";
                }

                const newId = uuidv4();
                if (trigger.trigger_type === "WEBHOOK") {
                    if (
                        trigger.parameters !== undefined &&
                        trigger.parameters !== null &&
                        trigger.parameters.length === 2
                    ) {
                        trigger.parameters[0].value =
                            referenceUrl + "webhook_" + trigger.id;
                        trigger.parameters[1].value = "webhook_" + trigger.id;
                    } else if (
                        trigger.parameters !== undefined &&
                        trigger.parameters !== null &&
                        trigger.parameters.length === 3
                    ) {
                        trigger.parameters[0].value =
                            referenceUrl + "webhook_" + trigger.id;
                        trigger.parameters[1].value = "webhook_" + trigger.id;
                        // FIXME: Add auth here?
                    } else {
                        toast("Something is wrong with the webhook in the copy");
                    }
                }

                for (var branchkey in data.branches) {
                    const branch = data.branches[branchkey];
                    if (branch.source_id === trigger.id) {
                        branch.source_id = newId;
                    }

                    if (branch.destination_id === trigger.id) {
                        branch.destination_id = newId;
                    }
                }

                trigger.environment = isCloud ? "cloud" : "Shuffle";
                trigger.id = newId;
            }
        }

        if (data.actions !== null && data.actions !== undefined && skip_sanitize !== true) {
            for (key in data.actions) {
                data.actions[key].authentication_id = "";

                for (var subkey in data.actions[key].parameters) {
                    const param = data.actions[key].parameters[subkey];

                    // Removed October 10th, 2022 as key usually isn't 
                    // containing anything secret, but rather necessary configurations.
                    // param.name.includes("key") ||
                    //
                    if (
                        param.name.includes("user") ||
                        param.name.includes("pass") ||
                        param.name.includes("api") ||
                        param.name.includes("auth") ||
                        param.name.includes("secret") ||
                        param.name.includes("domain") ||
                        param.name.includes("url") ||
                        param.name.includes("mail")
                    ) {
                        // FIXME: This may be a vuln if api-keys are generated that start with $
                        if (param.value.startsWith("$")) {
                            console.log("Skipping field, as it's referencing a variable");
                        } else {
                            param.value = "";
                            param.is_valid = false;
                        }
                    }
                }

                const newId = uuidv4();
                for (branchkey in data.branches) {
                    const branch = data.branches[branchkey];
                    if (branch.source_id === data.actions[key].id) {
                        branch.source_id = newId;
                    }

                    if (branch.destination_id === data.actions[key].id) {
                        branch.destination_id = newId;
                    }
                }

                if (data.actions[key].id === data.start) {
                    data.start = newId;
                }

                data.actions[key].environment = "";
                data.actions[key].id = newId;
            }
        }

        if (data.workflow_variables !== null && data.workflow_variables !== undefined && skip_sanitize !== true) {
            for (key in data.workflow_variables) {
                const param = data.workflow_variables[key];
                //param.name.includes("key") ||

                if (
                    param.name.includes("user") ||
                    param.name.includes("pass") ||
                    param.name.includes("api") ||
                    param.name.includes("auth") ||
                    param.name.includes("secret") ||
                    param.name.includes("email")
                ) {
                    param.value = "";
                    param.is_valid = false;
                }
            }
        }

        return data;
    };

    const sanitizeWorkflow = (data) => {
        data = JSON.parse(JSON.stringify(data));
        console.log("Sanitize start: ", data);
        data = deduplicateIds(data);

        console.log("Sanitize end: ", data);

        return data;
    };

    const exportWorkflow = (data, sanitize) => {
        try {
            data = JSON.parse(JSON.stringify(data));
        } catch (e) {
            console.log("Failed to parse JSON: ", e);
        }

        let exportFileDefaultName = data.name + ".json";

        data["owner"] = "";
        data["updated_by"] = "";
        data["org"] = [];
        data["org_id"] = "";
        data["execution_org"] = {};
        data["created"] = 0
        data["due_date"] = 0
        data["edited"] = 0

        data["validation"] = {};
        data["suborg_distribution"] = []
        data["parentorg_workflow"] = ""

        // These are backwards.. True = saved before. Very confuse.
        data["previously_saved"] = false;
        data["first_save"] = false;

        if (sanitize === true) {
            data = sanitizeWorkflow(data);

            if (data.subflows !== null && data.subflows !== undefined) {
                toast(
                    "Not exporting with subflows when sanitizing. Please manually export them."
                )

                data.subflows = []
            }

            //	for (var key in data.subflows) {
            //		if (data.sublof
            //	}
            //}
        }

        // Add correct ID's for triggers
        // Add mag

        data.status = "test"
        let dataStr = JSON.stringify(data);
        let dataUri =
            "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        let linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    };

    const publishWorkflow = (data) => {
        data = JSON.parse(JSON.stringify(data));
        data = sanitizeWorkflow(data);
        toast("Sanitizing and publishing " + data.name);

        // This ALWAYS talks to Shuffle cloud
        fetch(globalUrl + "/api/v1/workflows/" + data.id + "/publish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for workflow publish :O!");
                } else {
                    if (isCloud) {
                        toast("Successfully published workflow");
                    } else {
                        toast(
                            "Successfully published workflow to https://shuffler.io"
                        );
                    }
                }

                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.reason !== undefined) {
                    toast("Failed publishing: ", responseJson.reason);
                }

                getAvailableWorkflows();
            })
            .catch((error) => {
                toast("Failed publishing: is the workflow valid? Remember to save the workflow first.")
                console.log(error.toString());
            });
    };

    const duplicateWorkflow = (data) => {
        //data = JSON.parse(JSON.stringify(data));
        toast("Copying workflow '" + data.name + "'. The new workflow will load in and be highlighted.");
        //data.id = "";
        //data.name = data.name + "_copy";
        //data = deduplicateIds(data, true);

        const duplicateData = {
            name: data.name + "_copy",
        }

        fetch(`${globalUrl}/api/v1/workflows/${data.id}/duplicate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(duplicateData),
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
                        toast("Failed copying workflow: " + responseJson.reason)
                    } else {
                        toast("Failed copying workflow")
                    }

                    return
                }

                if (responseJson.id !== undefined) {
                    setHighlightIds([responseJson.id])
                }
                setTimeout(() => {
                    getAvailableWorkflows();
                }, 1000);
            })
            .catch((error) => {
                toast(error.toString());
            })
    }

    const setEditing = (data) => {
        ReactDOM.unstable_batchedUpdates(() => {
            setIsEditing(true)
            setModalOpen(true);
            setNewWorkflowName(data.name);
            setNewWorkflowDescription(data.description);
            setDefaultReturnValue(data.default_return_value);
            if (data.tags !== undefined && data.tags !== null) {
                setNewWorkflowTags(JSON.parse(JSON.stringify(data.tags)));
            }

            if (data.usecase_ids !== undefined && data.usecase_ids !== null && data.usecase_ids.length > 0) {
                setSelectedUsecases(data.usecase_ids)
            }

            setEditingWorkflow(JSON.parse(JSON.stringify(data)))
        })
    }

    const exportSingleWorkflow = (data, setOpen) => {
        setExportModalOpen(true)

        if (data.triggers !== null && data.triggers !== undefined) {
            var newSubflows = [];
            for (var key in data.triggers) {
                const trigger = data.triggers[key];

                if (
                    trigger.parameters !== null &&
                    trigger.parameters !== undefined
                ) {
                    for (var subkey in trigger.parameters) {
                        const param = trigger.parameters[subkey];
                        if (
                            param.name === "workflow" &&
                            param.value !== data.id &&
                            !newSubflows.includes(param.value)
                        ) {
                            newSubflows.push(param.value);
                        }
                    }
                }
            }

            var parsedworkflows = [];
            for (var key in newSubflows) {
				if (key === data.id) {
					continue
				}

                const foundWorkflow = workflows.find(
                    (workflow) => workflow.id === newSubflows[key]
                );
                if (foundWorkflow !== undefined && foundWorkflow !== null) {
                    parsedworkflows.push(foundWorkflow);
                }
            }

            if (parsedworkflows.length > 0) {
                console.log(
                    "Appending subflows during export: ",
                    parsedworkflows.length
                );
                data.subflows = parsedworkflows;
            }
        }

        setExportData(data)
        setOpen(false)
    }

    const sideloadWorkflow = (id, action, setOpen) => {

        const storagewf = localStorage.getItem("workflows")
        const storageWorkflows = JSON.parse(storagewf)
        if (storageWorkflows === null || storageWorkflows === undefined || storageWorkflows.length === 0) {
        } else {
            for (var i = 0; i < storageWorkflows.length; i++) {
                if (storageWorkflows[i].id === id) {
                    if (storageWorkflows[i].image !== "" && storageWorkflows[i].image !== undefined && storageWorkflows[i].image !== null) {

                        if (action === undefined || action === null || action === "") {
                            console.log("RETURNING")
                            return
                        }
                    }
                }
            }
        }

        fetch(globalUrl + "/api/v1/workflows/" + id, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                }

                return response.json()
            })
            .then((responseJson) => {
                if (responseJson.success !== false && responseJson.id !== undefined) {
                    if (action === "edit") {
                        setEditing(responseJson)
                    } else if (action === "publish") {
                        setPublishModalOpen(true)
                        setSelectedWorkflow(responseJson)
                    } else if (action === "export") {
                        exportSingleWorkflow(responseJson, setOpen)
                    }

                }

                for (var i = 0; i < storageWorkflows.length; i++) {
                    if (storageWorkflows[i].id === id) {
                        storageWorkflows[i] = responseJson
                        localStorage.setItem("workflows", JSON.stringify(storageWorkflows))
                        break
                    }
                }

                //setWorkflows(storageWorkflows)
                setFilteredWorkflows(storageWorkflows)
                //setUpdate(Math.random())
            })
            .catch((error) => {
                console.log(error.toString())
            })
    }

    const deleteWorkflow = (id, bulk) => {
        fetch(globalUrl + "/api/v1/workflows/" + id, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for setting workflows :O!");
		  
					if (bulk !== true) {
                    	toast("Failed deleting workflow. Do you have access?");
					}
                } else {
                    if (bulk !== true) {
                        toast(`Deleted workflow ${id}. Child Workflows in Suborgs were also removed.`)
                    }
                }

                return response.json();
            })
            .then(() => {
                if (bulk !== true) {
                    setTimeout(() => {
                        getAvailableWorkflows();
                    }, 1000);
                }
            })
            .catch((error) => {
                toast(error.toString());
            })
    }

    const handleChipClick = (e) => {
        addFilter(e.target.innerHTML);
    };

    const hasWorkflows = workflows === undefined || workflows === null || workflows.length === 0
    const getWorkflowAppgroup = (data) => {
        if (currTab !== 2) {
            if (data.actions === undefined || data.actions === null) {
                return []
            }

            var appsFound = []
            for (var key in data.actions) {
                const parsedAction = data.actions[key]
                if (parsedAction.large_image === undefined || parsedAction.large_image === null || parsedAction.large_image === "") {
                    continue
                }

                if (parsedAction.app_name === "Shuffle Tools" || parsedAction.app_id === "bc78f35c6c6351b07a09b7aed5d29652") {
                    continue
                }

                if (appsFound.findIndex(data => data.app_name === parsedAction.app_name) < 0) {
                    appsFound.push(parsedAction)
                }
            }
        } else {
            if (data.action_references === undefined || data.action_references === null) {
                return []
            }

            var appsFound = []
            for (var key in data.action_references) {
                const parsedAction = data.action_references[key]
                if (parsedAction.image_url === undefined || parsedAction.image_url === null || parsedAction.image_url === "") {
                    continue
                }

                // if (parsedAction.name === "Shuffle Tools" || parsedAction.id === "bc78f35c6c6351b07a09b7aed5d29652") {
                //     continue
                // }

                if (appsFound.findIndex(data => data.name === parsedAction.name) < 0) {
                    appsFound.push(parsedAction)
                }
            }
        }

        return appsFound
    }

    const WorkflowSkeleton = () => {
        return (
            <Paper elevation={0} style={{
                backgroundColor: "#212121",
                width: "100%",
                height: 120,
                borderRadius: 8,
            }}>
                <div style={{
                    display: "flex",
                    padding: 10,
                    width: "100%",
                    height: "100%"
                }}>
                    <Skeleton
                        variant="rectangular"
                        width={100}
                        height={90}
                        style={{
                            borderRadius: 6,
                            backgroundColor: "rgba(255, 255, 255, 0.1)"
                        }}
                    />
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        marginLeft: 10,
                        flex: 1,
                        gap: 6
                    }}>
                        <Skeleton
                            variant="text"
                            width="40%"
                            height={24}
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        />
                        <Skeleton
                            variant="text"
                            width="60%"
                            height={20}
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        />
                        <Skeleton
                            variant="text"
                            width="30%"
                            height={20}
                            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        />
                    </div>
                </div>
            </Paper>
        );
    };

    const LoadingWorkflowGrid = () => {
        return (
            <div style={{
                marginTop: 16,
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
                gap: "20px",
                justifyContent: "space-between",
                alignItems: "start",
                padding: "0 10px"
            }}>
                {[...Array(7)].map((_, index) => (
                    <WorkflowSkeleton key={index} />
                ))}
            </div>
        );
    };

    const WorkflowPaper = (props) => {
        const { data, type = "org" } = props;
        const [open, setOpen] = React.useState(false);
        const [anchorEl, setAnchorEl] = React.useState(null);

        var boxColor = "#FECC00";
        if (data.is_valid) {
            boxColor = "#86c142";
        }

        if (!data.previously_saved) {
            boxColor = "#f86a3e";
        }

        const menuClick = (event) => {
            setOpen(!open);
            setAnchorEl(event.currentTarget);
        }


        var parsedName = data.name;
        if (
            parsedName !== undefined &&
            parsedName !== null &&
            parsedName.length > 35
        ) {
            parsedName = parsedName.slice(0, 34) + "..";
        }

        const actions = data.actions !== null ? data.actions.length : 0;
        const appGroup = getWorkflowAppgroup(data)
        const [triggers, subflows] = getWorkflowMeta(data)

        const hasSuborgs = data.suborg_distribution !== undefined && data.suborg_distribution !== null && data.suborg_distribution.length > 0
        const isDistributed = (data.parentorg_workflow !== undefined && data.parentorg_workflow !== null && data.parentorg_workflow.length > 0) //|| (data.org_id !== userdata.active_org.id && data.org_id !== undefined && data.org_id !== null && data.org_id.length > 0)

        const workflowMenuButtons = (
            <Menu
                id="long-menu"
                anchorEl={anchorEl}
                keepMounted
                open={open}
                onClose={() => {
                    setOpen(false);
                    setAnchorEl(null);
                }}
            >
                {isDistributed ?
                    <MenuItem
                        style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                        onClick={() => {
                            navigate(`/workflows/${data.id}`)
                        }}
                    >
                        <VisibilityIcon style={{ marginLeft: 0, marginRight: 8 }} />
                        Explore Workflow
                    </MenuItem>
                    : null}
                <MenuItem
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                    disabled={isDistributed}
                    onClick={(event) => {
                        event.stopPropagation()
                        if (data.actions !== undefined && data.actions !== null && data.actions.length > 0 && data.image !== "") {
                            setEditing(data)

                        } else {
                            //toast("Need to side-load workflow to be edited properly")
                            sideloadWorkflow(data.id, "edit")

                            toast.info("Loading full workflow for editing. Please wait...")
                        }
                    }}
                    key={"change"}
                >
                    <EditIcon style={{ marginLeft: 0, marginRight: 8 }} />
                    {"Edit details"}
                </MenuItem>

                <MenuItem
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                    onClick={(event) => {
                        window.open(`/forms/${data.id}`, "_blank")
                    }}
                    key={"explore forms"}
                >
                    <EditNoteIcon style={{ marginLeft: 0, marginRight: 8 }} />
                    {"Edit Form"}
                </MenuItem>

                <Divider />

                <MenuItem
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                    disabled={isDistributed}
                    onClick={() => {
                        sideloadWorkflow(data.id, "publish")

                        toast.info("Loading full workflow for publishing. Please wait...")
                    }}
                    key={"publish"}
                >
                    <CloudUploadIcon style={{ marginLeft: 0, marginRight: 8 }} />
                    {"Publish Workflow"}
                </MenuItem>

                <MenuItem
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                    disabled={isDistributed}
                    onClick={() => {
                        sideloadWorkflow(data.id, "export", setOpen)

                        toast.info("Loading full workflow to be exported. Please wait...")
                    }}
                    key={"export"}
                >
                    <GetAppIcon style={{ marginLeft: 0, marginRight: 8 }} />
                    {"Export Workflow"}
                </MenuItem>

                <Divider />

                <MenuItem
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                    disabled={isDistributed}
                    onClick={() => {
                        duplicateWorkflow(data)
                        setOpen(false)
                    }}
                    key={"duplicate"}
                >
                    <FileCopyIcon style={{ marginLeft: 0, marginRight: 8 }} />
                    {"Duplicate Workflow"}
                </MenuItem>

                <MenuItem
                    style={{ backgroundColor: theme.palette.inputColor, color: "white" }}
                    onClick={() => {
                        setDeleteModalOpen(true);
                        setSelectedWorkflowId(data.id);
                        setOpen(false);
                    }}
                    key={"delete"}
                >
                    <DeleteIcon style={{ marginLeft: 0, marginRight: 8 }} />
                    {"Delete Workflow"}
                </MenuItem>
            </Menu>
        );

        var image = "";

        var orgName = "";
        var orgId = "";
        if (userdata.orgs !== undefined) {
            const foundOrg = userdata.orgs.find((org) => org.id === data["org_id"]);
            if (foundOrg !== undefined && foundOrg !== null) {
                //position: "absolute", bottom: 5, right: -5,
                const imageStyle = {
                    width: imagesize,
                    height: imagesize,
                    pointerEvents: "none",
                    marginLeft:
                        data.creator_org !== undefined && data.creator_org.length > 0
                            ? 20
                            : 0,
                    borderRadius: 10,
                    border:
                        foundOrg.id === userdata.active_org.id
                            ? `3px solid ${boxColor}`
                            : null,
                    cursor: "pointer",
                    marginRight: 10,
                };


                image =
                    foundOrg.image === "" || foundOrg.image === null || foundOrg.image === undefined ? (
                        <img
                            alt={foundOrg.name}
                            src={theme.palette.defaultImage}
                            style={imageStyle}
                        />
                    ) : (
                        <img
                            alt={foundOrg.name}
                            src={foundOrg.image}
                            style={imageStyle}
                            onClick={() => { }}
                        />
                    );

                orgName = foundOrg.name;
                orgId = foundOrg.id;
            }
        }

        var selectedCategory = ""
        if (data.usecase_ids !== undefined && data.usecase_ids !== null && data.usecase_ids.length > 0 && usecases !== null && usecases !== undefined && usecases.length > 0) {
            const oldcolor = boxColor.valueOf()

            // Find the first usecase and use that ones' ID
            for (var key in usecases) {
                var category = usecases[key]
                category.matches = []

                for (var subcategorykey in category.list) {
                    var subcategory = category.list[subcategorykey]
                    subcategory.matches = []

                    for (var usecasekey in data.usecase_ids) {
                        if (data.usecase_ids[usecasekey].toLowerCase() === subcategory.name.toLowerCase()) {
                            boxColor = category.color
                            break
                        }
                    }

                    if (boxColor !== oldcolor) {
                        break
                    }
                }

                if (boxColor !== oldcolor) {
                    selectedCategory = category.name
                    break
                }
            }
        }

        if (type === "public" && currTab === 2) {

            const imageStyle = {
                width: 24,
                height: 24,
                marginRight: 10,
                border: "1px solid rgba(255,255,255,0.3)",
            }

            image = data.creator_info !== undefined && data.creator_info !== null && data.creator_info.image !== undefined && data.creator_info.image !== null && data.creator_info.image.length > 0 ? <Avatar alt={data.creator} src={data.creator_info.image} style={imageStyle} /> : <Avatar alt={"shuffle_image"} src={theme.palette.defaultImage} style={imageStyle} />
            const creatorname = data.creator_info !== undefined && data.creator_info !== null && data.creator_info.username !== undefined && data.creator_info.username !== null && data.creator_info.username.length > 0 ? data.creator_info.username : "Shuffle"
            if ((data.objectID === undefined || data.objectID === null) && data.id !== undefined && data.id !== null) {
                data.objectID = data.id
            }

            //console.log("IMG: ", data)
            var parsedUrl = `/workflows/${data.objectID}`
            if (data.__queryID !== undefined && data.__queryID !== null) {
                parsedUrl += `?queryID=${data.__queryID}`
            }
        }


        return (
            <div style={{ width: "100%", minWidth: 320, position: "relative", border: highlightIds.includes(data.id) ? "2px solid #f85a3e" : isDistributed || hasSuborgs ? `2px solid ${theme.palette.distributionColor}` : "inherit", borderRadius: theme.palette?.borderRadius, backgroundColor: "#212121", fontFamily: theme?.typography?.fontFamily }}>
                <Paper square style={paperAppStyle}>
                    {selectedCategory !== "" ?
                        <Tooltip title={`Usecase Category: ${selectedCategory}`} placement="bottom">
                            <div
                                style={{
                                    cursor: "pointer",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    height: paperAppStyle.minHeight,
                                    width: 3,
                                    backgroundColor: boxColor,
                                    borderRadius: "0 100px 0 0",
                                    fontFamily: theme?.typography?.fontFamily,
                                }}
                                onClick={() => {
                                    addFilter(selectedCategory)
                                }}
                            />
                        </Tooltip>
                        : null}

                    <Grid
                        item
                        style={{ display: "flex", flexDirection: "column", width: "100%", fontFamily: theme?.typography?.fontFamily }}
                    >
                        <Grid item style={{ display: "flex", maxHeight: 34 }}>
							{currTab === 2 ? null : 
								<Tooltip title={`Org "${orgName}". Click to edit image.`} placement="bottom">
									<div
										styl={{ cursor: "pointer" }}
										onClick={() => {
											navigate("/admin")
										}}
									>
										{image}
									</div>
								</Tooltip>
							}
                            <Tooltip arrow
                                onMouseEnter={() => {
                                    /*
                                    if (data.image === undefined || data.image === null || data.image === "" && !loadingWorkflows.includes(data.id)) {
                                            sideloadWorkflow(data.id, false) 
                                            loadingWorkflows.push(data.id) 
                                    }
                                    */
                                }}
                                title={
                                    <div style={{
                                        width: "100%",
                                        minWidth: 250,
                                        maxWidth: 310,
                                        padding: "12px 0",
                                    }}>
                                        {(data?.image !== undefined || (data?.image_url !== undefined && data?.image_url.length > 0)) ? (
                                            <div style={{
                                                marginBottom: 15,
                                                borderRadius: theme.palette?.borderRadius,
                                                overflow: "hidden",
                                                border: `1px solid ${theme.palette.inputColor}`,
                                            }}>
                                                <img
                                                    src={data?.image || data?.image_url}
                                                    alt={data?.name}
                                                    style={{
                                                        backgroundColor: theme.palette.surfaceColor,
                                                        width: "100%",
                                                        height: "auto",
                                                        display: "block",
                                                    }}
                                                />
                                            </div>
                                        ) : null}

                                        <Typography style={{
                                            color: "rgba(255,255,255,0.9)",
                                            fontSize: "16px",
                                            fontFamily: theme?.typography?.fontFamily,
                                        }}>
                                            Edit: {data.name}
                                        </Typography>

                                        {(isDistributed || hasSuborgs) && (
                                            <div style={{
                                                backgroundColor: "rgba(64,224,208,0.1)", // Matching the teal color used in border
                                                border: `1px solid ${theme.palette.distributionColor}`,
                                                borderRadius: 4,
                                                padding: "8px 12px",
                                                marginTop: 8,
                                            }}>
                                                <Typography variant="body2" style={{
                                                    color: theme.palette.distributionColor,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}>
                                                    This is a parentorg-controlled workflow
                                                </Typography>
                                            </div>
                                        )}
                                    </div>
                                } placement="right">

                                <Typography
                                    variant="body1"
                                    style={{
                                        marginBottom: 0,
                                        paddingBottom: 0,
                                        maxHeight: 30,
                                        flex: 10,
                                        fontFamily: theme?.typography?.fontFamily,
                                        fontWeight: 500,
                                    }}
                                >
                                    <Link
                                        to={
                                            currTab === 2 ? `https://shuffler.io${parsedUrl}` : type === "public" ? parsedUrl : data.workflow_as_code ? `/workflows/${data.id}/code` : `/workflows/${data.id}`
                                        }
                                        style={{ 
											textDecoration: "none", 
											color: "inherit", 
											overflow: "hidden", 
											textOverflow: "ellipsis", 
											whiteSpace: "nowrap", 
											maxWidth: "90%", 
											display: "block" 
										}}
										target={currTab === 2 ? "_blank" : "_self"}
									>
                                        {parsedName}
                                    </Link>
                                </Typography>
                            </Tooltip>
                        </Grid>
                        <Grid item style={workflowActionStyle}>
                            {appGroup.length > 0 ?
                                <div style={{ display: "flex", marginTop: 8, }}>
                                    <AvatarGroup max={4} style={{ marginLeft: 5, maxHeight: 24, }}>
                                        {currTab !== 2 && appGroup.map((data, index) => {
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        height: 24,
                                                        width: 24,
                                                        filter: "brightness(0.6)",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => {
                                                        addFilter(data.app_name);
                                                    }}
                                                >
                                                    <Tooltip color="primary" title={data.app_name} placement="bottom">
                                                        <Avatar alt={data.app_name} src={data.large_image} style={{ width: 24, height: 24 }} />
                                                    </Tooltip>
                                                </div>
                                            )
                                        })}
                                        {
                                            currTab === 2 && appGroup.map((data, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            height: 24,
                                                            width: 24,
                                                            filter: "brightness(0.6)",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => {
                                                            addFilter(data.app_name);
                                                        }}
                                                    >
                                                        <Tooltip color="primary" title={data.name} placement="bottom">
                                                            <Avatar alt={data.name} src={data.image_url} style={{ width: 24, height: 24 }} />
                                                        </Tooltip>
                                                    </div>
                                                )
                                            })}
                                    </AvatarGroup>
                                </div>
                                :
                                <Tooltip color="primary" title="Action amount" placement="bottom">
                                    <span style={{ color: "#979797", display: "flex" }}>
                                        <BubbleChartIcon
                                            style={{ marginTop: "auto", marginBottom: "auto" }}
                                        />
                                        <Typography
                                            style={{
                                                marginLeft: 5,
                                                marginTop: "auto",
                                                marginBottom: "auto",
                                            }}
                                        >
                                            {actions}
                                        </Typography>
                                    </span>
                                </Tooltip>
                            }
                            <Tooltip
                                color="primary"
                                title="Amount of triggers"
                                placement="bottom"
                            >
                                <span
                                    style={{ marginLeft: 15, color: "#979797", display: "flex" }}
                                >
                                    <RestoreIcon
                                        style={{
                                            color: "#979797",
                                            marginTop: "auto",
                                            marginBottom: "auto",
                                        }}
                                    />
                                    <Typography
                                        style={{
                                            marginLeft: 5,
                                            marginTop: "auto",
                                            marginBottom: "auto",
                                        }}
                                    >
                                        {triggers}
                                    </Typography>
                                </span>
                            </Tooltip>
                            <Tooltip color="primary" title="Subflows used" placement="bottom">
                                <span
                                    style={{
                                        marginLeft: 15,
                                        display: "flex",
                                        color: "#979797",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => {
                                        if (subflows === 0) {
                                            toast("No subflows for " + data.name);
                                            return;
                                        }

                                        var newWorkflows = [data];
                                        for (var key in data.triggers) {
                                            const trigger = data.triggers[key];
                                            if (trigger.app_name !== "Shuffle Workflow") {
                                                continue;
                                            }

                                            if (
                                                trigger.parameters !== undefined &&
                                                trigger.parameters !== null &&
                                                trigger.parameters.length > 0 &&
                                                trigger.parameters[0].name === "workflow"
                                            ) {
                                                const newWorkflow = workflows.find(
                                                    (item) => item.id === trigger.parameters[0].value
                                                );
                                                if (newWorkflow !== null && newWorkflow !== undefined) {
                                                    newWorkflows.push(newWorkflow);
                                                    continue;
                                                }
                                            }
                                        }

                                        setFilters(["Subflows of " + data.name]);
                                        setFilteredWorkflows(newWorkflows);
                                    }}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{
                                            color: "#979797",
                                            marginTop: "auto",
                                            marginBottom: "auto",
                                        }}
                                    >
                                        <path
                                            d="M0 0H15V15H0V0ZM16 16H18V18H16V16ZM16 13H18V15H16V13ZM16 10H18V12H16V10ZM16 7H18V9H16V7ZM16 4H18V6H16V4ZM13 16H15V18H13V16ZM10 16H12V18H10V16ZM7 16H9V18H7V16ZM4 16H6V18H4V16Z"
                                            fill="#979797"
                                        />
                                    </svg>
                                    <Typography
                                        style={{
                                            marginLeft: 5,
                                            marginTop: "auto",
                                            marginBottom: "auto",
                                        }}
                                    >
                                        {subflows}
                                    </Typography>
                                </span>
                            </Tooltip>
                        </Grid>
                        <Grid
                            item
                            style={{
                                justifyContent: "left",
                                overflow: "hidden",
                                marginTop: 8,
                                maxHeight: 35,
                                fontFamily: theme?.typography?.fontFamily,
                            }}
                        >
                            {data.tags !== undefined && data.tags !== null
                                ? data.tags.map((tag, index) => {
                                    if (index >= 3) {
                                        return null;
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
                                    );
                                })
                                : null}
                        </Grid>
                        {data.actions !== undefined && data.actions !== null && type !== "public" ? (
                            <div style={{ position: "absolute", top: 10, right: 10, }}>
                                <IconButton
                                    aria-label="more"
                                    aria-controls="long-menu"
                                    aria-haspopup="true"
                                    onClick={menuClick}
                                    style={{ padding: "0px", color: "#979797" }}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                                {workflowMenuButtons}
                            </div>
                        ) : null}

                        {(data.sharing !== undefined && data.sharing !== null && data.sharing === "form") || (data?.form_control?.input_markdown !== undefined && data?.form_control?.input_markdown !== null && data?.form_control?.input_markdown !== "") && type !== "public" ?
                            <Tooltip title="Edit Form" placement="top">
                                <div style={{ position: "absolute", top: 50, right: 8, }}>
                                    <IconButton
                                        aria-label="more"
                                        aria-controls="long-menu"
                                        aria-haspopup="true"
                                        onClick={() => {
                                            navigate(`/forms/${data.id}`)
                                        }}
                                        style={{ padding: "0px", color: "#979797" }}
                                    >
                                        <EditNoteIcon />
                                    </IconButton>
                                </div>
                            </Tooltip>
                        : null}

						{(data?.validation?.validation_ran === true && data?.validation?.valid === false && data?.validation?.errors?.length > 0 ) ?                            
							<Tooltip title={`Explore more than  ${data?.validation?.errors?.length} notifications. When the last execution finishes without errors AND notifications stop occuring, this icon disappears.`} placement="top">
                                <div style={{ position: "absolute", top: 85, right: 8, }}>
                                    <IconButton
                                        aria-label="more"
                                        aria-controls="long-menu"
                                        aria-haspopup="true"
                                        onClick={() => {
                                            window.open(`/admin?admin_tab=notifications&workflow=${data.id}`, "_blank")
                                        }}
                                        style={{ 
											padding: "0px", 
											color: "#979797",
										}}
                                    >
										<ErrorOutlineIcon style={{ 
											marginRight: 2, 
										}} />
                                    </IconButton>
                                </div>
                            </Tooltip>
						: null}

                    </Grid>
                </Paper>
            </div>
        )
    }

    // Can create and set workflows
    const setNewWorkflow = (
        name,
        description,
        tags,
        defaultReturnValue,
        editingWorkflow,
        redirect,
        currentUsecases,
        inputblogpost,
        inputstatus,
    ) => {

        var method = "POST";
        var extraData = "";
        var workflowdata = {};

        if (editingWorkflow.id !== undefined) {
            console.log("Building original workflow");
            method = "PUT";
            //extraData = "/" + editingWorkflow.id + "?skip_save=true";
            extraData = "/" + editingWorkflow.id + "?skip_save=true";
            workflowdata = editingWorkflow;

            console.log("REMOVING OWNER");
            workflowdata["owner"] = "";
            workflowdata["org"] = [];
            workflowdata["org_id"] = "";
            workflowdata["execution_org"] = {};
            workflowdata["previously_saved"] = false;
            // FIXME: Loop triggers and turn them off?
        }

        workflowdata["name"] = name;
        workflowdata["description"] = description;
        if (tags !== undefined) {
            workflowdata["tags"] = tags;
        }

        workflowdata["blogpost"] = inputblogpost
        workflowdata["status"] = inputstatus

        if (defaultReturnValue !== undefined) {
            workflowdata["default_return_value"] = defaultReturnValue;
        }

        if (currentUsecases !== undefined && currentUsecases !== null) {
            workflowdata["usecase_ids"] = currentUsecases
            //workflows[0].category = ["detect"]
            //workflows[0].usecase_ids = ["Correlate tickets"]
        }

        const new_url = `${globalUrl}/api/v1/workflows${extraData}`
        return fetch(new_url, {
            method: method,
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
                setSubmitLoading(false);

                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.success === false) {
                    if (responseJson.reason !== undefined) {
                        toast("Error setting workflow: ", responseJson.reason)
                    } else {
                        toast("Error setting workflow.")
                    }

                    return
                }

                if (redirect) {
                    //window.location.pathname = "/workflows/" + responseJson["id"];
                    navigate("/workflows/" + responseJson["id"])
                    //setModalOpen(false);
                } else if (!redirect) {
                    // Update :)
                    setTimeout(() => {
                        getAvailableWorkflows();
                    }, 4000);
                    setSubmitLoading(false)
                    setModalOpen(false);
                } else {
                    //toast("Successfully changed basic info for workflow");
                    setModalOpen(false);
                }

                return responseJson;
            })
            .catch((error) => {
                toast(error.toString());
                setSubmitLoading(false)
                setModalOpen(false);
                setSubmitLoading(false);
            });
    };

    const importFiles = (event) => {
        console.log("Importing!");
        setSubmitLoading(true)

        if (event.target.files.length > 0) {
            console.log("Files: !", event.target.files.length);
            for (var key in event.target.files) {
                const file = event.target.files[key];
                if (file.type !== "application/json") {
                    if (file.type !== undefined) {
                        toast("File has to contain valid json");
                        setSubmitLoading(false)
                    }

                    continue;
                }

                const reader = new FileReader();
                var workflowids = []

                // Waits for the read
                reader.addEventListener("load", (event) => {
                    var data = reader.result;
                    try {
                        data = JSON.parse(reader.result);
                    } catch (e) {
                        toast("Invalid JSON: " + e);
                        setSubmitLoading(false)
                        return;
                    }

                    console.log("File being loaded: ", data.name);

                    // Initialize the workflow itself
                    setNewWorkflow(
                        data.name,
                        data.description,
                        data.tags,
                        data.default_return_value,
                        {},
                        false,
                        [],
                        "",
                        data.status,
                    )
                        .then((response) => {
                            if (response !== undefined) {
                                // SET THE FULL THING
                                data.id = response.id;
                                data.first_save = false;
                                data.previously_saved = false;
                                data.is_valid = false;
                                data.org_id = userdata.active_org.id
                                data.org = []
                                data.execution_org = {}

                                workflowids.push(data.id)

                                // Actually create it
                                setNewWorkflow(
                                    data.name,
                                    data.description,
                                    data.tags,
                                    data.default_return_value,
                                    data,
                                    false,
                                    [],
                                    "",
                                    data.status,
                                ).then((response) => {
                                    if (response !== undefined) {
                                        toast("Successfully imported " + data.name);
                                    }
                                });
                            }
                        })
                        .catch((error) => {
                            toast("Import error: " + error.toString());
                        });
                });

                // Actually reads
                reader.readAsText(file);
            }
        }

        setLoadWorkflowsModalOpen(false);

        if (workflowids.length > 0) {
            setHighlightIds(workflowids)
        }
    };

    const getWorkflowMeta = (data) => {
        let triggers = 0;
        let subflows = 0;
        if (
            data.triggers !== undefined &&
            data.triggers !== null &&
            data.triggers.length > 0
        ) {
            triggers = data.triggers.length;
            for (let key in data.triggers) {
                if (data.triggers[key].app_name === "Shuffle Workflow") {
                    subflows += 1;
                }
            }
        }

        return [triggers, subflows];
    };

    const WorkflowListView = () => {
        let workflowData = "";
        if (workflows.length > 0) {
            const columns = [
                {
                    field: "image",
                    headerName: "Logo",
                    width: 50,
                    sortable: false,
                    renderCell: (params) => {
                        const data = params.row.record;

                        var boxColor = "#FECC00";
                        if (data.is_valid) {
                            boxColor = "#86c142";
                        }

                        if (!data.previously_saved) {
                            boxColor = "#f85a3e";
                        }

                        var image = "";
                        if (userdata.orgs !== undefined) {
                            const foundOrg = userdata.orgs.find(
                                (org) => org.id === data["org_id"]
                            );
                            if (foundOrg !== undefined && foundOrg !== null) {
                                //position: "absolute", bottom: 5, right: -5,
                                const imageStyle = {
                                    width: imagesize + 7,
                                    height: imagesize + 7,
                                    pointerEvents: "none",
                                    marginLeft:
                                        data.creator_org !== undefined &&
                                            data.creator_org.length > 0
                                            ? 20
                                            : 0,
                                    borderRadius: 10,
                                    border:
                                        foundOrg.id === userdata.active_org.id
                                            ? `3px solid ${boxColor}`
                                            : null,
                                    cursor: "pointer",
                                    marginTop: 5,
                                };

                                //<Tooltip title={`Org: ${foundOrg.name}`} placement="bottom">
                                image =
                                    foundOrg.image === "" ? (
                                        <img
                                            alt={foundOrg.name}
                                            src={theme.palette.defaultImage}
                                            style={imageStyle}
                                        />
                                    ) : (
                                        <img
                                            alt={foundOrg.name}
                                            src={foundOrg.image}
                                            style={imageStyle}
                                            onClick={() => {
                                                //setFilteredWorkflows(newWorkflows)
                                            }}
                                        />
                                    );
                            }
                        }

                        return <div styl={{ cursor: "pointer" }}>{image}</div>;
                    },
                },
                {
                    field: "title",
                    headerName: "Title",
                    width: 330,
                    renderCell: (params) => {
                        const data = params.row.record;


                        return (
                            <Grid item>
                                <Link
                                    to={"/workflows/" + data.id}
                                    style={{ textDecoration: "none", color: "inherit" }}
                                >
                                    <Typography>{data.name}</Typography>
                                </Link>
                            </Grid>
                        );
                    },
                },

                {
                    field: "options",
                    headerName: "Options",
                    width: 200,
                    sortable: false,
                    disableClickEventBubbling: true,
                    renderCell: (params) => {
                        const data = params.row.record;
                        const actions = data.actions !== null ? data.actions.length : 0;
                        let [triggers, subflows] = getWorkflowMeta(data);
                        const appGroup = getWorkflowAppgroup(data)

                        return (
                            <Grid item>
                                <div style={{ display: "flex" }}>
                                    {appGroup.length > 0 ?
                                        <div style={{ display: "flex", marginTop: 3, }}>
                                            <AvatarGroup max={4} style={{ marginLeft: 5, maxHeight: 24, }}>
                                                {appGroup.map((data, index) => {
                                                    return (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                height: 24,
                                                                width: 24,
                                                                filter: "brightness(0.6)",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => {
                                                                addFilter(data.app_name);
                                                            }}
                                                        >
                                                            <Tooltip color="primary" title={data.app_name} placement="bottom">
                                                                <Avatar alt={data.app_name} src={data.large_image} style={{ width: 24, height: 24 }} />
                                                            </Tooltip>
                                                        </div>
                                                    )
                                                })}
                                            </AvatarGroup>
                                        </div>
                                        :
                                        <Tooltip color="primary" title="Action amount" placement="bottom">
                                            <span style={{ color: "#979797", display: "flex" }}>
                                                <BubbleChartIcon
                                                    style={{ marginTop: "auto", marginBottom: "auto" }}
                                                />
                                                <Typography
                                                    style={{
                                                        marginLeft: 5,
                                                        marginTop: "auto",
                                                        marginBottom: "auto",
                                                    }}
                                                >
                                                    {actions}
                                                </Typography>
                                            </span>
                                        </Tooltip>
                                    }

                                    <Tooltip
                                        color="primary"
                                        title="Amount of triggers"
                                        placement="bottom"
                                    >
                                        <span
                                            style={{
                                                marginLeft: 15,
                                                color: "#979797",
                                                display: "flex",
                                            }}
                                        >
                                            <RestoreIcon
                                                style={{
                                                    color: "#979797",
                                                    marginTop: "auto",
                                                    marginBottom: "auto",
                                                }}
                                            />
                                            <Typography
                                                style={{
                                                    marginLeft: 5,
                                                    marginTop: "auto",
                                                    marginBottom: "auto",
                                                }}
                                            >
                                                {triggers}
                                            </Typography>
                                        </span>
                                    </Tooltip>
                                    <Tooltip color="primary" title="Subflows used" placement="bottom">
                                        <span
                                            style={{
                                                marginLeft: 15,
                                                display: "flex",
                                                color: "#979797",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                if (subflows === 0) {
                                                    toast("No subflows for " + data.name);
                                                    return;
                                                }

                                                var newWorkflows = [data];
                                                for (var key in data.triggers) {
                                                    const trigger = data.triggers[key];
                                                    if (trigger.app_name !== "Shuffle Workflow") {
                                                        continue;
                                                    }

                                                    if (
                                                        trigger.parameters !== undefined &&
                                                        trigger.parameters !== null &&
                                                        trigger.parameters.length > 0 &&
                                                        trigger.parameters[0].name === "workflow"
                                                    ) {
                                                        const newWorkflow = workflows.find(
                                                            (item) => item.id === trigger.parameters[0].value
                                                        );
                                                        if (
                                                            newWorkflow !== null &&
                                                            newWorkflow !== undefined
                                                        ) {
                                                            newWorkflows.push(newWorkflow);
                                                            continue;
                                                        }
                                                    }
                                                }

                                                setFilters(["Subflows of " + data.name]);
                                                setFilteredWorkflows(newWorkflows);
                                            }}
                                        >
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{
                                                    color: "#979797",
                                                    marginTop: "auto",
                                                    marginBottom: "auto",
                                                }}
                                            >
                                                <path
                                                    d="M0 0H15V15H0V0ZM16 16H18V18H16V16ZM16 13H18V15H16V13ZM16 10H18V12H16V10ZM16 7H18V9H16V7ZM16 4H18V6H16V4ZM13 16H15V18H13V16ZM10 16H12V18H10V16ZM7 16H9V18H7V16ZM4 16H6V18H4V16Z"
                                                    fill="#979797"
                                                />
                                            </svg>
                                            <Typography
                                                style={{
                                                    marginLeft: 5,
                                                    marginTop: "auto",
                                                    marginBottom: "auto",
                                                }}
                                            >
                                                {subflows}
                                            </Typography>
                                        </span>
                                    </Tooltip>
                                </div>
                            </Grid>
                        );
                    },
                },
                {
                    field: "tags",
                    headerName: "Tags",
                    maxHeight: 15,
                    width: 300,
                    sortable: false,
                    disableClickEventBubbling: true,
                    renderCell: (params) => {
                        const data = params.row.record;
                        return (
                            <Grid item>
                                {data.tags !== undefined
                                    ? data.tags.map((tag, index) => {
                                        if (index >= 3) {
                                            return null;
                                        }

                                        return (
                                            <Chip
                                                key={index}
                                                style={chipStyle}
                                                label={tag}
                                                variant="outlined"
                                                color="primary"
                                            />
                                        );
                                    })
                                    : null}
                            </Grid>
                        );
                    },
                },
                {
                    field: "",
                    headerName: "",
                    maxHeight: 15,
                    width: 100,
                    sortable: false,
                    disableClickEventBubbling: true,
                    renderCell: (params) => { },
                },
            ];

            let rows = [];
            rows = filteredWorkflows.map((data, index) => {
                let obj = {
                    id: index + 1,
                    title: data.name,
                    record: data,
                };

                return obj;
            })

            workflowData = (
                <DataGrid
                    color="primary"
                    className={classes.datagrid}
                    rows={rows}
                    columns={columns}
                    page={page}
                    onPageChange={(newPage) => {
                        setPage(newPage)
                    }}
                    pageSize={pageSize}
                    onPageSizeChange={(newPageSize) => {
                        setPageSize(newPageSize);
                    }}
                    rowsPerPageOptions={[25, 50, 100, 150]}
                    checkboxSelection
                    autoHeight
                    density="standard"
                    onSelectionModelChange={(newSelection) => {
                        setSelectedWorkflowIndexes(newSelection)
                    }}
                    selectionModel={selectedWorkflowIndexes}
                    components={{
                        Toolbar: GridToolbar,
                    }}
                />
            );
        }
        return (
            <div style={{ ...gridContainer, backgroundColor: "#212121" }}>
                <Tooltip title={`New Workflow`} placement="bottom">
                    <IconButton
                        style={{ position: "absolute", top: 10, right: 50, zIndex: 1000 }}
                        onClick={() => {
                            setModalOpen(true)
                            setIsEditing(false)
                        }}
                    >
                        <AddCircleIcon style={{}} />
                    </IconButton>
                </Tooltip>
                {filteredWorkflows.length === 0 ? null :
                    <IconButton
                        style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
                        disabled={selectedWorkflowIndexes.length === 0}
                        onClick={() => {
                            setDeleteModalOpen(true)
                        }}
                    >
                        <Tooltip
                            title={`Delete ${selectedWorkflowIndexes.length} workflows`}
                            placement="top"
                        >
                            <DeleteIcon />
                        </Tooltip>
                    </IconButton>
                }
                {workflowData}
            </div>
        )
    };

    var total_count = 0
    const modalView = dialogModalOpen ? (
        <Dialog
            open={dialogModalOpen}
            onClose={() => {
                setDialogModalOpen(false);
            }}
            PaperProps={{
                style: {
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    minWidth: isMobile ? "90%" : "800px",
                    maxWidth: isMobile ? "90%" : "800px",
                    borderRadius: 8,
                },
            }}
        >
            <DialogTitle style={{ padding: "20px 24px" }}>
                <div style={{
                    color: "rgba(255,255,255,0.9)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <Typography variant="h5">
                        {editingWorkflow.id !== undefined ? "Edit Workflow" : "Create New Workflow"}
                    </Typography>
                    <div style={{ display: "flex", gap: 15 }}>
                        <Tooltip title={"Import manually"} placement="top">
                            <IconButton
                                color="primary"
                                size="medium"
                                onClick={() => upload.click()}
                                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                            >
                                <PublishIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton
                            size="medium"
                            onClick={() => setDialogModalOpen(false)}
                            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </div>
                </div>
            </DialogTitle>
            <FormControl>
                <DialogContent style={{ padding: "0 24px 20px" }}>
                    <TextField
                        onBlur={(event) => setNewWorkflowName(event.target.value)}
                        InputProps={{
                            style: {
                                color: "white",
                                backgroundColor: theme.palette.inputColor,
                                borderRadius: 8,
                            },
                        }}
                        color="primary"
                        label="Workflow Name"
                        required
                        margin="dense"
                        defaultValue={newWorkflowName}
                        autoFocus
                        fullWidth
                        variant="outlined"
                    />
                    <TextField
                        onBlur={(event) => setNewWorkflowDescription(event.target.value)}
                        InputProps={{
                            style: {
                                color: "white",
                                backgroundColor: theme.palette.inputColor,
                                borderRadius: 8,
                            },
                        }}
                        color="primary"
                        label="Description"
                        defaultValue={newWorkflowDescription}
                        multiline
                        rows={3}
                        margin="dense"
                        fullWidth
                        variant="outlined"
                        style={{ marginTop: 16 }}
                    />
                    <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                        <MuiChipsInput
                            style={{ flex: 1 }}
                            InputProps={{
                                style: {
                                    color: "white",
                                    backgroundColor: theme.palette.inputColor,
                                    borderRadius: 8,
                                },
                            }}
                            label="Tags"
                            color="primary"
                            fullWidth
                            value={newWorkflowTags}
                            onChange={(chips) => {
                                // Directly set the new array instead of mutating
                                setNewWorkflowTags(chips);
                            }}
                            onBlur={(event) => {
                                if (event.target.value.length === 0) {
                                    return
                                }

                                if (newWorkflowTags.includes(event.target.value)) {
                                    return
                                }

                                // Create new array instead of pushing
                                setNewWorkflowTags([...newWorkflowTags, event.target.value]);
                            }}
                            onAdd={(chip) => {
                                // Create new array instead of pushing
                                setNewWorkflowTags([...newWorkflowTags, chip]);
                            }}
                            onDelete={(chip, index) => {
                                // Filter instead of splice
                                setNewWorkflowTags(newWorkflowTags.filter((_, i) => i !== index));
                            }}
                            variant="outlined"
                        />
                        {usecases !== null && usecases !== undefined && usecases.length > 0 ?
                            <FormControl style={{ flex: 1 }} variant="outlined">
                                <InputLabel>Usecases</InputLabel>
                                <Select
                                    defaultValue=""
                                    label="Usecases"
                                    multiple
                                    value={selectedUsecases}
                                    renderValue={(selected) => selected.join(', ')}
                                    onChange={(event) => {
                                        console.log("Changed: ", event)
                                    }}
                                    style={{
                                        backgroundColor: theme.palette.inputColor,
                                        borderRadius: 8,
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {usecases.map((usecase, index) => (
                                        <span key={index}>
                                            <ListSubheader style={{ color: usecase.color }}>
                                                {usecase.name}
                                            </ListSubheader>
                                            {usecase.list.map((subcase, subindex) => {
                                                total_count += 1
                                                return (
                                                    <MenuItem
                                                        key={subindex}
                                                        value={total_count}
                                                        onClick={(event) => {
                                                            if (selectedUsecases.includes(subcase.name)) {
                                                                const itemIndex = selectedUsecases.indexOf(subcase.name)
                                                                if (itemIndex > -1) {
                                                                    selectedUsecases.splice(itemIndex, 1)
                                                                }
                                                            } else {
                                                                selectedUsecases.push(subcase.name)
                                                            }
                                                            setUpdate(Math.random());
                                                            setSelectedUsecases(selectedUsecases)
                                                        }}
                                                    >
                                                        <Checkbox
                                                            style={{
                                                                color: selectedUsecases.includes(subcase.name)
                                                                    ? usecase.color
                                                                    : theme.palette.inputColor
                                                            }}
                                                            checked={selectedUsecases.includes(subcase.name)}
                                                        />
                                                        <ListItemText primary={subcase.name} />
                                                    </MenuItem>
                                                )
                                            })}
                                        </span>
                                    ))}
                                </Select>
                            </FormControl>
                            : null}
                    </div>

                    <Collapse in={showMoreClicked}>
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                            <TextField
                                onBlur={(event) => {
                                    if (event.target.value.toLowerCase() === "test") {
                                        setStatus("test")
                                    } else if (event.target.value.toLowerCase() === "production") {
                                        setStatus("production")
                                    }
                                }}
                                InputProps={{
                                    style: {
                                        color: "white",
                                        backgroundColor: theme.palette.inputColor,
                                        borderRadius: 8,
                                    },
                                }}
                                color="primary"
                                label="Status"
                                defaultValue={status}
                                helperText="Can be test or production"
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                onBlur={(event) => setBlogpost(event.target.value)}
                                InputProps={{
                                    style: {
                                        color: "white",
                                        backgroundColor: theme.palette.inputColor,
                                        borderRadius: 8,
                                    },
                                }}
                                color="primary"
                                label="Reference"
                                defaultValue={blogpost}
                                helperText="Blogpost or documentation reference"
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                onBlur={(event) => setDefaultReturnValue(event.target.value)}
                                InputProps={{
                                    style: {
                                        color: "white",
                                        backgroundColor: theme.palette.inputColor,
                                        borderRadius: 8,
                                    },
                                }}
                                color="primary"
                                label="Default Return Value"
                                defaultValue={defaultReturnValue}
                                helperText="Used for Subflows if the subflow fails"
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                            />
                        </div>
                    </Collapse>

                    <Button
                        style={{
                            marginTop: 16,
                            color: "white",
                            textTransform: "none"
                        }}
                        onClick={() => setShowMoreClicked(!showMoreClicked)}
                        startIcon={showMoreClicked ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {showMoreClicked ? "Show Less" : "Show More Options"}
                    </Button>
                </DialogContent>
                <DialogActions style={{ padding: "16px 24px" }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setNewWorkflowName("");
                            setNewWorkflowDescription("");
                            setDefaultReturnValue("");
                            setEditingWorkflow({});
                            setNewWorkflowTags([]);
                            setDialogModalOpen(false);
                            setSelectedUsecases([])
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={newWorkflowName.length === 0}
                        onClick={() => {
                            if (editingWorkflow.id !== undefined) {
                                setNewWorkflow(
                                    newWorkflowName,
                                    newWorkflowDescription,
                                    newWorkflowTags,
                                    defaultReturnValue,
                                    editingWorkflow,
                                    false,
                                    selectedUsecases,
                                    blogpost,
                                    status,
                                );
                                setNewWorkflowName("");
                                setDefaultReturnValue("");
                                setNewWorkflowDescription("");
                                setEditingWorkflow({});
                                setNewWorkflowTags([]);
                            } else {
                                setNewWorkflow(
                                    newWorkflowName,
                                    newWorkflowDescription,
                                    newWorkflowTags,
                                    defaultReturnValue,
                                    {},
                                    true,
                                    selectedUsecases,
                                    blogpost,
                                    status,
                                );
                            }
                            setSubmitLoading(true);
                            setSelectedUsecases([])
                        }}
                    >
                        {submitLoading ? <CircularProgress size={24} /> : "Submit"}
                    </Button>
                </DialogActions>
            </FormControl>
        </Dialog>
    ) : null;

    const viewSize = {
        workflowView: 4,
        executionsView: 3,
        executionResults: 4,
    };

    const workflowViewStyle = {
        flex: viewSize.workflowView,
        marginLeft: 10,
        marginRight: 10,
    };

    if (viewSize.workflowView === 0) {
        workflowViewStyle.display = "none";
    }

    const workflowButtons = (
        <span>
            <Tooltip color="primary" title={"Explore Workflow Runs"} placement="top">
                <Button
                    disabled={workflows.length === 0}
                    color="secondary"
                    variant="text"
                    onClick={() => {
                        navigate("/workflows/debug")
                    }}
                >
                    <QueryStatsIcon />
                </Button>
            </Tooltip>
            {view === "list" && (
                <Tooltip color="primary" title={"Grid View"} placement="top">
                    <Button
                        color="secondary"
                        variant="text"
                        onClick={() => {
                            localStorage.setItem("view", "grid");
                            setView("grid");
                        }}
                    >
                        <GridOnIcon />
                    </Button>
                </Tooltip>
            )}
            {view === "grid" && (
                <Tooltip color="primary" title={"List View"} placement="top">
                    <Button
                        color="secondary"
                        variant="text"
                        onClick={() => {
                            localStorage.setItem("view", "list");
                            setView("list");
                        }}
                    >
                        <ListIcon />
                    </Button>
                </Tooltip>
            )}
            <Tooltip color="primary" title={"Import workflows"} placement="top">
                <Button
                    color="secondary"
                    style={{}}
                    variant="text"
                    onClick={() => upload.click()}
                >

                    {submitLoading ? <CircularProgress color="secondary" /> : <PublishIcon />}
                </Button>
            </Tooltip>
            <input
                hidden
                type="file"
                multiple="multiple"
                ref={(ref) => (upload = ref)}
                onChange={importFiles}
            />
            {workflows.length > 0 ? (
                <Tooltip
                    color="primary"
                    title={`Download ALL workflows (${workflows.length})`}
                    placement="top"
                >
                    <Button
                        color="secondary"
                        style={{}}
                        disabled={isCloud}
                        variant="text"
                        onClick={() => {
                            exportAllWorkflows(workflows);
                        }}
                    >
                        <GetAppIcon />
                    </Button>
                </Tooltip>
            ) : null}
            {isCloud ? null : (
                <Tooltip color="primary" title={"Import workflows to Shuffle"} placement="top">
                    <Button
                        color="secondary"
                        style={{}}
                        variant="text"
                        onClick={() => setLoadWorkflowsModalOpen(true)}
                    >
                        <CloudDownloadIcon />
                    </Button>
                </Tooltip>
            )}
        </span>
    );

    // const tourOptions = {
    // 	defaultStepOptions: {
    // 		classes: "shadow-md bg-purple-dark",
    //   	scrollTo: true
    // 	},
    // 	useModalOverlay: true,
    // 	tourName: workflows,
    // 	exitOnEsc: true,
    // }

    //  //classes: "custom-class-name-1 custom-class-name-2",
    // const newSteps = [
    // 	{
    //   	id: "intro",
    //   	scrollTo: true,
    //   	beforeShowPromise: function() {
    //   	  return new Promise(function(resolve) {
    //   	    setTimeout(function() {
    //   	      window.scrollTo(0, 0);
    //   	      resolve();
    //   	    }, 500);
    //   	  });
    //   	},
    //   	buttons: [
    //   	  {
    //   	    classes: "shepherd-button-primary",
    // 				style: {
    // 					backgroundColor: "red",	
    // 					color: "white", 
    // 				},
    //   	    text: "Next",
    //   	    type: "next"
    //   	  }
    //   	],
    //   	highlightClass: "highlight",
    //   	showCancelLink: true,
    //   	text: [
    //   	  "React-Shepherd is a JavaScript library for guiding users through your React app."
    //   	],
    //   	when: {
    //   	  show: () => {
    //   	    console.log("show step 1");
    //   	  },
    //   	  hide: () => {
    //   	    console.log("hide step 1");
    //   	  }
    //   	}
    // },	
    // {
    //   	id: "second",
    //   	attachTo: {
    //   	  element: "second-step",
    //   	  on: "top"
    //   	},
    //   	text: [
    //   	  "Yuk eksplorasi hasil Tes Minat Bakat-mu dan rekomendasi <b>Jurusan</b> dan Karier."
    //   	],
    //   	buttons: [
    //   	  {
    //   	    classes: "btn btn-info",
    //   	    text: "Kembali",
    //   	    type: "back"
    //   	  },
    //   	  {
    //   	    classes: "btn btn-success",
    //   	    text: "Saya Mengerti",
    //   	    type: "cancel"
    //   	  }
    //   	],
    //   	when: {
    //   	  show: () => {
    //   	    console.log("show stepp");
    //   	  },
    //   	  hide: () => {
    //   	    console.log("complete step");
    //   	  }
    //   	},
    //   	showCancelLink: false,
    //   	scrollTo: true,
    //   	modalOverlayOpeningPadding: 4,
    //   	useModalOverlay: false,
    //   	canClickTarget: false
    // 	}
    // ]

    //  function TourButton() {
    // 	  const tour = useContext(ShepherdTourContext);

    // 	  return (
    // 	    <Button variant="contained" color="primary" onClick={tour.start}>
    // 	      Start Tour
    // 	    </Button>
    // 	  );
    // 	}

    useEffect(() => {
        if (currTab === 2) return;
        if (userdata !== undefined && userdata !== null && filteredWorkflows.length > 0) {
            var categoryWorkflows = []
            if (currTab === 0) {
                categoryWorkflows = filteredWorkflows.filter(workflow => workflow?.org_id === userdata?.active_org?.id)
                setOrgWorkflows(categoryWorkflows)
            }
            else if (currTab === 1) {
                categoryWorkflows = filteredWorkflows.filter(workflow => workflow?.org_id === userdata?.active_org?.id && workflow?.owner === userdata?.id)
                setMyWorkflows(categoryWorkflows)
            }
            setIsLoadingWorkflow(false);

        }
    }, [currTab, workflows, userdata, filteredWorkflows, filters])






    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value)
    }


    const iconButtonStyle = {
        color: 'white',
        backgroundColor: '#212121',
        borderRadius: '4px',
        padding: "12px 16px",
        cursor: 'pointer',
        minWidth: '40px',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

    }
    
    const iconButtonDisabledStyle = {
        ...iconButtonStyle,
        cursor: 'not-allowed',
        opacity: 0.9, // Reduce opacity
    }

    const Hits = ({ hits, isSearchStalled, searchQuery }) => {

        return (
            isLoadingPublicWorkflow ? (
                <LoadingWorkflowGrid />
            ) : (
                <div style={{
                    marginTop: 16,
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
                    gap: "20px",
                    justifyContent: "space-between",
                    alignItems: "start",
                    padding: "0 10px",
                    paddingBottom: 40
                }}>
                    {hits.map((data, index) => {
                        return <WorkflowPaper key={index} data={data} type="public" />
                    })}
                </div>
            )
        )
    };

    const SearchBox = ({ refine, searchQuery, setSearchQuery }) => {

        const inputRef = useRef(null);
        const [localQuery, setLocalQuery] = useState(searchQuery);
        const location = useLocation();


        useEffect(() => {
            if (searchQuery) {
                setLocalQuery(searchQuery);
                refine(searchQuery);
            }
        }, [searchQuery, refine]);

        // Debounced function to refine search
        const debouncedRefine = useRef(
            debounce((value) => {
                setSearchQuery(value);
                removeQuery("q");
                refine(value);
            }, 300)
        ).current;

        useEffect(() => {
            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            const foundQuery = params["q"];
            if (foundQuery) {
                setLocalQuery(foundQuery);
                debouncedRefine(foundQuery);
            }
        }, [debouncedRefine]);

        useEffect(() => {
            if (searchQuery === "") {
                return;
            }
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, [searchQuery]);

        const handleChange = (event) => {
            const value = event.target.value;
            setLocalQuery(value);
            debouncedRefine(value);
        };

        return (
            <TextField
                id="shuffle_search_field"
                inputRef={inputRef}
                style={{
                    width: "25%",
                    maxWidth: "25%",
                    minWidth: "25%",
                    height: 47,
                    backgroundColor: "#212121",
                }}
                InputProps={{
                    style: {
                        color: "white",
                        height: "100%",
                        backgroundColor: "#212121",
                    },
                    placeholder: "Search Workflows",
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        backgroundColor: "#212121",
                    },
                }}
                value={localQuery}
                onChange={handleChange}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                    }
                }}
                limit={5}
                variant="outlined"
                placeholder="Search Workflows"
            />
        )
    }

    const CustomSearchBox = connectSearchBox(SearchBox)
    const CustomHits = connectHits(Hits)

    const CategoryDropdown = ({ refine, currentRefinement, items }) => {

        const handleChange = (event) => {
            // Get the selected values array from the event
            const selectedValues = event.target.value;
            refine(selectedValues);
        };

        return (
            <Select
                fullWidth
                variant="outlined"
                displayEmpty
                multiple
                value={currentRefinement || []} 
                onChange={handleChange}
                style={{
                    width: "25%",
                    minWidth: "25%",
                    maxWidth: "25%",
                    height: 47,
                    borderRadius: 4,
                    backgroundColor: "#212121",
                    fontFamily: theme?.typography?.fontFamily,
                    color: "#FFFFFF", 
                }}
                MenuProps={{
                    anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                    },
                    transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                    },
                    PaperProps: {
                        style: {
                            backgroundColor: '#212121',
                            color: '#FFFFFF',
                            fontFamily: theme?.typography?.fontFamily,
                        }
                    }
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                        },
                    },
                }}
                renderValue={(selected) => {
                    if (!selected || selected.length === 0) return 'All Usecases';
                    return selected.join(', ');
                }}
                endAdornment={
                    (currentRefinement.length > 0 &&
                        <InputAdornment position="end">

                            <ClearIcon
                                style={{
                                    position: 'absolute',
                                    right: 35,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontSize: 20,
                                    zIndex: 1000
                                }}
                                onClick={() => refine([])}
                            />
                        </InputAdornment>
                    )
                }
            >
                <MenuItem disabled value="" style={{ fontFamily: theme?.typography?.fontFamily, fontSize: 16 }}>
                    All Usecases
                </MenuItem>
                {items.map((usecase, index) => (
                    <MenuItem
                        key={index} // Add key for each MenuItem
                        value={usecase.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': {
                                backgroundColor: '#3A3A3A', // Darker background on hover
                            },
                            fontFamily: theme?.typography?.fontFamily,
                            fontSize: 16
                        }}
                    >
                        <Checkbox
                            checked={currentRefinement.includes(usecase.label)}
                            style={{ marginRight: 8, color: '#FFFFFF', fontSize: 16 }}
                        />
                        {usecase.label} ({usecase.count})
                    </MenuItem>
                ))}
            </Select>
        );
    };
    const CustomCategoryDropdown = connectRefinementList(CategoryDropdown)

    const tabStyle = {
        textTransform: 'none',
        marginRight: 20,
        fontFamily: theme?.typography?.fontFamily,
        fontSize: 16,
        borderBottom: "5px solid transparent",
        minHeight: "48px",
        padding: "12px 16px",
    }

    const tabActive = {
        borderBottom: "5px solid #FF8544",
        borderRadius: "2px",
        color: "#FF8544"
    }


    const WorkflowView = memo(() => {
        if (workflows.length === 0) {
        }

        var workflowDelay = -150
        var appDelay = -75

        const foundPriority = userdata === undefined || userdata === null || userdata.priorities === undefined || userdata.priorities === null ? null : userdata.priorities.find(prio => prio.type === "usecase" && prio.active === true)
        return (
            <>
                <InstantSearch searchClient={searchClient} indexName="workflows">
                    <div style={{
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        maxWidth: isSafari ? "100%" : "70%",
                        margin: "auto",
                    }}>
                        <Typography variant="h4" style={{ marginBottom: 20, paddingLeft: 15, textTransform: 'none', fontFamily: theme?.typography?.fontFamily }}>
							{currTab === 0 ? "Org" : currTab === 1 ?  "Your" : "Discover"} Workflows
                        </Typography>

                        <div style={{ borderBottom: '1px solid gray', marginBottom: 30 }}>
                            <Tabs
                                value={currTab}
                                onChange={(event, newTab) => handleTabChange(event, newTab)}
                                style={{
                                    fontFamily: theme?.typography?.fontFamily,
                                    fontSize: 16,
                                    marginBottom: "-2px"
                                }}
                                TabIndicatorProps={{ style: { display: 'none' } }}
                            >
                                <Tab
                                    label="Org Workflows"
                                    style={{
                                        ...tabStyle,
                                        ...(currTab === 0 ? tabActive : {})
                                    }}
                                />
                                <Tab
                                    label="My Workflows"
                                    style={{
                                        ...tabStyle,
                                        ...(currTab === 1 ? tabActive : {})
                                    }}
                                />
                                <Tab
                                    label="Discover Workflows"
                                    style={{
                                        ...tabStyle,
                                        marginRight: 0,
                                        ...(currTab === 2 ? tabActive : {})
                                    }}
                                />

                                <Tab
                                    label="Org Forms"
									onClick={() => {
										navigate("/forms")
									}}
                                    style={{
                                        ...tabStyle,
                                        marginRight: 0,
										marginLeft: 25, 
                                        ...(currTab === 3 ? tabActive : {})
                                    }}
                                />
                            </Tabs>
                        </div>


                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 20, paddingRight: 25, minHeight: 47 }}>

                            {currTab === 2 ? (
                                <CustomSearchBox
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                />
                            ) : (
                                <MuiChipsInput
                                    style={{
                                        width: "25%",
                                        maxWidth: "25%",
                                        minWidth: "25%",
                                        height: 43,
                                        maxHeight: "fit-content",
                                        backgroundColor: "#212121",
                                        zIndex: 1000,
                                    }}
                                    disabled={currTab === 2}
                                    InputProps={{
                                        style: {
                                            color: "white",
                                            height: "fit-content",
                                            maxHeight: "fit-content",
                                            backgroundColor: "#212121",
                                        },
                                        placeholder: "Filter Workflows",
                                        // endAdornment: (
                                        //     <InputAdornment position="end">
                                        //         <SearchIcon style={{ color: 'white', paddingRight: 5 }} />
                                        //     </InputAdornment>
                                        // ),
                                        onKeyDown: (e) => {
                                            // Prevent default behavior for Enter and Backspace
                                            if (e.key === 'Enter' || e.key === 'Backspace') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.target.focus();
                                            }
                                        },
                                    }}
                                    clearInputOnBlur={false}
                                    sx={{
                                        // Container styling
                                        '& .MuiOutlinedInput-root': {
                                            height: "fit-content",
                                            borderRadius: '4px',
                                            backgroundColor: '#212121',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.23)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.4)',
                                            },
                                        },

                                        // Adjust chip container to center vertically
                                        '& .MuiInputBase-root': {
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            alignItems: 'center',
                                            height: "fit-content", // Match height
                                            backgroundColor: "#212121",
                                        },

                                        // Rest of the styling remains the same...
                                    }}
                                    value={filters}
                                    onChange={(chips) => {
                                        setFilters(chips);
                                        const remainingCategories = chips.map(chip => {
                                            const match = chip.match(/\d+\.\s+(\w+)/i);
                                            return match ? match[1] : chip;
                                        }).filter(category => {
                                            return usecases.some(usecase =>
                                                usecase.name.toLowerCase().includes(category.toLowerCase())
                                            );
                                        });

                                        setSelectedCategory(remainingCategories);
                                        findWorkflow(chips);

                                    }}
                                //onAdd={(chip) => {
                                //	console.log("ADd: ", chip);
                                //	addFilter(chip);
                                //}}
                                //onDelete={(_, index) => {
                                //	console.log("Remove: ", index);
                                //	removeFilter(index);
                                //}}
                                />
                            )}

                            {
                                currTab !== 2 && (
                                    <Select
                                        fullWidth
                                        variant="outlined"
                                        value={selectedCategory}
                                        onChange={handleCategoryChange}
                                        displayEmpty
                                        disabled={currTab === 2}
                                        multiple
                                        style={{
                                            width: "25%",
                                            minWidth: "25%",
                                            maxWidth: "25%",
                                            height: 47,
                                            borderRadius: 4,
                                            backgroundColor: "#212121",
                                            fontFamily: theme?.typography?.fontFamily
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                                },
                                            },
                                        }}
                                        renderValue={(selected) => selected.length ? selected.join(', ') : 'All Categories'}
                                    >
                                        <MenuItem disabled value="">
                                            All Categories
                                        </MenuItem>
                                        {usecases.map((usecase, index) => {
                                            if (usecase?.name === "5. Verify") {
                                                return null;
                                            }

                                            const percentDone = usecase.matches.length > 0 ? parseInt(usecase.matches.length / usecase.list.length * 100) : 0
                                            if (percentDone === 0) {
                                                usecase = findMatches(usecase, workflows)
                                            }

                                            const category = usecase?.name.split(" ")[1]
                                            return (
                                                <MenuItem
                                                    value={category}
                                                    onClick={() => {
                                                        if (!filters.includes(usecase?.name.toLowerCase())) {
                                                            addFilter(usecase.name)
                                                        } else {
                                                            removeFilter(filters.indexOf(usecase?.name.toLowerCase()))
                                                        }
                                                    }}
                                                    style={{
                                                        padding: "12px 16px",
                                                        borderBottom: index === usecases.length - 2 ? "none" : "1px solid rgba(255,255,255,0.05)",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(255,255,255,0.1)"
                                                        }
                                                    }}
                                                >
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        width: "100%",
                                                        gap: "12px"
                                                    }}>
                                                        <Checkbox
                                                            checked={selectedCategory.includes(category)}
                                                            style={{
                                                                padding: 0,
                                                                marginRight: 8,
                                                                color: "rgba(255,255,255,0.7)"
                                                            }}
                                                        />
                                                        <div style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            width: "100%"
                                                        }}>
                                                            <Typography
                                                                variant="body1"
                                                                style={{
                                                                    color: "rgba(255,255,255,0.9)",
                                                                    fontWeight: selectedCategory.includes(category) ? 500 : 400
                                                                }}
                                                            >
                                                                {category}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                style={{
                                                                    color: "rgba(255,255,255,0.5)",
                                                                    backgroundColor: "rgba(255,255,255,0.1)",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "12px",
                                                                    fontSize: "0.75rem"
                                                                }}
                                                            >
                                                                {usecase?.matches.length}/{usecase?.list.length}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </MenuItem>
                                            )
                                        })}
                                    </Select>
                                )
                            }
                            {
                                currTab === 2 && (
                                    <CustomCategoryDropdown attribute="usecase_ids" limit={20} />
                                )
                            }

                            <div style={{ width: "50%", minWidth: "50%", maxWidth: "50%", height: 47, display: "flex", gap: 5 }}>
                                <div style={{
                                    display: "flex",
                                    height: "100%",
                                    justifyContent: "space-around",
                                    flex: 0.7,
                                    paddingLeft: 1,
                                    paddingRight: 1,
                                    gap: 4
                                }}>
                                    <Tooltip title="Explore Workflow Runs" placement="top">
                                        <IconButton
                                            style={currTab === 2 ? iconButtonDisabledStyle : iconButtonStyle}
                                            onClick={() => navigate("/workflows/debug")}
                                            disabled={currTab === 2}
                                        >
                                            <QueryStatsIcon style={{ color: currTab === 2 ? "rgba(241, 241, 241, 0.5)" : "#F1F1F1" }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title={view === "grid" ? "List view" : "Grid view"} placement="top">
                                        <IconButton
                                            style={currTab === 2 ? iconButtonDisabledStyle : iconButtonStyle}
                                            onClick={() => {
                                                const newView = view === "grid" ? "list" : "grid";
                                                localStorage.setItem("workflowView", newView);
                                                setView(newView);
                                            }}
                                            disabled={currTab === 2}
                                        >
                                            {view === "grid" ?
                                                <ListIcon style={{ color: currTab === 2 ? "rgba(255, 255, 255, 0.5)" : "white" }} /> :
                                                <GridOnIcon style={{ color: currTab === 2 ? "rgba(255, 255, 255, 0.5)" : "white" }} />
                                            }
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Import workflows" placement="top">
                                        <IconButton
                                            style={currTab === 2 ? iconButtonDisabledStyle : iconButtonStyle}
                                            onClick={() => upload.click()}
                                            disabled={currTab === 2}
                                        >
                                            {submitLoading ?
                                                <CircularProgress color="secondary" /> :
                                                <PublishIcon style={{ color: currTab === 2 ? "rgba(255, 255, 255, 0.5)" : "white" }} />
                                            }
                                        </IconButton>
                                    </Tooltip>

                                    <input
                                        hidden
                                        type="file"
                                        multiple="multiple"
                                        ref={(ref) => (upload = ref)}
                                        onChange={importFiles}
                                    />

                                    <Tooltip title={`Download ALL workflows (${workflows.length})`} placement="top">
                                        <IconButton
                                            style={(isCloud || currTab === 2) ? iconButtonDisabledStyle : { ...iconButtonStyle, cursor: "pointer" }}
                                            disabled={isCloud || currTab === 2}
                                            onClick={() => exportAllWorkflows(workflows)}
                                        >
                                            <GetAppIcon style={{ color: (isCloud || currTab === 2) ? "rgba(255, 255, 255, 0.5)" : "white" }} />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleCreateWorkflow}
                                    id="create_workflow_button"
                                    style={{
                                        borderRadius: 4,
                                        flex: 0.8,
                                        textTransform: 'none',
                                        backgroundColor: "#FF8544",
                                        color: "#1A1A1A",
                                        fontFamily: theme?.typography?.fontFamily,
                                        fontSize: 16,
                                        fontWeight: 500
                                    }}
                                    startIcon={<Add style={{ color: "#1A1A1A" }} />}
                                >
                                    Create Workflow
                                </Button>
                            </div>


                        </div>
                        <div style={{
                            width: "100%",
                            position: "relative",
                            zIndex: 1
                        }}>
                            {
                                (isLoadingWorkflow && currTab !== 2) ? (
                                    <LoadingWorkflowGrid />
                                ) : (
                                    view === "grid" && currTab !== 2 ? (
                                        <>
                                            <div style={{
                                                marginTop: 16,
                                                width: "100%",
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
                                                gap: "20px",
                                                justifyContent: "space-between",
                                                alignItems: "start",
                                                padding: "0 10px",
                                                paddingBottom: 40
                                            }}>



                                                {currTab === 0 && orgWorkflows.map((data, index) => {
                                                    // Shouldn't be a part of this list
                                                    if (data.public === true) {
                                                        return null
                                                    }

                                                    // if (firstLoad) {
                                                    //     workflowDelay += 75
                                                    // } else {
                                                    //     return <WorkflowPaper key={index} data={data} />
                                                    // }

                                                    return (
                                                        <span key={index}>
                                                            {/*<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>*/}
                                                            <WorkflowPaper data={data} />
                                                            {/*</Zoom>*/}
                                                        </span>
                                                    )
                                                })}

                                                {
                                                    currTab === 1 && myWorkflows.map((data, index) => {
                                                        if (data.public === true) {
                                                            return null
                                                        }

                                                        // if (firstLoad) {
                                                        //     workflowDelay += 75
                                                        // } else {
                                                        //     return <WorkflowPaper key={index} data={data} />
                                                        // }

                                                        return (
                                                            <span key={index}>
                                                                {/*<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>*/}
                                                                <WorkflowPaper data={data} />
                                                                {/*</Zoom>*/}
                                                            </span>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </>
                                    ) : (
                                        currTab !== 2 && <WorkflowListView />
                                    )
                                )
                            }

                            {
                                currTab === 2 &&
                                (
                                    <CustomHits hitsPerPage={5} searchQuery={searchQuery} type="public" />
                                )
                            }

                        </div>
                    </div>
                    <Configure clickAnalytics />
                </InstantSearch>
            </>

        );
    });

    const importWorkflowsFromUrl = (url) => {
        console.log("IMPORT WORKFLOWS FROM ", downloadUrl);

        const parsedData = {
            url: url,
            field_3: downloadBranch || "master",
        };

        if (field1.length > 0) {
            parsedData["field_1"] = field1;
        }

        if (field2.length > 0) {
            parsedData["field_2"] = field2;
        }

        toast("Getting specific workflows from your URL.");
        fetch(globalUrl + "/api/v1/workflows/download_remote", {
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
                    toast("Successfully loaded workflows from " + downloadUrl);
                    setTimeout(() => {
                        getAvailableWorkflows();
                    }, 1000);
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
    };

    const handleGithubValidation = () => {
        importWorkflowsFromUrl(downloadUrl);
        setLoadWorkflowsModalOpen(false);
    }

    const workflowDownloadModalOpen = loadWorkflowsModalOpen ? (
        <Dialog
            open={loadWorkflowsModalOpen}
            onClose={() => { }}
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
                    Load workflows from github repo
                    <div style={{ float: "right" }}>
                        <Tooltip color="primary" title={"Import manually"} placement="top">
                            <Button
                                color="primary"
                                style={{}}
                                variant="text"
                                onClick={() => upload.click()}
                            >
                                <PublishIcon />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </DialogTitle>
            <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
                Repository (supported: github, gitlab, bitbucket)
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
                    placeholder="https://github.com/shuffle/workflows"
                    fullWidth
                />
                <span style={{ marginTop: 10 }}>
                    Branch (default value is "main"):
                </span>
                <div style={{ display: "flex" }}>
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
                    onClick={() => setLoadWorkflowsModalOpen(false)}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
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
    ) : null;

    //const 
    //const [percentDone, setPercentDone] = React.useState(0)
    const percentDone = gettingStartedItems.filter((item) => item.done).length / gettingStartedItems.length * 100

    const GettingStartedItem = ({ item, index }) => {
        const [clicked, setClicked] = React.useState(false)
        const doneIcon = item.done ? <CheckCircleIcon style={{ color: "#4caf50", marginRight: 10, }} /> : <RadioButtonUncheckedIcon disabled style={{ color: "#bdbdbd", marginRight: 10, }} />

        return (
            <div
                style={{ cursor: "pointer", padding: 20, borderBottom: "1px solid rgba(255,255,255,0.3", backgroundColor: !clicked ? "#1f2023" : theme.palette.inputColor, }}
                onClick={() => setClicked(true)}
            >
                <Typography variant="body2" style={{ display: "flex", textDecoration: item.done ? "line-through" : "none", }}>
                    {doneIcon} {index + 1}. {item.name}
                </Typography>
                {clicked ?
                    <span>
                        <Typography variant="body2" style={{ marginLeft: 30, }}>
                            {item.description}
                        </Typography>
                        <Link to={item.link} style={{ color: "inherit", textDecoration: "none", }}>
                            <Button variant={item.done ? "outlined" : "contained"} color="primary" style={{ marginLeft: 30, marginTop: 5, }}>
                                Configure
                            </Button>
                        </Link>
                    </span>
                    :
                    null
                }
            </div>
        )
    }

    const gettingStartedDrawer = true == true ? null :
        <Drawer
            anchor={"right"}
            open={drawerOpen}
            variant="persistent"
            keepMounted={true}
            PaperProps={{
                style: {
                    resize: "both",
                    overflow: "auto",
                    minWidth: drawerWidth,
                    maxWidth: drawerWidth,
                    backgroundColor: "#1F2023",
                    color: "white",
                    fontSize: 18,
                    borderLeft: theme.palette.defaultBorder,
                    marginTop: 100,
                    borderRadius: "5px 0px 0px 0px",
                },
            }}
        >
            <div style={{ backgroundColor: "#f86a3e", display: "flex", }}>
                <Typography variant="h6" style={{ flex: 5, marginTop: 20, marginLeft: 20, marginBottom: 20, }}>
                    Getting Started
                </Typography>
                <Tooltip
                    title="Close drawer"
                    placement="top"
                >
                    <IconButton
                        style={{ flex: 1, }}
                        onClick={(e) => {
                            e.preventDefault();
                            setDrawerOpen(false)

                            localStorage.setItem(sidebarKey, "closed");
                        }}
                    >
                        <ArrowRightIcon style={{ color: "white" }} />
                    </IconButton>
                </Tooltip>
            </div>
            <div style={{ padding: 20, }}>
                <Typography variant="body2">
                    Setup progress: <b>{isNaN(percentDone) ? 0 : percentDone}%</b>
                </Typography>

                <LinearProgress color="primary" variant="determinate" value={percentDone} style={{ marginTop: 5, height: 7, borderRadius: theme.palette?.borderRadius, }} />

                <Typography variant="body2" style={{ marginTop: 20, }}>
                    Follow these steps to get you up and running!
                </Typography>
                <Divider style={{ marginTop: 20, }} />
                <Typography variant="body2" style={{ color: "#f86a3e", marginTop: 20, cursor: "pointer", }} onClick={() => {
                    setVideoViewOpen(true)
                }}>
                    <b>Watch 2-min introduction video</b>
                </Typography>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", }}>
                {gettingStartedItems.map((item, index) => {
                    return (
                        <GettingStartedItem key={index} item={item} index={index} />
                    )
                })}
            </div>
        </Drawer>

    const videoView =
        <Dialog
            open={videoViewOpen}
            onClose={() => {
                setVideoViewOpen(false)
            }}
            PaperProps={{
                style: {
                    backgroundColor: theme.palette.surfaceColor,
                    color: "white",
                    minWidth: 560,
                    minHeight: 415,
                    textAlign: "center",
                },
            }}
        >
            <DialogTitle>
                Welcome to Shuffle!
            </DialogTitle>

            <Tooltip
                title="Close window"
                placement="top"
                style={{ zIndex: 10011 }}
            >
                <IconButton
                    style={{ zIndex: 5000, position: "absolute", top: 10, right: 34 }}
                    onClick={(e) => {
                        e.preventDefault();
                        setVideoViewOpen(false)
                    }}
                >
                    <CloseIcon style={{ color: "white" }} />
                </IconButton>
            </Tooltip>

            <iframe
                width="560"
                height="315"
                style={{ margin: "0px auto 0px auto", width: 560, height: 315, }}
                src="https://www.youtube-nocookie.com/embed/rO7k9q3OgC0"
                title="Introduction video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
            >
            </iframe>
        </Dialog>

    //isLoaded && isLoggedIn && workflowDone ? (
    const loadedCheck =
        workflowDone ? (
            <div>
                {/*
				<ShepherdTour steps={newSteps} tourOptions={tourOptions}>
					<TourButton />
				</ShepherdTour>
				*/}
                <DropzoneWrapper onDrop={uploadFile} WorkflowView={WorkflowView} />
                {/* {modalView} */}
                {deleteModal}
                {exportVerifyModal}
                {publishModal}
                {workflowDownloadModalOpen}

                {/*!drawerOpen ? 
			<div style={{ position: "fixed", top: 64, right: -5, backgroundColor: theme.palette.inputColor, borderRadius: theme.palette?.borderRadius, }}>
          		<Tooltip title={`Getting Started`} placement="bottom">
					<IconButton onClick={() => {
						setDrawerOpen(true)
						localStorage.setItem(sidebarKey, "open");
					}}>
						<ArrowLeftIcon /> 
					</IconButton>
				</Tooltip>
			</div> : null*/}
                {isMobile ? null : gettingStartedDrawer}
                {videoView}

                {modalOpen === true ?
                    <EditWorkflow
                        globalUrl={globalUrl}
                        userdata={userdata}
                        workflow={editingWorkflow}
                        setWorkflow={setEditingWorkflow}
                        modalOpen={modalOpen}
                        setModalOpen={setModalOpen}
                        usecases={usecases}
                        setNewWorkflow={setNewWorkflow}
                        appFramework={appFramework}
                        isEditing={isEditing}

                        workflows={workflows}
                        apps={apps}
                        setWorkflows={setWorkflows}
                    />
                    : null}
                {/*<div style={{zIndex: 1, position: "fixed", bottom: 110, right: 110, display: "flex", }}>
					<Typography variant="body1" color="textSecondary" style={{zIndex: 1, marginRight: 0, maxWidth: 150, }}>
						Need assistance? Ask our support team (it's free!).
                                            </Typography>
					<img src="/images/Arrow.png" style={{width: 150, zIndex: 1,}} />
				</div>*/}
            </div>
        ) : (
            <div
                style={{
                    paddingTop: 250,
                    width: 250,
                    margin: "auto",
                    textAlign: "center",
                }}
            >
                <CircularProgress />
                <Typography>Loading Workflows</Typography>
            </div>
        );

    const safariStyle = {
        transform: 'scale(0.7)',
        transformOrigin: 'top',
        width: '100%',
        height: '100%',
    }
    // Maybe use gridview or something, idk
    return <div style={isSafari ? safariStyle : {zoom: 0.7, minHeight: "80vh",}}>{loadedCheck}</div>;
};



export default Workflows2;
