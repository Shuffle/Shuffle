import React, {useState} from 'react';
import {isMobile} from "react-device-detect";
import {Link} from 'react-router-dom';

import {Divider, List, ListItem, ListItemText, Card, CardContent, Grid, Typography, Button, ButtonGroup, FormControl, Dialog, DialogTitle, DialogActions, DialogContent, Tooltip}  from '@mui/material';
import {ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon} from '@mui/icons-material';

const hrefStyle = {
	textDecoration: "none",
	color: "#f85a3e"
}


/* 
 * More questions:
 * What happens with IPv6 vs IPv6?
 * How long can contracts be?
 * Any discount? 20% with 1 year+
 * How can we pay? Manual or not
 * How is support handled?
 * How big is the team EXACTLY?
 * What are requirements for everything?
 * What level of support does Fredrik/Shuffle provide to paying customers with enterprise license agreements?
 * What’s their guaranteed response time? 2 hours, 4 hours, next business day? Support 365/24/7, or just weekdays?
 * How can customers submit support requests? Email, phone, and/or web?
 * Is there a support team, or is Fredrik the only support person right now?
 * What’s the annual Shuffle release schedule / frequency? One major release once a year with minor releases quarterly?
 * The ability to run our own, private instance of Shuffle in a public or private cloud, as well as on virtualized or bare metal, standalone/isolated servers is very important.
 * We were wondering how the shuffle environment handles a playbook in production(workflow editing and testing phase) vs. in operations (playbook/workflow is operational in a SOC).
 * Is Shuffle capable of pushing notifications/messages to REDPro if a playbook is Active, Inactive or in Error so it’s general status can be understood via the Playbook Library.
 * Will cloud webhooks behave any differently from on premise webhooks if we are hosting our own cloud.
 * If we are hosting on our own cloud and the cloud is not connected to the open internet, will there a be a work around for delivering app updates.
 * What other maintenance and troubleshooting considerations should we be aware of in an isolated cloud environment
 * Do you have any documentation for putting workflows into a github.
 */


export const pricingFaq = [
	{
		"question": "What currency are your prices in?",
		"answers": [
			"They are in US Dollars.",
		],
	},
	{
		"question": "Do you offer discounts or free trials?",
		"answers": [
			"We offer free trials, and may offer discounts and features for testing in certain scenarios.",
		],
	},
	{
		"question": "What payment methods do you offer?",
		"answers": [
			"We accept credit cards, Apple Pay, Google Pay and any other payment Stripe supports.",
		],
	},
	{
		"question": "How can I switch to annual billing?",
		"answers": [
			"Contact us at <a href='/contact' style={hrefStyle}>Contact</a> page!",
		],
	},
	{
		"question": "When does my membership get activated?",
		"answers": [
			"As soon as the payment is finished, you should see more features available in the Admin view.",
		],
	},
	{
		"question": "How can I switch my plan?",
		"answers": [
			"Contact us at <a href='/contact' style={hrefStyle}>Contact</a> page!",
		],
	},
	{
		"question": "What happens after payment is finished?",
		"answers": [
			"We will automatically and immediately apply all the featuers to your organization.",
		],
	},
	{
		"question": "How can I cancel my plan?",
		"answers": [
			"As an Admin of your organization, you can manage it from the Admin page.",
		],
	},
	{
		"question": "What is your refund policy?",
		"answers": [
			"For monthly and yearly subscriptions, you have 48 hours after the transaction to request a refund. Note that we reserve the right to decline requests if we detect high activity on your account within this time." ,
		],
	},
	{
		"question": "Do you offer support?",
		"answers": [
			"Yes! We offer priority support with an SLA to our enterprise customers, and will answer any questions directed our way on the Contact page otherwise." ,
		],
	},
	{
		"question": "Can you help me automate my operations?",
		"answers": [
			"Yes! We offer support with setup, configuration, automation and app creation. This can be bought as an addition withour needing a subscription.",
		],
	}
]


export const faqData = [
		{
			"question": "What is Niceable? What’s your mission?",
			"answers": [
				"Check out our cool <a href='/about' style={hrefStyle}>About</a> page!",
			],
		},
		{
			"question": "How does it work?",
			"answers": [ 
				"<a href='/' style={hrefStyle}>We've got you covered!</a>",
			],
		},
		{
			"question": "When will winners be announced?",
			"answers": [
				"When the prizedraw's 'ticket threshold' is reached, all contributors will receive an email notification about when the live announcement of the winners—the prize winner and the winning charity—will take place. In general, the live announcement happens within 48 hours of the email notification being sent."
			],
		},
		{
			"question": "How much goes to charity?",
			"answers": [
				"All prizedraws are guaranteed to give the majority of user contributions—more than 50%—to the winning charity. Individual prizedraw hosts (ie, prize vendors) may choose to take a smaller amount for themselves and give a larger percentage to the winning charity. In any case, we are the only prizedraw hosting platform that guarantees that the majority goes to charity. It’s the right thing to do."
			],
		},
		{
			"question": "How are winning charities selected?",
			"answers": [
				"Charities are selected through a voting process that happens separately for each prizedraw. The community of contributors for a given prizedraw use our voting system to determine the best destination for their crowdsourced contribution. The current vote distribution can be seen on each prizedraw page’s charity leaderboard.",
			],
		},
		{
			"question": "How are the charitable options chosen?",
			"answers": [
				"All of the charities that users can vote for have been selected based on them receiving top ratings from the most respected “charity evaluator” organizations. These assessments focus on transparency and financial optimization as well as the nature of their mission and demonstrated impact of their activities. Ultimately, however, YOUR assessment matters most. So, discuss with our community and then decide for yourself!",
				"If you’d like to recommend a charity or you are part of a charity that’s interested in being featured on our site, please let us know <a href='mailto:adam@niceable.co' style={hrefStyle}>here (adam@niceable.co).</a>",
				"In the future, additional charities will be added as options with the least voted for charities being replaced. That way, all of our charitable options will be ones that have been top rated by charity evaluator organizations and top vote getters from our wise and beloved Niceable users.",
				"We are also working on adding lots of information and statistics about each charity to our site, something that our charitable partners are helping us with.",
			],
		},
		{
			"question": "Can I “write-off” my contribution on my taxes?",
			"answers": [
				"That depends on where you live. We do not claim to be tax experts and do not offer any advice on such matters. Basically, in some places, you can. In others, you can't. Check with a licensed tax expert in your area.",
			],
		},
		{
			"question": "Can I buy prizedraw prizes directly?",
			"answers": [
				"We encourage users to check out prizedraw hosts, many of whom promote our prizedraws and charitable partnerships through social media. They offer prizes because they want to support great charities and offer products and experiences to people who may not always have the money to buy their products directly. Making super nice(able) things accessible to you and everyone else is a major part of our mission and they help us do that.",
				"The current constraints of capitalism are BS and we're out to change that. Thanks for being a hero! Our prizedraw hosts are reaching out to you and--unlike almost all other organizations--trust YOU to choose the most-worthy charity to support. So, we certainly encourage you to check out their other offerings. They are helping all of you make the impact that YOU want to make and may offer something super nice(able) that's also a perfect fit for you.",
			],
		},
		{
			"question": "How do I enter a promocode?",
			"answers": [
				"If its your first time visiting us, you can do it in a Raffle on the right hand side. If you are already logged in, click the 'My account' button in the upper right corner of the screen. Then click the 'enter a promotional code, before submitting the code you have.",
				"You should now have received more entries!",
			],
		},
		{
			"question": "How do you select your vendors?",
			"answers": [
				"Currently, our #1 priority is learning more about YOU. What do our users want? What prizes, charities, site features and technology, support, etc.? Therefore, we are currently trying to maximize the diversity of our prizes to see what YOU value most. It’s about you, not us or our vendors.", 
				"Do you most value products and experiences that are ethically-produced? Crazy expensive? Mid-priced? Rare or one-of-a-kind? Created by independent vendors like artists and craftspeople? By everyday people offering services customized for you and you alone? Luxury brands? Houses? Vacations? Cutting-edge technology? Whatever you want, we’ll work hard to offer it. We believe that EVERYONE should be able to have super nice(able) things!",
				"We are, however, limiting the number of active prizedraws that we have to ensure that these prizedraws fill up quickly, allowing prize winners and winning charities to enjoy their winnings sooner. In the future, we plan to offer many more prizedraws at one time.",
			],
		},
		{
			"question": "Can I host a prizedraw so that I can make some money, support great charities, and reach new audiences?",
			"answers": [
				"<a href='mailto:adam@niceable.co' style={hrefStyle}>Contact us here</Link> (adam@niceable.co)",
			],
		},
		{
			"question": "Can I host a prizedraw and donate the prize (because I’m a super nice person)?",
			"answers": [
				"<a href='mailto:adam@niceable.co' style={hrefStyle}>Contact us here</Link> (adam@niceable.co)",
			],
		}
	]

const Faq = (props) => {
  const { theme } = props;

	// Hahah, this is a hack fml
	const HandleAnswer = (props) => {
		const [answers, setAnswers] = useState("");
		const current = props.current

		const loadAnswers = () => {
			if (answers === "") {
				const data = current.answers.map(answer => {
					return answer
				})

				setAnswers(data.join("<div/>"))
			} else {
				setAnswers("")
			}
		}

		const icon = answers === "" ? <ExpandMoreIcon /> : <ExpandLessIcon />


		return (
			<ListItem button onClick={() => loadAnswers()} style={{textAlign: "center"}}>	
				<div style={{marginRight: 5, }}>{icon}</div>
				<ListItemText primary=<Typography variant="body1">{current.question}</Typography> secondary=<td style={{color: "rgba(255,255,255,0.8)"}} dangerouslySetInnerHTML={{__html: answers}} />/>
			</ListItem>	
		)

	}

	const width = isMobile ? "100%" : 1000
	const FAQ = 
		<div elevation={1} style={{padding: isMobile ? "20px 0px 10px 0px" : 100, textAlign: "center", color: "rgba(255,255,255,0.9)", minWidth: width, maxWidth: width, margin: "auto"}}>
			<Typography variant="h4" style={{textAlign: "center", marginBottom: 50, }}>
				Frequently asked questions
			</Typography>
			<Grid container spacing={4} style={{textAlign: "center", width: isMobile?"100%":"100%"}}>
				{pricingFaq.map((current) => {
					return (
						<Grid item xs={isMobile ? 12 : 6} key={current.question} style={{margin: "auto"}}>
							<HandleAnswer current={current} />
							<Divider style={{backgroundColor: "rgba(255,255,255,0.2)"}}/>
						</Grid>
					)
				})}
			</Grid>
			{/*
			<Divider />
			<Typography variant="body1" color="textPrimary" style={{textAlign: "left", marginTop: 15, marginBottom: 5}}>
				Thanks for reading! Have a super nice(able) time entering prizedraws for amazing prizes, enjoying our awesome community, and making the impact that YOU want to make in the world!
			</Typography>
			*/}
		</div>

	const landingpageData = 
		<div style={{margin: "auto", maxWidth: isMobile ? "100%" : 2560, backgroundColor: theme.palette.inputColor}}>
			{FAQ}
		</div>

	return ( 
		<div>
			{landingpageData}	
		</div>
	)
}

export default Faq;
