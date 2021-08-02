import React, {useState} from 'react';
import {BrowserView, MobileView} from "react-device-detect";

import {Link} from 'react-router-dom';

import { useTheme } from '@material-ui/core/styles';

import { Tooltip, List, Avatar, Menu, ListItem, MenuItem, Select, Button, IconButton, Grid } from '@material-ui/core';
import { Home as HomeIcon, Polymer as PolymerIcon, Apps as AppsIcon, Description as DescriptionIcon} from '@material-ui/icons';
import { useAlert } from "react-alert";

const hoverColor = "#f85a3e"
const hoverOutColor = "#e8eaf6"

const Header = props => {
  const { globalUrl, isLoggedIn, removeCookie, homePage, isLoaded, userdata, cookies } = props;
	const theme = useTheme();

	const [HomeHoverColor, setHomeHoverColor] = useState(hoverOutColor);
	const [SoarHoverColor, setSoarHoverColor] = useState(hoverOutColor);
	const [LoginHoverColor, setLoginHoverColor] = useState(hoverOutColor);
	const [DocsHoverColor, setDocsHoverColor] = useState(hoverOutColor);
  const [HelpHoverColor, setHelpHoverColor] = useState(hoverOutColor);
  const [anchorEl, setAnchorEl] = React.useState(null);
	const alert = useAlert()

	const hrefStyle = {
		color: hoverOutColor,
		textDecoration: "none",
	}

	// DEBUG HERE 
	const handleClickLogout = () => {
    console.log("COOKIES: ", cookies, "Remover: ", removeCookie)
		// Don't really care about the logout
    fetch(globalUrl+"/api/v1/logout", {
			credentials: "include",
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
		.then(() => {
			// Log out anyway
			//cookies.remove("session_token")
			//window.location.pathname = "/"
			console.log("Should've logged out")
			removeCookie("session_token", {path: "/"})
			removeCookie("session_token", {path: "/workflows"})
			window.location.reload()
		})
		.catch(error => {
    	console.log("Error in logout: ", error)
			removeCookie("session_token", {path: "/"})
			window.location.reload()
			//removeCookie("session_token", {path: "/"})
		})
  }

	const handleClickChangeOrg = (orgId) => {
		// Don't really care about the logout
		//name: org.name,
		//orgId = "asd"
		const data = {
			org_id: orgId,
		}

    fetch(`${globalUrl}/api/v1/orgs/${orgId}/change`, {
			mode: 'cors',
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'include',
			crossDomain: true,
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
		})
		.then(function(response) {
			if (response.status !== 200) {
				console.log("Error in response")
			}

			return response.json();
		}).then(function(responseJson) {	
			if (responseJson.success !== undefined && responseJson.success) {
				setTimeout(() => {
					window.location.reload()
				}, 2000)
				alert.success("Successfully changed active organization - refreshing!")
			} else {
				alert.error("Failed changing org: ", responseJson.reason)
			}
		})
		.catch(error => {
			console.log("error changing: ", error)
			//removeCookie("session_token", {path: "/"})
		})
  }

	// Rofl this is weird
	const handleDocsHover = () => {
    	setDocsHoverColor(hoverColor)
  }

	const handleDocsHoverOut = () => {
    	setDocsHoverColor(hoverOutColor)
  }

	const handleHomeHover = () => {
    	setHomeHoverColor(hoverColor)
  }

	const handleHelpHover = () => {
    	setHelpHoverColor(hoverColor)
  }

	const handleHelpHoverOut = () => {
    	setHelpHoverColor(hoverOutColor)
  	}
	
	const handleSoarHover = () => {
    	setSoarHoverColor(hoverColor)
  	}

	const handleSoarHoverOut = () => {
    	setSoarHoverColor(hoverOutColor)
  	}

	const handleHomeHoverOut = () => {
    	setHomeHoverColor(hoverOutColor)
  	}

	const handleLoginHover = () => {
    	setLoginHoverColor(hoverColor)
  	}

	const handleLoginHoverOut = () => {
    	setLoginHoverColor(hoverOutColor)
  	}


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };



	// Should be based on some path
	const avatarMenu = 
		<span>
			<IconButton color="primary" style={{marginRight: 15, }} aria-controls="simple-menu" aria-haspopup="true" onClick={(event) => {
				setAnchorEl(event.currentTarget);
			}}>
				<Avatar style={{height: 35, width: 35,}} alt="Your username here" src="" />
			</IconButton>
			<Menu
				id="simple-menu"
				anchorEl={anchorEl}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={() => {
					handleClose()
				}}
			>
				<MenuItem onClick={(event) => {
					event.preventDefault()
					handleClose() 
				}}>
					<Link to="/settings" style={hrefStyle}>
						Settings
					</Link>
				</MenuItem>
				<MenuItem style={{color: "white"}} onClick={(event) => {
					event.preventDefault()
					handleClose() 
					handleClickLogout()
				}}>
					Logout
				</MenuItem>
			</Menu>
		</span>


	// Handle top bar or something
	const logoCheck = !homePage ?  null : null
  const loginTextBrowser = !isLoggedIn ? 
    	<div style={{display: "flex"}}>
			<List style={{display: "flex", flexDirect: "row"}} component="nav">
				<ListItem style={{textAlign: "center", marginLeft: "0px"}}>
					<Link to ="/docs/about" style={hrefStyle}>
						<div onMouseOver={handleSoarHover} onMouseOut={handleSoarHoverOut} style={{color: SoarHoverColor, cursor: "pointer"}}>
							About	
						</div>
					</Link>
				</ListItem>
			</List>
			<div style={{flex: "7", display: "flex", flexDirection: "row-reverse"}}>
				<List style={{display: 'flex', flexDirection: 'row-reverse'}} component="nav">
					<ListItem style={{flex: "1", textAlign: "center"}}>
						<Link to="/login" style={hrefStyle}>
								<div onMouseOver={handleLoginHover} onMouseOut={handleLoginHoverOut}  style={{color: LoginHoverColor, cursor: "pointer"}}>Login</div> 
						</Link>
					</ListItem>
				</List>
			</div>
	    </div>
    	: 
		<div style={{display: "flex"}}>
			<div style={{flex: "1", flexDirection: "row"}}>
				<List style={{display: "flex", flexDirect: "row", flex: "1"}} component="nav">
       			<ListItem style={{textAlign: "center"}}>
							<Link to="/workflows" style={hrefStyle}>
								<div onMouseOver={handleSoarHover} onMouseOut={handleSoarHoverOut} style={{color: SoarHoverColor, cursor: "pointer", display: "flex"}}>
									<PolymerIcon style={{marginRight: "5px"}} />
									<span style={{marginTop: 2}}>Workflows</span>
								</div> 
							</Link>
       			</ListItem>
       			<ListItem style={{textAlign: "center"}}>
							<Link to="/apps" style={hrefStyle}>
									<div onMouseOver={handleHelpHover} onMouseOut={handleHelpHoverOut} style={{color: HelpHoverColor, cursor: "pointer", display: "flex",}}>
										<AppsIcon style={{marginRight: "5px"}} />
										<span style={{marginTop: 2}}>Apps</span>
									</div>
							</Link>
       			</ListItem>
						{/*
						<ListItem style={{textAlign: "center"}}>
							<Link to="/dashboard" style={hrefStyle}>
									<div onMouseOver={handleDocsHover} onMouseOut={handleDocsHoverOut} style={{color: DocsHoverColor, cursor: "pointer"}}>Dashboard</div> 
							</Link>
       			</ListItem>
						*/}
       			<ListItem style={{textAlign: "center"}}>
							<Link to="/docs/about" style={hrefStyle}>
									<div onMouseOver={handleDocsHover} onMouseOut={handleDocsHoverOut} style={{color: DocsHoverColor, cursor: "pointer", display: "flex"}}>
										<DescriptionIcon style={{marginRight: "5px"}} />
										<span style={{marginTop: 2}}>Docs</span>
									</div>
							</Link>
       			</ListItem>
						{/*
       			<ListItem style={{textAlign: "center"}}>
							<Link to="/pricing" style={hrefStyle}>
									<div onMouseOver={handleDocsHover} onMouseOut={handleDocsHoverOut} style={{color: DocsHoverColor, cursor: "pointer", display: "flex"}}>
										<DescriptionIcon style={{marginRight: "5px"}} />
										<span style={{marginTop: 2}}>Pricing</span>
									</div>
							</Link>
       			</ListItem>
						*/}
					{/*
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/configurations" style={hrefStyle}>
    						<div onMouseOver={handleCredentialHover} onMouseOut={handleCredentialHoverOut} style={{color: CredentialHoverColor, cursor: "pointer"}}>Configure</div> 
						</a>
       				</ListItem>
					*/}
				</List>
			</div>
			<div style={{flex: "10", display: "flex", flexDirection: "row-reverse"}}>
				{avatarMenu}
				{userdata === undefined || userdata.admin === undefined || userdata.admin === null || !userdata.admin ? null : 
					<Link to="/admin" style={hrefStyle}>
						<Button color="primary" variant="contained" style={{marginRight: 15, marginTop: 12}}>
							Admin
						</Button>
					</Link>
				}
				{userdata === undefined || userdata.orgs === undefined || userdata.orgs === null || userdata.orgs.length <= 1 ? null :
					<Select
						SelectDisplayProps={{
							style: {
								marginLeft: 10,
								maxWidth: 200,
								overflow: "hidden",
							}
						}}
						value={userdata.active_org.id}
						fullWidth
						style={{marginTop: 5, backgroundColor: theme.palette.surfaceColor, marginRight: 15, color: "white", height: 50, width: 200}}
						onChange={(e) => {
							handleClickChangeOrg(e.target.value) 
						}}
						>
						{userdata.orgs.map((data, index) => {
							const imagesize = 22
							const imageStyle = {width: imagesize, height: imagesize, pointerEvents: "none", marginRight: 10, marginLeft: data.creator_org !== undefined && data.creator_org.length > 0 ? 20 : 0}
							const image = data.image === "" ? 
								<img alt={data.name} src={theme.palette.defaultImage} style={imageStyle} />
								:
								<img alt={data.name} src={data.image} style={imageStyle} />

							return (
								<MenuItem key={index} disabled={data.id === userdata.active_org.id} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data.id}>

									<Tooltip color="primary" title={`Suborg of ${data.creator_org}`} placement="left">
										<div style={{display: "flex"}}>
											{image} {data.name}
										</div>
									</Tooltip>
								</MenuItem>
							)
						})}
					</Select>
				}
			</div>
	  </div>

	//console.log("USR: ", userdata.orgs)

	const loginTextMobile = !isLoggedIn ? 
    	<div style={{display: "flex"}}>
			<List style={{display: "flex", flexDirection: "row"}} component="nav">
				<ListItem style={{textAlign: "center"}}>
					<Link to="/" style={hrefStyle}>
						<div onMouseOver={handleHomeHover} onMouseOut={handleHomeHoverOut} style={{color: HomeHoverColor, cursor: "pointer"}}> 
							<Grid container direction="row" alignItems="center">
								<Grid item>
									<HomeIcon style={{marginTop: "3px", marginRight: "5px"}} />
								</Grid>
							</Grid>
						</div>
					</Link>
				</ListItem>
				<ListItem style={{textAlign: "center"}}>
					<Link to="/docs/about" style={hrefStyle}>
						<div onMouseOver={handleSoarHover} onMouseOut={handleSoarHoverOut} style={{color: SoarHoverColor, cursor: "pointer"}}>
							About	
						</div>
					</Link>
				</ListItem>
			</List>
	    </div>
    	: 
		<div style={{display: "flex"}}>
			<div style={{flex: "1", flexDirection: "row"}}>
				<List style={{display: "flex", flexDirect: "row", flex: "1"}} component="nav">
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/" style={hrefStyle}>
    						<div onMouseOver={handleHomeHover} onMouseOut={handleHomeHoverOut} style={{color: HomeHoverColor, cursor: "pointer"}}>Shuffle</div> 
						</Link>
					</ListItem>
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/workflows" style={hrefStyle}>
    						<div onMouseOver={handleSoarHover} onMouseOut={handleSoarHoverOut} style={{color: SoarHoverColor, cursor: "pointer"}}>Workflows</div> 
						</Link>
       				</ListItem>
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/apps" style={hrefStyle}>
    						<div onMouseOver={handleHelpHover} onMouseOut={handleHelpHoverOut} style={{color: HelpHoverColor, cursor: "pointer"}}>Apps</div> 
						</Link>
       				</ListItem>
					{/*
       				<ListItem style={{textAlign: "center"}}>
						<Link to="/configurations" style={hrefStyle}>
    						<div onMouseOver={handleCredentialHover} onMouseOut={handleCredentialHoverOut} style={{color: CredentialHoverColor, cursor: "pointer"}}>Configure</div> 
						</a>
       				</ListItem>
					*/}
				</List>
			</div>
			<div style={{flex: "10", display: "flex", flexDirection: "row-reverse"}}>
				{avatarMenu}
			</div>
	  </div>

	// <Divider style={{height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
	const loadedCheck = 
		<div style={{minHeight: 60}}>
			<BrowserView>
      			{loginTextBrowser}
			</BrowserView>
			<MobileView>
      			{loginTextMobile}
			</MobileView>
		</div>
    // <div style={{backgroundImage: "linear-gradient(-90deg,#342f78 0,#29255e 50%,#1b1947 100%"}}>
  	return (
    	<div>
			{loadedCheck}
	    </div>
  )
}

export default Header;
