import React, { useState } from "react";
import theme from "../theme.jsx";
import { TextField, Typography, Button } from "@mui/material";

const SearchContactForm = ({ globalUrl, isMobile, tabName }) => {
  const [formMail, setFormMail] = useState("");
  const [message, setMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const submitContact = (email, message) => {
    const data = {
      firstname: "",
      lastname: "",
      title: "",
      companyname: "",
      email: email,
      phone: "",
      message: message,
    };

    const errorMessage =
      "Something went wrong. Please contact frikky@shuffler.io directly.";

    fetch(globalUrl + "/api/v1/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        setFormMessage(
          response?.success === true ? response.reason : errorMessage
        );
        setFormMail("");
        setMessage("");
      })
      .catch(() => {
        setFormMessage(errorMessage);
      });
  };

  return (
    <div
      style={{
        paddingTop: 0,
        maxWidth: isMobile ? "100%" : "60%",
        margin: "auto",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" style={{ color: "white", marginTop: 50 }}>
        Can't find what you're looking for?
      </Typography>
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "row",
          textAlign: "center",
        }}
      >
        <TextField
          required
          style={{
            flex: "1",
            marginRight: 15,
            backgroundColor: theme.palette.inputColor,
          }}
          InputProps={{ style: { color: "#ffffff" } }}
          color="primary"
          fullWidth={true}
          placeholder="Email (optional)"
          type="email"
          id="email-handler"
          autoComplete="email"
          margin="normal"
          variant="outlined"
          value={formMail}
          onChange={(e) => setFormMail(e.target.value)}
        />
        <TextField
          required
          style={{ flex: "1", backgroundColor: theme.palette.inputColor }}
          InputProps={{ style: { color: "#ffffff" } }}
          color="primary"
          fullWidth={true}
          placeholder={tabName ? `What ${tabName} do you want to see?` : "What are we missing?"}
          type=""
          id="standard-required"
          margin="normal"
          variant="outlined"
          autoComplete="off"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <Button
        variant="contained"
        color="primary"
        style={{
          borderRadius: 30,
          height: 50,
          width: 220,
          margin: isMobile ? "15px auto 15px auto" : 20,
          fontSize: 18,
        }}
        disabled={message.length === 0}
        onClick={() => submitContact(formMail, message)}
      >
        Submit
      </Button>
      <Typography style={{ color: "white" }} variant="body2">
        {formMessage}
      </Typography>
    </div>
  );
};

export default SearchContactForm;
