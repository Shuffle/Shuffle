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
	const {fieldCount, setFieldCount} = props
	const {changeActionParameterCodeMirror} = props 
  	const {expansionModalOpen, setExpansionModalOpen} = props
  	const {codedata, setcodedata} = props
	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);
    // const {codelang, setcodelang} = props
  	const theme = useTheme();

	const [expOutput, setexpOutput] = React.useState(" ");
	function expectedOutput(input) {
		// const obj = JSON.parse(input);
		// setexpOutput(JSON.stringify(JSON.parse(input), null, 4))
		var x = document.getElementById("expOutput");
		x.innerHTML = JSON.stringify(input, null, 4)
		// x.innerHTML = JSON.stringify(JSON.parse(input), null, 4)
		// x.appendChild(document.createTextNode(JSON.stringify(JSON.parse(input), null, 4)));
		// setexpOutput(JSON.stringify(input, null, 4))

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
						color: "#f85a3e",
						fontFamily: "monospace",
						backgroundColor: "#282828",
						padding: 20,
						marginTop: -2,
						border: `2px solid ${theme.palette.inputColor}`,
						borderRadius: theme.palette.borderRadius,
					}}
				>
					{/* {expOutput} */}
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
						CANCEL
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
						DONE
					</button>
				</div>
			</div>
		</Dialog>)
}

export default CodeEditor;
