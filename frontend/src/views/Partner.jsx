import { React, props, Component } from "react";
import { Grid, Container } from '@mui/material'
import { makeStyles } from "@material-ui/core/styles";
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { Paper, Button } from '@mui/material';
import Contact from "./Contact.jsx";
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';

const useStyles = makeStyles({
    table: {
        minWidth: 550,
    }
});

const handleDragStart = (e) => e.preventDefault();

const items = [
    <img src="images/Partner-1.png" onDragStart={handleDragStart} role="presentation" />,
    <img src="images/partner3.png" onDragStart={handleDragStart} role="presentation" />,
    <img src="images/partner-4.png" onDragStart={handleDragStart} role="presentation" />,
];

const items1 = [
    <img src="images/shuffle-partner1.png" onDragStart={handleDragStart} role="presentation" />,
    <img src="images/partner3.png" onDragStart={handleDragStart} role="presentation" />,
    <img src="images/partner-4.png" onDragStart={handleDragStart} role="presentation" />,
];

function createData(type, Authorized, SilverPartner, GoldPartner) {
    return { type, Authorized, SilverPartner, GoldPartner };
}

const rows = [
    createData("Authorized to resell Shuffle services", <CloseIcon />, <CloseIcon />, <CloseIcon />),
    createData("Access to deal registration", <CloseIcon />, <CloseIcon />, <CloseIcon />),
    createData("List price for initial tiers", <CloseIcon />, <CloseIcon />, <CloseIcon />),
    createData("UseListed as Partner on our websiters", " ", <CloseIcon />, <CloseIcon />),
    createData("Access to renewals", " ", <CloseIcon />, <CloseIcon />),
    createData("Price protection policy", " ", <CloseIcon />, <CloseIcon />),
    createData("Pre-sales assistance", " ", <CloseIcon />, <CloseIcon />),
    createData("Support portal access", " ", <CloseIcon />, <CloseIcon />),
    createData("Access to a demo environment", " ", <CloseIcon />, <CloseIcon />),
    createData("Support portal access ", " ", <CloseIcon />, <CloseIcon />),
    createData("Centralized partner console", " ", <CloseIcon />, <CloseIcon />),
    createData("Console walkthrough", " ", <CloseIcon />, <CloseIcon />),
    createData("Can run demos", " ", <CloseIcon />, <CloseIcon />),
    createData("Press release to announce partnership", " ", <CloseIcon />, <CloseIcon />),
    createData("Co-Marketing campaigns", " ", <CloseIcon />, <CloseIcon />),
    createData("Discounts", "10%", "20%", "30%"),
];

const title = {
    //margin : "30px",
    border: "3px ridge #de5f1f",
}

const Partnerpage = (props) => {
    const classes = useStyles();
    const { globalUrl, surfaceColor, newColor, mini, textColor, inputColor } = props;
    return (
        <Container maxWidth="xl">
            <center>
                <h1>Partner with Shuffle</h1>
            </center>
            <center><p>Shuffle offers our partners an affordable and best-in-class solution for threat prevention, detection, and response. They can use it to protect their customers, focusing on delivering the best possible security services.</p>
            </center>
            <Grid container spacing={2} style={{ maxWidth: "1450px", margin: "auto auto 10px", color: "white", backgroundColor: "rgb(39, 41, 45)", padding: "5px" }}>
                <Grid item xs={12}  >
                </Grid>
                <Grid item md={7}  >
                    <center>
                        <img src="images/Partner-1.png" alt="Becoming a Shuffle partner will provide you the full support to grow your business." />
                    </center>
                </Grid>
                <Grid item md={5}  >
                    <h2>Full support to grow your business</h2>
                    <ul>
                        <li>Sales team support</li>
                        <li>Marketing material</li>
                        <li>Technical & Sales training</li>
                        <li>Access to a testing/demo cloud environment</li>
                    </ul>
                </Grid>
            </Grid>
            <Grid container spacing={2} style={{ maxWidth: "1450px", margin: "auto auto 10px", color: "white", backgroundColor: "rgb(39, 41, 45)", padding: "5px" }}>
                <Grid item xs={12}  >
                </Grid>
                <Grid item md={5}  >
                    <h2>Expand your business</h2>
                    <p>Our enterprise-ready security monitoring platform helps enhance your security services portfolio with our comprehensive, single-agent platform.</p>
                </Grid>
                <Grid item md={7}  >
                    <img src="images/shuffle-partner1.png" alt="Becoming a Shuffle partner will allow you to expand your business." />
                </Grid>
            </Grid>
            <Grid container spacing={2} style={{ maxWidth: "1450px", margin: "auto auto 10px", color: "white", backgroundColor: "rgb(39, 41, 45)", padding: "5px" }}>
                <Grid item xs={12}  >
                </Grid>
                <Grid item md={7}  >
                    <center>
                        <img src="images/partner3.png" alt="The partnership with Shuffle provides you with our modular and flexible platform." />
                    </center>
                </Grid>
                <Grid item md={5}  >
                    <h2>Flexible software</h2>
                    <p>The modularity and flexibility of our platform allows the user to leverage Shuffle as the central component or as a complement to your security offering.</p>
                </Grid>
            </Grid>
            <Grid container spacing={2} style={{ maxWidth: "1450px", margin: "auto auto 10px", color: "white", backgroundColor: "rgb(39, 41, 45)", padding: "5px" }}>
                <Grid item xs={12}  >
                </Grid>
                <Grid item md={5}  >
                    <h2>Special discounts</h2>
                    <p>Our partners benefit from special discounts on all our services. This includes our cloud subscriptions, training courses, professional support, and others.</p>
                </Grid>
                <Grid item md={7}  >
                    <img src="images/partner-4.png" alt="Becoming a Shuffle partner gives you unique discounts." />
                </Grid>
            </Grid>
            <Grid container spacing={2} style={{ maxWidth: "1450px", margin: "auto auto 10px", color: "white", backgroundColor: "rgb(39, 41, 45)", padding: "5px" }}>
                <Grid item xs={12}  >
                </Grid>
                <Grid item md={7}  >
                    <center>
                        <img src="images/partner-5.png" alt="Become a Shuffle partner and start to increase your profits." />
                    </center>
                </Grid>
                <Grid item md={5}  >
                    <h2>Increase margins and revenue</h2>
                    <p>Reduce overhead by using a comprehensive, single-agent platform for all customers. Affordable subscription-based pricing for our partners, so they can buy what they actually require and expand as needed.</p>
                </Grid>
            </Grid>
            <Grid><h2>Explore our partnership plans</h2></Grid>
            <TableContainer
                component={Paper}
                style={{
                    color: "white",
                    backgroundColor: "rgb(39, 41, 45) ",
                }}
            >
                <Table
                    className={classes.table}
                    size="small"
                    aria-label="a dense table"
                >
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell align="right">Authorized</TableCell>
                            <TableCell align="right">Silver Partner</TableCell>
                            <TableCell align="right">Gold Partner</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.type}>
                                <TableCell component="th" scope="row">
                                    {row.type}
                                </TableCell>
                                <TableCell align="right">{row.Authorized}</TableCell>
                                <TableCell align="right">{row.SilverPartner}</TableCell>
                                <TableCell align="right">{row.GoldPartner}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Grid><h2>What our customers say about us</h2></Grid>
            <Grid><AliceCarousel disableButtonsControls={true} mouseTracking items={items} /></Grid>
            <Grid><h1>Find a Partner</h1>
                <p>Looking for a unique solution or service from a trusted and capable Shuffle partner? We have a global partner ecosystem ready to adapt to your business needs.</p>
            </Grid>
            <Grid><AliceCarousel disableButtonsControls={true} mouseTracking items={items1} /></Grid>
            <Grid>
                <Contact
                    globalUrl={globalUrl}
                    {...props}
                />
            </Grid>
        </Container >
    );
};

export default Partnerpage;