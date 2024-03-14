import React, { useState, useEffect } from 'react';

import ReactGA from 'react-ga4';
import { useNavigate, Link } from "react-router-dom";
import {isMobile} from "react-device-detect";
import { toast } from "react-toastify" 

import {
	Done as DoneIcon, 
	Clear as ClearIcon,
	AddTask as AddTaskIcon,
	} from '@mui/icons-material';

import {
	Slider, 
	Divider, 
	List, 
	ListItem, 
	ListItemText, 
	Card, 
	CardContent, 
	Grid, 
	Typography, 
	Button, 
	ButtonGroup, 
	FormControl, 
	Dialog, 
	DialogTitle, 
	DialogActions, 
	DialogContent, 
	Tooltip
}  from '@mui/material';
import FAQ from "./Faq.jsx";
import Newsletter from "../components/Newsletter.jsx";
import Services from "./Services.jsx";

export const typecost = 0.0018
export const typecost_single = (typecost * 1.33).toFixed(4)

export const handlePayasyougo = (userdata) => {
	var billingurl = "https://billing.stripe.com/p/login/bIY5lo5bMbWs9Py5kk"

	if (userdata !== undefined && userdata !== null) {
		if (userdata.org_email !== undefined && userdata.org_email !== null && userdata.org_email !== "") {
			billingurl += `?prefilled_email=${userdata.org_email}`

		} else if (userdata.username !== undefined && userdata.username !== null && userdata.username !== "") {
			billingurl += `?prefilled_email=${userdata.username}`
		}
	}

	toast("Redirecting in 2 seconds. Use the organization owner email.") 
	setTimeout(() => {
		window.location = billingurl 
	}, 2500)
}

// 1. Create 2-3 payment tiers (slider?)
// 2. Create a way to show them anywhere
//
// Site references:
// https://logz.io/pricing/
// https://www.avanan.com/pricing
const PaymentField = (props) => {
	const { maxFields, theme, removeAdditions, isLoggedIn } = props

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

	// Multiple unused variables here
  let navigate = useNavigate();
	const parsedFields = maxFields === undefined ? 300 : maxFields
	const [variant, setVariant] = useState(0)
	const [shuffleVariant, setShuffleVariant] = useState(isCloud ? 0 : 1)
	const [paymentType, setPaymentType] = useState(0)
	const [modalOpen, setModalOpen] = useState(false)
  const [showPricing, ] = useState(true)
	const [currentPrice, setCurrentPrice] = useState(129)
	const [isLoaded, setIsLoaded] = useState(false)
	const [errorMessage, setErrorMessage] = useState("")

	// Cloud
	const [calculatedApps, setCalculatedApps] = useState(600)
	const [calculatedCost, setCalculatedCost] = useState("$600")
	const [selectedValue, setSelectedValue] = useState(100)

	// Onprem
	const [calculatedCores, setCalculatedCores] = useState(600)
	const [onpremSelectedValue, setOnpremSelectedValue] = useState(8)

    useEffect(() => {
		console.log("New variant: ", shuffleVariant)

		if (shuffleVariant === 1) {
			setCalculatedCost("$600")
			setSelectedValue(8)
		} else {
			setCalculatedCost("$180")
			setSelectedValue(100)
		}
	}, [shuffleVariant])

	if (typeof window === 'undefined' || window.location === undefined) {
		return null
	}


	/*
	const valuetext = (value, variant) => {
		console.log("Valuetext: ", value, variant)
		if (value === 32 || value === 1000) {
			if (variant === 1) {
				setCalculatedCores("Get A Quote")
				setOnpremSelectedValue(value)
			} else {
				setCalculatedApps(`Get A Quote`)
				setSelectedValue(value)
			}
		} else {
			if (variant === 1) {
				setCalculatedCores(`$${value*75}`)
				setOnpremSelectedValue(value)
			} else {
				setCalculatedApps(`$${value*1000*0.0018}`)
				setSelectedValue(value)
			}
		}
	}
	*/


	const handleChange = (event, newValue) => {
		console.log("Event, value: ", event.target, newValue)
	
		if (shuffleVariant === 1) {
			setSelectedValue(newValue)
			if (newValue === 32) {
				setCalculatedCost(`Get A Quote`)
			} else {
				setCalculatedCost(`$${newValue*75}`)
			}
		} else {
			setSelectedValue(newValue)
			if (newValue === 1000) {
				setCalculatedCost(`Get A Quote`)
			} else {
				setCalculatedCost(`$${newValue*1000*typecost}`)
			}
		}
	}


	//	return `${value}`;
	//}

	if (!isLoaded) {
		setIsLoaded(true)

		const tmpsearch = typeof window === 'undefined' || window.location === undefined ? "" : window.location.search
		const tmpVar = new URLSearchParams(tmpsearch).get("variant")
		if (tmpVar !== undefined && tmpVar !== null && tmpVar < 3) {
			setVariant(parseInt(tmpVar))
		}

		const tmpType = new URLSearchParams(tmpsearch).get("payment_type")
		if (tmpType !== undefined && tmpType !== null && tmpType < 2) {
			setPaymentType(parseInt(tmpType))
		}

		const modal = new URLSearchParams(tmpsearch).get("payment_modal")
		if (modal !== undefined && modal !== null && modal === "open") {
			setModalOpen(true)
		}

		const tmpView = new URLSearchParams(tmpsearch).get("view")
		if (tmpView !== undefined && tmpView !== null && tmpView === "failure") {
			setErrorMessage("Something went wrong with your payment. Please try again.")
		}

		const urlSearchParams = new URLSearchParams(window.location.search);
		const params = Object.fromEntries(urlSearchParams.entries());
		const foundTab = params["tab"];
		if (foundTab !== null && foundTab !== undefined) {
			if (foundTab === "onprem") {
				//valuetext(8, 1) 
				setShuffleVariant(1)
				//setCalculatedCores(`$${8*75}`)
			}
		}
	}

	const billingInfo = <Typography variant="body2" color="textSecondary" style={{marginTop: 30,}} >Billed anually or monthly at 1.2x the cost</Typography>
	//const skipFreemode = window.location.pathname.startsWith("/admin") 
	const skipFreemode = false
	const maxwidth = isMobile ? "91%" : skipFreemode ? 1100 : 1200 
	const activeIcon = <DoneIcon style={{color: "green"}} />
	const inActiveIcon = <ClearIcon style={{color: "red"}} />  

	// All triggers
	const features = [

	{
		"name": "Users",
		"basic": "No limit",
		"community": "No limit",
		"pro": "No limit",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Apps",
		"basic": "No limit",
		"community": "No limit",
		"pro": "No limit",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Workflows",
		"basic": "No limit",
		"community": "No limit",
		"pro": "No limit",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Workflow App Runs",
		"basic": "10.000 / month",
		"community": "10.000 / month",
		"pro": "Pay as you go",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Workflow App Runs",
		"basic": "No limit",
		"community": "No limit",
		"pro": "No limit",
		"enterprise": "",
		"active": true, 
		"cloud": false,
	},
	{
		"name": "Shuffle Datastore (cache)",
		"basic": "Max 1GB",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Shuffle Datastore (cache)",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"cloud": false,
	},
	{
		"name": "File Storage",
		"basic": "Max 1GB",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "File Storage",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"cloud": false,
	},
	{
		"name": "Multi-Tenant",
		"basic": "No",
		"community": "Yes",
		"pro": "Add-on",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Multi-Tenant",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"cloud": false,
	},
	{
		"name": "Region Control",
		"basic": "No",
		"community": "Yes",
		"pro": "Add-on",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Per-CPU-core support",
		"basic": "0 / month",
		"community": "0 / month",
		"pro": "Pay as you go",
		"enterprise": "8 / month",
		"active": true, 
		"cloud": false,
	},
	{
		"name": "Shuffle SMS alerting",
		"basic": "30 / month",
		"community": "Yes",
		"pro": "300 / month",
		"enterprise": "300 / month",
		"active": true, 
	},
	{
		"name": "Shuffle Email alerting",
		"basic": "100 / month",
		"community": "Yes",
		"pro": "10.000 / month",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Priority Support",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"title": "Support & Success",
	},
	{
		"name": "Maintenance & Updates",
		"basic": "No",
		"community": "",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"cloud": false,
	},
	{
		"name": "Documentation & Community Support",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Email & Chat Support",
		"basic": "support@shuffler.io",
		"community": "No",
		"pro": "Prioritized + Critical issue SLA",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Personal onboarding",
		"basic": "No",
		"community": "",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Shuffle Academy",
		"basic": "Yes",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Workflow editor",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"title": "Basic features",
	},
	{
		"name": "App editor",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Private Apps",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Default & Shared playbooks",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Organization control",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Autocomplete features",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true,
	},
	{
		"name": "Hybrid Webhook trigger",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Hybrid User Input trigger",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Hybrid Email trigger",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Hybrid Schedule",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Failure Notifications",
		"basic": "Yes",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Hybrid Executions",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Use of Public Workflows",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Multiple Environments",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},

	{
		"name": "Shuffle creates integration",
		"basic": "No",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Uptime SLA",
		"basic": "No",
		"community": "No",
		"pro": "99.9%",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Automated backups",
		"basic": "No",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "MSSP org overview",
		"basic": "No",
		"community": "No",
		"pro": "Add-on",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "MSSP org control",
		"basic": "No",
		"community": "No",
		"pro": "Add-on",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Automatic Platform updates",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Audit logging",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "2-factor authentication",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"title": "Security & Development",
	},	
	{
		"name": "SAML / SSO",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "API-key management",
		"basic": "yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Role-based access control (RBAC)",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},

	{
		"name": "Workflow recommendations",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
		"title": "Additional Features",
	},
	{
		"name": "Standardized app categories",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "App Framework",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Hybrid search engine",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},

	{
		"name": "Hybrid App syncronization",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Execution Retention",
		"basic": "1 Month",
		"community": "Yes",
		"pro": "1 Year default",
		"enterprise": "",
		"active": true, 
		"onprem": false,
	},
	{
		"name": "Detection Management",
		"basic": "Yes",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Mitre Att&ck integrations",
		"basic": "No",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Open Source account rollback",
		"basic": "No",
		"community": "Yes",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Data LOCATION control",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Data RETENTION control",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Shuffle IoC search",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Controllable Reporting",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},	
	{
		"name": "Management dashboard",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Risk based overview",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "Compliance dashboard",
		"basic": "No",
		"community": "No",
		"pro": "Yes",
		"enterprise": "",
		"active": false, 
	},
	{
		"name": "App & Workflow Training", 
		"basic": "$4999 / 5 people",
		"community": "No",
		"pro": "$1499 / 5 people",
		"enterprise": "",
		"active": true, 
		"title": "Professional Services",
	},
	{
		"name": "Developer Training", 
		"basic": "$4999 / 5 people",
		"community": "No",
		"pro": "$1499 / 5 people",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Custom App Development",
		"basic": "Contact us",
		"community": "No",
		"pro": "Contact us",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Custom Workflow Development",
		"basic": "Contact us",
		"community": "No",
		"pro": "Contact us",
		"enterprise": "",
		"active": true, 
	},
	{
		"name": "Shuffle Custom Modifications",
		"basic": "Contact us",
		"community": "No",
		"pro": "Contact us",
		"enterprise": "",
		"active": true, 
	},

	]

	const defaultTaskIcon = <AddTaskIcon style={{marginRight: 10, marginTop: 5,}}/>
	const stripe = typeof window === 'undefined' || window.location === undefined ? "" : props.stripeKey === undefined ? "" : window.Stripe ? window.Stripe(props.stripeKey) : ""
	const handleStripeRedirect = (payment_type, recurrence) => {
		console.log("REDIRECT: ", payment_type, recurrence)

		// FIXME: Proper redirect cycle here
		if (props.userdata === undefined || props.userdata.username === undefined || props.userdata.active_org === undefined || props.userdata.active_org.id === undefined) {
			console.log("User must sign in and have an organization first. Current: ", props.userdata)
			// 1. Add query parameters: Yearly / monthly, Community / pro
			navigate(`/register?view=pricing&variant=${variant}&payment_type=${paymentType}&payment_modal=open&message=You need to create a user to continue`)
			return
		} else {
			console.log("Username is ", props.userdata.username)
		}

		//payment_type = community(0), pro(1)
		//recurrence = yearly(0), monthly(1)
		var priceItem = "price_1Hh8ecDzMUgUjxHSPEdeueyu"
		var text = "enterprise_yearly_pay_click"
		// recurrence = 0 = yearly
		// recurrence = 1 = monthly 
		//
		if (payment_type === 0) {
			console.log("Handling payment type 0: hybrid")
			priceItem = recurrence === 0 ? isCloud ? "price_1HhAOgDzMUgUjxHSmesUZkNU" : "price_1HhAOgDzMUgUjxHSmesUZkNU" : isCloud ? "price_1HhAOgDzMUgUjxHSfU8XzQ84" : "price_1HhAOgDzMUgUjxHSfU8XzQ84" 

			ReactGA.event({
				category: "pricing",
				action: `hybrid_pay_click`,
				label: "",
			})
		} else if (payment_type === 1) {
			console.log("Handling payment type 1: enterprise")
			priceItem = recurrence === 0 ? isCloud ? "price_1HhAdrDzMUgUjxHSsIDOCYgm" : "price_1HhAdrDzMUgUjxHSsIDOCYgm" : isCloud ? "price_1HhAdrDzMUgUjxHS7Cu5vF95" : "price_1HhAdrDzMUgUjxHS7Cu5vF95"

			if (recurrence === 1) {
				text = "enterprise_monthly_pay_click"
			}

			ReactGA.event({
				category: "pricing",
				action: text,
				label: "",
			})
		} else if (payment_type === 2) {
			console.log("Handling payment type 2: basic")
			priceItem = recurrence === 0 ? isCloud ? "price_1HnPmWDzMUgUjxHSzEHV5e6t" : "price_1HlvuPDzMUgUjxHS1pvtPONJ" : isCloud ? "price_1HnPmWDzMUgUjxHSGC3Yiact" : "price_1HlvuPDzMUgUjxHSrp7Ws8iu" 

			ReactGA.event({
				category: "pricing",
				action: `mssp_pay_click`,
				label: "",
			})
		} else {
			console.log(`No handler for redirect ${payment_type} yet`)
			return
		}

		// Current URL + status = Success/fail
		const successUrl = `${window.location.origin}/admin?payment=success`
		const failUrl = `${window.location.origin}/pricing?view=failure&variant=${variant}&payment_type=${paymentType}`

		var checkoutObject = {
			lineItems: [
				{price: priceItem, quantity: 1},
			],
			mode: "subscription",
			billingAddressCollection: "auto",
	  	successUrl: successUrl,
	  	cancelUrl: failUrl,
			submitType: "donate",
			clientReferenceId: props.userdata.active_org.id,
		}

		stripe.redirectToCheckout(checkoutObject)
		.then(function (result) {
			console.log("SUCCESS STRIPE?: ", result)

			text += "_success"
			ReactGA.event({
				category: "pricing",
				action: text,
				label: "",
			})
		})
		.catch(function(error) {
			console.error("STRIPE ERROR: ", error)
			text += "_fail"
			ReactGA.event({
				category: "pricing",
				action: text,
				label: "",
			})
		});

		console.log("Done with payment!")
	}

	const buttonBackground = "linear-gradient(to right, #f86a3e, #f34079)"
	const level1Button = 
			<Button fullWidth variant="contained" color="primary" style={{borderRadius: 25, height: 40, margin: "15px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground,}}onClick={() => {
				setMonthlyCost(0, paymentType)
				setVariant(0)
				setModalOpen(true)
				ReactGA.event({
					category: "pricing",
					action: `hybrid_click`,
					label: "",
				})
			}}>
				Get hybrid access 
			</Button>

	const level2Button = 
		<Button fullWidth disabled={false} variant="contained" color="primary" style={{marginTop: shuffleVariant === 0 ? 20 : 45, borderRadius: 25, height: 40, fontSize: 14, color: "white", backgroundImage: buttonBackground,}}onClick={() => {
			//setMonthlyCost(1, paymentType)
			//setVariant(1)
			//setModalOpen(true)
			ReactGA.event({
				category: "pricing",
				action: `enterprise_click`,
				label: "",
			})

			ReactGA.event({
				category: "pricing",
				action: `demo_click`,
				label: "",
			})

			if (window.drift !== undefined) {
				window.drift.api.startInteraction({ interactionId: 340045 })
			}
		}}>
			Get a demo 
		</Button>

	const level3Button = skipFreemode ? null : 
			<Button fullWidth disabled={false} variant="contained" color="primary" style={{borderRadius: 25, height: 40, margin: "15px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground,}} onClick={() => {

				ReactGA.event({
					category: "pricing",
					action: `getting_started_click`,
					label: "",
				})
												 
				if (shuffleVariant === 0) {
					navigate("/register?message=Get started for free")
				} else {
					window.location.href = "https://github.com/Shuffle/Shuffle/blob/master/.github/install-guide.md"
				}

				//setMonthlyCost(2, paymentType)
				//setVariant(2)
				//setModalOpen(true)
			}}>
					Start building!	
			</Button>


	const cardStyle = {
		height: "100%", 
		width: "100%", 
		textAlign: "center", 
		backgroundColor: theme.palette.surfaceColor,
		color: "white",
	}


	var indexskip = 0
	const topRet = 
		<div style={{textAlign: "center"}}>
			<Typography variant={isMobile ? "h4" : "h2"} style={{marginTop: 60,}}>Pricing</Typography>	
			{/*<Typography variant="body1" style={{marginTop: 15,}}>Find pricing, focused on shuffler.io and self-hosted</Typography>*/}
			{/*<Typography variant="body1" color="textSecondary" style={{}}>These prices are likely to change</Typography>*/}
			<div style={{width: "100%", margin: "auto", backgroundColor: "#1f2023", position: "sticky", top: 0, paddingBottom: 20, zIndex: 10000,}}>
				<ButtonGroup style={{height: 50, marginTop: 30, }} color="primary" aria-label="outlined secondary button group">
					<Button style={{width: 150, textTransform: "none",}} variant={shuffleVariant === 0 ? "contained" : "outlined"} onClick={(event) => {
						event.preventDefault()

						setShuffleVariant(0)
						ReactGA.event({
							category: "pricing",
							action: `saas_normal_click`,
							label: "",
						})

						navigate("/pricing?tab=cloud")
					}}>Cloud</Button>
					<Button style={{width: 150, textTransform: "none",}} variant={shuffleVariant === 1 ? "contained" : "outlined"} onClick={(event) => {
						event.preventDefault()

						setShuffleVariant(1)
						navigate("/pricing?tab=onprem")
			
						ReactGA.event({
							category: "pricing",
							action: `self_hosted_normal_click`,
							label: "",
						})

					}}>Self-Hosted</Button>
				</ButtonGroup>
			</div>
			{errorMessage.length > 0 ? <Typography variant="h4">Error: {errorMessage}</Typography> : null}
			<div style={{display: "flex", margin: "auto", marginTop: 30, }}>
				<Grid container spacing={4} style={{width: maxwidth/4*2.4 , margin: "auto",}}>
					{skipFreemode ? null : 
					<Grid item xs={isMobile ? 12 : 6 }>
						<Card style={cardStyle}>	
							<CardContent style={{padding: 35}}>
								<Typography variant="h4">Free</Typography>
								<Typography variant="body1" color="textSecondary">
									{shuffleVariant === 0 ? 
										"shuffler.io / Cloud"
									: 
										<a rel="noreferrer noopener" target="_blank" style={{textDecoration: "none", color: "#f85a3e",}} href="https://github.com/shuffle/shuffle">Open Source</a> 
									}
								</Typography>
								<Typography variant="h3" style={{marginTop: 48,}}>{paymentType === 0 ? "Free" : "Free"}</Typography>
								<Typography variant="body1" color="textSecondary" style={{marginBottom: 40,}}>
									{shuffleVariant === 0 ? 
										"Includes 10k App Executions. Refreshes every month."
										: 
										"Unlimited use, self-hosted."
									}

								</Typography>
								<span style={{textAlign: "left", }}>
									<Typography variant="body1">
										{defaultTaskIcon} Use any app 
									</Typography>
									<Divider />
									<Typography variant="body1">
										{defaultTaskIcon} Unlimited users
									</Typography>
									<Divider />
									<Typography variant="body1">
										{defaultTaskIcon} Unlimited workflows 
									</Typography>
									<Divider />
									<Divider />
									<Typography variant="body1">
										{defaultTaskIcon} <span style={{cursor: "pointer", color: "#f86a3e",}} onClick={() => {
											if (window.drift !== undefined) {
												window.drift.api.startInteraction({ interactionId: 340043, })
											} else {
												console.log("Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ", window.drift)
											}
										}}>Free Support</span> & <a rel="noreferrer noopener" target="_blank" style={{textDecoration: "none", color: "#f85a3e",}} href="https://github.com/shuffle/shuffle">Discord access</a>
									</Typography>
								</span>
								<div style={{height: 70}} />
								{level3Button}
							</CardContent>
						</Card>
					</Grid>
					}

					<Grid item xs={isMobile ? 12 : 6}>
						<Card style={cardStyle}>	
							<CardContent style={{padding: 35}}>
								<Typography variant="h4">{shuffleVariant === 1 ? "Scale" : "Enterprise"}</Typography>
								<Typography variant="body1" color="textSecondary">
									{shuffleVariant === 0 ? 
										"SaaS / Cloud"
										:
										"Open Source + Scale License"
									}
								</Typography>

								<Typography variant="h3" style={{fontSize: 46, marginTop: 48, cursor: calculatedCores === "Get A Quote" ? "pointer" : "inherit", }} onClick={() => {
									if (calculatedCores === "Get A Quote") {
										console.log("Clicked on get a quote")
										if (window.drift !== undefined) {
											window.drift.api.startInteraction({ interactionId: 340785 })
										}
									}
								}}>{calculatedCost}</Typography>
								<Typography variant="body1" color="textSecondary" style={{}}>Per month for {shuffleVariant === 1 ? `${selectedValue} CPU cores` : `${selectedValue}k App Executions`}: </Typography>
								<div> 

									<Slider
										aria-label="Small steps"
										style={{width: "80%", margin: "auto"}}
										onChange={(event, newValue) => {
											handleChange(event, newValue)
										}}
										marks
										value={selectedValue}
										step={shuffleVariant === 0 ? 100 : 4}
										min={shuffleVariant === 0 ? 100 : 8}
										max={shuffleVariant === 0 ? 1000 : 32}
										valueLabelDisplay="auto"
									/>
								</div>

								<span style={{textAlign: "left", }}>
									<Typography variant="body1" style={{marginTop: 20, }}>
										{defaultTaskIcon} Priority Support
									</Typography>
									<Divider />
									<Typography variant="body1">
										{defaultTaskIcon} {shuffleVariant === 0 ? 
											"Multi-Tenant"
											:
											"Scalable Orborus"
										}
									</Typography>
									<Divider />
									{shuffleVariant === 0 ?
										<Typography variant="body1">
											{defaultTaskIcon} Multi-Region Tenants
										</Typography>
										:
										<Typography variant="body1">
											{defaultTaskIcon} High Availability
										</Typography>
									}
									<Divider />
									<Typography variant="body1">
										{defaultTaskIcon} Help with Workflow and App development
									</Typography>
								</span>
								<div style={{marginTop: 20, }} />
								{/*billingInfo*/}


								{level2Button}
								{shuffleVariant === 0 ?
									<Button fullWidth disabled={false} variant="outlined" color="primary" style={{marginTop: 10, borderRadius: 25, height: 40, fontSize: 14, }} onClick={() => {
										if (isLoggedIn) {
											console.log("Redirecting to Stripe!")
		
											const priceItem = window.location.origin === "https://shuffler.io" ? "app_executions" : "price_1MROFrDzMUgUjxHShcSxgHO1"

											const successUrl = `${window.location.origin}/admin?admin_tab=billing&payment=success`
											const failUrl = `${window.location.origin}/pricing?admin_tab=billing&payment=failure`
											var checkoutObject = {
												lineItems: [
													{
														price: priceItem, 
														quantity: selectedValue/100,
													},
												],
												mode: "subscription",
												billingAddressCollection: "auto",
	  										successUrl: successUrl,
	  										cancelUrl: failUrl,
												clientReferenceId: props.userdata.active_org.id,
											}

											stripe.redirectToCheckout(checkoutObject)
											.then(function (result) {
												console.log("SUCCESS STRIPE?: ", result)

												ReactGA.event({
													category: "pricing",
													action: "add_card_success",
													label: "",
												})
											})
											.catch(function(error) {
												console.error("STRIPE ERROR: ", error)

												ReactGA.event({
													category: "pricing",
													action: "add_card_error",
													label: "",
												})
											});

										} else {
											console.log("Pay now")
											navigate(`/register?view=pricing&message=You need to create a user to continue`)

											//navigate("/login?redirect=/pricing")
                      //to={`/register?app_one=${app.name}&app_two=${secondaryApp.name}&message=You need to login first to connect ${app.name} and ${secondaryApp.name}`}
										}
									}}>
										Get {selectedValue}k App Run Units
									</Button>
									:
								null}

								{/*
								<Typography variant="body2" color="textSecondary" style={{marginTop: 10, textAlign: isMobile ? "left" : "center", cursor: "pointer", }}>
									<span rel="noreferrer noopener" target="_blank" style={{textDecoration: "none", color: "#f85a3e", cursor: "pointer",}} onClick={() => {
										if (window.drift !== undefined) {
											window.drift.api.startInteraction({ interactionId: 340785 })
										} else {
											console.log("Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ", window.drift)
										}
									}}>
										Or get a quote
									</span>
								</Typography>
								*/}
							</CardContent>
						</Card>
					</Grid>

					{/*shuffleVariant === 1 ? null : 
						<Grid item xs={isMobile ? 12 : skipFreemode ? 6 : 4}>
							<Card style={cardStyle}>	
								<CardContent style={{padding: 35}}>
									<Typography variant="h4">MSSP</Typography>
									<Typography variant="body1" color="textSecondary">Cross-Customer automation</Typography>
									<Typography variant="h3" style={{marginTop: 30, }}>${paymentType === 0 ? 1999 : 2399}</Typography>
									<Typography variant="body1" color="textSecondary" style={{marginBottom: 40,}}>Per month{paymentType === 0 ? ", billed yearly" : null}</Typography>
									<Typography variant="body1" style={{}}>
										- All previous tiers 
									</Typography>
									<Typography variant="body1">
										- Extra Customer control
									</Typography>
									<Typography variant="body1">
										- Sub-organization access
									</Typography>
									<Typography variant="body1">
										- Build Shuffle into your product
									</Typography>
									<div style={{height: 10}} />
									<Button fullWidth disabled={false} variant="contained" color="primary" style={{borderRadius: 25, height: 40, margin: "60px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground,}} onClick={() => {
										ReactGA.event({
											category: "pricing",
											action: `quote_mssp_click`,
											label: "",
										})

										if (window.drift !== undefined) {
											window.drift.api.startInteraction({ interactionId: 340785 })
										} else {
											console.log("Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ", window.drift)
										}
									}}>
										Get a Quote
									</Button>
								</CardContent>
							</Card>
						</Grid>
					*/}
				</Grid>
			</div>
	
			<div style={{maxWidth: maxwidth, margin: "auto",}}>
				<Typography color="textSecondary" style={{marginTop: 25, textAlign: isMobile ? "left" : "center",}}>
					{shuffleVariant === 0 ?
						"- 100k Executions per month can handle about 500 Assets, and scales linearly."
						:
						"- 8 CPU-cores (default) can handle about 1500 Assets and scales linearly." 
					}
					<div />
					- All prices are in USD and exclude VAT
				</Typography>
				{/*
				<Typography color="textSecondary" style={{marginTop: 25, textAlign: isMobile ? "left" : "center",}}>
					Shuffle is an <a rel="noreferrer noopener" target="_blank" style={{textDecoration: "none", color: "#f85a3e",}} href="https://github.com/shuffle/shuffle">Open Source</a> project. Gives access to support, development and features not otherwise available. This applies to both Open Source & Cloud/SaaS. After the transaction is finished, you will immediately have full access to our support team, and you organization will automatically get upgraded resources assigned. 
				</Typography>
				*/}
				<Grid container style={{marginTop: 50, marginBottom: 100, }} spacing={2}>
					<Grid item xs={4} style={{textAlign: "center", marginTop: 50,}}>
						<Typography variant="h4" style={{marginBottom: 10,}}>Pay-as-you-go-pricing</Typography>
						<Typography variant="body1" style={{marginBottom: 10,}}>Simple usage based pricing with no long-term commitments</Typography>
					</Grid>
					<Grid item xs={4} style={{textAlign: "center", marginTop: 50,}}>
						<Typography variant="h4" style={{marginBottom: 10,}}>Volume Discounts</Typography>
						<Typography variant="body1" style={{marginBottom: 10,}}>Discounts trigger as your usage grows, so you always get a fair price.</Typography>
					</Grid>
					<Grid item xs={4} style={{textAlign: "center", marginTop: 50,}}>
						<Typography variant="h4" style={{marginBottom: 10,}}>Committed-use discounts</Typography>
						<Typography variant="body1" style={{marginBottom: 10,}}>Get additional discounts for annual or multi-year commitments</Typography>
					</Grid>
				</Grid>
			{!showPricing ? 
				null :
				<div style={{maxWidth: isMobile ? maxwidth : maxwidth+500, margin: "auto", marginTop: 25, }}>
					<Typography variant="h4" style={{marginBottom: 10, textAlign: "center",}}>Features ({shuffleVariant === 0 ? "Cloud" : "Self-Hosted"})</Typography>
					<List style={{marginTop: 15, }}>
						<ListItem style={{backgroundColor: theme.palette.surfaceColor}}>
							<ListItemText
								primary=""
								style={{ textAlign: "left", width: 150, maxWidth: isMobile ? 130 : "100%",}}
							/>
							<ListItemText
								primary=<b>{isMobile ? "F" : "Free"}</b>
								style={{ textAlign: "left", flex: 2}}
							/>
							{/*<ListItemText
								primary=<b>{isMobile ? "H" : "Hybrid"}</b>
								style={{ textAlign: "left", flex: 2}}
							/>*/}
							<ListItemText
								primary=<b>{isMobile ? "E" : "Enterprise / Scale"}</b>
								style={{ textAlign: "left", flex: 2}}
							/>
						</ListItem>
						{features.slice(0, parsedFields).map((data, index) => {

							//const activeData = data.active ? activeIcon : data.basic === "No" || data.basic === false ? inActiveIcon : data.basic
							const basicData = data.basic === "Yes" || data.basic === true ? activeIcon : data.basic === "No" || data.basic === false ? inActiveIcon : data.basic
							const communityData = data.community === "Yes" || data.community === true ? activeIcon : data.community === "No" || data.community === false ? inActiveIcon : data.community
							const proData = data.pro === "Yes" || data.pro === true ? activeIcon : data.pro === "No" || data.pro === false ? inActiveIcon : data.pro

							if (shuffleVariant === 0 && data.cloud === false) {
								indexskip += 1
								return null
							}

							if (shuffleVariant === 1 && data.onprem === false) {
								indexskip += 1
								return null
							}

							const newindex = index-indexskip

							return (
								<span style={{marginTop: data.title !== undefined ? 100 : 0, }}>
										{data.title !== undefined ? 
											<Typography variant="h4" style={{marginBottom: 10, marginLeft: 10, marginTop: 100, textAlign: "left", }}>
												{data.title}
											</Typography>
										: null}
									<ListItem key={index} style={{backgroundColor: newindex % 2 === 0 ? "inherit" : theme.palette.surfaceColor, }}>
										{data.active === true ? 
											<ListItemText
												primary={data.name}
												style={{ textAlign: "left", width: 150, maxWidth: isMobile ? 130 : "100%", }}
											/>
											: 
											<Tooltip title="TBD: Coming soon" placement="top">
												<ListItemText
													primary={data.name}
													style={{ color: "orange", textAlign: "left", width: 150, maxWidth: isMobile ? 130 : "100%",}}
												/>
											</Tooltip>
										}
										<ListItemText
											primary={basicData}
											style={{ textAlign: "left", flex: 2}}
										/>
										{/*
										<ListItemText
											primary={communityData}
											style={{ textAlign: "left", flex: 2}}
										/>
										*/}
										<ListItemText
											primary={proData}
											style={{ textAlign: "left", flex: 2}}
										/>
									</ListItem>
							</span>
							)
						})}
						{features.length > parsedFields ? 
							<Link to={"/pricing"} style={{textDecoration: "none", color: theme.palette.primary.main}}>
								<Button color="secondary" style={{margin: "auto", textAlign: "center",}} onClick={() => {
									ReactGA.event({
										category: "pricing",
										action: `see_all_features_click`,
										label: "",
									})
								}}>	
									See all features 
								</Button>	
							</Link>
							: null
						}
						{/*isMobile ? null : 
							<div style={{display: "flex"}}>
								{level3Button}
								<span style={{width: 50}} />
								{level1Button}
								<span style={{width: 50}} />
								{level2Button}
							</div> 
						*/}
						{/*
						<ListItem>
							<ListItemText
								primary={""}
								style={{ textAlign: "left", width: -100}}
							/>
							<ListItemText
								primary={level1Button}
								style={{ textAlign: "left", flex: 2}}
							/>
							<ListItemText
								primary={level2Button}
								style={{ textAlign: "left", flex: 2}}
							/>
						</ListItem>
						*/}

					</List>
				</div>
			}
			</div>
			<Typography variant={isMobile ? "h6" : "h4"} style={{marginTop: 100,}}>Scalable models for MSSPs</Typography>	
			<Typography variant="body1" color="textSecondary" style={{margin: "auto", marginTop: 15, maxWidth: maxwidth/3*2}}>
				Need support and automation help for diverse and scalable environments? Our Enterprise and MSSP offerings can help you whether Onprem or in our cloud. 
			</Typography>
			<Grid container spacing={4} style={{width: maxwidth/3*2, margin: "auto", marginTop: 20, marginBottom: 100,}}>
				<Grid item xs={isMobile ? 12 : 6}>
					<Card style={cardStyle}>	
						<CardContent style={{padding: 35}}>
							<Typography variant="h4">Open Source</Typography>
							<Typography variant="body1" color="textSecondary">CPU-core-based</Typography>
							<Typography variant="h6" color="textSecondary" style={{marginBottom: 0, marginTop: 30, }}>8 cores included in sub</Typography>
							<Typography variant="h3" style={{display: "inline-block"}}>$75 /&nbsp;</Typography>
							<Typography variant="h6" style={{display: "inline-block"}}>CPU-core</Typography>
							<Typography variant="body1" color="textSecondary" style={{marginBottom: 40,}}>
								Per month
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={isMobile ? 12 : 6}>
					<Card style={cardStyle}>	
						<CardContent style={{padding: 30, paddingTop: 35,}}>
							<Typography variant="h4">Cloud</Typography>
							<Typography variant="body1" color="textSecondary">App-Execution based</Typography>
							<Typography variant="h6" color="textSecondary" style={{marginBottom: 0, marginTop: 35, }}>Pay-as-you-go</Typography>
							<Typography variant="h3" style={{fontSize: 34, display: "inline-block"}}>${typecost_single} /&nbsp;</Typography>
							<Typography variant="h6" style={{display: "inline-block"}}>app-runs</Typography>
							<Typography variant="body1" color="textSecondary" style={{marginBottom: 40,}}>Per month</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Typography variant={isMobile ? "h6" : "h4"} style={{margin: "auto", width: maxwidth/3*2, marginBottom: 10, }}>Cloud, Hybrid & Onprem</Typography>	
			<Typography variant="body1" color="textSecondary" style={{margin: "auto", width: maxwidth/3*2, marginBottom: 25, }}>
				Our support model is built for both the Cloud and Onpremises version of Shuffle, and can be managed between both. <Link rel="noreferrer noopener" target="_blank" style={{textDecoration: "none", color: "#f85a3e",}} to="/contact">Contact us </Link>for more info, or to get a quote from one of our <Link rel="noreferrer noopener" target="_blank" style={{textDecoration: "none", color: "#f85a3e",}} to="/partner">verified resellers.</Link>
			</Typography>
      <img src="images/partner/models.jpeg" alt="Shuffle MSSP and Open Source" style={{width: isMobile ? "100%" : 500, margin: "auto", borderRadius: theme.palette.borderRadius, }} />

			<div style={{marginBottom: 100}} />
			{removeAdditions === true ? null :
				<span>
					<FAQ theme={theme} type={"pricing"}/>
					<Services removeAdditions={true} theme={theme} isLoaded={isLoaded} userdata={props.userdata} maxFields={15} {...props} />
					<div style={{marginTop: 150, marginBottom: 100,}}>
						<Typography variant="h4">
							Got other questions?
						</Typography>
						<Typography variant="body1" color="textSecondary" style={{marginBottom: 200}}>
							If you got more questions about our pricing and plans, please <Link to="/contact" style={{textDecoration: "none", color: theme.palette.primary.main}}>contact us</Link> so we can help	
						</Typography>
						<Newsletter globalUrl={"https://shuffler.io"} />
					</div>
				</span>
			}

		</div>

	const setMonthlyCost = (variant, paymentType) => {
		setErrorMessage("")
		if (variant === 0 && paymentType === 0) {
			setCurrentPrice(129)
		} else if (variant === 0 && paymentType === 1) {
			setCurrentPrice(155)
		} else if (variant === 1 && paymentType === 0) {
			setCurrentPrice(999)
		} else if (variant === 1 && paymentType === 1) {
			setCurrentPrice(1199)
		} else if (variant === 2 && paymentType === 0) {
			setCurrentPrice(15)
		} else if (variant === 2 && paymentType === 1) {
			setCurrentPrice(18)
		}
	}

	const modalView = modalOpen ? 
		<Dialog 
			open={modalOpen} 
			onClose={() => {
				setModalOpen(false)
				ReactGA.event({
					category: "pricing",
					action: `close_window_outside_click`,
					label: "",
				})
			}}
			PaperProps={{
				style: {
					backgroundColor: "#1f2023",
					color: "white",
					minWidth: isMobile ? "100%" :500,
					padding: 30,
				},
			}}
		>
			<FormControl>
				<DialogTitle><div style={{color: "white"}}>Shuffle payments</div></DialogTitle>
				<DialogContent>
					<Typography variant="body1">
						Choose recurrence
					</Typography>
					<ButtonGroup style={{height: 50}} color="primary" aria-label="outlined secondary button group">
					  <Button style={{width: 100}} variant={paymentType === 0 ? "contained" : "outlined"} onClick={() => {
							setPaymentType(0)
							setMonthlyCost(variant, 0)
							ReactGA.event({
								category: "pricing",
								action: `yearly_modal_click`,
								label: "",
							})
						}}>Yearly</Button>
					  <Button style={{width: 100}} variant={paymentType === 1 ? "contained" : "outlined"} onClick={() => {
							setPaymentType(1)
							setMonthlyCost(variant, 1)
							ReactGA.event({
								category: "pricing",
								action: `monthly_modal_click`,
								label: "",
							})
						}}>Monthly</Button>
					</ButtonGroup>
					<div/>
					<Card style={{marginTop: 25, backgroundColor: theme.palette.surfaceColor}}>
						<CardContent style={{padding: 25}}>
							<Typography color="textSecondary">
								Your plan:
							</Typography>
							<Typography color="textSecondary">
								Shuffle <b>{variant === 0 ? "Community" : variant === 2 ? "Free" : "Pro"}</b> Edition
							</Typography>
							<Divider style={{marginTop: 15, marginBottom: 15}}/>
							<div style={{display: "flex"}}>
								<Typography color="textSecondary" style={{flex: 1}}>
									Monthly subtotal: 
								</Typography>
								<Typography variant="h6" color="textSecondary" style={{flex: 1, textAlign: "right"}}>
									${currentPrice}
								</Typography>
							</div>
							<div style={{display: "flex"}}>
								<Typography  color="textSecondary" style={{flex: 1}}>
									Discount:	
								</Typography>
								<Typography variant="h6"  color="textSecondary"style={{flex: 1, textAlign: "right"}}>
									{paymentType === 0 ? "20%" : "0%"}
								</Typography>
							</div>
							<div style={{display: "flex"}}>
								<Typography  color="textSecondary" style={{flex: 1}}>
									Beta opt-in:	
								</Typography>
								<Typography variant="h6"  color="textSecondary"style={{flex: 1, textAlign: "right"}}>
									Extra features
								</Typography>
							</div>
							<Divider style={{marginTop: 15, marginBottom: 15}}/>
							<div style={{display: "flex"}}>
								<Typography  color="textSecondary"style={{flex: 1}}>
									What you'll pay now: 
								</Typography>
								<Typography  color="textSecondary"variant="h4" style={{flex: 1, textAlign: "right"}}>
									${paymentType === 0 ? currentPrice*12 : currentPrice}
								</Typography>
							</div>
						</CardContent>
					</Card >



					<Button variant="contained" color="primary" style={{height: 50, marginTop: 25, width: 200,}}onClick={() => {
						handleStripeRedirect(variant, paymentType)
					}}>
						Pay now
					</Button>
					<Typography variant="body1" style={{marginTop: 15}}>
						Your plan will renew each {paymentType === 0 ? "year" : "month"}.
					</Typography>
					{/*<img src="/images/stripe.svg" style={{height: 100}} />*/}
				</DialogContent>
				<DialogActions>
					<Button style={{}} onClick={() => {
						setModalOpen(false)
						ReactGA.event({
							category: "pricing",
							action: `close_window_cancel_click`,
							label: "",
						})
					}} color="primary">
						Cancel
					</Button>
				</DialogActions>
			</FormControl>
		</Dialog>
		: null

		return (
			<div style={{paddingBottom: 100}}>
				{topRet}
				{modalView} 
			</div>
		)
}

export default PaymentField;
