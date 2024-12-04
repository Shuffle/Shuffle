import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';
import theme from '../theme.jsx';
import PaperComponent from "../components/PaperComponent.jsx"
import UsecaseSearch, { usecaseTypes } from "../components/UsecaseSearch.jsx"

import {
  Paper,
	Typography,
	Divider,
	IconButton, 
	Badge,
  CircularProgress,
	Tooltip,
	Dialog,
} from "@mui/material";

import {
	Close as CloseIcon,
  Delete as DeleteIcon,
	AutoFixHigh as AutoFixHighIcon,
	Done as DoneIcon,
} from "@mui/icons-material";

const SuggestedWorkflows = (props) => {
  const { globalUrl, userdata, usecaseSuggestions, frameworkData, setUsecaseSuggestions, inputSearch, apps, } = props

	const [usecaseSearch, setUsecaseSearch] = React.useState("")
	const [usecaseSearchType, setUsecaseSearchType] = React.useState("")
	const [finishedUsecases, setFinishedUsecases] = React.useState([])
	const [previousUsecase, setPreviousUsecase] = React.useState("")
	const [closeWindow, setCloseWindow] = React.useState(false)

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";


	useEffect(() => {
		if (closeWindow === true) {
			console.log("WINDOW CLOSED")
			finishedUsecases.push(usecaseSearch)
			setFinishedUsecases(finishedUsecases)

			setCloseWindow(false)
		}
	}, [closeWindow])

	if (usecaseSuggestions === undefined || usecaseSuggestions.length === 0) {
		return null
	}

	if (inputSearch !== previousUsecase) {
		setPreviousUsecase(inputSearch)
		setFinishedUsecases([])
	}

	if (finishedUsecases.length === usecaseSuggestions.length) {
		console.log("Closing finished usecases 2")
		return null
	}


	//useEffect(() => {
	//	//if (defaultSearch === 
	//	//setFinishedUsecases(finishedUsecases)
	//	console.log("Finished default usecase?", usecaseSearch)
	//}, [usecaseSearch])

	const foundZindex = usecaseSearch.length > 0 && usecaseSearchType.length > 0 ? -1 : 12500

	const IndividualUsecase = (props) => {
		const { usecase, index } = props
		const [hovering, setHovering] = React.useState(false)

		const usecasename = usecase.name
		const bordercolor = usecase.color !== undefined ? usecase.color : "rgba(255,255,255,0.3)"


		const srcimage = usecase.items[0].app
		var dstimage = usecase.items[1].app
		if (usecase.items.length > 2) {
			dstimage = usecase.items[2].app
		}

		if (srcimage === undefined || dstimage === undefined) {
			console.log("Error in src or dst: returning!")
			return null
		}

		const finished = finishedUsecases.includes(usecasename)
		const selectedIcon = finished ? <DoneIcon /> : <AutoFixHighIcon /> 

		if (finished) {
			return null
		}

		// Simple visual of the usecase
		return (
			<Tooltip
				title={`Try usecase "${usecasename}"`}
				placement="top"
				style={{ zIndex: 10011 }}
			>
				<div key={index} style={{cursor: finished ? "auto" : "pointer", marginTop: 10, padding: 10, borderRadius: theme.palette?.borderRadius, border: `1px solid ${bordercolor}`, display: "flex", backgroundColor: hovering === true ? theme.palette.inputColor : theme.palette.surfaceColor, }} onMouseOver={() => {
					setHovering(true)
				}} onMouseOut={() => {
					setHovering(false)
				}} onClick={() => {
					if (isCloud) {
							ReactGA.event({
								category: "welcome",
								action: "click_suggested_workflow",
								label: usecasename,
							})
					}

					console.log("Try usecase ", usecasename)
					setUsecaseSearchType(usecase.type)
					setUsecaseSearch(usecasename)

				}}>
					<div style={{flex: 10}}>
						<Typography variant="body2">
							{usecasename}
						</Typography>
						<div style={{display: "flex", marginTop: 5, }}>
							<img alt={srcimage.large_image} src={srcimage.large_image} style={{borderRadius: 20, height: 30, width: 30, marginRight: 15, }}/>
							<img alt={dstimage.large_image} src={dstimage.large_image} style={{borderRadius: 20, height: 30, width: 30, }}/>
						</div>

					</div>
					<div style={{flex: 1}}>
						{selectedIcon}
					</div>
				</div>
			</Tooltip>
		)
	}

	//<Paper style={{width: 275, maxHeight: 400, overflow: "hidden", zIndex: 12500, padding: 25, paddingRight: 35, backgroundColor: theme.palette.surfaceColor, border: "1px solid rgba(255,255,255,0.2)", position: "absolute", top: -50, left: 50, }}>
	return (
		<Paper style={{margin: "auto", position: "relative", backgroundColor: theme.palette.surfaceColor, borderRadius: theme.palette?.borderRadius, zIndex: foundZindex, border: "1px solid rgba(255,255,255,0.2)", top: 100, left: 85,}}>
			<Dialog
					open={usecaseSearch.length > 0 && usecaseSearchType.length > 0}
					onClose={() => {
						finishedUsecases.push(usecaseSearch)
						setFinishedUsecases(finishedUsecases)

						setUsecaseSearch("")
						setUsecaseSearchType("")
					}}
					PaperProps={{
						style: {
							pointerEvents: "auto",
							backgroundColor: theme.palette.surfaceColor,
							color: "white",
							minWidth: 450,
							padding: 50,
							overflow: "hidden",
							zIndex: 10050,
							border: theme.palette.defaultBorder,
						},
					}}
				>
    	  <IconButton
    	    style={{
    	      zIndex: 5000,
    	      position: "absolute",
    	      top: 14,
    	      right: 18,
    	      color: "grey",
    	    }}
    	    onClick={() => {
						finishedUsecases.push(usecaseSearch)
						setFinishedUsecases(finishedUsecases)

						setUsecaseSearch("")
						setUsecaseSearchType("")
    	    }}
    	  >
    	    <CloseIcon />
    	  </IconButton>
				<UsecaseSearch
					globalUrl={globalUrl}
					defaultSearch={usecaseSearchType}
					usecaseSearch={usecaseSearch}
					appFramework={frameworkData}
					userdata={userdata}
					autotry={true}
					setCloseWindow={setCloseWindow}
					setUsecaseSearch={setUsecaseSearch}
					apps={apps}
				/>
			</Dialog>
			<div style={{minWidth: 250, maxWidth: 250, padding: 15, borderRadius: theme.palette?.borderRadius, position: "relative", }}>
				<Typography variant="body1" style={{textAlign: "center"}}>
					Suggested Workflows ({finishedUsecases.length}/{usecaseSuggestions.length})
				</Typography>
				<IconButton
					style={{
						zIndex: 5000,
						position: "absolute",
						top: 8,
						right: 8,
						color: "grey",
						padding: 2, 
					}}
					onClick={() => {
						if (setUsecaseSuggestions !== undefined) {
							setUsecaseSuggestions([])
						}
					}}
				>
					<CloseIcon style={{height: 18, width: 18, }} />
				</IconButton>
				{usecaseSuggestions.map((usecase, index) => {

					return (
						<IndividualUsecase 
							key={index}
							usecase={usecase} 
							index={index} 
						/>
					)
					
				})}
			</div>
		</Paper>
	)
}

export default SuggestedWorkflows;
