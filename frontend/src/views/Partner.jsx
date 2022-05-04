import { React, props } from "react";
import { Grid, Container } from '@mui/material'

const title = {
    //margin : "30px",
    border: "3px ridge #de5f1f",
}

const Partnerpage = (props) => {
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
        </Container>
    );
};

export default Partnerpage;