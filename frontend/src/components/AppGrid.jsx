import React, { useEffect, useState, useRef } from "react";

import theme from "../theme.jsx";
import ReactGA from "react-ga4";
import { Link } from "react-router-dom";
import { removeQuery } from "../components/ScrollToTop.jsx";
import { useMemo } from "react";

import { Tabs, Tab } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  Search as SearchIcon,
  CloudQueue as CloudQueueIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify" 
import ClearIcon from '@mui/icons-material/Clear';
import Box from '@mui/material/Box';

import noImage from "../assets/img/no_image.png"

import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Configure,
  connectSearchBox,
  connectHits,
  connectHitInsights,
  RefinementList,
  ClearRefinements,
  connectStateResults
} from "react-instantsearch-dom";

import aa from "search-insights";

import "./FilterCSS.css";

import {
  Zoom,
  Grid,
  Paper,
  TextField,
  ButtonBase,
  InputAdornment,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";

const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
);
//const searchClient = algoliasearch("L55H18ZINA", "a19be455e7e75ee8f20a93d26b9fc6d6")

const AppGrid = (props) => {
  const {
    maxRows,
    showName,
    showSuggestion,
    isMobile,
    globalUrl,
    parsedXs,
    userdata,
    isHeader,
  } = props;

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

  const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows;
  const xs =
    parsedXs === undefined || parsedXs === null ? (isMobile ? 6 : 3) : parsedXs;
  //const [apps, setApps] = React.useState([]);
  //const [filteredApps, setFilteredApps] = React.useState([]);
  const [formMail, setFormMail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formMessage, setFormMessage] = React.useState("");

  const buttonStyle = {
    borderRadius: 30,
    height: 50,
    width: 220,
    margin: isMobile ? "15px auto 15px auto" : 20,
    fontSize: 18,
  };

  const innerColor = "rgba(255,255,255,0.65)";
  const borderRadius = 3;
  window.title = "Shuffle | Apps | Find and integrate any app";

  const isLoggedIn = userdata.success != undefined || userdata.success != null ? userdata.success: false;

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
        if (response.success === true) {
          setFormMessage(response.reason);
          //toast("Thanks for submitting!")
        } else {
          setFormMessage(errorMessage);
        }

        setFormMail("");
        setMessage("");
      })
      .catch((error) => {
        setFormMessage(errorMessage);
        console.log(error);
      });
  };

  const SearchBox = ({ currentRefinement, refine, isSearchStalled }) => {
    var defaultSearch = "";

	var [searchQuery, setSearchQuery] = useState("");

    //useEffect(() => {
    if (
      window !== undefined &&
      window.location !== undefined &&
      window.location.search !== undefined &&
      window.location.search !== null
    ) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
      const foundQuery = params["q"];
      if (foundQuery !== null && foundQuery !== undefined) {
        console.log("Got query: ", foundQuery);
        refine(foundQuery);
        defaultSearch = foundQuery;
		    searchQuery = foundQuery
      }
    }
    //}, [])
    

    const handleSearch = () => {
      refine(searchQuery.trim());
    };
    
    return (
      <form noValidate action="" role="search">
        <TextField
          value={searchQuery}
          fullWidth
          style={{
            backgroundColor: theme.palette.inputColor,
            marginTop: 20,
            marginLeft: 10,
            marginRight: 12,
            width: 693,
            borderRadius: 8,
            fontSize: 16,
          }}
          InputProps={{
            style: {
              color: "white",
              fontSize: "1em",
              height: 50,
              width: 693,
              borderRadius: 8,
            },
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ marginLeft: 5}} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchQuery.length > 0 && (
                  <ClearIcon
                    style={{
                      color: "white",
                      cursor: "pointer",
                      marginRight: 10
                    }}
                    onClick={() => {
                      setSearchQuery('')
                      removeQuery("q");
                      refine('')
                    }} 
                  />
                )}
                <button
                  type="button"
                  onClick={handleSearch}
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgb(248, 106, 62), rgb(243, 64, 121))",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    width: 100,
                    height: 35,
                    borderRadius: 17.5,
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
              </InputAdornment>
            ),
            
          }}
          autoComplete="off"
          color="primary"
          placeholder="Find Apps"
          id="shuffle_search_field"
          onChange={(event) => {
            setSearchQuery(event.currentTarget.value);
            removeQuery("q");
            refine(event.currentTarget.value);
          }}
          limit={5}
        />
        {/*isSearchStalled ? 'My search is stalled' : ''*/}
      </form>
    );
  };

  //List View Component
  // const ListView = ({ hits, isHideCategoryTagChecked, isHideTagChecked, userAppdata }) => {
  //   const tableDataStyle = {
  //     fontSize: 16,
  //     borderCollapse: "collapse",
  //     overflowY: "scroll",
  //     overflowX: "hidden",
  //     maxWidth: 741,
  //     marginLeft: "auto",
  //     marginRight: "auto",
  // };
  
  // const thStyle = {
  //     color: "#ffffff",
  //     fontWeight: "bold",
  //     padding: 5,
  //     textAlign: "center",
  //     borderBottom: "1px solid #494949",
  //     backgroundColor: "#212121",
  //     whiteSpace: "wrap",
  //     width: isHideCategoryTagChecked && isHideTagChecked ? 220 : 140,
  //     overflow: "hidden",
  //     textOverflow: "ellipsis",
  // };
  
  // const tdStyle = {
  //     padding: 5,
  //     textAlign: "center",
  //     borderBottom: "1px solid #494949",
  //     textOverflow: "ellipsis",
  //     overflowX: "hidden",
  //     whiteSpace: "nowrap",
  //     maxHeight: 60,
  //     maxWidth: (() => {
  //         if (isHideCategoryTagChecked || isHideTagChecked) {
  //             return isHideCategoryTagChecked && isHideTagChecked ? 220 : isHideCategoryTagChecked ? 240 : 270;
  //         } else {
  //             return 140;
  //         }
  //     })(),
  // };
  
  // const trStyle = {
  //     height: 40,
  //     width: "auto",
  // };
  
  // const buttonStyle = {
  //     backgroundColor: "transparent",
  //     cursor: "pointer",
  //     border: "none",
  //     color: "white",
  // };
  
  // const handleAppUrl = (hit) => {
  //     const appUrl = isCloud
  //         ? `/apps/${hit.objectID}?queryID=${hit.__queryID}`
  //         : `https://shuffler.io/apps/${hit.objectID}?queryID=${hit.__queryID}`;
  
  //     return appUrl;
  // };
  
  // const linkStyle = {
  //     textDecoration: "none",
  //     color: "white",
  // };
  
  // const listViewStyling = {
  //     maxHeight: 570,
  //     maxWidth: "100%", 
  //     overflowY: "scroll",
  //     overflowX: "hidden",
  //     marginLeft: "auto",
  //     marginRight: "auto",
  //     justifyContent: "center",
  //     scrollbarWidth: "thin",
  //     scrollbarColor: "#494949 #2f2f2f",
  //     marginTop: 2,
  // };

  //   return (
  //     <div style={listViewStyling}>
  //       <table style={tableDataStyle}>
  //         <thead style={{width:'48px', height: '48px'}}>
  //           <tr style={trStyle}>
  //             <th style={thStyle}>Logo</th>
  //             <th style={thStyle}>Name</th>
  //             {!isHideCategoryTagChecked && <th style={thStyle}>Category</th>}
  //             {!isHideTagChecked && <th style={thStyle}>Tag</th>}
  //             <th style={thStyle}>Created With</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {hits.map((hit, index) => (
  //             <tr style={trStyle}>
  //               <td style={tdStyle}>
  //                 <a
  //                   rel="noopener noreferrer"
  //                   target="_blank"
  //                   style={linkStyle}
  //                   href={handleAppUrl(hit)}
  //                 >
  //                   <img
  //                     src={currTab===0 ? hit.image_url : hit.small_image }
  //                     alt="Logo"
  //                     style={{
  //                       width: "48px",
  //                       height: "48px",
  //                       borderRadius: "8px",
  //                       objectFit: "cover",
  //                     }}
  //                   />
  //                 </a>
  //               </td>
  //               <td style={tdStyle}>{hit.name}</td>
  //               {!isHideCategoryTagChecked && (
  //                 <td style={tdStyle}>
  //                   {hit.categories ? hit.categories.join(", ") : "NA"}
  //                 </td>
  //               )}
  //               {!isHideTagChecked && (
  //                 <td style={tdStyle}>
  //                   {hit.tags ? hit.tags.join(", ") : "NA"}
  //                 </td>
  //               )}
  //               <td style={tdStyle}>
  //                 {hit.generated ? (
  //                   hit.invalid ? (
  //                     <span style={{ gap: "5px" }}>
  //                       <CloudQueueIcon />
  //                       <span> Cloud</span>
  //                     </span>
  //                   ) : (
  //                     <span style={{ gap: "5px" }}>
  //                       <CloudQueueIcon />
  //                       <span> Cloud</span>
  //                     </span>
  //                   )
  //                 ) : (
  //                   <span style={{ gap: "5px" }}>
  //                     <CodeIcon /> <span> Cloud/Python</span>
  //                   </span>
  //                 )}
  //               </td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //   );
  // };
  const [currTab, setCurrTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrTab(newValue);
  };

  //Component to fetch all app from the algolia
  const Hits = ({
    hits,
    insights,
    currentView,
    isHideTagChecked,
    isHideCategoryTagChecked,
  }) => {
    const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
    var counted = 0;
    const [hoverEffect, setHoverEffect] = useState(-1);

    const [isClickOnActivateButton, setIsClickOnActivateButton] = useState(false)

    const [usersActivatedApps, setUsersActivatedApps] = useState([]);

    useEffect(() => {
          const baseUrl = globalUrl;
          const userAppsUrl = `${baseUrl}/api/v1/users/apps`;
          fetch(userAppsUrl, {
                  method: "GET",
                  credentials: "include",
                  headers: {
                      "Content-Type": "application/json",
                  },
              })
              .then((response) => response.json())
              .then((data) => {
                setUsersActivatedApps(data);
              })
              .catch((err) => {
                  console.error("Error fetching user apps:", err);
              });
      }, []);

    const memoizedHits = useMemo(() => {
      return hits.map((data, index) => {
        let workflowDelay = 0;
        const isHeader = true;
        const isMouseOverOnCloudIcon = false;
        const isCloud = true;
        const xs = 12;
        const rowHandler = 12;
        const searchClient = {};
        const userdata = {};
        const paperStyle = {
          color: "rgba(241, 241, 241, 1)",
          padding: isHeader ? null : 15,
          cursor: "pointer",
          maxWidth: 339, 
          maxHeight: 96,
          borderRadius: 8,
          transition: 'background-color 0.3s ease',
          backgroundColor: "rgba(26, 26, 26, 1)",
        };

        const cloudIconStyling = {
          position: "absolute",
          top: 1,
          left: 300,
          height: 24,
          width: 24,
          marginTop: 5,
        };

        var parsedname = "";
        for (var key = 0; key < data.name.length; key++) {
          var character = data.name.charAt(key);
          if (character === character.toUpperCase()) {
            if (
              data.name.charAt(key + 1) !== undefined &&
              data.name.charAt(key + 1) ===
                data.name.charAt(key + 1).toUpperCase()
            ) {
            } else {
              parsedname += " ";
            }
          }
          parsedname += character;
        }

        parsedname = (
          parsedname.charAt(0).toUpperCase() + parsedname.substring(1)
        ).replaceAll("_", " ");
        const appUrl =
          isCloud === false
            ? `/apps/${data.objectID}?queryID=${data.__queryID}`
            : `https://shuffler.io/apps/${data.objectID}?queryID=${data.__queryID}`;


        // Since userdata.active_apps is always null. Therefore, utilizing the /users/apps endpoint to fetch the user's activated apps. So, comparing all apps and user app names to determine whether the app exists or not.

        const normalizeName = (name) => name.replace(/[_\s0-9]/g, '').toLowerCase();

        const appExists = Array.isArray(usersActivatedApps) && usersActivatedApps.some(item => normalizeName(item.name) === normalizeName(data.name));
      
        const handleActivateButton = (event, data, type)=>{
          event.preventDefault();
          if(!isLoggedIn){
            toast.error("Please log in to your account to activate app !")
            return
          }

          if(type === "activate"){
            toast.success(`${data.name} app is activating please wait...`)
          } 
          if(type === "deactivate"){
            toast.success(`${data.name} app is deactivating please wait...`)
          }

          const baseURL = globalUrl;
          const url = `${baseURL}/api/v1/apps/${data.objectID}/${type}`;

          fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: "include",
          })
          .then((response) => {
            return response.json()
          })
          .then((responseJson) => {

            console.log(responseJson)
            if (responseJson.success === false) {
              toast.error(`Failed to ${type}d the app`)
            } else {
                    toast.success(`App ${type}d Successfuly!`)
            }
          })
          .catch(error => {
            console.log("app error: ", error.toString())
          });
        }

        const normalizedString = (name) => {
          if (typeof name === 'string') {
            return name.replace(/_/g, ' ');
          } else {
            return name;
          }
        };
        return (
          <Zoom
            key={index}
            in={true}
            style={{
              transitionDelay: `${workflowDelay}ms`,
            }}
          >
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
              <a
                href={isClickOnActivateButton ? "" : appUrl}
                rel="noopener noreferrer"
                target="_blank"
                style={{
                  textDecoration: "none",
                  color: "#f85a3e",
                }}
              >
                <Paper
                  elevation={0}
                  style={paperStyle}
                  onMouseOver={() => {
                    setMouseHoverIndex(index);
                  }}
                  onMouseOut={() => {
                    setMouseHoverIndex(-1);
                  }}
                >
                  <button
                    style={{
                      borderRadius: 8,
                      fontSize: 16,
                      display: "flex",
                      alignItems: "flex-start",
                      padding: 0,
                      border: 'none',
                      width: 339,
                      height: 96,
                      cursor: 'pointer',
                      color: "rgba(241, 241, 241, 1)",
                      backgroundColor: "rgba(26, 26, 26, 1)",
                    }}
                  >
                    <img
                      alt={data.name}
                      src={data.image_url ? data.image_url : noImage}
                      style={{
                        width: 80,
                        height:80,
                        borderRadius: 8,
                        margin: 8
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                        overflow: "hidden",
                        margin: "12px 0 12px 0",
                        marginLeft: 8,
                        fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: "row",
                          overflow: "hidden",
                          gap: 8,
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {appExists && <Box sx={{ width: 8,height: 8, backgroundColor: "#02CB70", borderRadius: '50%'}}/>}
                        {normalizedString(data.name)}
                      </div>
                      {/* {!isHideCategoryTagChecked && ( */}
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "rgba(158, 158, 158, 1)",
                            marginTop: 5
                          }}
                        >
                          {data.categories !== null
                            ? normalizedString(data.categories).join(", ")
                            : "NA"}
                        </div>
                      {/* )} */}
                      {/* {!isHideTagChecked && ( */}
                      <div
                          style={{
                              display: "flex",
                              justifyContent: 'space-between',
                              width: 230,
                              textAlign: 'start',
                              color: "rgba(158, 158, 158, 1)",
                          }}
                      >
                          <div style={{marginBottom: 15, }}>
                              {mouseHoverIndex === index ? (
                                  <div>
                                  {data.tags && (
                                    <Tooltip
                                      title={data.tags.join(", ")}
                                      placement="bottom"
                                      componentsProps={{
                                        tooltip: {
                                          sx:{
                                            backgroundColor: "rgba(33, 33, 33, 1)",
                                            color: "rgba(241, 241, 241, 1)",
                                            width: "auto",
                                            height: "auto",
                                            fontSize: 16,
                                            border: "1px solid rgba(73, 73, 73, 1)",
                                          }
                                        }
                                      }}
                                    >
                                      <span>
                                        {data.tags.slice(0, 1).map((tag, tagIndex) => (
                                          <span key={tagIndex}>
                                            {normalizedString(tag)}
                                            {tagIndex < 1 ? ", " : ""}
                                          </span>
                                        ))}
                                      </span>
                                    </Tooltip>
                                  )}
                                </div>
                              ) : (
                                      <div style={{width: 230, textOverflow: "ellipsis", overflow: 'hidden', whiteSpace: 'nowrap',}}>
                                          {data.tags &&
                                              data.tags.map((tag, tagIndex) => (
                                                  <span key={tagIndex}>
                                                      {normalizedString(tag)}
                                                      {tagIndex < data.tags.length - 1 ? ", " : ""}
                                                  </span>
                                              ))}
                                      </div>
                                  )}
                          </div>
                          <div style={{position: 'relative', bottom: 5}}>
                          {mouseHoverIndex === index && (
                              <div>
                                {appExists? (
                                    <Button style={{
                                      width: 102,
                                      height: 35,
                                      borderRadius: 200,
                                      backgroundColor: "rgba(73, 73, 73, 1)",
                                      color: "rgba(241, 241, 241, 1)",
                                      textTransform: "none",
                                    }}
                                    onClick={(event) => {
                                      handleActivateButton(event, data, "deactivate");
                                    }}>
                                      Deactivate
                                    </Button>
                                ):(
                                    <Button 
                                      style={{
                                        width: 102,
                                        height: 35,
                                        borderRadius: 200,
                                        backgroundColor: "rgba(242, 101, 59, 1)",
                                        color: "rgba(255, 255, 255, 1)",
                                        textTransform: "none",
                                      }}
                                      onClick={(event) => {
                                        handleActivateButton(event, data, "activate");
                                      }}
                                    >
                                      Try app
                                    </Button>
                                )}
                              </div>
                          )}
                          </div>
                      </div>
                          {/* </div> */}
                      {/* )} */}
                    </div>
                  </button>
                </Paper>
              </a>
            </Grid>
          </Zoom>
        );
      });
    }, [hits, mouseHoverIndex, userdata, usersActivatedApps]);

    return (
      <Grid item spacing={2} justifyContent="flex-start">
        {/* {(currentView === "split") | (currentView === "splits") ? (
          <div
            style={{
              gap: "10px",
              marginTop: "16px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              marginLeft:'15px',
              overflowY: "auto",
              overflowX: "hidden",
              maxHeight: "570px",
              scrollbarWidth: "thin",
              scrollbarColor: "#494949 #2f2f2f",
            }}
          >
            {memoizedHits}
          </div>
        ) : (
          <ListView
            isHideCategoryTagChecked={isHideCategoryTagChecked}
            isHideTagChecked={isHideTagChecked}
            hits={hits}
          />
        )} */}
          <div
            style={{
              gap: 16,
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              marginLeft: 24,
              overflowY: "auto",
              overflowX: "hidden",
              maxHeight:  570,
              scrollbarWidth: "thin",
              scrollbarColor: "#494949 #2f2f2f",
            }}
          >
            {memoizedHits}
          </div>
      </Grid>
    );
  };

  var workflowDelay = -50;

  const CustomClearRefinements = connectStateResults(({ searchResults, ...rest }) => {
    const hasFilters = searchResults && searchResults.nbHits !== searchResults.nbSortedHits;
    return <ClearRefinements translations={{ reset: <span style={{ textDecoration: 'underline' }}>Clear All</span> }}  {...rest} disabled={!hasFilters} />;
  });

//Component to Filter all apps base on category
  const FilterAllAppsByCategory = () => {
    const [isRefinementListExpanded, setIsRefinementListExpanded] =
      useState(true);

    const toggleRefinementList = () => {
      setIsRefinementListExpanded((prevState) => !prevState);
    };

    const categoryButtonStyling = {
      cursor: "pointer",
      color: "white",
      border: "none",
      backgroundColor: "transparent",
      fontSize: 16,
      display: "flex",
      width: "100%",
      height: 30,
      flexDirection: "row",
      textTransform: 'none',
      fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)"
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Button
          style={categoryButtonStyling}
          onClick={toggleRefinementList}
        >
          Category
          {isRefinementListExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "auto" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "auto" }} />
          )}
        </Button>

        {isRefinementListExpanded && (
          <>
            <RefinementList attribute="categories"/>
            <CustomClearRefinements/>
          </>
        )}
      </div>
    );
  };

  //Component to filter all apps base on Action label
  const FilterByActionLabel = () => {
    const [isActionLabelExpanded, setIsActionLabelExpanded] = useState(false);
    useState(false);

    const toogleActionLabel = () => {
      setIsActionLabelExpanded((prevState) => !prevState);
    };

    const actionLabelButtonStyling = {
      cursor: "pointer",
      color: "white",
      border: "none",
      backgroundColor: "transparent",
      fontSize: 16,
      display: "flex",
      flexDirection: "row",
      width: "100%",
      height: 30,
      textTransform:'none',
      fontWeight: 400
    }
    

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: 20,
          width: "100%",
        }}
      >
        <Button
          style={actionLabelButtonStyling}
          onClick={toogleActionLabel}
        >
          Labels
          {isActionLabelExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "auto" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "auto" }} />
          )}
        </Button>

        {isActionLabelExpanded && (
          <>
            <RefinementList attribute="action_labels" />
            <CustomClearRefinements/>
          </>
        )}
      </div>
    );
  };

  //component to filter all apps base on the created with like 'App Editor' or 'Python'
  const FilterByCreatedWith = () => {
    const [isCreatedWithExpanded, setIsCreatedWithExpanded] = useState(false);

    const toogleCreatedWith = () => {
      setIsCreatedWithExpanded((prevState) => !prevState);
    };

    const transformRefinementListItems = items =>
    items.map(item => ({
      ...item,
      label: item.label === 'true' ? 'App Editor' : 'Python',
    }));

    const createdWithButtonStyling = {
      cursor: "pointer",
      color: "white",
      border: "none",
      backgroundColor: "transparent",
      fontSize: 16,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      height: 30,
      textTransform: 'none',
      fontWeight: 400
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: 20,
          width: "100%",
        }}
      >
        <Button
          style={createdWithButtonStyling}
          onClick={toogleCreatedWith}
        >
          Created With
          {isCreatedWithExpanded ? <ExpandLessIcon style={{marginLeft: "auto"}} /> : <ExpandMoreIcon style={{marginLeft:'auto'}}/>}
        </Button>

        {isCreatedWithExpanded && (
          <>
            <RefinementList attribute="generated" transformItems={transformRefinementListItems} />
            <CustomClearRefinements />
          </>
        )}
      </div>
    );
  };

  const FilterCreatedBy = () => {
    const [isCreatedByExpanded, setIscreatedByExpanded] = useState(false);
    useState(false);

    const toogleCreatedBy = () => {
      setIscreatedByExpanded((prevState) => !prevState);
    };

    const createdByButtonStyling = {
      cursor: "pointer",
      color: "white",
      border: "none",
      backgroundColor: "transparent",
      fontSize:16,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      whiteSpace: "nowrap",
      width: "100%",
      height: 30,
      textTransform: 'none',
      opacity: '0.5'
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: 20,
          width: "100%",
        }}
      >
        <Button
          style={createdByButtonStyling}
          onClick={toogleCreatedBy}
          disabled={true}
        >
          Created By
          {isCreatedByExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "auto" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "auto" }} />
          )}
        </Button>

        {isCreatedByExpanded && (
          <>
          {/* <InstantSearch searchClient={searchClient} indexName="creators"> */}
            <RefinementList attribute="creator"/>
          {/* </InstantSearch> */}
            <button
              style={{
                cursor: "pointer",
                color: "rgb(248, 103, 67)",
                border: "none",
                backgroundColor: "transparent",
                fontSize: 16,
              }}
            >
              Clear All
            </button>
          </>
        )}
      </div>
    );
  };

  const FilterApps = () => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 200,
          alignItems: "flex-start",
          marginRight: 16,
        }}
      >
        <Typography variant="h5" style={{marginBottom: 30, marginTop: 30, fontWeight:"400", fontSize: 24, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",}}>
         Filter By
        </Typography>
        <FilterAllAppsByCategory />
        <FilterByActionLabel />
        <FilterByCreatedWith />
        <FilterCreatedBy />
      </div>
    );
  };

//Kepping Different view (List View, two and three column view), hide tags and hide category components commented so if in future we need it than we can used it from here.

// Component for filtering options including hiding tags, categories, and changing the view of the apps.

// const AppsFilterAndViewBar = ({
//   hideTagChecked,
//   handleChecked,
//   isHideCategoryTagChecked,
//   handleCategoryChecked,
//   handleMouseEnter,
//   handleMouseLeave,
//   handleCurrentView,
//   hoverStates,
// }) => {
//   const buttonStyles = [
//       {
//           cursor: "pointer",
//           border: "none",
//           backgroundColor: "transparent",
//           color: "white",
//           borderRadius: 5,
//           ...(hoverStates[0] && {
//               backgroundColor: "#2f2f2f",
//               color: "#ff8444",
//           }),
//       },
//       {
//           cursor: "pointer",
//           border: "none",
//           backgroundColor: "transparent",
//           borderRadius: 5,
//           color: "white",
//           ...(hoverStates[1] && {
//               backgroundColor: "#2f2f2f",
//               color: "#ff8444",
//           }),
//       },
//       {
//           cursor: "pointer",
//           border: "none",
//           backgroundColor: "transparent",
//           borderRadius: 5,
//           color: "white",
//           ...(hoverStates[2] && {
//               backgroundColor: "#2f2f2f",
//               color: "#ff8444",
//           }),
//       },
//   ];

//   return (
//       <div style={{ display: "flex", flexDirection: "row", marginTop: 10 }}>
//           <div style={{ display: "flex", flexDirection: "row", margin: "5px 0 0 30px", gap: 20 }}>
//               <div style={{ display: "flex", flexDirection: "row" }}>
//                   <input
//                       type="checkbox"
//                       className="ais-RefinementList-checkbox"
//                       checked={hideTagChecked}
//                       onChange={handleChecked}
//                   />
//                   <span className="ais-RefinementList-labelText">Hide Tags</span>
//               </div>
//               <div style={{ display: "flex", flexDirection: "row", marginLeft: 10 }}>
//                   <input
//                       type="checkbox"
//                       className="ais-RefinementList-checkbox"
//                       checked={isHideCategoryTagChecked}
//                       onChange={handleCategoryChecked}
//                   />
//                   <span className="ais-RefinementList-labelText">Hide Category</span>
//               </div>
//           </div>
//           <div style={{ display: "flex", flexDirection: "row", marginLeft: "auto", marginRight: 20, gap: 10 }}>
//               <span style={{marginTop: 2}}>View: </span>
//               {["list", "split", "splits"].map((view, index) => (
//                   <Button
//                       key={index}
//                       style={buttonStyles[index]}
//                       onMouseOver={() => handleMouseEnter(index)}
//                       onMouseLeave={() => handleMouseLeave(index)}
//                       onClick={() => handleCurrentView(view)}
//                   >
//                       {view === "list" ? <GrList style={{ width: 20, height: 20 }} /> : null}
//                       {view === "split" ? <GrSplit style={{ width: 20, height: 20 }} /> : null}
//                       {view === "splits" ? <GrSplits style={{ width: 20, height: 20 }} /> : null}
//                   </Button>
//               ))}
//           </div>
//       </div>
//   );
// };

  const boxStyle = {
    color: "white",
    flex: "1",
    marginLeft: isHeader ? null : 10,
    marginRight: isHeader ? null : 10,
    paddingLeft: isHeader ? null : 30,
    paddingRight: isHeader ? null : 30,
    paddingBottom: isHeader ? null : 30,
    display: "flex",
    flexDirection: "column",
    overflowX: "visible",
    backgroundColor: "rgba(33, 33, 33, 1)",
    borderRadius: 16,
    marginTop: 24,
    width: 741,
    height: 741,
  };


//Component to display all apps.
  const AllApps = () => {
    // States for dispaying different views for all apps

    // const [hoverStates, setHoverStates] = useState([false, false, false]);

    // const [hideTagChecked, setHideTagChecked] = useState(false);

    // const handleChecked = (event) => {
    //   setHideTagChecked(event.target.checked);
    // };

    // const [isHideCategoryTagChecked, setIsHideCategoryChecked] =
    //   useState(false);

    // const handleCategoryChecked = (event) => {
    //   setIsHideCategoryChecked(event.target.checked);
    // };

    // const handleMouseEnter = (index) => {
    //   const updatedHoverStates = [...hoverStates];
    //   updatedHoverStates[index] = true;
    //   setHoverStates(updatedHoverStates);
    // };

    // const handleMouseLeave = (index) => {
    //   const updatedHoverStates = [...hoverStates];
    //   updatedHoverStates[index] = false;
    //   setHoverStates(updatedHoverStates);
    // };

    // const [currentView, setCurrentView] = useState("split");

    // const handleCurrentView = (view) => {
    //   setCurrentView(view);
    // };

    return (
      <div
        style={{
          width: "100%",
          position: "relative",
          height: "100%",
        }}
      >
        {/* <AppsFilterAndViewBar hoverStates={hoverStates} setHoverStates={setHoverStates} isHideCategoryTagChecked={isHideCategoryTagChecked} setIsHideCategoryChecked={setIsHideCategoryChecked} handleCategoryChecked={handleCategoryChecked} hideTagChecked={hideTagChecked} setHideTagChecked={setHideTagChecked} handleChecked={handleChecked} handleCurrentView={handleCurrentView} handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave}/> */}
        <CustomSearchBox />
        <CustomHits
          // isHideCategoryTagChecked={isHideCategoryTagChecked}
          // isHideTagChecked={hideTagChecked}
          // currentView={currentView}
          hitsPerPage={5}
        />
      </div>
    );
  };

  //Search box for the orgs and users apps
  const SearchBoxForOrgsAndUsersApp = ({searchQuery, setSearchQuery})=>{

    return(
      <form noValidate action="" role="search">
        <TextField
          value={searchQuery}
          fullWidth
          style={{
            backgroundColor: theme.palette.inputColor,
            marginTop: 20,
            marginLeft: 10,
            marginRight: 12,
            width: 693,
            borderRadius: 8,
            fontSize: 16,
          }}
          InputProps={{
            style: {
              color: "white",
              fontSize: "1em",
              height: 50,
              width: 693,
              borderRadius: 8,
            },
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ marginLeft: 5 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchQuery.length > 0 && (
                  <ClearIcon
                    style={{
                      color: "white",
                      cursor: "pointer",
                      marginRight: 10
                    }}
                    onClick={() => setSearchQuery('')}
                  />
                )}
                <button
                  type="button"
                  // onClick={handleSearch}
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgb(248, 106, 62), rgb(243, 64, 121))",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    width: 100,
                    height: 35,
                    borderRadius: 17.5,
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
              </InputAdornment>
            ),
          }}
          autoComplete="off"
          color="primary"
          placeholder="Find Apps"
          id="shuffle_search_field"
          onChange={(event) => {
            setSearchQuery(event.currentTarget.value);
          }}
          limit={5}
        />
        {/*isSearchStalled ? 'My search is stalled' : ''*/}
      </form>
    )
  }

  

  const [selectedCategoryForUsersAndOgsApps, setselectedCategoryForUsersAndOgsApps] = useState([]);
  const [selectedTagsForUsersAndOrgsApps, setSelectedTagsForUsersAndOrgsApps] = useState([]);
  const [isCategoreListExpanded, setIsCategoryListExpanded] = useState(true);

  const [userAndOrgsApp, setUserAndOrgsApp] = useState([]);

  useEffect(() => {
    if (currTab === 2) {
        const baseUrl = globalUrl;
        const userAppsUrl = `${baseUrl}/api/v1/users/apps`;
        fetch(userAppsUrl, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then((response) => response.json())
            .then((data) => {
              setUserAndOrgsApp(data);
            })
            .catch((err) => {
                console.error("Error fetching user apps:", err);
            });
    } else if (currTab === 1) {
        const baseUrl = globalUrl;
        const appsUrl = `${baseUrl}/api/v1/apps`;
        fetch(appsUrl, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then((response) => response.json())
            .then((data) => {
              setUserAndOrgsApp(data);
            })
            .catch((err) => {
                console.error("Error fetching apps:", err);
            });
    }
}, [currTab]);
  
  const toogleCategoryList = () => {
    setIsCategoryListExpanded((prevState) => !prevState);
  };

  //Component to display category List for User and Orgs app
  const FilterUsersAndOrgsAppByCategory = () => {

    //Display top 9 category from the database

    const findTopCategories = () => {
        const categoryCountMap = {};

        // Check if userAndOrgsApp is an array before iterating over it and Find top 10 Category from the apps
      if (Array.isArray(userAndOrgsApp)) {
        userAndOrgsApp.forEach((app) => {
            const categories = app.categories;

            if (categories && categories.length > 0) {
                categories.forEach((category) => {
                    categoryCountMap[category] = (categoryCountMap[category] || 0) + 1;
                });
            }
        });

        const categoryArray = Object.keys(categoryCountMap).map((category) => ({
            category,
            count: categoryCountMap[category],
        }));

        categoryArray.sort((a, b) => b.count - a.count);

        const topCategories = categoryArray.slice(0, 9);

        return topCategories;
      }
    };

    const topCategories = findTopCategories();
  
    const handleCheckboxChange = (category) => {
      if (selectedCategoryForUsersAndOgsApps.includes(category)) {
        setselectedCategoryForUsersAndOgsApps(selectedCategoryForUsersAndOgsApps.filter((item) => item !== category));
      } else {
        setselectedCategoryForUsersAndOgsApps([...selectedCategoryForUsersAndOgsApps, category]);
      }
    };
    
    const handleClearFilter = () => {
      setselectedCategoryForUsersAndOgsApps([]);
    };
  
    const categorysButtonStyling = {
      cursor: "pointer",
      color: "white",
      border: "none",
      backgroundColor: "transparent",
      fontSize: 16,
      display: "flex",
      width: "100%",
      height: 30,
      flexDirection: "row",
      textTransform: 'none',
      fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)"
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <Button
          style={categorysButtonStyling}
          onClick={toogleCategoryList}
        >
          Category
          {isCategoreListExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "auto" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "auto" }} />
          )}
        </Button>
        {isCategoreListExpanded && topCategories && topCategories.length > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', marginTop: 18}}>
                {topCategories.map((data, index) => (
                    <button
                    className="ais-RefinementList-labelText"
                    key={data.category}
                    style={{
                      marginBottom: 5,
                      border: "none",
                      background: "none",
                      padding: 0,
                      color: "#F1F1F1",
                      textTransform: 'none'
                    }}
                    onClick={() => handleCheckboxChange(data.category)}
                  >
                    <input
                      id={`checkbox-${data.category}`}
                      type="checkbox"
                      className="ais-RefinementList-checkbox"
                      checked={selectedCategoryForUsersAndOgsApps.includes(data.category)}
                      onChange={() => handleCheckboxChange(data.category)}
                      style={{ marginRight: 5 }}
                    />
                    <span className="ais-RefinementList-labelText" style={{marginTop:3, marginLeft: 3, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}>{data.category}</span>
                  </button>
                  
                ))}

                <Button
                    style={{
                      marginTop: 11,
                      fontSize: 16,
                      textAlign:'left',
                      textDecoration: 'underline',
                      textTransform: 'none',
                      height: 30,
                      justifyContent:'left',
                      backgroundColor: 'transparent',
                    }}
                    onClick={handleClearFilter}
                >
                    Clear All
                </Button>
        </div>
        )}
      </div>
    );
};

  const [isActionLabelExpanded, setIsActionLabelExpanded] = useState(false);
    const toogleActionLabel = () => {
      setIsActionLabelExpanded((prevState) => !prevState);
    };

  const FilterUsersAndOrgsAppByActionLabel = () => {

    const findTopTags = () => {
      const tagCountMap = {};
    
      // Check if userAndOrgsApp is an array before iterating over it and Find top 10 tags from the apps
      if (Array.isArray(userAndOrgsApp)) {
          userAndOrgsApp.forEach((app) => {
              const tags = app.tags;
    
              if (tags && tags.length > 0) {
                  tags.forEach((tag) => {
                      tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
                  });
              }
          });
      }
  
      const tagArray = Object.keys(tagCountMap).map((tag) => ({
          tag,
          count: tagCountMap[tag],
      }));
    
      tagArray.sort((a, b) => b.count - a.count);
    
      const topTags = tagArray.slice(0, 9);
    
      return topTags;
  };
  
  const topTags = findTopTags();
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const handleCheckboxChange = (index) => {
      const category = topTags[index].tag;
      const updatedCheckboxStates = [...selectedTagsForUsersAndOrgsApps];
      
      if (updatedCheckboxStates.includes(category)) {
          setSelectedTagsForUsersAndOrgsApps(updatedCheckboxStates.filter((item) => item !== category));
      } else {
          setSelectedTagsForUsersAndOrgsApps([...updatedCheckboxStates, category]);
      }
  };
      
      const handleClearFilter = () => {
        setSelectedTagsForUsersAndOrgsApps([]);
      };
    
      const actionLabelButtonStyling = {
        cursor: "pointer",
        color: "white",
        border: "none",
        backgroundColor: "transparent",
        fontSize: 16,
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: 30,
        textTransform:'none',
        marginBottom: isActionLabelExpanded && 16,
        fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)"
      }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: 20,
          width: "100%",
        }}
      >
        <Button
          style={actionLabelButtonStyling}
          onClick={toogleActionLabel}
        >
          Labels
          {isActionLabelExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "auto" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "auto" }} />
          )}
        </Button>

        {isActionLabelExpanded && topTags && topTags.length > 0 && (
            <>
                {topTags.map((data, index) => (
                      <Button
                      style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        cursor: "pointer",
                        marginBottom: 5,
                        border: "none",
                        background: "none",
                        padding: 0,
                        color: "#F1F1F1",
                        textTransform: 'none'
                      }}
                      key={index}
                      onClick={() => handleCheckboxChange(index)}
                    >
                      <input
                        id={`checkbox-${index}`}
                        type="checkbox"
                        className="ais-RefinementList-checkbox"
                        checked={selectedTagsForUsersAndOrgsApps.includes(data.tag)}
                        onChange={() => handleCheckboxChange(index)}
                        style={{ marginRight: 5 }}
                      />
                      <span style={{ fontSize: 16, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}>{data.tag}</span>
                    </Button>
                    
                  ))}

                  <Button
                    style={{
                        marginTop: 11,
                        fontSize: 16,
                        textAlign:'left',
                        textDecoration: 'underline',
                        textTransform: 'none',
                        height: 30,
                        justifyContent:'left',
                        backgroundColor: 'transparent'
                    }}
                    onClick={handleClearFilter}
                >
                    Clear All
                </Button>
            </>
        )}
      </div>
    );
  };

  const [selectedOptionOfCreatedWith, setSelectedOptionOfCreatedWith] = useState([]);
  const [isCreatedWithExpanded, setIsCreatedWithExpanded] = useState(false);

  const toogleCreatedWith = () => {
    setIsCreatedWithExpanded((prevState) => !prevState);
  };
  const FilterUsersAndOrgsAppByCreatedWith = () => {

    const AppCreatedWithOptions = ['App Editor', 'Python']

    const handleCheckboxChange = (index) => {
      const category = AppCreatedWithOptions[index];
      const updatedCheckboxStates = [...selectedOptionOfCreatedWith];
      if (updatedCheckboxStates.includes(category)) {
          setSelectedOptionOfCreatedWith(updatedCheckboxStates.filter((item) => item !== category));
      } else {
        setSelectedOptionOfCreatedWith([...updatedCheckboxStates, category]);
      }
  };
  
    
  const handleClearFilter = () => {
    setSelectedOptionOfCreatedWith([]);
  };

  const createdWithButtonStyling = {
    cursor: "pointer",
    color: "white",
    border: "none",
    backgroundColor: "transparent",
    fontSize: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 30,
    textTransform:'none',
    marginBottom: isCreatedWithExpanded && 16,
    fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)"
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: 20,
        width: "100%",
        fontWeight: 400
      }}
    >
      <Button
        style={createdWithButtonStyling}
        onClick={toogleCreatedWith}
      >
        Created With
        {isCreatedWithExpanded ? <ExpandLessIcon style={{marginLeft: "auto"}} /> : <ExpandMoreIcon style={{marginLeft:'auto'}}/>}
      </Button>

      {isCreatedWithExpanded && (
        <>
                {AppCreatedWithOptions.map((data, index) => (
                     <Button
                     style={{
                       display: "inline-flex",
                       flexDirection: "row",
                       alignItems: "center",
                       cursor: "pointer",
                       marginBottom: 5,
                       border: "none",
                       background: "none",
                       padding: 0,
                       color: "#F1F1F1",
                       textTransform: 'none'
                     }}
                     key={index}
                     onClick={() => handleCheckboxChange(index)}
                   >
                     <input
                       id={`checkbox-${index}`}
                       type="checkbox"
                       className="ais-RefinementList-checkbox"
                       checked={selectedOptionOfCreatedWith.includes(data)}
                       onChange={() => handleCheckboxChange(index)}
                       style={{ marginRight: 5 }}
                     />
                     <span style={{ fontSize: 16, marginLeft: 5, fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}>{data}</span>
                   </Button>                   
                  
                ))}

                <Button
                  style={{
                    marginTop: 11,
                    fontSize: 16,
                    textAlign:'left',
                    textDecoration: 'underline',
                    textTransform: 'none',
                    height: 30,
                    justifyContent:'left',
                    backgroundColor: 'transparent'
                  }}
                  onClick={handleClearFilter}
                >
                  Clear All
              </Button>
          </>
      )}
    </div>
  );
};

  const FilterUsersAndOrgsAppCreatedBy = () => {
    
    const [isCreatedByExpanded, setIscreatedByExpanded] = useState(false);
    useState(false);

    const toogleCreatedBy = () => {
      setIscreatedByExpanded((prevState) => !prevState);
    };
    const [isButtonDisable, setIsButtonDisable] = useState(true)

    const createdByButtonStyling = {
      cursor: "pointer",
      color: "white",
      border: "none",
      backgroundColor: isButtonDisable? '#3c3c3c. ': "transparent",
      fontSize:16,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      whiteSpace: "nowrap",
      width: "100%",
      height: 30,
      textTransform: 'none',
      opacity: '0.5'
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: 20,
          width: "100%",
        }}
      >
        <Button
          style={createdByButtonStyling}
          onClick={toogleCreatedBy}
          disabled={true}
        >
          Created By
          {isCreatedByExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "auto" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "auto" }} />
          )}
        </Button>

        {isCreatedByExpanded && (
          <>
            <RefinementList attribute="creator"/>
              <Button
                style={{
                  marginTop: 11,
                  textAlign:'left',
                  textDecoration: 'underline',
                  textTransform: 'none',
                  height: 30,
                  justifyContent:'left',
                  backgroundColor: 'transparent'
                }}
                // onClick={handleClearFilter}
              >
                    Clear All
                </Button>
          </>
        )}
      </div>
    );
  };

  const FilterUsersAndOrgsApps = ()=>{
  
    return(
          <div
          style={{
            width: 200,
            marginRight: 16
          }}
          >
          {isLoggedIn === true && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            width: 200,
            alignItems: "flex-start",
            marginRight: 16,}}>
            <Typography variant="h5" style={{marginBottom: 30, marginTop: 30, fontWeight:"400", fontSize: 24}}>
           Filter By
          </Typography>
          <FilterUsersAndOrgsAppByCategory />
          <FilterUsersAndOrgsAppByActionLabel />
          <FilterUsersAndOrgsAppByCreatedWith />
          <FilterUsersAndOrgsAppCreatedBy  />
          </div>
          )} 
        </div>
    )
  }

  //When tab change between org. and user tab clear all selected filter
    useEffect(()=>{
      if(currTab){
        setselectedCategoryForUsersAndOgsApps([]);
        setSelectedTagsForUsersAndOrgsApps([]);
        setSelectedOptionOfCreatedWith([]);
        setIsCategoryListExpanded(true);
        setIsActionLabelExpanded(false);
        setIsCreatedWithExpanded(false);
      }
    },[currTab, userdata.success])

  //Component to fetch all apps created by user and Org
  const UsersAndOrgsApps = () => {

    const [searchQuery, setSearchQuery] = useState("");
    const [userAndOrgAppData, setUserAndOrgAppData] = useState([])

      useEffect(()=>{
        if(currTab===2 && isLoggedIn != undefined && isLoggedIn != null && isLoggedIn === true){
          const baseUrl = globalUrl;
          const URL = `${baseUrl}/api/v1/users/apps`;
          fetch(URL, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            setUserAndOrgAppData(data)
          })
          .catch((err) => {
            console.error("Error fetching user apps:", err);
          });
        }
        else if(currTab === 1 && isLoggedIn != undefined && isLoggedIn != null && isLoggedIn === true){
                const baseUrl = globalUrl;
                  const URL = `${baseUrl}/api/v1/apps`;
                  fetch(URL, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  })
                  .then((response) => {
                    return response.json();
                  })
                  .then((data) => {
                    setUserAndOrgAppData(data)
                  })
                  .catch((err) => {
                    console.error("Error fetching user apps:", err);
                  });
        }
      }, [currTab,])

      //Search app base on app name, category and tag
      const filteredUserAppdata = Array.isArray(userAndOrgAppData) ? userAndOrgAppData.filter((app) => {
        const matchesSearchQuery = (
            searchQuery === "" ||
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.tags && app.tags.some(tag =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            )) || 
            (app.categories && app.categories.some((category)=>
              category.toLowerCase().includes(searchQuery.toLowerCase())
          ))
        );
    
        const matchesSelectedCategories = (
            selectedCategoryForUsersAndOgsApps.length === 0 ||
            (app.categories && app.categories.some(category =>
                selectedCategoryForUsersAndOgsApps.includes(category)
            ))
        );
        const matchesSelectedTags = (
            selectedTagsForUsersAndOrgsApps.length === 0 ||
            (app.tags && selectedTagsForUsersAndOrgsApps.some(tag =>
                app.tags.includes(tag)
            ))
        );
    
        const matchesSelectedOption = (
            selectedOptionOfCreatedWith.length === 0 ||
            selectedOptionOfCreatedWith.includes('App Editor') && app.generated === true ||
            selectedOptionOfCreatedWith.includes('Python') && app.generated === false
        );
    
        return matchesSearchQuery && matchesSelectedCategories && matchesSelectedTags && matchesSelectedOption;
    }) : [];
    
      
  
	  // const [hoverStates, setHoverStates] = useState([false, false, false]);

    // const [hideTagChecked, setHideTagChecked] = useState(false);

    // const handleChecked = (event) => {
    //   setHideTagChecked(event.target.checked);
    // };

    // const [isHideCategoryTagChecked, setIsHideCategoryChecked] = useState(false);

    // const handleCategoryChecked = (event) => {
    //   setIsHideCategoryChecked(event.target.checked);
    // };

	  // const handleMouseEnter = (index) => {
		// const updatedHoverStates = [...hoverStates];
		// updatedHoverStates[index] = true;
		// setHoverStates(updatedHoverStates);
	  // };
  
	  // const handleMouseLeave = (index) => {
		// const updatedHoverStates = [...hoverStates];
		// updatedHoverStates[index] = false;
		// setHoverStates(updatedHoverStates);
	  // };
  
	  const [currentView, setCurrentView] = useState("split");
  
	  // const handleCurrentView = (view) => {
		// setCurrentView(view);
	  // };

	  const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
	  var counted = 0;
  
	  const memoizedHits = useMemo(() => {
		return filteredUserAppdata.map((data, index) => {
		  // let workflowDelay = 0;
		  // const isHeader = true;
		  const isMouseOverOnCloudIcon = false;
		  const isCloud = true;
		  const xs = 12;
		  const rowHandler = 12;
		  const searchClient = {};
		  const userdata = {};

		  const paperStyle = {
			backgroundColor: "#1A1A1A",
			color: "rgba(241, 241, 241, 1)",
			padding: isHeader ? null : 15,
			cursor: "pointer",
			position: "relative",
			width: currentView === "split" ? 339 : 221,
			height: 96,
			borderRadius: 8,
		  };
  
		  var parsedname = "";
		  for (var key = 0; key < data.name.length; key++) {
			var character = data.name.charAt(key);
			if (character === character.toUpperCase()) {
			  if (
				data.name.charAt(key + 1) !== undefined &&
				data.name.charAt(key + 1) ===
				  data.name.charAt(key + 1).toUpperCase()
			  ) {
			  } else {
				parsedname += " ";
			  }
			}
			parsedname += character;
		  }
  
		  parsedname = (
			parsedname.charAt(0).toUpperCase() + parsedname.substring(1)
		  ).replaceAll("_", " ");

    const normalizedString = (name) => {
      if (typeof name === 'string') {
        return name.replace(/_/g, ' ');
      } else {
        return name;
      }
    };

    const appUrl =
    isCloud === false
      ? `/apps/${data.name}`
      : `https://shuffler.io/apps/${data.name}`;
		
		  return (
			<Zoom
			  key={index}
			  in={true}
			  style={{
				transitionDelay: `${workflowDelay}ms`,
			  }}
			>
			  <Grid rowSpacing={1} item xs={xs} key={index}>
				<a
				  href={appUrl}
				  rel="noopener noreferrer"
				  style={{
					textDecoration: "none",
					color: "#f85a3e",
				  }}
				>
				  <Paper
					elevation={0}
					style={paperStyle}
					onMouseOver={() => {
					  setMouseHoverIndex(index);
					}}
					onMouseOut={() => {
					  setMouseHoverIndex(-1);
					}}
				  >
					<ButtonBase
					  style={{
						borderRadius: 3,
						fontSize: 16,
						overflow: "hidden",
						display: "flex",
						alignItems: "flex-start",
            width:'100%'
					  }}
					>
					  <img
						alt={data.name}
						src={data.small_image || data.large_image ? (data.small_image || data.large_image) : noImage}
						style={{
						  width: 80,
              height:80,
              borderRadius: 8,
              margin: 8
						}}
					  />
					  <div
						style={{
						  display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: 339,
              gap: 8,
              fontWeight: '400',
              overflow: "hidden",
              margin: "12px 0 12px 0",
              fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
						}}
					  >
						<div
						  style={{
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
              marginLeft: 8,
						  }}
						>
						  {normalizedString(data.name)}
						</div>
						{/* {!isHideCategoryTagChecked && ( */}
						  <div
							style={{
							  overflow: "hidden",
							  textOverflow: "ellipsis",
							  whiteSpace: "nowrap",
                marginLeft: 8,
                color: "rgba(158, 158, 158, 1)"
							}}
						  >
							{data.categories !== null
							  ? normalizedString(data.categories).join(", ")
							  : "NA"}
						  </div>
						{/* )} */}
						{/* {!hideTagChecked && ( */}
						  <div
							style={{
							  overflow: "hidden",
							  textOverflow: "ellipsis",
							  whiteSpace: "nowrap",
							  width: 230,
                textAlign: 'start',
                marginLeft: 8,
                color: "rgba(158, 158, 158, 1)"
							}}
						  >
							{data.tags &&
							  data.tags.map((tag, tagIndex) => (
								<span key={tagIndex}>
								  {normalizedString(tag)}
								  {tagIndex < data.tags.length - 1 ? ", " : ""}
								</span>
							  ))}
						  </div>
						{/* )} */}
					  </div>
					</ButtonBase>
				  </Paper>
				</a>
			  </Grid>
			</Zoom>
		  );
		});
	  }, [filteredUserAppdata]);

	
    return (
        <div>
          {userdata.success ? (
            <div
            style={{
              maxWidth: 741,
              maxHeight: 570,
            }}
          >
          {/* <AppsFilterAndViewBar hoverStates={hoverStates} setHoverStates={setHoverStates} isHideCategoryTagChecked={isHideCategoryTagChecked} setIsHideCategoryChecked={setIsHideCategoryChecked} handleCategoryChecked={handleCategoryChecked} handleChecked={handleChecked} handleCurrentView={handleCurrentView} handleMouseEnter={handleMouseEnter} handleMouseLeave={handleMouseLeave}/> */}
          <SearchBoxForOrgsAndUsersApp searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
        <Grid>
            {/* {(currentView === "split") | (currentView === "splits") ? (
              <div
                style={{
                  gap: "10px",
                  marginTop: "16px",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  marginLeft: '15px',
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#494949 #2f2f2f",
                  maxHeight: '570px'
                }}
              >
                {memoizedHits}
              </div>
            ) : (
              <ListView
                isHideCategoryTagChecked={isHideCategoryTagChecked}
                isHideTagChecked={hideTagChecked}
                hits={filteredUserAppdata}
                userAppdata = {filteredUserAppdata}
              />
            )} */}
            <div
                style={{
                  gap: 16,
                  marginTop: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  marginLeft: 24,
                  overflowY: "auto",
                  overflowX: "hidden",
                  maxHeight:  570,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#494949 #2f2f2f",
                  maxHeight: 570,
                }}
              >
                {memoizedHits}
              </div>
          </Grid>
          </div>
          ): (
            <div>
                <Typography variant="body" style={{position: "relative", top: 40}}>Please <a href="/login" rel="noopener noreferrer" style={{color: "rgba(255, 132, 68, 1)", textDecoration: "underline"}}>login</a> first to your account to view {`${currTab === 1 ? "Organizations": "Users"}`} Apps.<br/> 
                  or <a href="/register" rel="noopener noreferrer" style={{color: "rgba(255, 132, 68, 1)", textDecoration: "underline"}}>signup</a> to create a new account.</Typography>
            </div>
          )}
        </div>
    );
  };


  const AppTab = () => {

    return (
      <div style={{ display: "flex", justifyContent: "center"}}>
        <div style={boxStyle}>
          <Tabs
            style={{ marginTop: 15, display: "flex", width: "100%", borderBottom: '1px solid rgba(73, 73, 73, 1)', height: 44 }}
            value={currTab}
            onChange={handleTabChange}
            scrollButtons="off"
          >
            <Tab
              label="All Apps"
              sx={{
                color: currTab === 0 ? "#F86743" : "inherit",
                height: 44,
                fontSize: 16,
                textTransform: 'none',
                flex: 1,
                fontWeight: 400,
                paddingBottom: 3,
                marginLeft: 3,
                fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
              }}
            ></Tab>
            <Tab
              label="Organization Apps"
              sx={{
                color: currTab === 1 ? "#F86743" : "inherit",
                border: 'none',
                height: 44,
                fontSize: 16,
                flex: 1,
                textTransform: 'none',
                fontWeight: 400,
                paddingBottom: 3,
                fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
              }}
            ></Tab>
            <Tab
              label="My Apps"
              sx={{
                color: currTab === 2 ? "#F86743" : "inherit",
                height: 44,
                fontSize: 16,
                textTransform: 'none',
                flex: 1,
                fontWeight: 400,
                paddingBottom: 3,
                marginRight: 3,
                fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)",
              }}
            ></Tab>
          </Tabs>

          {currTab === 0 ? (
            <AllApps/>
          ) : currTab === 1 ? (
            <UsersAndOrgsApps  />
          ) : currTab === 2 ? (
            <UsersAndOrgsApps/>
          ) : null}
        </div>
      </div>
    );
  };

  const CustomSearchBox = connectSearchBox(SearchBox);
  const CustomHits = connectHits(Hits);
    return (
    <div
      style={{
        width: "100%",
        textAlign: "center",
        position: "relative",
        display: "flex",
      }}
    >
      {/*
			<div style={{padding: 10, }}>
				<Button 
					style={selectButtonStyle}
					variant="outlined"
					onClick={() => {
    				const searchField = document.createElement("shuffle_search_field")
						console.log("Field: ", searchField)
						if (searchField !== null & searchField !== undefined) {
							console.log("Set field.")
							searchField.value = "WHAT WABALABA"
							searchField.setAttribute("value", "WHAT WABALABA")
						}
					}}
				>
					Cases
				</Button>
			</div>
			*/}
      <div
        style={{
          height: "100%",
          width:"100%",
        }}
      >
        <InstantSearch searchClient={searchClient} indexName="appsearch">
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingRight: 215 }}>
          {currTab === 0 ? <FilterApps/> : <FilterUsersAndOrgsApps/>}
            <AppTab />
          </div>
          {/* <CustomHits hitsPerPage={5} /> */}
          <Configure clickAnalytics />
        </InstantSearch>
        {showSuggestion === true ? (
          <div
            style={{
              paddingTop: 0,
              maxWidth: isMobile ? "100%" : "60%",
              margin: "auto",
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
                InputProps={{
                  style: {
                    color: "#ffffff",
                  },
                }}
                color="primary"
                fullWidth={true}
                placeholder="Email (optional)"
                type="email"
                id="email-handler"
                autoComplete="email"
                margin="normal"
                variant="outlined"
                onChange={(e) => setFormMail(e.target.value)}
              />
              <TextField
                required
                style={{ flex: "1", backgroundColor: theme.palette.inputColor }}
                InputProps={{
                  style: {
                    color: "#ffffff",
                  },
                }}
                color="primary"
                fullWidth={true}
                placeholder="What apps do you want to see?"
                type=""
                id="standard-required"
                margin="normal"
                variant="outlined"
                autoComplete="off"
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button
              variant="contained"
              color="primary"
              style={buttonStyle}
              disabled={message.length === 0}
              onClick={() => {
                submitContact(formMail, message);
              }}
            >
              Submit
            </Button>
            <Typography style={{ color: "white" }} variant="body2">
              {formMessage}
            </Typography>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AppGrid;