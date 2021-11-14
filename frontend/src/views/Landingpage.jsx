import React from "react";

import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import { BrowserView, MobileView } from "react-device-detect";
import ScheduleIcon from "@material-ui/icons/Schedule";
import Web from "@material-ui/icons/Web";
import AccountTree from "@material-ui/icons/AccountTree";

const bodyDivStyle = {
  margin: "auto",
  marginTop: "75px",
  textAlign: "center",
  width: "1100px",
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
  color: "black",
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
      "/docs/apps",
      <Web
        style={{ fontSize: iconSize, marginTop: "20px", color: iconColor }}
      />
    ),
    GridLayout(
      "Workflows",
      "Access the power of automation within minutes, whether its on premise or in the cloud",
      "/docs/workflows",
      <AccountTree
        style={{ fontSize: iconSize, marginTop: "20px", color: iconColor }}
      />
    ),
    GridLayout(
      "Realtime actions",
      "Beat the clock by leveraging our realtime triggers",
      "/docs/triggers",
      <ScheduleIcon
        style={{ fontSize: iconSize, marginTop: "20px", color: iconColor }}
      />
    ),
  ];

  // The actual landing page
  // <img style={{width: "400px"}} alt={"logo"} src={Default}/>
  const landingpageDataBrowser = (
    <div>
      <div style={bodyTextStyle}>
        <h1>Shuffle</h1>
        <h3 style={{ color: "#8899A6" }}>
          A general automation solution for Infosec and IT Professionals
        </h3>
      </div>
      <a href="/register" style={hrefStyle}>
        <Button
          style={{ width: "180px", height: "50px", borderRadius: "0px" }}
          variant="outlined"
          color="primary"
        >
          Try it out
        </Button>
      </a>
      <a href="/contact" style={hrefStyle}>
        <Button
          style={{ width: "180px", height: "50px", borderRadius: "0px" }}
          variant="contained"
          color="primary"
        >
          Contact
        </Button>
      </a>
      <div style={{ display: "flex", marginTop: "100px" }}>
        {listitems.map((item) => {
          return <div>{item}</div>;
        })}
      </div>
    </div>
  );

  const landingpageDataMobile = (
    <div>
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
