import React, { useState, useEffect } from "react";
import theme from "../theme.jsx";
import ReactGA from 'react-ga4';

import {
	Paper,
  Typography,
	Divider,
	Button,
	Grid,
	Card,
} from "@mui/material";

import { useAlert } from "react-alert";
import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";

const Billing = (props) => {
  const { globalUrl, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, } = props;
	console.log("Billing: ", billingInfo);
  const alert = useAlert();

	const stripe = typeof window === 'undefined' || window.location === undefined ? "" : props.stripeKey === undefined ? "" : window.Stripe ? window.Stripe(props.stripeKey) : ""
	console.log("Stripe: ", stripe)

	const paperStyle = {
		padding: 20,
		height: "100%",
		width: "100%",
		backgroundColor: theme.palette.surfaceColor,
		border: "1px solid rgba(255,255,255,0.3)",
		marginRight: 10, 
	}

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

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

		const successUrl = `${window.location.origin}/admin?admin_tab=billing&payment=success`
		const failUrl = `${window.location.origin}/admin?admin_tab=billing&payment=failure`
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
		.catch(function(error) {
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
          alert.success("Successfully stopped subscription!");
        } else {
          alert.error("Failed stopping subscription. Please contact us.");
        }
      })
      .catch(function (error) {
        console.log("Error: ", error);
        alert.error("Failed stopping subscription. Please contact us.");
      });
  };

	const SubscriptionObject = (props) => {
  	const { globalUrl, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, subscription, } = props;

		console.log("Sub: ", subscription)
		var top_text = "Base Access"
		if (subscription.limit === undefined && subscription.level !== undefined) {

			subscription.name = "Enterprise"
			subscription.currency_text = "$"
			subscription.price = subscription.level*180
			subscription.limit = subscription.level*100000
			subscription.interval = subscription.recurrence
			subscription.features = [
				"Includes " + subscription.limit + " app runs/month. ",
				"Multi-Tenancy and Region-Selection", 
				"And all other features from /pricing",
			]
		}

		if (subscription.name === "Enterprise" && subscription.active === true) {
			top_text = "Current Plan"
		}

		return (
			<Paper style={paperStyle}>
				<div style={{display: "flex"}}>
					<Typography variant="h6" style={{ marginTop: 10, marginBottom: 10 }}>
						{top_text}
					</Typography>
				</div>
				<Divider />	
					<div>
						<Typography variant="body1" style={{ marginTop: 20, }}>
							{subscription.name}
						</Typography> 
						<div style={{display: "flex", }}>
							<Typography variant="h6" style={{ marginTop: 10, }}>
								{subscription.currency_text}{subscription.price} 
							</Typography> 
							<Typography variant="body1" color="textSecondary" style={{ marginLeft: 10, marginTop: 15, marginBottom: 10 }}>
								/ {subscription.interval}
							</Typography> 
						</div>
						<Typography variant="body2" color="textSecondary" style={{ marginTop: 10, }}>
							Features
						</Typography> 
						<ul>
						{subscription.features !== undefined && subscription.features !== null ?
							subscription.features.map((feature, index) => {
								return (
									<li>
										<Typography variant="body2" color="textPrimary" style={{ }}>
											{feature}
										</Typography>
									</li>
								)
							})
							: null}
						</ul>
					</div>
					{/*subscription.name === "Pay as you go" && subscription.limit <= 10000 ?
						<span>
							<Typography variant="body2" color="textSecondary" style={{ marginTop: 20, marginBottom: 10 }}>
								You are not subscribed to any plan and are using the free plan with max 10,000 apps per month. Activate billing to de-activate this limit.
							</Typography>
							<Button 
								variant="contained" 
								color="primary" 
								style={{ marginTop: 20, marginBottom: 10, }}
								onClick={() => {
									handleStripeRedirect() 
								}}
							>
								Activate Billing
							</Button>
						</span>
					: null*/}
		</Paper>
		)
	}


	return (
		<div>
			<Typography variant="h6" style={{ marginTop: 20, marginBottom: 10 }}>
				Billing	
			</Typography>
			<Typography variant="body1" style={{ marginTop: 20, marginBottom: 10 }}>
				We use Stripe to manage subscriptions and do not store any of your billing information. You can manage your subscription and billing information below.
			</Typography>
			<div style={{display: "flex", maxWidth: 768, minWidth: 768, }}>
				{billingInfo.subscription !== undefined && billingInfo.subscription !== null  ?
					<SubscriptionObject
						globalUrl={globalUrl}
						userdata={userdata}
						serverside={serverside}
						billingInfo={billingInfo}
						stripeKey={stripeKey}
						selectedOrganization={selectedOrganization}
						subscription={billingInfo.subscription}
					/>
				: null}
				{isCloud &&
					selectedOrganization.subscriptions !== undefined &&
					selectedOrganization.subscriptions !== null &&
					selectedOrganization.subscriptions.length > 0 ? 

						selectedOrganization.subscriptions
							.reverse()
							.map((sub, index) => {
								return (
									<SubscriptionObject
										globalUrl={globalUrl}
										userdata={userdata}
										serverside={serverside}
										billingInfo={billingInfo}
										stripeKey={stripeKey}
										selectedOrganization={selectedOrganization}
										subscription={sub}
									/>
								)
							})
				: null}
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
		</div>
	)
}

export default Billing;
