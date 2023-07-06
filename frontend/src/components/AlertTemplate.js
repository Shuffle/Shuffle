import React from "react";
import InfoIcon from "@material-ui/icons/Info";
import CheckIcon from "@material-ui/icons/Check";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";

const alertStyle = {
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
  padding: 15,
  textTransform: "uppercase",
  borderRadius: "3px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0px 2px 2px 2px rgba(0, 0, 0, 0.03)",
  width: 300,
  boxSizing: "border-box",
  zIndex: 100001,
  overflow: "hidden",
};

const buttonStyle = {
  marginLeft: "20px",
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
  color: "#FFFFFF",
};

const AlertTemplate = ({ message, options, style, close }) => {
  return (
    <div style={{ ...alertStyle, ...style }}>
      {options.type === "info" && <InfoIcon style={{ color: "white" }} />}
      {options.type === "success" && <CheckIcon style={{ color: "green" }} />}
      {options.type === "error" && (
        <ErrorOutlineIcon style={{ color: "red" }} />
      )}
      <Typography style={{ marginLeft: 15, flex: 2 }}>{message}</Typography>
      <button onClick={close} style={buttonStyle}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default AlertTemplate;
