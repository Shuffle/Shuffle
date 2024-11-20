import React from "react";
import { createTheme, adaptV4Theme } from "@mui/material/styles";

const theme = createTheme(adaptV4Theme({
  palette: {
	theme: "dark",
    main: "#F86743",
    primary: {
      main: "#F86743",
  	  contrastText: "#ffffff",
    },
    secondary: {
      main: "#e8eaf6",
	  contrastText: "#000000",
    },
    text: {
      secondary: "rgba(255,255,255,0.7)",
    },
    type: "dark",
    //inputColor: "#383B40",
    
	inputColor: "rgba(39,41,45,1)",
    surfaceColor: "#27292d",
    platformColor: "#1c1c1d",
    backgroundColor: "#1a1a1a",

    green: "#5cc879",
    borderRadius: 10,
    defaultBorder: "1px solid rgba(255,255,255,0.3)",

	//jsonTheme: "brewer",
	//jsonTheme: "chalk",
	//jsonTheme: "monokai",
	//jsonTheme: "google",
	//jsonTheme: "tomorrow",
	jsonIconStyle: "round",
	jsonTheme: "summerfruit",
	jsonCollapseStringsAfterLength: 100,

	reactJsonStyle: {
		padding: 5, 
		width: "98%",
		borderRadius: 5,
		border: "1px solid rgba(255,255,255,0.7)",
		overflowX: "auto",
	},
    textFieldStyle: {
      backgroundColor: "#383B40",
      borderRadius: 5,
    },
    innerTextfieldStyle: {
	  // Removed since upgrading to mui 18
      //color: "white",
      //minHeight: 50,
      //marginLeft: "5px",
      //maxWidth: "95%",
      //fontSize: "1em",
      //borderRadius: 5,
    },
    tooltip: {
      backgroundColor: "white",
      color: "rgba(0, 0, 0, 0.87)",
      boxShadow: 1,
      fontSize: 11,
    },
    defaultImage: "/images/no_image.png",
  },
  typography: {
    fontFamily: `"Roboto", "Helvetica", "Arial", "inter", sans-serif`,
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
        backgroundColor: "#27292d",
      },
    },
    MuiCssBaseline: {
		MuiCssBaseline: {
		  styleOverrides: `
			@font-face {
			  font-family: 'roboto';
			  font-style: normal;
			  font-display: swap;
			  font-weight: 300;
			  src: local('roboto'), local('roboto'), format('truetype');
			  unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
			}
		  `,
		},
	},
  },
}));

export default theme;
