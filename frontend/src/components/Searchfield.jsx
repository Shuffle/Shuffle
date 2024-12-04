import React, { useState, useEffect, useRef, useContext } from 'react';

import theme from '../theme.jsx';
import { useNavigate, Link, useParams } from "react-router-dom";
import SearchBox from "../components/SearchData.jsx";

import { Context } from '../context/ContextApi.jsx';

import {
	Chip,
	IconButton,
	TextField,
	InputAdornment,
	List,
	Card,
	ListItem,
	Button,
	Dialog,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Typography,
	Tooltip,
	Divider,
	DialogTitle,
	DialogContent,
} from '@mui/material';

import Mousetrap from 'mousetrap';

import {
	AvatarGroup,
} from "@mui/material"

import { Search as SearchIcon, Close as CloseIcon, Folder as FolderIcon, Code as CodeIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material'
import KeyboardCommandKeyIcon from '@mui/icons-material/KeyboardCommandKey';
import aa from 'search-insights'
import { InstantSearch, Configure, connectSearchBox, connectHits, Index } from 'react-instantsearch-dom';
//import { InstantSearch, SearchBox, Hits, connectSearchBox, connectHits, Index } from 'react-instantsearch-dom';

import { HotKeys } from 'react-hotkeys';
// https://www.algolia.com/doc/api-reference/widgets/search-box/react/
const chipStyle = {
	backgroundColor: "#3d3f43", height: 30, marginRight: 5, paddingLeft: 5, paddingRight: 5, height: 28, cursor: "pointer", borderColor: "#3d3f43", color: "white",
}

const SearchField = props => {
	const { serverside, userdata, isMobile, isLoaded, globalUrl, isHeader, isLoggedIn, small, rounded } = props

	const {searchBarModalOpen, setSearchBarModalOpen} = useContext(Context);

	let navigate = useNavigate();
	const borderRadius = 3
	const node = useRef()
	const [searchOpen, setSearchOpen] = useState(false)
	// const [modalOpen, setModalOpen] = React.useState(false);
	const [oldPath, setOldPath] = useState("")
	const [value, setValue] = useState("");
	useEffect(() => {
		Mousetrap.bind(['command+k', 'ctrl+k'], () => {
			setSearchBarModalOpen(true);
			return false; // Prevent the default action
		});
		Mousetrap.bind(['esc'], () => {
			setSearchBarModalOpen(false);
			return false; // Prevent the default action
		});

		return () => {
			Mousetrap.unbind(['command+k', 'ctrl+k']);
		};
	}, []);

	const fieldWidth = small === true ? 120 : 310 
	const modalView = (
		// console.log("key:", dataValue.key),
		//console.log("value:",dataValue.value),
		<Dialog
			open={searchBarModalOpen}
			onClose={() => {
				setSearchBarModalOpen(false);
			}}
			PaperProps={{
				style: {
					color: "white",
					minWidth: 750,
					height: 785,
					borderRadius: 16,
					border: "1px solid var(--Container-Stroke, #494949)",
					background: "var(--Container, #000000)",
					boxShadow: "0px 16px 24px 8px rgba(0, 0, 0, 0.25)",
					zIndex: 13000,
				},
			}}
		>
			{isHeader ? <div style={{ display: "flex"}}>
				<DialogTitle style={{ marginTop: 15, marginLeft: 5, color: "var(--Paragraph-text, #C8C8C8)" }} >Search for Docs, Apps, Workflows and more</DialogTitle>
				<Button color="secondary" fullWidth style={{ marginLeft:180, }} onClick={() => {
					setSearchBarModalOpen(false);
				}}><CloseIcon /></Button>
			</div>
				: null}
			<DialogContent className='dialog-content' style={{}}>
				<SearchBox globalUrl={globalUrl} serverside={serverside} userdata={userdata} />
			</DialogContent>
			<Divider style={{overflow: "hidden"}}/>
			<span style={{display:"flex", width:"100%", height:30}}>
				{/* <div style={{display: "flex", marginTop: 6, marginBottom: 6, marginRight: 100, marginLeft: 20, alignItems: "center"}}>
				<Typography variant="body2" style={{ fontSize: 16, fontWidth: 550, color: "var(--Paragraph-text, #C8C8C8)"}}>
					Discord 

				<a rel="noopener noreferrer" href="https://discord.com/invite/B2CBzUm" target="_blank" style={{ textDecoration: "none", color: "white" }}>
					<img src={"/images/social/discode.svg"} alt="Algolia logo" style={{ height: 22, marginLeft: 5, marginTop: 3, }} />
				</a>
				</div>
				<div style={{ display: "flex", marginTop: 6, marginBottom: 6, marginLeft: 440 }}>
				<Typography variant="body2" style={{color: "var(--Paragraph-text, #C8C8C8)"}}>
					Search by
				</Typography>
				<a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{ textDecoration: "none", color: "white" }}>
					<img src={"/images/logo-algolia-nebula-blue-full.svg"} alt="Algolia logo" style={{ height: 17, marginLeft: 5, marginTop: 3, }} />
				</a>
				</div>
				*/}

			</span>
		</Dialog>
	);

	return (
		<div style={{ marginTop: "auto", marginLeft: !isLoggedIn ? 0: "auto", marginRight: !isLoggedIn ? 0 : "auto", width: !isLoggedIn ? "auto" : 410, }}>
			{modalView}
			<TextField
				style={{ backgroundColor: "#212121", height: 48, borderRadius: rounded === true ? 25 : theme.palette?.borderRadius, minWidth: fieldWidth, maxWidth: fieldWidth, }}
				InputProps={{
					style: {
						color: "white",
						fontSize: "1em",
						height: 50,
						margin: 7,
						fontSize: "0.9em",
					},
					readOnly: true,
					disableUnderline: true,
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon style={{ color: "#f86a3e", }} />
						</InputAdornment>
					),
					endAdornment: (
						<Button position="end" style={{ marginLeft: 10, width: 15 }}>
							<KeyboardCommandKeyIcon style={{ width: 15 }} />
							+ K
						</Button>
					)
				}}
				variant="standard"
				autoComplete='off'
				color="primary"
				placeholder="Search Apps, Workflows, Docs..."
				onClick={(event) => {
					setSearchBarModalOpen(true)
				}}
				limit={5}
			/>
		</div>
	)
}

export default SearchField;
