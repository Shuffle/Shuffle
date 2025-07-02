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
	Paper,
	LinearProgress,
	Grid,
	Button,
} from '@mui/material';

import {
	Rocket as RocketIcon,
	FilterAlt as FilterAltIcon,
} from '@mui/icons-material';

const CollectIngestModal = (props) => {
	const { globalUrl, open, setOpen } = props;

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

	const startIngestion = (appname, index) => {
		console.log("APPNAME:", appname, "INDEX:", index)

		const body = {
			"app_name": appname,
			"label": appname,
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
			console.log("Ingestion started successfully:", data);
			toast.success(`Ingestion for ${appname} started successfully!`);
		})
		.catch((error) => {
			console.error("Error starting ingestion:", error);
			toast.error(`Failed to start ingestion for ${appname}. Please try again.`);
		});

	}

	const IngestItem = (props) => {
		const { type, index } = props

		const [hovering, setHovering] = useState(false);
		const [isFinished, setIsFinished] = useState(false);

		const appname = type
		const ingestedAmount = 20

		const iconDetails = GetIconInfo({
			"app_name": appname,
			"name": appname,
		})

		return (
			//<Grid item xs={hovering ? 12 : 5.9}
			<Grid item xs={12}
				style={{
					minHeight: hovering ? 225 : 145, 
					maxHeight: hovering ? 225 : 145, 
					cursor: "pointer",
					position: "relative",
					transition: "all 0.3s ease-in-out",

					borderRadius: theme.palette.borderRadius,
					border: hovering ? `2px solid ${theme.palette.primary.main}` : isFinished ? `2px solid ${theme.palette.success.main}` : `2px solid ${theme.palette.secondary.main}`,
					textAlign: "center", 
					marginBottom: 5, 

					overflow: "hidden",
				}}
				onMouseEnter={() => setHovering(true)}
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

				<Button variant="contained" onClick={() => {
					toast.info("Starting ingest for relevant apps")
					startIngestion(appname, index)
				}}>
					Start Ingestion	
				</Button>
				{hovering ?
					<div>
					</div>
				: null}

				{isFinished ? 
					<div>
						<Typography variant="body1" style={{
							position: "absolute",
							bottom: 10,
							left: 10, 
							color: theme.palette.text.secondary,
						}}>
							{ingestedAmount} / X 
						</Typography>
						<LinearProgress 
							style={{
								width: "100%", 
								position: "absolute",
								bottom: 0,
							}}
							variant="determinate"
							fullWidth value={{ingestedAmount}} 
						/>
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
					<IngestItem type="Ingest Tickets" index={1} />
					<IngestItem type="Enable Threat feeds" index={2} />
					<IngestItem type="Track Assets" index={2} />
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
