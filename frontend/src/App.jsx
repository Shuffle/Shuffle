import React, { useState, useEffect } from "react";

//import { Route, Routes } from "react-router";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { removeCookies, useCookies } from "react-cookie";

import Workflows from "./views/Workflows";
import GettingStarted from "./views/GettingStarted";
import EditWebhook from "./views/EditWebhook";
import AngularWorkflow from "./views/AngularWorkflow";

import Header from "./components/Header";
import theme from "./theme";
import Apps from "./views/Apps";
import AppCreator from "./views/AppCreator";

import Dashboard from "./views/Dashboard.jsx";
import AdminSetup from "./views/AdminSetup";
import Admin from "./views/Admin";
import Docs from "./views/Docs";
import Introduction from "./views/Introduction";
import SetAuthentication from "./views/SetAuthentication";
import SetAuthenticationSSO from "./views/SetAuthenticationSSO";

import LandingPageNew from "./views/LandingpageNew";
import LoginPage from "./views/LoginPage";
import SettingsPage from "./views/SettingsPage";
import KeepAlive from "./views/KeepAlive.jsx";

import MyView from "./views/MyView";

import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";

import FrameworkWrapper from "./views/FrameworkWrapper.jsx";
import ScrollToTop from "./components/ScrollToTop";
import AlertTemplate from "./components/AlertTemplate";
import { useAlert, positions, Provider } from "react-alert";
import { isMobile } from "react-device-detect";

import detectEthereumProvider from "@metamask/detect-provider";
import Drift from "react-driftjs";

// Production - backend proxy forwarding in nginx
var globalUrl = window.location.origin;

// CORS used for testing purposes. Should only happen with specific port and http
if (window.location.port === "3000") {
  globalUrl = "http://localhost:5001";
  //globalUrl = "http://localhost:5002"
}

if (globalUrl.includes("githubpreview.dev")) {
	//globalUrl = globalUrl.replace("3000", "5001")
	globalUrl = "https://frikky-shuffle-5gvr4xx62w64-5001.githubpreview.dev"
}
console.log("global: ", globalUrl)

const App = (message, props) => {

  const [userdata, setUserData] = useState({});
  const [notifications, setNotifications] = useState([])
  const [cookies, setCookie, removeCookie] = useCookies([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dataset, setDataset] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [curpath, setCurpath] = useState(
    typeof window === "undefined" || window.location === undefined
      ? ""
      : window.location.pathname
  )


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
          console.log(responseJson);

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
				{/*
        detectEthereumProvider().then((provider) => {
          if (
            provider &&
            userInfo.eth_info !== undefined &&
            userInfo.eth_info !== null
          ) {
            if (
              userInfo.eth_info.account !== undefined &&
              userInfo.eth_info.account !== null &&
              userInfo.eth_info.account.length === 0
            ) {
              userInfo.eth_info = {};
              var method = "eth_requestAccounts";
              var params = [];
              provider
                .request({
                  method: method,
                  params,
                })
                .then((result) => {
                  if (
                    result !== undefined &&
                    result !== null &&
                    result.length > 0
                  ) {
                    userInfo.eth_info.account = result[0];

                    // Getting and setting balance for the current user
                    method = "eth_getBalance";
                    params = [userInfo.eth_info.account, "latest"];
                    provider
                      .request({
                        method: method,
                        params,
                      })
                      .then((result) => {
                        if (
                          result !== undefined &&
                          result !== null &&
                          result.length > 0
                        ) {
                          userInfo.parsed_balance =
                            result / 1000000000000000000;
                        } else {
                          alert.error("Couldn't find balance: ", result);
                        }
                        // The result varies by RPC method.
                        // For example, this method will return a transaction hash hexadecimal string on success.
                      })
                      .catch((error) => {
                        // If the request fails, the Promise will reject with an error.
                        alert.error(
                          "Failed getting info from ethereum API: " + error
                        );
                      });
                  } else {
                    alert.error("Couldn't find any user: ", result);
                  }
                })
                .catch((error) => {
                  // If the request fails, the Promise will reject with an error.
                  alert.error(
                    "Failed getting info from ethereum API: " + error
                  );
                });
            }

            // Register hooks here
            provider.on("message", (event) => {
              alert.info("Message from MetaMask: ", event);
            });

            provider.on("chainChanged", (chainId) => {
              console.log("Changed chain to: ", chainId);

              method = "eth_getBalance";
              params = [userInfo.eth_info.account, "latest"];
              provider
                .request({
                  method: method,
                  params,
                })
                .then((result) => {
                  console.log("Got result: ", result);
                  if (result !== undefined && result !== null) {
                    userInfo.eth_info.balance = result;
                    userInfo.eth_info.parsed_balance =
                      result / 1000000000000000000;
                    console.log("INFO: ", userInfo);
                    setUserData(userInfo);
                  } else {
                    alert.error("Couldn't find balance: ", result);
                  }
                })
                .catch((error) => {
                  // If the request fails, the Promise will reject with an error.
                  alert.error(
                    "Failed getting info from ethereum API: " + error
                  );
                });
            });
          }
        });

        if (
          userInfo.eth_info !== undefined &&
          userInfo.eth_info.balance !== undefined
        ) {
          //console.log(userInfo.eth_info.balance)
          userInfo.eth_info.parsed_balance =
            userInfo.eth_info.balance / 1000000000000000000;
        }
				*/}

        //console.log("USER: ", userInfo)
        setUserData(userInfo);
        setIsLoaded(true);
      })
      .catch((error) => {
        setIsLoaded(true);
      });
  };

  // Dumb for content load (per now), but good for making the site not suddenly reload parts (ajax thingies)

  const options = {
    timeout: 9000,
    position: positions.BOTTOM_LEFT,
  };

	const handleFirstInteraction = (event) => {
		console.log("First interaction: ", event)
	}

  const includedData =
    window.location.pathname === "/home" ||
    window.location.pathname === "/features" ? (
      <div>
				<Routes>
					<Route
						exact
						path="/home"
						render={(props) => <LandingPageNew isLoaded={isLoaded} {...props} />}
					/>
				</Routes>
      </div>
    ) : (
      <div
        style={{
          backgroundColor: "#1F2023",
          color: "rgba(255, 255, 255, 0.65)",
          minHeight: "100vh",
        }}
      >
        <ScrollToTop
          getUserNotifications={getUserNotifications}
          setCurpath={setCurpath}
        />
				{!isLoaded ? null : 
					userdata.chat_disabled === true ? null : 
						<Drift 
							appId="zfk9i7w3yizf" 
							attributes={{
								name: userdata.username === undefined || userdata.username === null ? "OSS user" : `${userdata.username} - OSS`,
							}}
							eventHandlers={[
								{ 
									event: "conversation:firstInteraction", 
									function: handleFirstInteraction 
								},
							]}
						/>
					
				}
        <Header
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
          {...props}
        />
        <div style={{ height: 60 }} />
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
        	      {...props}
        	    />
        	  }
        	/>
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
        	  path="/workflows"
        	  element={
        	    <Workflows
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
        	  path="/introduction"
        	  element={
        	    <Introduction
        	      isLoaded={isLoaded}
        	      globalUrl={globalUrl}
        	      {...props}
        	    />
        	  }
        	/>
        	<Route
        	  exact
        	  path="/introduction/:key"
        	  element={
        	    <Introduction
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
    );

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
