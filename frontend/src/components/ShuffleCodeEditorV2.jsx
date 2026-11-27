import React, { useRef, useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import '../codeeditor-index.css';
import {
	Box,
	Button,
	CircularProgress,
	Collapse,
	Dialog,
	IconButton,
	InputBase,
	Popover,
	Switch,
	Tooltip,
	Typography,
} from '@mui/material';
import { isMobile } from "react-device-detect"
import { GetParsedPaths } from "../views/Apps.jsx";
import { validateJson } from "../views/Workflows2.jsx";
import ReactJson from "react-json-view-ssr";
import PaperComponent from "../components/PaperComponent.jsx";

import AceEditor from "react-ace";
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-gruvbox';
import 'ace-builds/src-noconflict/theme-tomorrow';
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";

import {
	Storage as StorageIcon,
	Apps as AppsIcon,
	FavoriteBorder as FavoriteBorderIcon,
	Schedule as ScheduleIcon,
	FormatListNumbered as FormatListNumberedIcon,
	Circle as CircleIcon,
	PlayArrow as PlayArrowIcon,
	AutoFixHigh as AutoFixHighIcon,
	Close as CloseIcon,
	DragIndicator as DragIndicatorIcon,
	RestartAlt as RestartAltIcon,
	ArrowForward as ArrowForwardIcon,
	FormatIndentIncrease as FormatIndentIncreaseIcon,
	Fullscreen as FullscreenIcon,
	FullscreenExit as FullscreenExitIcon,
	Search as SearchIcon,
	ChevronRight as ChevronRightIcon,
	ExpandMore as ExpandMoreIcon,
	ViewSidebar as ViewSidebarIcon,
	Code as CodeIcon,
	DataObject as DataObjectIcon,
	FilterAlt as FilterAltIcon,
	Terminal as TerminalIcon,
	VisibilityOutlined as VisibilityIcon,
	UnfoldMore as UnfoldMoreIcon,
	Check as CheckIcon,
} from '@mui/icons-material';

import useShuffleCodeEditor, { liquidFilters, pythonFilters, IndentJsonLikeString } from "./useShuffleCodeEditor.js";

const GOOD_COLOR = "#5ea36a"
const BAD_COLOR = "#c0504a"
const ACCENT = "#FF8544"
const EDITOR_BACKGROUND = "#1A1A1A"
const LIGHT_EDITOR_BACKGROUND = "#FAFAFA"
const PANEL_HEADER_HEIGHT = 48
const STATUS_BAR_HEIGHT = 28
const COMPACT_WIDTH = 860
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
const LEFT_DEFAULT = 290
const RIGHT_DEFAULT = 420

const CODE_EDITOR_SETTINGS_KEY = "shuffleCodeEditor"

export const getCodeEditorSettings = () => {
	try {
		const parsed = JSON.parse(localStorage.getItem(CODE_EDITOR_SETTINGS_KEY) || "{}")
		return parsed !== null && typeof parsed === "object" ? parsed : {}
	} catch (e) {
		console.log("Failed to read code editor settings: ", e)
		return {}
	}
}

export const setCodeEditorSetting = (key, value) => {
	try {
		const settings = getCodeEditorSettings()
		settings[key] = value
		localStorage.setItem(CODE_EDITOR_SETTINGS_KEY, JSON.stringify(settings))
	} catch (e) {
		console.log("Failed to save code editor settings: ", e)
	}
}

const readStoredWidth = (key, fallback) => {
	const stored = parseInt(getCodeEditorSettings()[key])
	return isNaN(stored) ? fallback : stored
}

const getParsedPathsForItem = (innerdata) => {
	if (innerdata.type === "workflow_variable") {
		if (typeof innerdata.value === "string") {
			try {
				const parsedValue = JSON.parse(innerdata.value)
				if (typeof parsedValue === "object") {
					return GetParsedPaths(parsedValue, "")
				}
			} catch (e) {
				return GetParsedPaths(innerdata.value, "")
			}
		} else if (typeof innerdata.value === "object") {
			return GetParsedPaths(innerdata.value, "")
		}
		return []
	}

	if (typeof innerdata.example === "object") {
		return GetParsedPaths(innerdata.example, "")
	}

	return []
}

const buildVariablePath = (values) => {
	var path = ("$" + values[0].autocomplete).toLowerCase().replaceAll(" ", "_")
	for (var i = 1; i < values.length; i++) {
		if (values[i].autocomplete.length === 0) {
			continue
		}

		path += values[i].autocomplete
	}

	return path
}

const previewValue = (value) => {
	if (value === undefined || value === null) {
		return ""
	}

	const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value)
	return stringValue.length > 60 ? stringValue.slice(0, 60) + "…" : stringValue
}

const SourceIcon = ({ type, image, size = 16 }) => {
	const style = { fontSize: size, opacity: 0.8, flexShrink: 0 }
	if (type === "action") {
		if (image) return <img src={image} alt="" style={{ width: size, height: size, borderRadius: 3, flexShrink: 0, opacity: 0.9 }} />
		return <AppsIcon style={style} />
	}

	if (type === "workflow_variable" || type === "execution_variable") {
		return <FavoriteBorderIcon style={style} />
	}

	if (type === "Shuffle DB") {
		return <StorageIcon style={style} />
	}

	return <ScheduleIcon style={style} />
}

const Resizer = ({ onResize, theme, }) => {
	const startRef = useRef(null)
	const [dragging, setDragging] = useState(false)

	return (
		<Tooltip title="Drag to resize" placement="top" enterDelay={600} followCursor disableInteractive>
			<Box
				role="separator"
				aria-orientation="vertical"
				className={dragging ? "resizer-active" : ""}
				onPointerDown={(e) => {
					e.preventDefault()
					e.currentTarget.setPointerCapture(e.pointerId)
					startRef.current = e.clientX
					setDragging(true)
				}}
				onPointerMove={(e) => {
					if (startRef.current === null) {
						return
					}

					onResize(e.clientX - startRef.current)
					startRef.current = e.clientX
				}}
				onPointerUp={(e) => {
					startRef.current = null
					setDragging(false)
					e.currentTarget.releasePointerCapture(e.pointerId)
				}}
				sx={{
					width: 9,
					flexShrink: 0,
					cursor: "col-resize",
					position: "relative",
					touchAction: "none",
					"&::before": {
						content: '""',
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 4,
						width: "1px",
						backgroundColor: theme.palette.mode === "dark" ? "#494949" : "#CCCCCC",
						transition: "background-color 0.15s ease, width 0.15s ease, left 0.15s ease",
					},
					"&:hover::before, &.resizer-active::before": {
						left: 3,
						width: "3px",
						backgroundColor: ACCENT,
					},
					"&:hover .resizer-grip, &.resizer-active .resizer-grip": {
						borderColor: ACCENT,
						backgroundColor: ACCENT,
					},
					"&:hover .resizer-grip span, &.resizer-active .resizer-grip span": {
						backgroundColor: "#fff",
					},
				}}
			>
				<Box
					className="resizer-grip"
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 9,
						height: 32,
						borderRadius: 4,
						border: `1px solid ${theme.palette.mode === "dark" ? "#494949" : "#CCCCCC"}`,
						backgroundColor: theme.palette.platformColor,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "3px",
						transition: "background-color 0.15s ease, border-color 0.15s ease",
						pointerEvents: "none",
						"& span": {
							width: 3,
							height: 3,
							borderRadius: "50%",
							backgroundColor: theme.palette.text.secondary,
							transition: "background-color 0.15s ease",
						},
					}}
				>
					<span />
					<span />
					<span />
				</Box>
			</Box>
		</Tooltip>
	)
}

const PanelTabs = ({ tabs, value, onChange, theme, iconOnly, }) => {
	return (
		<Box sx={{ display: "flex", gap: 0.5, minWidth: 0, overflow: "hidden", }}>
			{tabs.map((tab) => {
				const active = tab.value === value
				const compact = iconOnly === true && tab.icon !== undefined
				return (
					<Tooltip key={tab.value} title={compact ? tab.label : ""} placement="top" disableInteractive>
					<Button
						size="small"
						aria-label={tab.label}
						onClick={() => onChange(tab.value)}
						startIcon={compact ? undefined : tab.icon}
						sx={{
							textTransform: "none",
							whiteSpace: "nowrap",
							flexShrink: 0,
							minWidth: 0,
							px: compact ? 1 : 1.25,
							height: 28,
							fontSize: 13,
							fontWeight: active ? 600 : 400,
							color: active ? theme.palette.text.primary : theme.palette.text.secondary,
							backgroundColor: active ? theme.palette.hoverColor : "transparent",
							borderRadius: 1.5,
							"&:hover": {
								backgroundColor: theme.palette.hoverColor,
							},
						}}
					>
						{compact ? tab.icon : tab.label}
					</Button>
					</Tooltip>
				)
			})}
		</Box>
	)
}

const ToolbarButton = ({ title, onClick, disabled, children, }) => {
	return (
		<Tooltip title={title} placement="top">
			<span>
				<IconButton size="small" onClick={onClick} disabled={disabled} sx={{ borderRadius: 1.5, }}>
					{children}
				</IconButton>
			</span>
		</Tooltip>
	)
}

const VariableRow = ({ label, path, example, depth, icon, onInsert, onDragStateChange, theme, expandable, expanded, onToggle, bold, }) => {
	return (
		<Tooltip
			title={
				<Box sx={{ py: 0.25, maxWidth: 320, }}>
					<Box sx={{ fontWeight: 600, fontSize: 13, wordBreak: "break-word", }}>{label}</Box>
					<Box sx={{ fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: 11, opacity: 0.75, wordBreak: "break-all", mt: 0.25, }}>{path}</Box>
					{example ?
						<Box sx={{ fontSize: 12, mt: 0.75, pt: 0.75, borderTop: "1px solid rgba(255,255,255,0.12)", wordBreak: "break-word", }}>
							<span style={{ opacity: 0.6, }}>Example: </span>{previewValue(example)}
						</Box>
						: null}
				</Box>
			}
			placement="right"
			enterDelay={500}
			disableInteractive
		>
			<Box
				draggable
				onDragStart={(e) => {
					e.dataTransfer.setData("text/plain", path)
					e.dataTransfer.effectAllowed = "copy"
					onDragStateChange(true)
				}}
				onDragEnd={() => onDragStateChange(false)}
				onClick={() => expandable && !expanded ? onToggle() : onInsert()}
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.75,
					minHeight: 30,
					pl: 1 + depth * 1.5,
					pr: 1,
					cursor: expandable && !expanded ? "pointer" : "grab",
					borderRadius: 1.5,
					userSelect: "none",
					"&:hover": {
						backgroundColor: theme.palette.hoverColor,
					},
					"&:hover .variable-path": {
						opacity: 1,
					},
					"&:active": {
						cursor: expandable && !expanded ? "pointer" : "grabbing",
					},
				}}
			>
				{expandable ?
					<IconButton
						size="small"
						sx={{ p: 0.25, ml: -0.5, }}
						onClick={(e) => {
							e.stopPropagation()
							onToggle()
						}}
					>
						{expanded ? <ExpandMoreIcon style={{ fontSize: 16 }} /> : <ChevronRightIcon style={{ fontSize: 16 }} />}
					</IconButton>
					: null}
				{icon}
				<Typography
					variant="body2"
					noWrap
					sx={{ fontWeight: bold ? 600 : 400, fontSize: 13, flexShrink: 1, minWidth: 0, }}
				>
					{label}
				</Typography>
				<Typography
					className="variable-path"
					variant="caption"
					noWrap
					sx={{
						ml: "auto",
						pl: 1,
						opacity: 0,
						fontFamily: "'JetBrains Mono', Consolas, monospace",
						fontSize: 11,
						color: theme.palette.text.secondary,
						maxWidth: "55%",
						transition: "opacity 0.1s ease",
					}}
				>
					{path}
				</Typography>
			</Box>
		</Tooltip>
	)
}

const VariableSource = ({ innerdata, parsedPaths, search, onInsert, onDragStateChange, theme, }) => {
	const [expanded, setExpanded] = useState(false)

	const displayName = innerdata?.name === "Execution Argument" ? "Runtime Argument" : innerdata?.name
	const rootPath = buildVariablePath([innerdata])
	const query = search.trim().toLowerCase()

	const visiblePaths = query.length === 0 ? parsedPaths : parsedPaths.filter((pathdata) => {
		return buildVariablePath([innerdata, pathdata]).toLowerCase().includes(query)
	})

	const rootMatches = query.length === 0 || (displayName || "").toLowerCase().includes(query) || rootPath.includes(query)
	if (!rootMatches && visiblePaths.length === 0) {
		return null
	}

	const isOpen = query.length > 0 ? visiblePaths.length > 0 : expanded

	const isAction = innerdata.type === "action"

	return (
		<Box sx={{
			mb: 0.25,
			position: "relative",
			pl: isAction ? 1.5 : 0,
			"&::before": isAction ? {
				content: '""',
				position: "absolute",
				left: 0,
				top: "50%",
				width: 10,
				height: "1px",
				background: "rgba(255,255,255,0.1)",
			} : {},
		}}>
			<VariableRow
				label={displayName}
				path={rootPath}
				example={innerdata.type === "workflow_variable" ? innerdata.value : innerdata.example}
				depth={0}
				icon={<SourceIcon type={innerdata.type} image={innerdata.large_image} />}
				onInsert={() => onInsert([innerdata])}
				onDragStateChange={onDragStateChange}
				theme={theme}
				expandable={parsedPaths.length > 0}
				expanded={isOpen}
				onToggle={() => setExpanded(!expanded)}
				bold
			/>
			{parsedPaths.length > 0 ?
				<Collapse in={isOpen} unmountOnExit>
					<Box sx={{ borderLeft: `1px solid ${theme.palette.hoverColor}`, ml: 2, }}>
						{visiblePaths.map((pathdata) => {
							const namesplit = pathdata.name.split(".")
							const label = namesplit[namesplit.length - 1]
							const depth = Math.max((pathdata.name.match(/\./g) || []).length, 0)
							const icon = pathdata.type === "list" ?
								<FormatListNumberedIcon style={{ fontSize: 14, opacity: 0.7, flexShrink: 0, }} />
								: pathdata.type === "object" ?
									<CircleIcon style={{ fontSize: 8, color: "#82ccc3", flexShrink: 0, margin: "0 3px", }} />
									: <span style={{ width: 14, flexShrink: 0, }} />

							return (
								<VariableRow
									key={pathdata.name + pathdata.autocomplete}
									label={pathdata.type === "list" ? "list (all items)" : label}
									path={buildVariablePath([innerdata, pathdata])}
									example={pathdata.value}
									depth={depth}
									icon={icon}
									onInsert={() => onInsert([innerdata, pathdata])}
									onDragStateChange={onDragStateChange}
									theme={theme}
								/>
							)
						})}
					</Box>
				</Collapse>
				: null}
		</Box>
	)
}

const SnippetRow = ({ title, code, dragText, onInsert, onDragStateChange, theme, }) => {
	return (
		<Box
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData("text/plain", dragText !== undefined ? dragText : code)
				e.dataTransfer.effectAllowed = "copy"
				onDragStateChange(true)
			}}
			onDragEnd={() => onDragStateChange(false)}
			onClick={onInsert}
			sx={{
				px: 1.25,
				py: 1,
				mb: 0.75,
				cursor: "grab",
				borderRadius: 1.5,
				border: theme.palette.defaultBorder,
				"&:hover": {
					backgroundColor: theme.palette.hoverColor,
					borderColor: ACCENT,
				},
			}}
		>
			<Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, mb: 0.5, }}>
				{title}
			</Typography>
			<Typography
				component="pre"
				sx={{
					m: 0,
					fontFamily: "'JetBrains Mono', Consolas, monospace",
					fontSize: 11,
					color: theme.palette.text.secondary,
					whiteSpace: "pre-wrap",
					wordBreak: "break-all",
					maxHeight: 54,
					overflow: "hidden",
				}}
			>
				{code}
			</Typography>
		</Box>
	)
}

const getEditableFields = (action) => {
	if (action === undefined || action === null || !Array.isArray(action.parameters)) {
		return []
	}

	return action.parameters.filter((param) => !(Array.isArray(param.options) && param.options.length > 0))
}

const orderActionsByFlow = (actions, branches, startId) => {
	const depth = {}
	const ids = new Set(actions.map((action) => action.id))
	const outgoing = {}
	for (const branch of Array.isArray(branches) ? branches : []) {
		if (!outgoing[branch.source_id]) {
			outgoing[branch.source_id] = []
		}

		outgoing[branch.source_id].push(branch.destination_id)
	}

	const roots = ids.has(startId) ? [startId] : []
	for (const action of actions) {
		if (action.isStartNode === true && !roots.includes(action.id)) {
			roots.push(action.id)
		}
	}

	const queue = roots.map((id) => [id, 0])
	while (queue.length > 0) {
		const [id, level] = queue.shift()
		if (depth[id] !== undefined && depth[id] <= level) {
			continue
		}

		depth[id] = level
		for (const next of outgoing[id] || []) {
			queue.push([next, level + 1])
		}
	}

	const position = (action) => action.position || { x: 0, y: 0 }
	return [...actions].sort((a, b) => {
		const depthA = depth[a.id] === undefined ? Infinity : depth[a.id]
		const depthB = depth[b.id] === undefined ? Infinity : depth[b.id]
		if (depthA !== depthB) {
			return depthA - depthB
		}

		if (depthA === Infinity) {
			return position(a).x - position(b).x || position(a).y - position(b).y
		}

		return position(a).y - position(b).y
	})
}

const FieldSwitcher = ({ anchorEl, onClose, actions, branches, startId, currentActionId, currentField, onSelect, theme, }) => {
	const [search, setSearch] = useState("")
	const [expanded, setExpanded] = useState({ [currentActionId]: true })

	const query = search.trim().toLowerCase()
	const orderedActions = useMemo(() => orderActionsByFlow(actions, branches, startId), [actions, branches, startId])
	const currentRowRef = useRef(null)

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (currentRowRef.current !== null) {
				currentRowRef.current.scrollIntoView({ block: "nearest" })
			}
		}, 50)

		return () => clearTimeout(timeout)
	}, [])

	return (
		<Popover
			open={Boolean(anchorEl)}
			anchorEl={anchorEl}
			onClose={onClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "left", }}
			transformOrigin={{ vertical: "top", horizontal: "left", }}
			PaperProps={{
				sx: {
					mt: 0.75,
					width: 340,
					maxHeight: 460,
					display: "flex",
					flexDirection: "column",
					backgroundColor: theme.palette.platformColor,
					backgroundImage: "none",
					border: theme.palette.defaultBorder,
					borderRadius: `${theme.palette.borderRadius}px`,
				},
			}}
		>
			<Box sx={{ p: 1, borderBottom: theme.palette.defaultBorder, flexShrink: 0, }}>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						px: 1,
						height: 32,
						borderRadius: 1.5,
						border: theme.palette.defaultBorder,
						backgroundColor: theme.palette.mode === "dark" ? EDITOR_BACKGROUND : theme.palette.inputColor,
					}}
				>
					<SearchIcon style={{ fontSize: 16, opacity: 0.6, }} />
					<InputBase
						autoFocus
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search apps or fields"
						sx={{ fontSize: 13, flex: 1, }}
					/>
				</Box>
			</Box>
			<Box sx={{ overflowY: "auto", p: 0.5, scrollbarColor: theme.palette.scrollbarColorTransparent, }}>
				{orderedActions.map((action) => {
					const label = action.label || action.name || "Untitled"
					const labelMatches = label.toLowerCase().includes(query)
					const fields = getEditableFields(action).filter((field) => query.length === 0 || labelMatches || field.name.toLowerCase().includes(query))
					if (fields.length === 0) {
						return null
					}

					const isOpen = query.length > 0 || expanded[action.id] === true
					return (
						<Box key={action.id} sx={{ mb: 0.25, }}>
							<Box
								ref={action.id === currentActionId ? currentRowRef : undefined}
								onClick={() => setExpanded({ ...expanded, [action.id]: !expanded[action.id] })}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									px: 1,
									minHeight: 34,
									borderRadius: 1.5,
									cursor: "pointer",
									backgroundColor: action.id === currentActionId ? "rgba(255, 133, 68, 0.12)" : "transparent",
									"&:hover": {
										backgroundColor: action.id === currentActionId ? "rgba(255, 133, 68, 0.2)" : theme.palette.hoverColor,
									},
								}}
							>
								{isOpen ? <ExpandMoreIcon style={{ fontSize: 16, opacity: 0.7, }} /> : <ChevronRightIcon style={{ fontSize: 16, opacity: 0.7, }} />}
								{action.large_image ?
									<img src={action.large_image} alt="" style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, }} />
									: <AppsIcon style={{ fontSize: 18, opacity: 0.7, }} />}
								<Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0, }}>
									{label}
								</Typography>
							</Box>
							{isOpen ?
								<Box sx={{ ml: 3.5, borderLeft: `1px solid ${theme.palette.hoverColor}`, }}>
									{fields.map((field) => {
										const isCurrent = action.id === currentActionId && field.name === currentField
										return (
											<Box
												key={field.name}
												onClick={() => onSelect(action.id, field.name)}
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
													pl: 1.25,
													pr: 1,
													minHeight: 30,
													ml: 0.5,
													borderRadius: 1.5,
													cursor: isCurrent ? "default" : "pointer",
													backgroundColor: isCurrent ? theme.palette.hoverColor : "transparent",
													"&:hover": {
														backgroundColor: theme.palette.hoverColor,
													},
												}}
											>
												<Typography
													variant="body2"
													noWrap
													sx={{
														flex: 1,
														minWidth: 0,
														fontSize: 12,
														fontFamily: "'JetBrains Mono', Consolas, monospace",
														color: isCurrent ? theme.palette.text.primary : theme.palette.text.secondary,
													}}
												>
													{field.name}
												</Typography>
												{isCurrent ? <CheckIcon style={{ fontSize: 15, color: ACCENT, }} /> : null}
											</Box>
										)
									})}
								</Box>
								: null}
						</Box>
					)
				})}
			</Box>
		</Popover>
	)
}

const ShuffleCodeEditorV2 = (props) => {
	const {
		cy,
		fieldCount,
		actionlist,
		changeActionParameterCodeMirror,
		expansionModalOpen,
		setExpansionModalOpen,
		handleActionParamChange,
		setcodedata,
		isFileEditor,
		isWorkflowEditor,
		runUpdateText,
		parameterName,
		selectedEdge,
		activeDialog,
		setActiveDialog,
		contentLoading,
		editorData,
		handleTriggerParamChange,
		fullScreenMode,
		fixExample,
		handleConditionFieldChange,
		onSwitchExperience,
		carriedCode,
		embedded,
		headerTitle,
		headerActions,
		extraOutputTabs,
		outputTabRequest,
		onSave,
		defaultLeftTab,
		selectedAction: selectedActionProp,
		onSwitchField,
		workflow,
	} = props

	const {
		theme,
		navigate,
		localcodedata,
		setlocalcodedata,
		validation,
		expOutput,
		markers,
		availableVariables,
		selectedAction,
		setSelectedAction,
		selectedTrigger,
		actionId,
		appName,
		fieldName,
		triggerId,
		triggerField,
		triggerName,
		conditionId,
		conditionField,
		currentCharacter,
		setCurrentCharacter,
		currentLine,
		setCurrentLine,
		findIndex,
		executing,
		executionResult,
		setExecutionResult,
		fullScreenModeEnabled,
		setFullScreenModeEnabled,
		highlight_variables,
		expectedOutput,
		handleItemClick,
		handleClick,
		executeSingleAction,
		HandleJsonCopy,
		customCompleter,
		editorLoad,
	} = useShuffleCodeEditor(props)

	const editorRef = useRef(null)
	const isDarkMode = theme.palette.mode === "dark"
	const aceTheme = isDarkMode ? "gruvbox" : "tomorrow"
	const editorBackground = isDarkMode ? EDITOR_BACKGROUND : LIGHT_EDITOR_BACKGROUND
	const editorTextColor = isDarkMode ? "#ebdbb2" : "#1A1A1A"
	const submitButtonRef = useRef(null)
	const onSaveRef = useRef(onSave)
	onSaveRef.current = onSave
	const [editorBoxNode, setEditorBoxNode] = useState(null)
	const [bodyNode, setBodyNode] = useState(null)

	const [bodyWidth, setBodyWidth] = useState(window.innerWidth)
	const [leftWidth, setLeftWidth] = useState(() => readStoredWidth("leftWidth", LEFT_DEFAULT))
	const [rightWidth, setRightWidth] = useState(() => readStoredWidth("rightWidth", RIGHT_DEFAULT))
	const [leftOpen, setLeftOpen] = useState(getCodeEditorSettings().leftOpen !== false)
	const [leftTab, setLeftTab] = useState(defaultLeftTab || "variables")
	const [outputTab, setOutputTab] = useState("expected")
	const [compactTab, setCompactTab] = useState("code")
	const [search, setSearch] = useState("")
	const [draggingInsert, setDraggingInsert] = useState(false)
	const [switcherAnchor, setSwitcherAnchor] = useState(null)
	const isFirstFieldRef = useRef(true)

	const isFieldEditor = !isFileEditor && !isWorkflowEditor
	const isCompact = isMobile || bodyWidth < COMPACT_WIDTH
	const isCondition = actionId === null && triggerId === null

	useEffect(() => {
		if (carriedCode !== undefined && carriedCode !== null) {
			setlocalcodedata(carriedCode)
		}
	}, [])

	useEffect(() => {
		if (embedded === true && selectedActionProp !== undefined && selectedActionProp !== null) {
			setSelectedAction(selectedActionProp)
		}
	}, [embedded, selectedActionProp?.id])

	useEffect(() => {
		if (embedded === true && setcodedata !== undefined) {
			setcodedata(localcodedata)
		}
	}, [embedded, localcodedata])

	useEffect(() => {
		if (outputTabRequest === undefined || outputTabRequest === null || outputTabRequest.tab === undefined) {
			return
		}

		setOutputTab(outputTabRequest.tab)
		if (isCompact) {
			setCompactTab("output")
		}
	}, [outputTabRequest?.nonce])

	useEffect(() => {
		if (bodyNode === null || typeof ResizeObserver === "undefined") {
			return
		}

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setBodyWidth(entry.contentRect.width)
			}
		})

		observer.observe(bodyNode)
		return () => observer.disconnect()
	}, [bodyNode])

	useEffect(() => {
		if (editorBoxNode === null || typeof ResizeObserver === "undefined") {
			return
		}

		const observer = new ResizeObserver(() => {
			if (editorRef.current !== null) {
				editorRef.current.resize()
			}
		})

		observer.observe(editorBoxNode)
		return () => observer.disconnect()
	}, [editorBoxNode])

	useEffect(() => {
		if (executing === true) {
			setOutputTab("result")
			if (isCompact) {
				setCompactTab("output")
			}
		}
	}, [executing])

	useEffect(() => {
		setCodeEditorSetting("leftOpen", leftOpen)
	}, [leftOpen])

	useEffect(() => {
		if (isFirstFieldRef.current) {
			isFirstFieldRef.current = false
			return
		}

		setExecutionResult({
			"valid": false,
			"result": "",
		})
		setOutputTab("expected")
		setTimeout(() => {
			if (editorRef.current !== null) {
				editorRef.current.session.getUndoManager().reset()
			}
		}, 50)
	}, [actionId, fieldName])

	useEffect(() => {
		if (!expansionModalOpen) {
			return
		}

		const handleSaveShortcut = (event) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault()
				if (embedded === true) {
					if (onSaveRef.current !== undefined) {
						onSaveRef.current()
					}
				} else if (submitButtonRef.current !== null && !submitButtonRef.current.disabled) {
					submitButtonRef.current.click()
				}
			}
		}

		document.addEventListener("keydown", handleSaveShortcut)
		return () => document.removeEventListener("keydown", handleSaveShortcut)
	}, [expansionModalOpen])

	const parsedSources = useMemo(() => {
		if (actionlist === undefined || actionlist === null) {
			return []
		}

		var ordered = actionlist
		if (Array.isArray(workflow?.actions) && workflow.actions.length > 0) {
			const rank = {}
			orderActionsByFlow(workflow.actions, workflow.branches, workflow.start).forEach((action, index) => {
				rank[action.id] = index
			})

			const appEntries = actionlist.filter((item) => item.type === "action" && rank[item.id] !== undefined)
			const otherEntries = actionlist.filter((item) => !(item.type === "action" && rank[item.id] !== undefined))
			appEntries.sort((a, b) => rank[a.id] - rank[b.id])
			ordered = [...otherEntries, ...appEntries]
		}

		return ordered.map((innerdata) => ({
			innerdata: innerdata,
			parsedPaths: getParsedPathsForItem(innerdata),
		}))
	}, [actionlist, workflow?.actions, workflow?.branches, workflow?.start])

	const goodMarkers = markers.filter((marker) => marker.className === "good-marker")
	const badMarkers = markers.filter((marker) => marker.className === "bad-marker")

	const focusEditorAt = (row, column) => {
		setTimeout(() => {
			const editor = editorRef.current
			if (editor === null) {
				return
			}

			editor.focus()
			if (row !== undefined && column !== undefined) {
				editor.clearSelection()
				editor.moveCursorTo(row, column)
			}
		}, 0)
	}

	const insertVariable = (values) => {
		const fullPath = buildVariablePath(values)
		const inserted = localcodedata.trim().endsWith("$") ? fullPath.slice(1) : fullPath
		const hasCursor = currentLine !== -1 && currentCharacter !== -1 && localcodedata.split("\n").length > currentLine

		handleItemClick(values)

		if (hasCursor) {
			focusEditorAt(currentLine, currentCharacter + inserted.length)
		} else {
			const lines = (localcodedata + inserted).split("\n")
			focusEditorAt(lines.length - 1, lines[lines.length - 1].length)
		}

		if (isCompact) {
			setCompactTab("code")
		}
	}

	const insertSnippet = (item) => {
		handleClick(item)
		focusEditorAt()

		if (isCompact) {
			setCompactTab("code")
		}
	}

	const insertPythonSnippet = (item) => {
		if (item.disabled) {
			toast.error("This feature may not work in your environment until you update your Shuffle Tools app.", { autoClose: 10000 })
		}

		if (selectedAction.name !== "execute_python") {
			var newitem = JSON.parse(JSON.stringify(item))
			newitem.value = `{% python %}\n${item.value}\n{% endpython %}`
			insertSnippet(newitem)
		} else {
			insertSnippet(item)
		}
	}

	const pythonSnippetText = (item) => {
		if (selectedAction?.name !== "execute_python") {
			return `{% python %}\n${item.value}\n{% endpython %}`
		}

		return item.value
	}

	const jumpToMarker = (marker) => {
		if (marker === undefined || editorRef.current === null) {
			return
		}

		editorRef.current.focus()
		editorRef.current.gotoLine(marker.startRow + 1, marker.startCol, true)
	}

	const handleIndent = () => {
		const indentedText = IndentJsonLikeString(localcodedata, 2)
		if (indentedText !== undefined && indentedText !== null) {
			setlocalcodedata(indentedText)
		} else {
			toast.warn("Could not indent the text. Please check the input format.", { autoClose: 5000 })
		}
	}

	const handleReset = () => {
		if (fixExample !== undefined) {
			const newExample = fixExample(editorData.example)
			setlocalcodedata(newExample)
		} else {
			console.log("No fix example available!")
			setlocalcodedata(editorData.example)
		}
	}

	const handleCancel = () => {
		if (isFileEditor !== true) {
			navigate("")
		}

		setExpansionModalOpen(false)
	}

	const handleSubmit = (event) => {
		if (isWorkflowEditor === true) {
			setExpansionModalOpen(false)
			navigate("")
			return
		}

		if (isFileEditor !== true) {
			navigate("")
		}

		applyCurrentField(event)
		setExpansionModalOpen(false)
	}

	const applyCurrentField = (event) => {
		var fixedcodedata = localcodedata
		const valid = validateJson(localcodedata, true)
		if (valid.valid) {
			fixedcodedata = JSON.stringify(valid.result)
		}

		if (isFileEditor === true) {
			runUpdateText(fixedcodedata);
			setcodedata(fixedcodedata);
		} else if (changeActionParameterCodeMirror !== undefined) {
			changeActionParameterCodeMirror(event, fieldCount, fixedcodedata, actionlist, parameterName, selectedAction, setSelectedAction)
			setcodedata(fixedcodedata)
		}

		if (conditionField !== null && handleConditionFieldChange !== undefined) {
			handleConditionFieldChange(conditionField, fixedcodedata);
		}
		else if (actionId !== undefined && actionId !== null && actionId.length > 0) {
			handleActionParamChange(actionId, fieldName, fixedcodedata)
		}
		else if (triggerId !== undefined && triggerId !== null && triggerId.length > 0) {
			handleTriggerParamChange(triggerId, triggerField, fixedcodedata)
		}
	}

	const canSwitchFields = isFieldEditor && onSwitchField !== undefined && actionId !== undefined && actionId !== null && actionId.length > 0 && Array.isArray(workflow?.actions) && workflow.actions.length > 0

	const handleSwitchField = (targetActionId, targetField) => {
		setSwitcherAnchor(null)
		if (targetActionId === actionId && targetField === fieldName) {
			return
		}

		const openedValue = editorData?.value === undefined || editorData?.value === null ? "" : editorData.value
		if (localcodedata !== openedValue) {
			applyCurrentField({ target: { value: "" } })
		}

		onSwitchField(targetActionId, targetField)
	}

	const editorMode = isWorkflowEditor ? "yaml" : selectedAction === undefined ? "json" : selectedAction.name === "execute_python" ? "python" : selectedAction.name === "execute_bash" ? "bash" : "json"
	const zIndex = activeDialog === "codeeditor" ? 1310 : 1100

	if (fullScreenMode && fullScreenModeEnabled === true) {
		return (
			<AceEditor
				mode="python"
				theme={aceTheme}
				value={localcodedata}
				onChange={(value, editor) => {
					setlocalcodedata(value)
					setcodedata(value)
				}}
				name="python-editor"
				fontSize={14}
				width="100%"
				height="100%"
				showPrintMargin={false}
				showGutter={true}
				markers={markers}
				highlightActiveLine={false}
				enableBasicAutocompletion={true}
				style={{
					wordBreak: "break-word",
					marginTop: 0,
					paddingBottom: 10,
					overflowY: "auto",
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
					zIndex: zIndex,
				}}
				setOptions={{
					enableBasicAutocompletion: true,
					enableLiveAutocompletion: true,
					enableSnippets: true,
					showLineNumbers: true,
					tabSize: 4,
					fontFamily: "'JetBrains Mono', Consolas, monospace",
					useSoftTabs: true
				}}
			/>
		)
	}

	var sourceImage = ""
	var targetImage = ""
	if (cy !== undefined && cy !== null) {
		sourceImage = cy.getElementById(selectedEdge?.source)?.data()?.large_image
		targetImage = cy.getElementById(selectedEdge?.target)?.data()?.large_image
	}

	const prettyName = (name) => {
		if (name === undefined || name === null) {
			return ""
		}

		const spaced = name.replaceAll("_", " ")
		return spaced.slice(0, 1).toUpperCase() + spaced.slice(1)
	}

	const headerImage = triggerId ? selectedTrigger?.large_image : selectedAction?.large_image

	const renderTitle = () => {
		if (isFileEditor) {
			return (
				<Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0, }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, }} noWrap>File Editor</Typography>
					<Typography variant="caption" color="textSecondary">{localcodedata.length} chars</Typography>
				</Box>
			)
		}

		if (isWorkflowEditor) {
			return <Typography variant="subtitle1" sx={{ fontWeight: 600, }} noWrap>Workflow YAML</Typography>
		}

		if (isCondition) {
			const edgeConditions = Array.isArray(selectedEdge?.conditions) ? selectedEdge.conditions : []
			const foundConditionIndex = edgeConditions.findIndex(cond => cond?.condition?.id === conditionId || cond?.source?.id === conditionId || cond?.destination?.id === conditionId)
			const conditionIndex = foundConditionIndex === -1 ? edgeConditions.length + 1 : foundConditionIndex + 1
			const imageStyle = (active) => ({
				width: 26,
				height: 26,
				borderRadius: "50%",
				border: active ? `2px solid ${ACCENT}` : theme.palette.defaultBorder,
			})

			return (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600, }} noWrap>Condition {conditionIndex}</Typography>
					{selectedEdge?.source ?
						<Tooltip title="Source"><img src={sourceImage || ""} alt="Source" style={imageStyle(conditionField === "source")} /></Tooltip>
						: null}
					{selectedEdge && Object.keys(selectedEdge).length > 0 ?
						<ArrowForwardIcon style={{ fontSize: 16, color: theme.palette.text.secondary, }} />
						: null}
					{selectedEdge?.target ?
						<Tooltip title="Destination"><img src={targetImage || ""} alt="Destination" style={imageStyle(conditionField === "destination")} /></Tooltip>
						: null}
					{conditionField ?
						<Typography variant="caption" color="textSecondary" noWrap>editing {conditionField}</Typography>
						: null}
				</Box>
			)
		}

		const isCode = selectedAction?.name === "execute_python" || selectedAction?.name === "execute_bash"
		const title = triggerId ? prettyName(triggerName) : prettyName(appName)
		const field = triggerId ? triggerField : fieldName

		return (
			<Tooltip title={canSwitchFields ? "Switch app or field" : ""} placement="bottom" disableInteractive>
			<Box
				onMouseDown={canSwitchFields ? (e) => e.stopPropagation() : undefined}
				onClick={canSwitchFields ? (e) => setSwitcherAnchor(e.currentTarget) : undefined}
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					minWidth: 0,
					px: canSwitchFields ? 1 : 0,
					ml: canSwitchFields ? -1 : 0,
					py: 0.5,
					borderRadius: 1.5,
					cursor: canSwitchFields ? "pointer" : "inherit",
					backgroundColor: switcherAnchor !== null ? theme.palette.hoverColor : "transparent",
					"&:hover": canSwitchFields ? {
						backgroundColor: theme.palette.hoverColor,
					} : {},
				}}
			>
				{headerImage ?
					<img src={headerImage} alt="" style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, }} />
					: null}
				<Typography variant="subtitle1" sx={{ fontWeight: 600, }} noWrap>
					{isCode ? "Code to run" : title}
				</Typography>
				{field && !isCode ?
					<Box
						component="span"
						sx={{
							px: 1,
							py: 0.25,
							borderRadius: 1,
							fontSize: 12,
							fontFamily: "'JetBrains Mono', Consolas, monospace",
							backgroundColor: theme.palette.hoverColor,
							color: theme.palette.text.secondary,
							whiteSpace: "nowrap",
						}}
					>
						{field}
					</Box>
					: null}
				{canSwitchFields ? <UnfoldMoreIcon style={{ fontSize: 18, opacity: 0.6, flexShrink: 0, }} /> : null}
			</Box>
			</Tooltip>
		)
	}

	const leftPanel = (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%", }}>
			<Box sx={{ px: 1.5, height: PANEL_HEADER_HEIGHT, flexShrink: 0, display: "flex", alignItems: "center", borderBottom: theme.palette.defaultBorder, }}>
				<PanelTabs
					theme={theme}
					iconOnly={!isCompact && leftWidth < 280}
					value={leftTab}
					onChange={setLeftTab}
					tabs={[
						{ value: "variables", label: "Variables", icon: <DataObjectIcon style={{ fontSize: 16 }} /> },
						{ value: "liquid", label: "Filters", icon: <FilterAltIcon style={{ fontSize: 16 }} /> },
						{ value: "python", label: "Python", icon: <TerminalIcon style={{ fontSize: 16 }} /> },
					]}
				/>
			</Box>

			{leftTab === "variables" ?
				<>
					<Box sx={{ px: 1.5, pt: 1.25, pb: 1, }}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								px: 1,
								height: 32,
								borderRadius: 1.5,
								border: theme.palette.defaultBorder,
								backgroundColor: theme.palette.mode === "dark" ? EDITOR_BACKGROUND : theme.palette.inputColor,
							}}
						>
							<SearchIcon style={{ fontSize: 16, opacity: 0.6, }} />
							<InputBase
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search variables or paths"
								sx={{ fontSize: 13, flex: 1, }}
							/>
							{search.length > 0 ?
								<IconButton size="small" sx={{ p: 0.25, }} onClick={() => setSearch("")}>
									<CloseIcon style={{ fontSize: 14 }} />
								</IconButton>
								: null}
						</Box>
						<Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 0.75, }}>
							Click to insert at cursor, or drag into the editor
						</Typography>
					</Box>
					<Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1, scrollbarColor: theme.palette.scrollbarColorTransparent, }}>
						{parsedSources.length === 0 ?
							<Typography variant="body2" color="textSecondary" sx={{ px: 1, py: 2, }}>
								No variables available yet. Run the workflow once to get example data from previous nodes.
							</Typography>
							:
							<>
								{parsedSources.filter(s => s.innerdata.type !== "action").map((source, index) => (
									<VariableSource
										key={(source.innerdata.id || source.innerdata.name) + index}
										innerdata={source.innerdata}
										parsedPaths={source.parsedPaths}
										search={search}
										onInsert={insertVariable}
										onDragStateChange={setDraggingInsert}
										theme={theme}
									/>
								))}
								{parsedSources.some(s => s.innerdata.type === "action") && (
									<Box sx={{ borderLeft: "1px solid rgba(255,255,255,0.08)", ml: 1, }}>
										{parsedSources.filter(s => s.innerdata.type === "action").map((source, index) => (
											<VariableSource
												key={(source.innerdata.id || source.innerdata.name) + index}
												innerdata={source.innerdata}
												parsedPaths={source.parsedPaths}
												search={search}
												onInsert={insertVariable}
												onDragStateChange={setDraggingInsert}
												theme={theme}
											/>
										))}
									</Box>
								)}
							</>
						}
					</Box>
				</>
				: null}

			{leftTab === "liquid" ?
				<Box sx={{ flex: 1, overflowY: "auto", px: 1.5, pt: 1.25, pb: 1, }}>
					<Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1, }}>
						Liquid filters transform values, e.g. {"{{ $node.value | size }}"}
					</Typography>
					{liquidFilters.map((item, index) => (
						<SnippetRow
							key={index}
							title={item.name}
							code={item.example || item.value}
							dragText={item.value}
							onInsert={() => insertSnippet(item)}
							onDragStateChange={setDraggingInsert}
							theme={theme}
						/>
					))}
				</Box>
				: null}

			{leftTab === "python" ?
				<Box sx={{ flex: 1, overflowY: "auto", px: 1.5, pt: 1.25, pb: 1, }}>
					<Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1, }}>
						{selectedAction?.name === "execute_python" ? "Inserted as Python code" : "Inserted wrapped in {% python %} tags"}
					</Typography>
					{pythonFilters.map((item, index) => (
						<SnippetRow
							key={index}
							title={item.name}
							code={item.value}
							dragText={pythonSnippetText(item)}
							onInsert={() => insertPythonSnippet(item)}
							onDragStateChange={(dragging) => {
								setDraggingInsert(dragging)
								if (dragging && item.disabled) {
									toast.error("This feature may not work in your environment until you update your Shuffle Tools app.", { autoClose: 10000 })
								}
							}}
							theme={theme}
						/>
					))}
				</Box>
				: null}
		</Box>
	)

	const showEditor = (availableVariables !== undefined && availableVariables !== null && availableVariables.length > 0) || isFileEditor || isWorkflowEditor

	const editorPanel = (
		<Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, minHeight: 0, }}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					px: 1,
					height: PANEL_HEADER_HEIGHT,
					flexShrink: 0,
					borderBottom: theme.palette.defaultBorder,
				}}
			>
				{isFieldEditor && !isCompact ?
					<ToolbarButton title={leftOpen ? "Hide side panel" : "Show variables, filters and snippets"} onClick={() => setLeftOpen(!leftOpen)}>
						<ViewSidebarIcon style={{ fontSize: 18, transform: "scaleX(-1)", color: leftOpen ? ACCENT : undefined, }} />
					</ToolbarButton>
					: null}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						px: 1,
						height: 24,
						borderRadius: 1,
						fontSize: 12,
						textTransform: "uppercase",
						letterSpacing: 0.5,
						color: theme.palette.text.secondary,
						backgroundColor: theme.palette.hoverColor,
					}}
				>
					<CodeIcon style={{ fontSize: 14 }} />
					{editorMode}
				</Box>

				<Box sx={{ flex: 1, }} />

				<ToolbarButton
					title="Indent text"
					onClick={handleIndent}
					disabled={localcodedata === undefined || localcodedata === null || localcodedata.length === 0}
				>
					<FormatIndentIncreaseIcon style={{ fontSize: 18 }} />
				</ToolbarButton>
				{!isFileEditor ?
					<>
						<ToolbarButton
							title="Reset to example body"
							onClick={handleReset}
							disabled={editorData === undefined || editorData.example === undefined || editorData.example === null || editorData.example.length === 0}
						>
							<RestartAltIcon style={{ fontSize: 18 }} />
						</ToolbarButton>
						<ToolbarButton title="Code with AI (coming soon)" disabled={true}>
							<AutoFixHighIcon style={{ fontSize: 18 }} />
						</ToolbarButton>
					</>
					: null}
			</Box>

			<Box
				ref={setEditorBoxNode}
				sx={{
					position: "relative",
					flex: 1,
					minHeight: 0,
					backgroundColor: editorBackground,
					outline: draggingInsert ? `2px dashed ${ACCENT}` : "none",
					outlineOffset: -2,
					"& .ace_editor, & .ace_gutter": {
						backgroundColor: `${editorBackground} !important`,
					},
					"& .ace_gutter": {
						borderRight: isDarkMode ? "none" : "1px solid #EFEFEF",
					},
					"& .ace_gutter-active-line": {
						backgroundColor: isDarkMode ? "#212121 !important" : "#EFEFEF !important",
					},
					...(isDarkMode ? {} : {
						"& .good-marker": {
							backgroundColor: "#bfe3c6",
							opacity: 1,
						},
						"& .bad-marker": {
							backgroundColor: "#f5c4bf",
							opacity: 1,
						},
					}),
				}}
			>
				{showEditor ?
					<AceEditor
						id="shuffle-codeeditor"
						name="shuffle-codeeditor"
						value={localcodedata}
						mode={editorMode}
						theme={aceTheme}
						height="100%"
						width="100%"
						fontSize={14}
						markers={markers}
						highlightActiveLine={false}
						enableBasicAutocompletion={true}
						completers={[customCompleter]}
						showPrintMargin={false}
						style={{
							position: "absolute",
							inset: 0,
							wordBreak: "break-word",
							whiteSpace: "pre-wrap",
							wordWrap: "break-word",
							backgroundColor: editorBackground,
						}}
						onLoad={(editor) => {
							editorRef.current = editor
							highlight_variables(localcodedata)
							editorLoad(editor)
						}}
						onCursorChange={(cursorPosition, editor, value) => {
							setCurrentCharacter(cursorPosition.cursor.column)
							setCurrentLine(cursorPosition.cursor.row)
							findIndex(cursorPosition.row, cursorPosition.column)
						}}
						onChange={(value, editor) => {
							setlocalcodedata(value)
							expectedOutput(value)
							highlight_variables(value)
						}}
						setOptions={{
							enableLiveAutocompletion: true,
							enableSnippets: true,
							showLineNumbers: true,
							tabSize: 2,
							wrap: true,
							fontFamily: "'JetBrains Mono', Consolas, monospace",
							useWorker: false,
							enableBasicAutocompletion: [customCompleter],
						}}
					/>
					:
					<Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, color: editorTextColor, }}>
						<CircularProgress size={18} />
						<Typography variant="body2">Loading variables…</Typography>
					</Box>
				}
				{draggingInsert ?
					<Box
						sx={{
							position: "absolute",
							top: 8,
							right: 12,
							px: 1,
							py: 0.5,
							borderRadius: 1,
							fontSize: 12,
							color: "#fff",
							backgroundColor: ACCENT,
							pointerEvents: "none",
							zIndex: 10,
						}}
					>
						Drop to insert at position
					</Box>
					: null}
			</Box>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.5,
					px: 1.5,
					height: STATUS_BAR_HEIGHT,
					flexShrink: 0,
					fontSize: 12,
					color: theme.palette.text.secondary,
					borderTop: theme.palette.defaultBorder,
				}}
			>
				<span>Ln {currentLine === -1 ? 1 : currentLine + 1}, Col {currentCharacter === -1 ? 1 : currentCharacter + 1}</span>
				{isFileEditor ?
					<span style={{ color: validation === true ? GOOD_COLOR : BAD_COLOR, fontWeight: 600, }}>
						{validation === true ? "Valid JSON" : "Invalid JSON"}
					</span>
					: null}
				{!isFileEditor && markers.length > 0 ?
					<>
						<Tooltip title="Variables that resolve to data from previous nodes">
							<Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", }} onClick={() => jumpToMarker(goodMarkers[0])}>
								<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: GOOD_COLOR, }} />
								{goodMarkers.length} found
							</Box>
						</Tooltip>
						{badMarkers.length > 0 ?
							<Tooltip title="Variables that can't be found, or REPLACE_ME placeholders. Click to jump to the first one.">
								<Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: BAD_COLOR, fontWeight: 600, }} onClick={() => jumpToMarker(badMarkers[0])}>
									<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: BAD_COLOR, }} />
									{badMarkers.length} not found
								</Box>
							</Tooltip>
							: null}
					</>
					: null}
				<Box sx={{ flex: 1, }} />
				{isFieldEditor && !isCompact ?
					<span>Type <b>$</b> for autocomplete</span>
					: null}
			</Box>
		</Box>
	)

	const runLabel = selectedAction === undefined ? "Try it" : selectedAction.name === "execute_python" ? "Run Python" : selectedAction.name === "execute_bash" ? "Run Bash" : "Try it"

	const extraTabs = Array.isArray(extraOutputTabs) ? extraOutputTabs : []
	const activeExtraTab = extraTabs.find((tab) => tab.value === outputTab)
	const isOutputNarrow = !isCompact && rightWidth < 400 + extraTabs.length * 120

	const outputPanel = (
		<Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%", }}>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, height: PANEL_HEADER_HEIGHT, flexShrink: 0, borderBottom: theme.palette.defaultBorder, }}>
				<PanelTabs
					theme={theme}
					iconOnly={isOutputNarrow}
					value={outputTab}
					onChange={setOutputTab}
					tabs={[
						{ value: "expected", label: "Expected output", icon: <VisibilityIcon style={{ fontSize: 16 }} /> },
						{ value: "result", label: "Test result", icon: <TerminalIcon style={{ fontSize: 16 }} /> },
						...extraTabs.map((tab) => ({ value: tab.value, label: tab.label, icon: tab.icon })),
					]}
				/>
				<Box sx={{ flex: 1, }} />
				<Tooltip title={`Runs the Shuffle Tools 'repeat back to me' or 'execute python' action with what you see in the expected output. Test Python scripts or Liquid filters without running the whole workflow. Shortcut: ${isMac ? "⌘" : "Ctrl"} + Enter`} placement="top">
					<span>
						<Button
							id="try-it-button"
							size="small"
							variant="outlined"
							disabled={executing}
							onClick={() => {
								executeSingleAction(expOutput)
							}}
							startIcon={executing ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon style={{ fontSize: 18 }} />}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								whiteSpace: "nowrap",
								height: 30,
								borderRadius: 1.5,
								boxShadow: "none",
							}}
						>
							{runLabel}
							{isOutputNarrow ? null :
								<Box component="span" sx={{ ml: 1, fontSize: 11, opacity: 0.75, fontWeight: 400, }}>
									{isMac ? "⌘" : "Ctrl"} ↵
								</Box>
							}
						</Button>
					</span>
				</Tooltip>
			</Box>

			<Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: activeExtraTab !== undefined ? 0 : 1.5, scrollbarColor: theme.palette.scrollbarColorTransparent, }}>
				{activeExtraTab !== undefined ?
					activeExtraTab.content
				: outputTab === "expected" ?
					<>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, }}>
							<Box
								component="span"
								sx={{
									px: 0.75,
									py: 0.25,
									borderRadius: 1,
									fontSize: 11,
									fontWeight: 600,
									color: validation === true ? GOOD_COLOR : theme.palette.text.secondary,
									border: `1px solid ${validation === true ? GOOD_COLOR : theme.palette.hoverColor}`,
								}}
							>
								{validation === true ? "JSON" : "TEXT"}
							</Box>
							<Typography variant="caption" color="textSecondary">
								{validation === true ? "Click a key to copy its path" : "Variables replaced with their last value"}
							</Typography>
						</Box>
						{validation === true ?
							<ReactJson
								src={expOutput}
								theme={theme.palette.jsonTheme}
								style={{
									borderRadius: 6,
									padding: 10,
									overflow: "auto",
									fontSize: 13,
								}}
								collapsed={false}
								enableClipboard={(copy) => {
								}}
								displayDataTypes={false}
								onSelect={(select) => {
									var basename = "exec"
									if (selectedAction !== undefined && selectedAction !== null && Object.keys(selectedAction).length !== 0) {
										basename = selectedAction.label.toLowerCase().replaceAll(" ", "_")
									}

									HandleJsonCopy(expOutput, select, basename)
								}}
								name={false}
							/>
							:
							<Box
								component="pre"
								id="expOutput"
								sx={{
									m: 0,
									p: 1.25,
									whiteSpace: "pre-wrap",
									wordWrap: "anywhere",
									color: editorTextColor,
									fontFamily: "'JetBrains Mono', Consolas, monospace",
									fontSize: 13,
									backgroundColor: editorBackground,
									border: isDarkMode ? "none" : theme.palette.defaultBorder,
									borderRadius: 1.5,
									minHeight: 80,
								}}
							>
								{expOutput}
							</Box>
						}
					</>
					:
					<>
						{executing ?
							<Typography variant="body2" color="textSecondary" sx={{ py: 2, }}>
								Waiting for the result…
							</Typography>
							: executionResult.valid === true ?
								<ReactJson
									src={executionResult.result}
									theme={theme.palette.jsonTheme}
									style={{
										borderRadius: 6,
										padding: 10,
										overflow: "auto",
										fontSize: 13,
									}}
									collapsed={false}
									enableClipboard={(copy) => {
									}}
									displayDataTypes={false}
									onSelect={(select) => {
										var basename = "exec"
										if (selectedAction !== undefined && selectedAction !== null && Object.keys(selectedAction).length !== 0) {
											basename = selectedAction.label.toLowerCase().replaceAll(" ", "_")
										}

										HandleJsonCopy(executionResult.result, select, basename)
									}}
									name={"Run Output"}
								/>
								: executionResult.result.length > 0 ?
									<Box
										component="pre"
										sx={{
											m: 0,
											p: 1.25,
											whiteSpace: "pre-wrap",
											wordWrap: "anywhere",
											fontFamily: "'JetBrains Mono', Consolas, monospace",
											fontSize: 13,
											borderRadius: 1.5,
											border: theme.palette.defaultBorder,
										}}
									>
										{executionResult.result}
									</Box>
									:
									<Box sx={{ py: 3, textAlign: "center", }}>
										<PlayArrowIcon style={{ fontSize: 32, opacity: 0.4, }} />
										<Typography variant="body2" color="textSecondary">
											No test output yet. Press <b>{runLabel}</b> or Ctrl + Enter.
										</Typography>
									</Box>
						}

						{executionResult.errors !== undefined && executionResult.errors !== null && executionResult.errors.length > 0 ?
							<Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, border: `1px solid ${BAD_COLOR}`, color: BAD_COLOR, }}>
								<Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, }}>
									Errors ({executionResult.errors.length})
								</Typography>
								<Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: 12, }}>
									{executionResult.errors.join("\n")}
								</Typography>
							</Box>
							: null}
					</>
				}
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", px: 1.5, height: STATUS_BAR_HEIGHT, flexShrink: 0, borderTop: theme.palette.defaultBorder, }}>
				<Tooltip
					title={`Based on the last valid run of the referenced nodes. Refresh the page to get updated values.${selectedAction?.name === "execute_python" ? " For Python: exit() stops the script anywhere." : ""}`}
					placement="top"
					disableInteractive
				>
					<Typography variant="caption" color="textSecondary" noWrap sx={{ fontSize: 12, minWidth: 0, }}>
						Based on the last valid run of the referenced nodes. Refresh the page to get updated values.
						{selectedAction?.name === "execute_python" ? " For Python: exit() stops the script anywhere." : ""}
					</Typography>
				</Tooltip>
			</Box>
		</Box>
	)

	const compactTabs = [
		{ value: "variables", label: "Variables", icon: <DataObjectIcon style={{ fontSize: 16 }} /> },
		{ value: "code", label: "Code", icon: <CodeIcon style={{ fontSize: 16 }} /> },
		{ value: "output", label: "Output", icon: <PlayArrowIcon style={{ fontSize: 16 }} /> },
	]

	const paperSize = fullScreenModeEnabled || isMobile ?
		{ width: "100vw", height: "100vh", }
		: isFileEditor ?
			{ width: "min(960px, calc(100vw - 240px))", height: "min(720px, calc(100vh - 120px))", }
			: isWorkflowEditor ?
				{ width: "calc(100vw - 240px)", height: "calc(100vh - 120px)", }
				:
				{ width: "min(1400px, calc(100vw - 240px))", height: "min(860px, calc(100vh - 120px))", }

	const isMaximized = fullScreenModeEnabled || isMobile

	const editorContent = (
		<>
			{canSwitchFields && switcherAnchor !== null ?
				<FieldSwitcher
					anchorEl={switcherAnchor}
					onClose={() => setSwitcherAnchor(null)}
					actions={workflow.actions}
					branches={workflow.branches}
					startId={workflow.start}
					currentActionId={actionId}
					currentField={fieldName}
					onSelect={handleSwitchField}
					theme={theme}
				/>
				: null}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					pl: 1,
					pr: 0.5,
					height: 52,
					flexShrink: 0,
					borderBottom: theme.palette.defaultBorder,
				}}
			>
				<Box
					id={isMaximized || embedded ? undefined : "draggable-dialog-title"}
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						flex: 1,
						minWidth: 0,
						height: "100%",
						cursor: isMaximized || embedded ? "default" : "move",
					}}
				>
					{isMaximized || embedded ? null : <DragIndicatorIcon style={{ fontSize: 18, opacity: 0.4, flexShrink: 0, }} />}
					{headerTitle !== undefined ? headerTitle : renderTitle()}
					{contentLoading === true ?
						<Tooltip title="The file content is loading. Please wait a moment.">
							<CircularProgress size={16} />
						</Tooltip>
						: null}
				</Box>

				{embedded ? headerActions : <>
					{onSwitchExperience !== undefined ?
						<Tooltip title="New code editor experience. Turn off to go back to the classic editor.">
							<Switch
								size="small"
								checked={true}
								onChange={() => onSwitchExperience(localcodedata)}
							/>
						</Tooltip>
						: null}
					<Tooltip title={isWorkflowEditor ? "Apply isn't available for the workflow YAML view" : `Apply changes to this field (${isMac ? "⌘" : "Ctrl"} + S)`} placement="bottom">
						<span>
							<Button
								ref={submitButtonRef}
								variant="contained"
								color="primary"
								disabled={isWorkflowEditor}
								onClick={handleSubmit}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									height: 30,
									minWidth: 84,
									mx: 0.5,
									borderRadius: 1.5,
									boxShadow: "none",
									whiteSpace: "nowrap",
									"&:hover": {
										boxShadow: "none",
									},
								}}
							>
								Apply
							</Button>
						</span>
					</Tooltip>
					{isMobile ? null :
						<ToolbarButton
							title={fullScreenModeEnabled ? "Exit fullscreen" : "Fullscreen"}
							onClick={() => {
								setFullScreenModeEnabled(!fullScreenModeEnabled)
								localStorage.setItem("codeEditorFullScreen", !fullScreenModeEnabled)
							}}
						>
							{fullScreenModeEnabled ? <FullscreenExitIcon style={{ fontSize: 20 }} /> : <FullscreenIcon style={{ fontSize: 20 }} />}
						</ToolbarButton>
					}
					<ToolbarButton title="Close without saving (Esc)" onClick={handleCancel}>
						<CloseIcon style={{ fontSize: 20 }} />
					</ToolbarButton>
				</>}
			</Box>

			{isFieldEditor && isCompact ?
				<Box sx={{ px: 1, py: 0.75, borderBottom: theme.palette.defaultBorder, flexShrink: 0, }}>
					<PanelTabs theme={theme} value={compactTab} onChange={setCompactTab} tabs={compactTabs} />
				</Box>
				: null}

			<Box ref={setBodyNode} sx={{ display: "flex", flex: 1, minHeight: 0, }}>
				{isFieldEditor && isCompact ?
					<>
						<Box sx={{ flex: 1, minWidth: 0, display: compactTab === "variables" ? "block" : "none", }}>{leftPanel}</Box>
						<Box sx={{ flex: 1, minWidth: 0, display: compactTab === "code" ? "flex" : "none", }}>{editorPanel}</Box>
						<Box sx={{ flex: 1, minWidth: 0, display: compactTab === "output" ? "block" : "none", }}>{outputPanel}</Box>
					</>
					: isFieldEditor ?
						<>
							{leftOpen ?
								<>
									<Box sx={{ width: leftWidth, flexShrink: 0, minWidth: 0, overflow: "hidden", }}>
										{leftPanel}
									</Box>
									<Resizer
										theme={theme}
										onResize={(delta) => {
											setLeftWidth((width) => {
												const next = Math.min(Math.max(width + delta, 200), 520)
												setCodeEditorSetting("leftWidth", next)
												return next
											})
										}}
									/>
								</>
								: null}
							{editorPanel}
							<Resizer
								theme={theme}
								onResize={(delta) => {
									setRightWidth((width) => {
										const next = Math.min(Math.max(width - delta, 280), Math.max(bodyWidth * 0.6, 300))
										setCodeEditorSetting("rightWidth", next)
										return next
									})
								}}
							/>
							<Box sx={{ width: rightWidth, flexShrink: 0, minWidth: 0, overflow: "hidden", }}>
								{outputPanel}
							</Box>
						</>
						:
						editorPanel
				}
			</Box>

		</>
	)

	if (embedded === true) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					height: "100%",
					overflow: "hidden",
					color: theme.palette.text.primary,
					backgroundColor: theme.palette.platformColor,
				}}
			>
				{editorContent}
			</Box>
		)
	}

	return (
		<Dialog
			aria-labelledby="draggable-dialog-title"
			disableEnforceFocus={true}
			style={{
				pointerEvents: "none",
				zIndex: zIndex,
			}}
			hideBackdrop={true}
			open={expansionModalOpen}
			maxWidth={false}
			onClose={() => {
				navigate("")
				console.log("In closer")

				if (changeActionParameterCodeMirror !== undefined) {
					changeActionParameterCodeMirror({ target: { value: "" } }, fieldCount, localcodedata, selectedAction, setSelectedAction)
				} else {
					console.log("No action called changeActionParameterCodeMirror in code editor")
				}
			}}
			PaperComponent={PaperComponent}
			PaperProps={{
				onClick: () => {
					if (setActiveDialog !== undefined) {
						setActiveDialog("codeeditor")
					}
				},
				sx: {
					pointerEvents: "auto",
					color: theme.palette.DialogStyle.color,
					backgroundColor: theme.palette.platformColor,
					backgroundImage: "none",
					border: isMaximized ? "none" : theme.palette.defaultBorder,
					borderRadius: isMaximized ? 0 : `${theme.palette.borderRadius}px`,
					boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					padding: 0,
					margin: isMaximized ? 0 : undefined,
					maxWidth: "100vw",
					maxHeight: "100vh",
					minWidth: isMaximized ? undefined : 560,
					minHeight: isMaximized ? undefined : 380,
					resize: isMaximized ? "none" : "both",
					transform: isMaximized ? "none !important" : undefined,
					...paperSize,
				},
			}}
		>
			{editorContent}
		</Dialog>
	)
}

export default ShuffleCodeEditorV2;
