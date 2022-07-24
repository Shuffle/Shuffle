import React, { useEffect, useState } from 'react';

import ReactGA from 'react-ga';
import { useTheme } from '@material-ui/core/styles';
import {Link} from 'react-router-dom';

import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon } from '@material-ui/icons';

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
} from '@material-ui/core';

import {
	SkipNext as SkipNextIcon,
	SkipPrevious as SkipPreviousIcon,
	PlayArrow as PlayArrowIcon,
} from "@material-ui/icons";

import WorkflowPaper from "../components/WorkflowPaper.jsx"

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const CreatorGrid = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs }  = props
	const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows
	const xs = parsedXs === undefined || parsedXs === null ? isMobile ? 6 : 4 : parsedXs
	const theme = useTheme();
	//const [apps, setApps] = React.useState([]);
	//const [filteredApps, setFilteredApps] = React.useState([]);
	const [formMail, setFormMail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [formMessage, setFormMessage] = React.useState("");

	const buttonStyle = {borderRadius: 30, height: 50, width: 220, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18,}

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
				//alert.info("Thanks for submitting!")
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
			if (window !== undefined && window.location !== undefined && window.location.search !== undefined && window.location.search !== null) {
				const urlSearchParams = new URLSearchParams(window.location.search)
				const params = Object.fromEntries(urlSearchParams.entries())
				const foundQuery = params["q"]
				if (foundQuery !== null && foundQuery !== undefined) {
					refine(foundQuery)
				}
			}
		}, [])

		return (
		  <form noValidate action="" role="search">
				<TextField 
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
					value={currentRefinement}
					placeholder="Find Creators..."
					id="shuffle_search_field"
					onChange={(event) => {
						refine(event.currentTarget.value)
					}}
					limit={5}
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
  }
	
	var workflowDelay = -50
	const Hits = ({ hits }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		var counted = 0

		return (
      <Grid container spacing={4} style={paperAppContainer}>
				{hits.map((data, index) => {
					workflowDelay += 50

					if (counted === 12/xs*rowHandler) {
						return null
					}

					counted += 1

					return (
						<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
							<Grid item xs={xs} style={{ padding: "12px 10px 12px 10px" }}>
								<Card>
						  		<CardActionArea component={Link} to={"/creators/"+data.username} style={{padding: "5px 10px 5px 10px", display: "flex"}}>
										<CardContent sx={{ flex: '1 0 auto', minWidth: 160, maxWidth: 160, overflow: "hidden", padding: 0, }}>
											<Typography component="div" variant="h6">
												{data.username}
											</Typography>
										</CardContent>
										<img style={{height: 100, width: 100, borderRadius: 100, }} alt={"Creator profile of "+data.username} src={data.image} />
									</CardActionArea>
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
				<CustomHits hitsPerPage={5}/>
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

			<span style={{position: "absolute", display: "flex", textAlign: "right", float: "right", right: 0, bottom: 120, }}>
				<Typography variant="body2" color="textSecondary" style={{}}>
					Search by 
				</Typography>
				<a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{textDecoration: "none", color: "white"}}>
					<img src={"/images/logo-algolia-nebula-blue-full.svg"} alt="Algolia logo" style={{height: 17, marginLeft: 5, marginTop: 3,}} />
				</a>
			</span>
		</div>
	)
}

export default CreatorGrid;
