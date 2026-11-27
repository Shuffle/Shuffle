import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { Context } from '../context/ContextApi.jsx';
import { getTheme } from '../theme.jsx';
import { GetParsedPaths, FindJsonPath } from "../views/Apps.jsx";
import { SetJsonDotnotation } from "../utils/workflowHelpers.js";
import { validateJson } from "../views/Workflows2.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";

export const liquidFilters = [
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

export const pythonFilters = [
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

export const IndentJsonLikeString = (input, indentSize = 2) => {
	  const indent = ' '.repeat(indentSize);
	  let level = 0;
	  let inString = false;
	  let escapeNext = false;
	  let result = '';

	  for (let i = 0; i < input.length; i++) {
		let char = input[i];

		if (escapeNext) {
		  result += char;
		  escapeNext = false;
		  continue;
		}

		if (char === '\\') {
		  escapeNext = true;
		  result += char;
		  continue;
		}

		if (char === '"') {
		  inString = !inString;
		  result += char;
		  continue;
		}

		if (!inString) {
		  if (char === '{' || char === '[') {
			result += char + '\n' + indent.repeat(++level);
			continue;
		  } else if (char === '}' || char === ']') {
			result += '\n' + indent.repeat(--level) + char;
			continue;
		  } else if (char === ',') {
			result += char + '\n' + indent.repeat(level);
			continue;
		  } else if (char === ':') {
			result += ': ';
			continue;
		  } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
			// Skip whitespace characters when not in string
			continue;
		  }
		}

		result += char;
	  }

	  return result;
	}

const useShuffleCodeEditor = (props) => {
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
		isWorkflowEditor,
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
		handleTriggerParamChange,
		setAiQueryModalOpen,
		fullScreenMode,
		environment,
		fixExample,
		userdata,
		handleConditionFieldChange,
	} = props

	// Auto-indent JSON-like content (with safety hehe)
	const autoIndentContent = React.useCallback((content) => {
		if (!isFileEditor) {
			console.log("Autoindent disabled")
			return content
		}

		// Safety checks :)
		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			return content;
		}
		
		try {
			// Check if content looks like JSON (starts with { or [)
			const trimmedContent = content.trim();
			if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
				try {
					const parsed = JSON.parse(trimmedContent);
					return IndentJsonLikeString(JSON.stringify(parsed), 2);
				} catch (parseError) {
					return IndentJsonLikeString(content, 2);
				}
			}
			
			// Return original content if it doesn't look like JSON
			return content;
		} catch (error) {
			// If anything goes wrong, return original content
			console.warn('Auto-indent failed, using original content:', error);
			return content;
		}
	}, []);


	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);

	// const {codelang, setcodelang} = props
	const {themeMode, supportEmail} = useContext(Context)
	const theme = getTheme(themeMode)

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
	const [isSavingSnippet, setIsSavingSnippet] = React.useState(false);
	const [isRestoringSnippet, setIsRestoringSnippet] = React.useState(false);
	// let markers = [];
	const baseResult = ""
	const [executionResult, setExecutionResult] = useState({
		"valid": false,
		"result": baseResult,
	})
	const [executing, setExecuting] = useState(false)
	const [fullScreenModeEnabled, setFullScreenModeEnabled] = useState(fullScreenMode === true || fullScreenMode === "true" || localStorage.getItem("codeEditorFullScreen") === "true")

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

	useEffect(() => {
		if (!isFileEditor) { 
			return
		}

		if (codedata === undefined || codedata === null || typeof codedata !== 'string') {
			return
		}

		const indentedContent = autoIndentContent(codedata);
		if (indentedContent !== undefined && indentedContent !== null) {
			console.log("SETTING: ", indentedContent)
			setlocalcodedata(indentedContent);
		} else {
			console.log("INDENT FAILED")
		}
	}, [])

	// Auto-indent when codedata prop changes
	useEffect(() => {
		if (codedata && codedata !== localcodedata && typeof codedata === 'string') {
			try {
				const indentedContent = autoIndentContent(codedata);
				if (indentedContent !== undefined && indentedContent !== null) {
					setlocalcodedata(indentedContent);
				}
			} catch (error) {
				console.warn('Failed to auto-indent codedata:', error);
				// Fallback to original codedata
				setlocalcodedata(codedata);
			}
		}
	}, [codedata, autoIndentContent])

	let navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const actionId = searchParams.get('action_id');
	const appName = searchParams.get('app_name');
	const fieldName = searchParams.get('field');
	const triggerId = searchParams.get('trigger_id');
	const triggerField = searchParams.get('trigger_field');
	const triggerName = searchParams.get('trigger_name');
	const conditionId = searchParams.get('condition_id');
	const conditionField = searchParams.get('condition_field');

	useEffect(() => {
		if (actionId === undefined || actionId === null) {
			return;
		}

		const action = workflow?.actions?.find(action => action.id === actionId);
		try {
			const indentedContent = autoIndentContent(editorData?.value);
			setlocalcodedata(indentedContent || editorData?.value);
		} catch (error) {
			console.warn('Failed to auto-indent action data:', error);
			setlocalcodedata(editorData?.value);
		}
		setSelectedAction(action);

		// Update available variables when action changes
		updateAvailableVariables(actionlist);
	}, [actionId, fieldName])

	useEffect(() => {
		if (triggerId === undefined || triggerId === null) {
			return;
		}

		const trigger = workflow?.triggers?.find(trigger => trigger.id === triggerId);
		try {
			const indentedContent = autoIndentContent(editorData?.value);
			setlocalcodedata(indentedContent || editorData?.value);
		} catch (error) {
			console.warn('Failed to auto-indent trigger data:', error);
			setlocalcodedata(editorData?.value);
		}
		setSelectedTrigger(trigger);

		// Update available variables when trigger changes
		updateAvailableVariables(actionlist);
	}, [triggerId])


	useEffect(() => {
		if (conditionId === undefined || conditionId === null) {
			return;
		}

		const condition = selectedEdge?.conditions?.find(condition => condition.id === conditionId);
		try {
			const indentedContent = autoIndentContent(editorData?.value);
			setlocalcodedata(indentedContent || editorData?.value);
		} catch (error) {
			console.warn('Failed to auto-indent condition data:', error);
			setlocalcodedata(editorData?.value);
		}
		setSelectedCondition(condition);
		// Update available variables when condition changes
		updateAvailableVariables(actionlist);
	}, [conditionId, conditionField])

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
			// Resolve the child paths/variables first,
			// So that "$a.b.c" is handled before "$a.b" and then "$a"
			// Replace "$parent.child" before "$parent" so "$parent.child" doesn't become "parentValue.child" (which can't be matched later).
			found.sort((a, b) => b.length - a.length)

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

	const generateSnippetKey = () => {
		if (!workflow?.id) {
			return null;
		}

		// Case 1: Action parameter
		if (actionId && parameterName) {
			return `${workflow.id}_${actionId}_${parameterName}`;
		}

		// Case 2: Trigger field
		if (triggerId && triggerField) {
			return `${workflow.id}_${triggerId}_${triggerField}`;
		}

		// Case 3: Condition field
		if (conditionId && conditionField) {
			return `${workflow.id}_${conditionId}_${conditionField}`;
		}

		return null;
	}

	// This is used to save the current code snippet for that specific field
	const saveSnippet = () => {
		if (!userdata?.active_org?.id) {
			toast.error("Missing organization");
			return;
		}

		if (!localcodedata || localcodedata.trim().length === 0) {
			toast.error("Nothing to save");
			return;
		}

		const snippetKey = generateSnippetKey();
		if (!snippetKey) {
			toast.error("Unable to generate snippet key. Please ensure you're editing an action, trigger, or condition.");
			return;
		}

		setIsSavingSnippet(true);

		fetch(`${globalUrl}/api/v1/orgs/${userdata.active_org.id}/set_cache`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				key: snippetKey,
				value: localcodedata,
				category: "editor-snippets",
			}),
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for save snippet");
					return;
				}
				return response.json();
			})
			.then((responseJson) => {
				if (responseJson && responseJson.success === true) {
					toast.success("Code snippet saved!");
				} else {
					toast.error(responseJson?.reason || "Failed to save snippet");
				}
			})
			.catch((error) => {
				toast.error("Failed to save snippet: " + error.toString());
			})
			.finally(() => {
				setIsSavingSnippet(false);
			});
	}

	// This is used to restore the last saved code snippet for that specific field
	const restoreSnippet = () => {
		if (!userdata?.active_org?.id) {
			toast.error("Missing organization");
			return;
		}

		const snippetKey = generateSnippetKey();
		if (!snippetKey) {
			toast.error("Unable to get snippet key.");
			return;
		}

		setIsRestoringSnippet(true);

		fetch(`${globalUrl}/api/v1/orgs/${userdata.active_org.id}/list_cache?category=editor-snippets&key=${encodeURIComponent(snippetKey)}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for restore snippet");
					return;
				}
				return response.json();
			})
			.then((responseJson) => {
				if (responseJson && responseJson.success === true && responseJson.keys && responseJson.keys.length > 0) {
					const savedValue = responseJson.keys[0].value;
					if (savedValue !== undefined && savedValue !== null) {
						setlocalcodedata(savedValue);
						setcodedata(savedValue);
						toast.success("Code restored from last saved version!");
					} else {
						toast.error("No saved code found for this field");
					}
				} else {
					toast.error("No saved snippet found. Save a snippet first.");
				}
			})
			.catch((error) => {
				toast.error("Failed to restore snippet: " + error.toString());
			})
			.finally(() => {
				setIsRestoringSnippet(false);
			});
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

	return {
		theme,
		themeMode,
		navigate,

		localcodedata,
		setlocalcodedata,
		validation,
		expOutput,
		markers,
		availableVariables,
		mainVariables,

		selectedAction,
		setSelectedAction,
		selectedTrigger,
		selectedCondition,

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

		isAiLoading,
		executing,
		executionResult,
		setExecutionResult,
		fullScreenModeEnabled,
		setFullScreenModeEnabled,

		highlight_variables,
		expectedOutput,
		autoFormat,
		handleItemClick,
		handleClick,
		executeSingleAction,
		HandleJsonCopy,
		customCompleter,
		editorLoad,
	}
}

export default useShuffleCodeEditor;
