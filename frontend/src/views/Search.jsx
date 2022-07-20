import React, { useState, useEffect } from "react";

import theme from '../theme';
import {isMobile} from "react-device-detect";
import AppGrid from "../components/AppGrid.jsx"
import WorkflowGrid from "../components/WorkflowGrid.jsx"
import CreatorGrid from "../components/CreatorGrid.jsx"
import DocsGrid from "../components/DocsGrid.jsx"
import { useNavigate, Link } from "react-router-dom";

import { 
  Tabs,
	Paper,
  Tab,
} from "@material-ui/core";

import {
  Business as BusinessIcon,
	Apps as AppsIcon,
	Polymer as PolymerIcon,
	EmojiObjects as EmojiObjectsIcon,
  Description as DescriptionIcon,
} from "@material-ui/icons";


const bodyDivStyle = {
	margin: "auto",
	maxWidth: 1024,
	scrollX: "hidden",
	overflowX: "hidden",
}

const boxStyle = {
	color: "white",
	flex: "1",
	marginLeft: 10,
	marginRight: 10,
	paddingLeft: 30,
	paddingRight: 30,
	paddingBottom: 30,
	paddingTop: 30,
	display: "flex", 
	flexDirection: "column",
	overflowX: "hidden",
	minHeight: 400,
}

// Should be different if logged in :|
const Search = (props) => {
  const { globalUrl, isLoaded, serverside, userdata } = props;
	let navigate = useNavigate();

  const [curTab, setCurTab] = useState(0);
  const iconStyle = { marginRight: 10 };

	const views = {
    0: "apps",
    1: "workflows",
    2: "docs",
    3: "creators",
  }

	const setConfig = (event, inputValue) => {
		const newValue = parseInt(inputValue)
		console.log("NEW: ", newValue)

    setCurTab(newValue)
    if (newValue === 0) {
      document.title = "Shuffle - search - apps";
    } else if (newValue === 1) {
      document.title = "Shuffle - search - workflows";
    } else if (newValue === 2) {
      document.title = "Shuffle - search - documentation";
    } else if (newValue === 3) {
      document.title = "Shuffle - search - creators";
    } else {
      document.title = "Shuffle - search";
    }

		
		const urlSearchParams = new URLSearchParams(window.location.search)
		const params = Object.fromEntries(urlSearchParams.entries())
		const foundQuery = params["q"]
		var extraQ = ""
		if (foundQuery !== null && foundQuery !== undefined) {
			extraQ = "&q="+foundQuery
		}

		navigate(`/search?tab=${views[newValue]}`+extraQ)
  }

	useEffect(() => {
		if (serverside !== true && window.location.search !== undefined && window.location.search !== null) {
			const urlSearchParams = new URLSearchParams(window.location.search)
			const params = Object.fromEntries(urlSearchParams.entries())
			const foundTab = params["tab"]
			if (foundTab !== null && foundTab !== undefined) {
				for (var key in Object.keys(views)) {
					const value = views[key]
					console.log(key, value)
					if (value === foundTab) {
						setConfig("", key)
						break
					}
				}
			}
		}
	}, [])

	if (isLoaded === false) {
		return null
	}


	// Random names for type & autoComplete. Didn't research :^)
	const landingpageDataBrowser = 
		<div style={{paddingBottom: 100, color: "white", backgroundColor: theme.palette.surfacColor}}>
			<div style={boxStyle}>
				<Tabs
					style={{width: 610, margin: "auto", marginTop: 25, }}
					value={curTab}
					indicatorColor="primary"
					textColor="secondary"
					onChange={setConfig}
					aria-label="disabled tabs example"
				>
					<Tab
						label=<span>
							<AppsIcon style={iconStyle} /> Apps
						</span>
					/>
					<Tab
						label=<span>
							<PolymerIcon style={iconStyle} /> Workflows
						</span>
					/>
					<Tab
						label=<span>
  						<DescriptionIcon style={iconStyle} /> Docs 
						</span>
					/>
					<Tab
						label=<span>
							<EmojiObjectsIcon style={iconStyle} /> Creators 
						</span>
					/>
				</Tabs>
				{curTab === 0 ? 
					<AppGrid maxRows={3} showSuggestion={true} globalUrl={globalUrl} isMobile={isMobile} userdata={userdata} />
				: 
				curTab === 1 ?
					<WorkflowGrid maxRows={3} showSuggestion={true} globalUrl={globalUrl} isMobile={isMobile}  userdata={userdata} />
				:
				curTab === 2 ?
					<DocsGrid maxRows={3} showSuggestion={true} globalUrl={globalUrl} isMobile={isMobile}  userdata={userdata} />
				: 
				curTab === 3 ?
					<CreatorGrid maxRows={3} showSuggestion={true} globalUrl={globalUrl} isMobile={isMobile}  userdata={userdata} />
				: 
				null}
			</div>
		</div>

	const loadedCheck = isLoaded ? 
		<div>
			<div style={bodyDivStyle}>{landingpageDataBrowser}</div>
		</div>
		:
		<div>
		</div>

	// #1f2023?
	return(
		<div style={{backgroundColor: "#1f2023",}}>
			{loadedCheck}
		</div>
	)
}

export default Search;
