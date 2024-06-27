import React, { useEffect, useState } from 'react';

import ReactGA from 'react-ga4';
import {Link} from 'react-router-dom';
import theme from '../theme.jsx';
import { removeQuery } from '../components/ScrollToTop.jsx';

import { 
	SkipNext as SkipNextIcon,
	SkipPrevious as SkipPreviousIcon,
	PlayArrow as PlayArrowIcon,
	VerifiedUser as VerifiedUserIcon, 
	Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon } from '@mui/icons-material';

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import { 
	Grid, 
	Paper, 
	TextField, 
	ButtonBase, 
	InputAdornment, 
	Typography, 
	Button, 
	Tooltip, 
	Card,
	Box,
	CardContent,
	IconButton,
	Zoom,
	CardMedia,
	CardActionArea,
} from '@mui/material';

import {
	Avatar,
  AvatarGroup,
} from "@mui/material"

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const CreatorGrid = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs, isHeader }  = props
	const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows
	const xs = parsedXs === undefined || parsedXs === null ? isMobile ? 6 : 4 : parsedXs
	//const [apps, setApps] = React.useState([]);
	//const [filteredApps, setFilteredApps] = React.useState([]);
	const [formMail, setFormMail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [formMessage, setFormMessage] = React.useState("");

	const buttonStyle = {borderRadius: 30, height: 50, width: 220, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18,}

	const isCloud =
		window.location.host === "localhost:3002" ||
		window.location.host === "shuffler.io";

	const innerColor = "rgba(255,255,255,0.65)"
	const borderRadius = 3
	window.title = "Shuffle | Workflows | Discover your use-case"

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
		var defaultSearch = ""
		if (window !== undefined && window.location !== undefined && window.location.search !== undefined && window.location.search !== null) {
			const urlSearchParams = new URLSearchParams(window.location.search)
			const params = Object.fromEntries(urlSearchParams.entries())
			const foundQuery = params["q"]
			if (foundQuery !== null && foundQuery !== undefined) {
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
					placeholder="Find Creators..."
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
				/>
				{/*isSearchStalled ? 'My search is stalled' : ''*/}
			</form>
		)
	}

	const paperAppContainer = {
    display: "flex",
    flexWrap: "wrap",
    alignContent: "space-between",
    marginTop: 5,
	padding:"0px 180px",
  }
	
	const Hits = ({ hits }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		var counted = 0

		return (
      <Grid container spacing={4} style={paperAppContainer}>
				{hits.map((data, index) => {
					if (counted === 12/xs*rowHandler) {
						return null
					}

					counted += 1
					const creatorUrl = !isCloud ? `https://shuffler.io/creators/${data.username}` : `/creators/${data.username}`

					return (
						<Zoom key={index} in={true} style={{}}>
							<Grid item xs={xs} style={{ padding: isHeader ? null : "12px 10px 12px 10px", }}>
								<Card style={{border: "1px solid rgba(255,255,255,0.3)", minHeight: 177, maxHeight: 177,}}>
									<a href={creatorUrl} rel="noopener noreferrer" target={isCloud ? "" : "_blank"} style={{textDecoration: "none", color: "inherit",}}>
						  			<CardActionArea style={{padding: "5px 10px 5px 10px", minHeight: 177, maxHeight: 177,}}>
											<CardContent sx={{ flex: '1 0 auto', minWidth: 160, maxWidth: 160, overflow: "hidden", padding: 0, }}>
												<div style={{display: "flex"}}>
													<img style={{height: 74, width: 74, borderRadius: 100, }} alt={"Creator profile of "+data.username} src={data.image} />
													<Typography component="div" variant="body1" style={{marginTop: 20, marginLeft: 15, }}>
														@{data.username}
													</Typography>
													<span style={{marginTop: "auto", marginBottom: "auto", marginLeft: 10, }}>
														{data.verified === true ? 
															<Tooltip title="Verified and earning from Shuffle contributions" placement="top">
																<VerifiedUserIcon style={{}}/>
															</Tooltip>
														: 
														null
														}
													</span>
												</div>
												<Typography variant="body1" color="textSecondary" style={{marginTop: 10, }}>
													<b>{data.apps === undefined || data.apps === null ? 0 : data.apps}</b> apps <span style={{marginLeft: 15, }}/><b>{data.workflows === null || data.workflows === undefined ? 0 : data.workflows}</b> workflows
												</Typography> 
											{data.specialized_apps !== undefined && data.specialized_apps !== null && data.specialized_apps.length > 0 ? 
												<AvatarGroup max={10} style={{flexDirection: "row", padding: 0, margin: 0, itemAlign: "left", textAlign: "left", marginTop: 3,}}>
													{data.specialized_apps.map((app, index) => {
														// Putting all this in secondary of ListItemText looked weird.
														return (
															<div
																key={index}
																style={{
																	height: 24,
																	width: 24,
																	filter: "brightness(0.6)",
																	cursor: "pointer",
																}}
																onClick={() => {
																	console.log("Click")
																	//navigate("/apps/"+app.id)
																}}
															>
																<Tooltip color="primary" title={app.name} placement="bottom">
																	<Avatar alt={app.name} src={app.image} style={{width: 24, height: 24}}/>
																</Tooltip>
															</div>
														)
													})}
												</AvatarGroup>
												: 
												null}
											</CardContent>
										</CardActionArea>
									</a>
								</Card>
							</Grid>
						</Zoom>
					)
				})}
			</Grid>
		)
	}

	const CustomSearchBox = connectSearchBox(SearchBox)
	const CustomHits = connectHits(Hits)

	return (
		<div style={{width: "100%", position: "relative", height: "100%",}}>
			<InstantSearch searchClient={searchClient} indexName="creators">
				<Configure clickAnalytics />
				<div style={{maxWidth: 450, margin: "auto", marginTop: 15, marginBottom: 15, }}>
					<CustomSearchBox />
				</div>
				<CustomHits hitsPerPage={100}/>
			</InstantSearch>
			{showSuggestion === true ? 
				<div style={{maxWidth: isMobile ? "100%" : "60%", margin: "auto", paddingTop: 50, textAlign: "center",}}>
					<Typography variant="h6" style={{color: "white", marginTop: 50,}}>
						Can't find what you're looking for? 
					</Typography>
					<div style={{flex: "1", display: "flex", flexDirection: "row"}}>
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
		</div>
	)
}

export default CreatorGrid;
