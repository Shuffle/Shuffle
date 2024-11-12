import React, { useState, useEffect } from "react";

import { Link, Route, Routes, BrowserRouter, useNavigate } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { removeCookies, useCookies } from "react-cookie";

import Workflows from "./views/Workflows";
import GettingStarted from "./views/GettingStarted";
import AngularWorkflow from "./views/AngularWorkflow.jsx";

import Header from "./components/NewHeader.jsx";
import HealthPage from "./components/HealthPage.jsx";

//import Header from "./components/Header.jsx";
import theme from "./theme";
import Apps from "./views/Apps";
import AppCreator from "./views/AppCreator";
import DetectionDashBoard from "./views/DetectionDashboard.jsx";

import Welcome from "./views/Welcome.jsx";
import Dashboard from "./views/Dashboard.jsx";
import DashboardView from "./views/DashboardViews.jsx";
import AdminSetup from "./views/AdminSetup";
import Admin from "./views/Admin";
import Docs from "./views/Docs.jsx";
//import Introduction from "./views/Introduction";
import SetAuthentication from "./views/SetAuthentication";
import SetAuthenticationSSO from "./views/SetAuthenticationSSO";
import Search from "./views/Search.jsx";
import RunWorkflow from "./views/RunWorkflow.jsx";

import LoginPage from "./views/LoginPage";
import SettingsPage from "./views/SettingsPage";
import KeepAlive from "./views/KeepAlive.jsx";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from '@mui/material/CssBaseline';

import UpdateAuthentication from "./views/UpdateAuthentication.jsx";
import FrameworkWrapper from "./views/FrameworkWrapper.jsx";
import ScrollToTop from "./components/ScrollToTop";
import AlertTemplate from "./components/AlertTemplate";
import { isMobile } from "react-device-detect";
import RuntimeDebugger from "./components/RuntimeDebugger.jsx"

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Drift from "react-driftjs";

import { AppContext } from './context/ContextApi.jsx';

// Production - backend proxy forwarding in nginx
var globalUrl = window.location.origin;

// CORS used for testing purposes. Should only happen with specific port and http
if (window.location.port === "3000") {
  globalUrl = "http://localhost:5001";
  //globalUrl = "http://localhost:5002"
}

// Development on Github Codespaces
if (globalUrl.includes("app.github.dev")) {
	globalUrl = globalUrl.replace("-3000.", "-5001.")
	globalUrl = globalUrl.replace("-3001.", "-5001.")
}

const App = (message, props) => {

  const [userdata, setUserData] = useState({});
  const [notifications, setNotifications] = useState([])
  const [cookies, setCookie, removeCookie] = useCookies([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dataset, setDataset] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [curpath, setCurpath] = useState(typeof window === "undefined" || window.location === undefined ? "" : window.location.pathname)


  useEffect(() => {
    if (dataset === false) {
      getUserNotifications();
      checkLogin();
      setDataset(true);
    }
  }, []);

  if (
    isLoaded &&
    !isLoggedIn &&
    !window.location.pathname.startsWith("/login") &&
    !window.location.pathname.startsWith("/docs") &&
    !window.location.pathname.startsWith("/support") &&
    !window.location.pathname.startsWith("/detectionframework") &&
    !window.location.pathname.startsWith("/appframework") &&
    !window.location.pathname.startsWith("/adminsetup") &&
    !window.location.pathname.startsWith("/usecases")
  ) {
    window.location = "/login";
  }

  const getUserNotifications = () => {
    fetch(`${globalUrl}/api/v1/users/notifications`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
			cors: "cors",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (
          responseJson.success === true &&
          responseJson.notifications !== null &&
          responseJson.notifications !== undefined &&
          responseJson.notifications.length > 0
        ) {
          //console.log("RESP: ", responseJson)
          setNotifications(responseJson.notifications);
        }
      })
      .catch((error) => {
        console.log("Failed getting notifications for user: ", error);
      });
  };

  const checkLogin = () => {
    var baseurl = globalUrl;
    fetch(`${globalUrl}/api/v1/getinfo`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        var userInfo = {};
        if (responseJson.success === true) {
          //console.log("USER: ", responseJson);

          userInfo = responseJson;
          setIsLoggedIn(true);
          //console.log("Cookies: ", cookies)
          // Updating cookie every request
          for (var key in responseJson["cookies"]) {
            setCookie(
              responseJson["cookies"][key].key,
              responseJson["cookies"][key].value,
              { path: "/" }
            );
          }
        }

        // Handling Ethereum update

        //console.log("USER: ", userInfo)
        setUserData(userInfo);
        setIsLoaded(true);
      })
      .catch((error) => {
        setIsLoaded(true);
      });
  };

  // Dumb for content load (per now), but good for making the site not suddenly reload parts (ajax thingies)


	const handleFirstInteraction = (event) => {
		console.log("First interaction: ", event)
	}

  const includedData =
      <div
        style={{
          backgroundColor: theme.palette.backgroundColor,
          color: "rgba(255, 255, 255, 0.65)",
          minHeight: "100vh",
        }}
      >
        <ScrollToTop
          getUserNotifications={getUserNotifications}
					curpath={curpath}
          setCurpath={setCurpath}
        />
		{!isLoaded ? null : 
			userdata.chat_disabled === true ? null : 
				<Drift 
					appId="zfk9i7w3yizf" 
					attributes={{
						name: userdata.username === undefined || userdata.username === null ? "OSS user" : `OSS ${userdata.username}`,
					}}
					eventHandlers={[
						{ 
							event: "conversation:firstInteraction", 
							function: handleFirstInteraction 
						},
					]}
				/>
		}

		<div style={{ minHeight: 68, maxHeight: 68, }}>
			{curpath.includes("/workflows") && curpath.includes("/run") ? 
				<div style={{ height: 60, }} />
				:
				<Header
					billingInfo={{}}

					notifications={notifications}
					setNotifications={setNotifications}
					checkLogin={checkLogin}
					cookies={cookies}
					removeCookie={removeCookie}
					isLoaded={isLoaded}
					globalUrl={globalUrl}
					setIsLoggedIn={setIsLoggedIn}
					isLoggedIn={isLoggedIn}
					userdata={userdata}

					curpath={curpath}
					serverside={false}
					isMobile={false}

					{...props}
				/>
			}
		</div>
		
				{/*
        <div style={{ height: 60 }} />
				*/}
				<Routes>
        	<Route
        	  exact
        	  path="/login"
        	  element={
        	    <LoginPage
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      checkLogin={checkLogin}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/admin"
        	  element={
        	    <Admin
        	      userdata={userdata}
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      checkLogin={checkLogin}
				  notifications={notifications}
        	      {...props}
        	    />
        	  }
        	/>
					<Route exact path="/search" element={<Search serverside={false} isLoaded={isLoaded} userdata={userdata} globalUrl={globalUrl} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor} {...props} /> } />
        	<Route
        	  exact
        	  path="/admin/:key"
        	  element={
        	    <Admin
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      {...props}
        	    />
        	  }
        	/>
			<Route
				exact
				path="/health"
				element={
					<HealthPage
						cookies={cookies}
						removeCookie={removeCookie}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						cookies={cookies}
						userdata={userdata}
						{...props}
					/>
				}
			/>
			<Route
				exact
				path="/status"
				element={
					<HealthPage
						cookies={cookies}
						removeCookie={removeCookie}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						cookies={cookies}
						userdata={userdata}
						{...props}
					/>
				}
			/>
        	{userdata.id !== undefined ? (
        	  <Route
        	    exact
        	    path="/settings"
        	    element={
        	      <SettingsPage
        	        isLoaded={isLoaded}
        	        setUserData={setUserData}
        	        userdata={userdata}
        	        globalUrl={globalUrl}
        	        {...props}
        	      />
        	    }
        	  />
        	) : null}
        	<Route
        	  exact
        	  path="/AdminSetup"
        	  element={
        	    <AdminSetup
        	      isLoaded={isLoaded}
        	      userdata={userdata}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/detectionframework"
        	  element={
        	    <FrameworkWrapper
								selectedOption={"Draw"}
								showOptions={false}

        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/app"
        	  element={
        	    <FrameworkWrapper
								selectedOption={"Draw"}
								showOptions={false}

        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/usecases"
        	  element={
        	    <Dashboard
				  userdata={userdata}
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/apps/new"
        	  element={
        	    <AppCreator
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
			<Route exact path="/apps/authentication" element={<UpdateAuthentication serverside={false} userdata={userdata} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} register={true} isLoaded={isLoaded} globalUrl={globalUrl} setCookie={setCookie} cookies={cookies} {...props} />} />
        	<Route
        	  exact
        	  path="/apps"
        	  element={
				<Apps
					isLoaded={isLoaded}
					isLoggedIn={isLoggedIn}
					globalUrl={globalUrl}
					userdata={userdata}
					{...props}
				/>
        	  }
        	/>
        	<Route
        	  exact
        	  path="/apps/edit/:appid"
        	  element={
        	    <AppCreator
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
			<Route
				exact
				path="/detections/sigma"
				element={<DetectionDashBoard globalUrl={globalUrl} />}
			/>
        	<Route
        	  exact
        	  path="/workflows"
        	  element={
        	    <Workflows
				  checkLogin={checkLogin}
        	      cookies={cookies}
        	      removeCookie={removeCookie}
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      cookies={cookies}
        	      userdata={userdata}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/getting-started"
        	  element={
        	    <GettingStarted
        	      cookies={cookies}
        	      removeCookie={removeCookie}
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      cookies={cookies}
        	      userdata={userdata}
        	      {...props}
        	    />
        	  }
        	/>
			<Route exact path="/debug" element={<RuntimeDebugger userdata={userdata} globalUrl={globalUrl} /> }  />
			<Route exact path="/workflows/debug" element={<RuntimeDebugger userdata={userdata} globalUrl={globalUrl} /> }  />
        	<Route
        	  exact
        	  path="/workflows/:key"
        	  element={
        	    <AngularWorkflow
								alert={alert}
        	      userdata={userdata}
        	      globalUrl={globalUrl}
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      {...props}
        	    />
        	  }
        	/>
			<Route exact path="/workflows/:key/run" element={<RunWorkflow  userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} /> } />
			<Route exact path="/workflows/:key/execute" element={<RunWorkflow  userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} /> } />
        	<Route
        	  exact
        	  path="/docs/:key"
        	  element={
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/docs"
        	  element={
							//navigate(`/docs/about`)
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/support"
        	  element={
							//navigate(`/docs/about`)
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/set_authentication"
        	  element={
        	    <SetAuthentication
        	      userdata={userdata}
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/login_sso"
        	  element={
        	    <SetAuthenticationSSO
        	      userdata={userdata}
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/keepalive"
        	  element={
        	    <KeepAlive
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/dashboards"
        	  element={
        	    <DashboardView
        	      isLoaded={isLoaded}
        	      isLoggedIn={isLoggedIn}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
			<Route
				exact
				path="/welcome"
				element={
					<Welcome
						cookies={cookies}
						removeCookie={removeCookie}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						cookies={cookies}
						userdata={userdata}
				  		checkLogin={checkLogin}
						{...props}
					/>
				}
			/>
        	<Route
        	  exact
        	  path="/"
        	  element={
        	    <LoginPage
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={true}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      setCookie={setCookie}
        	      cookies={cookies}
        	      {...props}
        	    />
        	  }
        	/>
				</Routes>
      </div>

  return (
	<AppContext>
		<ThemeProvider theme={theme}>
		  <CssBaseline />
		  <CookiesProvider>
			<BrowserRouter>
			  {includedData}
			</BrowserRouter>
			<ToastContainer 
				position="bottom-center"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="dark"
			/>
		  </CookiesProvider>
		</ThemeProvider>
	  </AppContext>
  );
};

export default App;
