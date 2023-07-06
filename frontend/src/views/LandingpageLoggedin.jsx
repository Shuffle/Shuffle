import React from "react";

const bodyDivStyle = {
  transform: "translate(-50%, -50%)",
  top: "50%",
  left: "50%",
  position: "absolute",
  width: "500px",
  color: "white",
};

// Should be different if logged in :|
const LandingPageLoggedin = (props) => {
  return <div style={bodyDivStyle}>TMP landingpage when logged in</div>;
};
export default LandingPageLoggedin;
