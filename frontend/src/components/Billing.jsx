import React, { useState, useEffect } from "react";
import ReactGA from 'react-ga4';

import theme from "../theme.jsx";
import { useTheme } from "@mui/styles";
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
} from "@mui/material";

import { useNavigate, Link } from "react-router-dom";
import { Autocomplete } from "@mui/material";
import { toast } from "react-toastify" 

import {
  Cached as CachedIcon,
} from "@mui/icons-material";

//import { useAlert 
import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";
import BillingStats from "../components/BillingStats.jsx";

const Billing = (props) => {
  const { globalUrl, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, } = props;
  //const alert = useAlert();
  let navigate = useNavigate();

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

	const stripe = typeof window === 'undefined' || window.location === undefined ? "" : props.stripeKey === undefined ? "" : window.Stripe ? window.Stripe(props.stripeKey) : ""
	const products = [
    { code: "", label: "MSSP", phone: "" },
    { code: "", label: "Enterprise", phone: "" },
    { code: "", label: "Consultancy", phone: "" },
    { code: "", label: "Support", phone: "" },
  ];

	const handleGetDeals = (orgId) => {
    console.log("Get deals!");

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
		height: "100%",
		minHeight: 280,
		maxWidth: 400,
		width: "100%",
		backgroundColor: theme.palette.surfaceColor,
		borderRadius: theme.palette.borderRadius,
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

	const SubscriptionObject = (props) => {
  		const { globalUrl, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, subscription, highlight, } = props;

		var top_text = "Base Access"
		if (subscription.limit === undefined && subscription.level === undefined || subscription.level === null || subscription.level === 0) {
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

		var newPaperstyle = JSON.parse(JSON.stringify(paperStyle))
		if (subscription.name === "Enterprise" && subscription.active === true) {
			top_text = "Current Plan"

			newPaperstyle.border = "1px solid #f85a3e"
		}

		var showSupport = false
		if (subscription.name.includes("default")) {
			top_text = "Custom Contract"
			newPaperstyle.border = "1px solid #f85a3e"
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
		}

		if (highlight === true) {
			// Add an "Upgrade now" button
			newPaperstyle.border = "1px solid #f85a3e"
		}

		return (
			<Paper style={newPaperstyle}>
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

						{subscription.currency_text !== undefined ?
							<div style={{display: "flex", }}>
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
											style={{ textDecoration: "none", color: "#f85a3e",}}
										>
											Documentation to get started
										</a>
								}

								if (feature.includes("Licensed Worker: ")) {
									parsedFeature =
										<a
											href={feature.split("Licensed Worker: ")[1]}
											target="_blank"
											style={{ textDecoration: "none", color: "#f85a3e",}}
										>
											Download the licensed worker
										</a>
								}

								return (
									<li key={index}>
										<Typography variant="body2" color="textPrimary" style={{ }}>
											{parsedFeature}
										</Typography>
									</li>
								)
							})
							: null}
						</ul>
					</div>
					{(highlight === true && subscription.name === "Pay as you go" && subscription.limit <= 10000) || subscription.name.includes("Scale") ?
						<span>
							<Typography variant="body2" color="textSecondary" style={{ marginTop: 20, marginBottom: 10 }}>
								{subscription.name.includes("Scale") ? 
									"" 
									: 
									"You are not subscribed to any plan and are using the free plan with max 10,000 app runs per month. Upgrade to deactivate this limit."
								}
							</Typography>
							<Button 
								variant="contained" 
								color="primary" 
								style={{ marginTop: 20, marginBottom: 10, }}
								onClick={() => {
									if (isCloud) {
										navigate("/pricing?tab=cloud&highlight=true")
									} else {
										window.open("https://shuffler.io/pricing?tab=onprem&highlight=true", "_blank")
									}
								}}
							>
								Upgrade Now	
							</Button>
						</span>
					: null}
				{showSupport ? 
					<Button variant="outlined" color="primary" style={{ marginTop: 20, marginBottom: 10, }} onClick={() => {
						console.log("Support click")
						if (window.drift !== undefined) {
							//window.drift.api.startInteraction({ interactionId: 340045 })
							window.drift.api.startInteraction({ interactionId: 340043 })
						} else {
							navigate("/contact")
						}
					}}>
						Get Support
					</Button>
				: null } 
		</Paper>
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

	return (
		<div>
      		{addDealModal}
			<Typography variant="h6" style={{ marginTop: 20, marginBottom: 10 }}>
				Billing	
			</Typography>
			<Typography variant="body1" color="textSecondary" style={{ marginTop: 0, marginBottom: 10}}>
				{isCloud ? 
					"We use Stripe to manage subscriptions and do not store any of your billing information. You can manage your subscription and billing information below."
					:
					"Shuffle is an Open Source automation platform, and no license is required to use it. You may however activate Cloud Sync, get our Scale license, get help with Kubernetes, or talk to Shuffle's Support team to get automation help."
				}
			</Typography>
			<div style={{display: "flex", maxWidth: 768, minWidth: 768, }}>
				{isCloud && billingInfo.subscription !== undefined && billingInfo.subscription !== null  ?
					<SubscriptionObject
						globalUrl={globalUrl}
						userdata={userdata}
						serverside={serverside}
						billingInfo={billingInfo}
						stripeKey={stripeKey}
						selectedOrganization={selectedOrganization}
						subscription={billingInfo.subscription}
						highlight={selectedOrganization.subscriptions === undefined || selectedOrganization.subscriptions === null || selectedOrganization.subscriptions.length === 0}
					/>
				: !isCloud ? 
					<span style={{display: "flex", }}>
						<SubscriptionObject
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
						/>
						<SubscriptionObject
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
						/>
					</span>
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
					{isCloud &&
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
            ) : null}
			<div style={{ marginTop: 30, }}>
				<Typography
				  style={{ marginTop: 40, marginLeft: 10, marginBottom: 5 }}
				  variant="h6"
				>
					Shuffle Utilization 
				</Typography>
			  </div>
			  <BillingStats
				globalUrl={globalUrl}
				selectedOrganization={selectedOrganization}	
				userdata={userdata}
			  />
		</div>
	)
}

export default Billing;
