import React, { useEffect } from "react";

const Popup = (props) => {
  const { data } = props;

  const popupStyle = {
    position: "fixed",
    width: "300px",
    height: "50px",
    backgroundColor: "black",
    color: "white",
  };

  const popupData = <div>HEY</div>;

  return <div>{popupData}</div>;
};

export default Popup;
