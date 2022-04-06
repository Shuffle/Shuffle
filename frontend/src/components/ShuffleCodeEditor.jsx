import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
	IconButton,
	Dialog, 
	Modal, 
	Tooltip,
	DialogTitle, 
	DialogContent,
	Typography,
	Paper
} from '@material-ui/core';

import Checkbox from '@mui/material/Checkbox';
import { orange } from '@mui/material/colors';
import { isMobile } from "react-device-detect" 

import {
	FullscreenExit as FullscreenExitIcon,
} from "@material-ui/icons";

import {
	AutoFixHigh as AutoFixHighIcon, CompressOutlined,
} from '@mui/icons-material';

import { useTheme } from '@material-ui/core/styles';
import { validateJson } from "../views/Workflows.jsx";
import ReactJson from "react-json-view";
import PaperComponent from "../components/PaperComponent.jsx";

import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/selection/mark-selection.js'
import 'codemirror/theme/gruvbox-dark.css';
import 'codemirror/theme/duotone-light.css';
import { padding, textAlign } from '@mui/system';

const CodeEditor = (props) => {
	const { fieldCount, setFieldCount, actionlist, changeActionParameterCodeMirror, expansionModalOpen, setExpansionModalOpen, codedata, setcodedata } = props
	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);
  	// const {codelang, setcodelang} = props
  	const theme = useTheme();
	const [validation, setValidation] = React.useState(false);
	const [expOutput, setExpOutput] = React.useState(" ");
	const [linewrap, setlinewrap] = React.useState(true);
	const [codeTheme, setcodeTheme] = React.useState("gruvbox-dark");
	const [editorPopupOpen, setEditorPopupOpen] = React.useState(false);

	const [currentCharacter, setCurrentCharacter] = React.useState(-1);
	const [currentLine, setCurrentLine] = React.useState(-1);

	const [variableOccurences, setVariableOccurences] = React.useState([]);
	const [currentLocation, setCurrentLocation] = React.useState([]);
	const [currentVariable, setCurrentVariable] = React.useState("");
	// useEffect(() => {
	// 	console.log(currentLocation)
	// }, [currentLocation])

	// const [allVariable, setAllVariable] = React.useState([]);
	var allVariable = []
	var mainVariables = []
	
	// console.log(actionlist.length)
	for(var i=0; i<actionlist.length; i++){
		allVariable.push('$'+actionlist[i].autocomplete.toLowerCase())
		mainVariables.push('$'+actionlist[i].autocomplete.toLowerCase())
		// console.log(actionlist[i])
		console.log(actionlist[i].example.length)
		// for(var j=0; j<actionlist[i].example.length; j++){
		// 	console.log(j)
		// 	allVariable.push('$'+actionlist[i].example[j].toLowerCase().substring(0, 25))
		// }
		for(let key in actionlist[i].example){
			// console.log(key)
			allVariable.push('$'+actionlist[i].autocomplete.toLowerCase()+'.'+key)
		}
	}

	// {actionlist.map((data, index) => {
		// console.log(data)
		// console.log(actionlist.length)
		// console.log(data.autocomplete)
		// allVariable.push('$'+data.autocomplete.substring(0, 25))
		// return (
		// 	<div
		// 		style={{
		// 			// textOverflow: 'ellipsis'
		// 		}}
		// 	>
		// 		<button
		// 			onClick={() => {
		// 				replaceVariables(data.autocomplete)
		// 				// console.log(currentCharacter, currentLine)
		// 			}}
		// 			style={{
		// 				backgroundColor: 'transparent',
		// 				color: 'white',
		// 				border: 'none',
		// 				padding: 7.5,
		// 				cursor: 'pointer',
		// 				width: '100%',
		// 				textAlign: 'left'
		// 			}}
		// 		>
		// 			${data.autocomplete.substring(0, 25)}
		// 			{Object.keys(data.example).forEach(key => key)}
		// 		</button>
		// 	</div>
		// )
	// })}

	const autoFormat = (input) => {
		if (validation !== true) {
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

	function findIndex(line, loc) {
		// var temp_arr = []
		// for(var i=0; i<string.length; i++) {
		// 	if (string[i] === "$") temp_arr.push(i);
		// }
		// return temp_arr
		// var line = currentLine
		// var loc = currentCharacter
		// console.log(line)
		// console.log(loc)
		var code_line = localcodedata.split('\n')[line]
		var dollar_occurences = []
		var dollar_occurences_len = []
		var variable_ranges = []
		var popup = false

		for(var ch=0; ch<code_line.length; ch++){
			if(code_line[ch] === '$'){
				dollar_occurences.push(ch)
			}
		}

		var variable_occurences = code_line.match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)

		try{
			for(var occ = 0; occ<variable_occurences.length; occ++){
				dollar_occurences_len.push(variable_occurences[occ].length)
			}
		} catch (e) {}

		for(var occ = 0; occ<dollar_occurences.length; occ++){
			// var temp_arr = []
			// for(var occ_len = 0; occ_len<dollar_occurences_len[occ]; occ_len++){
			// 	temp_arr.push(dollar_occurences[occ]+occ_len)
			// }
			// if(temp_arr === []){temp_arr=[dollar_occurences[occ]]}
			// temp_arr.push(temp_arr[temp_arr.length-1]+1)
			// variable_ranges.push(temp_arr)
			var temp_arr = [dollar_occurences[occ]]
			for(var occ_len = 0; occ_len<dollar_occurences_len[occ]; occ_len++){
				temp_arr.push(dollar_occurences[occ]+occ_len+1)
			}
			if(temp_arr.length==1){temp_arr.push(temp_arr[temp_arr.length-1]+1)}
			variable_ranges.push(temp_arr)
		}

		for(var occ = 0; occ<variable_ranges.length; occ++){
			for(var occ1 = 0; occ1<variable_ranges[occ].length; occ1++){
				// console.log(variable_ranges[occ][occ1])
				if(loc === variable_ranges[occ][occ1]){
					popup = true
					setCurrentLocation([line, dollar_occurences[occ]])
					console.log("Current Location : "+dollar_occurences[occ])
					try{
						setCurrentVariable(variable_occurences[occ])
						console.log("Current Variable : "+variable_occurences[occ])
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

		// console.log(variable_occurences)
		// console.log(dollar_occurences_len)
		// console.log(variable_ranges)
		// console.log(dollar_occurences)
	}

	function highlight_variables(value){
		// value.markText({line:0, ch:2}, {line:0, ch:8}, {"css": "background-color: #f85a3e; border-radius: 4px; color: white"})
		// value.markText({line:0, ch:13}, {line:0, ch:15}, {"css": "background-color: #f85a3e; border-radius: 4px; color: white"})
		// value.markText({line:0, ch:19}, {line:0, ch:26}, {"css": "background-color: #f85a3e; border-radius: 4px; color: white"})
		// value.markText({line:0, ch:31}, {line:0, ch:35}, {"css": "background-color: #f85a3e; border-radius: 4px; color: white"})
		// value.markText({line:0, ch:69}, {line:0, ch:73}, {"css": "background-color: #f85a3e; border-radius: 4px; color: white"})

		// var code_variables = value.getValue().match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)
		// console.log(code_variables)
		
		// var regex = /[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g
		// var code_variables_loc = regex.exec(value.getValue())
		// console.log(code_variables_loc)
		// while ((code_variables_loc = regex.exec(value.getValue())) != null) {
		// 	console.log(code_variables_loc);
		// }
		// var code_variables_loc = regex.exec(value.getValue())
		// console.log(code_variables_loc)

		var code_lines = localcodedata.split('\n')
		for (var i = 0; i<code_lines.length; i++){
			var current_code_line = code_lines[i]
			// console.log(current_code_line)

			var variable_occurence = current_code_line.match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)

			// console.log(variable_occurence)
			// console.log()

			// for (var j = 0; j < actionlist.length; j++) {
			// 	if(found[i].slice(1,).toLowerCase() === actionlist[j].autocomplete.toLowerCase()){
			// 		input = input.replace(found[i], JSON.stringify(actionlist[j].example));
			// 		console.log(input)
			// 		console.log(actionlist[j].example)
			// 	}
			// 	console.log(actionlist[j].autocomplete);
			// }

			var dollar_occurence = []
			for(var ch=0; ch<current_code_line.length; ch++){
				if(current_code_line[ch] === '$'){
					dollar_occurence.push(ch)
				}
			}
			console.log(dollar_occurence)

			var dollar_occurence_len = []
			try{
				for(var occ = 0; occ<variable_occurence.length; occ++){
					dollar_occurence_len.push(variable_occurence[occ].length)
				}
			} catch (e) {}
			console.log(dollar_occurence_len)

			try{
				// console.log(variable_occurence)
				for (var occ = 0; occ<variable_occurence.length; occ++){
					// value.markText({line:i, ch:dollar_occurence[occ]}, {line:i, ch:dollar_occurence_len[occ]+dollar_occurence[occ]}, {"css": "background-color: #8b8e26; border-radius: 4px; color: white"})
					// var correctVariable = actionlist.find(action => action.autocomplete.toLowerCase() === variable_occurence[occ].slice(1,).toLowerCase())
					var correctVariable = allVariable.includes(variable_occurence[occ].toLowerCase())
					// console.log(actionlist)
					if(!correctVariable) {
						value.markText({line:i, ch:dollar_occurence[occ]}, {line:i, ch:dollar_occurence_len[occ]+dollar_occurence[occ]}, {"css": "background-color: rgb(248, 106, 62, 0.9); padding-top: 2px; padding-bottom: 2px; color: white"})
					}
					else{
						value.markText({line:i, ch:dollar_occurence[occ]}, {line:i, ch:dollar_occurence_len[occ]+dollar_occurence[occ]}, {"css": "background-color: #8b8e26; padding-top: 2px; padding-bottom: 2px; color: white"})
					}
					// console.log(correctVariables)
				}
			} catch (e) {}
		}
	}

	// function findlocation(arr) {
	// 	for(var i=0; i<arr.length; i++) {
	// 		if (arr[i] != variableOccurences[i]){
	// 			return arr[i]
	// 		};
	// 	}
	// 	return null
	// }

	// function findVariables(string){
	// 	if (currentLocation != -1){
	// 		return string.slice(currentLocation+1).match(/[a-zA-Z0-9_.#-]*/g)[0]
	// 	}
	// 	return ""
	// }

	function replaceVariables(swapVariable){
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
			parsedVariable= "$"
		}

		code_lines[currentLine] = code_lines[currentLine].slice(0,currentLocation[1]) + "$" + swapVariable + code_lines[currentLine].slice(currentLocation[1]+parsedVariable.length,)
		// console.log(code_lines)
		var updatedCode = code_lines.join('\n')
		// console.log(updatedCode)
		setlocalcodedata(updatedCode)
	}

	function expectedOutput(input) {
		
		const found = input.match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)
		//console.log(found)

		try{
			// When the found array is empty.
			for (var i = 0; i < found.length; i++) {
				// console.log(found[i]);

				for (var j = 0; j < actionlist.length; j++) {
					if(found[i].slice(1,).toLowerCase() === actionlist[j].autocomplete.toLowerCase()){
						input = input.replace(found[i], JSON.stringify(actionlist[j].example));
						// console.log(input)
						// console.log(actionlist[j].example)
					}
					// console.log(actionlist[j].autocomplete);
				}
			}
		} catch (e) {}

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

	return (
		<Dialog
			disableEnforceFocus={true}
			hideBackdrop={true}
			disableBackdropClick={true}
			open={expansionModalOpen} 
			onClose={() => {
				console.log("In closer")
				changeActionParameterCodeMirror({target: {value: ""}}, fieldCount, localcodedata)
				//setExpansionModalOpen(false)
			}}
			PaperComponent={PaperComponent}
			aria-labelledby="draggable-dialog-title"
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: isMobile ? "100%" : 600,
					padding: isMobile ? "25px 10px 25px 10px" : 25,
					border: theme.palette.defaultBorder,
					zIndex: 10012,
				},
			}}
		>
			<div
				style={{
					display: 'flex',
				}}
			>
				<div style={{display: "flex"}}>
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
					<IconButton
						style={{
							marginLeft: isMobile ? "80%" : 400, 
							height: 50, 
							width: 50, 
						}}
						onClick={() => {
							autoFormat(localcodedata) 
						}}
					>
						<Tooltip
							color="primary"
							title={"Auto format data"}
							placement="top"
						>
							<AutoFixHighIcon style={{color: "rgba(255,255,255,0.7)"}}/>
						</Tooltip>
					</IconButton>
				</div>
			</div>
			
			<span style={{
				border: `2px solid ${theme.palette.inputColor}`,
				borderRadius: theme.palette.borderRadius,
			}}>
				<CodeMirror
					value = {localcodedata}
					height="200px"
					style={{
					}}
					onCursorActivity = {(value) => {
						// console.log(value.getCursor())
						setCurrentCharacter(value.getCursor().ch)
						setCurrentLine(value.getCursor().line)
						// console.log(value.getCursor().ch, value.getCursor().line)
						findIndex(value.getCursor().line, value.getCursor().ch)
						highlight_variables(value)
					}}
					onChange={(value) => {
						setlocalcodedata(value.getValue())
						expectedOutput(value.getValue())
						// console.log(allVariable)
						// console.log(value.getValue().split('\n')[value.getCursor().line])
						// console.log(value.getCursor())
						// console.log(value)
						// console.log(value.getValue().indexOf('$'))
						// console.log(value.display.input.prevInput)
						if(value.display.input.prevInput.startsWith('$') || value.display.input.prevInput.endsWith('$')){
							setEditorPopupOpen(true)
							// console.log(findIndex(value.getValue()))
							// console.log(findlocation(findIndex(value.getValue())))
								// setCurrentLocation(findlocation(findIndex(value.getValue())))
							// console.log(currentLocation)
							// console.log(findVariables(findlocation(findIndex(value.getValue())), value.getValue()))
							// setCurrentVariable(findVariables(findlocation(findIndex(value.getValue())), value.getValue()))
							// console.log(actionlist)
						}
							// setVariableOccurences(findIndex(value.getValue()))
							// setCurrentVariable(findVariables(value.getValue()))
							// console.log(currentLocation)
							// console.log(currentVariable)
						// console.log(findIndex(value.getValue()))
						// highlight_variables(value)
					}}
					options={{
						styleSelectedText: true,
						theme: codeTheme,
						keyMap: 'sublime',
						mode: 'javascript',
						lineWrapping: linewrap,
						// mode: {codelang},
					}}
				/>
			</span>
			{editorPopupOpen ?
				<Paper
					style={{
						margin: 10,
						padding: 10,
						width: isMobile ? "100%" : 250,
						height: 95,
						overflowY: 'auto',
						// textOverflow: 'ellipsis'
					}}
				>
					{mainVariables.map((data, index) => {
						// console.log(data)
						return (
							<div
								style={{
									// textOverflow: 'ellipsis'
								}}
							>
								<button
									onClick={() => {
										replaceVariables(data.substring(1,))
										// console.log(currentCharacter, currentLine)
									}}
									style={{
										backgroundColor: 'transparent',
										color: 'white',
										border: 'none',
										padding: 7.5,
										cursor: 'pointer',
										width: '100%',
										textAlign: 'left'
									}}
								>
									{data.substring(0, 25)}
									{/* {Object.keys(data.example).forEach(key => key)} */}
								</button>
							</div>
						)
					})}
				</Paper>
			: null}

			<div
				style={{
					marginBottom: -30,
				}}
			>
				{/*
				<Typography
					variant = 'body2'
					color = 'textSecondary'
					style={{
						color: "white",
						paddingLeft: 340,
						width: 50,
						display: 'inline',
					}}
				>
					Line Wrap
					<Checkbox
						onClick={() => {
							if (linewrap) {
								setlinewrap(false)
							}
							if (!linewrap){
								setlinewrap(true)
							}
						}}
						defaultChecked
						size="small"
						sx={{
							color: orange[600],
							'&.Mui-checked': {
							  color: orange[800],
							},
						}}
					/>
				</Typography>

				<Typography
					variant = 'body2'
					color = 'textSecondary'
					style={{
						color: "white",
						paddingLeft: 10,
						width: 100,
						display: 'inline',
					}}
				>
					Dark Theme
					<Checkbox
						onClick={() => {
							if (codeTheme === "gruvbox-dark") {
								setcodeTheme("duotone-light")
							}
							if (codeTheme === "duotone-light"){
								setcodeTheme("gruvbox-dark")
							}
						}}
						defaultChecked
						size="small"
						sx={{
							color: orange[600],
							'&.Mui-checked': {
							  color: orange[800],
							},
						}}
					/>
				</Typography>
				*/}

			</div>

			<div>
				{isMobile ? null : 
					<DialogTitle
						style={{
							paddingTop: 30,
							paddingLeft: 10, 
						}}
					>
						<span
							style={{
								color: "white"
							}}
						>
							Output
						</span>
					</DialogTitle>
				}
				{isMobile ? null : 
					validation === true ? 
						<ReactJson
							src={expOutput}
							theme={theme.palette.jsonTheme}
							style={{
								borderRadius: 5,
								border: `2px solid ${theme.palette.inputColor}`,
								padding: 10, 
								maxHeight: 250, 
								minheight: 250, 
								overflow: "auto",
							}}
							collapsed={false}
							enableClipboard={(copy) => {
								//handleReactJsonClipboard(copy);
							}}
							displayDataTypes={false}
							onSelect={(select) => {
								//HandleJsonCopy(validate.result, select, "exec");
							}}
							name={"JSON autocompletion"}
						/>
					:
						<p
							id='expOutput'
							style={{
								whiteSpace: "pre-wrap",
								color: "#f85a3e",
								fontFamily: "monospace",
								backgroundColor: "#282828",
								padding: 20,
								marginTop: -2,
								border: `2px solid ${theme.palette.inputColor}`,
								borderRadius: theme.palette.borderRadius,
								maxHeight: 250,
								overflow: "auto", 
							}}
						>
							{expOutput}
						</p>
				}
				<p
					style={{
						color: "white",
						fontFamily: "monospace",
						margin: 20,
						marginTop: 30,
					}}
				>
					JSON Validation: {validation ? "Correct" : "Incorrect"}
				</p>
			</div>

			<div
				style={{
					display: 'flex',
				}}
			>
				<button
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
						setExpansionModalOpen(false)
					}}
				>
					Cancel
				</button>
				<button
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
						// console.log(codedata)
						// console.log(fieldCount)
						changeActionParameterCodeMirror(event, fieldCount, localcodedata)
						setExpansionModalOpen(false)
						setcodedata(localcodedata)
					}}
				>
					Done
				</button>
			</div>
		</Dialog>)
}

export default CodeEditor;
