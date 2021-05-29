import React from 'react';
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
	palette: {
		primary: {
			main: "#f85a3e"
    },
    secondary: {
      main: '#e8eaf6',
    },
		text: {
			secondary: "rgba(255,255,255,0.7)",
		},
		surfaceColor: "#27292d",
		inputColor: "#383B40",
		borderRadius: 5,
		textFieldStyle: {
			backgroundColor: "#383B40",
			borderRadius: 5,
		},
		innerTextfieldStyle: {
			color: "white",
			minHeight: 50, 
			marginLeft: "5px",
			maxWidth: "95%",
			fontSize: "1em",
			borderRadius: 5,
		},
  	tooltip: {
  	  backgroundColor: "white",
  	  color: 'rgba(0, 0, 0, 0.87)',
  	  boxShadow: 1,
  	  fontSize: 11,
  	},
   },
   typography: { 
			"fontFamily": `"Roboto", "Helvetica", "Arial", sans-serif`,
      useNextVariants: true,
			h1: {
				fontSize: 40,
			},
			h4: {
				fontSize: 30,
				fontWeight: 500,
			},
			h6: {
				fontSize: 22,
			},
			body1: {
				fontSize: 18,
			},
   },
	overrides: {
		MuiMenu: {
			list: {
				backgroundColor: "#383B40",
			},
		},
	},
});

export default theme;
