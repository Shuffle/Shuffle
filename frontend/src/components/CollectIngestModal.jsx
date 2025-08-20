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
} from '@mui/material';

import {
	Rocket as RocketIcon,
	FilterAlt as FilterAltIcon,
} from '@mui/icons-material';

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
		const { type, appCategory, index } = props

		const [hovering, setHovering] = useState(false);
		const [selectedApps, setSelectedApps] = useState([]);
		//const [isFinished, setIsFinished] = useState(false);

		const appname = type
		const ingestedAmount = 20

		const iconDetails = GetIconInfo({
			"app_name": appname,
			"name": appname,
		})

		var foundMatchingWorkflow = null
		if (workflows !== undefined && workflows !== null && workflows.length > 0) {
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

		return (
			//<Grid item xs={hovering ? 12 : 5.9}
			<Grid item xs={12}
				style={{
					minHeight: hovering ? 250 : 140, 
					maxHeight: hovering ? "auto" : 140, 
					cursor: "pointer",
					position: "relative",
					transition: "all 0.3s ease-in-out",

					borderRadius: theme.palette.borderRadius,
					border: hovering ? `2px solid ${theme.palette.primary.main}` : foundMatchingWorkflow !== null ? `2px solid ${theme.palette.success.main}` : `2px solid ${theme.palette.secondary.main}`,
					textAlign: "center", 
					marginBottom: 5, 

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
				<div style={{marginTop: 35, marginBottom: 35, }}>
					{iconDetails?.originalIcon && (
						iconDetails?.originalIcon
					)}

					<Typography variant="h4" style={{marginTop: 10, }}>

						{appname}
					</Typography> 
				</div>

				<div style={{display: "flex", width: 400, margin: "auto", }}>
					{matchingapps.length > 0 ?
						<Autocomplete
						  style={{flex: 1,  }}
						  multiple
						  filterSelectedOptions
						  options={matchingapps}

						  value={selectedApps}
						  onChange={(event, value) => {
							  setSelectedApps(value)
						  }}

						  getOptionLabel={(option) => {
							  const parsedname = option.name.replaceAll("_", " ")

							  return (
								<div>
									<img src={option?.large_image} alt={option.name} style={{ width: 24, height: 24, marginRight: 10, borderRadius: 5, }} />
									<Typography variant="body1" style={{ display: "inline-block", verticalAlign: "middle", marginTop: -12, }}>
										{parsedname}
									</Typography>
								</div>
							  )
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
					: null}


					<Button 
						style={{flex: 1, }}
						variant={foundMatchingWorkflow !== null ? "outlined" : "contained"}
						onClick={() => {

						//if (foundMatchingWorkflow !== null) {
						//	toast.error("Deletion not implemented for this POC. Please delete the workflow.")
						//} 

						//else {
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
						//}
					}}>
						{foundMatchingWorkflow !== null ? 
							"Re-Create Ingestion"
							:
							"Start Ingestion"	
						}
					</Button>
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
					minWidth: 500,
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
					<IngestItem type="Ingest Tickets" appCategory={"cases"} index={1} />
					<IngestItem type="Enable Threat feeds" index={2} />
					<IngestItem type="Enable Search" index={2} />
					<IngestItem type="Enable Mitre Att&ck techniques" index={2} />
					<IngestItem type="Enable Detection Rules" index={2} />
					<IngestItem type="Ingest Logs" index={2} />
					<IngestItem type="Track Assets" appCategory={"assets"} index={2} />
				</Grid>
			</DialogContent>
		</Dialog>
	)
}

export default CollectIngestModal
