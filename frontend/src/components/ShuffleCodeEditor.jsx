import React, {useState, useEffect, useLayoutEffect} from 'react';
import {Dialog, Modal, DialogTitle, DialogContent} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/gruvbox-dark.css';

const Textfield = (props) => {

    const {expansionModalOpen, setExpansionModalOpen} = props
    const {codedata, setcodedata} = props
	const [localcodedata, setlocalcodedata] = React.useState("print('Hello')");
    // const {codelang, setcodelang} = props
    const theme = useTheme();

	return (
		<Dialog modal 
			open={expansionModalOpen} 
			onClose={() => {
				setExpansionModalOpen(false)
			}}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: 600,
					padding: 50, 
				},
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'right',
				}}
			>
				<button
					style={{
						color: "white",
						background: "#27292d",
						border: "2px solid white",
						borderRadius: '50%',
						fontSize: 15,
						width: 40,
						height: 40,
						cursor: "pointer"
					}}
					onClick={() => {
						setExpansionModalOpen(false)
					}}
				>
					╳
				</button>
			</div>
			<DialogTitle><span style={{color: "white"}}>Code Editor</span></DialogTitle>
			<CodeMirror
				value = {codedata}
				height="200px"
				onChange={(value) => {
					// setcodedata(value.getValue())
                    setlocalcodedata(value.getValue())
				}}
				options={{
					theme: 'gruvbox-dark',
					keyMap: 'sublime',
					mode: 'python',
					// mode: {codelang},
				}}
			/>
			<button
				style={{
					color: "white",
					background: "#f85a3e",
					border: "none",
					height: 35,
					cursor: "pointer"
				}}
				onClick={() => {
                    setcodedata(localcodedata)
					setExpansionModalOpen(false)
				}}
			>
				DONE
			</button>
		</Dialog>)
}

export default Textfield;