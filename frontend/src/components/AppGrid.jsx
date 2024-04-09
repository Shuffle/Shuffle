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
      refine(searchQuery);
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
          type="search"
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
          backgroundColor: "#1A1A1A",
          color: "rgba(241, 241, 241, 1)",
          padding: isHeader ? null : 15,
          cursor: "pointer",
          position: "relative",
          maxWidth: 339, 
          maxHeight: 96,
          borderRadius: 8,
        };
        

        const cloudIconStyling = {
          position: "absolute",
          top: 1,
          left: 300,
          height: 24,
          width: 24,
          marginTop: 5,
          color: isMouseOverOnCloudIcon ? "white" : "white",
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

        return (
          <Zoom
            key={index}
            in={true}
            style={{
              transitionDelay: `${workflowDelay}ms`,
            }}
          >
            <Grid rowSpacing={1}  item xs={xs} key={index}>
              <a
                href={appUrl}
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
                      src={data.image_url}
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
                        fontWeight: "400",
                        overflow: "hidden",
                        margin: "12px 0 12px 0",
                        alignItems: "flex-start",
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
                        {data.name}
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
                            ? data.categories.join(", ")
                            : "NA"}
                        </div>
                      {/* )} */}
                      {/* {!isHideTagChecked && ( */}
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 250,
                            marginLeft: 8,
                            color: "rgba(158, 158, 158, 1)"
                          }}
                        >
                          {data.tags &&
                            data.tags.map((tag, tagIndex) => (
                              <span key={tagIndex}>
                                {tag}
                                {tagIndex < data.tags.length - 1 ? ", " : ""}
                              </span>
                            ))}
                        </div>
                      {/* )} */}
                    </div>
                    {data.generated ? (
                    <Tooltip
                      title={"Created with App editor"}
                      style={{ marginTop: 28, width: "100%" }}
                      aria-label={data.name}
                    >
                      {data.invalid ? (
                        <CloudQueueIcon style={cloudIconStyling} />
                      ) : (
                        <CloudQueueIcon style={cloudIconStyling} />
                      )}
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={"Created with python (custom app)"}
                      style={{ marginTop: 28, width: "100%" }}
                      aria-label={data.name}
                    >
                      <CodeIcon style={cloudIconStyling} />
                    </Tooltip>
                  )}
                  </ButtonBase>
                </Paper>
              </a>
            </Grid>
          </Zoom>
        );
      });
    }, [hits, currentView, isHideTagChecked, isHideCategoryTagChecked]);

    return (
      <Grid>
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
            <RefinementList attribute="categories" />
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
          marginRight: 16
        }}
      >
        <Typography variant="h5" style={{marginBottom: 30, marginTop: 30, fontWeight:"400", fontSize: 24}}>
         Filter By
        </Typography>
        <FilterAllAppsByCategory />
        <FilterByActionLabel />
        <FilterByCreatedWith />
        <FilterCreatedBy />
      </div>
    );
  };

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

  const [currTab, setCurrTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrTab(newValue);
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
                <button
                  type="button"
                  // onClick={handleSearch}
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgb(248, 106, 62), rgb(243, 64, 121))",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 5,
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
          type="search"
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
  
  const toogleCategoryList = () => {
    setIsCategoryListExpanded((prevState) => !prevState);
  };

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

  //Component to display category List for User and Orgs app
  const FilterUsersAndOrgsAppByCategory = () => {

    //Display top 9 category from the database

    const findTopCategories = () => {
        const categoryCountMap = {};

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
        {isCategoreListExpanded && topCategories.length > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', marginTop: 18}}>
                {topCategories.map((data, index) => (
                    <label
                        htmlFor={`checkbox-${data.category}`}
                        className="ais-RefinementList-labelText"
                        key={data.category}
                        style={{marginBottom: 5}}
                    >
                        <input
                            id={`checkbox-${data.category}`}
                            type="checkbox"
                            className="ais-RefinementList-checkbox"
                            checked={selectedCategoryForUsersAndOgsApps.includes(data.category)}
                            onChange={() => handleCheckboxChange(data.category)} 
                        />
                        <span className="ais-RefinementList-labelText" style={{marginLeft: 5}}>{data.category}</span>
                    </label>
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

          userAndOrgsApp.forEach((app) => {
              const tags = app.tags;

              if (tags && tags.length > 0) {
                  tags.forEach((tag) => {
                      tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
                  });
              }
          });

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

        {isActionLabelExpanded && topTags.length > 0 && (
            <>
                {topTags.map((data, index) => (
                      <label
                          htmlFor={`checkbox-${index}`}
                          style={{
                              display: "inline-flex",
                              flexDirection: "row",
                              cursor: "pointer",
                              marginBottom: 5,
                          }}
                          key={index}
                      >
                          <input
                              id={`checkbox-${index}`}
                              type="checkbox"
                              className="ais-RefinementList-checkbox"
                              checked={selectedTagsForUsersAndOrgsApps.includes(data.tag)}
                              onChange={() => handleCheckboxChange(index)}
                          />
                          <span style={{ fontSize: 16, marginLeft: 5 }}>{data.tag}</span>
                      </label>
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
                      <label
                          htmlFor={`checkbox-${index}`}
                          style={{
                              display: "inline-flex",
                              flexDirection: "row",
                              cursor: "pointer",
                              marginBottom: 5,
                          }}
                          key={index}
                      >
                          <input
                              id={`checkbox-${index}`}
                              type="checkbox"
                              className="ais-RefinementList-checkbox"
                              checked={selectedOptionOfCreatedWith.includes(data)}
                              onChange={() => handleCheckboxChange(index)}
                          />
                          <span style={{ fontSize: 16, marginLeft: 5 }}>{data}</span>
                      </label>
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
          display: "flex",
          flexDirection: "column",
          width: 200,
          alignItems: "flex-start",
          marginRight: 16
        }}
      >
        <Typography variant="h5" style={{marginBottom: 30, marginTop: 30, fontWeight:"400", fontSize: 24}}>
         Filter By
        </Typography>
        <FilterUsersAndOrgsAppByCategory />
        <FilterUsersAndOrgsAppByActionLabel />
        <FilterUsersAndOrgsAppByCreatedWith />
        <FilterUsersAndOrgsAppCreatedBy  />
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
    },[currTab])

  //Component to fetch all apps created by user and Org
  const UsersAndOrgsApps = () => {

    const [searchQuery, setSearchQuery] = useState("");
    const [userAndOrgAppData, setUserAndOrgAppData] = useState([])
    const [appData, setAppData] = useState({
      objectID: "",
      queryId: ""
    })

      useEffect(()=>{

        if(currTab===2){
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
        else if(currTab === 1){
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
      }, [currTab])
      

      //Search app base on app name, category and tag

      const filteredUserAppdata = userAndOrgAppData.filter((app) => {
        const matchesSearchQuery = (
            searchQuery === "" ||
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.tags && app.tags.some(tag =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
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
    });
      
  
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
  
		  const cloudIconStyling = {
        position: "absolute",
        top: 1,
        left: 300,
        height: 24,
        width: 24,
        marginTop: 5,
        color: isMouseOverOnCloudIcon ? "white" : "white",
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

		  // const appUrl =
      //     isCloud === false
      //       ? `/apps/${data.objectID}?queryID=${data.__queryID}`
      //       : `https://shuffler.io/apps/${data.objectID}?queryID=${data.__queryID}`;

      const appUrl = "/apps";
		
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
              alignItems: "flex-start",
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
						  {data.name}
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
							  ? data.categories.join(", ")
							  : "NA"}
						  </div>
						{/* )} */}
						{/* {!hideTagChecked && ( */}
						  <div
							style={{
							  overflow: "hidden",
							  textOverflow: "ellipsis",
							  whiteSpace: "nowrap",
							  maxWidth: currentView === "split" ? 250 :  140,
                marginLeft: 8,
                color: "rgba(158, 158, 158, 1)"
							}}
						  >
							{data.tags &&
							  data.tags.map((tag, tagIndex) => (
								<span key={tagIndex}>
								  {tag}
								  {tagIndex < data.tags.length - 1 ? ", " : ""}
								</span>
							  ))}
						  </div>
						{/* )} */}
					  </div>
					</ButtonBase>
					{data.generated ? (
					  <Tooltip
						title={"Created with App editor"}
						style={{ marginTop: 28, width: "100%" }}
						aria-label={data.name}
					  >
						{data.invalid ? (
						  <CloudQueueIcon style={cloudIconStyling} />
						) : (
						  <CloudQueueIcon style={cloudIconStyling} />
						)}
					  </Tooltip>
					) : (
					  <Tooltip
						title={"Created with python (custom app)"}
						style={{ marginTop: 28, width: "100%" }}
						aria-label={data.name}
					  >
						<CodeIcon style={cloudIconStyling} />
					  </Tooltip>
					)}
				  </Paper>
				</a>
			  </Grid>
			</Zoom>
		  );
		});
	  }, [currTab, currentView, filteredUserAppdata]);

	
    return (
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
                marginLeft: 3
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
                marginRight: 3
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
          <div style={{display: 'flex', flexDirection: 'row', position:'relative', left: 143}}>
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

        <span
          style={{
            position: "absolute",
            display: "flex",
            textAlign: "right",
            float: "right",
            right: 0,
            bottom: isMobile ? "" : 120,
          }}
        >
          <Typography variant="body2" color="textSecondary" style={{}}>
            Search by
          </Typography>
          <a
            rel="noopener noreferrer"
            href="https://www.algolia.com/"
            target="_blank"
            style={{ textDecoration: "none", color: "white" }}
          >
            <img
              src={"/images/logo-algolia-nebula-blue-full.svg"}
              alt="Algolia logo"
              style={{ height: 17, marginLeft: 5, marginTop: 3 }}
            />
          </a>
        </span>
      </div>
    </div>
  );
};

export default AppGrid;