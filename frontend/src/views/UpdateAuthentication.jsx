import React, { useState, useEffect } from "react";

import ReactGA from "react-ga4";
import { 
	Typography, 
	CircularProgress,
	Button,
} from "@mui/material";
import theme from '../theme.jsx';
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 

import AuthenticationOauth2 from "../components/Oauth2Auth.jsx";
import AuthenticationWindow from "../components/AuthenticationWindow.jsx";
import { base64_decode, appCategories } from "../views/AppCreator.jsx";

const SetAuthentication = (props) => {
  const { globalUrl, serverside } = props;

  const [app, setApp] = useState({});
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [loadFail, setLoadFail] = useState("");
  const [appAuthentication, setAppAuthentication] = React.useState([]);

  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
  //const alert = useAlert();

  const parseIncomingOpenapiData = (data) => {
    	if (data.app === undefined || data.app === null) {
			return 
		} 

		// Should basically always be true if openapi exists too
		var parsedBaseapp = ""
		try { 
			parsedBaseapp = base64_decode(data.app)
		} catch (e) {
			console.log("Failed JSON parsing: ", e)
			parsedBaseapp = data
		}

		var parsedapp = JSON.parse(parsedBaseapp)
		parsedapp.name = parsedapp.name.replaceAll("_", " ");
		setApp(parsedapp);

		document.title = parsedapp.name + " App Auth";

	}

  console.log("App: ", app)

  const getApp = (appid) => {
    if (serverside === true) {
      return;
    }

    fetch(`${globalUrl}/api/v1/apps/${appid}/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
			if (isCloud) {
				ReactGA.event({
					category: "appauth",
					action: `app_not_found`,
					label: appid,
				});
			}
        } else {
			if (isCloud) {
				ReactGA.event({
					category: "appauth",
					action: `app_found`,
					label: appid,
				});
			}
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false || responseJson.success === undefined) {
          toast("Failed to get the app. Does it exist?")
          setIsAppLoaded(true)
          return;
        }
          
				parseIncomingOpenapiData(responseJson);
      })
      .catch((error) => {
        toast("Error in app fetch: " + error.toString());
      });
  };

	useEffect(() => {
		// Find the ID for the app from the "app_id" query
		const urlParams = new URLSearchParams(window.location.search);
		const appid = urlParams.get("app_id");
		if (appid === null) {
			setLoadFail(
				<span>
					<Typography variant="h4">
						Failed to load the app. Please contact your provider or support@shuffler.io if this persists
					</Typography>
					<Button 
						variant="contained"
						color="primary"
						onClick={() => window.location.reload()}
					>
						Reload Window
					</Button>
				</span>
			)
		} else {
			getApp(appid);
		}
	}, []);

	// Handle:
	// 1. Check for org_id, authentication, and app keys in queries
	// 2. Load the app auth info from the orgs' apps 
	// 3. Help them set info for the app
	// Make sure to test both private and public apps

	const appname = app.name !== undefined ? app.name : "";
	
	return (
		<div style={{width: 1000, margin: "auto", marginTop: 50, }}>
			{loadFail !== "" ? 
				loadFail
				:
				<div>
					<Typography variant="h4" style={{marginBottom: 20,}}>
						Configure {appname} Authentication
					</Typography> 
					{app.authentication === undefined || app.authentication === null || app.authentication.length === 0 ?
						null 
						:
						app.authentication.type === "oauth2" ? 
							<AuthenticationOauth2
								selectedApp={app}
								selectedAction={{
									"app_name": app.name,
									"app_id": app.id,
									"app_version": app.version,
									"large_image": app.large_image,
								}}
								authenticationType={app.authentication}
								isCloud={true}
								authButtonOnly={true}
								getAppAuthentication={undefined}
							/>
							:
							<AuthenticationWindow
								globalUrl={globalUrl}
								selectedApp={app}
								authFieldsOnly={true}
								getAppAuthentication={undefined}
								appAuthentication={appAuthentication}
							/>
					}
				</div>
			}
		</div>
	)
};

export default SetAuthentication;
