import React, {useState} from 'react';
import {BrowserView, MobileView} from "react-device-detect";

import {Link} from 'react-router-dom';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import HomeIcon from '@material-ui/icons/Home';
import PolymerIcon from '@material-ui/icons/Polymer';
import AppsIcon from '@material-ui/icons/Apps';
import DescriptionIcon from '@material-ui/icons/Description';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';

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

	// Should be based on some path
	const logoCheck = !homePage ?  null : null

	// Handle top bar or something
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
				<List style={{display: 'flex', flexDirection: 'row-reverse'}} component="nav">
					<ListItem style={{flex: "1", textAlign: "center"}}>
						<div onMouseOver={handleLoginHover} onMouseOut={handleLoginHoverOut} onClick={handleClickLogout} style={{color: LoginHoverColor, cursor: "pointer"}}> 
        	    	Logout
        	  </div>
        	</ListItem>
					{logoCheck}		
        	<ListItem style={{flex: "1", textAlign: "center"}}>
						<Link to="/settings" style={hrefStyle}>
							<Button 
								style={{}} 
								variant="outlined"
								color="primary"> Settings</Button>
						</Link>
        	</ListItem>
					{/*
      		<ListItem>
						<Link to="/contact" style={hrefStyle}>
							<Button 
								style={{}} 
								variant="contained"
								color="primary"
							> 
								Contact	
							</Button>
						</Link>
					</ListItem>
					*/}
					{userdata === undefined || userdata.admin === undefined || userdata.admin === null || !userdata.admin ? null : 
						<ListItem>
							<Link to="/admin" style={hrefStyle}>
								<Button 
									style={{}} 
									variant="contained"
									color="primary"
								> 
									Admin	
								</Button>
							</Link>
						</ListItem>
					}
					{userdata === undefined || userdata.orgs === undefined || userdata.orgs === null || userdata.orgs.length <= 1 ? null :
						<ListItem>
							<Select
								SelectDisplayProps={{
									style: {
										marginLeft: 10,
									}
								}}
								value={userdata.selected_org}
								fullWidth
								style={{backgroundColor: theme.palette.surfaceColor, color: "white", height: "50px"}}
								onChange={(e) => {
									console.log("SET ORG TO ", e.target.value)
								}}
								>
								{userdata.orgs.map(data => {
									return (
										<MenuItem key={data.id} style={{backgroundColor: theme.palette.inputColor, color: "white"}} value={data}>
											{data.name}
										</MenuItem>
									)
								})}
							</Select>
						</ListItem>
					}

				</List>
			</div>
	    </div>

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
				<List style={{display: 'flex', flexDirection: 'row-reverse'}} component="nav">
					<ListItem style={{flex: "1", textAlign: "center"}}>
						<div onMouseOver={handleLoginHover} onMouseOut={handleLoginHoverOut} onClick={handleClickLogout} style={{color: LoginHoverColor, cursor: "pointer"}}> 
        	    	Logout
        	  	</div>
        		</ListItem>
						{logoCheck}		
        		<ListItem style={{flex: "1", textAlign: "center"}}>
							<Link to="/settings" style={hrefStyle}>
								<Button 
									style={{}} 
									variant="contained"
									color="primary"> Settings</Button>
							</Link>
						</ListItem>
						<ListItem></ListItem>
				</List>
			</div>
	    </div>

	// <Divider style={{height: "1px", width: "100%", backgroundColor: "rgb(91, 96, 100)"}}/>
	const loadedCheck = 
		<div style={{minHeight: 68}}>
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
