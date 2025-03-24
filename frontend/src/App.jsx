import React, { useState, useEffect } from "react";

import { Link, Route, Routes, BrowserRouter, useNavigate } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { removeCookies, useCookies } from "react-cookie";

import Workflows from "./views/Workflows.jsx";
import GettingStarted from "./views/GettingStarted.jsx";
import AngularWorkflow from "./views/AngularWorkflow.jsx";

import Header from "./components/NewHeader.jsx";
import HealthPage from "./components/HealthPage.jsx";

//import Header from "./components/Header.jsx";
import theme from "./theme.jsx";
import Apps from "./views/Apps.jsx";
import Apps2 from "./views/Apps2.jsx";
import AppCreator from "./views/AppCreator.jsx";
import DetectionDashBoard from "./views/DetectionDashboard.jsx";

import Welcome from "./views/Welcome.jsx";
import Dashboard from "./views/Dashboard.jsx";
import DashboardView from "./views/DashboardViews.jsx";
import AdminSetup from "./views/AdminSetup.jsx";
import Admin from "./views/Admin.jsx";
import Docs from "./views/Docs.jsx";
import Usecases2 from "./views/Usecases2.jsx";
import DashboardViews from "./views/DashboardViews.jsx";
//import Introduction from "./views/Introduction";
import SetAuthentication from "./views/SetAuthentication.jsx";
import SetAuthenticationSSO from "./views/SetAuthenticationSSO.jsx";
import Search from "./views/Search.jsx";
import RunWorkflow from "./views/RunWorkflow.jsx";
import Admin2 from "./views/Admin2.jsx";

import LoginPage from "./views/LoginPage.jsx";
import LoginPageOld from "./views/LoginPageOld.jsx";

import SettingsPage from "./views/SettingsPage.jsx";
import KeepAlive from "./views/KeepAlive.jsx";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from '@mui/material/CssBaseline';

import UpdateAuthentication from "./views/UpdateAuthentication.jsx";
import FrameworkWrapper from "./views/FrameworkWrapper.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import AlertTemplate from "./components/AlertTemplate.js";
import { isMobile } from "react-device-detect";
import RuntimeDebugger from "./components/RuntimeDebugger.jsx"

import MFASetUp from './components/MFASetUP.jsx';
import ApiExplorerWrapper from './views/ApiExplorerWrapper.jsx';
import LeftSideBar from './components/LeftSideBar.jsx';
import CodeWorkflow from './views/CodeWorkflow.jsx';
import NotFound from './views/404.jsx';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Drift from "react-driftjs";

import { AppContext } from './context/ContextApi.jsx';
import Navbar from "./components/Navbar.jsx";
import Workflows2 from "./views/Workflows2.jsx";
import AppExplorer from "./views/AppExplorer.jsx";

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
		className='parent-component'
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

		
					{ window?.location?.pathname === "/"  || window?.location?.pathname === "/training" || !(isLoggedIn && isLoaded) ? (
						<div style={{ minHeight: 68, maxHeight: 68 }}>
						{/* <Header
						notifications={notifications}
						setNotifications={setNotifications}
						userdata={userdata}
						cookies={cookies}
						removeCookie={removeCookie}
						isLoaded={isLoaded}
						globalUrl={globalUrl}
						setIsLoggedIn={setIsLoggedIn}
						isLoggedIn={isLoggedIn}
						curpath={curpath}
						{...props}
						/> */}
						<Navbar
						notifications={notifications}
						setNotifications={setNotifications}
						userdata={userdata}
						cookies={cookies}
						removeCookie={removeCookie}
						isLoaded={isLoaded}
						globalUrl={globalUrl}
						setIsLoggedIn={setIsLoggedIn}
						isLoggedIn={isLoggedIn}
						curpath={curpath}
						{...props}
						/>
					</div>
					) : (
						<div style={{ position: 'fixed', top: 32, left: 10, zIndex: 100000 }}>
						  <LeftSideBar checkLogin={checkLogin} userdata={userdata} globalUrl={globalUrl} notifications={notifications} />
						</div>
					) }
		
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
        	      register={false}
        	      inregister={false}
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
        	  path="/login2"
        	  element={
        	    <LoginPageOld
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={false}
        	      inregister={false}
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
        	  path="/loginsetup"
        	  element={
        	    <LoginPageOld
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      register={false}
        	      inregister={false}
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
        	  path="/register"
        	  element={
        	    <LoginPage
        	      isLoggedIn={isLoggedIn}
        	      setIsLoggedIn={setIsLoggedIn}
        	      inregister={true}
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
        	  path="/admin2"
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
			<Route
					exact
					path="/admin"
					element={
						<Admin2
							cookies={cookies}
							removeCookie={removeCookie}
							isLoaded={isLoaded}
							isLoggedIn={isLoggedIn}
							notifications={notifications}
							setNotifications={setNotifications}
							globalUrl={globalUrl}
							checkLogin={checkLogin}
							userdata={userdata}
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
				  userdata={userdata}
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
        	  path="/usecases2"
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
        	  path="/usecases"
        	  element={
        	    <Usecases2
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
        	  path="/apps2"
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
        	  path="/apps"
        	  element={
				<Apps2
					serverside={false} 
					isLoaded={isLoaded} 
					isLoggedIn={isLoggedIn}
					checkLogin={checkLogin}
					userdata={userdata} 
					globalUrl={globalUrl} 
					surfaceColor={theme.palette.surfaceColor} 
					inputColor={theme.palette.inputColor} 
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
			<Route exact path="/apps/:appid" element={<AppExplorer userdata={userdata} isLoggedIn={isLoggedIn} isLoaded={isLoaded}  globalUrl={globalUrl} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor} checkLogin={checkLogin} {...props} />} />
			<Route exact path="/apis/:appid" element={<ApiExplorerWrapper serverside={false} userdata={userdata} isLoggedIn={isLoggedIn} isMobile={false} selectedApp={undefined} isLoaded={isLoaded}globalUrl={globalUrl} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor} checkLogin={checkLogin} {...props} />} />
			<Route
				exact
				path="/detections/sigma"
				element={<DetectionDashBoard globalUrl={globalUrl} />}
			/>
        	<Route
        	  exact
        	  path="/workflows2"
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
        	  path="/workflows"
        	  element={
        	    <Workflows2
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
			<Route exact path="/workflows/:key/code" element={<CodeWorkflow serverside={false} userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} />} />
			<Route exact path="/workflows/:key/run" element={<RunWorkflow  userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} /> } />
			<Route exact path="/workflows/:key/execute" element={<RunWorkflow  userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} /> } />

			<Route exact path="/forms" element={<RunWorkflow serverside={false} userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} />} />
			<Route exact path="/forms/:key/run" element={<RunWorkflow serverside={false} userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} />} />
			<Route exact path="/forms/:key" element={<RunWorkflow serverside={false} userdata={userdata} globalUrl={globalUrl} isLoaded={isLoaded} isLoggedIn={isLoggedIn} surfaceColor={theme.palette.surfaceColor} inputColor={theme.palette.inputColor}{...props} />} />

        	<Route
        	  exact
        	  path="/legal/:key"
        	  element={
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
				  isLoggedIn={isLoggedIn}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/legal"
        	  element={
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
				  isLoggedIn={isLoggedIn}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/docs/:key"
        	  element={
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
				  isLoggedIn={isLoggedIn}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/docs"
        	  element={
        	    <Docs
        	      isMobile={isMobile}
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
				  isLoggedIn={isLoggedIn}
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
			<Route exact path="/login/:key/mfa-setup" element={<MFASetUp setCookie={setCookie} serverside={false} mainColor={theme.palette.backgroundColor} userdata={userdata} stripeKey={undefined} globalUrl={globalUrl} inputColor={theme.palette.inputColor} isLoaded={isLoaded} {...props} />} />
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
				path="/dashboard"
				element={
					<DashboardViews
						serverside={false}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						wut={userdata}
					/>
				}
			/>
			<Route
				exact
				path="/dashboards"
				element={
					<DashboardViews
						serverside={false}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						wut={userdata}
					/>
				}
			/>
			<Route
				exact
				path="/dashboard/:key"
				element={
					<DashboardViews
						serverside={false}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						wut={userdata}
					/>
				}
			/>
			<Route
				exact
				path="/dashboards/:key"
				element={
					<DashboardViews
						serverside={false}
						isLoaded={isLoaded}
						isLoggedIn={isLoggedIn}
						globalUrl={globalUrl}
						wut={userdata}
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

			<Route
				exact
				path="/*"
				element={
					<NotFound />
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
