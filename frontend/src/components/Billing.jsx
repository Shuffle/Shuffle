import React, { useState, useEffect, memo, useMemo, useContext } from "react";
import ReactGA from 'react-ga4';
import { getTheme } from "../theme.jsx";
import countries from "../components/Countries.jsx";

import {
	Box,
	Paper,
	Typography,
	Divider,
	Button,
	Grid,
	Card,
	List,
	ListItemText,
	ListItem,
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	InputAdornment,
	IconButton,
	Chip,
	Checkbox,
	Tooltip,
	DialogContentText,
	DialogActions,
	LinearProgress,
	Slider,
	Tabs,
	Tab,
	CircularProgress,
} from "@mui/material";

import { useNavigate, Link, json } from "react-router-dom";
import { Autocomplete } from "@mui/material";
import { toast } from "react-toastify"

import {
	Cached as CachedIcon,
	ContentCopy as ContentCopyIcon,
	Draw as DrawIcon,
	Close as CloseIcon,
	Delete,
	RestaurantRounded,
	Cloud,
	CheckCircle,
	Padding,
	Edit,
	Search as SearchIcon
} from "@mui/icons-material";

//import { useAlert 
import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";
import BillingStats from "../components/BillingStats.jsx";
import LicencePopup from "../components/LicencePopup.jsx";
import { handlePayasyougo } from "../views/HandlePaymentNew.jsx"

import { Context } from "../context/ContextApi.jsx";

import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid } from "@mui/x-data-grid";

const Billing = memo((props) => {
	const { globalUrl, userdata, serverside, billingInfo, stripeKey,isLoaded, selectedOrganization, handleGetOrg, clickedFromOrgTab, removeCookie} = props;
	//const alert = useAlert();
	let navigate = useNavigate();
	const { themeMode, brandColor,supportEmail } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);
	const [isLoggedIn, setIsLoggedIn] = useState(false)
	const [selectedDealModalOpen, setSelectedDealModalOpen] = React.useState(false);
	const [dealList, setDealList] = React.useState([]);
	const [dealName, setDealName] = React.useState("");
	const [dealAddress, setDealAddress] = React.useState("");
	const [dealType, setDealType] = React.useState("MSSP");
	const [dealCountry, setDealCountry] = React.useState("United States");
	const [dealCurrency, setDealCurrency] = React.useState("USD");
	const [dealStatus, setDealStatus] = React.useState("initiated");
	const [dealValue, setDealValue] = React.useState("");
	const [dealDiscount, setDealDiscount] = React.useState("");
	const [dealerror, setDealerror] = React.useState("");
	const [openChangeEmailBox, setOpenChangeEmailBox] = useState(false);
	const [isMouseOverOnChangeEmail, setIsMouseOverOnChangeEmail] = useState(false);
	const [currentAppRunsInPercentage, setCurrentAppRunsInPercentage] = useState(0);
	const [currentAppRunsInNumber, setCurrentAppRunsInNumber] = useState(0);
	const [alertThresholds, setAlertThresholds] = useState(selectedOrganization.Billing !== undefined && selectedOrganization.Billing.AlertThreshold !== undefined && selectedOrganization.Billing.AlertThreshold !== null ? selectedOrganization.Billing.AlertThreshold : [{ percentage: '', count: '', Email_send: false }]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [deleteAlertIndex, setDeleteAlertIndex] = useState(-1);
	const [deleteAlertVerification, setDeleteAlertVerification] = useState(false);
	const [isScale, setIsScale] = useState(false);
	const [currentTab, setCurrentTab] = useState(0)
	const [allChildOrgs, setAllChildOrgs] = useState([])
	const [allChildOrgsStats, setAllChildOrgsStats] = useState([])

	useEffect(() => {
		if (userdata.app_execution_limit !== undefined && userdata.app_execution_usage !== undefined) {
			const percentage = ((userdata.app_execution_usage + userdata.app_executions_suborgs) / userdata.app_execution_limit) * 100;
			setCurrentAppRunsInPercentage(Math.round(percentage));
			setCurrentAppRunsInNumber(userdata.app_execution_limit - userdata.app_execution_usage - userdata.app_executions_suborgs);
		}

		if (userdata?.id?.length > 0 && isLoggedIn === false){
			setIsLoggedIn(true)
		}
	}, [userdata]);

	const [BillingEmail, setBillingEmail] = useState(selectedOrganization?.Billing?.Email);

	useEffect(() => {
		const urlIncludesProfessionalServices = window.location.href.includes("professional-services");
		if (props?.isCloud && urlIncludesProfessionalServices) {
			const professionalServicesSection =
			document.getElementById("professional-services");
			if (professionalServicesSection) {
				professionalServicesSection.scrollIntoView({ behavior: "smooth" });
			}
		}
	}, []);

	useEffect(() => {
		if (BillingEmail !== selectedOrganization?.Billing?.Email) {
			setBillingEmail(selectedOrganization?.Billing?.Email);
		}

		// Set and sort the alert thresholds
		const alertThresholds = selectedOrganization.Billing !== undefined &&
			selectedOrganization.Billing.AlertThreshold !== undefined &&
			selectedOrganization.Billing.AlertThreshold !== null
			? selectedOrganization.Billing.AlertThreshold
			: [{ percentage: '', count: '', Email_send: false }];

		const sortedAlertThresholds = alertThresholds.sort((a, b) => {
			const countA = parseFloat(a.count);
			const countB = parseFloat(b.count);
			if (isNaN(countA)) return 1;
			if (isNaN(countB)) return -1;

			return countA - countB;
		});

		setAlertThresholds(sortedAlertThresholds);

		const findCurrentIndex = sortedAlertThresholds.some(threshold => threshold.Email_send === false);
		setCurrentIndex(findCurrentIndex ? sortedAlertThresholds.findIndex(threshold => threshold.Email_send === false) : - 1);

	}, [selectedOrganization]);

	const stripe = typeof window === 'undefined' || window.location === undefined ? "" : props.stripeKey === undefined ? "" : window.Stripe ? window.Stripe(props.stripeKey) : ""
	const products = [
		{ code: "", label: "MSSP", phone: "" },
		{ code: "", label: "Enterprise", phone: "" },
		{ code: "", label: "Consultancy", phone: "" },
		{ code: "", label: "Support", phone: "" },
	];

	const handleGetDeals = (orgId) => {

		if (orgId.length === 0) {
			toast(
				"Organization ID not defined (get deals). Please contact us on https://shuffler.io if this persists logout."
			);
			return;
		}

		const url = `${globalUrl}/api/v1/orgs/${orgId}/deals`;
		fetch(url, {
			method: "GET",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Bad status code in get deals: ", response.status);
				}

				return response.json();
			})
			.then((responseJson) => {
				console.log("Got deals: ", responseJson);
				if (responseJson.success === false) {
					toast("Failed loading deals. Contact support if this persists");
				} else {
					setDealList(responseJson);
				}
			})
			.catch((error) => {
				console.log("Error getting org deals: ", error);
				toast(
					"Failed getting deals for your org. Contact support if this persists."
				);
			});
	};

	useEffect(() => {
		if (isCloud && selectedOrganization.partner_info !== undefined && selectedOrganization.partner_info.reseller === true) {
			handleGetDeals(selectedOrganization.id);
		}
	}, [])

	const paperStyle = {
		padding: 20,
		// maxWidth: 400,
		width: 340,
		height: 'auto',
		// width: "100%",
		backgroundColor: "#1e1e1e",
		borderRadius: 10,
		marginRight: 10,
		marginTop: 15,
	}

	const isCloud =
		window.location.host === "localhost:3002" ||
		window.location.host === "shuffler.io" || 
		window.location.host === "sandbox.shuffler.io";

	billingInfo.subscription = {
		"active": true,
		"name": "Pay as you go",
		"price": typecost_single,
		"currency": "USD",
		"currency_text": "$",
		"interval": "app run / month",
		"description": "Pay as you go",
		"features": [
			"Includes 10.000 app run/month for free. ",
			"Pay for what you use with no minimum commitment and cancel anytime.",
		],
		"limit": 10000,
	}


	const handleStripeRedirect = () => {
		//var priceItem = "price_1MRNF1DzMUgUjxHSfFTUb2Xh"
		if (stripe == "") {
			console.log("Stripe not loaded")
			return
		}

		var priceItem = "price_1MROFrDzMUgUjxHShcSxgHO1"

		const successUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=success`
		const failUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=failure`
		var checkoutObject = {
			lineItems: [
				{
					price: priceItem,
					quantity: 1
				},
			],
			mode: "subscription",
			billingAddressCollection: "auto",
			successUrl: successUrl,
			cancelUrl: failUrl,
			clientReferenceId: props.userdata.active_org.id,
		}
		//submitType: "donate",

		stripe.redirectToCheckout(checkoutObject)
			.then(function (result) {
				console.log("SUCCESS STRIPE?: ", result)

				ReactGA.event({
					category: "pricing",
					action: "add_card_success",
					label: "",
				})
			})
			.catch(function (error) {
				console.error("STRIPE ERROR: ", error)

				ReactGA.event({
					category: "pricing",
					action: "add_card_error",
					label: "",
				})
			});
	}

	const cancelSubscriptions = (subscription_id) => {
		const orgId = selectedOrganization.id;
		const data = {
			subscription_id: subscription_id,
			action: "cancel",
			org_id: selectedOrganization.id,
		};

		const url = globalUrl + `/api/v1/orgs/${orgId}/cancel`;
		fetch(url, {
			mode: "cors",
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
			crossDomain: true,
			withCredentials: true,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		})
			.then(function (response) {
				if (response.status !== 200) {
					console.log("Error in response");
				}

				if (handleGetOrg != undefined) {
					handleGetOrg(selectedOrganization.id);
				}

				return response.json();
			})
			.then(function (responseJson) {
				if (responseJson.success !== undefined && responseJson.success) {
					toast("Successfully stopped subscription!");
				} else {
					toast("Failed stopping subscription. Please contact us.");
				}
			})
			.catch(function (error) {
				console.log("Error: ", error);
				toast("Failed stopping subscription. Please contact us.");
			});
	};


	const sendSignatureRequest = (subscription) => {
		const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}`;

		fetch(url, {
			body: JSON.stringify({
				org_id: selectedOrganization.id,
				subscription: subscription,
			}),
			mode: "cors",
			method: "POST",
			credentials: "include",
			crossDomain: true,
			withCredentials: true,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Error in response");
				}
				return response.json();
			})
			.then((responseJson) => {
				console.log("Response from signature request: ", responseJson);
			})
			.catch((error) => {
				console.log("Error: ", error);
			})
	}

	const SubscriptionObject = (props) => {
		const { globalUrl, index, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, subscription, highlight, } = props;

		const [signatureOpen, setSignatureOpen] = React.useState(false);
		const [tosChecked, setTosChecked] = React.useState(subscription.eula_signed)
		const [hovered, setHovered] = React.useState(false)
		const [newBillingEmail, setNewBillingEmail] = useState('');
		const {supportEmail} = useContext(Context);

		var top_text = "Base Cloud Access"
		if (subscription.limit === undefined && subscription.level === undefined || subscription.level === null || subscription.level === 0) {
			subscription.name = "Enterprise"
			subscription.currency_text = "$"
			subscription.price = subscription.level * 180
			subscription.limit = subscription.level * 100000
			subscription.interval = subscription.recurrence
			subscription.features = [
				"Includes " + subscription.limit + " app runs/month. ",
				"Multi-Tenancy and Region-Selection",
				"And all other features from /pricing",
			]
		}

		var newPaperstyle = JSON.parse(JSON.stringify(paperStyle))
		if (subscription.name === "Enterprise" && subscription.active === true) {
			top_text = "Current Plan"

			// newPaperstyle.border = "1px solid #f85a3e"
		}

		var showSupport = false
		if (subscription.name.includes("default")) {
			top_text = "Custom Contract"
			// newPaperstyle.border = "1px solid rgba(255,255,255,0.3)"
			showSupport = true
		}

		if (subscription.name.includes("App Run Units")) {
			top_text = "Cloud Access"
			showSupport = true
		}

		if (subscription.name.includes("Open Source")) {
			top_text = "Open Source"
			showSupport = true
		}

		if (subscription.name.includes("Scale")) {
			top_text = "Scale access"
			setIsScale(true)
		}

		if (highlight === true) {
			// Add an "Upgrade now" button
			// newPaperstyle.border = "1px solid rgba(255,255,255,0.3)"
		}

		// if (hovered) {
		// 	newPaperstyle.backgroundColor = "#2b2b2b"
		// }

		const handleClickOpen = () => {
			setOpenChangeEmailBox(true);
		};

		const handleCloseChangeEmailBox = () => {
			setOpenChangeEmailBox(false);
		};


		const getCircularReplacer = () => {
			const seen = new WeakSet();
			return (key, value) => {
				if (typeof value === 'object' && value !== null) {
					if (seen.has(value)) {
						return;
					}
					seen.add(value);
				}
				return value;
			};
		};

		const HandleChangeBillingEmail = (orgId) => {
			const email = newBillingEmail;
			const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
			if (!emailPattern.test(email)) {
				toast("Please enter a valid email address");
				return;
			} else {
				setNewBillingEmail(email);
			}

			toast("Updating billing email. Please Wait")

			const data = {
				org_id: orgId,
				email: newBillingEmail,
				name: selectedOrganization.name,
				description: selectedOrganization.description,
				image: selectedOrganization.image,
				defaults: selectedOrganization.defaults,
				sso_config: selectedOrganization.sso_config,
				mfa_required: selectedOrganization.mfa_required,
				billing: {
					email: newBillingEmail,
					AlertThreshold: selectedOrganization?.Billing?.AlertThreshold,
					Consultation: selectedOrganization?.Billing?.Consultation,
				},
			};

			const url = `${globalUrl}/api/v1/orgs/${orgId}/billing`;
			fetch(url, {
				method: "POST",
				body: JSON.stringify(data),
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
				.then((response) => {
					if (response.status !== 200) {
						console.log("Bad status code in get org:", response.status);
					}
					return response.json();
				}).then((responseJson) => {
					if (responseJson.success === true) {
						toast.success("Successfully updated billing email");
						setBillingEmail(newBillingEmail);
						setOpenChangeEmailBox(false);
					} else {
						toast.error("Failed to update billing email. Please try again.");
					}
				})
				.catch((error) => {
					console.log("Error getting org:", error);
				});
		}

		return (
			<div
				style={newPaperstyle}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<Dialog
					open={signatureOpen}
					PaperProps={{
						style: {
							pointerEvents: "auto",
							color: "white",
							// minWidth: 750,
							width: 340,
							padding: 30,
							// maxHeight: 700,
							height: 480,
							overflowY: "auto",
							overflowX: "hidden",
							zIndex: 10012,
							border: theme.palette.defaultBorder,
						},
					}}
				>
					<Tooltip
						title="Close window"
						placement="top"
						style={{ zIndex: 10011 }}
					>
						<IconButton
							style={{ zIndex: 5000, position: "absolute", top: 34, right: 34 }}
							onClick={(e) => {
								e.preventDefault();
								setSignatureOpen(false);
								setTosChecked(false)
							}}
						>
							<CloseIcon style={{ color: "white" }} />
						</IconButton>
					</Tooltip>
					<DialogTitle id="form-dialog-title">Read and Accept the EULA</DialogTitle>
					<DialogContent>
						<TextField
							rows={17}
							multiline
							fullWidth
							InputProps={{
								readOnly: true,
								style: {
									fontSize: 14,
									color: "rgba(255, 255, 255, 0.6)",
								}
							}}
							value={subscription.eula}
						/>
						<Checkbox
							disabled={subscription.eula_signed}
							checked={tosChecked}
							onChange={(e) => {
								setTosChecked(e.target.checked)
							}}
							inputProps={{ 'aria-label': 'primary checkbox' }}
						/>
						<Typography variant="body1" style={{ display: "inline-block", marginLeft: 10, marginTop: 25, cursor: "pointer", }} onClick={() => {
							setTosChecked(!tosChecked)
						}}>
							Accept
						</Typography>
						<Typography variant="body2" style={{ display: "inline-block", marginLeft: 10, }} color="textSecondary">
							By clicking the “accept” button, you are signing the document, electronically agreeing that it has the same legal validity and effects as a handwritten signature, and that you have the competent authority to represent and sign on behalf an entity. Need support or have questions? Contact us at {supportEmail}
						</Typography>

						<div style={{ display: "flex", marginTop: 25, }}>
							<Button
								variant="contained"
								color="primary"
								style={{ marginLeft: "auto", }}
								disabled={!tosChecked || subscription.eula_signed}
								onClick={() => {
									setSignatureOpen(false)
									subscription.eula_signed = true
									sendSignatureRequest(subscription)
								}}

							>
								Submit
							</Button>
						</div>
					</DialogContent>
				</Dialog>
				<Button style={{ backgroundColor: '#2F2F2F', color: "white", textTransform: "capitalize", borderRadius: 200, boxShadow: 'none', width: 144, height: 40 }}>Current Plan</Button>
				<div style={{ display: "flex", width: 340 }}>
					{top_text === "Base Cloud Access" && userdata.has_card_available === true ?
						<Chip
							style={{
								backgroundColor: "#f86a3e",
								paddingLeft: 5,
								paddingRight: 5,
								height: 28,
								cursor: "pointer",
								borderColor: "#3d3f43",
								color: "white",
								marginTop: 10,
								marginRight: 30,
								border: "1px solid rgba(255,255,255,0.3)",
							}}
							label={"Unlimited"}
							onClick={() => {
								console.log("Clicked chip")
							}}
							variant="outlined"
							color="primary"
						/>
						: null}
					<Typography variant="h6" style={{ marginTop: 10, marginBottom: 10, flex: 5, }}>
						{top_text}
					</Typography>

					{top_text === "Base Cloud Access" && userdata.has_card_available === false ?
						<img
							src="/images/stripenew.png"
							style={{
								margin: "auto",
								width: 100,
								backgroundColor: "white",
								borderRadius: theme.palette?.borderRadius,
							}}
						/>
						: null}
					{isCloud && highlight === true && top_text !== "Base Cloud Access" ?
						<Tooltip
							title="Sign EULA"
							placement="top"
							style={{ zIndex: 10011 }}
						>
							<IconButton
								disabled={subscription.eula_signed}
								style={{ marginLeft: "auto", marginTop: 10, marginBottom: 10, flex: 1, }}
								onClick={() => {
									setSignatureOpen(true)
								}}
							>
								<DrawIcon />
							</IconButton>
						</Tooltip>
						: null}
				</div>
				<Divider />
				<div>
					<Typography variant="body1" style={{ marginTop: 20, }}>
						{subscription.name}
					</Typography>

					{subscription.currency_text !== undefined ?
						<div style={{ display: "flex", }}>
							<Typography variant="h6" style={{ marginTop: 10, }}>
								{subscription.currency_text}{subscription.price}
							</Typography>
							<Typography variant="body1" color="textSecondary" style={{ marginLeft: 10, marginTop: 15, marginBottom: 10 }}>
								/ {subscription.interval}
							</Typography>
						</div>
						: null}

					<Typography variant="body2" color="textSecondary" style={{ marginTop: 10, }}>
						Features
					</Typography>
					<ul>
						{subscription.features !== undefined && subscription.features !== null ?
							subscription.features.map((feature, index) => {
								var parsedFeature = feature
								if (feature.includes("Documentation: ")) {
									parsedFeature =
										<a
											href={feature.split("Documentation: ")[1]}
											target="_blank"
											style={{ textDecoration: "none", color: "#f85a3e", }}
										>
											Documentation to get started
										</a>
								}

								if (feature.includes("Worker License: ")) {
									const fieldId = "webhook_uri_field_" + index
									parsedFeature =
										<span style={{ marginTop: 10, }}>
											<Typography
												variant="body2"
											>
												Use the {feature.split("Worker License: ")[0]} Worker
											</Typography>
											<TextField
												value={feature.split("Worker License: ")[1]}
												style={{
													backgroundColor: theme.palette.textFieldStyle.backgroundColor,
													borderRadius: theme.palette?.textFieldStyle.borderRadius,
												}}
												id={fieldId}
												onClick={() => { }}
												InputProps={{
													endAdornment:
														<InputAdornment position="end">
															<IconButton
																aria-label="Copy webhook"
																onClick={() => {
																	var copyText = document.getElementById(fieldId);
																	if (copyText !== undefined && copyText !== null) {
																		console.log("NAVIGATOR: ", navigator);
																		const clipboard = navigator.clipboard;
																		if (clipboard === undefined) {
																			toast("Can only copy over HTTPS (port 3443)");
																			return;
																		}

																		navigator.clipboard.writeText(copyText.value);
																		copyText.select();
																		copyText.setSelectionRange(
																			0,
																			99999
																		); /* For mobile devices */

																		/* Copy the text inside the text field */
																		document.execCommand("copy");
																		toast("Copied Webhook URL");
																	} else {
																		console.log("Couldn't find webhook URI field: ", copyText);
																	}
																}}
																edge="end"
															>
																<ContentCopyIcon />
															</IconButton>
														</InputAdornment>
												}}
												fullWidth
											/>
										</span>
								}

								return (
									<li key={index}>
										<Typography variant="body2" color="textPrimary" style={{}}>
											{parsedFeature}
										</Typography>
									</li>
								)
							})
							: null}
					</ul>
				</div>
				{isCloud && (highlight === true && (subscription.name === "Pay as you go" && subscription.limit <= 10000) || subscription.name === "Open Source") ?
					<span>
						<Typography variant="body2" color="textSecondary" style={{ marginTop: 20, marginBottom: 10 }}>
							{subscription.name.includes("Scale") ?
								""
								:

								userdata.has_card_available === true ?
									"While you have a card attached to your account, Shuffle will no longer prevent workflows from running. Billing will occur at the start of each month."
									:
									isCloud ?
										`You are not subscribed to any plan and are using the free plan with max 10,000 app runs per month. Upgrade to deactivate this limit.`
										:
										`You are not subscribed to any plan and are using the free, open source plan. This plan has no enforced limits, but scale issues may occur due to CPU congestion.`
							}
						</Typography>
						<div style={{ display: 'flex', flexDirection: 'row' }}>
							<Typography variant="body2" style={{ marginTop: !userdata.has_card_available ? 5 : 0 }}>
								{BillingEmail?.length > 0 ? `Billing email: ${BillingEmail}` : null}
							</Typography>
							{userdata.has_card_available === true && (
								<Button
									variant="contained"
									onClick={handleClickOpen}
									onMouseOver={() => setIsMouseOverOnChangeEmail(true)}
									onMouseOut={() => setIsMouseOverOnChangeEmail(false)}
									style={{
										width: 'auto',
										height: 20,
										textTransform: 'none',
										marginLeft: 'auto',
										backgroundColor: 'transparent',
										color: '#f86743',
										boxShadow: 'none',
										border: 'none',
										cursor: 'pointer',
										transition: 'background-color 0.3s, color 0.3s',
									}}
								>
									Change
								</Button>
							)}
							<Dialog
								open={openChangeEmailBox}
								onClose={handleCloseChangeEmailBox}
								PaperProps={{
									sx: {
									  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
									  border: theme?.palette?.DialogStyle?.border,
									  minWidth: '440px',
									  fontFamily: theme?.typography?.fontFamily,
									  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
									  zIndex: 1000,
									  '& .MuiDialogContent-root': {
										backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
									  },
									  '& .MuiDialogTitle-root': {
										backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
									  },
									}
								  }}
							>
								<DialogTitle style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Change Billing Email</DialogTitle>
								<DialogContent>
									<DialogContentText style={{ marginBottom: '20px' }}>
										Enter the new billing email address.
									</DialogContentText>
									<TextField
										autoFocus
										margin="dense"
										id="email"
										label="New Billing Email"
										type="email"
										fullWidth
										value={newBillingEmail}
										onKeyPress={(event) => { if (event.key === 'Enter') HandleChangeBillingEmail(selectedOrganization.id) }}
										onChange={(e) => setNewBillingEmail(e.target.value)}
									/>
								</DialogContent>
								<DialogActions>
									<Button
										onClick={handleCloseChangeEmailBox}
										color="primary"
										style={{ textTransform: 'none', marginRight: '10px' }}
									>
										Cancel
									</Button>
									<Button
										color="primary"
										style={{ textTransform: 'none' }}
										onClick={(event) => HandleChangeBillingEmail(selectedOrganization.id)}
									>
										Save
									</Button>
								</DialogActions>
							</Dialog>
						</div>
						{/*isCloud ? 
								<Button 
									variant="contained" 
									color="primary" 
									style={{ marginTop: 20, marginBottom: 10, }}
									onClick={() => {
										window.open("https://checkout.stripe.com/c/pay/ppage_1O8UttDzMUgUjxHSBh3krC6Y#fidkdWxOYHwnPyd1blpxYHZxWkBhfWJOY3RoVEJdXDBPSW9hR3RxcG1GcjU1R01nbE5PQUcnKSdobGF2Jz9%2BJ2JwbGEnPydjY2M3MjA0NyhnYzcyKDFkMTQoPWFmPSgwYDI9MTA0NGAyZDNhPWZhNmcnKSdocGxhJz8nNWYwMjNnZGMoZGdgPCgxPDxhKD1kNjUoMjZmPTcxYzw9NjBjYzZmMGRnJykndmxhJz8nZGYxYWZhY2MoZ2FjNygxPDA2KDxhZ2MoZjY1PWM8NGcxYzUxMjJkYTRmJ3gpJ2dgcWR2Jz9eWCknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknd2BjYHd3YHdKd2xibGsnPydtcXF1PyoqaWpmZGltanZxPzY1NTcnKSdpamZkaWAnP2twaWl4JSUl")
									}}
								>
									Add Payment Method
								</Button>
							: null*/}

						<Button
							fullWidth
							disabled={false}
							variant="outlined"
							color="primary"
							style={{
								marginTop: !userdata.has_card_available ? 20 : 10,
								borderRadius: 4,
								height: 40,
								fontSize: 16,
								color: userdata.has_card_available ? "#ff8544" : "#1a1a1a",
								backgroundColor: userdata.has_card_available ? null : "#ff8544",
								// backgroundImage: userdata.has_card_available ? null : "linear-gradient(to right, #f86a3e, #f34079)",
								textTransform: "none",

							}}
							onClick={() => {
								if (isCloud) {
									handlePayasyougo(userdata, selectedOrganization, BillingEmail)
									//navigate("/pricing?tab=cloud&highlight=true")
								} else {
									//window.open("https://shuffler.io/pricing?tab=onprem&highlight=true", "_blank")
									handlePayasyougo()
								}
							}}
						>
							{userdata.has_card_available === true ?
								"Manage Card Details"
								:
								"Add Card Details"
							}
						</Button>

						{userdata.has_card_available === true ?
							<Button
								fullWidth
								disabled={false}
								variant="outlined"
								color="primary"
								style={{
									marginTop: 10,
									borderRadius: 4,
									height: 40,
									fontSize: 16,
									color: "#1a1a1a",
									backgroundColor: "#ff8544",
									textTransform: 'none'
								}}
								onClick={() => {
									if (isCloud) {
										navigate("/pricing?tab=cloud&highlight=true")
									} else {
										window.open("https://shuffler.io/pricing?tab=onprem&highlight=true", "_blank")
									}
								}}
							>
								Upgrade plan
							</Button>
							: null}

					</span>
				: null}

				{/* {showSupport ?
					<Button variant="outlined" color="primary" style={{ marginTop: 20, marginBottom: 10, }} onClick={() => {
						if (window.drift !== undefined) {
							//window.drift.api.startInteraction({ interactionId: 340045 })
							window.drift.api.startInteraction({ interactionId: 340043 })
						} else {
							navigate("/contact")
						}
					}}>
						Get Support
					</Button>
					: null} */}
			</div>
		)
	}
	const ConsultationManagement = (props) => {
		const { globalUrl, userdata, selectedOrganization, } = props;

		const [inputHour, setInputHour] = React.useState(
			selectedOrganization.Billing &&
				selectedOrganization.Billing.Consultation &&
				selectedOrganization.Billing.Consultation.hours !== undefined &&
				selectedOrganization.Billing.Consultation.hours !== ""
				? selectedOrganization.Billing.Consultation.hours
				: 0
		);

		const [inputMinutes, setInputMinutes] = React.useState(
			selectedOrganization.Billing &&
				selectedOrganization.Billing.Consultation &&
				selectedOrganization.Billing.Consultation.minutes !== undefined &&
				selectedOrganization.Billing.Consultation.minutes !== ""
				? selectedOrganization.Billing.Consultation.minutes
				: 0
		);

		const [editConsultation, setEditConsultation] = React.useState(false);
		const [openUpgradePlan, setOpenUpgradePlan] = React.useState(false);
		const [consultationHours, setConsultationHours] = React.useState(1);
		const [message, setMessage] = React.useState("");
		const [hovered, setHovered] = React.useState(false)
		const [getProfessionalServices, setGetProfessionalServices] = React.useState(false)
		const [clickOnBuy, setClickOnBuy] = React.useState(false)

		const formatedHours = String(inputHour).padStart(2, "0")
		const formatedMinutes = String(inputMinutes).padStart(2, "0")

		const handleHourChange = (event) => {
			setInputHour(parseInt(event.target.value, 10));
		};

		const handleMinuteChange = (event) => {
			setInputMinutes(parseInt(event.target.value, 10));
		};
		const toggleEditMode = () => {
			setEditConsultation(!editConsultation);
		};

		const handleCancel = () => {
			setEditConsultation(false);
		};

		const handleSave = () => {

			toast("Saving consultation hours. Please wait.")

			const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}`;
			const data = {
				org_id: selectedOrganization.id,
				name: selectedOrganization.name,
				description: selectedOrganization.description,
				image: selectedOrganization.image,
				defaults: selectedOrganization.defaults,
				sso_config: selectedOrganization.sso_config,
				mfa_required: selectedOrganization.mfa_required,
				Billing: {
					Consultation: {
						hours: String(inputHour),
						minutes: String(inputMinutes),
					},
					AlertThreshold: selectedOrganization.Billing.AlertThreshold,
					email: selectedOrganization.Billing.email,
				}
			};

			fetch(url, {
				body: JSON.stringify(data),
				mode: "cors",
				method: "POST",
				credentials: "include",
				crossDomain: true,
				withCredentials: true,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			})
				.then((response) => {
					if (response.status !== 200) {
						console.log("Error in response");
					}
					return response.json();
				})
				.then((responseJson) => {
					if (responseJson.success === true) {
						toast.success("Consultation hours saved successfully");
						setEditConsultation(false);
					} else {
						toast.error("Failed saving consultation hours.");
					}
					if (inputHour > 0 || inputMinutes > 0) {
						setGetProfessionalServices(true)
					} else {
						setGetProfessionalServices(false)
					}
				})
				.catch((error) => {
					console.log("Error: ", error);
				});
		}

		const handleUpgradeConsultation = () => {

			toast("Sending request for consultation hours. Please wait.")

			const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}/consultation`;
			const data = {
				org_id: selectedOrganization.id,
				consultationHours: String(consultationHours),
				message: message,
			};

			fetch(url, {
				body: JSON.stringify(data),
				mode: "cors",
				method: "POST",
				credentials: "include",
				crossDomain: true,
				withCredentials: true,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			})
				.then((response) => {
					if (response.status !== 200) {
						console.log("Error in response");
					}
					return response.json();
				})
				.then((responseJson) => {
					if (responseJson.success === true) {
						toast.success("Thank you for your request. We will get back to you soon.");
						setOpenUpgradePlan(false);
						setEditConsultation(false);
					} else {
						toast.error("Failed sending consultation hours request. Please try again later.");
					}
				})
				.catch((error) => {
					console.log("Error: ", error);
				});
		}

		useEffect(() => {
			if (inputHour !== undefined && inputMinutes !== undefined && inputHour > 0 || inputMinutes > 0) {
				setGetProfessionalServices(true)
			} else {
				setGetProfessionalServices(false)
			}
		})

		return (
			<div style={{
				padding: 20,
				// maxWidth: 400,
				width: "100%",
				height: 500,
				backgroundColor: hovered ? theme.palette.cardHoverColor : theme.palette.cardBackgroundColor,
				borderRadius: theme.palette?.borderRadius * 2,
				border: "1px solid rgba(255,255,255,0.3)",
				marginRight: 10,
					marginTop: 15,
			}}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}>
				<Typography variant="h6" style={{ marginTop: 10, marginBottom: 10, }}>
					Professional Services
				</Typography>
				<Divider />
				<Typography variant="body1" style={{ marginTop: 10, }}>
					Consultation & Management
				</Typography>
				<div>
					<Typography variant="body2" color="textSecondary" style={{ marginTop: userdata.support ? 5 : 10, }}>
						You currently have a total of {inputHour} hours and {inputMinutes} minutes of professional services available by our experts.
					</Typography>
					<div style={{ display: "flex", minWidth: 340, justifyContent: 'center', marginTop: userdata.support ? 0 : 15 }}>
						{editConsultation ?
							<>
								<TextField
									type="number"
									value={formatedHours}
									onChange={handleHourChange}
									style={{ width: 60, marginRight: 10 }}
									inputProps={{ min: 0, max: 23 }}
								/>
								<span style={{ margin: "auto 0" }}>:</span>
								<TextField
									type="number"
									value={formatedMinutes}
									onChange={handleMinuteChange}
									style={{ width: 60, marginLeft: 10 }}
									inputProps={{ min: 0, max: 59 }}
								/>
							</>
							:
							<Typography variant="h3" style={{ marginTop: 10, }}>
								{`${formatedHours}h:${formatedMinutes}m`}
							</Typography>}
					</div>
					{userdata.support === true ?
						<div style={{ display: "flex", marginTop: 20, }}>
							{editConsultation ? (
								<Button
									variant="contained"
									color="primary"
									onClick={handleCancel}
									style={{ textTransform: 'none' }}
								>
									Cancel
								</Button>
							) : (
								<Button
									variant="outlined"
									color="primary"
									onClick={toggleEditMode}
									style={{ textTransform: 'none' }}
								>
									Edit
								</Button>
							)}
							{editConsultation && <Button variant="contained" color="primary" style={{ marginLeft: 5, textTransform: 'none' }} onClick={handleSave}>Save</Button>}
						</div>
						: null}
					<Typography variant="body2" color="textSecondary" style={{ marginTop: userdata.support ? 5 : 25, }}>
						Features
					</Typography>
					<ul>
						<li style={{color : theme.palette.text.primary}}>
							<Typography variant="body2" color="textPrimary" style={{}}>
								Build custom apps, integrations, and worklows for your specific use cases or applications
							</Typography>
						</li>
						<li style={{color : theme.palette.text.primary}}>
							<Typography variant="body2" color="textPrimary" style={{}}>
								Help solve / debug / update / add features and capabilities of the platform
							</Typography>
						</li>
					</ul>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 20 }}>
					<Button
						fullWidth
						disabled={false}
						variant="contained"
						color="primary"
						style={{
							marginTop: userdata.support ? 3 : 15,
							borderRadius: 4,
							height: 40,
							fontSize: 16,
							textTransform: 'none',
						}}
						onClick={() => {
							if (Cloud) {
								ReactGA.event({
									category: "Billing",
									action: "Buy_consultation_hours",
								});
							}
							setClickOnBuy(true)
						}}
					>
						Buy
					</Button>
					<Dialog open={clickOnBuy} onClose={() => { setClickOnBuy(false) }} PaperProps={{
                    sx: {
                      borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                      border: theme?.palette?.DialogStyle?.border,
                      minWidth: '440px',
                      fontFamily: theme?.typography?.fontFamily,
                      backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                      zIndex: 1000,
                      '& .MuiDialogContent-root': {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                      },
                      '& .MuiDialogTitle-root': {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                      },
                    }
                  }}>
						<Typography variant="body1" style={{ paddingTop: 10, textAlign: 'center', padding: 20, fontSize: 18, backgroundColor: theme?.palette?.DialogStyle?.backgroundColor }}>
							You will be taken to Stripe to book professional service hours. You can adjust the number of hours on the left side of the Stripe page.
						</Typography>
						<DialogContent>
							<Button
								variant="contained"
								color="primary"
								style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', padding: '12px 24px', textTransform: 'none', fontSize: 16, color: "#1a1a1a", backgroundColor: "#ff8544" }}
								onClick={() => {
									if (Cloud) {
										ReactGA.event({
											category: "Billing",
											action: "Buy_consultation_hours",
										})
									}

									const url = userdata.licensed === true
										? "https://buy.stripe.com/aEU3fk17o0L092g5kt"
										: "https://buy.stripe.com/aEU3fk17o0L092g5kt"
									window.open(url, "_blank")
								}}
							>
								Book Professional Service Hours
							</Button>

						</DialogContent>
					</Dialog>
					<Tooltip title={!getProfessionalServices ? "Please buy the consultation hours to get this professional service" : ""}>
						<span>
							<Button
								fullWidth
								disabled={!getProfessionalServices}
								variant="outlined"
								color="primary"
								style={{
									marginTop: userdata.support ? 10 : 15,
									borderRadius: 4,
									height: 40,
									fontSize: 16,
									textTransform: 'none',
									cursor: getProfessionalServices ? 'pointer' : 'not-allowed',
									opacity: getProfessionalServices ? 1 : 0.6,
								}}
								onClick={() => {
									if (getProfessionalServices) {
										setOpenUpgradePlan(true);
									}
								}}
							>
								Use Professional Service Hours
							</Button>
						</span>
					</Tooltip>
				</div>
				<Dialog open={openUpgradePlan}
					onClose={() => setOpenUpgradePlan(false)}
					fullWidth
					style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
					PaperProps={{
						sx: {
						  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
						  border: theme?.palette?.DialogStyle?.border,
						  minWidth: '440px',
						  fontFamily: theme?.typography?.fontFamily,
						  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
						  zIndex: 1000,
						  '& .MuiDialogContent-root': {
							backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
						  },
						  '& .MuiDialogTitle-root': {
							backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
						  },
						}
					  }}
				>
					<DialogTitle style={{ paddingTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
						Upgrade Consultation Plan
					</DialogTitle>
					<DialogContent style={{ padding: '24px', }}>
						<Typography variant="body1" color="textSecondary" style={{ marginBottom: '16px', textAlign: 'left' }}>
							Enter the total hours of consultation you want.
						</Typography>
						<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
							<Slider
								value={consultationHours}
								onChange={(e, val) => setConsultationHours(val)}
								aria-labelledby="continuous-slider"
								step={1}
								min={1}
								max={(inputHour === "0" && inputMinutes > 0) ? 1 : inputHour}
								style={{ width: '80%', color: theme.palette.primary.main }}
								marks
								valueLabelDisplay="auto"
							/>

						</div>
						<Typography variant="body1" color="textSecondary" style={{ marginTop: '24px', textAlign: 'left' }}>
							If you have any additional requirements or questions, please leave a message below.
						</Typography>
						<TextField
							variant="outlined"
							fullWidth
							multiline
							rows={4}
							placeholder="What kind of services are you looking for?"
							style={{ marginTop: '16px', borderRadius: '8px' }}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<Button
							variant="contained"
							color="primary"
							style={{ marginTop: '24px', borderRadius: 4, color: "#1a1a1a", backgroundColor: "#ff8544",fontSize: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto', padding: '12px 24px', textTransform: 'none' }}
							onClick={handleUpgradeConsultation}
						>
							Submit Request for {consultationHours} hours
						</Button>
					</DialogContent>
				</Dialog>
			</div >
		)
	}

	const TrainingService = () => {

		const [hovered, setHovered] = React.useState(false)
		const [openPrivateTraining, setOpenPrivateTraining] = React.useState(false)
		const [PrivateTrainingMember, setPrivateTrainingMember] = React.useState(5)
		const [message, setMessage] = React.useState("");

		const handlePrivateTraining = () => {

			toast("Submitting your request for private training. Please wait...")

			const data = {
				org_id: selectedOrganization.id,
				trainingMembers: String(PrivateTrainingMember),
				message: message
			}

			const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}/privateTraining`

			fetch(url, {
				body: JSON.stringify(data),
				mode: "cors",
				method: "POST",
				credentials: "include",
				crossDomain: true,
				withCredentials: true,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
			}).then((response) => {
				if (response.status !== 200) {
					console.log("Error in response");
				}
				return response.json();
			}).then((responseJson) => {
				if (responseJson.success === true) {
					toast.success("Your request for private training has been submitted successfully. We will get back to you soon.")
					setOpenPrivateTraining(false)
				} else {
					toast.error(`Failed sending request for private training. Please try again later or contact support@shuffler.io for help.`)
				}
			})
		}

		return (
			<div
				style={{
					padding: 20,
					height: 500,
					// maxWidth: 400,
					width: "100%",
					backgroundColor: hovered ? theme.palette.cardHoverColor : theme.palette.cardBackgroundColor,
					borderRadius: theme.palette?.borderRadius * 2,
					border: "1px solid rgba(255,255,255,0.3)",
					marginRight: 10,
					marginTop: 15,
				}}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<Typography variant="h6" style={{ marginTop: 10, marginBottom: 10, }}>
					Training
				</Typography>
				<Divider />
				<Typography variant="body1" style={{ marginTop: 10, }}>
					Become a Shuffle Expert
				</Typography>
				<div>
					<Typography variant="body2" color="textSecondary" style={{ marginTop: 25, }}>
						Public Training
					</Typography>
					<ul>
						<li style={{color : theme.palette.text.primary}}>
							<Typography variant="body2" color="textPrimary">
								Public course on Automation for Security Professionals
							</Typography>
						</li>
						<li style={{color : theme.palette.text.primary}}>
							<Typography variant="body2" color="textPrimary">
								Covers Shuffle Platform, Apps, Workflows, Usecases, JSON, Liquid Formatting, and more.
							</Typography>
						</li>
					</ul>
					<Typography variant="body2" color="textSecondary" style={{ marginTop: 20, }}>
						Private Training
					</Typography>
					<ul>
						<li style={{color : theme.palette.text.primary}}>
							<Typography variant="body2" color="textPrimary">
								Everything from Public Training
							</Typography>
						</li>
						<li style={{color : theme.palette.text.primary}}>
							<Typography variant="body2" color="textPrimary" >
								Customized for your team’s usecases, date and time, location, and more.
							</Typography>
						</li>
					</ul>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 30, }}>
					<Button
						fullWidth
						disabled={false}
						variant="contained"
						color="primary"
						style={{
							marginTop: 10,
							borderRadius: 4,
							height: 40,
							fontSize: 16,
							textTransform: 'none',
							width: "100%",
						}}
						onClick={() => {
							if (Cloud) {
								ReactGA.event({
									category: "Billing",
									action: "click_public_training_button",
									label: "Public Training",
									userId: userdata?.id
								});
							}
							navigate("/training")
						}}
					>
						Public Training
					</Button>
					<Button
						fullWidth
						disabled={false}
						variant="outlined"
						color="primary"
						style={{
							marginTop: 10,
							borderRadius: 4,
							height: 40,
							fontSize: 16,
							textTransform: 'none',
							width: "100%",
						}}
						onClick={() => {
							if (Cloud) {
								ReactGA.event({
									category: "Billing",
									action: "click_private_training_button",
									label: "Private Training",
									userId: userdata?.id,
								});
							}
							setOpenPrivateTraining(true);
						}}
					>
						Private Training
					</Button>

					<Dialog open={openPrivateTraining}
						onClose={() => setOpenPrivateTraining(false)}
						fullWidth
						style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
						PaperProps={{
							sx: {
							  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
							  border: theme?.palette?.DialogStyle?.border,
							  minWidth: '440px',
							  fontFamily: theme?.typography?.fontFamily,
							  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
							  zIndex: 1000,
							  '& .MuiDialogContent-root': {
								backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
							  },
							  '& .MuiDialogTitle-root': {
								backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
							  },
							}
						  }}
					>
						<DialogTitle style={{ paddingTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
							Private Training
						</DialogTitle>
						<DialogContent style={{ padding: '24px', }}>
							<Typography variant="body1" color="textSecondary" style={{ marginBottom: '16px', textAlign: 'left' }}>
								Enter the total members for private training. Minimum 5 members required.
							</Typography>
							<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
								<Slider
									value={PrivateTrainingMember}
									onChange={(e, val) => setPrivateTrainingMember(val)}
									aria-labelledby="continuous-slider"
									step={1}
									min={5}
									max={50}
									style={{ width: '80%', color: theme.palette.primary.main }}
									marks
									valueLabelDisplay="auto"
								/>

							</div>
							<Typography variant="body1" color="textSecondary" style={{ marginTop: '24px', textAlign: 'left' }}>
								If you have any additional requirements or questions, please leave a message below.
							</Typography>
							<TextField
								variant="outlined"
								fullWidth
								multiline
								rows={4}
								placeholder="Your message"
								style={{ marginTop: '16px', borderRadius: '8px' }}
								onChange={(e) => setMessage(e.target.value)}
							/>
							<Button
								variant="contained"
								color="primary"
								style={{ marginTop: '24px', fontSize: 16, display: 'block', marginLeft: 'auto', marginRight: 'auto', padding: '12px 24px', textTransform: 'none', color: "#1a1a1a", backgroundColor: "#ff8544" }}
								onClick={handlePrivateTraining}
							>
								Submit Request
							</Button>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		)
	}

	const addDealModal = (
		<Dialog
			open={selectedDealModalOpen}
			onClose={() => {
				setSelectedDealModalOpen(false);
			}}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.surfaceColor,
					color: "white",
					minWidth: "800px",
					minHeight: "320px",
				},
			}}
		>
			<DialogTitle style={{ maxWidth: 450, margin: "auto" }}>
				<span style={{ color: "white" }}>Register new deal</span>
			</DialogTitle>
			<DialogContent>
				<div style={{ display: "flex" }}>
					<TextField
						style={{
							marginTop: 0,
							backgroundColor: theme.palette.inputColor,
							flex: 3,
							marginRight: 10,
						}}
						InputProps={{
							style: {
								height: 50,
								color: "white",
							},
						}}
						color="primary"
						required
						fullWidth={true}
						placeholder="Name"
						type="text"
						id="standard-required"
						autoComplete="username"
						margin="normal"
						label="Name"
						variant="outlined"
						defaultValue={dealName}
						onChange={(e) => {
							setDealName(e.target.value);
						}}
					/>
					<TextField
						style={{
							marginTop: 0,
							backgroundColor: theme.palette.inputColor,
							flex: 3,
							marginRight: 10,
						}}
						InputProps={{
							style: {
								height: 50,
								color: "white",
							},
						}}
						color="primary"
						required
						fullWidth={true}
						placeholder="Address"
						label="Address"
						type="text"
						id="standard-required"
						autoComplete="username"
						margin="normal"
						variant="outlined"
						defaultValue={dealAddress}
						onChange={(e) => {
							setDealAddress(e.target.value);
						}}
					/>
				</div>
				<div style={{ display: "flex", marginTop: 10 }}>
					<TextField
						style={{
							marginTop: 0,
							backgroundColor: theme.palette.inputColor,
							flex: 1,
							marginRight: 10,
						}}
						InputProps={{
							style: {
								height: 50,
								color: "white",
							},
						}}
						color="primary"
						required
						fullWidth={true}
						placeholder="1000"
						label="Value (USD)"
						type="text"
						id="standard-required"
						margin="normal"
						variant="outlined"
						defaultValue={dealValue}
						onChange={(e) => {
							setDealValue(e.target.value);
						}}
					/>
					<Autocomplete
						id="country-select"
						sx={{ width: 250 }}
						options={countries}
						variant="outlined"
						autoHighlight
						getOptionLabel={(option) => option.label}
						onChange={(event, newValue) => {
							setDealCountry(newValue.label);
						}}
						renderOption={(props, option) => (
							<Box
								component="li"
								sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
								{...props}
							>
								<img
									loading="lazy"
									width="20"
									src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
									srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
									alt=""
								/>
								{option.label} ({option.code}) +{option.phone}
							</Box>
						)}
						renderInput={(params) => (
							<TextField
								{...params}
								style={{
									backgroundColor: theme.palette.inputColor,
									flex: 1,
									marginTop: 0,
									marginRight: 10,
								}}
								variant="outlined"
								label="Choose a country"
								defaultValue={dealCountry}
								inputProps={{
									...params.inputProps,
									autoComplete: "new-password", // disable autocomplete and autofill
								}}
							/>
						)}
					/>
					<Autocomplete
						id="product-select"
						sx={{ width: 250 }}
						options={products}
						variant="outlined"
						autoHighlight
						onChange={(event, newValue) => {
							setDealType(newValue);
						}}
						getOptionLabel={(option) => option.label}
						renderOption={(props, option) => (
							<Box
								component="li"
								sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
								{...props}
							>
								{option.label}
							</Box>
						)}
						renderInput={(params) => (
							<TextField
								{...params}
								style={{
									backgroundColor: theme.palette.inputColor,
									flex: 1,
									marginTop: 0,
								}}
								variant="outlined"
								label="Choose a product"
								defaultValue={dealType}
								inputProps={{
									...params.inputProps,
									autoComplete: "new-password", // disable autocomplete and autofill
								}}
							/>
						)}
					/>
				</div>
				{dealerror.length > 0 ? (
					<Typography
						variant="body1"
						color="textSecondary"
						style={{ margin: 10 }}
					>
						error registering: {dealerror}
					</Typography>
				) : null}
				<div style={{ display: "flex", width: 300, margin: "auto" }}>
					<Button
						style={{ maxHeight: 50, flex: 1, margin: 5 }}
						variant="outlined"
						color="secondary"
						disabled={false}
						onClick={() => {
							setSelectedDealModalOpen(false);

							//setDealName("")
							//setDealAddress("")
							//setDealCountry("")
							//setDealValue("")
						}}
					>
						Cancel
					</Button>
					<Button
						style={{ maxHeight: 50, flex: 1, margin: 5 }}
						variant="contained"
						color="primary"
						disabled={
							dealName.length <= 3 ||
							dealAddress.length <= 3 ||
							dealCountry.length === 0 ||
							dealValue.length === 0 ||
							dealType.length === 0
						}
						onClick={() => {
							submitDeal(dealName, dealAddress, dealCountry, dealValue);
						}}
					>
						Submit
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);

	const submitDeal = (dealName, dealAddress, dealCountry, dealValue) => {
		if (dealerror.length > 0) {
			setDealerror("");
		}

		const orgId = selectedOrganization.id;
		const data = {
			reseller_org: orgId,
			name: dealName,
			address: dealAddress,
			country: dealCountry,
			value: dealValue,
		};

		const url = `${globalUrl}/api/v1/orgs/${orgId}/deals`;
		fetch(url, {
			mode: "cors",
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
			crossDomain: true,
			withCredentials: true,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		})
			.then(function (response) {
				if (response.status !== 200) {
					console.log("Error in response");
				}

				return response.json();
			})
			.then(function (responseJson) {
				if (responseJson.success === true) {
					setSelectedDealModalOpen(false);
					toast(
						"Added new deal! We will be in touch shortly with an update."
					);

					setDealName("");
					setDealAddress("");
					setDealValue("");
					setDealCountry("United States");
					setDealType("MSSP");
				} else {
					setDealerror(responseJson.reason);
				}
			})
			.catch(function (error) {
				//console.log("Error: ", error);
				setDealerror(error.toString());
				toast("Failed adding deal reg: ", error);
			});
	};
	const addAlertThreshold = () => {
		setAlertThresholds([...alertThresholds, { percentage: '', count: '', Email_send: false }]);
	};

	const updateAlertThreshold = (index, field, value) => {

		const totalValue = userdata.app_execution_limit;
		const newAlertThresholds = alertThresholds.map((threshold, i) => {
			if (i === index) {
				const newValue = parseFloat(value);
				if (field === 'percentage') {
					const newCount = (newValue / 100) * totalValue;
					return {
						...threshold,
						percentage: isNaN(newValue) ? '' : Math.round(newValue),
						count: isNaN(newCount) ? '' : Math.round(newCount),
						Email_send: false
					};
				} else if (field === 'count') {
					const newPercentage = (newValue / totalValue) * 100;
					return {
						...threshold,
						count: newValue,
						percentage: isNaN(newPercentage) ? '' : Math.round(newPercentage),
						Email_send: false
					};
				}
			}
			return threshold;
		});
		setAlertThresholds(newAlertThresholds);
	};


	const handleDeleteAlertThreshold = (index) => {
		const newAlertThresholds = alertThresholds.filter((_, i) => i !== index);
		setAlertThresholds(newAlertThresholds);

		// Update currentIndex based on remaining elements
		const findCurrentIndex = newAlertThresholds.some(threshold => threshold.Email_send === false);
		setCurrentIndex(findCurrentIndex ? newAlertThresholds.findIndex(threshold => threshold.Email_send === false) : - 1);
		toast.info("Alert Threshold deleted successfully. Don't forget to save your changes.");
	};
	const HandleEditOrgForAlertThreshold = (orgId) => {

		// Use the `some` method to check for invalid counts
		const invalidCount = alertThresholds.some((threshold) => {
			if (threshold.count === '') {
				toast("Please enter a valid Count or Percentage value");
				return true; // Stop checking further and return true if invalid
			}
			return false;
		});

		// If any invalid count is found, return early
		if (invalidCount) {
			return;
		}

		toast("Updating Email Alert Threshold. Please wait...");

		const data = {
			org_id: orgId,
			name: selectedOrganization?.name,
			description: selectedOrganization?.description,
			image: selectedOrganization?.image,
			defaults: selectedOrganization?.defaults,
			sso_config: selectedOrganization?.sso_config,
			mfa_required: selectedOrganization?.mfa_required,
			billing: {
				email: BillingEmail,
				AlertThreshold: alertThresholds.map(threshold => ({
					...threshold,
					percentage: parseInt(threshold.percentage, 10),
					count: parseInt(threshold.count, 10),
				})),
				Consultation: selectedOrganization?.billing?.Consultation,
			},
		};

		const url = `${globalUrl}/api/v1/orgs/${orgId}`;
		fetch(url, {
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Bad status code in get org:", response.status);
				}
				return response.json();
			}).then((responseJson) => {
				console.log("Got org:", responseJson);
				if (responseJson.success === true) {
					toast.success("Successfully updated Email Alert Thresholds");
					const findCurrentIndex = alertThresholds.some(threshold => threshold.Email_send === false);
					setCurrentIndex(findCurrentIndex ? alertThresholds.findIndex(threshold => threshold.Email_send === false) : - 1);
				} else {
					toast.error("Failed to update Email Alert Thresholds. Please try again.");
				}
			})
			.catch((error) => {
				console.log("Error getting org:", error);
			});
	};

	const getSafeValue = (value) => {

		if (value === undefined || value === null || isNaN(value)) {
			return 0;
		} else {
			return value;
		}
	};

	const isChildOrg = userdata?.active_org?.creator_org !== "" && userdata?.active_org?.creator_org !== undefined && userdata?.active_org?.creator_org !== null
	
	return (
		<Wrapper clickedFromOrgTab={clickedFromOrgTab}>
			<div style={{ height: "100%", width: "100%"}}>
				<div style={{ width: "100%",}}>
				{addDealModal}
			{clickedFromOrgTab ?
				<Typography variant="h5" style={{fontSize: 24, fontWeight: 500, marginBottom: 8, marginTop: 0, }}>Billing & Licensing</Typography> :
				<Typography variant="h4" style={{ marginTop: 20, marginBottom: 10 }}>
					Billing	& Licensing
				</Typography>}
			{userdata?.org_status?.includes("integration_partner") && userdata?.org_status?.includes("sub_org") ? null : 
			<>
				{clickedFromOrgTab ?
				<Typography variant="body2" color="textSecondary" style={{ fontSize: 16 }}>{isCloud ?
					"Get more out of Shuffle by adding your credit card, such as no App Run limitations, and priority support from our team. We use Stripe to manage subscriptions and do not store any of your billing information. You can manage your subscription and billing information below."
					:
					"Shuffle is an Open Source automation platform, and no license is required. We do however offer a Scale license with HA guarantees, along with support hours. By buying a license on https://shuffler.io, you can get access to the license immediately, and if Cloud Syncronisation is enabled, the UI in your local instance will also update."
				}</Typography> :
				<Typography variant="body1" color="textSecondary" style={{ marginTop: 0, marginBottom: 10, fontSize: 16 }}>
					{isCloud ?
						"Get more out of Shuffle by adding your credit card, such as no App Run limitations, and priority support from our team. We use Stripe to manage subscriptions and do not store any of your billing information. You can manage your subscription and billing information below."
						:
						"Shuffle is an Open Source automation platform, and no license is required. We do however offer a Scale license with HA guarantees, along with support hours. By buying a license on https://shuffler.io, you can get access to the license immediately, and if Cloud Syncronisation is enabled, the UI in your local instance will also update."
					}
				</Typography>}
			</>  }

			{userdata.support === true ?
				<Typography style={{ marginBottom: 10, marginTop: clickedFromOrgTab ? 16 : null, color: clickedFromOrgTab ? theme.palette.text.primary : null }}>
					For sales: Create&nbsp;
					<a href={"https://docs.google.com/document/d/1N-ZJNn8lWaqiXITrqYcnTt53oXGLNYFEzc5PU-tdAps/copy"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#FF8444" }}>
						EU contract
					</a>
					&nbsp;or&nbsp;
					<a href={"https://docs.google.com/document/d/1cF-Cwxt1TcahlLrpl1GH2hFZO4gxppLeYjHW6QB0EzQ/copy"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#FF8444" }}>
						NOT EU contract
					</a>
					&nbsp; - &nbsp;
					<a href={"https://drive.google.com/drive/folders/1zVvwwkbQXW3p-DJYa0GBDzFo_ZnV_I_5"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#FF8444" }}>
						Google Drive Link
					</a>
					&nbsp; - &nbsp;
					<a href={"https://github.com/Shuffle/Shuffle-docs/tree/master/handbook/Sales"} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#FF8444" }}>
						Sales Process (old)
					</a>
				</Typography>
				:
				null
			}


			{isChildOrg ?
				<Typography variant="h6" style={{ marginBottom: 50, }}>
					Licensing is handled by your parent organisation. Reach out to {supportEmail} if you have questions about this.
				</Typography>
				: null}

			<div style={{ display: "flex", width: clickedFromOrgTab ? "100%" : "auto", overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'thin', scrollbarColor: theme.palette.scrollbarColor, height: isChildOrg ? 0 : "100%", marginTop: 20}} >
				<div style={{ display: "flex", flexDirection: "column", width: "100%",  }}>
				{/* {isCloud &&
					selectedOrganization.subscriptions !== undefined &&
					selectedOrganization.subscriptions !== null &&
					selectedOrganization.subscriptions.length > 0 &&
					!isChildOrg ?
					selectedOrganization.subscriptions
						.reverse()
						.map((sub, index) => {
							return (
									<SubscriptionObject
									index={index + 1}
									globalUrl={globalUrl}
									userdata={userdata}
									serverside={serverside}
									billingInfo={billingInfo}
									stripeKey={stripeKey}
									selectedOrganization={selectedOrganization}
									subscription={sub}
									highlight={true}
								/>
							)
						})
					: null} */}
				
				<div style={{ display: "flex", flexDirection: "row", width: "100%", marginTop: 20, marginBottom: 20, maxWidth: 860, }}>
				{isCloud && billingInfo.subscription !== undefined && billingInfo.subscription !== null ? isChildOrg ? null :
					<LicencePopup
					serverside={serverside}
					removeCookie={removeCookie}
					isLoaded={isLoaded}
					isLoggedIn={isLoggedIn}
					globalUrl={globalUrl}
					selectedOrganization={selectedOrganization}
					billingInfo={billingInfo}
					isCloud={isCloud}
					userdata={userdata}
					stripeKey={stripeKey}
					isScale={isScale}
					features={selectedOrganization?.sync_features}
					{...props}
					/>
					: !isCloud ?
						<span style={{ display: "flex", }}>
							{/* <SubscriptionObject
								index={0}
								globalUrl={globalUrl}
								userdata={userdata}
								serverside={false}
								billingInfo={undefined}
								selectedOrganization={selectedOrganization}
								subscription={{
									name: "Open Source",
									limit: 0,
									features: [
										"Unlimited app runs/month, but may be slow. Only limited by CPU.",
										"Multi-Tenancy",
										"Single-Sign-On",
										"Cloud Sync",
									],
								}}
								highlight={true}
							/> */}
							<LicencePopup
								{...props}
							  	serverside={serverside}
								removeCookie={removeCookie}
								isLoaded={isLoaded}
								isLoggedIn={isLoggedIn}
								globalUrl={globalUrl}
								selectedOrganization={selectedOrganization}
								billingInfo={billingInfo}
								isCloud={isCloud}
								userdata={userdata}
								features={selectedOrganization?.sync_features}
								stripeKey={stripeKey}
								isScale={isScale}
							/>	

							{/* <SubscriptionObject
								index={1}
								globalUrl={globalUrl}
								userdata={userdata}
								serverside={false}
								billingInfo={undefined}
								selectedOrganization={selectedOrganization}
								subscription={{
									name: "Scale",
									limit: 0,
									features: [
										"All Open Source features",
										"Scale License. Runs faster, and across multiple servers.",
										"Priority Support",
										"Workflow & App development help",
									],
								}}
								highlight={false}
							/> */}
						</span>
						: null}
						</div>
				</div>

				{/*
									<Grid item key={index} xs={12/selectedOrganization.subscriptions.length}>
										<Card
											elevation={6}
											style={
												paperStyle
											}
										>
											<b>Quantity</b>: {sub.level}
											<div />
											<b>Recurrence</b>: {sub.recurrence}
											<div />
											{sub.active ? (
												<div>
													<b>Started</b>:{" "}
													{new Date(sub.startdate * 1000).toISOString()}
													<div />
													<Button
														variant="outlined"
														color="secondary"
														style={{ marginTop: 15 }}
														onClick={() => {
															cancelSubscriptions(sub.reference);
														}}
													>
														Cancel subscription
													</Button>
												</div>
											) : (
												<div>
													<b>Cancelled</b>:{" "}
													{new Date(
														sub.cancellationdate * 1000
													).toISOString()}
													<div />
													<Typography color="textSecondary">
														<b>Status</b>: Deactivated
													</Typography>
												</div>
											)}
										</Card>
									</Grid>
									*/}
			</div>

			{/*isCloud &&
						selectedOrganization.partner_info !== undefined &&
						selectedOrganization.partner_info.reseller === true ? (
              <div style={{ marginTop: 30, marginBottom: 200 }}>
                <Typography
                  style={{ marginTop: 40, marginLeft: 10, marginBottom: 5 }}
                  variant="h6"
                >
                  Reseller dashboard
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ margin: 15 }}
                  onClick={() => {
                    setSelectedDealModalOpen(true);
                  }}
                >
                  Add deal
                </Button>
                <Button
                  style={{ marginLeft: 5, marginRight: 15 }}
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleGetDeals(userdata.active_org.id);
                  }}
                >
                  <CachedIcon />
                </Button>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Name"
                      style={{
                        minWidth: 200,
                        maxWidth: 200,
                      }}
                    />
                    <ListItemText
                      primary="Status"
                      style={{ minWidth: 150, maxWidth: 150, marginLeft: 5 }}
                    />
                    <ListItemText
                      primary="Value"
                      style={{ minWidth: 125, maxWidth: 125 }}
                    />
                    <ListItemText
                      primary="Discount"
                      style={{ minWidth: 100, maxWidth: 100 }}
                    />

                    <ListItemText
                      primary="Address"
                      style={{
                        marginleft: 10,
                        minWidth: 100,
                        maxWidth: 100,
                        overflow: "hidden",
                      }}
                    />
                    <ListItemText
                      primary="Country"
                      style={{
                        marginleft: 10,
                        minWidth: 100,
                        maxWidth: 100,
                        overflow: "hidden",
                      }}
                    />

                    <ListItemText
                      primary="Created"
                      style={{ minWidth: 200, maxWidth: 100 }}
                    />
                    <ListItemText
                      primary="Last edited"
                      style={{ minWidth: 200, maxWidth: 100 }}
                    />
                  </ListItem>
                  <Divider />
                  {dealList.length === 0 ? (
                    <Typography
                      variant="h6"
                      style={{
                        textAlign: "center",
                        margin: "auto",
                        width: 600,
                        marginTop: 50,
                        marginBottom: 50,
                      }}
                    >
                      No deals registered yet. Click "Add deal" to register one
                    </Typography>
                  ) : (
                    dealList.map((deal, index) => {
                      var bgColor = "#27292d";
                      if (index % 2 === 0) {
                        bgColor = "#1f2023";
                      }

                      return (
                        <ListItem
                          key={index}
                          style={{ backgroundColor: bgColor }}
                        >
                          <ListItemText
                            primary={deal.name}
                            style={{
                              minWidth: 200,
                              maxWidth: 200,
                              overflow: "hidden",
                            }}
                          />
                          <ListItemText
                            primary={deal.status}
                            style={{
                              minWidth: 150,
                              maxWidth: 150,
                              marginLeft: 5,
                              color:
                                deal.status.toLowerCase() === "requested"
                                  ? "yellow"
                                  : deal.status.toLowerCase() === "denied" ||
                                    deal.status.toLowerCase() === "cancelled"
                                  ? "red"
                                  : "green",
                            }}
                          />
                          <ListItemText
                            primary={`\$${deal.value}`}
                            style={{ minWidth: 125, maxWidth: 125 }}
                          />
                          <ListItemText
                            primary={
                              deal.discount.length === 0 ? "TBD" : deal.discount
                            }
                            style={{ minWidth: 100, maxWidth: 100 }}
                          />

                          <ListItemText
                            primary={deal.address}
                            style={{
                              marginleft: 10,
                              minWidth: 100,
                              maxWidth: 100,
                              overflow: "hidden",
                            }}
                          />
                          <ListItemText
                            primary={deal.country}
                            style={{
                              marginleft: 10,
                              minWidth: 100,
                              maxWidth: 100,
                              overflow: "hidden",
                            }}
                          />

                          <ListItemText
                            primary={new Date(
                              deal.created * 1000
                            ).toISOString()}
                            style={{ minWidth: 200, maxWidth: 200 }}
                          />
                          <ListItemText
                            primary={new Date(deal.edited * 1000).toISOString()}
                            style={{ minWidth: 200, maxWidth: 200 }}
                          />
                        </ListItem>
                      );
                    })
                  )}
                </List>

                <Divider
                  style={{
                    marginTop: 20,
                    marginBottom: 20,
                    backgroundColor: theme.palette.inputColor,
                  }}
                />              

			  </div>
            ) : null*/}
			{!isChildOrg && isCloud && (
				<div style={{ display: 'flex', flexDirection: 'column', marginTop: 50, maxWidth: 860 }} id="professional-services">
					<Typography variant="h6" style={{ marginBottom: 5, fontSize: 24, fontWeight: 500 }}>
						Professional Services
					</Typography>
					<Typography variant="body2" color="textSecondary" style={{fontSize: 16,}}>
						We offer priority support through consultations and training to help you make the most of our product. If you have any questions, please reach out to us at {supportEmail}.
					</Typography>We offer priority support through consultations and training to help you make the most of our product. If you have any questions, please reach out to us at
					<div style={{ display: 'flex', flexDirection: 'row', marginTop: 5, }}>
						{billingInfo.subscription !== undefined && billingInfo.subscription !== null ? (
							isChildOrg ? null : (
								<ConsultationManagement
									globalUrl={globalUrl}
									userdata={userdata}
									selectedOrganization={selectedOrganization}
								/>
							)
						) : null}
						<TrainingService />
					</div>
				</div>
			)}
			{isCloud ? (
				<div style={{ marginTop: 40, marginLeft: 10 }}>
				<Typography
					style={{ marginBottom: 5, fontSize: 24, fontWeight: "bold" }}
				>
					Manage Billing
				</Typography>
				<Typography color="textSecondary" style={{ marginTop: 10, marginBottom: 10, fontSize: 16, }}>
					Manage your billing and licensing information below. When you reach the certain thresholds of your subscription limit, you will be notified by email.
				</Typography>
				<Typography style={{fontSize: 18, marginTop: 10}}>Current Usage:</Typography>
				<LinearProgress
					variant="determinate"
					value={currentAppRunsInPercentage}
					style={{
						width: "50%",
						height: 15,
						borderRadius: 10,
						margin: '10px 0',
						marginBottom: 10,
					}}
				/>
				<Typography style={{marginTop: 10, fontSize: 16,}} color="textSecondary">
					You have used <strong>{currentAppRunsInPercentage}%</strong> of total app execution limit or <strong>{userdata.app_execution_usage + userdata.app_executions_suborgs}</strong> app runs out of <strong>{userdata.app_execution_limit}</strong> app runs.
				</Typography>
				
				{userdata?.active_org?.creator_org?.length > 0 ? null :
					(
					<>
						<Typography color="textSecondary" style={{ marginTop: 20, fontSize: 16 }}>
							Parent Organization App Executions: <strong>{userdata.app_execution_usage}</strong>
						</Typography>
						<Typography color="textSecondary" style={{ fontSize: 16 }}>
							Sub-Organization App Executions: <strong>{userdata.app_executions_suborgs || "N/A"}</strong>
						</Typography>
					</>
				)}
				
				<div>
					<Typography style={{ marginTop: 20, fontSize: 18 }}>
						Set email alert thresholds for app runs
					</Typography>
					<Typography color="textSecondary" style={{ marginTop: 10, fontSize: 16 }}>
						You will be notified by email when you reach the
						{currentIndex !== -1
							? " " + getSafeValue(alertThresholds[currentIndex].percentage) + '%' + " "
							: " " + '0%' + " "
						}
						of your total app execution limit or
						{currentIndex !== -1
							? " " + getSafeValue(alertThresholds[currentIndex].count) + " "
							: " " + 0 + " "}
						app runs.
					</Typography>
					<Typography color="textSecondary" style={{ fontSize: 16, marginTop: 10 }}>
						<span style={{fontWeight: 'bold'}}>Please note</span>: Once your app runs reach the set alert threshold, all admins in the organization will receive an email notification. For Parent organizations, the alert will be sent base on the total app runs from both parent and sub-organizations. For Sub-organizations, the alert will be sent based on the app runs of the sub-organization only.
					</Typography>
					<div style={{ marginTop: 15 }}>
						{alertThresholds.map((threshold, index) => (
							<div key={index} style={{ display: 'flex', alignItems: 'center' }}>
							 <TextField
								style={{
								marginTop: 10,
								backgroundColor: theme.palette.textFieldStyle.backgroundColor,
										color: theme.palette.textFieldStyle.color,
								borderRadius: theme.palette.textFieldStyle.borderRadius,
								width: 250,
								height: 50,
								}}
								InputProps={{
								style: {
									height: 50,
									color: theme.palette.textFieldStyle.color,
								},
								endAdornment: '%',
								}}
								InputLabelProps={{
								shrink: undefined,
								}}
								color="primary"
								fullWidth
								label="Alert threshold (%)"
								type="number"
								value={threshold.percentage}
								onChange={(e) => updateAlertThreshold(index, 'percentage', e.target.value)}
								margin="normal"
								variant="outlined"
								inputProps={{
								max: 100,
								}}
							/>
								<TextField
									style={{
									marginTop: 10,
									height: 50,
										backgroundColor: theme.palette.textFieldStyle.backgroundColor,
									color: theme.palette.textFieldStyle.color,
									width: 250,
										marginLeft: 15,
									borderRadius: theme.palette.textFieldStyle.borderRadius,
									}}
									InputProps={{
									style: {
										height: 50,
										color: theme.palette.textFieldStyle.color,
									},
									}}
									InputLabelProps={{
									shrink: undefined,
									}}
									color="primary"
									fullWidth
									label="Alert threshold (count)"
									type="number"
									value={threshold.count}
									onChange={(e) => updateAlertThreshold(index, 'count', e.target.value)}
									margin="normal"
									variant="outlined"
								/>
							<span
							  style={{
								marginLeft: alertThresholds[index].Email_send === true ? 10 : 35,
								color: 'green',
							  }}
							>
							  {alertThresholds[index].Email_send === true && (
								<Tooltip title="We have already sent alert for this threshold.">
								  <CheckCircle />
								</Tooltip>
							  )}
							</span>
							{alertThresholds.length > 1 && (
							  <Button
								disableRipple
								disableElevation
								sx={{
								  padding: 0,
								  '&:hover': {
									backgroundColor: 'transparent',
								  },
								}}
								onClick={() => {
								  setDeleteAlertVerification(true);
								  setDeleteAlertIndex(index);
								}}
							  >
								<DeleteIcon sx={{ color: themeMode === "dark" ? "rgba(255,255,255,0.7)" : "#666666" }} />
							  </Button>
							)}
							<Dialog
							  open={deleteAlertVerification}
							  onClose={() => setDeleteAlertVerification(false)}
							  sx={{
								'& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.3)' },
							  }}
							>
							  <DialogTitle>Are you sure you want to delete this threshold?</DialogTitle>
							  <DialogActions>
								<Button
								  style={{ textTransform: 'none', fontSize: 16 }}
								  color="primary"
								  onClick={() => setDeleteAlertVerification(false)}
								>
								  Cancel
								</Button>
								<Button
								style={{ textTransform: 'none', fontSize: 16 }}
								variant="outlined"
								  color="primary"
								  onClick={() => {
									handleDeleteAlertThreshold(deleteAlertIndex);
									setDeleteAlertVerification(false);
								  }}
								>
								  Delete
								</Button>
							  </DialogActions>
							</Dialog>
						  </div>
						  
						  
						))}
					</div>
				</div>
				<Button
					variant="outlined"
					color="primary"
					style={{ marginTop: 15, textTransform: 'none' }}
					onClick={addAlertThreshold}
				>
					Add Threshold
				</Button>
				<Button
					variant="outlined"
					color="primary"
					style={{ marginTop: 15, textTransform: 'none', marginLeft: 20 }}
					onClick={() => { HandleEditOrgForAlertThreshold(selectedOrganization.id) }}
				>
					Save
				</Button>

			</div>
			): null}
			</div>
			<div style={{ marginTop: 40, display: 'flex', flexDirection: 'column' }}>
				<Typography
					style={{ marginTop: 10, marginLeft: 10, marginBottom: 5, fontSize: 24, fontWeight: "bold" }}
				>
					Utilization & Stats
				</Typography>
			</div>
				<span>
					<Tabs
					value={currentTab}
					onChange={(event, newValue) => {
						setCurrentTab(-1)

						// Force re-render
						setTimeout(() => {
							setCurrentTab(newValue)
						}, 100);
					}}
					style={{ marginTop: 20 }}
					TabIndicatorProps={{
						style: {
							height: 3,
							backgroundColor: theme.palette.primary.main,
							marginLeft: 12,
							marginRight: 12,
						}
					}}
					>
						<Tab
							label="Parent Organization"
							style={{ textTransform: 'none',}}
							value={0}
						/>

						{isCloud ? 
							<Tab
								label="Cloud-Synced Stats"
								style={{ textTransform: 'none', }}
								value={1}
							/>
						: null}

						<Tab
							label="Child Organization Stats"
							disabled={isChildOrg}
							style={{ textTransform: 'none', }}
							value={2}
						/>
					</Tabs>

					<div style={{paddingBottom: 200, minHeight: 750, }}>
						{currentTab === 0 ? 
							<div style={{ marginTop: 30,}}>
								<BillingStats
									isCloud={isCloud}
									clickedFromOrgTab={clickedFromOrgTab}
									globalUrl={globalUrl}
									selectedOrganization={selectedOrganization}
									userdata={userdata}
								/>
							</div>
						: currentTab === 1 ? 
							<div style={{ marginTop: 30,}}>
								<BillingStats
									isCloud={isCloud}
									clickedFromOrgTab={clickedFromOrgTab}
									globalUrl={globalUrl}
									selectedOrganization={selectedOrganization}
									userdata={userdata}

									syncStats={true}
								/>
							</div>
						: 
							<BillingStatsChildOrg
								isCloud={isCloud}
								clickedFromOrgTab={clickedFromOrgTab}
								globalUrl={globalUrl}
								selectedOrganization={selectedOrganization}
								userdata={userdata}
								allChildOrgs={allChildOrgs}
								setAllChildOrgs={setAllChildOrgs}
								allChildOrgsStats={allChildOrgsStats}
								setAllChildOrgsStats={setAllChildOrgsStats}
							/>
						}
					</div>
				</span>
			</div>
		</Wrapper>
	)
})

export default memo(Billing);

const BillingStatsChildOrg = memo(({ userdata, globalUrl, selectedOrganization, allChildOrgs, setAllChildOrgs, allChildOrgsStats, setAllChildOrgsStats }) => {
	const [subOrgStats, setSubOrgStats] = useState([]);
	const [subOrgs, setSubOrgs] = useState([]);
	const [subOrgStatsRows, setSubOrgStatsRows] = useState([]);
	const [subOrgStatsColumns, setSubOrgStatsColumns] = useState([]);
	const [allOrgLoaded, setAllOrgLoaded] = useState(false);
	const [allOrgStatsLoaded, setAllOrgStatsLoaded] = useState(false);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState("")
	const [editingOrgId, setEditingOrgId] = useState("")
	const [limit, setLimit] = useState("")
	const [tableCreated, setTableCreated] = useState(false)
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredRows, setFilteredRows] = useState([]);
	const { themeMode, brandColor, supportEmail } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);


	// Handle page change
	const handleChangePage = (event, newPage) => {
	  setPage(newPage);
	};
  
	const handleChangeRowsPerPage = (event) => {
	  setRowsPerPage(parseInt(event.target.value, 10));
	  setPage(0);
	};
  
	const HanldeLoadStats = async () => {
		const childOrgs = selectedOrganization.child_orgs;
		if (allChildOrgsStats.length > 0){
			setSubOrgStats(allChildOrgsStats)
			setAllOrgStatsLoaded(true)
			if (allChildOrgsStats.length > 0 && allChildOrgs.length > 0 && subOrgStatsRows.length === 0 && subOrgStatsColumns.length === 0) {
				HandleCreateTable(allChildOrgsStats, allChildOrgs)
			}
			return
		}
		const promises = childOrgs.map((org) => {
			// get org stats base on region url
			const baseUrl = org?.region_url?.length > 0 && !window?.location?.origin?.includes("localhost") ? org?.region_url : globalUrl;
			const url = `${baseUrl}/api/v1/orgs/${org.id}/stats`;
			return fetch(url, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then((res) => res.json());
		});
	
		try {
			const responses = await Promise.all(promises);
			setSubOrgStats(responses);
			setAllChildOrgsStats(responses);
			setAllOrgStatsLoaded(true);
		} catch (error) {
			console.error("Error loading stats:", error);
		}
	};
	
	

	const HandleGetSuborg = async () => {
		const childOrgs = selectedOrganization.child_orgs

		if (allChildOrgs.length > 0){
			setSubOrgs(allChildOrgs)
			setAllOrgLoaded(true)
			if (allChildOrgsStats.length > 0 && allChildOrgs.length > 0 && subOrgStatsRows.length === 0 && subOrgStatsColumns.length === 0) {
				HandleCreateTable(allChildOrgsStats, allChildOrgs)
			}
			return
		}

		const promises = childOrgs.map((org) => {
			const baseUrl = org?.region_url?.length > 0 && !window?.location?.origin?.includes("localhost") ? org?.region_url : globalUrl;
			const url = `${baseUrl}/api/v1/orgs/${org.id}`;
			return fetch(url, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			}).then((res) => res.json());
		});
		try {
			const responses = await Promise.all(promises);
			setSubOrgs(responses);
			setAllChildOrgs(responses);
			setAllOrgLoaded(true);
		} catch (error) {
			console.error("Error loading suborgs:", error);
		}
	};

	useEffect(() => {
		if (subOrgStats.length === 0 && selectedOrganization && selectedOrganization?.child_orgs?.length > 0) {
			HanldeLoadStats()
		}
		if (subOrgs.length === 0 && selectedOrganization && selectedOrganization?.child_orgs?.length > 0) {
			HandleGetSuborg()
		}

	}, [selectedOrganization?.child_orgs]);


	useEffect(() => {

		if (allOrgLoaded && allOrgStatsLoaded && !tableCreated) {
			HandleCreateTable(subOrgStats, subOrgs)
		}
	}
	, [allOrgLoaded, allOrgStatsLoaded, tableCreated])

	
	const HandleCreateTable = (subOrgStats, subOrgs) => {
		
		if (subOrgStats.length === 0 || subOrgs.length === 0) return;

		// check whether all of the suborg.success is false
		const allSubOrgStatsSuccess = subOrgStats.every((stat) => stat.success === false);
		const allSubOrgsSuccess = subOrgs.every((org) => org.success === false);

		if (allSubOrgStatsSuccess || allSubOrgsSuccess) {
			setSubOrgStats([])
			setSubOrgs([])
			setTableCreated(true)
			return
		}

		const rows = subOrgStats.map((stat, index) => {
			const subOrg = subOrgs[index]
			if (!subOrg) return null;
			return {
				id: index,
				name: subOrg.name,
				orgId: subOrg.id,
				limit: subOrg?.sync_features?.app_executions?.limit || "N/A",
				usage: stat?.monthly_app_executions || "N/A",
				workflows_usage: stat?.total_workflow_executions || "N/A",
				workflow_usage_limit: subOrg?.sync_features?.workflow_executions?.limit || "N/A",
				app_runs_hard_limit: subOrg?.Billing?.app_runs_hard_limit || 0,
			}
		})

		setSubOrgStatsRows(rows)

		const columns = [
			{ field: "id", headerName: "ID", width: 100 },
			{ field: "name", headerName: "Name", width: 200 },
			{ field: "usage", headerName: "App Execution Usage", width: 200 },
			{ 
				field: "limit", headerName: "App Execution Limit", width: 200, renderCell: (params) => {
					return (
						<>
						<Typography style={{ fontSize: 16 }}>
						{params.value}
						<IconButton
							style={{ color: theme.palette.primary.main }}
							onClick={() => {
								setOpen(true)
								setEditingOrgId(params.row.orgId)
								setEditing("app_executions")
								if (params.value === "N/A") {
									setLimit("")
								} else {
									setLimit(params.value)
								}
							}}
						>
							<Edit/>
						</IconButton>
						</Typography>
						</>
					)
				}
				},
				{ field: "workflows_usage", headerName: "Workflow Execution Usage", width: 200 },
				{ field: "workflow_usage_limit", headerName: "Workflow Execution Limit", width: 200, renderCell: (params) => {
				return (
					<>
						<Typography style={{ fontSize: 16 }}>
						{params.value}
						</Typography>
						<IconButton
							style={{ color: theme.palette.primary.main }}
							onClick={() => {
								setOpen(true)
								setEditingOrgId(params.row.orgId)
								setEditing("workflow_executions")
								if (params.value === "N/A") {
									setLimit("")
								} else {
									setLimit(params.value)
								}
							}}
						>
							<Edit/>
						</IconButton>
					</>
				)}
			},
			{
				field: "app_runs_hard_limit", headerName: "App Executions Hard Limit", width: 200, renderCell: (params) => {
					console.log("params.row: ", params.row)
					return (
						<>
							<Typography style={{ fontSize: 16 }}>
								{params.row.app_runs_hard_limit}
							</Typography>
							<IconButton
								style={{ color: theme.palette.primary.main }}
								onClick={() => {
									setOpen(true)
									setEditingOrgId(params.row.orgId)
									setEditing("app_executions_hard_limit")
									if (params.row.app_runs_hard_limit === "N/A") {
										setLimit("")
									} else {
										setLimit(params.row.app_runs_hard_limit)
									}
								}}
							>
								<Edit/>
							</IconButton>
						</>
					)
				}
			}
		]

		setSubOrgStatsColumns(columns)

		if (allOrgLoaded && allOrgStatsLoaded && !tableCreated) {
			setTableCreated(true)
		}
	}

	

	const HandleEditLimit = (orgId, editing, limit) => {


		// change limit as number if string
		if (typeof limit === "string") {
			limit = parseInt(limit, 10)
		}
		if (isNaN(limit)) {
			toast.error("Please enter a valid number")
			return
		}

		if (selectedOrganization.sync_features.app_executions.limit <= 10000 && editing === "app_executions") {
			toast.error("Insufficient app execution limit to increase child org limit")
			return
		}

		// check whether limit is greater than than parent org limit
		if (editing === "app_executions" && limit > selectedOrganization.sync_features.app_executions.limit && !userdata.support) {
			toast.error("App execution limit cannot be greater than parent org limit")
			return
		}


		if (editing === "workflow_executions" && limit > selectedOrganization.sync_features.workflow_executions.limit && !userdata.support) {
			toast.error("Workflow execution limit cannot be greater than parent org limit")
			return
		}

		// find the org in the subOrgs array
		const orgIndex = subOrgs.findIndex((org) => org.id === orgId)
		if (orgIndex === -1) {
			toast.error("Organization not found")
			return
		}

		const org = subOrgs[orgIndex]

		if (editing !== "app_executions_hard_limit") {
			org.sync_features[editing].limit = limit
		}

		org.sync_features.editing = true
		const sync_features = org.sync_features
		const data = {
			org_id: orgId,
            sync_features: sync_features,
		}

		if (editing === "app_executions_hard_limit") {
			data.editing = "app_runs_hard_limit";
			data.billing = {
				app_runs_hard_limit: limit || 0
			};
		}

		const url = `${globalUrl}/api/v1/orgs/${orgId}`;
		fetch(url, {
			method: "POST",
			credentials: "include",
			crossDomain: true,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}).then((response) =>
				response.json().then((responseJson) => {
					if (responseJson["success"] === false) {
						toast("Failed updating org: ", responseJson.reason);
					} else {
						toast("Successfully change suborg limit!");
						if (editing === "app_executions") {
							setSubOrgStatsRows((prevRows) => {
								const newRows = [...prevRows];
								newRows[orgIndex].limit = limit;
								return newRows;
							});
						}else if (editing === "workflow_executions") {
							setSubOrgStatsRows((prevRows) => {
								const newRows = [...prevRows];
								newRows[orgIndex].workflow_usage_limit = limit;
								return newRows;
							});
						}else if (editing === "app_executions_hard_limit") {
							setSubOrgStatsRows((prevRows) => {
								const newRows = [...prevRows];
								newRows[orgIndex].app_runs_hard_limit = limit;
								return newRows;
							});
						}
					}
				})
			)
			.catch((error) => {
				toast("Err: " + error.toString());
		});

	}

	const HandleClosePopUP = () => {
		setOpen(false)
		setEditing("")
		setEditingOrgId("")
		setLimit("")
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", marginTop: 30, minHeight: 300, marginBottom: 200,  }}>
			{open && (
				<IncreaseLimitPopUp open={open} onClose={HandleClosePopUP} limit={limit} HandleEditLimit={HandleEditLimit} setLimit={setLimit} editing={editing} setEditing={setEditing} editingOrgId={editingOrgId} setEditingOrgId={setEditingOrgId}/>
			)}
			<Typography style={{ marginBottom: 5, fontSize: 24, fontWeight: "bold" }}>
				Child Organizations
			</Typography>
			<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
				<Typography color="textSecondary" style={{ marginTop: 10, fontSize: 16 }}>
					View and configure execution limits for child organizations. Click the edit icon to modify app and workflow execution limits.
				</Typography>      
			</div>
			{tableCreated ? (
				subOrgStatsRows.length > 0 && subOrgStatsColumns.length > 0 ? (
					<>
						<TextField 
							style={{ marginBottom: 10, width: 500, marginTop: 20 }} 
							variant="outlined" 
							placeholder="Search organizations by name or ID" 
							value={searchQuery}
							fullWidth
							InputProps={{
								style: {
									fontSize: "1em",
									height: 51,
									width: 693,
									borderRadius: 4,
								},
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon style={{ marginLeft: 5}} />
									</InputAdornment>
								),
							}}
							onChange={(e) => {
								setSearchQuery(e.target.value.toLowerCase());
								const filtered = subOrgStatsRows.filter((row) =>
									row.name.toLowerCase().includes(e.target.value.toLowerCase().trim()) ||
									row.orgId.toLowerCase().includes(e.target.value.toLowerCase().trim())
								);
								setFilteredRows(filtered);
							}}
						/>
						<DataGrid
							rows={searchQuery ? filteredRows : subOrgStatsRows}
							columns={subOrgStatsColumns}
							pageSize={rowsPerPage}
							rowsPerPageOptions={[5, 10, 25, 50]}
							onPageChange={handleChangePage}
							onPageSizeChange={handleChangeRowsPerPage}
							autoHeight
							style={{ height: "300px", width: "100%", backgroundColor: theme.palette.platformColor, color: theme.palette.text.primary }}
						/>
					</>
				) : (
					<Typography variant="h6" color="secondary" style={{ margin: "auto",}}>
						{selectedOrganization.child_orgs.length === 0 ? "No child organizations exist." : "Unable to load child organization stats. Statistics may not be initialized yet." }
					</Typography>
				)
			) : (
				<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", margin: 'auto'}}>
					<CircularProgress style={{ color: "#FF8444" }} />
				</div>
			)}
		</div>
	);
});

const IncreaseLimitPopUp = memo(({ open, onClose, limit, setLimit, HandleEditLimit, editingOrgId, editing}) => {
	const [currentLimit, setCurrentLimit] = useState(limit)

	const { themeMode, brandColor } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);

	return(
		<Dialog open={open} onClose={onClose}
		 PaperProps={{
			sx: {
			borderRadius: theme?.palette?.DialogStyle?.borderRadius,
			border: theme?.palette?.DialogStyle?.border,
			fontFamily: theme?.typography?.fontFamily,
			backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
			zIndex: 1000,
			'& .MuiDialogContent-root': {
				backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
			},
			'& .MuiDialogTitle-root': {
				backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
			},
			'& .MuiDialogActions-root': {
				backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
			},
			}
		}}
	>
			{editing === "app_executions_hard_limit" ? (
					<DialogTitle style={{ fontSize: 24, fontWeight: "bold" }}>
						Add {editing.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
					</DialogTitle>
			) : (
				<DialogTitle style={{ fontSize: 24, fontWeight: "bold" }}>
				Increase {editing.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase())} Limit
			</DialogTitle>
			)}
			<DialogContent>
			 {	editing === "app_executions_hard_limit" ? (
				<Typography style={{  marginRight: 20, marginBottom: 20,  fontSize: 16, color: theme.palette.text.secondary }}>
					Please note that once you set a hard limit for app runs workflows will not be able to run if the limit is reached. You will be notified by email when you reach the limit.
				</Typography>
			) : null}
			<TextField 
				value={currentLimit}
				onChange={(e) => setCurrentLimit(e.target.value)}
				label={`${editing.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase())} Limit`}
				type="string"
				variant="outlined"
				fullWidth
				InputProps={{
					style: {
						color: theme.palette.text.primary,
					},
				}}
				InputLabelProps={{
					style: {
						color: theme.palette.text.primary,
					},
				}}
				margin="normal"
				onKeyUp={(e) => {
					if (e.key === "Enter") {
						HandleEditLimit(editingOrgId, editing, currentLimit)
						setLimit(currentLimit)
						onClose()
					}}
				}
			></TextField>
			 </DialogContent>
			<DialogActions>
				<Button onClick={onClose} style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, marginRight: 5, color: theme.palette.primary.main  }}>
					Cancel
				</Button>
				<Button variant="contained" color="primary" onClick={() => {
					HandleEditLimit(editingOrgId, editing, currentLimit)
					setLimit(currentLimit)
					onClose()
				}} style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, marginRight: 10 }}>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	)
})


const PaddingWrapper = memo(({ clickedFromOrgTab, children }) => {
	
	const { themeMode, brandColor } = useContext(Context);
	const theme = getTheme(themeMode, brandColor);

	const wrapperStyle = useMemo(() => ({
	  width: clickedFromOrgTab 
		? "100%"
		: "auto",
	  padding: "27px 10px 19px 27px", 
	  backgroundColor: theme.palette.platformColor, 
	  height: '100%',
	  boxSizing: 'border-box',
	  overflow: 'hidden',
		maxHeight: "1700px",
		overflowY: "auto",
		scrollbarColor: theme.palette.scrollbarColorTransparent,
		scrollbarWidth: 'thin'
	}), [clickedFromOrgTab, theme]);
  
	return (
	  <div style={wrapperStyle}>
		{children}
	  </div>
	);
  });
  
const Wrapper = memo(({ children, clickedFromOrgTab }) => {
	return (
	  <PaddingWrapper  clickedFromOrgTab={clickedFromOrgTab}>
		{children}
	  </PaddingWrapper>
	);
  });
