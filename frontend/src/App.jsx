import React, { useState, useEffect } from 'react';

import { Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import { removeCookies, useCookies } from 'react-cookie';

import EditSchedule from "./views/EditSchedule";
import Schedules from "./views/Schedules";
import Webhooks from "./views/Webhooks";
import Workflows from "./views/Workflows";
import EditWebhook from "./views/EditWebhook";
import AngularWorkflow from "./views/AngularWorkflow";

import Header from './components/Header';
import theme from './theme'
import Apps from './views/Apps';
import AppCreator from './views/AppCreator';

import Dashboard from "./views/Dashboard";
import AdminSetup from "./views/AdminSetup";
import Admin from "./views/Admin";
import Docs from "./views/Docs";
import Introduction from "./views/Introduction";

import LandingPageNew from "./views/LandingpageNew";
import LoginPage from "./views/LoginPage";
import SettingsPage from "./views/SettingsPage";

import MyView from "./views/MyView";

import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

import ScrollToTop from "./components/ScrollToTop";
import AlertTemplate from "./components/AlertTemplate";
import { positions, Provider } from "react-alert";
import {isMobile} from "react-device-detect";

// Production - backend proxy forwarding in nginx
var globalUrl = window.location.origin

// CORS used for testing purposes. Should only happen with specific port and http
if (window.location.protocol == "http:" && window.location.port === "3000") {
	globalUrl = "http://localhost:5001"
	//globalUrl = "http://localhost:5002"
}

const App = (message, props) => {
	const [userdata, setUserData] = useState({});
	const [cookies, setCookie, removeCookie] = useCookies([]);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [dataset, setDataset] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [curpath, setCurpath] = useState(typeof window === 'undefined' || window.location === undefined ? "" : window.location.pathname)

	useEffect(() => {
		if (dataset === false) {
			checkLogin()
			setDataset(true)
		}
	})

	if (isLoaded && !isLoggedIn && (!window.location.pathname.startsWith("/login") && (!window.location.pathname.startsWith("/docs") && (!window.location.pathname.startsWith("/adminsetup"))))) {
		window.location = "/login"
	}

	const checkLogin = () => {
		var baseurl = globalUrl
		fetch(baseurl + "/api/v1/users/getinfo", {
			credentials: "include",
			headers: {
				'Content-Type': 'application/json',
			},
		})
		.then(response => response.json())
		.then(responseJson => {
			if (responseJson.success === true) {
				//console.log(responseJson.success)
				setUserData(responseJson)
				setIsLoggedIn(true)
				//console.log("Cookies: ", cookies)

				// Updating cookie every request
				for (var key in responseJson["cookies"]) {
					setCookie(responseJson["cookies"][key].key, responseJson["cookies"][key].value, { path: "/" })
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
		timeout: 9000,
		position: positions.BOTTOM_LEFT,
	};

	const includedData = window.location.pathname === "/home" || window.location.pathname === "/features" ?
		<div>
			<Route exact path="/home" render={props => <LandingPageNew isLoaded={isLoaded} {...props} />} />
		</div> :
		<div style={{ backgroundColor: "#1F2023", color: "rgba(255, 255, 255, 0.65)", minHeight: "100vh" }}>
			<ScrollToTop setCurpath={setCurpath} />
			<Header cookies={cookies} removeCookie={removeCookie} isLoaded={isLoaded} globalUrl={globalUrl} setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} userdata={userdata} {...props} />
			<Route exact path="/login" render={props => <LoginPage isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} {...props} />} />
			<Route exact path="/admin" render={props => <Admin userdata={userdata} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} {...props} />} />
			<Route exact path="/admin/:key" render={props => <Admin isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} {...props} />} />
			<Route exact path="/settings" render={props => <SettingsPage isLoaded={isLoaded} userdata={userdata} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/AdminSetup" render={props => <AdminSetup isLoaded={isLoaded} userdata={userdata} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/webhooks" render={props => <Webhooks isLoaded={isLoaded} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/webhooks/:key" render={props => <EditWebhook isLoaded={isLoaded} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/schedules" render={props => <Schedules globalUrl={globalUrl} {...props} />} />
			<Route exact path="/dashboard" render={props => <Dashboard isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/apps/new" render={props => <AppCreator isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/apps" render={props => <Apps isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} userdata={userdata} {...props} />} />
			<Route exact path="/apps/edit/:appid" render={props => <AppCreator isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/schedules/:key" render={props => <EditSchedule globalUrl={globalUrl} {...props} />} />
			<Route exact path="/workflows" render={props => <Workflows cookies={cookies} removeCookie={removeCookie} isLoaded={isLoaded} isLoggedIn={isLoggedIn} globalUrl={globalUrl} cookies={cookies} userdata={userdata} {...props} />} />
			<Route exact path="/workflows/:key" render={props => <AngularWorkflow userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} {...props} />} />
			<Route exact path="/docs/:key" render={props => <Docs isMobile={isMobile} isLoaded={isLoaded} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/docs" render={props => { window.location.pathname = "/docs/about" }} />
			<Route exact path="/introduction" render={props => <Introduction isLoaded={isLoaded} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/introduction/:key" render={props => <Introduction isLoaded={isLoaded} globalUrl={globalUrl} {...props} />} />
			<Route exact path="/" render={props => <LoginPage isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} {...props} />} />
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
