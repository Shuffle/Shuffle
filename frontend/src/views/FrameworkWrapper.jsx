import React, { useEffect, useState } from 'react';
import ReactDOM from "react-dom"

import AppFramework from "../components/AppFramework.jsx";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import { Link, useParams } from "react-router-dom";
import theme from '../theme.jsx';

import {
	Button,
} from "@mui/material";

const Framework = (props) => {
  const {globalUrl, isLoaded, isLoggedIn, showOptions, selectedOption, rolling, } = props;

  //const alert = useAlert()
  const [frameworkLoaded, setFrameworkLoaded] = useState(false)
  const [frameworkData, setFrameworkData] = useState()

  const getFramework = () => {
    fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for framework!");
        }

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson.success === false) {
					if (responseJson.reason !== undefined) {
						toast("Failed loading: " + responseJson.reason)
					} else {
						toast("Failed to load framework for your org.")
					}

					setFrameworkLoaded(true)
				} else {
					ReactDOM.unstable_batchedUpdates(() => {
						setFrameworkData(responseJson)
						setFrameworkLoaded(true)
					})
				}
			})
      .catch((error) => {
				setFrameworkLoaded(true)
        toast(error.toString());
      })
		}

  useEffect(() => {
		getFramework()
  }, [])

	return (
		<div>
			<div style={{marginBottom: 25, marginTop: 25, width: 300, margin: "auto", textAlign: "center",}}>
				<Link style={{textDecoration: "none", }} to="/getting-started">
					<Button variant="outlined" color="secondary">
						Back to getting started
					</Button>
				</Link>
			</div>
			{frameworkLoaded === true && isLoaded ? 
				<AppFramework
					frameworkData={frameworkData}
					selectedOption={"Draw"}
					showOptions={false}

					isLoaded={isLoaded}
					isLoggedIn={isLoggedIn}
					globalUrl={globalUrl}
				/>
			: null}
		</div>
	)
}

export default Framework;
