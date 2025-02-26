import React, { useState, useEffect } from "react";
import ReactGA from 'react-ga4';

import theme from "../theme.jsx";
import countries from "../components/Countries.jsx";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Button,
    Grid,
    Card,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    InputAdornment,
    IconButton,
    Chip,
    Checkbox,
    Tooltip,
    Slider,
    DialogActions,
    CardContent,
    ButtonGroup,
    DialogContentText,
} from "@mui/material";

import { useNavigate, Link } from "react-router-dom";
import { Autocomplete } from "@mui/material";
import { toast } from "react-toastify"

import {
    Cached as CachedIcon,
    ContentCopy as ContentCopyIcon,
    Draw as DrawIcon,
    Close as CloseIcon,
    Done as DoneIcon,
    Clear as ClearIcon,
    AddTask as AddTaskIcon,
} from "@mui/icons-material";

import { typecost, typecost_single, } from "../views/HandlePaymentNew.jsx";
import { handlePayasyougo } from "../views/HandlePaymentNew.jsx"
import Billing from "./Billing.jsx";

const LicencePopup = (props) => {
    const { globalUrl, userdata, serverside, billingInfo, stripeKey, setModalOpen, isLoggedIn, isMobile, selectedOrganization, isCloud } = props;
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
    const [variant, setVariant] = useState(0)
    const [shuffleVariant, setShuffleVariant] = useState(isCloud ? 0 : 1)
    const [BillingEmail, setBillingEmail] = useState(selectedOrganization?.Billing?.Email);
    const [openChangeEmailBox, setOpenChangeEmailBox] = useState(false);
    // const parsedFields = maxFields === undefined ? 300 : maxFields
    const initialShuffleVariant = isCloud ? 0 : 1;
    const [paymentType, setPaymentType] = useState(0)
    const [currentPrice, setCurrentPrice] = useState(129)
    const [isLoaded, setIsLoaded] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [highlight, setHighlight] = useState(false)

    // Cloud
    const [calculatedApps, setCalculatedApps] = useState(600)
    const [calculatedCost, setCalculatedCost] = useState("$600")
    const [selectedValue, setSelectedValue] = useState(100)

    useEffect(() => {
        if(selectedOrganization?.Billing?.Email !== BillingEmail) {
            setBillingEmail(selectedOrganization?.Billing?.Email);
        }
    }, [selectedOrganization])

    // Onprem
    const [calculatedCores, setCalculatedCores] = useState('600')
    const [onpremSelectedValue, setOnpremSelectedValue] = useState(8)

    const payasyougo = "Pay as you go"
    const stripe = typeof window === 'undefined' || window.location === undefined ? "" : props.stripeKey === undefined ? "" : window.Stripe ? window.Stripe(props.stripeKey) : ""

    const paperStyle = {
        padding: 20,
        borderRadius: theme.palette?.borderRadius,
        height: "100%"
    }

    billingInfo.subscription = {
        "active": true,
        "name": "Pay as you go",
        "price": typecost_single,
        "currency": "USD",
        "currency_text": "$",
        "interval": "app run / month",
        "description": "Pay as you go",
        "features": [
            "Basic Support",
            "Includes 10.000 app run/month for free. ",
            "Pay for what you use with no minimum commitment and cancel anytime."
        ],
        "limit": 10000,
    }

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
            // newPaperstyle.border = "1px solid #f85a3e"
        }

        const handleClickOpen = () => {
			setOpenChangeEmailBox(true);
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
                billing: {
                    email: newBillingEmail,
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
            <Tooltip
                style={{ borderRadius: theme.palette?.borderRadius, }}
                placement="bottom"
            >
                <div style={{}}>
                    <Paper
                        style={newPaperstyle}
                    // onMouseEnter={() => setHovered(true)}
                    // onMouseLeave={() => setHovered(false)}
                    >
                        <Dialog
                            open={signatureOpen}
                            PaperProps={{
                                style: {
                                    pointerEvents: "auto",
                                    color: "white",
                                    minWidth: 750,
                                    padding: 30,
                                    maxHeight: 700,
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                    zIndex: 10012,
                                    // border: theme.palette.defaultBorder,
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
                                    By clicking the “accept” button, you are signing the document, electronically agreeing that it has the same legal validity and effects as a handwritten signature, and that you have the competent authority to represent and sign on behalf an entity. Need support or have questions? Contact us at support@shuffler.io.
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
                        <div style={{ display: "flex" }}>
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
                            <Typography variant="h6" style={{ marginTop: 10, marginBottom: 10, flex: 5, whiteSpace: 'nowrap' }}>
                                {top_text}
                            </Typography>

                            {top_text === "Base Cloud Access" && userdata.has_card_available === false ?
                                <img
                                    src="/images/stripenew.png"
                                    style={{
                                        margin: "auto",
                                        width: 100,
                                        backgroundColor: "white",
                                        // borderRadius: theme.palette?.borderRadius,
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
                            <Typography variant="body1" style={{ marginTop: 20,whiteSpace: 'nowrap'  }}>
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
                                                            // backgroundColor: theme.palette.inputColor,
                                                            // borderRadius: theme.palette?.borderRadius,
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
							{isCloud && (userdata.has_card_available === true || selectedOrganization?.Billing?.Email?.length > 0 )? 
                            	<div>
                                    <span>Billing email: {BillingEmail}</span>
                                    <Button
                                        variant="contained"
                                        onClick={handleClickOpen}
                                        style={{
                                            width: 'auto',
                                            height: 20,
                                            textTransform: 'none',
                                            marginLeft: 'auto',
                                            backgroundColor: 'transparent',
                                            color: '#FF8544',
                                            boxShadow: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.3s, color 0.3s',
                                        }}
                                    >
                                        Change
                                    </Button>
                                    <Dialog
								open={openChangeEmailBox}
								onClose={()=> {setOpenChangeEmailBox(false)}}
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
                                      '& .MuiDialogActions-root': {
                                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                                        },
                                    }
                                  }}
							>
								<DialogTitle style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Change Billing Email</DialogTitle>
								<DialogContent>
									<DialogContentText style={{ marginBottom: '20px', fontSize: 16, }}>
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
										onClick={()=> {setOpenChangeEmailBox(false)}}
										color="primary"
										style={{ textTransform: 'none', marginRight: '10px' }}
									>
										Cancel
									</Button>
									<Button
										style={{ textTransform: 'none', backgroundColor: "#ff8544", color: "#1a1a1a" }}
										onClick={(event) => HandleChangeBillingEmail(selectedOrganization.id)}
									>
										Save
									</Button>
								</DialogActions>
							</Dialog>
                                </div>
							: null}
                        </div>
                        {isCloud ? (
                            <Button
							fullWidth
							disabled={false}
							color="primary"
							style={{
								marginTop: !userdata.has_card_available ? 20 : 10,
								borderRadius: 4,
								height: 40,
								fontSize: 16,
								color: "#1a1a1a",
								backgroundColor: "#ff8544",
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
						</Button> ) : null}
                            <Button
                            variant="outlined"
                            style={{
                                marginTop: isCloud? 10 : 30,
                                borderRadius: 4,
                                width: "100%",
                                cursor: "pointer",
                                textTransform: "capitalize",
                                backgroundColor: "transparent",
                                fontSize: 16,
                                position: "relative", // Required for positioning tooltip
                            }}
                            title="Click to book a call"
                            onClick={() => {
                                if (isCloud) {
                                ReactGA.event({
                                    category: "header",
                                    action: "bookcall_upgread_popup",
                                    label: "",
                                })};
                                window.open("https://drift.me/frikky/meeting", "_blank");
                                // if (isLoggedIn) {
                                // isLoggedInHandler()
                                // } else {
                                // navigate(`/register?view=pricing&message=You need to create a user to continue`)
                                // }
                            }}
                        >
							<span>
                            	Book a call
							</span>
                            <span
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                                    color: "#FFFFFF",
                                    borderRadius: "4px",
                                    padding: "4px 8px",
                                    fontSize: "14px",
                                    whiteSpace: "nowrap",
                                    opacity: 0,
                                    transition: "visibility 0s, opacity 0.1s linear", 
                                }}
                            >
                                Click to book a call
                            </span>
                        </Button>
                        
                    </Paper>
                    {/*
			<div style={{ paddingRight: 150, display: "flex", alignItems: "baseline" }}>
				
				<Link to="https://drift.me/frikky/meeting" target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, marginLeft: 10 }}>Schedule Call Now</Link>
			</div>
			*/}

                </div>
            </Tooltip>
        )
    }

    useEffect(() => {
		console.log("New variant: ", shuffleVariant)

		if (shuffleVariant === 1) {
			setCalculatedCost("$960")
			setSelectedValue(8)
		} else {
			setCalculatedCost("$960")
			setSelectedValue(300)
		}
	}, [shuffleVariant])

    if (typeof window === 'undefined' || window.location === undefined) {
        return null
    }

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

    const handleChange = (event, newValue) => {

        if (shuffleVariant === 1) {
            setSelectedValue(newValue)
            if (newValue === 32) {
                setCalculatedCost(`Get A Quote`)
            } else {
                setCalculatedCost(`$${newValue * 120}`)
            }
        } else {
            setSelectedValue(newValue)
            if (newValue < 300) {
                setCalculatedCost(`Pay as you go`)
            } else if (newValue === 1000) {
                setCalculatedCost(`Get A Quote`)
            } else {
                setCalculatedCost(`$${newValue * 1000 * typecost}`)
            }
        }
    }

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
                setShuffleVariant(1);
            } else if (foundTab === "cloud") {
                setShuffleVariant(0);
            }
        }

        const foundHighlight = params["highlight"];
        if (foundHighlight !== null && foundHighlight !== undefined) {
            setHighlight(true)
        }
    }

    //const skipFreemode = window.location.pathname.startsWith("/admin") 
    const skipFreemode = false
    const maxwidth = isMobile ? "91%" : skipFreemode ? 1100 : 1200
    const activeIcon = <DoneIcon style={{ color: "green" }} />
    const inActiveIcon = <ClearIcon style={{ color: "red" }} />
    const defaultTaskIcon = <AddTaskIcon style={{ marginRight: 10, marginTop: 5, }} />

    const buttonBackground = "linear-gradient(to right, #f86a3e, #f34079)"
    const level1Button =
        <Button fullWidth variant="contained" color="primary" style={{ borderRadius: 25, height: 40, margin: "15px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground, }} onClick={() => {
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
        <Button fullWidth disabled={false} variant="outlined" color="primary" style={{ marginTop: shuffleVariant === 0 ? 20 : 45, borderRadius: 25, height: 40, fontSize: 14, color: isLoggedIn && shuffleVariant === 0 ? "black" : "white", backgroundImage: isLoggedIn && shuffleVariant === 0 ? "inherit" : buttonBackground, }} onClick={() => {

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
        <Button fullWidth disabled={false} variant="contained" color="primary" style={{ borderRadius: 25, height: 40, margin: "15px 0px 15px 0px", fontSize: 14, color: "white", backgroundImage: buttonBackground, }} onClick={() => {

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
        }}>
            Start building!
        </Button>


    const cardStyle = {
        // height: "100%",
        // width: "100%",
        // textAlign: "center",
        color: "white",
    }

    console.log("Priceitem: ", shuffleVariant)
    const isLoggedInHandler = () => {
        if (calculatedCost === payasyougo) {
            handlePayasyougo(props.userdata)
            return
        }

        const priceItem = window.location.origin === "https://shuffler.io" ?
            shuffleVariant === 0 ? "app_executions" : "cores"
            :
            shuffleVariant === 0 ? "price_1PZPSSEJjT17t98NLJoTMYja" : "price_1PZPQuEJjT17t98N3yORUtd9"

        const successUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=success`
        const failUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=failure`

        console.log("Priceitem: ", priceItem, shuffleVariant)
        var checkoutObject = {
            lineItems: [
                {
                    price: priceItem,
                    quantity: shuffleVariant === 0 ? selectedValue / 100 : selectedValue,
                },
            ],
            mode: "subscription",
            billingAddressCollection: "auto",
            successUrl: successUrl,
            cancelUrl: failUrl,
            clientReferenceId: props.userdata.active_org.id,
        }

		if (stripe === undefined || stripe === null || stripe.redirectToCheckout === undefined) {
			window.open("https://shuffler.io/admin?admin_tab=billingstats&payment=stripe_error", "_self")
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
            .catch(function (error) {
                console.error("STRIPE ERROR: ", error)

                ReactGA.event({
                    category: "pricing",
                    action: "add_card_error",
                    label: "",
                })
            })
    }

    return (
        <div>
            <Grid container spacing={2} columns={16} style={{ flexDirection: "row", flexWrap: "nowrap", borderRadius: '16px', display: "flex", }}>
                <Grid item xs={8}>
                    {isCloud && billingInfo.subscription !== undefined && billingInfo.subscription !== null ?
                        <SubscriptionObject
                            index={0}
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
                            <span style={{ display: "flex", }}>
                                <SubscriptionObject
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
                                />
								{/*
                                <SubscriptionObject
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
                                />
								*/}
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
                        : null}
                </Grid>
                <Grid item xs={8}>
                    <Grid style={{}}>
                        {errorMessage.length > 0 ? <Typography variant="h4">Error: {errorMessage}</Typography> : null}
                        <Card style={{
                            padding: 20,
                            borderRadius: theme.palette?.borderRadius,
                            border: "1px solid #f85a3e",
                        }}>
                            <div>
                                <Button style={{ backgroundColor: 'rgba(255, 132, 68, 0.2)', color: "#FF8444", textTransform: "capitalize", borderRadius: 200, boxShadow: 'none', }}
                                    variant="contained"
                                    color="primary">Recommended </Button>

                            </div>
                            <Typography variant="h6" style={{ marginTop: 10, marginBottom: 10, flex: 5, }}>{shuffleVariant === 1 ? "Scale" : "Enterprise"}</Typography>
                            <Divider />
                            <Typography variant="body1" color="textSecondary" style={{ marginTop: 20 }}>
                                {shuffleVariant === 0 ?
                                    "SaaS / Cloud - Per Month"
                                    :
                                    "Open Source + Scale License"
                                }
                            </Typography>

                            <Typography style={{ minHeight: 46, cursor: calculatedCores === "Get A Quote" ? "pointer" : "inherit", }} onClick={() => {

                                if (calculatedCores === "Get A Quote") {
                                    console.log("Clicked on get a quote")
                                    if (window.drift !== undefined) {
                                        window.drift.api.startInteraction({ interactionId: 340785 })
                                    }
                                }
                            }}>{calculatedCost}</Typography>
                            <Typography variant="body1" color="textSecondary" style={{}}>For {shuffleVariant === 1 ? `${selectedValue} CPU cores` : `${selectedValue}k App Runs`}: </Typography>
                            <div style={{ textAlign: "center" }}>

                                <Slider
                                    aria-label="Small steps"
                                    style={{ width: "80%", margin: "auto" }}
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

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{defaultTaskIcon}</span>
                                    <Typography style={{ fontSize: 14, marginLeft: 8 }}>Priority Support</Typography>
                                </div>
                                <Divider />
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{defaultTaskIcon}</span>
                                    <Typography style={{ fontSize: 14, marginLeft: 8 }}>
                                        {shuffleVariant === 0 ? "Multi-Tenant" : "Lightning-Fast Workflows"}
                                    </Typography>
                                </div>
                                <Divider />
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{defaultTaskIcon}</span>
                                    <Typography style={{ fontSize: 14, marginLeft: 8 }}>
                                        {shuffleVariant === 0 ? "Multi-Region Tenants" : "High Availability"}
                                    </Typography>
                                </div>
                                <Divider />
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{defaultTaskIcon}</span>
                                    <Typography style={{ fontSize: 14, marginLeft: 8 }}>Help with Workflow and App development</Typography>
                                </div>
                            </div>
                            <div style={{ marginTop: 20, }} />
                            <DialogActions style={{ marginTop: 15 }} >
                <div style={{display: 'flex', flexDirection: 'column', width: "100%", justifyContent: 'space-between', gap: "10px"}}>
                <Button
                    style={{ borderRadius: "4px", textTransform: "capitalize",  width: "100%", fontSize: 16}}
                    variant="outlined"
                    onClick={() => {
                        if (isCloud) {
							ReactGA.event({
								category: "header",
								action: "viewplan_upgread_popup",
								label: "",
							})
                        
							navigate("/pricing")
						} else {
							window.open("https://shuffler.io/pricing?tab=onprem", "_blank")
						}
                    }}
                    color="primary"
                >
                    View all plans
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: 4, textTransform: "capitalize", color: "#1a1a1a", backgroundColor: "#ff8544", width: "100%", fontSize: 16}}
                    onClick={() => {
                        if (isCloud) {
							ReactGA.event({
								category: "header",
								action: "upgread_clicks_popup",
								label: "",
							})

							if (isLoggedIn) {
								isLoggedInHandler()
							} else {
								navigate(`/register?view=pricing&message=You need to create a user to continue`)
							}
						} else {
							if (window.drift !== undefined) {
								window.drift.api.startInteraction({ 
									interactionId: 386403, 
								})
							}
						}
                    }}
                    color="primary"
                >
                    Upgrade
                </Button>
                </div>
            </DialogActions>
                        </Card>
                    </Grid>
                </Grid>
            </Grid> 
        </div>
    )
}

export default LicencePopup;
