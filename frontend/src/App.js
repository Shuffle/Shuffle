import React, {useState, useEffect} from 'react';

import {Route} from 'react-router';
import {BrowserRouter} from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import { useCookies } from 'react-cookie';

import EditSchedule from "./EditSchedule";
import Schedules from "./Schedules";
import Webhooks from "./Webhooks";
import Workflows from "./Workflows";
import EditWebhook from "./EditWebhook";
import AngularWorkflow from "./AngularWorkflow";
import ForgotPassword from "./ForgotPassword";
import ForgotPasswordLink from "./ForgotPasswordLink";

import Header from './Header';
import Apps from './Apps';
import AppCreator from './AppCreator';
import Contact from './Contact';
import Oauth2 from './Oauth2';
import About from "./About";
import Post from "./Post";
import Dashboard from "./Dashboard";
import AdminSetup from "./AdminSetup";
import Admin from "./Admin";
import Docs from "./Docs";
import RegisterLink from "./RegisterLink";
import LandingPage from "./Landingpage";
import LandingPageNew from "./LandingpageNew";
import LoginPage from "./LoginPage";
import SettingsPage from "./SettingsPage";

import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { createMuiTheme } from '@material-ui/core/styles';

import AlertTemplate from "react-alert-template-basic";
import { positions, Provider } from "react-alert";

// Testing - localhost
const globalUrl = "http://192.168.3.6:5001"
//console.log("HOST: ", process.env)


// Production - backend proxy forwarding in nginx
//const globalUrl = window.location.origin

const surfaceColor = "#27292D"
const inputColor = "#383B40"

const theme = createMuiTheme({
	palette: {
		primary: {
			main: "#f85a3e"
    },
    secondary: {
      main: '#e8eaf6',
    },
   },
   typography: { 
      useNextVariants: true
   }
});


// FIXME - set client side cookies
const App = (message, props) => {
  const [userdata, setUserData] = useState({});
  //const [homePage, ] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dataset, setDataset] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
	if (dataset === false) {
		checkLogin() 
		setDataset(true)
  }})

	if (isLoaded && !isLoggedIn && (!window.location.pathname.startsWith("/login") && (!window.location.pathname.startsWith("/docs") && (!window.location.pathname.startsWith("/adminsetup"))))) {
		window.location = "login"
	}

  const checkLogin = () => {
    var baseurl = globalUrl
    fetch(baseurl+"/api/v1/getinfo", {
	  credentials: "include",
  	  headers: {
  		'Content-Type': 'application/json',
  	  },
  	})
    .then(response => response.json())
    .then(responseJson => {
			console.log(responseJson)
      if (responseJson.success === true) {
				setUserData(responseJson)
				setIsLoggedIn(true)

				// Updating cookie every request
				console.log("COOKIES: ",  cookies)
				for (var key in responseJson["cookies"]) {
					setCookie(responseJson["cookies"][key].key, responseJson["cookies"][key].value, {path: "/"})
				}
      } 
	  setIsLoaded(true)
    })
    .catch(error => {
	  setIsLoaded(true)
    });
  }

  // Dumb for content load (per now), but good for making the site not suddenly reload parts (ajax thingies)
  
  const options = {
	  timeout: 5000,
	  position: positions.BOTTOM_CENTER
  };

  const includedData = window.location.pathname === "/home" || window.location.pathname === "/features" ?
		<div>
  			<Route exact path="/home" render={props => <LandingPageNew isLoaded={isLoaded} {...props} /> } />
		</div> : 
		<div style={{backgroundColor: "#1F2023", color: "rgba(255, 255, 255, 0.65)", minHeight: "100vh"}}>
			<Header removeCookie={removeCookie} isLoaded={isLoaded} globalUrl={globalUrl} setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} surfaceColor={surfaceColor} inputColor={inputColor}{...props} />
			<Route exact path="/oauth2" render={props => <Oauth2 isLoaded={isLoaded} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor}{...props} /> } />
			<Route exact path="/contact" render={props => <Contact isLoaded={isLoaded} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/login" render={props => <LoginPage isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/admin" render={props => <Admin isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/settings" render={props => <SettingsPage isLoaded={isLoaded} userdata={userdata} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/AdminSetup" render={props => <AdminSetup isLoaded={isLoaded} userdata={userdata} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/webhooks" render={props => <Webhooks isLoaded={isLoaded} globalUrl={globalUrl} {...props} /> } />
			<Route exact path="/webhooks/:key" render={props => <EditWebhook isLoaded={isLoaded} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/schedules" render={props => <Schedules globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/dashboard" render={props => <Dashboard isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/apps" render={props => <Apps isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/apps/new" render={props => <AppCreator isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/apps/edit/:appid" render={props => <AppCreator isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/schedules/:key" render={props => <EditSchedule globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor} {...props} /> } />
			<Route exact path="/workflows" render={props => <Workflows isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} cookies={cookies} surfaceColor={surfaceColor} inputColor={inputColor}{...props} /> } />
			<Route exact path="/workflows/:key" render={props => <AngularWorkflow globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={surfaceColor} inputColor={inputColor}{...props} /> } />
			<Route exact path="/docs/:key" render={props => <Docs isLoaded={isLoaded} globalUrl={globalUrl} surfaceColor={surfaceColor} inputColor={inputColor}{...props} /> } />
			<Route exact path="/docs" render={props => {window.location.pathname = "/docs/about"}} />
			<Route exact path="/" render={props => {window.location.pathname = "/login"}} />
		</div>
	
  // <div style={{backgroundColor: "rgba(21, 32, 43, 1)", color: "#fffff", minHeight: "100vh"}}>
  // backgroundColor: "#213243",
  // This is a mess hahahah
  return (
	<MuiThemeProvider theme={theme}>
	<CookiesProvider>
		<BrowserRouter>
			<Provider template={AlertTemplate} {...options}>
  			{includedData}
			</Provider>
		</BrowserRouter>
	</CookiesProvider>
	</MuiThemeProvider>
  );
};

export default App;

