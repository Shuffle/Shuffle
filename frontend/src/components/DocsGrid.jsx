import React, {useEffect, useState} from 'react';

import theme from '../theme.jsx';
import ReactGA from 'react-ga4';
import {Link} from 'react-router-dom';
import { removeQuery } from '../components/ScrollToTop.jsx';

import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon, Close as CloseIcon, Folder as FolderIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material';
import aa from 'search-insights'

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import { 
	Zoom, 
	Grid, 
	Paper, 
	TextField, 
	Avatar, 
	ButtonBase, 
	InputAdornment, 
	Typography, 
	Button, 
	Tooltip,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
} from '@mui/material';

	

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const DocsGrid = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs, userdata, }  = props
	const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows
	const xs = parsedXs === undefined || parsedXs === null ? isMobile ? 6 : 2 : parsedXs
	//const [apps, setApps] = React.useState([]);
	//const [filteredApps, setFilteredApps] = React.useState([]);
	const [formMail, setFormMail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [formMessage, setFormMessage] = React.useState("");

	const buttonStyle = {borderRadius: 30, height: 50, width: 220, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18,}

	const innerColor = "rgba(255,255,255,0.65)"
	const borderRadius = 3
	window.title = "Shuffle | Apps | Find and integrate any app"

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

	const SearchBox = ({currentRefinement, refine, isSearchStalled} ) => {
		var defaultSearch = ""
		if (window !== undefined && window.location !== undefined && window.location.search !== undefined && window.location.search !== null) {
			const urlSearchParams = new URLSearchParams(window.location.search)
			const params = Object.fromEntries(urlSearchParams.entries())
			const foundQuery = params["q"]
			if (foundQuery !== null && foundQuery !== undefined) {
				console.log("Got query: ", foundQuery)
				refine(foundQuery)
				defaultSearch = foundQuery
			}
		}

		return (
		  <form noValidate action="" role="search">
				<TextField 
					defaultValue={defaultSearch}
					fullWidth
					style={{backgroundColor: theme.palette.inputColor, borderRadius: borderRadius, margin: 10, width: "100%",}} 
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
					autoComplete='off'
					type="search"
					color="primary"
					placeholder="Search our Documentation..."
					id="shuffle_search_field"
					onChange={(event) => {
						removeQuery("q")
						refine(event.currentTarget.value)
					}}
					onKeyDown={(event) => {
						if(event.key === "Enter") {
							event.preventDefault();
						}
					}}
					limit={5}
				/>
				{/*isSearchStalled ? 'My search is stalled' : ''*/}
			</form>
		)
	}

	var workflowDelay = -50
	const Hits = ({ hits }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		//console.log(hits)
		//var curhits = hits
		//if (hits.length > 0 && defaultApps.length === 0) {
		//	setDefaultApps(hits)
		//}

		//const [defaultApps, setDefaultApps] = React.useState([])
		//console.log(hits)
		//if (hits.length > 0 && hits.length !== innerHits.length) {
		//	setInnerHits(hits)
		//}

		var counted = 0
		return (
			<List>
				{hits.map((data, index) => {
					workflowDelay += 50
				
					const innerlistitemStyle = {
						width: "100%",
						overflowX: "hidden",
						overflowY: "hidden",
						borderBottom: "1px solid rgba(255,255,255,0.4)",
						backgroundColor: mouseHoverIndex === index ? "#1f2023" : "inherit",
						cursor: "pointer",
						marginLeft: 5, 
						marginRight: 5,
						maxHeight: 75,
						minHeight: 75,
						maxWidth: 420,
						minWidth: "100%", 
					}

					if (counted >= 12/xs*rowHandler) {
						return null
					}

					counted += 1

					var name = data.name === undefined ? 
							data.filename.charAt(0).toUpperCase() + data.filename.slice(1).replaceAll("_", " ") + " - " + data.title : 
							(data.name.charAt(0).toUpperCase()+data.name.slice(1)).replaceAll("_", " ")

					if (name.length > 96) {
						name = name.slice(0, 96)+"..."
					}

					//const secondaryText = data.data !== undefined ? data.data.slice(0, 100)+"..." : ""
					const secondaryText = data.data !== undefined ? data.data.slice(0, 100)+"..." : ""
					const baseImage = <CodeIcon/> 
					const avatar = data.image_url === undefined ? 
						baseImage
						:
						<Avatar 
							src={data.image_url}
							variant="rounded"
						/>

					var parsedUrl = data.urlpath !== undefined ? data.urlpath : ""
					parsedUrl += `?queryID=${data.__queryID}`

					return (
						<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
							<Link key={data.objectID} to={parsedUrl} style={{textDecoration: "none", color: "white",}} onClick={(event) => {
								aa('init', {
										appId: searchClient.appId,
										apiKey: searchClient.transporter.queryParameters["x-algolia-api-key"]
								})

								const timestamp = new Date().getTime()
								aa('sendEvents', [
									{
										eventType: 'click',
										eventName: 'Product Clicked Appgrid',
										index: 'documentation',
										objectIDs: [data.objectID],
										timestamp: timestamp,
										queryID: data.__queryID,
										positions: [data.__position],
										userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
									}
								])

								console.log("CLICK")
							}}>
								<ListItem key={data.objectID} style={innerlistitemStyle} onMouseOver={() => {
									setMouseHoverIndex(index)	
								}}>
									<ListItemAvatar>
										{avatar}
									</ListItemAvatar>
									<ListItemText
										primary={name}
										secondary={secondaryText}
									/>
									{/*
									<ListItemSecondaryAction>
										<IconButton edge="end" aria-label="delete">
											<DeleteIcon />
										</IconButton>
									</ListItemSecondaryAction>
									*/}
								</ListItem>
							</Link>
						</Zoom>
					)
				})}
			</List>
		)
	}

	const CustomSearchBox = connectSearchBox(SearchBox)
	const CustomHits = connectHits(Hits)
	const selectButtonStyle = {
		minWidth: 150,
		maxWidth: 150,
		minHeight: 50, 
	}

	return (
		<div style={{width: "100%", textAlign: "center", position: "relative", height: "100%", display: "flex"}}>
			{/*
			<div style={{padding: 10, }}>
				<Button 
					style={selectButtonStyle}
					variant="outlined"
					onClick={() => {
    				const searchField = document.createElement("shuffle_search_field")
						console.log("Field: ", searchField)
						if (searchField !== null & searchField !== undefined) {
							console.log("Set field.")
							searchField.value = "WHAT WABALABA"
							searchField.setAttribute("value", "WHAT WABALABA")
						}
					}}
				>
					Cases
				</Button>
			</div>
			*/}
			<div style={{width: "100%", position: "relative", height: "100%", padding: "0px 180px"}}>
				<InstantSearch searchClient={searchClient} indexName="documentation">
					<div style={{maxWidth: 450, margin: "auto", marginTop: 15, marginBottom: 15, }}>
						<CustomSearchBox />
					</div>
					<Configure clickAnalytics />
					<CustomHits hitsPerPage={5}/>
				</InstantSearch>
				{showSuggestion === true ? 
					<div style={{paddingTop: 0, maxWidth: isMobile ? "100%" : "60%", margin: "auto"}}>
						<Typography variant="h6" style={{color: "white", marginTop: 50,}}>
							Can't find what you're looking for? 
						</Typography>
						<div style={{flex: "1", display: "flex", flexDirection: "row", textAlign: "center",}}>
							<TextField
								required
								style={{flex: "1", marginRight: "15px", backgroundColor: theme.palette.inputColor}}
								InputProps={{
									style:{
										color: "#ffffff",
									},
								}}
								color="primary"
								fullWidth={true}
								placeholder="Email (optional)"
								type="email"
							  id="email-handler"
								autoComplete="email"
								margin="normal"
								variant="outlined"
    	  	 				onChange={e => setFormMail(e.target.value)}
							/>
							<TextField
								required
								style={{flex: "1", backgroundColor: theme.palette.inputColor}}
								InputProps={{
									style:{
										color: "#ffffff",
									},
								}}
								color="primary"
								fullWidth={true}
								placeholder="What are we missing?"
								type=""
							  id="standard-required"
								margin="normal"
								variant="outlined"
								autoComplete="off"
    	  	 			onChange={e => setMessage(e.target.value)}
							/>
						</div>
						<Button
							variant="contained"
							color="primary"
							style={buttonStyle}
							disabled={message.length === 0}
							onClick={() => {
								submitContact(formMail, message)
							}}
						>
							Submit	
						</Button>
						<Typography style={{color: "white"}} variant="body2">{formMessage}</Typography>
					</div>
					: null
				}

				<span style={{position: "absolute", display: "flex", textAlign: "right", float: "right", right: 0, bottom: 120, }}>
					<Typography variant="body2" color="textSecondary" style={{}}>
						Search by 
					</Typography>
					<a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{textDecoration: "none", color: "white"}}>
						<img src={"/images/logo-algolia-nebula-blue-full.svg"} alt="Algolia logo" style={{height: 17, marginLeft: 5, marginTop: 3,}} />
					</a>
				</span>
			</div>
		</div>
	)
}

export default DocsGrid;
