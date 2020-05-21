import React, {useState, useEffect} from 'react';

import Divider from '@material-ui/core/Divider';
import ReactMarkdown from 'react-markdown';
import {BrowserView, MobileView} from "react-device-detect";
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

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

const SideBar = {
	maxWidth: "250px",
	flex: "1",
}

const hrefStyle = {
	color: "rgba(255, 255, 255, 0.40)", 
	textDecoration: "none"
}

const Docs = (props) => {
  const { isLoaded, globalUrl } = props;

	const [data, setData] = useState("");
	const [firstrequest, setFirstrequest] = useState(true);
	const [list, setList] = useState([]);
	const [listLoaded, setListLoaded] = useState(false);
	const [anchorEl, setAnchorEl] = React.useState(null);

  function handleClick(event) {
		setAnchorEl(event.currentTarget);
	}

	function handleClose() {
		setAnchorEl(null);
	}

	useEffect(() => {
		if (firstrequest) {
			setFirstrequest(false)
			fetchDocList()
			fetchDocs()
			return
		}

		// Continue this, and find the h2 with the data in it lol
		if (window.location.hash.length > 0) {
			console.log("HELLO")

			var parent = document.getElementById("markdown_wrapper")
			if (parent !== null) {
				var elements = parent.getElementsByTagName('h2')

				const name = window.location.hash.slice(1, window.location.hash.lenth).toLowerCase().split("%20").join(" ")

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
	})

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

	const fetchDocs = () => {
		fetch(globalUrl+"/api/v1/docs/"+props.match.params.key, {
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
			} else {
				setData("# Error\nThis page doesn't exist.")
			}
		})
		.catch(error => {});
	}

	const markdownStyle = {
		color: "rgba(255, 255, 255, 0.65)", 
		flex: "1",
	}

	function OuterLink(props) {
		return <Link to={props.href} style={{color: "#f85a3e", textDecoration: "none"}}>{props.children}</Link>
	}

	function Img(props) {
		return <img style={{maxWidth: "100%"}} alt={props.alt} src={props.src}/>
	}

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
				<ul style={{listStyle: "none", paddingLeft: "0"}}>
					<li style={{marginTop: "10px"}}>
						<a style={hrefStyle} href="/">
							<h2>Home</h2>
						</a>
					</li>
					{list.map(item => {
						const path = "/docs/"+item
						const newname = item.charAt(0).toUpperCase()+item.substring(1)
						return (
							<li style={{marginTop: "10px"}}>
								<a style={hrefStyle} href={path}>
									<h2>{newname}</h2>
								</a>
							</li>
						)
					})}
				</ul>
			</div>
			<div id="markdown_wrapper" style={markdownStyle}>
				<ReactMarkdown 
					id="markdown_wrapper" 
					escapeHtml={false}
					source={data} 
	 				renderers={{link: OuterLink, image: Img}}
				/>
			</div>
		</div>

	const mobileStyle = {
		color: "white",
		marginLeft: "15px",
		marginRight: "15px",
		paddingBottom: "50px",
		backgroundColor: "inherit",
	}

	const postDataMobile = 
		<div style={mobileStyle}>
			<Button aria-controls="simple-menu" aria-haspopup="true" variant="outlined" color="primary" onClick={handleClick}>
				<div style={{color: "white"}}>
		        More items
				</div>
			</Button>
			<Menu
				id="simple-menu"
				anchorEl={anchorEl}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={handleClose}
			>
			{list.map(item => {
				const path = "/docs/"+item
				const newname = item.charAt(0).toUpperCase()+item.substring(1)
				return (
					<MenuItem onClick={() => {window.location.pathname = path}}>{newname}</MenuItem>
				)
			})}
			</Menu>
			<div style={markdownStyle}>
				<ReactMarkdown 
					id="markdown_wrapper" 
					escapeHtml={false}
					source={data} 
	 				renderers={{link: OuterLink, image: Img}}
				/>
			</div>
			<Divider style={{marginTop: "10px", marginBottom: "10px", backgroundColor: dividerColor}}/>
			<Button aria-controls="simple-menu" aria-haspopup="true" variant="outlined" color="primary" onClick={handleClick}>
				<div style={{color: "white"}}>
		        	More items
				</div>
			</Button>

		</div>


	//const imageModal = 
	//	<Dialog modal
	//		open={imageModalOpen} 
	//	</Dialog>
 	// {imageModal}


	const loadedCheck = isLoaded && listLoaded ? 
		<div>
			<BrowserView>
				{postDataBrowser}	
			</BrowserView>
			<MobileView>
				{postDataMobile}	
			</MobileView>
		</div>
		:
		<div>
		</div>

	return (
		<div>	
			{loadedCheck}
		</div>	
	)
}


export default Docs;
