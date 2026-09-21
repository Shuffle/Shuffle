import React, { useState, useEffect, useRef, useContext } from 'react';

import {getTheme} from '../theme.jsx';
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

// https://www.algolia.com/doc/api-reference/widgets/search-box/react/
const chipStyle = {
	backgroundColor: "#3d3f43", height: 30, marginRight: 5, paddingLeft: 5, paddingRight: 5, height: 28, cursor: "pointer", borderColor: "#3d3f43", color: "white",
}

const SearchField = props => {
	const { serverside, userdata, isMobile, isLoaded, globalUrl, isHeader, isLoggedIn, small, rounded } = props
	const {themeMode} = useContext(Context);
	const theme = getTheme(themeMode);
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
	const modalView = null;

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