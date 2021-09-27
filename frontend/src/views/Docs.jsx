import React, {useState,} from 'react';

import { useTheme } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import {BrowserView, MobileView} from "react-device-detect";
import {Link} from 'react-router-dom';

import {Tooltip, Divider, Button, Menu, MenuItem, Typography, Paper, List} from '@material-ui/core';
import {Link as LinkIcon, Edit as EditIcon} from '@material-ui/icons';

const Body = {
  maxWidth: '1000px',
  minWidth: '768px',
  margin: 'auto',
	display: "flex",
	heigth: "100%",
	color: "white",
	//textAlign: "center",
};

const dividerColor = "rgb(225, 228, 232)"
const hrefStyle = {
	color: "rgba(255, 255, 255, 0.40)", 
	textDecoration: "none"
}

const Docs = (props) => {
  const { globalUrl, selectedDoc, serverside, isMobile, } = props;

	const theme = useTheme();
	const [mobile, setMobile] = useState(isMobile === true ? true : false);
	const [data, setData] = useState("");
	const [firstrequest, setFirstrequest] = useState(true);
	const [list, setList] = useState([]);
	const [, setListLoaded] = useState(false);
	const [anchorEl, setAnchorEl] = React.useState(null);
	const [headingSet, setHeadingSet] = React.useState(false);
	const [selectedMeta, setSelectedMeta] = React.useState({link: "hello", read_time: 2, });
	const [baseUrl, setBaseUrl] = React.useState(serverside === true ? "" : window.location.href)

  function handleClick(event) {
		setAnchorEl(event.currentTarget);
	}

	function handleClose() {
		setAnchorEl(null);
	}

	const SidebarPaperStyle = {
		backgroundColor: theme.palette.surfaceColor,
		overflowX: "hidden",
		position: "relative",
		padding: 30,
		paddingTop: 15,
		borderRadius: 5,
	}

	const SideBar = {
		maxWidth: 250,
		flex: "1",
		position: "fixed",
		marginTop: 35,
	}

	const fetchDocList = () => {
		fetch(globalUrl+"/api/v1/docs", {
    	method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
    })
		.then((response) => response.json())
    	.then((responseJson) => {
			if (responseJson.success) {
				setList(responseJson.list)
			} else {
				setList(["# Error loading documentation. Please contact us if this persists."])
			}
			setListLoaded(true)
		})
		.catch(error => {});
	}

	const fetchDocs = (docId) => {
		fetch(globalUrl+"/api/v1/docs/"+docId, {
    	  method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
    	})
		.then((response) => response.json())
    .then((responseJson) => {
			if (responseJson.success) {
				setData(responseJson.reason)
				document.title = "Shuffle "+docId+" documentation"

				if (responseJson.meta !== undefined) {
					setSelectedMeta(responseJson.meta)
				}
			} else {
				setData("# Error\nThis page doesn't exist.")
			}
		})
		.catch(error => {});
	}

	if (firstrequest) {
		setFirstrequest(false)
		if (!serverside)  {
			if (window.innerWidth < 768) {
				setMobile(true)
			}
		}

		if (selectedDoc !== undefined) {
			setData(selectedDoc.reason)
			setList(selectedDoc.list)
			setListLoaded(true)
		} else {
			if (!serverside) {
				fetchDocList()
				fetchDocs(props.match.params.key)
			}
		}
	}

	// Handles search-based changes that origin from outside this file
	if (serverside !== true && window.location.href !== baseUrl) {
		setBaseUrl(window.location.href)
		fetchDocs(props.match.params.key)
	}

	const parseElementScroll = () => {
		var parent = document.getElementById("markdown_wrapper_outer")
		if (parent !== null) {
			//console.log("IN PARENT")
			var elements = parent.getElementsByTagName('h2')

			const name = window.location.hash.slice(1, window.location.hash.lenth).toLowerCase().split("%20").join(" ").split("_").join(" ").split("-").join(" ")

			//console.log(name)
			var found = false
			for (var key in elements) {
				const element = elements[key]
				if (element.innerHTML === undefined) {
					continue
				}

				// Fix location..
				if (element.innerHTML.toLowerCase() === name) {
					element.scrollIntoView({behavior: "smooth"})
					found = true
					//element.scrollTo({
					//	top: element.offsetTop-100,
					//	behavior: "smooth"
					//})
				}
			}

			// H#
			if (!found) {
				elements = parent.getElementsByTagName('h3')
				console.log(name)
				found = false
				for (key in elements) {
					const element = elements[key]
					if (element.innerHTML === undefined) {
						continue
					}

					// Fix location..
					if (element.innerHTML.toLowerCase() === name) {
						element.scrollIntoView({behavior: "smooth"})
						found = true
						//element.scrollTo({
							//	top: element.offsetTop-100,
							//	behavior: "smooth"
							//})
						}
					}
				}
			}
			//console.log(element)

			//console.log("NAME: ", name)
			//console.log(document.body.innerHTML)
			//   parent = document.getElementById(parent);

			//var descendants = parent.getElementsByTagName(tagname);

			// this.scrollDiv.current.scrollIntoView({ behavior: 'smooth' });

			//$(".parent").find("h2:contains('Statistics')").parent();
	}

	if (serverside !== true && window.location.hash.length > 0) {
		parseElementScroll()
	}

	const markdownStyle = {
		color: "rgba(255, 255, 255, 0.65)", 
		flex: "1",
		maxWidth: mobile ? "100%" : 750,
		overflow: "hidden",
		paddingBottom: 200, 
		marginLeft: mobile ? 0 : 275, 
	}

	function OuterLink(props) {
		if (props.href.includes("http") || props.href.includes("mailto")) {
			return <a href={props.href} style={{color: "#f85a3e", textDecoration: "none"}}>{props.children}</a>
		}
		return <Link to={props.href} style={{color: "#f85a3e", textDecoration: "none"}}>{props.children}</Link>
	}

	function Img(props) {
		return <img style={{maxWidth: "100%"}} alt={props.alt} src={props.src}/>
	}

	function CodeHandler(props) {
		return (
			<pre style={{padding: 15, minWidth: "50%", maxWidth: "100%", backgroundColor: theme.palette.inputColor, overflowX: "auto", overflowY: "hidden",}}>
				<code>
					{props.value}
				</code>
			</pre>
		)
	}

	const Heading = (props) => {
		const element = React.createElement(`h${props.level}`, {style: {marginTop: 50}}, props.children)
		const [hover, setHover] = useState(false)

		var extraInfo = ""
		if (props.level === 1) {
			extraInfo = 
				<div style={{backgroundColor: theme.palette.inputColor, padding: 15, borderRadius: theme.palette.borderRadius, marginBottom: 30, display: "flex",}}>
					<div style={{flex: 3, display: "flex", vAlign: "center",}}>
						{mobile ? null : 
								<Typography style={{display: "inline", marginTop: 6, }}>
									<a rel="norefferer" target="_blank" href={selectedMeta.link} target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>
										<Button style={{}} variant="outlined">
											<EditIcon /> &nbsp;&nbsp;Edit
										</Button>
									</a>
								</Typography>
						}
						{mobile ? null : 
							<div style={{height: "100%", width: 1, backgroundColor: "white", marginLeft: 50, marginRight: 50, }} />
						}
						<Typography style={{display: "inline", marginTop: 11, }}>
							{selectedMeta.read_time} minute{selectedMeta.read_time === 1 ? "" : "s"} to read
						</Typography>
					</div>
					<div style={{flex: 2}}>
						{mobile || selectedMeta.contributors === undefined || selectedMeta.contributors === null ? "" : 
							<div style={{margin: 10, height: "100%", display: "inline",}}>
								{selectedMeta.contributors.slice(0,7).map((data, index) => {
									return (
											<a rel="norefferer" target="_blank" href={data.url} target="_blank" style={{textDecoration: "none", color: "#f85a3e"}}>
												<Tooltip title={data.url} placement="bottom">
													<img alt={data.url} src={data.image} style={{marginTop: 5, marginRight: 10, height: 40, borderRadius: 40, }} />
												</Tooltip>
											</a>
									)
								})}
								</div>
							}
					</div>
				</div>
		}

		return (
			<Typography 
				onMouseOver={() => {
					setHover(true)
				}} >
				{props.level !== 1 ? <Divider style={{width: "90%", marginTop: 40, backgroundColor: theme.palette.inputColor}} /> : null}
				{element}
				{/*hover ? <LinkIcon onMouseOver={() => {setHover(true)}} style={{cursor: "pointer", display: "inline", }} onClick={() => {
					window.location.href += "#hello"
					console.log(window.location)
					//window.history.pushState('page2', 'Title', '/page2.php');
					//window.history.replaceState('page2', 'Title', '/page2.php');
				}} /> 
				: ""
				*/}
				{extraInfo}
			</Typography>
		)
	}
	//React.createElement("p", {style: {color: "red", backgroundColor: "blue"}}, this.props.paragraph)


	//function unicodeToChar(text) {
	//	return text.replace(/\\u[\dA-F]{4}/gi, 
	//   		function (match) {
	//        	return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
	//        }
	//	);
	//}

  const postDataBrowser = list === undefined || list === null ? null :
		<div style={Body}>
			<div style={SideBar}>
				<Paper style={SidebarPaperStyle}>
					<List style={{listStyle: "none", paddingLeft: "0", }}>
						{list.map((data, index) => {
							const item = data.name
							if (item === undefined) {
								return null
							}

							const path = "/docs/"+item
							const newname = item.charAt(0).toUpperCase()+item.substring(1).split("_").join(" ").split("-").join(" ")
							return (
								<li key={index} style={{marginTop: 10,}}>
									<Link key={index} style={hrefStyle} to={path} onClick={() => {fetchDocs(item)}}>
										<Typography style={{color: props.match.params.key.toLowerCase() === item.toLowerCase() ? "#f86a3e" : "inherit"}} variant="body1"><b>> {newname}</b></Typography>
									</Link>
								</li>
							)
						})}
					</List>
				</Paper>
			</div>
			<div id="markdown_wrapper_outer" style={markdownStyle}>
				<ReactMarkdown 
					id="markdown_wrapper" 
					escapeHtml={false}
					source={data} 
					renderers={{
						link: OuterLink, 
						image: Img,
						code: CodeHandler,
						heading: Heading,
					}}
				/>
			</div>
		</div>

	const mobileStyle = {
		color: "white",
		marginLeft: 25,
		marginRight: 25,
		paddingBottom: 50,
		backgroundColor: "inherit",
		display: "flex",
		flexDirection: "column",
	}

	const postDataMobile = list === undefined || list === null ? null :
		<div style={mobileStyle}>
			<div>
				<Button fullWidth aria-controls="simple-menu" aria-haspopup="true" variant="outlined" color="primary" onClick={handleClick}>
					<div style={{color: "white"}}>
						More docs 
					</div>
				</Button>
				<Menu
					id="simple-menu"
					anchorEl={anchorEl}
					style={{}}
					keepMounted
					open={Boolean(anchorEl)}
					onClose={handleClose}
				>
				{list.map((data, index) => {
					const item = data.name
					if (item === undefined) {
						return null
					}

					const path = "/docs/"+item
					const newname = item.charAt(0).toUpperCase()+item.substring(1).split("_").join(" ").split("-").join(" ")
					return (
						<MenuItem key={index} style={{color: "white",}} onClick={() => {window.location.pathname = path}}>{newname}</MenuItem>
					)
				})}
				</Menu>
			</div>
			<div id="markdown_wrapper_outer" style={markdownStyle}>
				<ReactMarkdown 
					id="markdown_wrapper" 
					escapeHtml={false}
					source={data} 
					renderers={{
						link: OuterLink, 
						image: Img,
						code: CodeHandler,
						heading: Heading,
					}}
				/>
			</div>
			<Divider style={{marginTop: "10px", marginBottom: "10px", backgroundColor: dividerColor}}/>
			<Button fullWidth aria-controls="simple-menu" aria-haspopup="true" variant="outlined" color="primary" onClick={handleClick}>
				<div style={{color: "white"}}>
		      More docs 
				</div>
			</Button>

		</div>


	//const imageModal = 
	//	<Dialog modal
	//		open={imageModalOpen} 
	//	</Dialog>
 	// {imageModal}


	const loadedCheck = 
		<div>
			<BrowserView>
				{postDataBrowser}	
			</BrowserView>
			<MobileView>
				{postDataMobile}	
			</MobileView>
		</div>

	return (
		<div>	
			{loadedCheck}
		</div>	
	)
}


export default Docs;
