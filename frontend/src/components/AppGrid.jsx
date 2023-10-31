import React, {useEffect, useState} from 'react';

import theme from '../theme.jsx';
import ReactGA from 'react-ga4';
import {Link} from 'react-router-dom';
import { removeQuery } from '../components/ScrollToTop.jsx';

import { 
	Search as SearchIcon, 
	CloudQueue as CloudQueueIcon, 
	Code as CodeIcon 
} from '@mui/icons-material';

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, connectSearchBox, connectHits, connectHitInsights } from 'react-instantsearch-dom';

import aa from 'search-insights'

import { 
	Zoom, 
	Grid, 
	Paper, 
	TextField, 
	ButtonBase, 
	InputAdornment, 
	Typography, 
	Button, 
	Tooltip
} from '@mui/material';

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
//const searchClient = algoliasearch("L55H18ZINA", "a19be455e7e75ee8f20a93d26b9fc6d6")
const AppGrid = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs, userdata }  = props

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

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
		//useEffect(() => {
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
		//}, [])

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
					placeholder="Find Apps..."
					id="shuffle_search_field"
					onChange={(event) => {
						// Remove "q" from URL
						removeQuery("q")

						refine(event.currentTarget.value)
					}}
					limit={5}
				/>
				{/*isSearchStalled ? 'My search is stalled' : ''*/}
			</form>
		)
	}

	var workflowDelay = -50
	const Hits = ({ hits, insights }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		var counted = 0

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

		return (
			<Grid container spacing={2}>
				{hits.map((data, index) => {

					workflowDelay += 50

					const paperStyle = {
						backgroundColor: index === mouseHoverIndex ? "rgba(255,255,255,0.8)" : theme.palette.inputColor,
						color: index === mouseHoverIndex ? theme.palette.inputColor : "rgba(255,255,255,0.8)", 
						border: `1px solid ${innerColor}`, 
						padding: 15,
						cursor: "pointer",
						position: "relative",
						minHeight: 116,
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
					const appUrl = isCloud ? `/apps/${data.objectID}?queryID=${data.__queryID}` : `https://shuffler.io/apps/${data.objectID}?queryID=${data.__queryID}`
					return (
						<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
							<Grid item xs={xs} key={index}>
								<a href={appUrl} rel="noopener noreferrer" target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>
									<Paper elevation={0} style={paperStyle} onMouseOver={() => {
										setMouseHoverIndex(index)
										/*
										ReactGA.event({
											category: "app_grid_view",
											action: `search_bar_click`,
											label: "",
										})
										*/
									}} onMouseOut={() => {
										setMouseHoverIndex(-1)
									}} onClick={() => {
										if (isCloud) {
											ReactGA.event({
												category: "app_grid_view",
												action: `app_${parsedname}_${data.id}_click`,
												label: "",
											})
										}

										//const searchClient = algoliasearch("L55H18ZINA", "a19be455e7e75ee8f20a93d26b9fc6d6")
										console.log(searchClient)
										aa('init', {
											appId: searchClient.appId,
											apiKey: searchClient.transporter.queryParameters["x-algolia-api-key"]
										})

										const timestamp = new Date().getTime()
										aa('sendEvents', [
											{
												eventType: 'click',
												eventName: 'Product Clicked',
												index: 'appsearch',
												objectIDs: [data.objectID],
												timestamp: timestamp,
												queryID: data.__queryID,
												positions: [data.__position],
												userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
											}
										])

									}}>
										<ButtonBase style={{padding: 5, borderRadius: 3, minHeight: 100, minWidth: 100,}}>
											<img alt={data.name} src={data.image_url} style={{width: "100%", maxWidth: 100, minWidth: 100, minHeight: 100, maxHeight: 100, display: "block", margin: "0 auto"}} />
										</ButtonBase>
										<div/>
										{index === mouseHoverIndex || showName === true ? 
											parsedname
											: 
											null
										}
										{data.generated ?
											<Tooltip title={"Created with App editor"} style={{marginTop: "28px", width: "100%"}} aria-label={data.name}>
												{data.invalid ? 
													<CloudQueueIcon style={{position: "absolute", top: 1, left: 3, height: 16, width: 16, color: theme.palette.primary.main }}/> 
													:
													<CloudQueueIcon style={{position: "absolute", top: 1, left: 3, height: 16, width: 16, color:  "rgba(255,255,255,0.95)",}}/> 
												}
											</Tooltip>
											: 
											<Tooltip title={"Created with python (custom app)"} style={{marginTop: "28px", width: "100%"}} aria-label={data.name}>
												<CodeIcon style={{position: "absolute", top: 1, left: 3, height: 16, width: 16, color:  "rgba(255,255,255,0.95)",}}/> 
											</Tooltip>
										}
									</Paper>
								</a>
							</Grid>
						</Zoom>
					)
				})}
			</Grid>
		)
	}

	const CustomSearchBox = connectSearchBox(SearchBox)
	const CustomHits = connectHits(Hits)
	//const CustomHits = connectHitInsights(aa)(Hits)
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
			<div style={{width: "100%", position: "relative", height: "100%",}}>
				<InstantSearch searchClient={searchClient} indexName="appsearch">
					<div style={{maxWidth: 450, margin: "auto", marginTop: 15, marginBottom: 15, }}>
						<CustomSearchBox />
					</div>
					<CustomHits hitsPerPage={5}/>
				  <Configure clickAnalytics />
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
								placeholder="What apps do you want to see?"
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

				<span style={{position: "absolute", display: "flex", textAlign: "right", float: "right", right: 0, bottom: isMobile?"":120, }}>
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

export default AppGrid;
