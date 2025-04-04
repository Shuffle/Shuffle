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
    ToggleButton,
    ToggleButtonGroup,
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
    const { globalUrl, userdata, serverside, billingInfo, stripeKey, setModalOpen, isScale, isLoggedIn, isMobile, selectedOrganization, isCloud, features, licensePopup = false } = props;
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

    const [billingCycle, setBillingCycle] = useState("annual")
    const [scaleValue, setScaleValue] = useState(
        new URLSearchParams(window.location.search).get("app_runs") || 
        (userdata?.app_execution_limit / 1000) + 50 || 10
    );

    useEffect(() => {
        setScaleValue((userdata?.app_execution_limit / 1000) + 50 || 10)
    }, [userdata])

    const getPrice = (basePrice) => {
        return Math.round(billingCycle === "annual" ? basePrice * 0.9 : basePrice); // 10% discount for annual
    };
    
    const stripe = typeof window === 'undefined' || window.location === undefined ? "" : props.stripeKey === undefined ? "" : window.Stripe ? window.Stripe(props.stripeKey) : ""

  // Handle slider change for Scale plan
    const handleScaleChange = (event, newValue) => {
        setScaleValue(newValue);

        // Add app runs to URL query params
        const urlSearchParams = new URLSearchParams(window.location.search);
        urlSearchParams.set("app_runs", newValue); // Convert to actual app runs (k to actual number)
        const newUrl = `${window.location.pathname}?${urlSearchParams.toString()}`;
        window.history.replaceState({}, "", newUrl);
    };

    // Handle billing cycle change
    const handleBillingCycleChange = (event, newValue) => {
        if (newValue !== null) {
            setBillingCycle(newValue);

      if(isCloud){
        ReactGA.event({
          category: 'Billingpage',
          action: 'Billing Cycle Changed',
          label: `${billingCycle} -> ${newValue}`,
        });
      }

      // Add billing cycle to URL query params
      const urlSearchParams = new URLSearchParams(window.location.search);
      urlSearchParams.set("billing_cycle", newValue);
      const newUrl = `${
        window.location.pathname
      }?${urlSearchParams.toString()}`;
      window.history.replaceState({}, "", newUrl);
        }
    };

    const payasyougo = "Pay as you go"
   
    const paperStyle = {
        padding: 20,
        paddingBottom: 30,
        borderRadius: theme.palette?.borderRadius,
        height: "100%"
    }

    const userInScalePlan = userdata?.app_execution_limit > 10000
    const appRuns = userInScalePlan ? (userdata?.app_execution_limit / 1000) + "K App Runs" : userdata?.app_execution_limit === 10000 ? "10,000 App Runs" : "2,000 App Runs"

    // Add this function to format the limit value
    const formatLimit = (limit) => {
        if (limit === null || limit === undefined || limit === 0) return "Unlimited";
        if (typeof limit === "string" && limit.toLowerCase() === "unlimited") return "Unlimited";
        if (typeof limit === "number") return limit.toLocaleString();
        return limit.toString();
    };

    // Add this function to format the feature text with proper unlimited handling
    const formatFeatureText = (feature, limit) => {
        if (!feature) return "";

        // Dynamic features that use limits
        const featureMapping = {
            app_executions: (limit) => {
                const formattedLimit = formatLimit(limit);
                return `Includes ${formattedLimit} App Executions per month`;
            },
            multi_env: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Environments"
                    : `${formattedLimit} Environment${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            multi_tenant: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Tenants"
                    : `${formattedLimit} Tenant${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            multi_region: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Regions"
                    : `${formattedLimit} Region${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            webhook: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Webhooks"
                    : `${formattedLimit} Webhook${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            schedules: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Schedules"
                    : `${formattedLimit} Schedule${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            user_input: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited User Inputs"
                    : `${formattedLimit} User Input${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            send_mail: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Emails per month"
                    : `${formattedLimit} Email${parseInt(formattedLimit) > 1 ? 's' : ''} per month`;
            },
            send_sms: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited SMS per month"
                    : `${formattedLimit} SMS${parseInt(formattedLimit) > 1 ? 's' : ''} per month`;
            },
            email_trigger: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Email Triggers"
                    : `${formattedLimit} Email Trigger${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            notifications: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Notifications"
                    : `${formattedLimit} Notification${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            workflows: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Workflows"
                    : `${formattedLimit} Workflow${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            autocomplete: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Autocomplete"
                    : `${formattedLimit} Autocomplete${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            workflow_executions: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Workflow Executions"
                    : `${formattedLimit} Workflow Execution${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            authentication: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Authentication"
                    : `${formattedLimit} Authentication${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
            shuffle_gpt: (limit) => {
                const formattedLimit = formatLimit(limit);
                return formattedLimit === "Unlimited" 
                    ? "Unlimited Shuffle GPT"
                    : `${formattedLimit} Shuffle GPT${parseInt(formattedLimit) > 1 ? 's' : ''}`;
            },
        };

        try {
            // Check if we have a mapping for this feature
            const formatter = featureMapping[feature];
            if (formatter) {
                return formatter(limit);
            }
            
            // Default format for unknown features
            const formattedLimit = formatLimit(limit);
            return `${feature}: ${formattedLimit}`;
        } catch (error) {
            console.warn(`Error formatting feature ${feature}:`, error);
            return `${feature}: ${formatLimit(limit)}`;
        }
    };

    console.log("selectedOrganization: ", selectedOrganization)
    // Update the subscription features section
    billingInfo.subscription = {
        "active": true,
        "name": appRuns,
        "price": userInScalePlan ? "" : "Free",
        "currency": userInScalePlan ? "" : "Free",
        "currency_text": "",
        "interval": "",
        "description": "",
        "features": userInScalePlan ?  [
            // Add static features first
            ...(userInScalePlan ? ["Standard Email Support"] : []),
            
            // Then add dynamic features from the database
            ...Object.entries(features || {})
                .filter(([_, featureData]) => {
                    return featureData && 
                           typeof featureData === 'object' && 
                           featureData.active === true;
                })
                .map(([featureName, featureData]) => {
                    try {
                        return formatFeatureText(featureName, featureData?.limit);
                    } catch (error) {
                        console.warn(`Error processing feature ${featureName}:`, error);
                        return "";
                    }
                })
                .filter(feature => 
                    feature.length > 0 && 
                    !feature.toLowerCase().includes('unlimited') // Add this filter to remove "unlimited" features
                )
        ] : [
            userInScalePlan ? "Standard Email Support" : "Community Support",
            userInScalePlan ? `Includes ${appRuns}. ` : `Includes ${appRuns} for free. `,
            userInScalePlan ? "Multi-Tenant & Multi-Region" : "Get all 2500+ Apps and 10 Workflows",
            userInScalePlan ? "All features included in the Scale plan" : "Invite up to 5 users"
        ],
        "limit": userInScalePlan ? userdata?.app_execution_limit : 10000,
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

    // Create a function to remove duplicates and merge features
    const mergeUniqueFeatures = (existingFeatures, newFeatures) => {
        // Convert arrays to Sets to remove duplicates
        const uniqueFeatures = new Set([
            ...(existingFeatures || []),
            ...(newFeatures || [])
        ]);
        return Array.from(uniqueFeatures);
    };

    const SubscriptionObject = (props) => {
        const { globalUrl, index, userdata, serverside, billingInfo, stripeKey, selectedOrganization, handleGetOrg, subscription, highlight, } = props;

        const [signatureOpen, setSignatureOpen] = React.useState(false);
        const [tosChecked, setTosChecked] = React.useState(subscription.eula_signed)
        const [hovered, setHovered] = React.useState(false)
        const [newBillingEmail, setNewBillingEmail] = useState('');
        var top_text = userInScalePlan ? "Scale Plan" : "Starter Plan"
        // if (subscription.limit === undefined && subscription.level === undefined || subscription.level === null || subscription.level === 0) {
        //     subscription.name = "Enterprise"
        //     subscription.currency_text = "$"
        //     subscription.price = subscription.level * 180
        //     subscription.limit = subscription.level * 100000
        //     subscription.interval = subscription.recurrence
        //     subscription.features = [
        //         "Includes " + subscription.limit + " app runs/month. ",
        //         "Multi-Tenancy and Region-Selection",
        //         "And all other features from /pricing",
        //     ]
        // }

        // if (userdata?.app_execution_limit >= 300000) {
        //     subscription.name = "Enterprise"
        //     subscription.currency_text = "$"
        //     subscription.price = typecost_single
        //     subscription.limit = userdata?.app_execution_limit
        //     subscription.interval = "app run / month"
        //     subscription.features = [
        //         "Includes " + (userdata?.app_execution_limit/1000) + "K app runs/month. ",
        //         "Multi-Tenancy and Region-Selection",
        //         "And all other features from /pricing",
        //     ]
        // }


        var newPaperstyle = JSON.parse(JSON.stringify(paperStyle))
        if (subscription.name === "Enterprise" && subscription.active === true) {
            top_text = "Enterprise Plan"

            // newPaperstyle.border = "1px solid #f85a3e"
        }

        var showSupport = false
        if (subscription.name.includes("default")) {
            top_text = "Custom Contract"
            // newPaperstyle.border = "1px solid #f85a3e"
            showSupport = true
        }

        if (subscription.name.includes("App Run Units")) {
            top_text = "Scale Plan"
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

        console.log("OrgSyncFeatures: ", selectedOrganization?.sync_features)

        const extraFeatures = Object.entries(features || {})
            .filter(([_, featureData]) => {
                return featureData && 
                typeof featureData === 'object' && 
                featureData.active === true;
            })
            .map(([featureName, featureData]) => {
                return formatFeatureText(featureName, featureData?.limit);
            })
            .filter(feature => 
                feature.length > 0 && 
                !feature.toLowerCase().includes('unlimited') // Add this filter to remove "unlimited" features
            )

        subscription.features = mergeUniqueFeatures(subscription.features, extraFeatures);

        return (
            <Tooltip
                style={{ borderRadius: theme.palette?.borderRadius, }}
                placement="bottom"
            >
                <div style={{ backgroundColor: "#1e1e1e", border: "1.2px solid #ff8544", borderRadius: theme.palette?.borderRadius}}>
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
                        {subscription.active === true && !isScale &&  <Button style={{ backgroundColor: '#2f2f2f', color: "#ffffff", textTransform: "capitalize", borderRadius: 200, boxShadow: 'none', fontSize: 13 }}
                            variant="contained"
                            color="primary">
                            Current Plan
                        </Button>}
                        <div style={{ display: "flex" }}>
                            {top_text === "Base Cloud Access" && userdata.has_card_available === true && !isScale ?
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
                            <Typography variant="h6" style={{ marginTop: 25, marginBottom: 10, flex: 5, whiteSpace: 'nowrap' }}>
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
                            {isCloud && highlight === true && top_text !== "Starter Plan" ?
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
                                        {subscription.interval.length > 0 ? `/ ${subscription.interval}` : ""}
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
							{
									isCloud ?
                                        userdata?.app_execution_limit && userdata?.app_execution_limit !== 10000 ?
                                            "You have already subscribed to the Scale plan, which includes " + (userdata?.app_execution_limit/1000) + "K app runs/month. You can increase the limit by upgrading current plan. Contact support@shuffler.io for more information." :
                                            `You are using free Starter plan with max ${userdata?.app_execution_limit === 10000 ? "10,000" : "2,000"} runs per month. Upgrade to increase this limit.`

										:
										`You are not subscribed to any plan and are using the free, open source plan. This plan has no enforced limits, but scale issues may occur due to CPU congestion.`
							}
						</Typography>
							{/* {isCloud && (userdata.has_card_available === true || selectedOrganization?.Billing?.Email?.length > 0 )? 
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
							: null} */}
                        </div>
                        {isCloud ? (
                            <Button
							fullWidth
							color="primary"
							style={{
								marginTop: !userdata.has_card_available ? 25 : 10,
								borderRadius: 4,
								height: 40,
								fontSize: 16,
								color: "#1a1a1a",
								backgroundColor: "#ff8544",
								// backgroundImage: userdata.has_card_available ? null : "linear-gradient(to right, #f86a3e, #f34079)",
								textTransform: "none",

							}}
							onClick={() => {
                                console.log("Subscription: ", subscription.name)
                                if(!subscription.name.includes("App Run Units") && !userInScalePlan) {
                                    window.open("https://discord.gg/B2CBzUm", "_blank")
                                } else {
                                    window.open("mailto:support@shuffler.io", "_blank")
                                }
							}}
						>
							Get Support
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
                            title="Get more app runs"
                            onClick={() => {
                                if (isCloud) {
                                ReactGA.event({
                                    category: "header",
                                    action: "bookcall_upgread_popup",
                                    label: "",
                                })};
                                navigate("/contact?category=contact")
                                // if (isLoggedIn) {
                                // isLoggedInHandler()
                                // } else {
                                // navigate(`/register?view=pricing&message=You need to create a user to continue`)
                                // }
                            }}
                        >
							<span>
                            	Get more app runs
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

    // useEffect(() => {
	// 	console.log("New variant: ", shuffleVariant)

	// 	if (shuffleVariant === 1) {
	// 		setCalculatedCost("$960")
	// 		setSelectedValue(8)
	// 	} else {
    //         if (userdata && userdata?.app_execution_limit) {
    //             if (userdata.app_execution_limit >= 30000 && userdata.app_execution_limit < 40000) {
    //                 setSelectedValue(400)
    //                 setCalculatedCost("$1280")
    //             }else if (userdata?.app_execution_limit >= 40000 && userdata?.app_execution_limit < 50000) {
    //                 setSelectedValue(500)
    //                 setCalculatedCost("$1600")
    //             } else if (userdata?.app_execution_limit >= 500000 && userdata?.app_execution_limit < 600000) {
    //                 setSelectedValue(600)
    //                 setCalculatedCost("$1920")
    //             } else if (userdata?.app_execution_limit >= 60000 && userdata?.app_execution_limit < 70000) {
    //                 setSelectedValue(700)
    //                 setCalculatedCost("$2240")
    //             } else if (userdata?.app_execution_limit >= 70000 && userdata?.app_execution_limit < 80000) {
    //                 setSelectedValue(800)
    //                 setCalculatedCost("$2560")
    //             } else if (userdata?.app_execution_limit >= 80000 && userdata?.app_execution_limit < 90000) {
    //                 setSelectedValue(900)
    //                 setCalculatedCost("$2880")
    //             }else {
    //                 setCalculatedCost("$960")
    //                 setSelectedValue(300)
    //             }
    //         }else {
    //             setCalculatedCost("$960")
    //             setSelectedValue(300)
    //         }
	// 	}
	// }, [userdata])

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
    // const isLoggedInHandler = () => {
    //     if (calculatedCost === payasyougo) {
    //         handlePayasyougo(props.userdata)
    //         return
    //     }

    //     const priceItem =
	// 		window.location.origin === "https://shuffler.io/" || "https://sandbox.shuffler.io/"
	// 			? shuffleVariant === 0
	// 				? "price_1PWI3uDzMUgUjxHSffUBwWCy"
	// 				: "price_1PWI8EDzMUgUjxHSfEhUB7oL"

	// 			: shuffleVariant === 0
	// 				? "price_1PZPSSEJjT17t98NLJoTMYja"
	// 				: "price_1PZPQuEJjT17t98N3yORUtd9";

    //     const successUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=success`
    //     const failUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=failure`
	// 	const quantity = shuffleVariant === 0 ? selectedValue / 100 : selectedValue

    //     console.log("Priceitem: ", priceItem, quantity, shuffleVariant)
    //     var checkoutObject = {
    //         lineItems: [
    //             {
    //                 price: priceItem,
    //                 quantity: quantity,
    //             },
    //         ],
    //         mode: "subscription",
    //         billingAddressCollection: "auto",
    //         successUrl: successUrl,
    //         cancelUrl: failUrl,
    //         clientReferenceId: props.userdata.active_org.id,
    //     }

	// 	if (stripe === undefined || stripe === null || stripe.redirectToCheckout === undefined) {
	// 		window.open("https://shuffler.io/admin?admin_tab=billingstats&payment=stripe_error", "_self")
	// 	}

    //     stripe.redirectToCheckout(checkoutObject)
    //         .then(function (result) {
    //             console.log("SUCCESS STRIPE?: ", result)

    //             ReactGA.event({
    //                 category: "pricing",
    //                 action: "add_card_success",
    //                 label: "",
    //             })
    //         })
    //         .catch(function (error) {
    //             console.error("STRIPE ERROR: ", error)

    //             ReactGA.event({
    //                 category: "pricing",
    //                 action: "add_card_error",
    //                 label: "",
    //             })
    //         })
    // }

    const isLoggedInHandler = () => {
        var priceItem;
        if (window.location.origin === "https://shuffler.io" || window.location.origin === "https://sandbox.shuffler.io") {
          priceItem = billingCycle === "monthly" ? "price_1R66rbEJjT17t98NHIQ78nrz" : "price_1R671UEJjT17t98NzfqWvSG7"
        } else if (window.location.origin === "http://localhost:3002") {
          priceItem = billingCycle === "monthly" ? "price_1R678hEJjT17t98Nai5J50gs" : "price_1R6c84EJjT17t98NR68gUfT7"
      }
    
        const successUrl = `${window.location.origin}/admin?admin_tab=billingstats&payment=success`;
        const failUrl = `${window.location.origin}/pricing?admin_tab=billingstats&payment=failure`;
    
        let quantity;
    
        if (billingCycle === "monthly") {
          quantity = scaleValue / 10
        } else {
          quantity = (scaleValue / 10) * 12
        }
    
        redirectToCheckout(priceItem, quantity, successUrl, failUrl);
      };
    
      const redirectToCheckout = (priceItem, quantity, successUrl, failUrl) => {
        const checkoutObject = {
          lineItems: [
            {
              price: priceItem,
              quantity: quantity,
            },
          ],
          mode: "subscription",
          billingAddressCollection: "auto",
          successUrl: successUrl,
          cancelUrl: failUrl,
          clientReferenceId: userdata.active_org.id,
        };
    
        console.log("OBJECT: ", priceItem, checkoutObject);
    
        stripe
          .redirectToCheckout(checkoutObject)
          .then(function (result) {
            console.log("SUCCESS STRIPE?: ", result);
          })
          .catch(function (error) {
            console.error("STRIPE ERROR: ", error);
          });
      };

      console.log("Selected Organization: ", selectedOrganization.subscriptions)
    return (
        <div>
            <Grid container spacing={2} style={{ flexDirection: "row", flexWrap: "nowrap", borderRadius: '16px', display: "flex"}}>
                <Grid item maxWidth={licensePopup ? 400 : 450}>
                    {selectedOrganization.subscriptions === undefined || selectedOrganization.subscriptions === null || selectedOrganization.subscriptions.length === 0 ?
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
                        : 
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
                        {!isCloud ?
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

                    {/* {isCloud &&
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
                        : null} */}
                </Grid>
                {
                licensePopup &&
                (<Grid  item maxWidth={450}>
                    <Grid style={{}}>
                        {errorMessage.length > 0 ? <Typography variant="h4">Error: {errorMessage}</Typography> : null}
                        <Card style={{
                            padding: 20,
                             background:
                            "linear-gradient(to right, #212121, #212121) padding-box, linear-gradient(90deg, #F86744 0%, #F34475 100%) border-box",
                            borderWidth: "2px",
                            borderStyle: "solid",
                            borderColor: "transparent",
                        }}>
                            <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 25,
                                marginLeft: -2,
                            }}
                            >
                               <Button style={{ backgroundColor: 'rgba(255, 132, 68, 0.2)', color: "#FF8444", textTransform: "capitalize", borderRadius: 200, boxShadow: 'none', fontSize: 13 }}
                                    variant="contained"
                                    color="primary">Recommended 
                                </Button>
                                {
                                    billingCycle === "annual" && 
                                    (
                                        <Box
                                sx={{
                                    background: "rgba(248, 103, 68, 0.1)",
                                    py: 0.5,
                                    px: 1.5,
                                    borderRadius: "8px",
                                }}
                                >
                                        <Typography
                                            sx={{
                                            fontWeight: "bold",
                                            background:
                                                "linear-gradient(90deg, #FF8544 0%, #FB47A0 100%)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                                backgroundClip: "text",
                                                fontSize: {
                                                    xs: "12px",
                                                    md: "14px",
                                                },
                                        }}
                                        >
                                            10% OFF
                                        </Typography>
                                        </Box>
                                    )
                                }
                            </div>
                            <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 10,
                                marginTop: 10,
                            }}
                            >
                            <Typography variant="h6" style={{ }}>
                               {scaleValue > 300 ? "Enterprise Plan" : "Scale Plan"}
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <ToggleButtonGroup
                                    value={billingCycle}
                                    exclusive
                                    onChange={handleBillingCycleChange}
                                    aria-label="billing cycle"
                                    sx={{
                                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                                        fontFamily: theme.typography.fontFamily,
                                        borderRadius: "30px",
                                        marginTop: -1,
                                        padding: "3px",
                                        "& .MuiToggleButton-root": {
                                            border: "none",
                                            borderRadius: "30px",
                                            color: "#fff",
                                            padding: "6px 22px",
                                            textTransform: "none",
                                            fontSize: {
                                                xs: "12px",
                                            },
                                            "&.Mui-selected": {
                                                backgroundColor: "#fff",
                                                fontFamily: theme.typography.fontFamily,
                                                color: "#1A1A1A",
                                                fontWeight: "bold",
                                                "&:hover": {
                                                    backgroundColor: "#fff",
                                                },
                                            },
                                            "&:hover": {
                                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                            },
                                        },
                                    }}
                                >
                                <ToggleButton value="monthly" aria-label="monthly">
                                    Monthly
                                </ToggleButton>
                                <ToggleButton value="annual" aria-label="annual">
                                    Annual
                                </ToggleButton>
                            </ToggleButtonGroup>
                            </Box>
                            </div>
                            <Divider />
                            <Typography variant="body1" color="textSecondary" style={{ marginTop: 20 }}>
                               App Runs Units
                            </Typography>

                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 , marginTop: 10 }}>
                                <Typography style={{ 
                                    fontSize: 24,
                                    marginTop: 7,
                                    marginBottom: 10,
                                    fontWeight: "500",
                                }} 
                                >
                                    {scaleValue > 300 ? "Let's Talk" : `$${getPrice(32) * (scaleValue / 10)}`}
                                </Typography>
                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        fontSize: "14px",
                                        marginBottom: "-2px",
                                        marginLeft: scaleValue > 300 ? 1 : 0,
                                    }}
                                >
                                    {scaleValue > 300 ? `for ${scaleValue > 500 ? "500k+" : `${scaleValue}k`} App Runs` : `/month for ${scaleValue}k App Runs`}
                                </Typography>
                            </div>
                            <Box sx={{ px: 1 }}>
                                <Slider
                                  value={scaleValue}
                                  onChange={handleScaleChange}
                                  aria-labelledby="scale-slider"
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={(value) => {
                                    if(value === 510){
                                      return "500k+"
                                    }
                                    return `${value}k`
                                  }}
                                  step={10}
                                  min={10}
                                  max={510}
                                  marks
                                 sx={{
                                    color: "#ff8544",
                                    "& .MuiSlider-thumb": {
                                    width: 15,
                                    height: 15,
                                    },
                                    "& .MuiSlider-valueLabel": {
                                    backgroundColor: "rgba(33, 33, 33, 1)",
                                    color: "rgba(241, 241, 241, 1)",
                                    fontSize: 14,
                                    borderRadius: "4px",
                                    border: "1px solid rgba(73, 73, 73, 1)",
                                    fontFamily: theme?.typography?.fontFamily,
                                    },
                                }}
                                />
                            </Box>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span>{defaultTaskIcon}</span>
                                    <Typography style={{ fontSize: 14, marginLeft: 8 }}>Standard Email Support</Typography>
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
                                    <Typography style={{ fontSize: 14, marginLeft: 8 }}>30 Days workflow run history</Typography>
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
							window.open("https://shuffler.io/pricing?tab=Self-Hosted", "_blank")
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
                            if(scaleValue > 300){
                                navigate("/contact?category=cloud_enterprise_plan")
                                return;
                            }
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
                    {scaleValue > 300 ? "Let's Talk" : "Upgrade"}
                </Button>
                </div>
            </DialogActions>
                        </Card>
                    </Grid>
                </Grid>)
                }
            </Grid> 
        </div>
    )
}

export default LicencePopup;
