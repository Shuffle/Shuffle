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

export const getTheme = (themeMode, brandColor) => {
  // Handle "system" mode by checking user's system preference
  let resolvedMode = themeMode;
  if (themeMode === "system" || !themeMode) {
    resolvedMode = window?.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }
  // Ensure mode is only "dark" or "light"
  if (resolvedMode !== "dark" && resolvedMode !== "light") {
    resolvedMode = "dark";
  }

  return createTheme({
      palette: {
        mode: resolvedMode,
        main: brandColor || "#FF8544",
        primary: {
          main: brandColor || "#FF8544",
          contrastText:  "#ffffff",
        },
        secondary: {
          main: "rgba(255,255,255,0.7)",
          contrastText:"#000000",
        },
        text: {
          primary: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A",
          secondary: resolvedMode === "dark" ? "#9E9E9E" : "#616161",
        },
        type: resolvedMode,
        inputColor: resolvedMode === "dark" ? "rgba(39,41,45,1)" : "rgba(245, 245, 245, 1)",
        textColor: resolvedMode === "dark" ? "#F1F1F1" : "#1A1A1A",
        textPrimary: resolvedMode === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(26, 26, 26, 0.8)",
        surfaceColor: resolvedMode === "dark" ? "#27292d" : "#EFEFEF",
        platformColor: resolvedMode === "dark" ? "#212121" : "#ffffff",
        backgroundColor: resolvedMode === "dark" ? "#1a1a1a" : "#f1f1f1",
        cytoscapeBackgroundColor: resolvedMode === "dark" ? "#161616" : "#f5f5f5",
        distributionColor: resolvedMode === "dark" ? "#40E0D0" : "#008080",
        cardBackgroundColor: resolvedMode === "dark" ? "#1e1e1e" : "#eaeaea",
        cardHoverColor: resolvedMode === "dark" ? "#323232" : "#F0F0F0", 
        hoverColor: resolvedMode === "dark" ? "#323232" : "#D6D6D6",
        usecaseCardColor: resolvedMode === "dark" ? "#2f2f2f" : "rgba(245, 245, 245, 1)",
        usecaseCardHoverColor: resolvedMode === "dark" ? "#2F2F2F" : "rgba(245, 245, 245, 1)",
        usecaseDialogFieldColor: resolvedMode === "dark" ? "#2B2B2B" : "#F5F5F5",
        accentColor: resolvedMode === "dark" ? "#ff8544" : "#ff8544",
        green: resolvedMode === "dark" ? "#5cc879" : "#008000",
        defaultBorder: resolvedMode === "dark" ? '1px solid #494949' : '1px solid #CCCCCC',
        linkColor: brandColor === "#ff8544" ? "#f86a3e" : brandColor,
        slateGrayColor: resolvedMode === "dark" ? "#494949" : "#CCCCCC",
        parsedAppPaperColor: resolvedMode === "dark" ? "#2f2f2f" : "#CCCCCC",

        borderRadius: 10,
        loaderColor: resolvedMode === "dark" ? "#1a1a1a" : "#E0E0E0",
        jsonIconStyle: "round",
        jsonTheme: resolvedMode === "dark" ? "summerfruit" : {
          base00: "#ffffff", // background
          base01: "#f0f0f0", // very light grey
          base02: "#f5f5f5", // light grey
          base03: "#999999", // dim text
          base04: "#444444", // bold keys
          base05: "#333333", // normal text
          base06: "#1a1a1a", // darker text
          base07: "#000000", // black
          base08: "#f14c4c", // red
          base09: "#f58c1f", // orange
          base0A: "#f2c032", // yellow
          base0B: "#51975d", // green
          base0C: "#2aa198", // teal
          base0D: "#007acc", // blue (keys!)
          base0E: "#c586c0", // purple
          base0F: "#d16969", // brown
        },
        jsonCollapseStringsAfterLength: 100,
        drawer: {
          backgroundColor: resolvedMode === "dark" ? "#262626" : "#f9f9f9"
        },
        actionSidebarField: {
          backgroundColor: resolvedMode === "dark" ? "#2F2F2F" : "#F1F1F1",
          color: resolvedMode === "dark" ? "#ffffff" : "#000000",
          borderRadius: 8,
          height: 40,
          border: "none",
        },
        reactJsonStyle: {
          padding: 5,
          width: "98%",
          borderRadius: 5,
          border: resolvedMode === "dark" ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(0,0,0,0.3)",
          backgroundColor: resolvedMode === "dark"
            ? "#1A1A1A"
            : "#f1f1f1",
          color: resolvedMode === "dark"
            ? "#F1F1F1"
            : "#1A1A1A",
          overflowX: "auto",
        },        
        textFieldStyle: {
          backgroundColor: resolvedMode === "dark" ? "#212121" : "#FFFFFF",
          color: resolvedMode === "dark" ? "#ffffff" : "#000000",
          borderRadius: "5px",
          height: 40,
          border: resolvedMode === "dark" ? "1px solid #4D4D4D" : "1px solid #E0E0E0",
        },
        DialogStyle: {
          backgroundColor: resolvedMode === "dark" ? "#212121" : "#ffffff",
          borderRadius: 2,
          boxShadow: resolvedMode === "dark" ? "0px 0px 10px 0px rgba(0,0,0,0.75)" : "0px 0px 10px 0px rgba(0,0,0,0.2)",
          border: resolvedMode === "dark" ? "1px solid #494949" : "1px solid #cccccc",
        },
        innerTextfieldStyle: {
          height: 40,
          fontSize: 16,
          backgroundColor: resolvedMode === "dark" ? "#212121" : "#f5f5f5",
        },
        tooltip: {
          backgroundColor: resolvedMode === "dark" ? "#212121" : "#ffffff",
          color: resolvedMode === "dark" ? "#ffffff" : "#000000",
          border: resolvedMode === "dark" ? "1px solid #494949" : "1px solid #cccccc",
        },
        chipStyle: {
          backgroundColor: resolvedMode === "dark" ? "#333333" : "#F5F5F5",
          borderColor: resolvedMode === "dark" ? "#444444" : "#E0E0E0",
          color: resolvedMode === "dark" ? "#FFFFFF" : "#333333",
        },        
        defaultImage: "/images/no_image.png",
        singulOrange: "/images/singul_orange.png",
        singulGreen: "/images/singul_green.png",
        singulBlackWhite: "/icons/workflow-page/shuffle_agent.png",
        scrollbarColor: resolvedMode === "dark" ? "#494949 #2f2f2f": "#c1c1c1 #f1f1f1",
        scrollbarColorTransparent: resolvedMode === "dark" ? '#494949 transparent': "#c1c1c1 transparent",
      },
      typography: {
        fontFamily: `"inter", "Roboto", "Helvetica", "Arial", sans-serif`,
        color: resolvedMode === "dark" ? "#ffffff" : "#000000",
        useNextVariants: true,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightSemiBold: 600,
        fontWeightBold: 700,
        allVariants: {
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A",
        },      
        h1: {
          fontSize: 40,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
        h2: {
          fontSize: 36,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
        h3: {
          fontSize: 32,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
        h4: {
          fontSize: 30,
          fontWeight: 500,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
        h6: {
          fontSize: 22,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
        body1: {
          fontSize: 16,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
        body2: {
          fontSize: 14,
          color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A"
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: '4px',
            },
          },
          variants: [
            {
              props: { variant: 'text', color: 'primary' },
              style: {
                color: resolvedMode === "dark" ? "#ffffff" : "#1A1A1A",
                whiteSpace: "nowrap",
		            textWrap: "normal",
              },
            },
            {
              props: { variant: 'text', color: 'secondary' },
              style: {
                color: resolvedMode === "dark" ? "#9E9E9E" : "#616161",
                whiteSpace: "nowrap",
		            textWrap: "normal",
              },
            },
            {
              props: { variant: 'contained', color: 'primary' },
              style: {
                backgroundColor: resolvedMode === "dark" ? brandColor || '#ff8544' : brandColor || '#FF7C35',
                color: resolvedMode === "dark" ? '#1a1a1a': '#FFFFFF',
                borderRadius: '4px',
                whiteSpace: "nowrap",
		            textWrap: "normal",
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': {
                  fontWeight: 600,
                  backgroundColor: resolvedMode === 'dark' ? brandColor || "#ff955c" : brandColor || '#FF8D4F',
                  color: resolvedMode === "dark" ? '#1a1a1a': '#FFFFFF',
                },
              },
            },
            {
              props: { variant: 'contained', color: 'secondary' },
              style: {
                backgroundColor: resolvedMode === "dark" ? '#494949' : '#C9C9C9',
                color: resolvedMode === "dark" ? '#ffffff' : '#4C4C4C',
                borderRadius: '4px',
                boxShadow: 'none',
                whiteSpace: "nowrap",
                transition: 'all 0.2s ease-in-out',
		            textWrap: "normal",
                '&:hover': {
                  fontWeight: 600,
                  border: resolvedMode === "dark" ? '1px solid #f1f1f1' : 'none',
                  backgroundColor: resolvedMode === "dark" ? '#494949' : '#C9C9C9',
                  color: resolvedMode === "dark" ? '#ffffff' : '#4C4C4C',
                },
              },
            },
            {
              props: { variant: 'outlined', color: 'primary' },
              style: {
                borderColor: resolvedMode === "dark" ?  brandColor || "#ff8544" : brandColor || "#cc5f1f",
                color: resolvedMode === "dark" ? brandColor || "#ff8544" : brandColor || "#cc5f1f",
                whiteSpace: "nowrap",
                fontWeight: 'normal',
		            textWrap: "normal",
                '&:hover': {
                  backgroundColor: resolvedMode === "dark" ? brandColor || "#ff8544" : "#ffe8dc",
                  color: resolvedMode === "dark" ? "#1a1a1a" : "#8a3d00",
                  fontWeight: 600,
                },
              },
            },            
            {
              props: { variant: 'outlined', color: 'secondary' },
              style: {
                border: '1px solid #C5C5C5',
                color: resolvedMode === "dark" ? '#C5C5C5' : '#2D2D2D',
                whiteSpace: "nowrap",
		            textWrap: "normal",
                '&:hover': {
                  backgroundColor: resolvedMode === "dark" ? '#C5C5C5' : '#EFEFEF',
                  borderColor: resolvedMode === "dark" ? '#C5C5C5' : '#2D2D2D',
                  fontWeight: 600,
                  color: resolvedMode === "dark" ? '#1a1a1a' : '#1A1A1A',
                },
              },
            },
            {
              props: { variant: 'aiButton' },
              style: {
                background: 'linear-gradient(90deg, #ff8544 0%, #ec517c 50%, #9c5af2 100%)',
                color: '#ffffff',
                borderRadius: '4px',
                whiteSpace: "nowrap",
                textWrap: "normal",
                border: 'none',
                boxShadow: 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  color: '#ffffff',
                  textShadow: '0 0 1px currentColor',
                },
                '&:active': {
                  background: 'linear-gradient(90deg, #e6743a 0%, #d4456e 50%, #8a4de8 100%)',
                },
                '&:disabled': {
                  background: resolvedMode === "dark" ? '#494949' : '#C9C9C9',
                  color: resolvedMode === "dark" ? '#9E9E9E' : '#616161',
                },
              },
            },
            {
              props: { variant: 'aiButtonGhost' },
              style: {
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                whiteSpace: "nowrap",
                textWrap: "normal",
                boxShadow: 'none',
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '4px',
                  padding: '2px',
                  background: 'linear-gradient(90deg, #ff8544 0%, #ec517c 50%, #9c5af2 100%)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  transition: 'opacity 0.2s ease-in-out',
                  zIndex: -1,
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, #ff8544 0%, #ec517c 50%, #9c5af2 100%)',
                  color: '#ffffff',
                  '&::before': {
                    opacity: 0,
                  },
                },
                '&:active': {
                  background: 'linear-gradient(90deg, #e6743a 0%, #d4456e 50%, #8a4de8 100%)',
                },
                '&:disabled': {
                  background: 'transparent',
                  color: resolvedMode === "dark" ? '#9E9E9E' : '#616161',
                  '&::before': {
                    background: resolvedMode === "dark" ? '#494949' : '#C9C9C9',
                  },
                },
              },
            },
          ],
        },
        MuiTab: {
          styleOverrides: {
            root: {
              color: resolvedMode === "dark" ? "#C5C5C5" : "#1A1A1A",
            },
          },
        },
      },

      overrides: {
        MuiMenu: {
          list: {
            backgroundColor: resolvedMode === "dark" ? "#27292d" : "#ffffff",
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
    });
}

