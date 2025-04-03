import React, { useRef, useState, useEffect, useLayoutEffect, } from 'react';
import { toast } from 'react-toastify';
import '../codeeditor-index.css';
import {
	CircularProgress,
	IconButton,
	Dialog,
	Modal,
	Tooltip,
	DialogTitle,
	DialogContent,
	Typography,
	Paper,
	Menu,
	MenuItem,
	Button,
	ButtonGroup,
	Collapse,
} from '@mui/material';

import theme from '../theme.jsx';
import Checkbox from '@mui/material/Checkbox';
import { isMobile } from "react-device-detect"
import { NestedMenuItem } from "mui-nested-menu"
import { GetParsedPaths, FindJsonPath } from "../views/Apps.jsx";
import { SetJsonDotnotation } from "../views/AngularWorkflow.jsx";
import Draggable from "react-draggable";

import {
	Storage as StorageIcon, 
	FullscreenExit as FullscreenExitIcon,
	Extension as ExtensionIcon,
	Apps as AppsIcon,
	FavoriteBorder as FavoriteBorderIcon,
	Schedule as ScheduleIcon,
	FormatListNumbered as FormatListNumberedIcon,
	SquareFoot as SquareFootIcon,
	Circle as CircleIcon,
	Add as AddIcon,
	PlayArrow as PlayArrowIcon,
	AutoFixHigh as AutoFixHighIcon,
	CompressOutlined,
	QrCodeScannerOutlined,

	Close as CloseIcon,
	DragIndicator as DragIndicatorIcon,
	RestartAlt as RestartAltIcon,
	ArrowForward as ArrowForwardIcon,
	KeyboardReturn as KeyboardReturnIcon, 
} from '@mui/icons-material';


import { validateJson } from "../views/Workflows.jsx";
import ReactJson from "react-json-view-ssr";
import PaperComponent from "../components/PaperComponent.jsx";

import { padding, textAlign } from '@mui/system';
import data from '../frameworkStyle.jsx';
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { tags as t } from '@lezer/highlight';


import AceEditor from "react-ace";
import ace from "ace-builds";
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-json';
//import 'ace-builds/src-noconflict/theme-twilight';
//import 'ace-builds/src-noconflict/theme-solarized_dark';
import 'ace-builds/src-noconflict/theme-gruvbox';
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/ext-searchbox";

const liquidFilters = [
	{ "name": "Default", "value": `default: []`, "example": `{{ "" | default: "no input" }}` },
	{ "name": "Split", "value": `split: ","`, "example": `{{ "this,can,become,a,list" | split: "," }}` },
	{ "name": "Join", "value": `join: ","`, "example": `{{ ["this","can","become","a","string"] | join: "," }}` },
	{ "name": "Size", "value": "size", "example": "" },
	{ "name": "Date", "value": `date: "%Y%m%d"`, "example": `{{ "now" | date: "%s" }}` },
	{ "name": "Escape String", "value": `{{ \"\"\"'string with weird'" quotes\"\"\" | escape_string }}`, "example": `` },
	{ "name": "Flatten", "value": `flatten`, "example": `{{ [1, [1, 2], [2, 3, 4]] | flatten }}` },
	{ "name": "URL encode", "value": `url_encode`, "example": `{{ "https://www.google.com/search?q=hello world" | url_encode }}` },
	{ "name": "URL decode ", "value": `url_decode`, "example": `{{ "https://www.google.com/search?q=hello%20world" | url_decode }}` },
	{ "name": "base64_encode", "value": `base64_encode`, "example": `{{ "https://www.google.com/search?q=hello%20world" | base64_encode }}` },
	{ "name": "base64_decode", "value": `base64_decode`, "example": `{{ "aGVsbG8K" | base64_encode }}` },
	{ "name": "Plus", "value": "plus: 1", "example": `{{ "1" | plus: 1 }}` },
	{ "name": "Minus", "value": "minus: 1", "example": `{{ "1" | minus: 1 }}` },
]

const pythonFilters = [
	{ "name": "Hello World", "value": `print("hello world")`, "example": `` },
	{ "name": "Using Shuffle variables", "value": `import json\nnodevalue = r\"\"\"$exec\"\"\"\nif not nodevalue:\n  nodevalue = r\"\"\"{\"sample\": \"string\", \"int\": 1}\"\"\"\n  \njsondata = json.loads(nodevalue)\nprint(jsondata)`, "example": `` },
	{ "name": "Filter a list", "value": `import json\nnodevalue = r\"\"\"$exec\"\"\"\nif not nodevalue:\n  nodevalue = r\"\"\"[{\"sample\": \"string\", \"int\": 1, "malicious": "no"}, {\"sample\": \"string2\", \"int\": 1, "malicious": "yes"}]\"\"\"\n  \njsondata = json.loads(nodevalue)\nfiltered = []\nfor item in jsondata:\n  try:\n    if item[\"malicious\"] == \"yes\":\n      filtered.append(item)\n  except:\n    pass\nprint(json.dumps(filtered))`, "example": `` },
	{ "name": "Print Execution ID", "value": `print(self.current_execution_id)`, "example": `` },
	{ "name": "Get full execution details", "value": `print(self.full_execution)`, "example": `` },
	{ "name": "Use files", "value": `# Create a sample file\nfiles = [{\n  \"filename\": \"test.txt\",\n  \"data\": \"Testdata\"\n}]\nret = self.set_files(files)\n\n# Get the content of the file from Shuffle storage\n# Originally a byte string in the \"data\" key\nfile_content = (self.get_file(ret[0])[\"data\"]).decode()\nprint(file_content)`, "example": `` },

	{ "name": "Use datastore", "value": `key = \"testkey\"\nvalue = \"The value of the testkey\"\n\nself.set_key(key, value)\n\n# Print the details of the key after it's been updated\n# To get the value, use self.get_key(key)[\"value\"]\nprint(self.get_key(key))`, "example": `` },

	{ "name": "Run a Subflow", "value": `response = shuffle.run_workflow(workflow_id="", start_command="Runtime arg here!", wait=True)\nprint(response)`, "example": ``, "disabled": false, },
	{ "name": "Run an App Action", "value": `response = shuffle.run_app(app_id="app", action="action_name", auth="authentication_id", params={})\nprint(response)`, "example": ``, "disabled": false, },
	{ "name": "Run a Singul AI Action", "value": `response = singul.cases.create_ticket(app="jira", fields={"title": "Test ticket!"})\nprint(response)`, "example": ``, "disabled": false, },


]

const extensions = []
const CodeEditor = (props) => {
	const {
		cy,
		workflow,
		globalUrl,
		fieldCount,
		actionlist,
		changeActionParameterCodeMirror,
		expansionModalOpen,
		setExpansionModalOpen,
		codedata,
		handleActionParamChange,
		setcodedata,
		isFileEditor,
		runUpdateText,
		toolsAppId,
		parameterName,
		// selectedAction,
		// selectedTrigger,
		selectedEdge,
		workflowExecutions,
		getParents,
		activeDialog,
		setActiveDialog,
		fieldname,
		contentLoading,
		editorData,
		handleSubflowParamChange,
		setAiQueryModalOpen,
		fullScreenMode,
		environment,
		fixExample,
		userdata,
		handleConditionFieldChange,
	} = props

	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);

	//const { setContainer } = useCodeMirror({
	//	container: editorRef.current,
	//	extensions,
	//	value: localcodedata,
	//})
	// const {codelang, setcodelang} = props

	const [validation, setValidation] = React.useState(false);
	const [expOutput, setExpOutput] = React.useState(" ");
	const [linewrap, setlinewrap] = React.useState(true);
	//const [codeTheme, setcodeTheme] = React.useState("gruvbox-dark");
	const [editorPopupOpen, setEditorPopupOpen] = React.useState(false);

	const [currentCharacter, setCurrentCharacter] = React.useState(-1);
	const [currentLine, setCurrentLine] = React.useState(-1);
	const [selectedAction, setSelectedAction] = React.useState({});
	const [selectedTrigger, setSelectedTrigger] = React.useState({});
	const [selectedCondition, setSelectedCondition] = React.useState({});
	const [variableOccurences, setVariableOccurences] = React.useState([]);
	const [currentLocation, setCurrentLocation] = React.useState([]);
	const [currentVariable, setCurrentVariable] = React.useState("");
	const [anchorEl, setAnchorEl] = React.useState(null);
	const [anchorEl2, setAnchorEl2] = React.useState(null);
	const [anchorEl3, setAnchorEl3] = React.useState(null);
	const [mainVariables, setMainVariables] = React.useState([]);
	const [availableVariables, setAvailableVariables] = React.useState([]);
	const [sourceDataOpen, setSourceDataOpen] = React.useState(false);

	const [codeTheme, setcodeTheme] = React.useState("gruvbox-dark");

	const [menuPosition, setMenuPosition] = useState(null);
	const [showAutocomplete, setShowAutocomplete] = React.useState(false);
	const [markers, setMarkers] = useState([]);

	const [isAiLoading, setIsAiLoading] = React.useState(false);
	// let markers = [];
	const baseResult = ""
	const [executionResult, setExecutionResult] = useState({
		"valid": false,
		"result": baseResult,
	})
	const [executing, setExecuting] = useState(false)

	const liquidOpen = Boolean(anchorEl);
	const mathOpen = Boolean(anchorEl2);
	const pythonOpen = Boolean(anchorEl3);

	const handleMenuClose = () => {
		setShowAutocomplete(false);

		setMenuPosition(null);
	}

	useEffect(() => {
		highlight_variables(localcodedata)
		expectedOutput(localcodedata)
	}, [localcodedata])

	let navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const actionId = searchParams.get('action_id');
	const appName = searchParams.get('app_name');
	const fieldName = searchParams.get('field');
	const triggerId = searchParams.get('trigger_id');
	const triggerField = searchParams.get('trigger_field');
	const triggerName = searchParams.get('trigger_name');
	const conditionId = searchParams.get('condition_id');
	const conditionField = searchParams.get('field');

	useEffect(() => {
		if (actionId === undefined || actionId === null) {
			return;
		}

		const action = workflow?.actions?.find(action => action.id === actionId);
		setlocalcodedata(editorData?.value);
		setSelectedAction(action);

		// Update available variables when action changes
		updateAvailableVariables(actionlist);
	}, [actionId, fieldName])

	useEffect(() => {
		if (triggerId === undefined || triggerId === null) {
			return;
		}

		const trigger = workflow?.triggers?.find(trigger => trigger.id === triggerId);
		setlocalcodedata(editorData?.value);
		setSelectedTrigger(trigger);

		// Update available variables when trigger changes
		updateAvailableVariables(actionlist);
	}, [triggerId])


	useEffect(() => {
		if (conditionId === undefined || conditionId === null) {
			return;
		}

		const condition = selectedEdge?.conditions?.find(condition => condition.id === conditionId);
		setlocalcodedata(editorData?.value);
		setSelectedCondition(condition);
		// Update available variables when condition changes
		updateAvailableVariables(actionlist);
	}, [conditionId, fieldName])

	// Extract variable updating logic into a separate function
	const updateAvailableVariables = (actionlist) => {
		if (actionlist === undefined || actionlist === null) {
			return
		}

		var allVariables = []
		var tmpVariables = []

		for (var i = 0; i < actionlist.length; i++) {
			allVariables.push('$' + actionlist[i].autocomplete.toLowerCase())
			tmpVariables.push('$' + actionlist[i].autocomplete.toLowerCase())

			var parsedPaths = []
			if (actionlist[i].type === "workflow_variable") {
				// Try to parse the value if it's a string that could be JSON
				if (typeof actionlist[i].value === "string") {
					try {
						const parsedValue = JSON.parse(actionlist[i].value)
						if (typeof parsedValue === "object") {
							parsedPaths = GetParsedPaths(parsedValue, "");
						}
					} catch (e) {
						// Not valid JSON, skip parsing
						continue
					}
				} else if (typeof actionlist[i].value === "object") {
					// Direct object/array value
					parsedPaths = GetParsedPaths(actionlist[i].value, "");
				}
			} else {
				//console.log("EXAMPLE: ", actionlist[i])

				// Handle regular action results
				if (typeof actionlist[i].example === "object") {
					parsedPaths = GetParsedPaths(actionlist[i].example, "");
				}
			}

			for (var key in parsedPaths) {
				const fullpath = "$" + actionlist[i].autocomplete.toLowerCase() + parsedPaths[key].autocomplete
				if (!allVariables.includes(fullpath)) {
					allVariables.push(fullpath)
					allVariables.push(fullpath.toLowerCase())
				}
			}
		}

		setAvailableVariables(allVariables)
		setMainVariables(tmpVariables)
	}

    const handleKeyDown = (event) => {
  		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
  	  		event.preventDefault()
			const tryItButton = document.getElementById("try-it-button")
			if (tryItButton !== undefined && tryItButton !== null) {
				tryItButton.click()
			}
		}
	}

	// Remove the original useEffect for actionlist since we'll update on action/trigger changes
	useEffect(() => {
    	document.addEventListener("keydown", handleKeyDown)
		updateAvailableVariables(actionlist)
	}, [])

	useEffect(() => {
		expectedOutput(localcodedata)
	}, [availableVariables])

	var to_be_copied = "";
	const HandleJsonCopy = (base, copy, base_node_name) => {
		if (typeof copy.name === "string") {
			copy.name = copy.name.replaceAll(" ", "_");
		}

		//lol
		if (typeof base === 'object' || typeof base === 'dict') {
			base = JSON.stringify(base)
		}

		if (base_node_name === "execution_argument" || base_node_name === "Execution Argument") {
			base_node_name = "exec"
		}

		console.log("COPY: ", base_node_name, copy);

		//var newitem = JSON.parse(base);
		var newitem = validateJson(base).result
		to_be_copied = "$" + base_node_name.toLowerCase().replaceAll(" ", "_");
		for (let copykey in copy.namespace) {
			if (copy.namespace[copykey].includes("Results for")) {
				continue;
			}

			if (newitem !== undefined && newitem !== null) {
				newitem = newitem[copy.namespace[copykey]];
				if (!isNaN(copy.namespace[copykey])) {
					to_be_copied += ".#";
				} else {
					to_be_copied += "." + copy.namespace[copykey];
				}
			}
		}

		if (newitem !== undefined && newitem !== null) {
			newitem = newitem[copy.name];
			if (!isNaN(copy.name)) {
				to_be_copied += ".#";
			} else {
				to_be_copied += "." + copy.name;
			}
		}

		to_be_copied.replaceAll(" ", "_");
		const elementName = "copy_element_shuffle";
		var copyText = document.getElementById(elementName);
		if (copyText !== null && copyText !== undefined) {
			console.log("NAVIGATOR: ", navigator);
			const clipboard = navigator.clipboard;
			if (clipboard === undefined) {
				toast("Can only copy over HTTPS (port 3443)");
				return;
			}

			navigator.clipboard.writeText(to_be_copied);
			copyText.select();
			copyText.setSelectionRange(0, 99999); /* For mobile devices */

			/* Copy the text inside the text field */
			document.execCommand("copy");
			console.log("COPYING!");
			toast("Copied JSON path to clipboard.")
		} else {
			console.log("Couldn't find element ", elementName);
		}
	}

	const aiSubmit = (value, inputAction) => {
		if (value === undefined || value === "") {
			console.log("No value input!")
			return
		}

		setIsAiLoading(true)

		// Time to construct this huh... Hmm
		var AppContext = []
		if (inputAction !== undefined && inputAction !== null && getParents !== undefined && getParents !== null && workflowExecutions !== undefined && workflowExecutions !== null) {
			const parents = getParents(inputAction)

			console.log("Parents: ", parents)
			var actionlist = []
			if (parents.length > 1) {
				for (let [key, keyval] in Object.entries(parents)) {
					const item = parents[key];
					if (item.label === "Execution Argument") {
						continue;
					}

					var exampledata = item.example === undefined || item.example === null ? "" : item.example;
					// Find previous execution and their variables
					//exampledata === "" &&
					if (workflowExecutions.length > 0) {
						// Look for the ID
						const found = false;
						for (let [key, keyval] in Object.entries(workflowExecutions)) {
							if (workflowExecutions[key].results === undefined || workflowExecutions[key].results === null) {
								continue;
							}

							var foundResult = workflowExecutions[key].results.find((result) => result.action.id === item.id);
							if (foundResult === undefined || foundResult === null) {
								continue;
							}

							if (foundResult.result !== undefined && foundResult.result !== null) {
								foundResult = foundResult.result
							}

							const valid = validateJson(foundResult, true)
							if (valid.valid) {
								if (valid.result.success === false) {
									//console.log("Skipping success false autocomplete")
								} else {
									exampledata = valid.result;
									break;
								}
							} else {
								exampledata = foundResult;
							}
						}
					}

					// 1. Take
					const itemlabelComplete = item.label === null || item.label === undefined ? "" : item.label.split(" ").join("_");

					const actionvalue = {
						app_name: item.app_name,
						action_name: item.name,
						label: item.label,

						type: "action",
						id: item.id,
						name: item.label,
						autocomplete: itemlabelComplete,
						example: exampledata,
					};

					actionlist.push(actionvalue);
				}
			}

			var fixedResults = []
			for (var i = 0; i < actionlist.length; i++) {
				const item = actionlist[i];
				const responseFix = SetJsonDotnotation(item.example, "")

				// Check if json
				const validated = validateJson(responseFix)
				var exampledata = responseFix;
				if (validated.valid) {
					exampledata = JSON.stringify(validated.result)
				}

				AppContext.push({
					"app_name": item.app_name,
					"action_name": item.action_name,
					"label": item.label,
					"example": exampledata,
				})
			}
		}

		var conversationData = {
			"query": value,
			"output_format": "action",
			"app_context": AppContext,
		}

		if (inputAction !== undefined) {
			console.log("Add app context! This should them get parameters directly")
			conversationData.output_format = "action_parameters"

			conversationData.app_id = inputAction.app_id
			conversationData.app_name = inputAction.app_name
			conversationData.action_name = inputAction.name
			conversationData.parameters = inputAction.parameters
		}

		fetch(`${globalUrl}/api/v1/conversation`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(conversationData),
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for stream results :O!");
				}

				return response.json();
			})
			.then((responseJson) => {
				console.log("Conversation response: ", responseJson)
				setIsAiLoading(false)
				if (responseJson.success === false) {
					if (responseJson.reason !== undefined) {
					}

					return
				}

				if (inputAction !== undefined) {
					console.log("In input action! Should check params if they match, and add suggestions")

					if (responseJson.parameters === undefined || responseJson.parameters.length === 0) {
						return
					}

					for (let respParam of responseJson.parameters) {
						if (respParam.name !== parameterName) {
							continue
						}

						if (respParam.value === "") {
							break
						}

						setlocalcodedata(respParam.value)
						break
					}

					return
				}
			})
			.catch((error) => {
				setIsAiLoading(false)
				console.log("Conv response error: ", error);
			});
	}

	const autoFormat = (input) => {
		// Check if it's default too
		if (validation !== true) {

			// Should try to automatically fix this input
			console.log("Running AI input fixer")
			if (aiSubmit !== undefined && parameterName !== undefined && selectedAction !== undefined) {

				// Should remove params from selectedAction that aren't parameterName  
				var tmpAction = JSON.parse(JSON.stringify(selectedAction))
				var tmpParams = selectedAction.parameters.filter((param) => param.name === parameterName)

				var aiMsg = `Make it valid for action ${tmpAction.label} with parameter ${parameterName}: `
				if (tmpParams.length > 0) {
					aiMsg += tmpParams[0].value
				}


				if (localcodedata.startsWith("//")) {
					aiMsg = localcodedata
				}

				tmpAction.parameters = tmpParams
				console.log("Parameters: ", tmpParams.length)

				aiSubmit(aiMsg, tmpAction)
			}

			return
		}

		try {
			input = JSON.stringify(JSON.parse(input), null, 4)
		} catch (e) {
			console.log("Failed magic JSON stringification: ", e)
		}

		if (input !== localcodedata) {
			setlocalcodedata(input)
		}
	}

	const findIndex = (line, loc) => {
		var code_line = localcodedata.split('\n')[line]
		if (code_line === undefined) {
			return
		}

		var dollar_occurences = []
		var dollar_occurences_len = []
		var variable_ranges = []
		var popup = false

		for (var ch = 0; ch < code_line.length; ch++) {
			if (code_line[ch] === '$') {
				dollar_occurences.push(ch)
			}
		}

		var variable_occurences = code_line.match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)

		try {
			for (var occ = 0; occ < variable_occurences.length; occ++) {
				dollar_occurences_len.push(variable_occurences[occ].length)
			}
		} catch (e) { }

		for (var occ = 0; occ < dollar_occurences.length; occ++) {
			// var temp_arr = []
			// for(var occ_len = 0; occ_len<dollar_occurences_len[occ]; occ_len++){
			// 	temp_arr.push(dollar_occurences[occ]+occ_len)
			// }
			// if(temp_arr === []){temp_arr=[dollar_occurences[occ]]}
			// temp_arr.push(temp_arr[temp_arr.length-1]+1)
			// variable_ranges.push(temp_arr)
			var temp_arr = [dollar_occurences[occ]]
			for (var occ_len = 0; occ_len < dollar_occurences_len[occ]; occ_len++) {
				temp_arr.push(dollar_occurences[occ] + occ_len + 1)
			}

			if (temp_arr.length == 1) {
				temp_arr.push(temp_arr[temp_arr.length - 1] + 1)
			}
			variable_ranges.push(temp_arr)
		}

		for (var occ = 0; occ < variable_ranges.length; occ++) {
			for (var occ1 = 0; occ1 < variable_ranges[occ].length; occ1++) {
				// console.log(variable_ranges[occ][occ1])
				if (loc === variable_ranges[occ][occ1]) {
					popup = true
					setCurrentLocation([line, dollar_occurences[occ]])

					try {
						setCurrentVariable(variable_occurences[occ])

					} catch (e) {
						// setCurrentVariable("")
						// console.log("Current Variable : Nothing")
					}

					occ = Infinity
					break
				}
			}
		}
		setEditorPopupOpen(popup)
	}

	const fixVariable = (inputvariable) => {
		if (inputvariable === undefined || inputvariable === null) {
			return inputvariable
		}

		if (!inputvariable.includes(".")) {
			inputvariable = inputvariable.toLowerCase()
			return inputvariable
		}

		const itemsplit = inputvariable.split(".")
		var newitem = []
		var removedIndexes = 0
		for (var key in itemsplit) {
			var tmpitem = itemsplit[key]
			if (key == 0) {
				tmpitem = tmpitem.toLowerCase()
			}

			// Makes sure #0 and # are same, as we only visualize first one anyway
			if (tmpitem.startsWith("#")) {
				removedIndexes += tmpitem.length - 1
				tmpitem = "#"
			}

			newitem.push(tmpitem)
		}

		return newitem.join(".")
		//return inputvariable
	}

	const highlight_variables = (value) => {
		if (value === undefined || value === null || value.length === 0) {
			setMarkers([])
			return
		}

		// var session = localcodedata.getSession();
		//var code_lines = localcodedata.split('\n')

		var newMarkers = []
		var code_lines = value.split('\n')
		for (var i = 0; i < code_lines.length; i++) {
			var current_code_line = code_lines[i]
			var variable_occurence = current_code_line.match(/[\\]{0,1}[$]{1}([a-zA-Z0-9_@-]+\.?){1}([a-zA-Z0-9#_@-]+\.?){0,}/g)

			if (!variable_occurence) {
				continue
			}

			//var new_occurences = variable_occurence.filter((occurrence) => occurrence[0]);
			//variable_occurence = new_occurences

			variable_occurence = variable_occurence.filter((occurrence) => occurrence[0]);

			// Checks code lines, not variable occurences. Then remaps later
			var dollar_occurence = [];
			for (let ch = 0; ch < current_code_line.length; ch++) {
				//if (current_code_line[ch] === '$' && (ch === 0)) {
				if (current_code_line[ch] === '$') {
					dollar_occurence.push(ch)
				}
			}

			// Lowercase anything between the $ and first .
			var dollar_occurence_len = []
			try {
				for (let occ = 0; occ < variable_occurence.length; occ++) {
					dollar_occurence_len.push(variable_occurence[occ].length)
				}
			} catch (e) {
				console.log("Error in color highlighting list: ", e);
			}

			try {
				if (variable_occurence.length === 0) {
					//value.markText({line:i, ch:0}, {line:i, ch:code_lines[i].length-1}, {"css": "background-color: #282828; border-radius: 0px; color: #b8bb26"})
					//value.markText({line:i, ch:0}, {line:i, ch:code_lines[i].length-1}, {"css": "background-color: #; border-radius: 0px; color: inherit"})
				}

				for (let occ = 0; occ < variable_occurence.length; occ++) {
					const fixedVariable = fixVariable(variable_occurence[occ])
					var correctVariable = availableVariables.includes(fixedVariable)

					var startCh = dollar_occurence[occ]
					var endCh = dollar_occurence[occ] + dollar_occurence_len[occ]
					try {
						newMarkers.push({
							startRow: i,
							startCol: startCh,
							endRow: i,
							endCol: endCh,
							className: correctVariable ? "good-marker" : "bad-marker",
							type: "text",
						})
					} catch (e) {
						console.log("Error in color highlighting: ", e);
						newMarkers.push({
							startRow: i,
							startCol: startCh,
							endRow: i,
							endCol: endCh,
							className: correctVariable ? "good-marker" : "bad-marker",
							type: "text",
						})
					}

					setMarkers(newMarkers)
				}


			} catch (e) {
				console.log("Error in color highlighting: ", e);
			}
		}

		var code_lines = value.split('\n')
		for (var i = 0; i < code_lines.length; i++) {
			var current_code_line = code_lines[i]

			// Look for REPLACE_ME
			var variable_occurence = current_code_line.match(/REPLACE_ME/g)

			if (!variable_occurence) {
				continue;
			}

			var new_occurences = variable_occurence.filter((occurrence) => occurrence[0])
			variable_occurence = new_occurences

			// Find the start position of REPLACE_ME and highlight it
			var dollar_occurence = []
			for (let ch = 0; ch < current_code_line.length; ch++) {
				// Not allowing it then lol
				if (ch + 9 >= current_code_line.length) {
					continue
				}

				// Rofl - at least it is specific
				if (current_code_line[ch] === 'R' && current_code_line[ch + 1] === 'E' && current_code_line[ch + 2] === 'P' && current_code_line[ch + 3] === 'L' && current_code_line[ch + 4] === 'A' && current_code_line[ch + 5] === 'C' && current_code_line[ch + 6] === 'E' && current_code_line[ch + 7] === '_' && current_code_line[ch + 8] === 'M' && current_code_line[ch + 9] === 'E') {
					dollar_occurence.push(ch)
				}
			}

			try {
				if (variable_occurence.length === 0) {
					//value.markText({line:i, ch:0}, {line:i, ch:code_lines[i].length-1}, {"css": "background-color: #282828; border-radius: 0px; color: #b8bb26"})
					//value.markText({line:i, ch:0}, {line:i, ch:code_lines[i].length-1}, {"css": "background-color: #; border-radius: 0px; color: inherit"})
				}

				for (let occ = 0; occ < variable_occurence.length; occ++) {
					const fixedVariable = variable_occurence[occ]

					var startCh = dollar_occurence[occ]
					var endCh = dollar_occurence[occ] + 10
					try {
						newMarkers.push({
							startRow: i,
							startCol: startCh,
							endRow: i,
							endCol: endCh,
							className: "bad-marker",
							type: "text",
						})
					} catch (e) {
						console.log("Error in color highlighting: ", e);
						newMarkers.push({
							startRow: i,
							startCol: startCh,
							endRow: i,
							endCol: endCh,
							className: "bad-marker",
							type: "text",
						})
					}

					setMarkers(newMarkers)
				}


			} catch (e) {
				console.log("Error in color highlighting: ", e);
			}
		}

		setMarkers(newMarkers)
	}

	const replaceVariables = (swapVariable) => {
		// var updatedCode = localcodedata.slice(0,index) + "$" + str + localcodedata.slice(index+currentVariable.length+1,)
		// setlocalcodedata(updatedCode)
		// setEditorPopupOpen(false)
		// setCurrentLocation(0)
		// console.log(index)
		// console.log(currentLocation)

		var code_lines = localcodedata.split('\n')
		var parsedVariable = currentVariable
		if (currentVariable === undefined || currentVariable === null) {
			console.log("Location: ", currentLocation)
			parsedVariable = "$"
		}

		code_lines[currentLine] = code_lines[currentLine].slice(0, currentLocation[1]) + "$" + swapVariable + code_lines[currentLine].slice(currentLocation[1] + parsedVariable.length,)
		// console.log(code_lines)
		var updatedCode = code_lines.join('\n')
		// console.log(updatedCode)
		setlocalcodedata(updatedCode)
	}

	const fixStringInput = (new_input) => {
		// Newline fixes
		new_input = new_input.replace(/\r\n/g, "\\n")
		new_input = new_input.replace(/\n/g, "\\n")

		// Quote fixes
		new_input = new_input.replace(/\\"/g, '"')
		new_input = new_input.replace(/"/g, '\\"')

		new_input = new_input.replace(/\\'/g, "'")
		new_input = new_input.replace(/'/g, "\\'")


		return new_input
	}


	const expectedOutput = (input) => {
		//const found = input.match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)
		const found = input.match(/[$]{1}([a-zA-Z0-9_@-]+\.?){1}([a-zA-Z0-9#_@-]+\.?){0,}/g)

		// Whelp this is inefficient af. Single loop pls
		// When the found array is empty.
		if (found !== null && found !== undefined) {

			//console.log("FOUND: ", found)
			try {
				for (var i = 0; i < found.length; i++) {
					try {
						// Finding if the value is in the list at all, and does initial replacement
						const fixedVariable = fixVariable(found[i])

						var valuefound = false

						  // First check if it's a workflow variable
						  if (actionlist !== undefined && actionlist.length > 0) {
							const workflowVar = actionlist?.find(item => 
								item.type === "workflow_variable" && 
								`$${item.autocomplete.toLowerCase()}` === fixedVariable.toLowerCase()
							)
	
							if (workflowVar && workflowVar.example) {
								valuefound = true
								try {
									// Try to parse the example value if it's stored as a JSON string
									if (typeof workflowVar.example === "string" && 
									   (workflowVar.example.startsWith("[") || workflowVar.example.startsWith("{"))) {
										const parsedExample = JSON.parse(workflowVar.example)
										input = input.replace(found[i], JSON.stringify(parsedExample), -1)
									} else {
										input = input.replace(found[i], workflowVar.example, -1)
									}
									continue
								} catch (e) {
									console.log("Error parsing workflow variable:", e)
									input = input.replace(found[i], workflowVar.example, -1)
									continue
								}
							}
						}

						// Find the location to ensure replacements happen correctly
						var foundlocation = -1
						for (var j = 0; j < input.length; j++) {
							const foundStringSize = fixedVariable.length
							const foundslice = input.slice(j, j + foundStringSize)
							//console.log("FOUNDSLICE: ", foundslice)
							if (fixedVariable !== foundslice) {
								continue
							}

							// Check if it matches EXACTLY or not, as there may be more AFTER the found[i]
							const nextchar = input.slice(j + foundStringSize, j + foundStringSize + 1)
							if (nextchar === ".") {
								continue
							}

							foundlocation = j
							break
						}
	
						// FIXME: There is something wrong here with: 
						// $variable.#
						// vs
						// $variable.#.subvalue
						// if you put both of those lines in the same editor, then it will replace both (somehow). Make sure $variable.#.subvalue exists while testing.
						console.log("FOUNDLOC: ", fixedVariable, foundlocation)
						for (var j = 0; j < actionlist.length; j++) {
							if (fixedVariable.slice(1,).toLowerCase() !== actionlist[j].autocomplete.toLowerCase()) {
								continue
							}

							// Look for the location of found[i] in the input, as to make sure to skip parts of the input in the replace. Find ALL spots for it
							valuefound = true
							var newvalue = ""
							try {

								if (typeof actionlist[j].example === "object") {
									newvalue = JSON.stringify(actionlist[j].example)

								} else if (actionlist[j].example.trim().startsWith("{") || actionlist[j].example.trim().startsWith("[")) {

									newvalue = JSON.stringify(actionlist[j].example)
								} else {
									const newExample = fixStringInput(actionlist[j].example)

									newvalue = newExample
								}
							} catch (e) {
								newvalue = actionlist[j].example
							}

							try {
								console.log("REPLACE: ", foundlocation, fixedVariable, newvalue)
								if (newvalue !== "") {
									if (foundlocation === -1) {
										input = input.replace(fixedVariable, newvalue, 1)
									} else {
										// Ensures we don't just randomly replace the first value we find
										const replacedSlice = input.slice(foundlocation, input.length).replace(fixedVariable, newvalue, 1)
										input = input.slice(0, foundlocation) + replacedSlice
									}
								} 
							} catch (e) {
								console.log("Replace error: ", e)
							}
						}

						if (!valuefound) {
						}

						if (!valuefound && availableVariables.includes(fixedVariable)) {
							var shouldbreak = false
							for (var k = 0; k < actionlist.length; k++) {
								var parsedPaths = []
								
								    // Handle both workflow variables and regular actions
									if (actionlist[k].type === "workflow_variable") {
										// Try to parse the value if it's a string that could be JSON
										if (typeof actionlist[k].value === "string") {
											try {
												const parsedValue = JSON.parse(actionlist[k].value)
												if (typeof parsedValue === "object") {
													parsedPaths = GetParsedPaths(parsedValue, "");
												}
											} catch (e) {
												// Not valid JSON, use the value directly
												parsedPaths = GetParsedPaths(actionlist[k].value, "");
											}
										} else if (typeof actionlist[k].value === "object") {
											parsedPaths = GetParsedPaths(actionlist[k].value, "");
										}
									} else if (typeof actionlist[k].example === "object") {
										parsedPaths = GetParsedPaths(actionlist[k].example, "");
								}				

								for (var key in parsedPaths) {
									const fullpath = "$" + actionlist[k].autocomplete.toLowerCase() + parsedPaths[key].autocomplete.toLowerCase()
									if (fullpath !== fixedVariable.toLowerCase()) {
										continue
									}

									//if (actionlist[k].example === undefined) {
									//	actionlist[k].example = "TMP"
									//}

									var new_input = ""
									try {
										const sourceData = actionlist[k].type === "workflow_variable" ? 
										(() => {
											// Try to parse the value if it's a JSON string
											if (typeof actionlist[k].value === "string") {
												try {
													return JSON.parse(actionlist[k].value);
												} catch (e) {
													// If parsing fails, return the original string value
													return actionlist[k].value;
												}
											}
											return actionlist[k].value;
										})() : 
										actionlist[k].example;
	
										new_input = FindJsonPath(fullpath, sourceData)	
									} catch (e) {
										console.log("ERR IN INPUT: ", e)
									}

									if (typeof new_input === "object") {
										new_input = JSON.stringify(new_input)
									} else {
										if (typeof new_input === "string") {
											// Check if it contains any newlines, and replace them with raw newlines
											new_input = fixStringInput(new_input)

											// Replace quotes with nothing
										} else {
											try {
												new_input = new_input.toString()
											} catch (e) {
												new_input = ""
											}
										}
									}

									// Replace both the fixed and original variable to handle both #0 and # cases
									input = input.replace(found[i], new_input)
									input = input.replace(fixedVariable, new_input)

									shouldbreak = true
									break
								}

								if (shouldbreak) {
									break
								}
							}
						}
					} catch (e) {
						console.log("Replace error: ", e)
					}
				}
			} catch (e) {
				console.log("Outer replace error: ", e)
			}
		}

		const tmpValidation = validateJson(input.valueOf())
		//setValidation(true)
		if (tmpValidation.valid === true) {
			setValidation(true)
			setExpOutput(tmpValidation.result)
		} else {
			setExpOutput(input.valueOf())
			setValidation(false)
		}
	}

	const handleItemClick = (values) => {
		if (values === undefined || values === null || values.length === 0) {
			return;
		}

		var toComplete = localcodedata.trim().endsWith("$") ? values[0].autocomplete : "$" + values[0].autocomplete;

		toComplete = toComplete.toLowerCase().replaceAll(" ", "_");
		for (var key in values) {
			if (key == 0 || values[key].autocomplete.length === 0) {
				continue;
			}

			toComplete += values[key].autocomplete;
		}


		handleClick({
			"value": toComplete
		})
		//setlocalcodedata(localcodedata+toComplete)
		setMenuPosition(null)
	}

	const handleClick = (item) => {
		if (item === undefined || item.value === undefined || item.value === null) {
			return
		}

		// Injects it in the right spot instead of random
		var edited = false
		if (currentCharacter !== undefined && currentCharacter !== null && currentCharacter !== -1 && currentLine !== undefined && currentLine !== null && currentLine !== -1) {
			// Input at the right spot
			var codedatasplit = localcodedata.split('\n')
			if (codedatasplit.length > currentLine) {
				var currentLineData = codedatasplit[currentLine]

				// Remove newlines from item.value
				/*
				if (item.value.includes("% python %")) {
					item.value = item.value.replaceAll("\n", ";")
					item.value = item.value.replaceAll("python %};", "python %}")
				} else {
					item.value = item.value.replaceAll("\n", "")
				}
				*/

				currentLineData = currentLineData.slice(0, currentCharacter) + item.value + currentLineData.slice(currentCharacter)
				codedatasplit[currentLine] = currentLineData

				setlocalcodedata(codedatasplit.join('\n'))

				edited = true
			}
		}

		if (edited === false) {
			if (item.value.includes("{%") || item.value.includes("{{")) {
				if (!item.value.includes("}}") && !item.value.includes("%}")) {
					setlocalcodedata(localcodedata + " | " + item.value + " }}")
				} else {
					setlocalcodedata(localcodedata + item.value)
				}
			} else {
				setlocalcodedata(localcodedata + item.value)
			}
		}

		setAnchorEl(null)
		setAnchorEl2(null)
		setAnchorEl3(null)
	}

	const executeSingleAction = (inputdata) => {
		if (validation === true) {
			inputdata = JSON.stringify(inputdata)
		}

		// Shuffle Tools 1.2.0 (in most cases?)
		const appid = toolsAppId !== undefined && toolsAppId !== null && toolsAppId.length > 0 ? toolsAppId : "3e2bdf9d5069fe3f4746c29d68785a6a"

		const actionname = selectedAction.name === "execute_python" && !inputdata.replaceAll(" ", "").includes("{%python%}") ? "execute_python" : selectedAction.name === "execute_bash" ? "execute_bash" : "repeat_back_to_me"
		const params = actionname === "execute_python" ? [{ "name": "code", "value": inputdata }] : actionname === "execute_bash" ? [{ "name": "code", "value": inputdata }, { "name": "shuffle_input", "value": "", }] : [{ "name": "call", "value": inputdata }]

		const actiondata = { "description": "Repeats the call parameter", "id": "", "name": actionname, "label": "", "node_type": "", "environment": environment?.Name, "sharing": false, "private_id": "", "public_id": "", "app_id": appid, "tags": null, "authentication": [], "tested": false, "parameters": params, "execution_variable": { "description": "", "id": "", "name": "", "value": "" }, "returns": { "description": "", "example": "", "id": "", "schema": { "type": "string" } }, "authentication_id": "", "example": "", "auth_not_required": false, "source_workflow": "", "run_magic_output": false, "run_magic_input": false, "execution_delay": 0, "app_name": "Shuffle Tools", "app_version": "1.2.0", "selectedAuthentication": {} }

		setExecutionResult({
			"valid": false,
			"result": baseResult,
			"errors": [],
		})

		setExecuting(true)

		fetch(`${globalUrl}/api/v1/apps/${appid}/execute`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(actiondata),
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for stream results :O!")
				}

				return response.json()
			})
			.then((responseJson) => {
				//console.log("RESPONSE: ", responseJson)
				var newResult = {}
				if (responseJson.success === true && responseJson.result !== null && responseJson.result !== undefined && responseJson.result.length > 0) {
					const result = responseJson.result.slice(0, 50) + "..."
					//toast("SUCCESS: "+result)

					const validate = validateJson(responseJson.result)
					newResult = validate
				} else if (responseJson.success === false && responseJson.reason !== undefined && responseJson.reason !== null) {
					toast(responseJson.reason)
					newResult = { "valid": false, "result": responseJson.reason }
				} else if (responseJson.success === true) {
					newResult = { "valid": false, "result": "Result is Empty or Couldn't finish execution (1). If using python, use print('value') to see the result" }
				} else {
					newResult = { "valid": false, "result": "Result is Empty or Couldn't finish execution (2). If using python, use print('value') to see the result" }
				}

				if (responseJson.errors !== undefined && responseJson.errors !== null && responseJson.errors.length > 0) {
					newResult.errors = responseJson.errors
				}

				setExecutionResult(newResult)
				setExecuting(false)
			})
			.catch(error => {
				//toast("Execution error: "+error.toString())
				console.log("error: ", error)
				setExecuting(false)
			})
	}

	const adjustPosition = (menuPosition) => {
		const { top, left, width, height } = menuPosition;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		let adjustedTop = top;
		let adjustedLeft = left;

		// Adjust top position if menu overflows the bottom of the window
		if (top + height > windowHeight) {
			adjustedTop = windowHeight - height;
		}

		// Adjust left position if menu overflows the right side of the window
		if (left + width > windowWidth) {
			adjustedLeft = windowWidth - width;
		}

		return {
			"top": adjustedTop,
			"left": adjustedLeft
		}
	};



	// Define a custom completer for the Ace Editor
	const customCompleter = {
		getCompletions: function(editor, session, pos, prefix, callback) {
			callback(null, availableVariables.map((variable) => {
				//console.log("CUSTOM VAR: ", variable)

				return ({
					caption: variable,
					value: variable,
					meta: 'var',
				})
			}))
		}
	}

	const editorLoad = (editor) => {
		//console.log("EDITOR: ", editor)
		editor.completers = [customCompleter]
	}

	if (fullScreenMode) {
		return (
			<AceEditor
				mode="python"
				theme="gruvbox"
				value={localcodedata}
				onChange={(value, editor) => {
					// setlocalcodedata(value)
					// expectedOutput(value)
					// highlight_variables(value,editor)
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
					zIndex: activeDialog === "codeeditor" ? 1200 : 1100,
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


	const ValueBox = (props) => {
		const { name, value } = props

		const [dragging, setDragging] = React.useState(false)
		const [hovering, setHovering] = React.useState(false)

		if (name === undefined || name === null || name.length === 0) {
			return null
		}

		if (value === undefined || value === null || value.length === 0) {
			return null
		}

		return (
			<Draggable
			  style={{
				  position: "absolute",
				  zIndex: 15000,
			  }}
			  onDrag={(e) => {
				  e.preventDefault()
				  // Check if inside div.ace_content
				  if (e.srcElement.className === "ace_content") {
					  // Input on the correct line. Each line is: 
					  // Show some tooltip at mouse cursor that shows "Insert Action"

					  // Append the text to the DOM
				  } else {
					  //console.log("PAGEX: ", e.pageX, e.pageY)
					  //console.log("OffsetX: ", e.offsetX, e.offsetY)
					  //console.log("E: ", e)
				  }

				  if (!dragging) {
				  	setDragging(true)
				  }
			  }}
			  onStop={(e) => {
				  if (e.srcElement.className === "ace_content") {
					  console.log("DRAG STOP IN CONTENT!", e.srcElement.className)

					  const usedposition = e.offsetY
					  if (usedposition  === undefined || usedposition === null) {
						  toast.info("Error: LayerY is undefined or null. Please contact support@shuffler.io")
						  return
					  }

					  if (usedposition  === 0) {
						  usedposition = 1
					  }

					  const lineheight = 15
					  const codedatasplit = localcodedata.split('\n')
					  if (codedatasplit === undefined || codedatasplit === null || codedatasplit.length === 0) {
						  return
					  }

					  // Int 
					  const lineposition = parseInt(usedposition/lineheight)

					  // Find the correct line
					  if (lineposition > codedatasplit.length) {
						  codedatasplit[codedatasplit.length-1] += value
					  } else {
						  codedatasplit[lineposition] += value
					  }


					  //e.srcElement.layerY
					  setlocalcodedata(codedatasplit.join('\n'))
				  }

				  setDragging(false)
			  }}
			  dragging={dragging}
			  position={{ 
				  x: 0, 
				  y: 0,
			  }}
			  onMouseHover={() => {
			  	setHovering(true)
			  }}
			  onMouseLeave={() => {
			  	setHovering(false)
			  }}
			>
				<div 
					style={{
						cursor: dragging ? "grabbing" : "grab", 
						minWidth: 100, 
						border: "1px solid rgba(255,255,255,0.5)", 
						borderRadius: theme.palette.borderRadius/2, 
						marginRight: 10, 
						padding: 5, 
					}}
				>
					{value}
				</div>
			</Draggable>
		)
	}

	const SourceDataOption = (option) => {
		const { innerdata, parsedPaths, defaultExpanded } = option

		const [expanded, setExpanded] = React.useState(defaultExpanded === true ? true : false)


		return (
			<div style={{minHeight: 40, marginTop: 10, }}>
				<div style={{
					cursor: "pointer", 
					display: "flex", 
					position: "relative", 
				}} onClick={() => {
					setExpanded(!expanded)
				}}>
					<ValueBox name={innerdata?.name} value={innerdata?.value} />
					<Typography style={{marginTop: 5, maxWidth: 150, maxHeight: 40, overflow: "hidden", }}>
						{innerdata?.name}
					</Typography>
				</div>
				<Collapse in={expanded}>
					HELO
				</Collapse>
			</div>
		)
	}

	var sourceAction = ""
	var targetAction = ""
	var sourceImage = ""
	var targetImage = ""

	if (cy !== undefined && cy !== null) {
		sourceAction = cy.getElementById(selectedEdge?.source)
		targetAction = cy.getElementById(selectedEdge?.target)
		sourceImage = sourceAction?.data()?.large_image
		targetImage = targetAction?.data()?.large_image
	}

	return (
		<Dialog
			aria-labelledby="draggable-dialog-title"
			// disableBackdropClick={true}
			disableEnforceFocus={true}
			style={{ 
				pointerEvents: "none", 
				zIndex: activeDialog === "codeeditor" ? 1200 : 1100,
			}}
			hideBackdrop={true}
			open={expansionModalOpen}
			onClose={() => {
				navigate("")
				console.log("In closer")

				if (changeActionParameterCodeMirror !== undefined) {
					changeActionParameterCodeMirror({ target: { value: "" } }, fieldCount, localcodedata, selectedAction, setSelectedAction)
				} else {
					console.log("No action called changeActionParameterCodeMirror in code editor")
				}
				//setExpansionModalOpen(false)
			}}
			PaperComponent={PaperComponent}
			PaperProps={{
				onClick: () => {
					if (setActiveDialog !== undefined) {
						setActiveDialog("codeeditor")
					}
				},
				style: {
					// zIndex: 12501,
					pointerEvents: "auto",
					color: "white",
					minWidth: isMobile ? "100%" : isFileEditor ? 650 : "80%",
					maxWidth: isMobile ? "100%" : isFileEditor ? 650 : 1100,
					minHeight: isMobile ? "100%" : "auto",
					maxHeight: isMobile ? "100%" : 700,
					border: "3px solid rgba(255,255,255,0.3)",
					padding: isMobile ? "25px 10px 25px 10px" : 25,
					backgroundColor: "black",
				},
			}}
		>

			{contentLoading === true ?
				<Tooltip
					color="primary"
					title={`The File content is loading. Please wait a moment.`}
					placement="top"
				>
					<CircularProgress style={{ position: "absolute", right: 106, top: 6, }} />
				</Tooltip>
				: null}

			<Tooltip
				color="primary"
				title={`Move window`}
				placement="left"
			>
				<IconButton
					id="draggable-dialog-title"
					style={{
						zIndex: 5000,
						position: "absolute",
						top: 6,
						right: 56,
						color: "grey",

						cursor: "move",
					}}
					onClick={() => {
					}}
				>
					<DragIndicatorIcon />
				</IconButton>
			</Tooltip>
			<Tooltip
				color="primary"
				title={`Close window without saving`}
				placement="left"
			>
				<IconButton
					style={{
						zIndex: 5000,
						position: "absolute",
						top: 6,
						right: 6,
						color: "grey",
					}}
					onClick={() => {
						navigate("")
						setExpansionModalOpen(false)
					}}
				>
					<CloseIcon />
				</IconButton>
			</Tooltip>
			<div style={{ display: "flex" }}>
				{sourceDataOpen ? 
					<div style={{ minWidth: 350, maxWidth: 350, marginLeft: 5, borderRight: "1px solid rgba(255,255,255,0.3)", paddingLeft: 5, overflow: "hidden", marginRight: 10, }}>
						<Typography variant="h6">
							Source Data
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Drag the data you want into the text editor! <b>PS: Only support users can see this test-section!</b>
						</Typography>

						{actionlist?.map((innerdata) => {
							const icon =
								innerdata.type === "action" ? (
									<AppsIcon style={{ marginRight: 10 }} />
								) : innerdata.type === "workflow_variable" ||
									innerdata.type === "execution_variable" ? (
									<FavoriteBorderIcon style={{ marginRight: 10 }} />
								) : (
									<ScheduleIcon style={{ marginRight: 10 }} />
								);

							const handleExecArgumentHover = (inside) => {
								var exec_text_field = document.getElementById(
									"execution_argument_input_field"
								);
								if (exec_text_field !== null) {
									if (inside) {
										exec_text_field.style.border = "2px solid #f85a3e";
									} else {
										exec_text_field.style.border = "";
									}
								}
							};

							const handleActionHover = (inside, actionId) => {
								};

							const handleMouseover = () => {
								if (innerdata.type === "Execution Argument") {
									handleExecArgumentHover(true);
								} else if (innerdata.type === "action") {
									handleActionHover(true, innerdata.id);
								}
							};

							const handleMouseOut = () => {
								if (innerdata.type === "Execution Argument") {
									handleExecArgumentHover(false);
								} else if (innerdata.type === "action") {
									handleActionHover(false, innerdata.id);
								}
							};

							var parsedPaths = [];
							if (innerdata.type === "workflow_variable") {
								// Try to parse the value if it's a string that could be JSON
								  if (typeof innerdata.value === "string") {
									try {
									  const parsedValue = JSON.parse(innerdata.value)
									  if (typeof parsedValue === "object") {
										parsedPaths = GetParsedPaths(parsedValue, "");
									  }
									} catch (e) {
									  // Not valid JSON, use the value directly
									  parsedPaths = GetParsedPaths(innerdata.value, "");
									}
								  } else if (typeof innerdata.value === "object") {
									parsedPaths = GetParsedPaths(innerdata.value, "");
								  }
							  } else if (typeof innerdata.example === "object") {
								parsedPaths = GetParsedPaths(innerdata.example, "");
							}

							const coverColor = "#82ccc3"

							if (innerdata?.name === "Execution Argument") {
								innerdata.name = "Runtime Argument"
							}

							return (
								<SourceDataOption innerdata={innerdata} parsedPaths={parsedPaths} />
							)
						})}
					</div>
				: null}

				<div style={{ flex: 3, }}>
					{isFileEditor ?
						<div
							style={{
								display: 'flex',
							}}
						>
							<div style={{ display: "flex" }}>
								<DialogTitle
									style={{
										paddingBottom: 20,
										paddingLeft: 10,
									}}
								>
									File Editor ({localcodedata.length})
								</DialogTitle>
							</div>
						</div>
						:
						<div
							style={{
								display: 'flex',
							}}
						>
							<div style={{ display: "flex" }}>
								{/*
							<DialogTitle
								id="draggable-dialog-title"
								style={{
									cursor: "move",
									paddingBottom:20,
									paddingLeft: 10, 
								}}
							>
									Code Editor
							</DialogTitle>
							*/}
								{isFileEditor ? null :
									<div style={{ display: "flex", maxHeight: 40, }}>
										<ButtonGroup style={{ borderRadius: theme.palette.borderRadius, }}>
											{userdata !== undefined && userdata !== null && userdata.support === true ? 
												<Button
													id="basic-button"
													aria-haspopup="true"
													aria-controls={!!menuPosition ? 'basic-menu' : undefined}
													aria-expanded={!!menuPosition ? 'true' : undefined}
													variant={!sourceDataOpen ? "contained" : "outlined"}
													color="secondary"
													style={{
														textTransform: "none",
														width: 175,
													}}
													onClick={(event) => {
														setSourceDataOpen(!sourceDataOpen)
													}}
												>
													<AddIcon /> Show Source Data 
												</Button>
											: null}

											<Button
												id="basic-button"
												aria-haspopup="true"
												aria-controls={liquidOpen ? 'basic-menu' : undefined}
												aria-expanded={liquidOpen ? 'true' : undefined}
												variant="outlined"
												color="secondary"
												style={{
													textTransform: "none",
													width: 120,
												}}
												onClick={(event) => {
													setAnchorEl(event.currentTarget);
												}}
											>
												Liquid Filters
											</Button>
											<Menu
												id="basic-menu"
												anchorEl={anchorEl}
												open={liquidOpen}
												onClose={() => {
													setAnchorEl(null);
												}}
												MenuListProps={{
													'aria-labelledby': 'basic-button',
												}}
											>
												{liquidFilters.map((item, index) => {
													return (
														<MenuItem key={index} onClick={() => {
															handleClick(item)
														}}>{item.name}</MenuItem>
													)
												})}
											</Menu>
											<Button
												id="basic-button"
												aria-haspopup="true"
												aria-controls={pythonOpen ? 'basic-menu' : undefined}
												aria-expanded={pythonOpen ? 'true' : undefined}
												variant="outlined"
												color="secondary"
												style={{
													textTransform: "none",
													width: 145,
												}}
												onClick={(event) => {
													setAnchorEl3(event.currentTarget);
												}}
											>
												Python Examples 
											</Button>
											<Button
												id="basic-button"
												aria-haspopup="true"
												aria-controls={!!menuPosition ? 'basic-menu' : undefined}
												aria-expanded={!!menuPosition ? 'true' : undefined}
												variant={"outlined"}
												color="secondary"
												style={{
													textTransform: "none",
													width: 130,
												}}
												onClick={(event) => {
													setMenuPosition({
														top: event.pageY,
														left: event.pageX,
													})
												}}
											>
												<AddIcon /> Autocomplete
											</Button>
											<Menu
												id="basic-menu"
												anchorEl={anchorEl3}
												open={pythonOpen}
												onClose={() => {
													setAnchorEl3(null);
												}}
												MenuListProps={{
													'aria-labelledby': 'basic-button',
												}}
											>
												{pythonFilters.map((item, index) => {
													return (
														<MenuItem 
															style={{
																borderTop: item.name === "Use files" || (item.name.toLowerCase().includes("run") && item.name.toLowerCase().includes("subflow")) ? "2px solid rgba(255,255,255,0.3)" : "none",

															}}
															key={index} onClick={() => {
															if (item.disabled) {
																toast.error("This feature may not work in your environment until you update your Shuffle Tools app.", { autoClose: 10000 })
															}

															if (selectedAction.name !== "execute_python") {
																var newitem = JSON.parse(JSON.stringify(item))
																newitem.value = `{% python %}\n${item.value}\n{% endpython %}`
																handleClick(newitem)
															} else {
																handleClick(item)
															}
														}}>{item.name}</MenuItem>
													)
												})}
											</Menu>


											<Menu
												anchorReference="anchorPosition"
												anchorPosition={menuPosition}

												anchorOrigin={{
													vertical: 'bottom',
													horizontal: 'left',
												}}
												keepMounted
												transformOrigin={{
													vertical: 'top',
													horizontal: 'left',
												}}
												//MenuListProps={{
												//	style: adjustPosition(), 
												//}}

												onClose={() => {
													handleMenuClose();
												}}
												open={!!menuPosition}
												style={{
													color: "white",
													marginTop: 2,
													maxHeight: 650,
												}}
											>
												{actionlist?.map((innerdata) => {
													const icon =
														innerdata.type === "action" ? (
															<AppsIcon style={{ marginRight: 10 }} />
														) : innerdata.type === "workflow_variable" ||
															innerdata.type === "execution_variable" ? (
															<FavoriteBorderIcon style={{ marginRight: 10 }} />
														) : 
															innerdata.type === "Shuffle DB" ? 
															<StorageIcon style={{ marginRight: 10,  }} />
														:
															<ScheduleIcon style={{ marginRight: 10 }} />

													const handleExecArgumentHover = (inside) => {
														var exec_text_field = document.getElementById(
															"execution_argument_input_field"
														);
														if (exec_text_field !== null) {
															if (inside) {
																exec_text_field.style.border = "2px solid #f85a3e";
															} else {
																exec_text_field.style.border = "";
															}
														}
													};

													const handleActionHover = (inside, actionId) => {
													};

													const handleMouseover = () => {
														if (innerdata.type === "Execution Argument") {
															handleExecArgumentHover(true);
														} else if (innerdata.type === "action") {
															handleActionHover(true, innerdata.id);
														}
													};

													const handleMouseOut = () => {
														if (innerdata.type === "Execution Argument") {
															handleExecArgumentHover(false);
														} else if (innerdata.type === "action") {
															handleActionHover(false, innerdata.id);
														}
													};

													var parsedPaths = [];
													if (innerdata.type === "workflow_variable") {
														// Try to parse the value if it's a string that could be JSON
														  if (typeof innerdata.value === "string") {
															try {
															  const parsedValue = JSON.parse(innerdata.value)
															  if (typeof parsedValue === "object") {
																parsedPaths = GetParsedPaths(parsedValue, "");
															  }
															} catch (e) {
															  // Not valid JSON, use the value directly
															  parsedPaths = GetParsedPaths(innerdata.value, "");
															}
														  } else if (typeof innerdata.value === "object") {
															parsedPaths = GetParsedPaths(innerdata.value, "");
														  }
													  } else if (typeof innerdata.example === "object") {
														parsedPaths = GetParsedPaths(innerdata.example, "");
													}

													const coverColor = "#82ccc3"
													//menuPosition.left -= 50
													//menuPosition.top -= 250 
													//console.log("POS: ", menuPosition1)
													var menuPosition1 = menuPosition
													if (menuPosition1 === null) {
														menuPosition1 = {
															"left": 0,
															"top": 0,
														}
													} else if (menuPosition1.top === null || menuPosition1.top === undefined) {
														menuPosition1.top = 0
													} else if (menuPosition1.left === null || menuPosition1.left === undefined) {
														menuPosition1.left = 0
													}

													return parsedPaths.length > 0 ? (
														<NestedMenuItem
															key={innerdata.name}
															label={
																<div style={{ display: "flex", marginLeft: 0, }}>
																	{icon} {innerdata.name}
																</div>
															}
															parentMenuOpen={!!menuPosition}
															style={{
																color: "white",
																minWidth: 250,
																maxWidth: 250,
																maxHeight: 50,
																overflow: "hidden",
															}}
															onClick={() => {
																//console.log(innerdata.example)

																//const handleClick = (item) => {
																handleItemClick([innerdata]);
															}}
														>
															<Paper style={{ minHeight: 550, maxHeight: 550, minWidth: 275, maxWidth: 275, position: "fixed", left: menuPosition1.left - 270, padding: "10px 0px 10px 10px", overflow: "hidden", overflowY: "auto", border: "1px solid rgba(255,255,255,0.3)", }}>
																<MenuItem
																	key={innerdata.name}
																	style={{
																		marginLeft: 15,
																		color: "white",
																		minWidth: 250,
																		maxWidth: 250,
																		padding: 0,
																		position: "relative",
																	}}
																	value={innerdata}
																	onMouseOver={() => {
																		//console.log("HOVER: ", pathdata);
																	}}
																	onClick={() => {
																		handleItemClick([innerdata]);
																	}}
																>
																	<Typography variant="h6" style={{ paddingBottom: 5 }}>
																		{innerdata.name}
																	</Typography>
																</MenuItem>
																{parsedPaths.map((pathdata, index) => {
																	// FIXME: Should be recursive in here
																	//<VpnKeyIcon style={iconStyle} />
																	const icon =
																		pathdata.type === "value" ? (
																			<span style={{ marginLeft: 9, }} />
																		) : pathdata.type === "list" ? (
																			<FormatListNumberedIcon style={{ marginLeft: 9, marginRight: 10, }} />
																		) : (
																			<CircleIcon style={{ marginLeft: 9, marginRight: 10, color: coverColor }} />
																		);
																	//<ExpandMoreIcon style={iconStyle} />

																	const indentation_count = (pathdata.name.match(/\./g) || []).length + 1
																	//const boxPadding = pathdata.type === "object" ? "10px 0px 0px 0px" : 0
																	const boxPadding = 0
																	const namesplit = pathdata.name.split(".")
																	const newname = namesplit[namesplit.length - 1]
																	return (
																		<MenuItem
																			key={pathdata.name}
																			style={{
																				color: "white",
																				minWidth: 250,
																				maxWidth: 250,
																				padding: boxPadding,
																			}}
																			value={pathdata}
																			onMouseOver={() => {
																				//console.log("HOVER: ", pathdata);
																			}}
																			onClick={() => {
																				handleItemClick([innerdata, pathdata]);
																			}}
																		>
																			<Tooltip
																				color="primary"
																				title={`Ex. value: ${pathdata.value}`}
																				placement="left"
																			>
																				<div style={{ display: "flex", height: 30, }}>
																					{Array(indentation_count).fill().map((subdata, subindex) => {
																						return (
																							<div key={subindex} style={{ marginLeft: 20, height: 30, width: 1, backgroundColor: coverColor, }} />
																						)
																					})}
																					{icon} {newname}
																					{pathdata.type === "list" ? <SquareFootIcon style={{ marginleft: 10, }} onClick={(e) => {
																						e.preventDefault()
																						e.stopPropagation()

																						console.log("INNER: ", innerdata, pathdata)

																						// Removing .list from autocomplete
																						var newname = pathdata.name
																						if (newname.length > 5) {
																							newname = newname.slice(0, newname.length - 5)
																						}

																						//selectedActionParameters[count].value += `{{ $${innerdata.name}.${newname} | size }}`
																						//selectedAction.parameters[count].value = selectedActionParameters[count].value;
																						//setSelectedAction(selectedAction);
																						//setShowDropdown(false);
																						setMenuPosition(null);

																						// innerdata.name
																						// pathdata.name
																						//handleItemClick([innerdata, newpathdata])
																					}} /> : null}
																				</div>
																			</Tooltip>
																		</MenuItem>
																	);
																})}
															</Paper>
														</NestedMenuItem>
													) : (
														<MenuItem
															key={innerdata.name}
															style={{
																backgroundColor: theme.palette.inputColor,
																color: "white",
																minWidth: 250,
																maxWidth: 250,
																marginRight: 0,
															}}
															value={innerdata}
															onMouseOver={() => handleMouseover()}
															onMouseOut={() => {
																handleMouseOut();
															}}
															onClick={() => {
																handleItemClick([innerdata]);
															}}
														>
															<Tooltip
																color="primary"
																title={`Value: ${innerdata.value}`}
																placement="left"
															>
																<div style={{ display: "flex" }}>
																	{icon} {innerdata.name}
																</div>
															</Tooltip>
														</MenuItem>
													);
												})}
											</Menu>
										</ButtonGroup>
									</div>
								}

								<IconButton
									style={{
										height: 50,
										width: 50,
										marginLeft: 100,
									}}
									disabled={editorData === undefined || editorData.example === undefined || editorData.example === null || editorData.example.length === 0}
									onClick={() => {
										if (fixExample !== undefined) {
											const newExample = fixExample(editorData.example)
											setlocalcodedata(newExample)
										} else {
											console.log("No fix example available!")
											setlocalcodedata(editorData.example)
										}
									}}
									color="secondary"
								>
									<Tooltip
										title={"Reset to example body"}
										placement="top"
									>
										<RestartAltIcon />
									</Tooltip>
								</IconButton>
								<IconButton
									style={{
										height: 50,
										width: 50,
										marginLeft: 0,
									}}
									disabled={isAiLoading}
									onClick={() => {
										if (setAiQueryModalOpen !== undefined) {
											setAiQueryModalOpen(true)
										} else {
											autoFormat(localcodedata)
										}
									}}
								>
									<Tooltip
										color="primary"
										title={"Format with AI"}
										placement="top"
									>
										{isAiLoading ?
											<CircularProgress style={{ height: 20, width: 20, color: "rgba(255,255,255,0.7)" }} />
											:
											<AutoFixHighIcon style={{ color: "rgba(255,255,255,0.7)" }} />
										}
									</Tooltip>
								</IconButton>
							</div>
						</div>
					}

					<div 
						style={{
							borderRadius: theme.palette?.borderRadius,
							position: "relative",
							paddingTop: 0,
						}}
						onDragOver={(e) => {
							console.log("DRAGGING OVER: ", e)
						}}
						onDrop={(e) => {
							console.log("DROP: ", e)
						}}
					>	
						{(availableVariables !== undefined && availableVariables !== null && availableVariables.length > 0) || isFileEditor ? (
							<AceEditor
								id="shuffle-codeeditor"
								name="shuffle-codeeditor"
								value={localcodedata}
								mode={selectedAction === undefined ? "json" : selectedAction.name === "execute_python" ? "python" : selectedAction.name === "execute_bash" ? "bash" : "json"}
								theme="gruvbox"
								height={isFileEditor ? 450 : 550}
								width={isFileEditor ? 650 : "100%"}

								markers={markers}
								highlightActiveLine={false}

								enableBasicAutocompletion={true}
								completers={[customCompleter]}

								style={{
									wordBreak: "break-word",
									marginTop: 0,
									paddingBottom: 10,
									overflowY: "auto",
									whiteSpace: "pre-wrap",
									wordWrap: "break-word",
									backgroundColor: "rgba(40,40,40,1)",
									zIndex: activeDialog === "codeeditor" ? 1200 : 1100,

									
								}}
								onLoad={(editor) => {
									highlight_variables(localcodedata)
									editorLoad(editor)
								}}
								onCursorChange={(cursorPosition, editor, value) => {
									setCurrentCharacter(cursorPosition.cursor.column)
									setCurrentLine(cursorPosition.cursor.row)
									findIndex(cursorPosition.row, cursorPosition.column)

								}}
								onChange={(value, editor) => {
									// setlocalcodedata(value)
									// expectedOutput(value)
									// highlight_variables(value,editor)
									setlocalcodedata(value)
									expectedOutput(value)
									highlight_variables(value)
								}}
								setOptions={{
									enableBasicAutocompletion: true,
									enableLiveAutocompletion: true,
									enableSnippets: true,
									showLineNumbers: true,
									tabSize: 2,
									wrap: true,

									useWorker: false,
									enableBasicAutocompletion: [customCompleter],
								}}
							// options={options}
							/>
						) : null}
					</div>

					<div
						style={{
						}}
					>
					</div>
				</div>

				{isFileEditor  ? null :
					<div style={{ 
						flex: sourceDataOpen ? 1.5 : 3, 
						marginLeft: 5, 
						borderLeft: "1px solid rgba(255,255,255,0.3)", 
						paddingLeft: 5, 
						overflow: "hidden", 
						transitions: "all 1s ease-in-out",
					}}>
						<div>
							{isMobile ? null :
								<DialogTitle
									style={{
										paddingLeft: 10,
										paddingTop: 0,
										display: "flex",
										cursor: "move"
									}}
								>
									<div>
											{actionId === null && triggerId === null ? 
												<div style={{display: "flex", alignItems: "center"}}>
													{`Condition ${selectedEdge?.conditions?.findIndex(cond => cond.condition.id === conditionId) + 1 || "0"}`}
													{/* Source node image */}
													{selectedEdge?.source ? 
														<img 
															src={sourceImage || ""}
															alt="Source"
															style={{
																width: 30,
																height: 30,
																marginRight: 10,
																borderRadius: "50%",
																marginLeft: 10,
																border: conditionField === "source" ? `3px solid #FF8544` : null,
															}}
														/>
														: null
													}

													  {/* Add arrow icon */}
													{
														selectedEdge && Object.keys(selectedEdge).length > 0 ?
														<ArrowForwardIcon style={{ 
															color: "rgba(255,255,255,0.7)",
															fontSize: 18,
															marginLeft: -5,
															marginRight: -5,
														}} />
														: null
													}

													{/* Destination node image */}
													{selectedEdge?.target ?
														<img
															src={targetImage || ""}
															alt="Destination" 
															style={{
																width: 30,
																height: 30,
																marginLeft: 10,
																borderRadius: "50%",
																border: conditionField === "destination" ? `3px solid #FF8544` : null,
															}}
														/>
														: null
													}
												</div>
												: 
												<span style={{ color: "white" }}>
												{selectedAction.name === "execute_python" || selectedAction.name === "execute_bash" ? 
													"Code to run" : 
													triggerId ? 
														`Output: ${triggerName?.replaceAll("_", " ").slice(0, 1).toUpperCase() + triggerName?.replaceAll("_", " ").slice(1)} (${triggerField})` :
														`Output: ${appName?.replaceAll("_", " ").slice(0, 1).toUpperCase() + appName?.replaceAll("_", " ").slice(1)} (${fieldName})`
												}
											</span>
										}
									</div>

								</DialogTitle>
							}

							<div style={{}}>
								<Tooltip title="Try it! This runs the Shuffle Tools 'repeat back to me' or 'execute python' action with what you see in the expected output window. Commonly used to test your Python scripts or Liquid filters, not requiring the full workflow to run again." placement="top">
									<Button
										id="try-it-button"
										variant="outlined"
										disabled={executing}
										color="primary"
										style={{
											border: `1px solid rgba(255, 255, 255, 0.15)`,
											position: "absolute",
											top: 20,
											right: 100,
											maxHeight: 35,
											minWidth: 70,
											zIndex: 1200,
											fontWeight: 500,
											fontSize: 14,
											textTransform: "none",
											backgroundColor: "rgba(33, 33, 33, 0.95)",
											backdropFilter: "blur(8px)",
											boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
											transition: "all 0.2s ease",
											paddingRight: 20, 
											borderRadius: theme.palette?.borderRadius,
											"&:hover": {
												backgroundColor: "rgba(45, 45, 45, 0.95)",
												transform: "translateY(-1px)",
												boxShadow: "0 7px 14px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08)",
											},
											"&:active": {
												transform: "translateY(1px)",
											}
										}}
										onClick={() => {
											executeSingleAction(expOutput)
										}}
									>
										{executing ?
											<CircularProgress style={{ height: 18, width: 18, }} />
											:
											<span>

												<PlayArrowIcon style={{ height: 18, width: 18, marginBottom: -4, marginLeft: 5, }} />
											{selectedAction === undefined ? "Try it" : selectedAction.name === "execute_python" ? "Run Python Code" : selectedAction.name === "execute_bash" ? "Run Bash" : "Try it"} 
                        						<span
                        						  style={{
                        						    color: "#C8C8C8",
                        						    fontSize: "12px",
                        						    whiteSpace: "nowrap",
													marginLeft: 5,
														  marginRight: 10, 
                        						  }}
                        						>
                        						  <kbd>Ctrl</kbd> + <kbd><KeyboardReturnIcon style={{width: 13, position: "absolute", marginLeft: 3, top: 5, }}/></kbd>
                        						</span>

											</span>
										}
									</Button>
								</Tooltip>

								{isMobile ? null :
									validation === true ?
										<ReactJson
											src={expOutput}
											theme={theme.palette.jsonTheme}
											style={{
												borderRadius: 5,
												border: `2px solid ${theme.palette.inputColor}`,
												padding: 10,
												maxHeight: 450,
												minheight: 450,
												overflow: "auto",
												minWidth: 450,
												maxWidth: "100%",
												zIndex: activeDialog === "codeeditor" ? 1200 : 1100,
											}}
											collapsed={false}
											enableClipboard={(copy) => {
												//handleReactJsonClipboard(copy);
											}}
											displayDataTypes={false}
											onSelect={(select) => {
												var basename = "exec"
												if (selectedAction !== undefined && selectedAction !== null && Object.keys(selectedAction).length !== 0) {
													basename = selectedAction.label.toLowerCase().replaceAll(" ", "_")
												}

												HandleJsonCopy(expOutput, select, basename)
											}}
											name={"JSON autocompletion"}
										/>
										:
										<p
											id='expOutput'
											style={{
												whiteSpace: "pre-wrap",
												color: "#ebdbb2",
												fontFamily: "monospace",
												backgroundColor: "#282828",
												padding: 10,
												marginTop: -2,
												border: `2px solid ${theme.palette.inputColor}`,
												borderRadius: theme.palette?.borderRadius,
												maxHeight: 450,
												minHeight: 450,
												overflow: "auto",
												wordWrap: "anywhere",
												zIndex: activeDialog === "codeeditor" ? 1200 : 1100,
											}}
										>
											{expOutput}
										</p>
								}
							</div>

							{executionResult.valid === true ?
								<ReactJson
									src={executionResult.result}
									theme={theme.palette.jsonTheme}
									style={{
										borderRadius: 5,
										border: `2px solid ${theme.palette.inputColor}`,
										padding: 10,
										maxHeight: 190,
										minheight: 190,
										overflow: "auto",
									}}
									collapsed={false}
									enableClipboard={(copy) => {
										//handleReactJsonClipboard(copy);
									}}
									displayDataTypes={false}
									onSelect={(select) => {
										//HandleJsonCopy(executionResult.result, select, "exec");
									}}
									name={"Test result"}
								/>
								:
								<span style={{ maxHeight: 190, minHeight: 190, }}>
									{executionResult.result.length > 0 ?
										<span style={{ maxHeight: 150, overflow: "auto", marginTop: 20, }}>
											<Typography variant="body2">
												<b>Test output</b>
											</Typography>
											<Typography variant="body2" style={{ whiteSpace: 'pre-line', }}>
												{executionResult.result}
											</Typography>
										</span>
										:

										<div>
											<Typography
												variant='body2'
												color='textSecondary'
											>
												Output is based on the last VALID run of the node(s) you are referencing. Refresh the page to get updated Variable values.&nbsp;
												{selectedAction?.name === "execute_python" ?
													"For Python: exit() to stop a python script ANYWHERE."
												: null}
											</Typography>
											<Typography variant="body2" style={{ maxHeight: 150, overflow: "auto", marginTop: 20, }}>
												No test output yet.
											</Typography>
										</div>
									}

									{executionResult.errors !== undefined && executionResult.errors !== null && executionResult.errors.length > 0 ?
										<Typography variant="body2" style={{ maxHeight: 100, overflow: "auto", color: "#f85a3e", }}>
											Errors ({executionResult.errors.length}): {executionResult.errors.join("\n")}
										</Typography>
										: null}
								</span>
							}
						</div>

					</div>
				}
			</div>


			<div style={{ display: 'flex' }}>
				<Button
					style={{
						height: 35,
						flex: 1,
						marginLeft: 5,
						marginTop: 5,
					}}
					variant="outlined"
					color="secondary"
					onClick={() => {
						if (isFileEditor !== true) {
							navigate("")
						}

						setExpansionModalOpen(false);
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					color="primary"
					style={{
						height: 35,
						flex: 1,
						marginLeft: 10,
						marginTop: 5,
					}}
					onClick={(event) => {
						/*
						const clickedFieldId = "rightside_field_" + fieldCount 
						const clickedField = document.getElementById(clickedFieldId)
						if (clickedField !== undefined && clickedField !== null) {
							clickedField.focus()
						}
						*/

						if (isFileEditor !== true) {
							navigate("")
						}
						// Take localcodedata through the Shuffle JSON parser just in case
						// This is to make it so we don't need to handle these fixes on the
						// backend by itself
						var fixedcodedata = localcodedata
						const valid = validateJson(localcodedata, true)
						if (valid.valid) {
							//fixedcodedata = JSON.stringify(valid.result, null, 2)
							fixedcodedata = JSON.stringify(valid.result)
						}

						// console.log(codedata)
						// console.log(fieldCount)
						if (isFileEditor === true) {
							runUpdateText(fixedcodedata);
							setcodedata(fixedcodedata);
						} else if (changeActionParameterCodeMirror !== undefined) {
							//changeActionParameterCodeMirror(event, fieldCount, fixedcodedata)
							changeActionParameterCodeMirror(event, fieldCount, fixedcodedata, actionlist, parameterName, selectedAction, setSelectedAction)
							setcodedata(fixedcodedata)
						}

						// Handle condition fields
						if (conditionField !== null && handleConditionFieldChange !== undefined) {
							handleConditionFieldChange(conditionField, fieldName, fixedcodedata);
						}
						// Handle action fields
						else if (actionId !== undefined && actionId !== null && actionId.length > 0) {
							handleActionParamChange(actionId, fieldName, fixedcodedata)
						}
						// Handle trigger fields
						else if (triggerId !== undefined && triggerId !== null && triggerId.length > 0) {
							handleSubflowParamChange(triggerId, triggerField, fixedcodedata)
						}

						setExpansionModalOpen(false)
					}}
				>
					Submit
				</Button>
			</div>
		</Dialog>)
}

export default CodeEditor;
