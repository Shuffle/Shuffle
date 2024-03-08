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

import { GrSplit } from "react-icons/gr";
import { GrSplits } from "react-icons/gr";
import { GrList } from "react-icons/gr";

import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  Configure,
  connectSearchBox,
  connectHits,
  connectHitInsights,
  RefinementList,
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
      }
    }
    //}, [])
    const [searchQuery, setSearchQuery] = useState("");

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
            borderRadius: borderRadius,
            margin: 10,
            width: "693px",
            marginTop: "20px",
          }}
          InputProps={{
            style: {
              color: "white",
              fontSize: "1em",
              height: 50,
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
                  onClick={handleSearch}
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgb(248, 106, 62), rgb(243, 64, 121))",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 5,
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
          placeholder="Find Apps..."
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

  const ListView = ({ hits, isHideCategoryTagChecked, isHideTagChecked }) => {
    // isHideCategoryTagChecked = true;
    // isHideTagChecked = true;

    const tableDataStyle = {
      fontSize: "16px",
      borderCollapse: "collapse",
      overflowY: "scroll",
      overflowX: "hidden",
      maxWidth: "720px",
      marginLeft: "auto",
      marginRight: "auto",
    };

    const thStyle = {
      color: "#ffffff",
      fontWeight: "bold",
      padding: "5px",
      textAlign: "center",
      borderBottom: "1px solid #494949",
      backgroundColor: "#212121",
      whiteSpace: "wrap",
      width:
        isHideCategoryTagChecked === true && isHideTagChecked === true
          ? "220px"
          : "140px",
      overflow: "hidden",
      textOverflow: "ellipsis",
    };

    const tdStyle = {
      padding: "5px",
      textAlign: "center",
      borderBottom: "1px solid #494949",
      textOverflow: "ellipsis",
      overflowX: "hidden",
      whiteSpace: "nowrap",
      maxHeight: "60px",
      maxWidth: (() => {
        if (isHideCategoryTagChecked || isHideTagChecked) {
          if (isHideCategoryTagChecked && isHideTagChecked) {
            return "220px";
          } else if (isHideCategoryTagChecked) {
            return "240px";
          } else {
            return "270px";
          }
        } else {
          return "140px";
        }
      })(),
    };

    console.log(isHideCategoryTagChecked);

    const trStyle = {
      height: "40px",
      width: "694px",
    };

    const buttonStyle = {
      backgroundColor: "transparent",
      cursor: "pointer",
      border: "none",
      color: "white",
    };

    const handleAppUrl = (hit) => {
      const appUrl = isCloud
        ? `/apps/${hit.objectID}?queryID=${hit.__queryID}`
        : `https://shuffler.io/apps/${hit.objectID}?queryID=${hit.__queryID}`;

      return appUrl;
    };

    const linkStyle = {
      textDecoration: "none",
      color: "white",
    };

    return (
      <div
        style={{
          maxHeight: "520px",
          width: "710px",
          overflowY: "scroll",
          overflowX: "hidden",
          marginLeft: "8px",
          justifyContent: "center",
          scrollbarWidth: "thin",
          scrollbarColor: "#494949 #2f2f2f",
          marginTop: "2px",
        }}
      >
        <table style={tableDataStyle}>
          <thead>
            <tr style={trStyle}>
              <th style={thStyle}>Logo</th>
              <th style={thStyle}>Name</th>
              {!isHideCategoryTagChecked && <th style={thStyle}>Category</th>}
              {!isHideTagChecked && <th style={thStyle}>Tag</th>}
              <th style={thStyle}>Created With</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((hit, index) => (
              <tr style={trStyle}>
                <td style={tdStyle}>
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    style={linkStyle}
                    href={handleAppUrl(hit)}
                  >
                    <img
                      src={hit.image_url}
                      alt="Logo"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                </td>
                <td style={tdStyle}>{hit.name}</td>
                {!isHideCategoryTagChecked && (
                  <td style={tdStyle}>
                    {hit.categories ? hit.categories.join(", ") : "NA"}
                  </td>
                )}
                {!isHideTagChecked && (
                  <td style={tdStyle}>
                    {hit.tags ? hit.tags.join(", ") : "NA"}
                  </td>
                )}
                <td style={tdStyle}>
                  {hit.generated ? (
                    hit.invalid ? (
                      <span style={{ gap: "5px" }}>
                        <CloudQueueIcon />
                        <span> Cloud</span>
                      </span>
                    ) : (
                      <span style={{ gap: "5px" }}>
                        <CloudQueueIcon />
                        <span> Cloud</span>
                      </span>
                    )
                  ) : (
                    <span style={{ gap: "5px" }}>
                      <CodeIcon /> <span> Cloud/Python</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
          color: "white",
          padding: isHeader ? null : 15,
          cursor: "pointer",
          position: "relative",
          width: currentView === "split" ? "339px" : "221px",
          height: "96px",
          marginBottom: "10px",
          borderRadius: "8px",
          overflow: "hidden",
          zIndex: "1",
        };

        const iconStyle = {
          position: "absolute",
          top: 1,
          left: 3,
          height: 16,
          width: 16,
          marginTop: "5px",
          color: isMouseOverOnCloudIcon ? "white" : "white",
          marginLeft: "300px",
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
            <Grid spacing={12} item xs={xs} key={index}>
              <a
                href={appUrl}
                rel="noopener noreferrer"
                target="_blank"
                style={{
                  textDecoration: "none",
                  color: "#f85a3e",
                  width: "100%",
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
                      padding: 5,
                      borderRadius: 3,
                      fontSize: "18px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <img
                      alt={data.name}
                      src={data.image_url}
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        width: "100%",
                        gap: "10px",
                        overflow: "hidden",
                        fontSize: "16px",
                        marginLeft: "5px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {data.name}
                      </div>
                      {!isHideCategoryTagChecked && (
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "200px",
                          }}
                        >
                          {data.categories !== null
                            ? data.categories.join(", ")
                            : "NA"}
                        </div>
                      )}
                      {!isHideTagChecked && (
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth:
                              currentView === "split" ? "250px" : "140px",
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
                      )}
                    </div>
                  </ButtonBase>
                  {data.generated ? (
                    <Tooltip
                      title={"Created with App editor"}
                      style={{ marginTop: "28px", width: "100%" }}
                      aria-label={data.name}
                    >
                      {data.invalid ? (
                        <CloudQueueIcon style={iconStyle} />
                      ) : (
                        <CloudQueueIcon style={iconStyle} />
                      )}
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={"Created with python (custom app)"}
                      style={{ marginTop: "28px", width: "100%" }}
                      aria-label={data.name}
                    >
                      <CodeIcon style={iconStyle} />
                    </Tooltip>
                  )}
                </Paper>
              </a>
            </Grid>
          </Zoom>
        );
      });
    }, [hits, currentView, isHideTagChecked, isHideCategoryTagChecked]);

    return (
      <Grid>
        {(currentView === "split") | (currentView === "splits") ? (
          <div
            item
            spacing={12}
            style={{
              gap: "10px",
              marginTop: "20px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              overflowY: "scroll",
              overflowX: "hidden",
              height: "520px",
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
        )}
      </Grid>
    );
  };

  var workflowDelay = -50;
  // const Hits = ({
  //   hits,
  //   insights,
  //   currentView,
  //   isHideTagChecked,
  //   isHideCategoryTagChecked,
  // }) => {
  //   const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
  //   var counted = 0;

  //   //var curhits = hits
  //   //if (hits.length > 0 && defaultApps.length === 0) {
  //   //	setDefaultApps(hits)
  //   //}

  //   //const [defaultApps, setDefaultApps] = React.useState([])
  //   //console.log(hits)
  //   //if (hits.length > 0 && hits.length !== innerHits.length) {
  //   //	setInnerHits(hits)
  //   //}
  //   // console.log(hits);
  //   console.log(currentView);

  //   const [isMouseOverOnCloudIcon, setIsMouseOverOnCloudIcon] = useState(false);

  //   return (
  //     <Grid>
  //       {(currentView === "split") | (currentView === "splits") ? (
  //         <div
  //           item
  //           spacing={12}
  //           style={{
  //             gap: "10px",
  //             marginTop: "20px",
  //             display: "flex",
  //             flexWrap: "wrap",
  //             justifyContent: "center",
  //             overflowY: "scroll",
  //             overflowX: "hidden",
  //             height: "520px",
  //             scrollbarWidth: "thin",
  //             scrollbarColor: "#494949 #2f2f2f",
  //           }}
  //         >
  //           {hits.map((data, index) => {
  //             workflowDelay += 50;

  //             const paperStyle = {
  //               backgroundColor: "#1A1A1A",
  //               color: "white",
  //               padding: isHeader ? null : 15,
  //               cursor: "pointer",
  //               position: "relative",
  //               width: currentView == "split" ? "339px" : "221px",
  //               height: "96px",
  //               marginBottom: "10px",
  //               borderRadius: "8px",
  //               overflow: "hidden",
  //               zIndex: "1",
  //             };

  //             const iconStyle = {
  //               position: "absolute",
  //               top: 1,
  //               left: 3,
  //               height: 16,
  //               width: 16,
  //               marginTop: "5px",
  //               color: isMouseOverOnCloudIcon ? "white" : "white",
  //               marginLeft: "300px",
  //             };

  //             const CloudIconDivStyling = {
  //               display: "flex",
  //               flexDirection: "column",
  //               alignItems: "flex-start",
  //               justifyContent: "flex-end",
  //               gap: "10px",
  //               overflow: "hidden",
  //               fontSize: "16px",
  //               width: "24px",
  //               height: "24px",
  //               backgroundColor: isMouseOverOnCloudIcon && "#494949",
  //             };

  //             if (counted === (12 / xs) * rowHandler) {
  //               return null;
  //             }

  //             counted += 1;
  // var parsedname = "";
  // for (var key = 0; key < data.name.length; key++) {
  //   var character = data.name.charAt(key);
  //   if (character === character.toUpperCase()) {
  //     if (
  //       data.name.charAt(key + 1) !== undefined &&
  //       data.name.charAt(key + 1) ===
  //         data.name.charAt(key + 1).toUpperCase()
  //     ) {
  //     } else {
  //       parsedname += " ";
  //     }
  //   }
  //   parsedname += character;
  // }

  // parsedname = (
  //   parsedname.charAt(0).toUpperCase() + parsedname.substring(1)
  // ).replaceAll("_", " ");
  //             const appUrl = isCloud
  //               ? `/apps/${data.objectID}?queryID=${data.__queryID}`
  //               : `https://shuffler.io/apps/${data.objectID}?queryID=${data.__queryID}`;
  //             return (
  //               <Zoom
  //                 key={index}
  //                 in={true}
  //                 style={{
  //                   transitionDelay: `${workflowDelay}ms`,
  //                 }}
  //               >
  //                 <Grid spacing={12} item xs={xs} key={index}>
  //                   <a
  //                     href={appUrl}
  //                     rel="noopener noreferrer"
  //                     target="_blank"
  //                     style={{
  //                       textDecoration: "none",
  //                       color: "#f85a3e",
  //                       width: "100%",
  //                     }}
  //                   >
  //                     <Paper
  //                       elevation={0}
  //                       style={paperStyle}
  //                       onMouseOver={() => {
  //                         setMouseHoverIndex(index);
  //                       }}
  //                       onMouseOut={() => {
  //                         setMouseHoverIndex(-1);
  //                       }}
  //                       onClick={() => {
  //                         if (isCloud) {
  //                           ReactGA.event({
  //                             category: "app_grid_view",
  //                             action: `app_${parsedname}_${data.id}_click`,
  //                             label: "",
  //                           });
  //                         }
  //                         console.log(searchClient);
  //                         aa("init", {
  //                           appId: searchClient.appId,
  //                           apiKey:
  //                             searchClient.transporter.queryParameters[
  //                               "x-algolia-api-key"
  //                             ],
  //                         });

  //                         const timestamp = new Date().getTime();
  //                         aa("sendEvents", [
  //                           {
  //                             eventType: "click",
  //                             eventName: "Product Clicked",
  //                             index: "appsearch",
  //                             objectIDs: [data.objectID],
  //                             timestamp: timestamp,
  //                             queryID: data.__queryID,
  //                             positions: [data.__position],
  //                             userToken:
  //                               userdata === undefined ||
  //                               userdata === null ||
  //                               userdata.id === undefined
  //                                 ? "unauthenticated"
  //                                 : userdata.id,
  //                           },
  //                         ]);
  //                       }}
  //                     >
  //                       <ButtonBase
  //                         style={{
  //                           padding: 5,
  //                           borderRadius: 3,
  //                           fontSize: "18px",
  //                           overflow: "hidden",
  //                           display: "flex",
  //                           alignItems: "flex-start",
  //                         }}
  //                       >
  //                         <img
  //                           alt={data.name}
  //                           src={data.image_url}
  //                           style={{
  //                             width: "80px",
  //                             height: "80px",
  //                             borderRadius: "8px",
  //                             //   marginTop: "5px",
  //                             //   marginBottom: "10px",
  //                           }}
  //                         />
  //                         <div
  //                           style={{
  //                             display: "flex",
  //                             flexDirection: "column",
  //                             alignItems: "flex-start",
  //                             gap: "10px",
  //                             overflow: "hidden",
  //                             fontSize: "16px",
  //                             marginLeft: "10px",
  //                             margin: "10px",
  //                             marginRight: "auto",
  //                             alignItems: "flex-start",
  //                           }}
  //                         >
  //                           <span
  //                             style={{
  //                               overflow: "hidden",
  //                               textOverflow: "ellipsis",
  //                               whiteSpace: "nowrap",
  //                             }}
  //                           >
  //                             {data.name}
  //                           </span>
  //                           {isHideCategoryTagChecked == false && (
  //                             <span
  //                               style={{
  //                                 overflow: "hidden",
  //                                 textOverflow: "ellipsis",
  //                                 whiteSpace: "nowrap",
  //                               }}
  //                             >
  //                               {data.categories !== null
  //                                 ? data.categories.join(", ")
  //                                 : "NA"}
  //                             </span>
  //                           )}
  //                           {isHideTagChecked == false && (
  //                             <div
  //                               style={{
  //                                 display: "flex",
  //                                 alignItems: "flex-start",
  //                                 overflow: "hidden",
  //                                 textOverflow: "ellipsis",
  //                                 whiteSpace: "nowrap",
  //                               }}
  //                             >
  //                               {data.tags &&
  //                                 data.tags.map((tag, tagIndex) => (
  //                                   <span key={tagIndex}>
  //                                     {tag +
  //                                       (tagIndex < data.tags.length - 1
  //                                         ? ", "
  //                                         : "")}
  //                                   </span>
  //                                 ))}
  //                             </div>
  //                           )}
  //                         </div>
  //                       </ButtonBase>
  //                       {data.generated ? (
  //                         <Tooltip
  //                           title={"Created with App editor"}
  //                           style={{
  //                             marginTop: "28px",
  //                             width: "100%",
  //                           }}
  //                           aria-label={data.name}
  //                         >
  //                           {data.invalid ? (
  //                             <CloudQueueIcon style={iconStyle} />
  //                           ) : (
  //                             <CloudQueueIcon style={iconStyle} />
  //                           )}
  //                         </Tooltip>
  //                       ) : (
  //                         <Tooltip
  //                           title={"Created with python (custom app)"}
  //                           style={{ marginTop: "28px", width: "100%" }}
  //                           aria-label={data.name}
  //                         >
  //                           <CodeIcon style={iconStyle} />
  //                         </Tooltip>
  //                       )}
  //                     </Paper>
  //                   </a>
  //                 </Grid>
  //               </Zoom>
  //             );
  //           })}
  //         </div>
  //       ) : (
  //         <ListView
  //           isHideCategoryTagChecked={isHideCategoryTagChecked}
  //           isHideTagChecked={isHideTagChecked}
  //           hits={hits}
  //         />
  //       )}
  //     </Grid>
  //   );
  // };

  const FilterByCategory = () => {
    const [isRefinementListExpanded, setIsRefinementListExpanded] =
      useState(true);

    const toggleRefinementList = () => {
      setIsRefinementListExpanded((prevState) => !prevState);
    };

    const ClearRefinementList = () => {
      const checkboxes = document.querySelectorAll(
        ".ais-RefinementList-checkbox"
      );
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    };

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
        <button
          style={{
            cursor: "pointer",
            color: "white",
            border: "none",
            backgroundColor: "transparent",
            fontSize: "18px",
            display: "flex",
            width: "100%",
            flexDirection: "row",
          }}
          onClick={toggleRefinementList}
        >
          Category
          {isRefinementListExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "50%" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "50%" }} />
          )}
        </button>

        {isRefinementListExpanded && (
          <>
            <RefinementList attribute="categories" />
            <button
              style={{
                cursor: "pointer",
                color: "rgb(248, 103, 67)",
                border: "none",
                backgroundColor: "transparent",
                fontSize: "18px",
              }}
              onClick={ClearRefinementList}
            >
              Clear All
            </button>
          </>
        )}
      </div>
    );
  };

  const FilterByActionLabel = () => {
    const [isActionLabelExpanded, setIsActionLabelExpanded] = useState(false);
    useState(false);

    const toogleActionLabel = () => {
      setIsActionLabelExpanded((prevState) => !prevState);
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: "20px",
          width: "100%",
        }}
      >
        <button
          style={{
            cursor: "pointer",
            color: "white",
            border: "none",
            backgroundColor: "transparent",
            fontSize: "18px",
            display: "flex",
            flexDirection: "row",
            width: "100%",
          }}
          onClick={toogleActionLabel}
        >
          Labels
          {isActionLabelExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "60%" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "60%" }} />
          )}
        </button>

        {isActionLabelExpanded && (
          <>
            <RefinementList attribute="action_labels" />
            <button
              style={{
                cursor: "pointer",
                color: "rgb(248, 103, 67)",
                border: "none",
                backgroundColor: "transparent",
                fontSize: "18px",
              }}
            >
              Clear All
            </button>
          </>
        )}
      </div>
    );
  };

  const FilterByCreatedWith = () => {
    const [isCreatedWithExpanded, setIsCreatedWithExpanded] = useState(false);

    const toogleCreatedWith = () => {
      setIsCreatedWithExpanded((prevState) => !prevState);
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: "20px",
          width: "100%",
        }}
      >
        <button
          style={{
            cursor: "pointer",
            color: "white",
            border: "none",
            backgroundColor: "transparent",
            fontSize: "18px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "97px",
            gap: "100%",
            width: "36%",
          }}
          onClick={toogleCreatedWith}
        >
          <label style={{ whiteSpace: "nowrap" }}>Created With</label>
          {isCreatedWithExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </button>

        {isCreatedWithExpanded && (
          <>
            {/* <RefinementList attribute="created_with" /> */}
            <button
              style={{
                cursor: "pointer",
                color: "rgb(248, 103, 67)",
                border: "none",
                backgroundColor: "transparent",
                fontSize: "18px",
              }}
            >
              Clear All
            </button>
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

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: "20px",
          width: "100%",
        }}
      >
        <button
          style={{
            cursor: "pointer",
            color: "white",
            border: "none",
            backgroundColor: "transparent",
            fontSize: "18px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            whiteSpace: "nowrap",
            width: "100%",
          }}
          onClick={toogleCreatedBy}
        >
          Created By
          {isCreatedByExpanded ? (
            <ExpandLessIcon style={{ marginLeft: "40%" }} />
          ) : (
            <ExpandMoreIcon style={{ marginLeft: "40%" }} />
          )}
        </button>

        {isCreatedByExpanded && (
          <>
            {/* <RefinementList attribute="action_labels" /> */}
            <button
              style={{
                cursor: "pointer",
                color: "rgb(248, 103, 67)",
                border: "none",
                backgroundColor: "transparent",
                fontSize: "18px",
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
          width: "200px",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "30px",
            marginTop: "30px",
          }}
        >
          Filter By
        </span>
        <FilterByCategory />
        <FilterByActionLabel />
        <FilterByCreatedWith />
        <FilterCreatedBy />
      </div>
    );
  };

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
    backgroundColor: "#212121",
    borderRadius: "10px",
    width: "720px",
    height: "720px",
  };

  const [currTab, setCurrTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrTab(newValue);
  };

  const AllApps = () => {
    const [hoverStates, setHoverStates] = useState([false, false, false]);

    const [isHideTagChecked, setIsHideTagChecked] = useState(false);

    const handleChecked = (event) => {
      setIsHideTagChecked(event.target.checked);
    };

    const [isHideCategoryTagChecked, setIsHideCategoryChecked] =
      useState(false);

    const handleCategoryChecked = (event) => {
      setIsHideCategoryChecked(event.target.checked);
    };

    const buttonStyles = [
      {
        cursor: "pointer",
        border: "none",
        backgroundColor: "transparent",
        color: "white",
        borderRadius: "5px",
        ...(hoverStates[0] && {
          backgroundColor: "#2f2f2f",
          color: "#ff8444",
        }),
      },
      {
        cursor: "pointer",
        border: "none",
        backgroundColor: "transparent",
        borderRadius: "5px",
        color: "white",
        ...(hoverStates[1] && {
          backgroundColor: "#2f2f2f",
          color: "#ff8444",
        }),
      },
      {
        cursor: "pointer",
        border: "none",
        backgroundColor: "transparent",
        borderRadius: "5px",
        color: "white",
        ...(hoverStates[2] && {
          backgroundColor: "#2f2f2f",
          color: "#ff8444",
        }),
      },
    ];
    const handleMouseEnter = (index) => {
      const updatedHoverStates = [...hoverStates];
      updatedHoverStates[index] = true;
      setHoverStates(updatedHoverStates);
    };

    const handleMouseLeave = (index) => {
      const updatedHoverStates = [...hoverStates];
      updatedHoverStates[index] = false;
      setHoverStates(updatedHoverStates);
    };

    const [currentView, setCurrentView] = useState("split");

    const handleCurrentView = (view) => {
      setCurrentView(view);
    };

    return (
      <div
        style={{
          width: "100%",
          position: "relative",
          height: "100%",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "row", marginTop: "10px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginLeft: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row" }}>
              <input
                type="checkbox"
                className="ais-RefinementList-checkbox"
                checked={isHideTagChecked}
                onChange={handleChecked}
              ></input>
              <span className="ais-RefinementList-labelText">Hide Tags</span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                marginLeft: "10px",
              }}
            >
              <input
                type="checkbox"
                className="ais-RefinementList-checkbox"
                checked={isHideCategoryTagChecked}
                onChange={handleCategoryChecked}
              ></input>
              <span className="ais-RefinementList-labelText">
                Hide Category
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginLeft: "auto",
              marginRight: "20px",
              gap: "10px",
            }}
          >
            <span>View: </span>
            <button
              style={buttonStyles[0]}
              onMouseEnter={() => handleMouseEnter(0)}
              onMouseLeave={() => handleMouseLeave(0)}
              onClick={() => handleCurrentView("list")}
            >
              <GrList style={{ width: "20px", height: "20px" }} />
            </button>
            <button
              style={buttonStyles[1]}
              onMouseOver={() => handleMouseEnter(1)}
              onMouseOut={() => handleMouseLeave(1)}
              onClick={() => handleCurrentView("split")}
            >
              <GrSplit style={{ width: "20px", height: "20px" }} />
            </button>
            <button
              style={buttonStyles[2]}
              onMouseOver={() => handleMouseEnter(2)}
              onMouseOut={() => handleMouseLeave(2)}
              onClick={() => handleCurrentView("splits")}
            >
              <GrSplits style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        </div>
        <CustomSearchBox />
        <CustomHits
          isHideCategoryTagChecked={isHideCategoryTagChecked}
          isHideTagChecked={isHideTagChecked}
          currentView={currentView}
          hitsPerPage={5}
        />
      </div>
    );
  };

  const OranizationApps = () => {
    return (
      <div style={{ marginBottom: "100%" }}>
        <span>Oranizations apps</span>
      </div>
    );
  };

  const UsersApps = () => {
    return (
      <div style={{ marginBottom: "100%" }}>
        <span>Users app</span>
      </div>
    );
  };

  const AppTab = () => {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={boxStyle}>
          <Tabs
            style={{ marginTop: "15px" }}
            value={currTab}
            indicatorColor="primary"
            textColor="secondary"
            aria-label="disabled tabs example"
            variant="scrollable"
            scrollButtons="auto"
            onChange={handleTabChange}
          >
            <Tab
              label="All Apps"
              style={{
                color: currTab === 0 ? "#F86743" : "inherit",
                width: "173px",
                height: "44px",
                marginLeft: "20px",
              }}
            ></Tab>
            <Tab
              label="Organization Apps"
              style={{
                color: currTab === 1 ? "#F86743" : "inherit",
                height: "44px",
                marginLeft: "20px",
              }}
            ></Tab>
            <Tab
              label="My app"
              style={{
                color: currTab === 2 ? "#F86743" : "inherit",
                width: "173px",
                height: "44px",
                marginLeft: "20px",
              }}
            ></Tab>
          </Tabs>

          {currTab === 0 ? (
            <AllApps />
          ) : currTab === 1 ? (
            <OranizationApps />
          ) : currTab === 2 ? (
            <UsersApps />
          ) : null}
        </div>
      </div>
    );
  };

  const CustomSearchBox = connectSearchBox(SearchBox);
  const CustomHits = connectHits(Hits);
  //const CustomHits = connectHitInsights(aa)(Hits)
  const selectButtonStyle = {
    minWidth: 150,
    maxWidth: 150,
    minHeight: 50,
  };

  return (
    <div
      style={{
        width: "100%",
        textAlign: "center",
        position: "relative",
        height: "100%",
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
          width: "100%",
          position: "relative",
          height: "100%",
        }}
      >
        <InstantSearch searchClient={searchClient} indexName="appsearch">
          <div
            style={{
              //   maxWidth: 450,
              margin: "15px auto auto",
              justifyContent: "center",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <FilterApps />
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
                  marginRight: "15px",
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
