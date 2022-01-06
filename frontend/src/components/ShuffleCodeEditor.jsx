import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
	IconButton, 
	Dialog, 
	Modal, 
	Tooltip,
	DialogTitle, 
	DialogContent
} from '@material-ui/core';

import {
	FullscreenExit as FullscreenExitIcon,
} from "@material-ui/icons";

import { useTheme } from '@material-ui/core/styles';

import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/gruvbox-dark.css';

const CodeEditor = (props) => {
	const { fieldCount, setFieldCount, actionlist, changeActionParameterCodeMirror, expansionModalOpen, setExpansionModalOpen, codedata, setcodedata } = props
	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);
  // const {codelang, setcodelang} = props
  const theme = useTheme();
	const [validation, setvalidation] = React.useState(" ");
	const [expOutput, setexpOutput] = React.useState(" ");

	function IsJsonString(str) {
		try {
			var o = JSON.parse(str);
	    if (o && typeof o === "object") {
				setvalidation("Correct!")
			}
		} catch (e) {setvalidation("Incorrect!");}
	}
	
	function expectedOutput(input) {
		
		const found = input.match(/[$]{1}([a-zA-Z0-9_-]+\.?){1}([a-zA-Z0-9#_-]+\.?){0,}/g)
		//console.log(found)

		try{
			// When the found array is empty.
			for (var i = 0; i < found.length; i++) {
				// console.log(found[i]);

				for (var j = 0; j < actionlist.length; j++) {
					if(found[i].slice(1,).toLowerCase() == actionlist[j].autocomplete.toLowerCase()){
						input = input.replace(found[i], JSON.stringify(actionlist[j].example));
						// console.log(input)
						// console.log(actionlist[j].example)
					}	
					// console.log(actionlist[j].autocomplete);
				}
			}
		} catch (e) {}

		try {
			// var x = document.getElementById("expOutput");
			// x.innerHTML = JSON.stringify(JSON.parse(input), null, 4)
			setexpOutput(JSON.stringify(JSON.parse(input), null, 4))
		} catch (e) {
			setexpOutput(input)
		}

		// const obj = JSON.parse(input);
		// setexpOutput(JSON.stringify(JSON.parse(input), null, 4))
		// x.innerHTML = "<span style='font-size: 30px'>" + JSON.stringify(input, null, 4) + "</span>"
		// x.appendChild(document.createTextNode(JSON.stringify(JSON.parse(input), null, 4)));
		// setexpOutput(JSON.stringify(input, undefined, 4).replace('\ ', '\n'))
		// setexpOutput("Hi there \n Hey there")
		// Variables + Syntax highlighting + Validation
	}

	return (
		<Dialog 
			open={expansionModalOpen} 
			onClose={() => {
				//setExpansionModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: 600,
					padding: 25, 
				},
			}}
		>
			<div
				style={{
					display: 'flex',
				}}
			>
				<DialogTitle
					style={{
						paddingBottom:20,
						paddingLeft: 10, 
					}}
				>
						Code Editor
				</DialogTitle>
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
					onChange={(value) => {
						setlocalcodedata(value.getValue())
						expectedOutput(value.getValue())
						IsJsonString(value.getValue())
						// console.log(actionlist.slice(-1))
					}}
					options={{
						theme: 'gruvbox-dark',
						keyMap: 'sublime',
						mode: 'javascript',
						// mode: {codelang},
					}}
				/>
			</span>

			<div>
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
						maxHeight: 400,
					}}
				>
					{expOutput}
				</p>
				<p
					style={{
						color: "white",
						fontFamily: "monospace",
						padding: 20,
						paddingLeft: 10, 
						marginTop: -15,
					}}
				>
					JSON Validation: {validation}
				</p>
			</div>

			<div
				style={{
					display: 'flex',
				}}
			>
				<div>
					<button
						style={{
							color: "white",
							background: "#383b49",
							border: "none",
							height: 35,
							width: 290,
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
				</div>
				<div>
					<button
						style={{
							color: "white",
							background: "#f85a3e",
							border: "none",
							height: 35,
							width: 290,
							marginLeft: 10,
							marginTop: 20,
							cursor: "pointer"
						}}
						onClick={(event) => {
							console.log(codedata)
							console.log(fieldCount)
							changeActionParameterCodeMirror(event, fieldCount, localcodedata)
							setExpansionModalOpen(false)
							setcodedata(localcodedata)
						}}
					>
						Done
					</button>
				</div>
			</div>
		</Dialog>)
}

export default CodeEditor;
