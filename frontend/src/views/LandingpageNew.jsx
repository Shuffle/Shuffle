import React, { useState } from "react";

import Paper from "@material-ui/core/Paper";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardMedia from "@material-ui/core/CardMedia";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import { BrowserView, MobileView } from "react-device-detect";

import ScheduleIcon from "@material-ui/icons/Schedule";
import Web from "@material-ui/icons/Web";
import AccountTree from "@material-ui/icons/AccountTree";
import InfoIcon from "@material-ui/icons/Info";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import CreateIcon from "@material-ui/icons/Create";

const bodyDivStyle = {
  margin: "auto",
};

const surfaceColor = "#27292D";
const boxStyle = {
  flex: "1",
  marginLeft: "10px",
  marginRight: "10px",
  height: "400px",
  //backgroundColor: "#e8eaf6",
  backgroundColor: surfaceColor,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
};

const bodyTextStyle = {
  color: "#ffffff",
};

const hrefStyle = {
  color: "inherit",
  textDecoration: "none",
};

// Should be different if logged in :|
const LandingPage = (props) => {
  const { isLoaded } = props;

  const textColor = "#8899A6";
  const iconColor = "#1DA1F2";
  const iconSize = "8em";

  const GridLayout = (header, description, link, icon) => {
    return (
      <Paper style={boxStyle}>
        <a href={link} style={hrefStyle}>
          <div style={{ flex: "1", color: "#FFFFFF" }}>
            <h2>{header}</h2>
          </div>
          <Divider />
          <div
            style={{
              flex: "3",
              marginLeft: "10px",
              marginRight: "10px",
              marginTop: "10px",
              color: textColor,
            }}
          >
            {description}
          </div>
          <div style={{ margin: "auto" }}>{icon}</div>
          <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
          <div style={{ flex: "1", color: "#f85a3e" }}>
            <div style={{}}>Learn more</div>
          </div>
        </a>
      </Paper>
    );
  };

  const listitems = [
    GridLayout(
      "Simple integrations",
      "Easily use others' or create your own integration",
      "/docs/features",
      <Web
        style={{ fontSize: iconSize, marginTop: "20px", color: iconColor }}
      />
    ),
    GridLayout(
      "Workflows",
      "Access the power of automation within minutes, whether its on premise or in the cloud",
      "/docs/features",
      <AccountTree
        style={{ fontSize: iconSize, marginTop: "20px", color: iconColor }}
      />
    ),
    GridLayout(
      "Realtime actions",
      "Beat the clock by leveraging our realtime triggers",
      "/docs/features",
      <ScheduleIcon
        style={{ fontSize: iconSize, marginTop: "20px", color: iconColor }}
      />
    ),
  ];

  // The actual landing page
  // <img style={{width: "400px"}} alt={"logo"} src={Default}/>
  //We start by understanding your unique environment to help identify the right thing to automate.
  const secondaryColor = "rgba(167,46,87,1)";
  const primaryColor = "rgba(25, 35, 94, 1)";

  const paperStyle = {
    flex: 1,
    backgroundColor: "inherit",
    cursor: "pointer",
  };

  const secondaryItemList = [
    {
      primaryText: "No time to waste",
      secondaryText:
        "Bring all your applications into a single view, and make them all work together flawlessly!",
      image: "/images/time.jpg",
    },
    {
      primaryText: "Get a better overview",
      secondaryText:
        "Don't know what's happening? We'll help you track and act on your most valuable KPI's!",
      image: "/images/overview.jpg",
    },
    {
      primaryText: "Conquer your tasks",
      secondaryText:
        "Get access to powerful tools and pre-made workflows to help you crush your teams daily tasks!",
      image: "/images/burnout.jpg",
    },
  ];
  const [image, setImage] = useState(secondaryItemList[0].image);

  const landingpageDataBrowser = (
    <div>
      <div
        style={{
          backgroundImage: "url('/images/test.jpg')",
          backgroundSize: "80% 100%",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          maxHeight: 1024,
        }}
      >
        <div
          style={{
            textAlign: "left",
            paddingTop: 135,
            maxWidth: 700,
            paddingLeft: "50%",
            color: secondaryColor,
            display: "flex",
            fontSize: 25,
          }}
        >
          <div style={{ flex: 1 }}>
            <a href="/docs/about" style={hrefStyle}>
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <InfoIcon />
                </Grid>
                <Grid item style={{ marginLeft: 5 }}>
                  About
                </Grid>
              </Grid>
            </a>
          </div>
          <div style={{ flex: 1 }}>
            <a href="/contact" style={hrefStyle}>
              <Grid container direction="row" alignItems="center">
                <Grid item>
                  <CreateIcon />
                </Grid>
                <Grid item style={{ marginLeft: 5 }}>
                  Get in touch
                </Grid>
              </Grid>
            </a>
          </div>
          <div style={{ flex: 1 }}>
            <a href="/login" style={hrefStyle}>
              <Button
                style={{
                  borderRadius: 25,
                  height: 50,
                  minWidth: 200,
                  backgroundColor: secondaryColor,
                  color: "white",
                }}
                variant="contained"
              >
                Try it out <ArrowForwardIcon />
              </Button>
            </a>
          </div>
        </div>
        <div
          style={
            (bodyTextStyle,
            {
              textAlign: "left",
              paddingTop: "8%",
              paddingLeft: "28%",
              maxWidth: 430,
            })
          }
        >
          <div style={{ fontSize: 25, color: "rgba(0,0,0,0.45)" }}>Shuffle</div>
          <div style={{ fontSize: 50, color: "rgba(0,0,0,0.7)" }}>
            INFORMATION <div style={{ color: secondaryColor }}>OVERLOAD</div>
          </div>
          <div
            style={{
              fontSize: 20,
              color: "rgba(0, 0, 0, 0.45)",
              marginTop: 20,
            }}
          >
            Everyone run into the same fundamental operational problems. Mailbox
            chaos, tickets getting out of hand and a constant feeling of being
            overwhelmed. The good news?{" "}
            <div style={{ color: secondaryColor, marginTop: 10 }}>
              Shuffle solves them.
            </div>
          </div>
          <a href="/docs/features" style={hrefStyle}>
            <Button
              style={{
                borderRadius: 25,
                height: 50,
                marginTop: 50,
                width: 200,
                backgroundColor: secondaryColor,
                color: "white",
              }}
              variant="contained"
            >
              Learn how
            </Button>
          </a>
        </div>
      </div>
      <div
        style={{
          minHeight: 1024,
          width: "100%",
          backgroundImage: "linear-gradient(to bottom right, #19235e, #19235e)",
        }}
      >
        <div
          style={{
            minHeight: 1000,
            paddingTop: 150,
            maxWidth: 1250,
            margin: "auto",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.8",
              fontSize: 60,
              marginLeft: 25,
            }}
          >
            <b>Automation is just the beginning </b>
          </div>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "row" }}>
            <div
              style={{
                flex: 8,
                display: "flex",
                flexDirection: "column",
                fontSize: 40,
              }}
            >
              {secondaryItemList.map((data, index) => {
                const color =
                  image === data.image
                    ? "rgba(255,255,255,1)"
                    : "rgba(255,255,255,0.4)";
                return (
                  <div
                    style={{
                      borderRadius: 15,
                      padding: 25,
                      maxWidth: 600,
                      height: 150,
                      fontSize: 40,
                      color: color,
                      cursor: "pointer",
                    }}
                    onClick={() => setImage(data.image)}
                  >
                    {data.primaryText}
                    <div style={{ fontSize: 22, marginTop: 10 }}>
                      {data.secondaryText}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ flex: 10, height: "100%", width: "100%" }}>
              <img
                src={image}
                style={{
                  borderRadius: 15,
                  minHeight: "100%",
                  minWidth: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            maxWidth: 1250,
            paddingTop: 100,
            paddingBottom: 100,
            margin: "auto",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <Divider style={{ backgroundColor: "rgba(255,255,255,0.6)" }} />
          <div
            style={{
              marginTop: 100,
              fontSize: 40,
              display: "flex",
              marginLeft: 100,
              marginRight: 100,
            }}
          >
            <div style={{ flex: 3 }}>
              Learn more about the benefits of Shuffle
            </div>
            <div style={{ flex: 1 }}>
              <a href="/docs/features" style={hrefStyle}>
                <Button
                  fullWidth
                  style={{
                    borderRadius: 25,
                    minHeight: 50,
                    minWidth: 200,
                    backgroundColor: secondaryColor,
                    color: "white",
                  }}
                  variant="contained"
                >
                  See features
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          maxWidth: 1100,
          minHeight: 600,
          paddingTop: 100,
          margin: "auto",
          color: "rgba(0,0,0,1)",
        }}
      >
        <div style={{ fontSize: 50 }}>
          <b>Focus on the work that matters to you</b>
        </div>
        <div
          style={{ fontSize: 20, color: "rgba(0,0,0,0.7)", maxWidth: "100%" }}
        >
          Menial tasks, scattered content, constant copy pasting, waste of
          talent - <b>there's a smarter way to work.</b>
        </div>
        <div style={{ display: "flex", marginTop: 50 }}>
          <Card
            onClick={() => {
              window.location.pathname = "/docs/features";
            }}
            style={{ flex: 1, margin: 10, textAlign: "center" }}
          >
            <CardActionArea>
              <CardMedia title="TEST" image="/images/time.jpg" />
              <CardContent>
                <h3>Premade playbooks</h3>
                <p>Get your automation done with minimal effort</p>
              </CardContent>
            </CardActionArea>
            <Button size="medium" color="green">
              Learn more
            </Button>
          </Card>
          <Card
            onClick={() => {
              window.location.pathname = "/docs/features";
            }}
            style={{ flex: 1, margin: 10, textAlign: "center" }}
          >
            <CardActionArea>
              <CardMedia title="TEST" image="/images/time.jpg" />
              <CardContent>
                <h3>Open frameworks</h3>
                <p>Mitre Att&ck, OpenAPI and more!</p>
              </CardContent>
            </CardActionArea>
            <Button size="medium" color="green">
              Learn more
            </Button>
          </Card>
          <Card
            onClick={() => {
              window.location.pathname = "/docs/features";
            }}
            style={{ flex: 1, margin: 10, textAlign: "center" }}
          >
            <CardActionArea>
              <CardMedia title="TEST" image="/images/time.jpg" />
              <CardContent>
                <h3>Hundreds of integrations</h3>
                <p>Quickly integrate your software applications</p>
              </CardContent>
            </CardActionArea>
            <Button size="medium" color="green">
              Learn more
            </Button>
          </Card>
          <Card
            style={{ flex: 1, margin: 10, textAlign: "center" }}
            onClick={() => {
              window.location.pathname = "/docs/features";
            }}
          >
            <CardActionArea>
              <CardMedia title="TEST" image="images/time.jpg" />
              <CardContent>
                <h3>Automated compliance</h3>
                <p>Stuck with compliance needs you can't meet?</p>
              </CardContent>
            </CardActionArea>
            <Button size="medium" color="green">
              Learn more
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  const landingpageDataMobile = (
    <div style={{ backgroundColor: "#1F2023", paddingTop: 30 }}>
      <div
        style={{
          color: "white",
          textAlign: "center",
          marginLeft: "10px",
          marginRight: "10px",
        }}
      >
        <h1>Shuffle</h1>
        <h3>A general automation solution for Infosec and IT Professionals</h3>
        <a href="/contact" style={hrefStyle}>
          <Button
            style={{ width: "220px", height: "60px", borderRadius: "0px" }}
            variant="contained"
            color="primary"
          >
            Contact
          </Button>
        </a>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", marginTop: "100px" }}
      >
        <div>{listitems[0]}</div>
        <div style={{ marginTop: "20px" }}>{listitems[1]}</div>
        <div style={{ marginTop: "20px", marginBottom: "30px" }}>
          {listitems[2]}
        </div>
        <div
          style={{
            marginTop: "20px",
            marginBottom: "30px",
            textAlign: "center",
          }}
        >
          <a href="/contact" style={hrefStyle}>
            <Button
              style={{ width: "220px", height: "60px", borderRadius: "0px" }}
              variant="contained"
              color="primary"
            >
              Contact
            </Button>
          </a>
        </div>
      </div>
    </div>
  );

  // Reroute if the user is logged in
  // const landingSite = isLoggedIn ? <Workflows globalUrl={globalUrl}{...props} /> : <div style={bodyDivStyle}>{landingpageData}</div>
  const landingSite = <div style={bodyDivStyle}>{landingpageDataBrowser}</div>;

  const loadedCheck = isLoaded ? (
    <div>
      <BrowserView>{landingSite}</BrowserView>
      <MobileView>{landingpageDataMobile}</MobileView>
    </div>
  ) : (
    <div></div>
  );

  return <div>{loadedCheck}</div>;
};
export default LandingPage;
