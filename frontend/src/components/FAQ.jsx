import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FAQItem = (props) => {
	const { question, answer } = props

	return (
		<Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography variant='body1'>
			{question}
		  </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant='body2'>
           {answer}
          </Typography>
        </AccordionDetails>
      </Accordion>

	)
}

export default FAQItem;
