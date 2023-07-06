import React from "react";

//import List from '@material-ui/core/List';
//import ListItem from '@material-ui/core/ListItem';

//borderTop: "1px solid #385F71"
const FooterStyle = {
  right: "0",
  left: "0",
  bottom: "0",
  height: "130px",
  backgroundColor: "rgba(15, 14, 31, 1)",
};

const FooterInfo = {
  maxWidth: "1150px",
  minWidth: "768px",
  textAlign: "center",
  margin: "auto",
};

const hrefStyle = {
  color: "#bdbdbd",
  textDecoration: "none",
};

const Footer = (props) => {
  return (
    <div style={FooterStyle}>
      <div style={FooterInfo}>
        <Box />
      </div>
    </div>
  );
};

const Box = (props) => {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: "1" }}>
        <a style={hrefStyle} href="/about">
          <h1>About</h1>
        </a>
      </div>
      <div style={{ flex: "1" }}>
        <a style={hrefStyle} href="/privacy-policy">
          <h1>Privacy Policy</h1>
        </a>
      </div>
    </div>
  );
};

export default Footer;
