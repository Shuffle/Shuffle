import React, { useState, useEffect } from 'react';

import {Link} from 'react-router-dom';
import theme from '../theme.jsx';

import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon } from '@mui/icons-material';

//import algoliasearch from 'algoliasearch/lite';
import algoliasearch from 'algoliasearch';
import { InstantSearch, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import { Grid, Paper, TextField, ButtonBase, InputAdornment, Typography, Button, Tooltip} from '@mui/material';

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const WorkflowSearch = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs, newSelectedApp, setNewSelectedApp, defaultSearch, showSearch, ConfiguredHits, selectAble, }  = props
	const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows

	const xs = parsedXs === undefined || parsedXs === null ? 12 : parsedXs
	//const [apps, setApps] = React.useState([]);
	//const [filteredApps, setFilteredApps] = React.useState([]);
	const [formMail, setFormMail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [formMessage, setFormMessage] = React.useState("");
	const [selectedApp, setSelectedApp] = React.useState({});

	const buttonStyle = {borderRadius: 30, height: 50, width: 220, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18,}

	const innerColor = "rgba(255,255,255,0.65)"
	const borderRadius = 3
	window.title = "Shuffle | Apps | Find and integration any app"

	const submitContact = (email, message) => {
		const data = {
			"firstname": "",
			"lastname": "",
			"title": "",
			"companyname": "",
			"email": email,
			"phone": "",
			"message": message,
		}
	
		const errorMessage = "Something went wrong. Please contact frikky@shuffler.io directly."

		fetch(globalUrl+"/api/v1/contact", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
		.then(response => response.json())
		.then(response => {
			if (response.success === true) {
				setFormMessage(response.reason)
				//toast("Thanks for submitting!")
			} else {
				setFormMessage(errorMessage)
			}

			setFormMail("")
			setMessage("")
    })
		.catch(error => {
			setFormMessage(errorMessage)
    	console.log(error)
		});
	}

	// value={currentRefinement}
	const SearchBox = ({currentRefinement, refine, isSearchStalled} ) => {
		useEffect(() => {
			//console.log("FIRST LOAD ONLY? RUN REFINEMENT: !", currentRefinement)
			if (defaultSearch !== undefined && defaultSearch !== null) {
				refine(defaultSearch)
			}
		}, [])

		return (
		  <form noValidate action="" role="search">
				<TextField 
					fullWidth
					style={{backgroundColor: theme.palette.inputColor, borderRadius: borderRadius, width: "100%",}} 
					InputProps={{
						style:{
							color: "white",
							fontSize: "1em",
							height: 50,
						},
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon style={{marginLeft: 5}}/>
							</InputAdornment>
						),
					}}
					autoComplete='on'
					type="search"
					color="primary"
					defaultValue={defaultSearch}
					placeholder={`Find ${defaultSearch} Workflows...`}
					id="shuffle_workflow_search_field"
					onChange={(event) => {
						refine(event.currentTarget.value)
					}}
					limit={5}
				/>
				{/*isSearchStalled ? 'My search is stalled' : ''*/}
			</form>
		)
		//value={currentRefinement}
	}

	if (selectAble === true) {
		console.log("Make it possible to select a Workflow!!")
	}

	const Hits = ({ hits }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		var counted = 0

		return (
			<Grid container spacing={0} style={{border: "1px solid rgba(255,255,255,0.2)", maxHeight: 250, minHeight: 250, overflowY: "auto", overflowX: "hidden",}}>
				{hits.map((data, index) => {
					const paperStyle = {
						backgroundColor: index === mouseHoverIndex ? "rgba(255,255,255,0.8)" : theme.palette.inputColor,
						color: index === mouseHoverIndex ? theme.palette.inputColor : "rgba(255,255,255,0.8)", 
						border: newSelectedApp.objectID !== data.objectID ? `1px solid rgba(255,255,255,0.2)` : "2px solid #f86a3e", 
						textAlign: "left",
						padding: 10,
						cursor: "pointer",
						position: "relative",
						overflow: "hidden",
						width: "100%", 
					}
	
					if (counted === 12/xs*rowHandler) {
						return null
					}

					counted += 1
					var parsedname = ""
					for (var key = 0; key < data.name.length; key++) {
						var character = data.name.charAt(key)
						if (character === character.toUpperCase()) {
							//console.log(data.name[key], data.name[key+1])
							if (data.name.charAt(key+1) !== undefined && data.name.charAt(key+1) === data.name.charAt(key+1).toUpperCase()) {
							} else {
								parsedname += " "
							}
						}

						parsedname += character
					}
					
					parsedname = (parsedname.charAt(0).toUpperCase()+parsedname.substring(1)).replaceAll("_", " ")

					return (
						<Paper key={index} elevation={0} style={paperStyle} onMouseOver={() => {
							setMouseHoverIndex(index)
						}} onMouseOut={() => {
							setMouseHoverIndex(-1)
						}} onClick={() => {
							setNewSelectedApp(data)
						}}>
							<div style={{display: "flex"}}>
								{/*<img alt={data.name} src={data.image_url} style={{width: "100%", maxWidth: 30, minWidth: 30, minHeight: 30, maxHeight: 30, display: "block", }} />*/}
								<Typography variant="body1" style={{marginTop: 2, marginLeft: 10, }}>
									{parsedname}
								</Typography>
							</div>
						</Paper>
					)
				})}
			</Grid>
		)
	}

	const InputHits = ConfiguredHits === undefined ? Hits : ConfiguredHits
	const CustomSearchBox = connectSearchBox(SearchBox)
	const CustomHits = connectHits(InputHits)

	return (
		<div style={{width: "100%", textAlign: "center", position: "relative", height: "100%",}}>
			<InstantSearch searchClient={searchClient} indexName="workflows">
				{/* showSearch === false ? null : 
					<div style={{maxWidth: 450, margin: "auto", }}>
						<CustomSearchBox />
					</div>
				*/}
				<div style={{maxWidth: 450, margin: "auto", }}>
					<CustomSearchBox />
				</div>
				<CustomHits hitsPerPage={5}/>
			</InstantSearch>
		</div>
	)
}

export default WorkflowSearch;
