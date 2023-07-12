import React, { useState, useEffect } from 'react';
import {isMobile} from "react-device-detect";
import AppFramework, { usecases } from "../components/AppFramework.jsx";
import {Link} from 'react-router-dom';
import ReactGA from 'react-ga4';

import { Button, LinearProgress, Typography } from '@mui/material';

export const securityFramework = [
		{
			image: <path d="M15.6408 8.39233H18.0922V10.0287H15.6408V8.39233ZM0.115234 8.39233H2.56663V10.0287H0.115234V8.39233ZM9.92083 0.21051V2.66506H8.28656V0.21051H9.92083ZM3.31839 2.25596L5.05889 4.00687L3.89856 5.16051L2.15807 3.42596L3.31839 2.25596ZM13.1485 3.99869L14.8808 2.25596L16.0493 3.42596L14.3088 5.16051L13.1485 3.99869ZM9.10369 4.30142C10.404 4.30142 11.651 4.81863 12.5705 5.73926C13.4899 6.65989 14.0065 7.90854 14.0065 9.21051C14.0065 11.0269 13.0178 12.6141 11.5551 13.4651V14.9378C11.5551 15.1548 11.469 15.3629 11.3158 15.5163C11.1625 15.6698 10.9547 15.756 10.738 15.756H7.46943C7.25271 15.756 7.04487 15.6698 6.89163 15.5163C6.73839 15.3629 6.6523 15.1548 6.6523 14.9378V13.4651C5.18963 12.6141 4.2009 11.0269 4.2009 9.21051C4.2009 7.90854 4.71744 6.65989 5.63689 5.73926C6.55635 4.81863 7.80339 4.30142 9.10369 4.30142ZM10.738 16.5741V17.3923C10.738 17.6093 10.6519 17.8174 10.4986 17.9709C10.3454 18.1243 10.1375 18.2105 9.92083 18.2105H8.28656C8.06984 18.2105 7.862 18.1243 7.70876 17.9709C7.55552 17.8174 7.46943 17.6093 7.46943 17.3923V16.5741H10.738ZM8.28656 14.1196H9.92083V12.3769C11.3345 12.0169 12.3722 10.7323 12.3722 9.21051C12.3722 8.34253 12.0279 7.5101 11.4149 6.89634C10.8019 6.28259 9.97056 5.93778 9.10369 5.93778C8.23683 5.93778 7.40546 6.28259 6.79249 6.89634C6.17953 7.5101 5.83516 8.34253 5.83516 9.21051C5.83516 10.7323 6.87292 12.0169 8.28656 12.3769V14.1196Z" />,
			text: "Cases",
			description: "Case management"
		}, 
		{
			image: 
			<path d="M6.93767 0C8.71083 0 10.4114 0.704386 11.6652 1.9582C12.919 3.21202 13.6234 4.91255 13.6234 6.68571C13.6234 8.34171 13.0165 9.864 12.0188 11.0366L12.2965 11.3143H13.1091L18.252 16.4571L16.7091 18L11.5662 12.8571V12.0446L11.2885 11.7669C10.116 12.7646 8.59367 13.3714 6.93767 13.3714C5.16451 13.3714 3.46397 12.667 2.21015 11.4132C0.956339 10.1594 0.251953 8.45888 0.251953 6.68571C0.251953 4.91255 0.956339 3.21202 2.21015 1.9582C3.46397 0.704386 5.16451 0 6.93767 0ZM6.93767 2.05714C4.36624 2.05714 2.3091 4.11429 2.3091 6.68571C2.3091 9.25714 4.36624 11.3143 6.93767 11.3143C9.5091 11.3143 11.5662 9.25714 11.5662 6.68571C11.5662 4.11429 9.5091 2.05714 6.93767 2.05714Z" />,
			text: "SIEM",
			description: "Case management"
		}, 
		{
			image: 
			<path d="M11.223 10.971L3.85195 14.4L7.28095 7.029L14.652 3.6L11.223 10.971ZM9.25195 0C8.07006 0 6.89973 0.232792 5.8078 0.685084C4.71587 1.13738 3.72372 1.80031 2.88799 2.63604C1.20016 4.32387 0.251953 6.61305 0.251953 9C0.251953 11.3869 1.20016 13.6761 2.88799 15.364C3.72372 16.1997 4.71587 16.8626 5.8078 17.3149C6.89973 17.7672 8.07006 18 9.25195 18C11.6389 18 13.9281 17.0518 15.6159 15.364C17.3037 13.6761 18.252 11.3869 18.252 9C18.252 7.8181 18.0192 6.64778 17.5669 5.55585C17.1146 4.46392 16.4516 3.47177 15.6159 2.63604C14.7802 1.80031 13.788 1.13738 12.6961 0.685084C11.6042 0.232792 10.4338 0 9.25195 0ZM9.25195 8.01C8.98939 8.01 8.73758 8.1143 8.55192 8.29996C8.36626 8.48563 8.26195 8.73744 8.26195 9C8.26195 9.26256 8.36626 9.51437 8.55192 9.70004C8.73758 9.8857 8.98939 9.99 9.25195 9.99C9.51452 9.99 9.76633 9.8857 9.95199 9.70004C10.1376 9.51437 10.242 9.26256 10.242 9C10.242 8.73744 10.1376 8.48563 9.95199 8.29996C9.76633 8.1143 9.51452 8.01 9.25195 8.01Z" />,
			text: "Assets",
			description: "Case management"
		}, 
		{
			image: 
			<path d="M13.3318 2.223C13.2598 2.223 13.1878 2.205 13.1248 2.169C11.3968 1.278 9.90284 0.9 8.11184 0.9C6.32984 0.9 4.63784 1.323 3.09884 2.169C2.88284 2.286 2.61284 2.205 2.48684 1.989C2.36984 1.773 2.45084 1.494 2.66684 1.377C4.34084 0.468 6.17684 0 8.11184 0C10.0288 0 11.7028 0.423 13.5388 1.368C13.7638 1.485 13.8448 1.755 13.7278 1.971C13.6468 2.133 13.4938 2.223 13.3318 2.223ZM0.452843 6.948C0.362843 6.948 0.272843 6.921 0.191843 6.867C-0.015157 6.723 -0.0601571 6.444 0.0838429 6.237C0.974843 4.977 2.10884 3.987 3.45884 3.294C6.28484 1.836 9.90284 1.827 12.7378 3.285C14.0878 3.978 15.2218 4.959 16.1128 6.21C16.2568 6.408 16.2118 6.696 16.0048 6.84C15.7978 6.984 15.5188 6.939 15.3748 6.732C14.5648 5.598 13.5388 4.707 12.3238 4.086C9.74084 2.763 6.43784 2.763 3.86384 4.095C2.63984 4.725 1.61384 5.625 0.803843 6.759C0.731843 6.885 0.596843 6.948 0.452843 6.948ZM6.07784 17.811C5.96084 17.811 5.84384 17.766 5.76284 17.676C4.97984 16.893 4.55684 16.389 3.95384 15.3C3.33284 14.193 3.00884 12.843 3.00884 11.394C3.00884 8.721 5.29484 6.543 8.10284 6.543C10.9108 6.543 13.1968 8.721 13.1968 11.394C13.1968 11.646 12.9988 11.844 12.7468 11.844C12.4948 11.844 12.2968 11.646 12.2968 11.394C12.2968 9.216 10.4158 7.443 8.10284 7.443C5.78984 7.443 3.90884 9.216 3.90884 11.394C3.90884 12.69 4.19684 13.887 4.74584 14.859C5.32184 15.894 5.71784 16.335 6.41084 17.037C6.58184 17.217 6.58184 17.496 6.41084 17.676C6.31184 17.766 6.19484 17.811 6.07784 17.811ZM12.5308 16.146C11.4598 16.146 10.5148 15.876 9.74084 15.345C8.39984 14.436 7.59884 12.96 7.59884 11.394C7.59884 11.142 7.79684 10.944 8.04884 10.944C8.30084 10.944 8.49884 11.142 8.49884 11.394C8.49884 12.663 9.14684 13.86 10.2448 14.598C10.8838 15.03 11.6308 15.237 12.5308 15.237C12.7468 15.237 13.1068 15.21 13.4668 15.147C13.7098 15.102 13.9438 15.264 13.9888 15.516C14.0338 15.759 13.8718 15.993 13.6198 16.038C13.1068 16.137 12.6568 16.146 12.5308 16.146ZM10.7218 18C10.6858 18 10.6408 17.991 10.6048 17.982C9.17384 17.586 8.23784 17.055 7.25684 16.092C5.99684 14.841 5.30384 13.176 5.30384 11.394C5.30384 9.936 6.54584 8.748 8.07584 8.748C9.60584 8.748 10.8478 9.936 10.8478 11.394C10.8478 12.357 11.6848 13.14 12.7198 13.14C13.7548 13.14 14.5918 12.357 14.5918 11.394C14.5918 8.001 11.6668 5.247 8.06684 5.247C5.51084 5.247 3.17084 6.669 2.11784 8.874C1.76684 9.603 1.58684 10.458 1.58684 11.394C1.58684 12.096 1.64984 13.203 2.18984 14.643C2.27984 14.877 2.16284 15.138 1.92884 15.219C1.69484 15.309 1.43384 15.183 1.35284 14.958C0.911843 13.779 0.695843 12.609 0.695843 11.394C0.695843 10.314 0.902843 9.333 1.30784 8.478C2.50484 5.967 5.15984 4.338 8.06684 4.338C12.1618 4.338 15.4918 7.497 15.4918 11.385C15.4918 12.843 14.2498 14.031 12.7198 14.031C11.1898 14.031 9.94784 12.843 9.94784 11.385C9.94784 10.422 9.11084 9.639 8.07584 9.639C7.04084 9.639 6.20384 10.422 6.20384 11.385C6.20384 12.924 6.79784 14.364 7.88684 15.444C8.74184 16.29 9.56084 16.758 10.8298 17.109C11.0728 17.172 11.2078 17.424 11.1448 17.658C11.0998 17.865 10.9108 18 10.7218 18Z" />,
			text: "IAM",
			description: "Case management"
		}, 
		{
			image:  <path d="M16.1091 8.57143H14.8234V5.14286C14.8234 4.19143 14.052 3.42857 13.1091 3.42857H9.68052V2.14286C9.68052 1.57454 9.45476 1.02949 9.0529 0.627628C8.65103 0.225765 8.10599 0 7.53767 0C6.96935 0 6.4243 0.225765 6.02244 0.627628C5.62057 1.02949 5.39481 1.57454 5.39481 2.14286V3.42857H1.96624C1.51158 3.42857 1.07555 3.60918 0.754056 3.93067C0.432565 4.25216 0.251953 4.6882 0.251953 5.14286V8.4H1.53767C2.82338 8.4 3.85195 9.42857 3.85195 10.7143C3.85195 12 2.82338 13.0286 1.53767 13.0286H0.251953V16.2857C0.251953 16.7404 0.432565 17.1764 0.754056 17.4979C1.07555 17.8194 1.51158 18 1.96624 18H5.22338V16.7143C5.22338 15.4286 6.25195 14.4 7.53767 14.4C8.82338 14.4 9.85195 15.4286 9.85195 16.7143V18H13.1091C13.5638 18 13.9998 17.8194 14.3213 17.4979C14.6428 17.1764 14.8234 16.7404 14.8234 16.2857V12.8571H16.1091C16.6774 12.8571 17.2225 12.6314 17.6243 12.2295C18.0262 11.8277 18.252 11.2826 18.252 10.7143C18.252 10.146 18.0262 9.60092 17.6243 9.19906C17.2225 8.79719 16.6774 8.57143 16.1091 8.57143Z" />,
			text: "Intel",
			description: "Case management"
		}, 
		{
			image: 
			<path d="M9.89516 7.71433H8.60945V5.1429H9.89516V7.71433ZM9.89516 10.2858H8.60945V9.00004H9.89516V10.2858ZM14.3952 2.57147H4.10944C3.76845 2.57147 3.44143 2.70693 3.20031 2.94805C2.95919 3.18917 2.82373 3.51619 2.82373 3.85719V15.4286L5.39516 12.8572H14.3952C14.7362 12.8572 15.0632 12.7217 15.3043 12.4806C15.5454 12.2395 15.6809 11.9125 15.6809 11.5715V3.85719C15.6809 3.14361 15.1023 2.57147 14.3952 2.57147Z" />,
			text: "Comms",
			description: "Case management"
		}, 
		{
			image: 
			<path d="M0.251953 10.6011H3.8391L9.38052 -4.92572e-08L10.8977 11.5696L15.0377 6.28838L19.3191 10.6011H23.3948V13.1836H18.252L15.2562 10.175L9.1491 18L7.88909 8.41894L5.39481 13.1836H0.251953V10.6011Z" />,
			text: "Network",
			description: "Case management"
		}, 
		{
			image:
			<path d="M19.1722 8.9957L17.0737 6.60487L17.3661 3.44004L14.2615 2.73483L12.6361 -3.28068e-08L9.71206 1.25561L6.78803 -3.28068e-08L5.16261 2.73483L2.05797 3.43144L2.35038 6.59627L0.251953 8.9957L2.35038 11.3865L2.05797 14.56L5.16261 15.2652L6.78803 18L9.71206 16.7358L12.6361 17.9914L14.2615 15.2566L17.3661 14.5514L17.0737 11.3865L19.1722 8.9957ZM10.5721 13.2957H8.85205V11.5757H10.5721V13.2957ZM10.5721 9.85571H8.85205V4.69565H10.5721V9.85571Z" />,
			text: "EDR & AV",
			description: "Case management"
		}, 
]

const LandingpageUsecases = (props) => {
	const [selectedUsecase, setSelectedUsecase] = useState("Phishing")
	const usecasekeys = usecases === undefined || usecases === null ? [] : Object.keys(usecases)
	const buttonBackground = "linear-gradient(to right, #f86a3e, #f34079)"
	const buttonStyle = {borderRadius: 25, height: 50, width: 260, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18, backgroundImage: buttonBackground}

	const HandleTitle = (props) => {
		const { usecases, selectedUsecase, setSelecedUsecase } = props
		const [progress, setProgress] = useState(0)

  	useEffect(() => {
			const timer = setInterval(() => {
				setProgress((oldProgress) => {
					if (oldProgress >= 105) {
						const foundIndex = usecasekeys.findIndex(key => key === selectedUsecase)
						var newitem = usecasekeys[foundIndex+1]
						if (newitem === undefined || newitem === 0) {
							newitem = usecasekeys[1]
						}

						setSelectedUsecase(newitem)
						return -18
					}

					if (oldProgress >= 65) {
						return oldProgress + 3
					}

					if (oldProgress >= 80) {
						return oldProgress + 1
					}

					return oldProgress + 6
				})
			}, 165)

			return () => {
				clearInterval(timer)
			}
		}, [])

		if (usecases === null || usecases === undefined || usecases.length === 0) {
			return null
		}

		const modifier = isMobile ? 17 : 22
		return (
			<span style={{margin: "auto", textAlign: isMobile ? "center" : "left", width: isMobile ? 280 : "100%",}}>
				<b>Handle <br/>
				<span style={{marginBottom: 10}}>
					<i id="usecase-text">{selectedUsecase}</i>
					<LinearProgress variant="determinate" value={progress} style={{marginTop: 0, marginBottom: 0, height: 3, width: isMobile ? "100%" : selectedUsecase.length*modifier, borderRadius: 10, }} />
				</span>
				with confidence</b>
			</span>
		)
	}

	const parsedWidth = isMobile ? "100%" : 1100 
	return (
		<div style={{width: isMobile ? null : parsedWidth, margin: isMobile ? "0px 0px 0px 0px" : "auto", color: "white", textAlign: isMobile ? "center" : "left",}}>
			<div style={{display: "flex", position: "relative",}}>
				<div style={{maxWidth: isMobile ? "100%" : 420, paddingTop: isMobile ? 0 : 120, zIndex: 1000, margin: "auto",}}>

					<Typography variant="h1" style={{margin: "auto", width: isMobile ? 280 : "100%", marginTop: isMobile ? 50 : 0}}>
						<HandleTitle usecases={usecases} selectedUsecase={selectedUsecase} setSelectedUsecase={setSelectedUsecase} />

						{/*<b>Security Automation <i>is Hard</i></b>*/}
					</Typography>
					<Typography variant="h6" style={{marginTop: isMobile ? 15 : 0,}}>
						Connecting your everchanging environment is hard. We get it! That's why we built Shuffle, where you can use and share your security workflows to everyones benefit.
						{/*Shuffle is an automation platform where you don't need to be an expert to automate. Get access to our large pool of security playbooks, apps and people.*/}
					</Typography>
					<div style={{display: "flex", textAlign: "center", itemAlign: "center",}}>
						{isMobile ? null :
							<Link rel="noopener noreferrer" to={"/pricing"} style={{textDecoration: "none"}}>
								<Button
									variant="contained"
									onClick={() => {
										ReactGA.event({
											category: "landingpage",
											action: "click_main_pricing",
											label: "",
										})
									}}
									style={{
										borderRadius: 25, height: 40, width: 175, margin: "15px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground, marginRight: 10, 
									}}>
									See Pricing	
								</Button>
							</Link>
						}
						{isMobile ? null :
							<Link rel="noopener noreferrer" to={"/register?message=You'll need to sign up first. No name, company or credit card required."} style={{textDecoration: "none"}}>
								<Button
									variant="contained"
									onClick={() => {
										ReactGA.event({
											category: "landingpage",
											action: "click_main_try_it_out",
											label: "",
										})
									}}
									style={{
										borderRadius: 25, height: 40, width: 175, margin: "15px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground,
									}}>
									Start for free	
								</Button>
							</Link>
						}
					</div>
				</div>
				{isMobile ? null : 
					<div style={{marginLeft: 200, marginTop: 125, zIndex: 1000}}>
						<AppFramework showOptions={false} selectedOption={selectedUsecase} rolling={true} />
					</div>
				}
				{isMobile ? null : 
				<div style={{position: "absolute", top: 50, right: -200, zIndex: 0,  }}>
					<svg width="351" height="433" viewBox="0 0 351 433" fill="none" xmlns="http://www.w3.org/2000/svg" style={{zIndex: 0, }}>
					<path d="M167.781 184.839C167.781 235.244 208.625 276.104 259.03 276.104C309.421 276.104 350.28 235.244 350.28 184.839C350.28 134.448 309.421 93.5892 259.03 93.5892C208.625 93.5741 167.781 134.433 167.781 184.839ZM330.387 184.839C330.387 224.263 298.439 256.195 259.03 256.195C219.621 256.195 187.674 224.248 187.674 184.839C187.674 145.43 219.636 113.483 259.03 113.483C298.439 113.483 330.387 145.43 330.387 184.839Z" fill="white" fill-opacity="0.2"/>
					<path d="M167.781 387.368C167.781 412.578 188.203 433 213.398 433C238.593 433 259.03 412.578 259.03 387.368C259.03 362.157 238.608 341.735 213.398 341.735C188.187 341.735 167.781 362.172 167.781 387.368ZM249.076 387.368C249.076 407.08 233.095 423.046 213.398 423.046C193.686 423.046 177.72 407.065 177.72 387.368C177.72 367.671 193.686 351.69 213.398 351.69C233.095 351.705 249.076 367.671 249.076 387.368Z" fill="white" fill-opacity="0.2"/>
					<path d="M56.8637 0.738726C25.7052 0.738724 0.44632 25.9976 0.446317 57.1561C0.446314 88.3146 25.7052 113.573 56.8637 113.573C88.0221 113.573 113.281 88.3146 113.281 57.1561C113.281 25.9977 88.0222 0.738729 56.8637 0.738726Z" fill="white" fill-opacity="0.2"/>
					</svg>
				</div>
				}
			</div>
			<div style={{display: "flex", width: isMobile ? "100%" : 300, itemAlign: "center", margin: "auto", marginTop: 20, flexDirection: isMobile ? "column" : "row", textAlign: "center",}}>
				{isMobile ?
				<Link rel="noopener noreferrer" to={"/pricing"} style={{textDecoration: "none"}}>
					<Button
						variant={isMobile ? "contained" : "outlined"}
						color={isMobile ? "primary" : "secondary"}
						style={buttonStyle}
						onClick={() => {
							ReactGA.event({
								category: "landingpage",
								action: "click_main_pricing",
								label: "",
							})
						}}
						>
						See pricing 
					</Button>
				</Link>
				: null
				}
				{/*isMobile ? 
				<Link rel="noopener noreferrer" to={"/docs/features"} style={{textDecoration: "none"}}>
					<Button
						variant="outlined"
						onClick={() => {
							ReactGA.event({
								category: "landingpage",
								action: "click_main_features",
								label: "",
							})
						}}
						color="secondary"
						style={buttonStyle}>
						Features 
					</Button>
						</Link>
						: null*/}
					</div>
			{isMobile ? null : 
				<div style={{display: "flex", width: parsedWidth, margin: "auto", marginTop: 150}}>
					{securityFramework.map((data, index) => {
						return (
							<div key={index} style={{flex: 1, textAlign: "center",}}>
								<span style={{margin: "auto", width: 25,}}>
									<svg width="25" height="25" fill="white" xmlns="http://www.w3.org/2000/svg" >
										{data.image}
									</svg>
								</span>
								<Typography variant="body2" style={{color: "white", marginRight: 5}}>
									{data.text}
								</Typography>
							</div>
						)
					})}
				</div>
			}
			</div>
		)
}

export default LandingpageUsecases;
