import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useTheme } from '@material-ui/core/styles';
import {Link} from 'react-router-dom';
import { useAlert } from "react-alert";
import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon } from '@mui/icons-material';

//import algoliasearch from 'algoliasearch/lite';
import algoliasearch from 'algoliasearch';
import { InstantSearch, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import { Grid, Paper, TextField, ButtonBase, InputAdornment, Typography, Button, Tooltip} from '@material-ui/core';
import aa from 'search-insights'
const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const Appsearch = props => {
	const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs, newSelectedApp, setNewSelectedApp, defaultSearch, showSearch, ConfiguredHits, userdata, cy, isCreatorPage, actionImageList, setActionImageList}  = props

  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
  const alert = useAlert();
	const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows
	const xs = parsedXs === undefined || parsedXs === null ? 12 : parsedXs
	const theme = useTheme();
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

	const setUserSpecialzedApp = (user, data) => {
		// var data = newfields]
		console.log("data value", data)
		const appData = {"user_id":user,"specialized_apps":[{}]}
		console.log("User Check for appdata:", user)
		appData["specialized_apps"][0]["name"] = data["name"]
		appData["specialized_apps"][0]["image"] = data["image_url"]
		appData["specialized_apps"][0]["category"] = data["categories"].toString()
		console.log("AppData:",appData)
		console.log("setActionImageList",setActionImageList)
		console.log("actionImageList",actionImageList)

		const finalData = actionImageList.concat(appData["specialized_apps"])
		appData["specialized_apps"]=finalData
		fetch(globalUrl + "/api/v1/users/updateuser", {
		  method: "PUT",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  body: JSON.stringify(appData),
		  credentials: "include",
		})
		  .then((response) => {
			if (response.status !== 200) {
			  console.log("Status not 200 for set creator :O!");
			}
			alert.success("Sucessfully updated specialzed app.")
			return response.json();
		  })
		  .then((responseJson) => {
			if (!responseJson.success && responseJson.reason !== undefined) {
			  alert.error("Failed updating user: " + responseJson.reason);
			}
		  })
		  .catch((error) => {
			console.log(error);
		  });
	  };
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
					placeholder={`Find ${defaultSearch} Apps...`}
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

	const Hits = ({ hits }) => {
		const [mouseHoverIndex, setMouseHoverIndex] = useState(-1) 
		var counted = 0

		return (
			<Grid container spacing={0} style={{border: "1px solid rgba(255,255,255,0.2)", maxHeight: 250, minHeight: 250, overflowY: "auto", overflowX: "hidden", }}>
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
						minHeight: 37, 
						maxHeight: 52, 
					}
	
					if (counted === 12/xs*rowHandler) {
						return null
					}

					counted += 1
					var parsedname = data.name.valueOf()
					//for (var key = 0; key < data.name.length; key++) {
					//	var character = data.name.charAt(key)
					//	if (character === character.toUpperCase()) {
					//		//console.log(data.name[key], data.name[key+1])
					//		if (data.name.charAt(key+1) !== undefined && data.name.charAt(key+1) === data.name.charAt(key+1).toUpperCase()) {
					//		} else {
					//			parsedname += " "
					//		}
					//	}

					//	parsedname += character
					//}
					
					parsedname = (parsedname.charAt(0).toUpperCase()+parsedname.substring(1)).replaceAll("_", " ")

					return (
						<Paper key={index} elevation={0} style={paperStyle} onMouseOver={() => {
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
							if(isCreatorPage === true){
								console.log("data:",data)
								console.log("userdata.id",userdata.id)
								console.log("is creator", isCreatorPage)
								if (setNewSelectedApp !== undefined) {
									// setUserSpecialzedApp = data
									setUserSpecialzedApp(userdata.id, data)
									//setActionImageList(userdata.id, data)
								}	
							}
							if (setNewSelectedApp !== undefined) {
								setNewSelectedApp(data)
							}

							if (isCloud) {
								ReactGA.event({
									category: "app_search",
									action: `app_${parsedname}_${data.id}_personalize_click`,
									label: "",
								})
							}

							const queryID = ""

							if (queryID !== undefined && queryID !== null) {
								try {
									aa('init', {
										appId: searchClient.appId,
										apiKey: searchClient.transporter.headers["x-algolia-api-key"]
									})

									const timestamp = new Date().getTime()
									aa('sendEvents', [
										{
											eventType: 'conversion',
											eventName: 'App Framework Activation',
											index: 'appsearch',
											objectIDs: [data.objectID],
											timestamp: timestamp,
											queryID: queryID,
											userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
										}
									])
								} catch (e) {
									console.log("Failed algolia search update: ", e)
								}
							}
						}}>
							<div style={{display: "flex"}}>
								<img alt={data.name} src={data.image_url} style={{width: "100%", maxWidth: 30, minWidth: 30, minHeight: 30, maxHeight: 30, display: "block", }} />
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
			<InstantSearch searchClient={searchClient} indexName="appsearch">
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

export default Appsearch;
