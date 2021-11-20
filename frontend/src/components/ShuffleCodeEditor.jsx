import React, {useState, useEffect, useLayoutEffect} from 'react';
import {Dialog, Modal, DialogTitle, DialogContent} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/gruvbox-dark.css';

const Textfield = (props) => {
	const {fieldCount, setFieldCount} = props
	const {changeActionParameterCodeMirror} = props 
    const {expansionModalOpen, setExpansionModalOpen} = props
    const {codedata, setcodedata} = props
	const [localcodedata, setlocalcodedata] = React.useState(codedata === undefined || codedata === null || codedata.length === 0 ? "" : codedata);
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
				}}
			>
				<DialogTitle
					style={{
						paddingBottom:20,
					}}
				>
					<span
						style={{
							color: "white"
						}}
					>
						Code Editor
					</span>
					<span
						style={{
							backgroundColor: "#f85a3e",
							padding: 6,
							paddingBottom: 6,
							paddingLeft: 12,
							paddingRight: 12,
							marginLeft: 20,
							marginBottom: 50,
							borderRadius: 10,
							color: "white",
							fontSize: "75%"
						}}
					>
						JavaScript
					</span>
				</DialogTitle>
				<div
					style={{
						width: 60,
						marginLeft: 280,
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
			</div>
			<CodeMirror
				value = {localcodedata}
				height="200px"
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

export default Textfield;