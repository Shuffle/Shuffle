import React, { useState, useEffect } from 'react';

import theme from '../theme.jsx';
import AppSearch from './Appsearch.jsx';

import {
  Paper,
	Typography,
	Divider,
	IconButton, 
	Badge,
  CircularProgress,
	Tooltip,
	Button,
} from "@mui/material";

import {
	Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

const AppSearchPopout = (props) => {
  const { 
		cy,
		paperTitle,
		setPaperTitle,
		newSelectedApp,
		setNewSelectedApp,
		selectionOpen,
		setSelectionOpen,
		discoveryData,
		setDiscoveryData,
		userdata,
	} = props;

	const [defaultSearch, setDefaultSearch] = React.useState(paperTitle !== undefined ? paperTitle : "")

	if (selectionOpen !== true) {
		return null
	}
	
	// <Paper style={{width: 275, maxHeight: 400, zIndex: 100000, padding: 25, paddingRight: 35, backgroundColor: theme.palette.surfaceColor, border: "1px solid rgba(255,255,255,0.2)", position: "absolute", top: -15, left: 50, }}>
	return (
		<Paper style={{minWidth: 275, width: 275, minHeight: 400, maxHeight: 400, zIndex: 100000, padding: 25, paddingRight: 35, backgroundColor: theme.palette.surfaceColor, border: "1px solid rgba(255,255,255,0.2)", position: "absolute", top: -15, left: 50, }}>
				{paperTitle !== undefined && paperTitle.length > 0 ? 
					<span>
						<Typography variant="h6" style={{textAlign: "center"}}>
							{paperTitle}
						</Typography>
						<Divider style={{marginTop: 5, marginBottom: 5 }} />
					</span>
				: null}
				<Tooltip
					title="Close window"
					placement="top"
					style={{ zIndex: 10011 }}
				>
					<IconButton
						style={{ zIndex: 12501, position: "absolute", top: 10, right: 10}}
						onClick={(e) => {
							//cy.elements().unselectify();
							if (cy !== undefined) {
								cy.elements().unselect()
							}

							e.preventDefault();
							setSelectionOpen(false)
						}}
					>
						<CloseIcon style={{ color: "white", height: 15, width: 15, }} />
					</IconButton>
				</Tooltip>
				{/* {/*Causes errors in Cytoscape. Removing for now.}
				<Tooltip
					title="Unselect app"
					placement="top"
					style={{ zIndex: 10011 }}
				>
					<IconButton
						style={{ zIndex: 12501, position: "absolute", top: 32, right: 10}}
						onClick={(e) => {
							e.preventDefault();
							setDiscoveryData({
								"id": discoveryData.id,
								"label": discoveryData.label,
								"name": ""
							})
							setNewSelectedApp({
								"image_url": "",
								"name": "",
								"id": "",
								"objectID": "remove",
							})
							setSelectionOpen(true)
							setDefaultSearch("")

							const foundelement = cy.getElementById(discoveryData.id)
							if (foundelement !== undefined && foundelement !== null) {
								console.log("element: ", foundelement)
								foundelement.data("large_image", discoveryData.large_image)
								foundelement.data("text_margin_y", "14px")
								foundelement.data("margin_x", "32px")
								foundelement.data("margin_y", "19x")
								foundelement.data("width", "45px")
								foundelement.data("height", "45px")
							}

							setTimeout(() => {
								setDiscoveryData({})
								setNewSelectedApp({})
							}, 1000)
						}}
					>
						<DeleteIcon style={{ color: "white", height: 15, width: 15, }} />
					</IconButton>
				</Tooltip>
				*/}
				<div style={{display: "flex"}}>
					{discoveryData.name !== undefined && discoveryData.name !== null && discoveryData.name.length > 0 ? 
						<div style={{border: "1px solid rgba(255,255,255,0.2)", borderRadius: 25, height: 40, width: 40, textAlign: "center", overflow: "hidden",}}>

							<img alt={discoveryData.id} src={newSelectedApp.image_url !== undefined && newSelectedApp.image_url !== null && newSelectedApp.image_url.length > 0 ? newSelectedApp.image_url : discoveryData.large_image} style={{height: 40, width: 40, margin: "auto",}}/>
						</div>
					: 
						<img alt={discoveryData.id} src={discoveryData.large_image} style={{height: 40,}}/>
					}
					<Typography variant="body1" style={{marginLeft: 10, marginTop: 6}}>
						{discoveryData.name !== undefined && discoveryData.name !== null && discoveryData.name.length > 0 ? 
							discoveryData.name
							: 
							newSelectedApp.name !== undefined && newSelectedApp.name !== null && newSelectedApp.name.length > 0 ?
								newSelectedApp.name
								: 
								`No ${discoveryData.label} app chosen`
						}
					</Typography>
				</div>
				<div>
					{discoveryData !== undefined && discoveryData.name !== undefined && discoveryData.name !== null && discoveryData.name.length > 0 ? 
						<span>
							<Typography variant="body2" color="textSecondary" style={{marginTop: 10, marginBottom: 10, maxHeight: 75, overflowY: "auto", overflowX: "hidden", }}>
								{discoveryData.description}
							</Typography>
							{/*isCloud && defaultSearch !== undefined && defaultSearch.length > 0 ? 
								{<
									newSelectedApp={newSelectedApp}
									setNewSelectedApp={setNewSelectedApp}
									defaultSearch={defaultSearch}
								/>}
								: 
								null
							*/}
						</span>
					: 
						selectionOpen 
							? 
							<span>
								<Typography variant="body2" color="textSecondary" style={{marginTop: 10}}>
									Click an app below to select it
								</Typography>
							</span>
							:
							<Button
								variant="contained"
								color="primary"
								style={{marginTop: 10, }}
								onClick={() => {
									setSelectionOpen(true)
									setDefaultSearch(discoveryData.label)
								}}
							>
								Choose {discoveryData.label} app
							</Button>
					}
				</div>
				<div style={{marginTop: 10}}>
					{selectionOpen ? 
						<AppSearch
							defaultSearch={defaultSearch}
							newSelectedApp={newSelectedApp}
							setNewSelectedApp={setNewSelectedApp}
							userdata={userdata}
						/>
					: null}
				</div>
			</Paper>
		)
}

export default AppSearchPopout;
