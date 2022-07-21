import React, { useState, useEffect } from 'react';
import WelcomeForm from "../components/WelcomeForm.jsx";
import DetectionFramework from "../components/DetectionFramework.jsx";
import { 
	Grid, 
	Container,
  Fade,
} from '@mui/material';
import theme from '../theme';
import { useNavigate, Link } from "react-router-dom";

// Should be different if logged in :|
const Welcome = (props) => {
    const { globalUrl, surfaceColor, newColor, mini, inputColor, userdata, isLoggedIn, isLoaded } = props;
    const [inputUsecase, setInputUsecase] = useState({});
  	const [frameworkData, setFrameworkData] = useState(undefined);
  	const [discoveryWrapper, setDiscoveryWrapper] = useState(undefined);

		let navigate = useNavigate();

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
					setFrameworkData({})
					if (responseJson.reason !== undefined) {
						//alert.error("Failed loading: " + responseJson.reason)
					} else {
						//alert.error("Failed to load framework for your org.")
					}
				} else {
					setFrameworkData(responseJson)
				}
			})
			.catch((error) => {
				console.log("err in framework: ", error.toString());
			})
		}

		useEffect(() => {
			getFramework() 
		}, []);

    return (
        <Grid container spacing={2} style={{ padding: 70, maxWidth: 1366, minWidth: 1366, margin: "auto", }}>
            <Grid item xs={6}>
							<div>
									<WelcomeForm 
										userdata={userdata}
										globalUrl={globalUrl}
										discoveryWrapper={discoveryWrapper}
										setDiscoveryWrapper={setDiscoveryWrapper}
									/>
							</div>
            </Grid>
						{frameworkData === undefined || window.location.href.includes("tab=3") ? null :
							<Fade>
								<DetectionFramework
										inputUsecase={inputUsecase}
										frameworkData={frameworkData}
										selectedOption={"Draw"}
										showOptions={false}
										isLoaded={true}
										isLoggedIn={true}
										globalUrl={globalUrl}
										size={0.8}
										color={theme.palette.platformColor}
										discoveryWrapper={discoveryWrapper}
										setDiscoveryWrapper={setDiscoveryWrapper}
								/>
							</Fade>
						}
				</Grid>
    )
}

export default Welcome; 
