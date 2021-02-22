import React, {useState, useEffect} from 'react';

import { useTheme } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import ReactMarkdown from 'react-markdown';
import {BrowserView, MobileView} from "react-device-detect";
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import {Link} from 'react-router-dom';

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
  const { isLoaded, globalUrl, selectedDoc, serverside, isMobile, update} = props;

	const theme = useTheme();
	const [data, setData] = useState("");
	const [firstrequest, setFirstrequest] = useState(true);
	const [list, setList] = useState([]);
	const [listLoaded, setListLoaded] = useState(false);
	const [anchorEl, setAnchorEl] = React.useState(null);
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
				setList(["error"])
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
			} else {
				setData("# Error\nThis page doesn't exist.")
			}
		})
		.catch(error => {});
	}

	if (firstrequest) {
		setFirstrequest(false)

		if (selectedDoc !== undefined) {
			setData(selectedDoc.reason)
			setList(selectedDoc.list)
			setListLoaded(true)
		} else {
			fetchDocList()
			fetchDocs(props.match.params.key)
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
				var elements = parent.getElementsByTagName('h3')
				console.log(name)
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
		maxWidth: isMobile ? "100%" : 750,
		overflow: "hidden",
		paddingBottom: 200, 
		marginLeft: isMobile ? 0 : 275, 
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

	function TextWrapper(props) {
		console.log(props)
		return (
			<Typography>
				{props.value}			
			</Typography>
		)
	}

	function Heading(props) {
		const element = React.createElement(`h${props.level}`, {style: {marginTop: 40}}, props.children)
		return (
			<Typography>
				{props.level !== 1 ? <Divider style={{width: "90%", marginTop: 40, backgroundColor: theme.palette.inputColor}} /> : null}
				{element}
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

  const postDataBrowser = 
		<div style={Body}>
			<div style={SideBar}>
				<Paper style={SidebarPaperStyle}>
					<List style={{listStyle: "none", paddingLeft: "0", }}>
						{list.map((item, index) => {
							const path = "/docs/"+item
							const newname = item.charAt(0).toUpperCase()+item.substring(1).split("_").join(" ").split("-").join(" ")
							return (
								<li key={index} style={{marginTop: 15,}}>
									<Link key={index} style={hrefStyle} to={path} onClick={() => {fetchDocs(item)}}>
										<Typography variant="h6"><b>{newname}</b></Typography>
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

	const postDataMobile = 
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
				{list.map((item, index) => {
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
