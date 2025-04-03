import React from "react";
import { createTheme, adaptV4Theme } from "@mui/material/styles";

const theme = createTheme(adaptV4Theme({
  palette: {
	theme: "dark",
    main: "#FF8544",
    primary: {
      main: "#FF8544",
  	  contrastText: "#ffffff",
    },
    secondary: {
      main: "rgba(255,255,255,0.7)",
	  contrastText: "#000000",
    },
    text: {
      secondary: "rgba(255,255,255,0.8)",
    },
    type: "dark",
    //inputColor: "#383B40",
    
	inputColor: "rgba(39,41,45,1)",
    surfaceColor: "#27292d",
    //platformColor: "#1c1c1d",
    platformColor: "#212121",
    backgroundColor: "#1a1a1a",
	distributionColor: "#40E0D0",

    green: "#5cc879",
    borderRadius: 8,
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
      backgroundColor: "#212121",
      borderRadius: 5,
	  height: 40, 
    },
    DialogStyle: {
      backgroundColor: "#212121",
      borderRadius: 2,
      boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",
      border: "1px solid #494949",
    },
    innerTextfieldStyle: {
	  height: 40,
	  fontSize: 16,
      backgroundColor: "#212121",
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
	singulOrange: "/images/singul_orange.png",
	singulGreen: "/images/singul_green.png",
	singulBlackWhite: "/images/singul_black_white.png",
  },
  typography: {
    fontFamily: `"inter", "Roboto", "Helvetica", "Arial", sans-serif`,
    useNextVariants: true,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    fontWeightBold: 700,
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
            font-family: 'Inter';
            font-style: normal;
            font-display: swap;
            font-weight: 300;
            src: local('Inter Light'), local('Inter-Light');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-display: swap;
            font-weight: 400;
            src: local('Inter Regular'), local('Inter-Regular');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-display: swap;
            font-weight: 500;
            src: local('Inter Medium'), local('Inter-Medium');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-display: swap;
            font-weight: 600;
            src: local('Inter SemiBold'), local('Inter-SemiBold');
          }
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-display: swap;
            font-weight: 700;
            src: local('Inter Bold'), local('Inter-Bold');
          }
        `,
      },
	},
  },
}));

export default theme;
