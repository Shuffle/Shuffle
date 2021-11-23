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
				{/* / Removed due to possible confusion between cancel, done and close buttons.
				<div
					style={{
						width: 60,
						marginLeft: 280,
						position: "absolute",
						top: 15,
						right: 15, 
					}}
				>
					<Tooltip title="Close editor" placement="top">
						<IconButton
							style={{
								color: "white",
								background: "#27292d",
								fontSize: 15,
								width: 50,
								height: 50,
								cursor: "pointer"
							}}
							onClick={() => {
								setExpansionModalOpen(false)
							}}
						>
							<FullscreenExitIcon />
						</IconButton>
					</Tooltip>
				</div>
				*/}
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
					}}
					options={{
						theme: 'gruvbox-dark',
						keyMap: 'sublime',
						mode: 'javascript',
						// mode: {codelang},
					}}
				/>
			</span>
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
