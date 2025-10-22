import React, { useState, useEffect, useContext, memo } from "react";

import { Context } from "../context/ContextApi.jsx";
import { getTheme } from "../theme.jsx";
import { GetIconInfo } from "../views/Workflows2.jsx";
import { toast } from 'react-toastify';

import {
	Dialog,
	DialogTitle,
	DialogContent,
	Typography,
	IconButton,
	Paper,
	LinearProgress,
	Grid,
	Button,
	Tooltip,
	Autocomplete,
	TextField,
	Box,
} from '@mui/material';

import {
	Rocket as RocketIcon,
	FilterAlt as FilterAltIcon,
	Add as AddIcon,
	Check as CheckIcon,
} from '@mui/icons-material';

import { 
	green,
	red,
} from '../views/AngularWorkflow.jsx'

import algoliasearch from 'algoliasearch/lite';
const searchClient = algoliasearch("JNSS5CFDZZ", "c8f882473ff42d41158430be09ec2b4e")

const CollectIngestModal = (props) => {
	const { globalUrl, open, setOpen, workflows, getWorkflows, apps,  } = props;

    const { themeMode, brandColor } = useContext(Context);
    const theme = getTheme(themeMode, brandColor);

	if (open === undefined || open === null) {
		console.error("CollectIngestModal: 'open' prop is required.");
		return null
	}

	if (setOpen === undefined || setOpen === null) {
		console.error("CollectIngestModal: 'setOpen' prop is required.");
		return null
	}

	const startIngestion = (bundleName, appnames, category, index) => {

		var body = {
			"label": bundleName,
			"app_name": appnames,

			"category": "",
		}

		if (category !== undefined && category !== null) {
			body.category = category
		}

		const url = `${globalUrl}/api/v2/workflows/generate`
		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			credentials: "include",
		})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {

			if (getWorkflows !== undefined) {
				getWorkflows()
			}

			console.log("Ingestion started successfully:", data);
			toast.success(`Ingestion for ${bundleName} started successfully!`);
		})
		.catch((error) => {
			console.error("Error starting ingestion:", error);
			toast.error(`Failed to start ingestion for ${bundleName}. Please try again or contact support@shuffler.io if this persists.`);
		});

	}

	const IngestItem = (props) => {
		const { type, appCategory, index, webhook } = props

		const [hovering, setHovering] = useState(false);
		const [selectedApps, setSelectedApps] = useState([]);

		const [showAppsearch, setShowAppsearch] = useState(false);
		const [algoliaOptions, setAlgoliaOptions] = useState([]);
		const [generating, setGenerating] = useState(false);

		const appname = type
		const ingestedAmount = 20

		const iconDetails = GetIconInfo({
			"app_name": appname,
			"name": appname,
		})

		var foundMatchingWorkflow = null
		if (!showAppsearch && workflows !== undefined && workflows !== null && workflows.length > 0) {
			const parsedName = type.toLowerCase().replaceAll(" ", "_");
			const foundWorkflow = workflows.find((workflow) => {
				return workflow?.name?.toLowerCase().replaceAll(" ", "_") === parsedName
			})

			if (foundWorkflow !== undefined && foundWorkflow !== null) {
				foundMatchingWorkflow = foundWorkflow


				// Find relevant apps and maps them
				if (apps.length > 0 && selectedApps.length === 0 && foundWorkflow?.actions !== undefined && foundWorkflow?.actions !== null && foundWorkflow?.actions.length > 0) {
					var newSelectedApps = []
					for (var actionkey in foundWorkflow.actions) {
						const action = foundWorkflow.actions[actionkey]

						if (action?.app_name !== "Singul" && action?.app_id !== "integration") {
							continue
						}

						for (var paramkey in action.parameters) {
							const param = action.parameters[paramkey]
							if (!((param.name === "app_name" || param.name === "appName") && param.value !== undefined && param.value !== null && param.value.length > 0)) {
								continue
							}

							// Find the app in available apps
							const parsedname = param.value.replaceAll(" ", "_").toLowerCase()
							for (var appkey in apps) {
								const appname = apps[appkey].name.replaceAll(" ", "_").toLowerCase()
								if (appname === parsedname) {
									newSelectedApps.push(apps[appkey])
									break
								}
							}

							break
						}
					}

					if (newSelectedApps.length > 0) {
						setSelectedApps(newSelectedApps)
					}
				}

			}
		}

		var matchingapps = []
		if (appCategory !== undefined && appCategory !== null && appCategory.length > 0 && apps !== undefined && apps !== null && apps.length > 0) {
			for (var appkey in apps) {
				const app = apps[appkey]

				for (var categorykey in app.categories) {
					const category = app.categories[categorykey]
					if (category.toLowerCase() === appCategory.toLowerCase()) {
						matchingapps.push(app)
					}
				}
			}
		}


		const runIngestion = () => {
			setGenerating(true)
			setTimeout(() => {
				setGenerating(false)
			}, 5000)

			toast.info("Starting ingest for relevant apps")
			var newapps = ""
			for (var key in selectedApps) {
				const app = selectedApps[key]

				if (newapps.length > 0) {
					newapps += ","
				}

				newapps += app.name
			}

			startIngestion(appname, newapps, appCategory, index)
			if (webhook === true) {
				startIngestion(appname+"_webhook", newapps, appCategory, index)
			}
		}

		return (
			//<Grid item xs={hovering ? 12 : 5.9}
			<Grid item xs={12}
				style={{
					minHeight: hovering ? 200 : 200, 
					cursor: "pointer",
					position: "relative",
					transition: "all 0.3s ease-in-out",

					borderRadius: theme.palette.borderRadius,
					border: hovering ? `2px solid ${theme.palette.primary.main}` : foundMatchingWorkflow !== null ? `2px solid ${theme.palette.success.main}` : `2px solid ${theme.palette.secondary.main}`,
					textAlign: "center", 
					marginBottom: 10, 

					overflow: "hidden",
				}}
				onMouseEnter={() => {

					//if (foundMatchingWorkflow !== null) { 
					//} else {
						setHovering(true)
					//}
				}}
				onMouseLeave={() => setHovering(false)}
			>
				<div style={{display: "flex", }}>

					<div style={{flex: 1, margin: "auto", marginTop: 50, }}>

						<div style={{width: 50+selectedApps?.length*50, margin: "auto", itemAlign: "center", textAlign: "center", display: "flex", }}>
							{generating ? null : selectedApps.map((app, index) => {
								// Show image of each one
								return (
									<div key={index} style={{display: "flex", alignItems: "center", marginLeft: 10, }}>
										<Tooltip title={app.name} placement="top">
											<img
												style={{height: 40, width: 40, borderRadius: 50}}
												src={app?.large_image || app?.icon || app?.image || "/static/images/default_app_icon.png"}
											/>
										</Tooltip>
									</div>
								)
							})}

							{!generating && appCategory !== undefined && appCategory !== null && appCategory.length > 0 ?
								<Tooltip title={showAppsearch ? "Done selecting apps" : "Select Apps"} placement="top">
									<IconButton
										style={{marginLeft: 10, marginRight: 50, }}
										variant="outlined"
										color="secondary"
										onClick={() => {

											if (showAppsearch === true) { 
												runIngestion() 
											}

											setShowAppsearch(!showAppsearch)
										}}
									>
										{showAppsearch ?
											<CheckIcon style={{color: green, }} />
											:
											<AddIcon style={{color: theme.palette.primary.main, }} />
										}
									</IconButton>
								</Tooltip>
							: null}
						</div>

						{showAppsearch ?
							<Autocomplete
							  style={{flex: 1, maxWidth: 200, minWidth: 200, margin: "auto", marginTop: 10, }}
							  multiple
							  filterSelectedOptions
							  options={matchingapps}

							  value={selectedApps}
							  onChange={(event, value) => {
								  console.log("New value: ", value)

								  setSelectedApps(value)
							  }}

							  getOptionLabel={(option) => {
								  const parsedname = option.name.replaceAll("_", " ")

								  return parsedname
								  //return (
								  //  <div>
								  //  	<img src={option?.large_image} alt={option.name} style={{ width: 24, height: 24, marginRight: 10, borderRadius: 5, }} />
								  //  	<Typography variant="body1" style={{ display: "inline-block", verticalAlign: "middle", marginTop: -12, }}>
								  //  		{parsedname}
								  //  	</Typography>
								  //  </div>
								  //)
							  }}
							  renderOption={(props, option, state, ownerState) => {
								    const { key, ...optionProps } = props;
									return (
									  <Box
										key={key}
										sx={{
										  borderRadius: '8px',
										  margin: '5px',
										  padding: '8px',
										}}
										component="li"
										{...optionProps}
									  >
								  		<img src={option?.large_image} alt={option.name} style={{ width: 24, height: 24, marginRight: 10, borderRadius: 5, }} />
										{ownerState.getOptionLabel(option)}
									  </Box>
									);

							  }}
							  renderInput={(params) => {
								  return ( 
									<TextField 
									  {...params} 
									  variant="outlined" 
									  label="Select apps" 
									/>
								  )
							  }}
							/>
						: 
							<Button 
								style={{width: 250, margin: 25, }}
								variant={foundMatchingWorkflow !== null ? "outlined" : "contained"}
								onClick={() => {
									runIngestion()
								}}
								disabled={generating}
							>
								{foundMatchingWorkflow !== null ? 
									"Re-Create Ingestion"
									:
									"Start Ingestion"	
								}
							</Button>
						}
					</div>

					<div style={{flex: 1, marginTop: 50, }}>
						{iconDetails?.originalIcon && (
							iconDetails?.originalIcon
						)}

						<Typography variant="h4" style={{marginTop: 10, }}>

							{appname}
						</Typography> 
					</div>
				</div>

				{foundMatchingWorkflow !== null ?
					<a href={`/workflows/${foundMatchingWorkflow.id}`} target="_blank" rel="noopener noreferrer">
						<Tooltip title="View Workflow" placement="right">
							<IconButton style={{position: "absolute", top: 10, right: 10, marginLeft: 15, }}>
								<RocketIcon style={{ }} />
							</IconButton>
						</Tooltip>
					</a>
				: null}
				{hovering ?
					<div>
					</div>
				: null}

				{foundMatchingWorkflow !== null ? 
					<div>
						<Typography variant="body1" style={{
							position: "absolute",
							bottom: 10,
							left: 10, 
							color: theme.palette.text.secondary,
						}}>
							{ingestedAmount} / X 
						</Typography>

						{/*
						<LinearProgress 
							style={{
								width: "100%", 
								position: "absolute",
								bottom: 0,
							}}
							variant="determinate"
							fullWidth value={{ingestedAmount}} 
						/>
						*/}
					</div>
				: null}
			</Grid>
		)
	}

	return (
		<Dialog 
			PaperProps={{
				sx: {
					borderRadius: theme?.palette?.DialogStyle?.borderRadius,
					border: theme?.palette?.DialogStyle?.border,
					minWidth: 850,
					minHeight: 700,
					fontFamily: theme?.typography?.fontFamily,
					backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
					zIndex: 1000,
					'& .MuiDialogContent-root': {
						backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
					},
					'& .MuiDialogTitle-root': {
						backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
					},
					'& .MuiDialogActions-root': {
						backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
					},
				},
			}} 
			open={open} 
			onClose={() => {
				setOpen(false)
			}}
		>
			<DialogTitle>
			</DialogTitle>
			<DialogContent style={{ paddingLeft: "30px", paddingRight: '30px', backgroundColor: theme.palette.DialogStyle.backgroundColor, }}>

				<Typography variant="h6" style={{ color: theme.palette.text.primary, marginBottom: 20 }}>
					<FilterAltIcon style={{ verticalAlign: "middle", marginRight: 10 }} />
					Collection and Ingestion
				</Typography>

				<Grid container>
					<IngestItem type="Ingest Tickets" appCategory={"cases"} webhook={true} index={1} />
					<IngestItem type="Enable Threat feeds" index={2} />
					<IngestItem type="Ingest Assets" appCategory={"assets"} index={2} />
					<IngestItem type="Ingest Users " appCategory={"users"} index={2} />
					<IngestItem type="Enable Search" index={2} />
					<IngestItem type="Enable Mitre Att&ck techniques" index={2} />
					<IngestItem type="Enable Detection Rules" index={2} />
					<IngestItem type="Ingest Logs" index={2} />
				</Grid>
			</DialogContent>
		</Dialog>
	)
}

export default CollectIngestModal
