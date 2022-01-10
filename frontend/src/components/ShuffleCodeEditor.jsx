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

import {
	AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';

import { useTheme } from '@material-ui/core/styles';
import { validateJson } from "../views/Workflows.jsx";
import ReactJson from "react-json-view";

import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/gruvbox-dark.css';

const CodeEditor = (props) => {
	const { fieldCount, setFieldCount, actionlist, changeActionParameterCodeMirror, expansionModalOpen, setExpansionModalOpen, codedata, setcodedata } = props
	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);
  // const {codelang, setcodelang} = props
  const theme = useTheme();
	const [validation, setValidation] = React.useState(false);
	const [expOutput, setExpOutput] = React.useState(" ");

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
				<div style={{display: "flex"}}>
					<DialogTitle
						style={{
							paddingBottom:20,
							paddingLeft: 10, 
						}}
					>
							Code Editor
					</DialogTitle>
					<IconButton
						style={{
							marginLeft: 400, 
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
					height="250px"
					style={{
					}}
					onChange={(value) => {
						setlocalcodedata(value.getValue())
						expectedOutput(value.getValue())
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
				{validation === true ? 
					<ReactJson
						src={expOutput}
						theme={theme.palette.jsonTheme}
						style={{
							borderRadius: 5,
							border: "1px solid rgba(255,255,255,0.7)",
							padding: 5, 
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
						padding: 20,
						paddingLeft: 10, 
						marginTop: -15,
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
