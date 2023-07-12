import React, {useState } from 'react';

import { useNavigate, Link, useParams } from "react-router-dom";
import {isMobile} from "react-device-detect";

import {Done as DoneIcon, Clear as ClearIcon} from '@mui/icons-material';
import {Paper, Divider, List, ListItem, ListItemText, Card, CardContent, Grid, Typography, Button, ButtonGroup, FormControl, Dialog, DialogTitle, DialogActions, DialogContent, Tooltip}  from '@mui/material';
import FAQ from "./Faq.jsx";
import Newsletter from "../components/Newsletter.jsx";

// 1. Create 2-3 payment tiers (slider?)
// 2. Create a way to show them anywhere
//
// Site references:
// https://logz.io/pricing/
// https://www.avanan.com/pricing
const PaymentField = (props) => {
	const { maxFields, theme, removeAdditions } = props

	const parsedFields = maxFields === undefined ? 300 : maxFields
	const [variant, setVariant] = useState(0)
	const [paymentType, setPaymentType] = useState(0)
	const [modalOpen, setModalOpen] = useState(false)
  const [showPricing, ] = useState(true)
	const [currentPrice, setCurrentPrice] = useState(129)
	const [isLoaded, setIsLoaded] = useState(false)
	const [errorMessage, setErrorMessage] = useState("")
	let navigate = useNavigate();

	if (typeof window === 'undefined' || window.location === undefined) {
		return null
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
	}

	const billingInfo = <Typography variant="body2" color="textSecondary" style={{marginTop: 30,}} >Billed anually or monthly at 1.2x the cost</Typography>
	const maxwidth = isMobile ? "91%" : 1024 
	const activeIcon = <DoneIcon style={{color: "green"}} />
	const inActiveIcon = <ClearIcon style={{color: "red"}} />  

	const cardStyle = {
		height: "100%", 
		width: "100%", 
		textAlign: "center", 
		backgroundColor: theme.palette.surfaceColor,
		color: "white",
	}

	const maxWidth = isMobile ? "100%" : 1000 
	const margin = isMobile ? 15 : 50
	const paperWidth = isMobile ? "100%" : maxWidth-margin*2
	const listItemStyle = isMobile ? {textAlign: "center"} : {}
	const topRet = 
		<div style={{maxWidth: maxWidth, minWidth: maxWidth, margin:  "auto", textAlign: isMobile ? "center" : "left",}}>
			<div style={{margin: isMobile ? 20 : "0px 0px 80px 0px",}}>
				<Typography variant="h4" style={{marginTop: 100, textAlign: "center",}}>
					Our team is here to help you
				</Typography>	
				<Typography variant="body1" style={{marginTop: 20, textAlign: "center",}}>
					We solve any problem that arises in a security operations center using YOUR tools. Here's how.
				</Typography>	
				<Paper style={{maxWidth: paperWidth, minWidth: paperWidth, marginBottom: margin/2, marginTop: margin, backgroundColor: theme.palette.surfaceColor, color: "white", padding: isMobile ? 0 : margin, display: "flex", flexDirection: isMobile ? "column": "row", }}>
					<div style={{flex: 3, borderRight: "1px solid rgba(255,255,255,0.2)"}}>
						<List style={{marginRight: isMobile ? 0 : 40,}}>
							<ListItem button onClick={() => {navigate("/usecases")}} style={listItemStyle}>	
								<ListItemText primary={"Free Usecases"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Hybrid integration"} />
							</ListItem> 
							<ListItem button onClick={() => {"https://discord.gg/B2CBzUm"}} style={listItemStyle}>	
								<ListItemText primary={"Open Source community"} />
							</ListItem> 
						</List>
					</div> 
					<div style={{flex: 6, marginLeft: isMobile ? margin : 40, marginRight: isMobile ? margin: 0, marginTop: isMobile ? 30 : 0}}>
						<Typography variant="h4" style={{}}>
							Accessibility first 
						</Typography>	
						<Typography variant="body1" style={{marginTop: 20,}}>
							Shuffle was built by and for security professionals. We aim to bring our unique toolbox to every operations center globally, enabling information sharing and collaboration at scale, whether in the cloud, or on-premises.  
						</Typography>	
					</div>
				</Paper>
				<Paper style={{maxWidth: paperWidth, minWidth: paperWidth, marginBottom: margin/2, marginTop: margin, backgroundColor: theme.palette.surfaceColor, color: "white", padding: isMobile ? 0 : margin, display: "flex", flexDirection: isMobile ? "column": "row",}}>
					<div style={{flex: 6, marginRight: 40, textAlign: "center",}}>
						<Typography variant="h4" style={{}}>
							Automation Services
						</Typography>	
						<Typography variant="body1" style={{marginTop: 20,}}>
							Our team of security and automation experts create workflows to automated your SOC end-to-end. In the case that apps are missing, we will create them for you and share with the community to everyones benefit.
						</Typography>	
					</div>
					<div style={{flex: 3, borderLeft: "1px solid rgba(255,255,255,0.2)"}}>
						<List style={{marginLeft: isMobile ? 0 : 40,}}>
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Workflow Creation"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"App Creation"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Custom Development"} />
							</ListItem> 
						</List>
					</div> 
				</Paper>
				<Paper style={{maxWidth: paperWidth, minWidth: paperWidth, marginBottom: margin/2, marginTop: margin, backgroundColor: theme.palette.surfaceColor, color: "white", padding: isMobile ? 0 : margin, display: "flex",flexDirection: isMobile ? "column": "row",}}>
					<div style={{flex: 3, borderRight: "1px solid rgba(255,255,255,0.2)"}}>
						<List style={{marginRight: 40,}}>
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Quick response times"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Upgrades & configurations"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Business hour support"} />
							</ListItem> 
						</List>
					</div> 
					<div style={{flex: 6, marginLeft: isMobile ? 0 :40,}}>
						<Typography variant="h4" style={{}}>
							Support and Maintenance	
						</Typography>	
						<Typography variant="body1" color="textSecondary" style={{marginTop: 20,}}>
							We recognize that support is a vital part of keeping operations stable and secure. That's why we're offering support of both the cloud platform and usage, as well as for the open source version of Shuffle.
						</Typography>	
					</div>
				</Paper>
				<Paper style={{maxWidth: paperWidth, minWidth: paperWidth, marginBottom: margin/2, marginTop: margin, backgroundColor: theme.palette.surfaceColor, color: "white", padding: isMobile ? 0 : margin, display: "flex",flexDirection: isMobile ? "column": "row",}}>
					<div style={{flex: 6, marginRight: 40,}}>
						<Typography variant="h4" style={{}}>
							Training 
						</Typography>	
						<Typography variant="body1" style={{marginTop: 20,}}>
							We teach you how to become a poweruser of Shuffle. It involves how to maintain, create, share and use it Shuffle, whether in a small operations center or as an MSSP. 
						</Typography>	
					</div>
					<div style={{flex: 3, borderLeft: "1px solid rgba(255,255,255,0.2)"}}>
						<List style={{marginLeft: isMobile ? 0 : 40,}}>
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Administration"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Configuration"} />
							</ListItem> 
							<ListItem button onClick={() => {}} style={listItemStyle}>	
								<ListItemText primary={"Platform Development"} />
							</ListItem> 
						</List>
					</div> 
				</Paper>
			</div>
		</div>


		return (
			<div style={{paddingBottom: removeAdditions ? 0 : 100}}>
				{topRet}
				{removeAdditions === true ? null :
					<span>
						<FAQ theme={theme} type={"pricing"}/>
						<div style={{marginTop: 100, marginBottom: 100,}}>
							<Typography variant="h4">
								Got other questions?
							</Typography>
							<Typography variant="body1" color="textSecondary" style={{marginBottom: 200}}>
								If you got more questions about our pricing and plans, please <Link to="/contact" style={{textDecoration: "none", color: theme.palette.primary.main}}>contact us</Link> so we can help	
							</Typography>
							<Newsletter />
						</div>
					</span>
				}
			</div>
		)
}

export default PaymentField;
