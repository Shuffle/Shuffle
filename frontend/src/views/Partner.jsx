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

const useStyles = makeStyles({
    table: {
        minWidth: 550,
    }
});

function createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
}

const rows = [
    createData("Community support", <DoneIcon />, <DoneIcon />, <DoneIcon />),
    createData("Priority support", <CloseIcon />, <CloseIcon />, <DoneIcon />),
    createData("Personal onboarding", <CloseIcon />, "60 minutes", <DoneIcon />),
    createData("Users", "No limit", "No limit", "No limit"),
    createData("Apps", "No limit", "No limit", "No limit"),
];

const title = {
    //margin : "30px",
    border: "3px ridge #de5f1f",
}

const Partnerpage = (props) => {
    const classes = useStyles();
    return (
        <Container maxWidth="xl">
            <center>
                <h1>Partner with Shuffle</h1>
            </center>
            <center><p>Wazuh offers our partners an affordable and best-in-class solution for threat prevention, detection, and response. They can use it to protect their customers, focusing on delivering the best possible security services.</p>
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
                            <TableCell align="right">Free</TableCell>
                            <TableCell align="right">Hybrid</TableCell>
                            <TableCell align="right">Enterprise / MSSP</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.name}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell align="right">{row.calories}</TableCell>
                                <TableCell align="right">{row.fat}</TableCell>
                                <TableCell align="right">{row.carbs}</TableCell>
                                <TableCell align="right">{row.protein}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container >
    );
};

export default Partnerpage;