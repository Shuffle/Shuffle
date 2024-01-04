import React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const classes = {
  box: {
    fontSize: 60,
    color:"white",
    opacity: 0.9,
    backgroundColor: "#27292d",
  },
};

const FAQItem = () => {
  // const { question, answer } = props

  return (
    <div>
      <Accordion
      sx={classes.box}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{color:"white"}} />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant="body1">
            {/* {question} */}
            How can i switch to annual billing?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2">
            {/* {answer} */}
            Contact us at{" "}
            <span className="underline text-blue-500">Contact</span> Page
          </Typography>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default FAQItem;
