/* eslint-disable react/no-multi-comp */
import React, { useState, useEffect, } from 'react';
import { makeStyles } from '@mui/styles';
import { useNavigate, Link, useParams } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { toast } from 'react-toastify';
import { useInterval } from "react-powerhooks";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import {
	ConnectingAirportsOutlined,
	ConstructionOutlined,
	DoneRounded,
	Done as DoneIcon
} from '@mui/icons-material';

import {
	Checkbox,
	CircularProgress,
	TextField,
	Button,
	Paper,
	Typography,
	Tooltip,
	TableHead,
	TableRow,
	TableContainer,
	TableCell,
	TableBody,
	Table,
} from '@mui/material';

const hrefStyle = {
	color: "#FF8444",
	fontSize: "14px",
	textDecoration: "none",
	display: "flex",
}

const googleLoginIcon = {
	boxSizing: "border-box",
	display: "flex",
	flexDirection: "row",
	justifyContent: "center",
	alignItems: "center",
	padding: "16px",
	gap: "8px",
	// position: "sticky",
	width: 171,
	height: "51px",
	left: "352px",
	top: "725px",
	background: "#1A1A1A",
	border: "1px solid #494949",
	borderRadius: "8px",

}

const githubLoginIcon = {
	boxSizing: "border-box",
	display: "flex",
	flexDirection: "row",
	justifyContent: "center",
	alignItems: "center",
	padding: "16px",
	gap: "8px",
	position: "sticky",
	width: "173px",
	height: "51px",
	left: "539px",
	top: "725px",
	backgroundColor: "#1A1A1A",
	border: "1px solid #494949",
	borderRadius: "8px",
}

const surfaceColor = "#27292D"
const inputColor = "#383B40"

const useStyles = makeStyles({
	notchedOutline: {
		borderColor: "#f85a3e !important"
	},
	marketplaceIcon: {
		width: 28,
		height: 28,
		marginRight: 12
	},
	divider: {
		display: "flex",
		alignItems: "center",
		margin: "0 20px",
		'&::before, &::after': {
			content: '""',
			flex: 1,
			borderBottom: "1px solid #494949"
		},
		'& span': {
			margin: "0 10px",
			color: "#9E9E9E"
		}
	},
	freePlanCard: {
		padding: "40px",
		background: "#212121",
		borderRadius: "12px",
		width: "100%",
		maxWidth: "500px"
	},
	freePlanTitle: {
		fontSize: "28px",
		fontWeight: 600,
		color: "white",
		marginTop: 0,
		marginBottom: "32px"
	},
	featureItem: {
		display: "flex",
		alignItems: "center",
		marginBottom: "20px",
		color: "white",
		fontSize: "16px",
		fontWeight: 500
	},
	checkIcon: {
		color: "#4CAF50",
		marginRight: "16px",
		width: "24px",
		height: "24px"
	}
});


const FreePlanCard = ({ classes }) => {
	const features = [
		"Access to All Apps",
		"10,000 App Runs",
		"Monthly Runs Refresh",
		"Unlimited Users & Workflows",
		"Multi-Tenancy & -Region",
		"Support & Discord Access"
	];

	return (
		<div className={classes.freePlanCard}>
			<h2 className={classes.freePlanTitle}>
				The free plan includes:
			</h2>

			{features.map((feature, index) => (
				<div key={index} className={classes.featureItem}>
					<DoneRounded className={classes.checkIcon} />
					<span>{feature}</span>
				</div>
			))}
		</div>
	);
};

const MarketplaceCard = ({ classes }) => {
	const marketplaceOptions = [
		{
			name: "Open Source Install",
			logo: "https://static.cdnlogo.com/logos/g/69/github-icon.svg",
			tooltipText: "Click to install!",
			valid: true,

			link: "https://github.com/shuffle/shuffle/blob/main/.github/install-guide.md"
		},
		{
			name: "Amazon Web Services",
			logo: "https://cdn.cdnlogo.com/logos/a/19/aws.svg",
			tooltipText: "Coming soon to AWS Marketplace!",
			valid: false,
		},
		{
			name: "Microsoft Azure",
			logo: "https://cdn.cdnlogo.com/logos/a/12/azure.svg",
			tooltipText: "Coming soon to Azure Marketplace!",
			valid: false,
		},
		{
			name: "Google Cloud Platform",
			logo: "https://cdn.cdnlogo.com/logos/g/75/google-cloud.svg",
			tooltipText: "Coming soon to Google Cloud Marketplace!",
			valid: false,
		}
	];

	return (
		<div style={{
			padding: "40px",
			background: "#212121",
			borderRadius: "12px",
			width: "100%",
			maxWidth: "500px"
		}}>
			<h2 style={{
				marginTop: 0,
				marginBottom: "32px",
				fontSize: "28px",
				fontWeight: 600,
				color: "white",
				textAlign: "center", 
			}}>
				Self Host
			</h2>

			{marketplaceOptions.map((option, index) => {
				return (
					<Tooltip
						key={index}
						title={option.tooltipText}
						placement="top"
						arrow
					>
						<button
							onClick={() => {
								if (option.valid === true) {
									window.open(option.link, "_blank")
								}
								
							}}
							style={{
								width: "100%",
								justifyContent: "flex-start",
								padding: "12px",
								marginBottom: "12px",
								backgroundColor: "#1A1A1A", 
								border: "1px solid #494949",
								borderRadius: "8px",
								color: "white",
								opacity: 0.7,
								cursor: option.valid === true ? "pointer" : "not-allowed",
							}}
							disabled={option.valid === false}
						>
							<img
								src={option.logo}
								alt={option.name}
								className={classes.marketplaceIcon}
								style={{
									filter: option.valid === true ? null : "grayscale(1)",
								}}
							/>
							<Typography className={classes.marketplaceText}>
								{option.name}
							</Typography>
						</button>
					</Tooltip>
				)
			})}

			<div style={{
				marginTop: "0.5rem",
				display: "flex",
				flexDirection: "column",
				gap: "0.5rem",
				textAlign: "center", 
			}}>
				{/*
				<a
					href="https://shuffler.io/docs/configuration#marketplace-setup"
					target="_blank"
					style={{ color: "rgba(255, 132, 68, 1)", textDecoration: "underline" }}
				>
					Read more about marketplaces
				</a>
				*/}
				<a
					href="/docs/configuration#installation"
					target="_blank"
					style={{ color: "rgba(255, 132, 68, 1)", textDecoration: "underline" }}
				>
					Learn more about self hosting
				</a>
			</div >

		</div >
	);
};


const LoginPage = props => {
	const { globalUrl, isLoaded, isLoggedIn, setIsLoggedIn, setCookie, inregister, serverside, checkLogin, } = props;
	let navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [loginLoading, setLoginLoading] = useState(false);

	const [MFAField, setMFAField] = useState(false);
	const [MFAValue, setMFAValue] = useState("");
	const [register, setRegister] = useState(inregister);
	const [checkboxClicked, setCheckboxClicked] = useState(false);
	const [loginWithSSO, setLoginWithSSO] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [ssoUrl, setSSOUrl] = useState("");

    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "migration.shuffler.io";
	const parsedsearch = serverside === true ? "" : window.location.search

	useEffect(() => {
		if (!isCloud) {
			checkAdmin() 
		} 
	}, [])

    const { start, stop } = useInterval({
      duration: 3000,
      startImmediate: false,
      callback: () => {
        checkAdmin()
      },
    })

	if (serverside !== true) {
		const tmpMessage = new URLSearchParams(window.location.search).get("message")
		if (tmpMessage !== undefined && tmpMessage !== null && message !== tmpMessage) {
			setMessage(tmpMessage)
		}
	}

	if (document !== undefined) {
		if (register) {
			if (isCloud) { 
				document.title = "Login to Shuffle SaaS"
			} else {
				document.title = "Login to Shuffle"
			}
		} else {
			if (isCloud) {
				document.title = "Register to Shuffle SaaS"
			} else {
				document.title = "Register to Shuffle"
			}
		}
  }
  
  useEffect(() => {

    if (loginWithSSO && window?.location?.pathname === "/register") {
      setLoginWithSSO(false)
    }

  },[window?.location?.pathname])

	// Just a way to force location loading properly
	// Register & login should be split :3
	if (window !== undefined) {
		const path = window.location.pathname;
		if (path.includes("/login") && register === false) {
			console.log("Should register instead of login!")
			setRegister(!register)
		} else if (path.includes("/register") && register === true) {
			if (!isCloud) {
				setRegister(true)
				navigate("/login")
			}

			console.log("Should login instead of register!")
			setRegister(!register)
		} else {
			console.log("Path: " + path, "Register: " + register)
		}
	}

	const bodyDivStyle = {
		marginTop: 100,
		width: isMobile ? "100%" : "100%",
		maxWidth: "1200px", // Increased max-width to accommodate larger cards
		background: "#1A1A1A",
		margin: "auto",
		display: isMobile ? "block" : "flex",
		padding: "40px",
		gap: "40px",
		overflow: "hidden",
		alignItems: "center"
	};

	const boxStyle = {
		color: "white",
		padding: "40px",
		flex: 1,
		maxWidth: isMobile ? "100%" : 410,
		minWidth: isCloud ? 410 : 475, 
		background: "#212121",
		borderRadius: "12px",
		display: "flex",
		// flexDirection: "column",
	};



	const paperStyleReg = {
		width: 300,
		height: 350,
		background: "#212121",
		borderRadius: "8px",
		marginLeft: isMobile ? 80 : register ? "455px" : "485px",
		marginTop: isMobile ? 10 : 110,
		position: isMobile ? "" : "absolute",

	}
	const paperStyleLog = {
		position: "absolute",
		width: isMobile ? "400px" : "532px",
		padding: "0px 30px 0px",
		// marginTop: "135px",
		// background: "#212121",
		borderRadius: "8px",
	}
	const createData = (icon, title) => {
		return {
			icon,
			title,
		}
	}

	// Used to swap from login to register. True = login, false = register
	const activeIcon = <DoneIcon style={{ color: "green" }} />
	const rows = [
		createData(activeIcon, "Access to All Apps"),
		createData(activeIcon, "10,000 App Runs"),
		createData(activeIcon, "Monthly Runs Refresh"),
		createData(activeIcon, "Unlimited Users & Workflows"),
		createData(activeIcon, "Multi-Tenancy & -Region"),
		createData(activeIcon, "Support & Discord Access"),
	];
	const classes = useStyles();
	// Error messages etc
	const [loginInfo, setLoginInfo] = useState("");

	const handleValidateForm = (username, password) => {
		if (loginWithSSO) {
			return username.length > 1
		}

		if (!isCloud) {
			return (username.length > 0 && password.length > 0);
		}

		return (username.length > 1 && password.length > 8);
	}

	if (isLoggedIn === true && serverside !== true) {
		const tmpView = new URLSearchParams(window.location.search).get("view")
		if (tmpView !== undefined && tmpView !== null && tmpView === "pricing") {
			window.location.pathname = "/pricing"
			return
		} else if (tmpView !== undefined && tmpView !== null) {
			window.location.pathname = tmpView
			return
		}

		window.location.pathname = "/workflows"
	}

    const checkAdmin = () => {
      const url = globalUrl + "/api/v1/checkusers";
      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            setLoginInfo(responseJson["reason"]);
          } else {
            if (responseJson.sso_url !== undefined && responseJson.sso_url !== null) {
              setSSOUrl(responseJson.sso_url);
            }

			// Stay = 0 users 
			// Redirect = >1 user
            if (responseJson.reason === "stay") {
				setTimeout(() => {
              		navigate("/adminsetup")
				}, 2500)
			}
          }
        })
      )
      .catch((error) => {
		  setTimeout(() => {
		  	navigate("/adminsetup")
		  }, 2500)
      })
    }

	const onSubmit = (e) => {
		//toast("Testing from login page")

		setMessage("")
		setLoginLoading(true)
		e.preventDefault()

		// Just use this one?
		var data = { "username": username, "password": password }
		if (MFAValue !== undefined && MFAValue !== null && MFAValue.length > 0) {
			data["mfa_code"] = MFAValue
		}

		localStorage.setItem("globalUrl", "")

		var baseurl = globalUrl
		if (register) {
			var url = baseurl + '/api/v1/login';

			if (loginWithSSO === true) {
				url = baseurl + '/api/v1/login/sso'
				setLoginInfo("Logging in with SSO. Please wait while we find a relevant org...")
			}

			fetch(url, {
				mode: 'cors',
				method: 'POST',
				body: JSON.stringify(data),
				credentials: 'include',
				crossDomain: true,
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
				},
			})
				.then((response) => {
					if (response.status !== 200) {
						console.log("Status not 200 for login:O!");
					}

					return response.json();
				})
				.then((responseJson) => {

					setLoginLoading(false)

					console.log("Resp from backend: ", responseJson)

					if (responseJson["success"] === false) {
						setLoginInfo(responseJson["reason"])
					}
					else {

						if (responseJson["reason"] === "MFA_REDIRECT") {
							setLoginInfo("Enter the 6-digit MFA code.")
							setMFAField(true)
							return

						}
						else if (responseJson["reason"] === "MFA_SETUP") {
							window.location.href = `/login/${responseJson.url}/mfa-setup`;
							return;
						}
						else if (responseJson["reason"] === "SSO_REDIRECT") {
							//navigate(responseJson["url"])
							window.location.href = responseJson["url"]
							return

						}
						else if (responseJson["reason"] !== undefined && responseJson["reason"] !== null && responseJson["reason"].includes("error")) {
							setLoginInfo(responseJson["reason"])
							return
						}


						setLoginInfo("Successful login! Redirecting you in 3 seconds...")
						for (var key in responseJson["cookies"]) {
							setCookie(responseJson["cookies"][key].key, responseJson["cookies"][key].value, { path: "/" })
						}

						const tmpView = new URLSearchParams(window.location.search).get("view")
						if (tmpView !== undefined && tmpView !== null) {
							//const newUrl = `/${tmpView}${decodeURIComponent(window.location.search)}`
							// Check if slash in the url

							var newUrl = `/${tmpView}`
							if (tmpView.startsWith("/")) {
								newUrl = `${tmpView}`
							}

							console.log("Found url: ", newUrl)

							window.location.pathname = newUrl
							return
						}

						console.log("LOGIN DATA: ", responseJson)
						if (responseJson.tutorials !== undefined && responseJson.tutorials !== null) {
							// Find welcome in responseJson.tutorials under key name
							const welcome = responseJson.tutorials.find(function (element) {
								return element.name === "welcome";
							})

							console.log("Welcome: ", welcome)
							if (welcome === undefined || welcome === null) {
								  console.log("RUN login Welcome!!")
									// window.location.pathname = "/welcome?tab=2"
									// window.location = "/welcome?tab=2"
									window.location.href = "/welcome?tab=2"
									return
							}
						}

						window.location.pathname = "/workflows"
					}
				})
				.catch(error => {
					setLoginInfo("Error from login API: " + error)
					setLoginLoading(false)
				});
		} else {
			url = baseurl + '/api/v1/register';
			fetch(url, {
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json',
				},
			})
				.then(response =>
					response.json().then(responseJson => {
						if (responseJson["success"] === false) {
							setLoginInfo(responseJson["reason"])
						} else {
							if (responseJson["reason"] === "shuffle_account") {
								window.location.href = "/login?message=Please+login+with+your+Shuffle+account"
								return
							}

							//setLoginInfo("Successful register!")
							//var newpath = "/login?message=Successfully signed up. You can now sign in."
							//const tmpMessage = new URLSearchParams(window.location.search).get("message")
							setLoginInfo("Successful registration! Redirecting in 3 seconds...")
							for (var key in responseJson["cookies"]) {
								setCookie(responseJson["cookies"][key].key, responseJson["cookies"][key].value, { path: "/" })
							}

							setTimeout(() => {
								console.log("LOGIN DATA: ", responseJson)

								const tmpView = new URLSearchParams(window.location.search).get("view")
								if (tmpView !== undefined && tmpView !== null) {
									//const newUrl = `/${tmpView}${decodeURIComponent(window.location.search)}`
									const newUrl = `/${tmpView}`
									window.location.pathname = newUrl
									return
								}

								//if (responseJson.tutorials === undefined || responseJson.tutorials === null || !responseJson.tutorials.includes("welcome")) {
								console.log("RUN Welcome!!")
								//window.location.pathname = "/welcome?tab=2"
								window.location.href = "/welcome"
							}, 1500);
						}
						setLoginLoading(false)
					}),
				)
				.catch(error => {
					setLoginInfo("Error in login. Please try again, or contact support@shuffler.io if the problem persists.")
					setLoginLoading(false)
				});
		}
	}

	const onChangeUser = (e) => {
		setUsername(e.target.value)
	}

	const onChangePass = (e) => {
		setPassword(e.target.value)
	}

	const HandleLoginWithSSO = () => {
		setPassword("")
		setLoginInfo("")
		setLoginWithSSO(true)
	}

	var formtitle = register ? <div>Welcome Back!</div> : <div>Create your account</div>
	var formButton = !isCloud ? "" : register ? <div style={{ display: "flex" }}> <div style={{ fontSize: "14px", paddingRight: "7px", textDecoration: "none", }}>Don’t have an account yet?</div> <Link style={hrefStyle} to={`/register${parsedsearch}`}><div>Register here</div></Link></div> : <>

		<div style={{ display: "flex", marginTop: 40, marginBottom: -10 }}> <div style={{ fontSize: "14px", paddingRight: "7px", textDecoration: "none", }}>Already have an account?</div> <Link style={hrefStyle} to={`/login${parsedsearch}`}><div>Login here</div></Link></div>
	</>
	//<Link to={`/login${parsedsearch}`} style={hrefStyle}><div>Click here to Login</div></Link>

	//	<DialogTitle>{formtitle}</DialogTitle>

  const buttonBackground = "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)"

	const buttonStyle = { borderRadius: 25, height: 50, fontSize: 18, backgroundImage: handleValidateForm(username, password) || loginLoading || (checkboxClicked && register) ? buttonBackground : "grey", color: "white" }
	//<Button variant="contained" type="submit" fullWidth style={buttonStyle} disabled={!handleValidateForm() || loginLoading}>
	const basedata =
		(
			<div style={bodyDivStyle}>
				<Paper
					style={{
						...boxStyle,
						width: "max-content",
					}}
				>
					<form onSubmit={onSubmit} style={{ margin: 15, width: isMobile ? "100%" : "360px", width: "max-content", overflow: "hidden", textAlign: "center", }}>
						<img
							style={{
								height: isMobile ? 44 : 60,
								width: isMobile ? 44 : 60,
								paddingBottom: isMobile ? null : 40
							}}
							src="images/logos/orange_logo.svg"
							alt="Shuffle Logo"
						/>

						<Typography
							color="textSecondary"
							style={{
								textAlign: isMobile ? "center" : null,
								marginTop: 10,
								marginBottom: 10
							}}
						>
							{message}
						</Typography>

						<h2 style={{
							marginBottom: 2,
							textAlign: isMobile ? "center" : null
						}}>
							{formtitle}
						</h2>

						<Typography
							color="textSecondary"
							style={{
								marginBottom: register ? 28 : 10,
								textAlign: isMobile ? "center" : null
							}}
							variant="body2"
						>
							{register
								? "Find new ways to automate by discovering usecases Shufflers"
								: "Please fill in the information to continue to discover the power of Shuffle"
							}
						</Typography>

						<div style={{ marginBottom: 20, textAlign: "left", }}>
							<div style={{ marginBottom: 5 }}>{isCloud ? "Email" : "Username"}</div>
							<TextField
								color="primary"
								style={{
									backgroundColor: inputColor,
									marginTop: 5,
									width: "100%"
								}}
								autoFocus
								InputProps={{
									classes: {
										notchedOutline: classes.notchedOutline,
									},
									style: {
										height: "50px",
										color: "white",
										fontSize: "1em",
									},
								}}
								required
								fullWidth={true}
								autoComplete="username"
								placeholder="username@example.com"
								id="emailfield"
								margin="normal"
								variant="outlined"
								onChange={onChangeUser}
							/>
						</div>

						{!loginWithSSO && (
							<div style={{ marginBottom: 20, textAlign: "left", }}>
								<div style={{ marginBottom: 5 }}>Password</div>
								<TextField
									color="primary"
									style={{
										backgroundColor: inputColor,
										marginTop: 5,
										width: "100%"
									}}
									InputProps={{
										classes: {
											notchedOutline: classes.notchedOutline,
										},
										style: {
											height: "50px",
											color: "white",
											fontSize: "1em",
										},
										endAdornment: (
											<Tooltip title={showPassword ? "Hide password" : "Show password"} arrow>
												<div
													style={{
														cursor: "pointer",
														marginRight: 10,
														color: "white"
													}}
													onClick={() => setShowPassword(!showPassword)}
												>
													{showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
												</div>
											</Tooltip>
										)
									}}
									required
									id="outlined-password-input"
									fullWidth={true}
									autoComplete="current-password"
									placeholder="at least 10 characters"
									margin="normal"
									variant="outlined"
									type={showPassword ? "text" : "password"}
									onChange={onChangePass}
									helperText={
										handleValidateForm(username, password)
											? ""
											: "Password must be at least 9 characters long"
									}
								/>
							</div>
						)}

						{MFAField && (
							<div style={{ marginBottom: 20 }}>
								<div style={{ marginBottom: 5 }}>2-factor code</div>
								<TextField
									autoFocus
									color="primary"
									style={{
										backgroundColor: inputColor,
										marginTop: 5,
										width: "100%"
									}}
									InputProps={{
										classes: {
											notchedOutline: classes.notchedOutline,
										},
										style: {
											height: "50px",
											color: "white",
											fontSize: "1em",
										},
									}}
									required
									id="outlined-mfa-input"
									fullWidth={true}
									type="text"
									placeholder="6-digit code"
									margin="normal"
									variant="outlined"
									onChange={(event) => {
										setMFAValue(event.target.value)
									}}
								/>
							</div>
						)}

						<div style={{
							display: "flex",
							flexDirection: "column",
							marginTop: "0px"
						}}>
							{isCloud && register && !loginWithSSO && (
								<Link
									to={`/passwordreset${parsedsearch}`}
									style={{
										...hrefStyle,
										alignSelf: isMobile ? "center" : "flex-end"
									}}
								>
									<div>Forgot password?</div>
								</Link>
							)}
						</div>

						{!register && (
							<Typography
								color="textSecondary"
								style={{ marginTop: 5 }}
								variant="body2"
							>
								<Checkbox
									style={{ color: "#F85A3E" }}
									onChange={(event) => {
										setCheckboxClicked(!checkboxClicked)
									}}
								/>
								I agree to{' '}
								<a
									href="https://shuffler.io/docs/terms_of_service"
									style={{ textDecoration: "none", color: "#f85a3e" }}
									rel="noopener noreferrer"
									target="_blank"
								>
									Shuffle's Terms of Service
								</a>
								.
							</Typography>
						)}

						<div style={{
							display: "flex",
							marginTop: "15px",
							paddingBottom: register ? "40px" : ""
						}}>
							<Button
								variant="contained"
								type="submit"
								fullWidth
								style={buttonStyle}
								disabled={!handleValidateForm(username, password) || loginLoading || (!checkboxClicked && !register)}
							>
								{loginLoading ? (
									<CircularProgress color="secondary" style={{ color: "white" }} />
								) : (
									"Continue"
								)}
							</Button>
						</div>

						<div style={{
							display: "flex",
							flexDirection: "column",
							marginTop: "0px",
							alignItems: isMobile ? "center" : null
						}}>
							<div style={{ flex: 1 }}>
								{formButton}
							</div>
						</div>

						<div style={{ marginTop: "10px", color: "white" }}>
							{loginInfo}
						</div>

						{(
							ssoUrl !== undefined && ssoUrl !== null && ssoUrl.length) > 0 
							//|| (isCloud && !loginWithSSO && window?.location?.pathname !== "/register")   
							? (
						  <div>
							<Typography style={{ textAlign: "center" }}>Or</Typography>
							<div style={{ textAlign: "center", margin: 10 }}>
							  <Button
								fullWidth
								id="sso_button"
								color="secondary"
								variant="outlined"
								type="button"
								style={{ flex: "1", marginTop: 5, textTransform: 'none', fontSize: 16 }}
								onClick={(e) => {
								  //console.log("CLICK SSO");
								  e.preventDefault();				
								  //navigate(ssoUrl)
								  if (isCloud) {
									setLoginWithSSO(true)
									setPassword("")
								  }else {
									window.location.href = ssoUrl
								  }
								}}
							  >
								Use SSO
							  </Button>
							</div>
						  </div>
						) : null}
						{isCloud && loginWithSSO && (
							<Button 
								variant="outlined"
								color="secondary"
								onClick={() => {
									setLoginWithSSO(false)
									setLoginInfo("")
								}}
								style={{ width: '100%', marginTop: 5, flex: "1", textTransform: 'none', fontSize: 16 }}
							>
								Back to login
							</Button>
						)}
					</form>
				</Paper>

				{isMobile ? null : (
					<>
						<div className={classes.divider}>
							<span>OR</span>
						</div>
						<MarketplaceCard classes={classes} />
					</>
				)}
			</div>
		);

	const loadedCheck = isLoaded ?
		<div>
			{basedata}
		</div>
		:
		<div>
		</div>

	return (
		<div style={{zoom: 0.8, minHeight: "75vh", paddingTop: 75, paddingBottom: 90 }}>
			{loadedCheck}
		</div>
	)
}

export default LoginPage;
