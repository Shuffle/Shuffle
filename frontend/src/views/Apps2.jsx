import React, { useState, useEffect, useContext, useCallback, memo, useMemo, useRef } from "react";
import theme from "../theme.jsx";
import { isMobile } from "react-device-detect";

import { useLocation, useNavigate } from "react-router-dom";
import {
  TextField, Button, Typography, MenuItem, Select, Tabs, Tab, Zoom,
  Grid,
  Paper,
  ButtonBase,
  Tooltip,
  Box,
  CircularProgress,
  Checkbox,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Context } from "../context/ContextApi.jsx";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Cached as CachedIcon,
  CloudDownload as CloudDownloadIcon,
  ForkRight as ForkRightIcon,
} from "@mui/icons-material";

import InputAdornment from '@mui/material/InputAdornment';

import { ClearRefinements, connectHits, connectSearchBox, connectStateResults, InstantSearch, RefinementList, connectRefinementList, Configure } from "react-instantsearch-dom";
import { removeQuery } from "../components/ScrollToTop.jsx";
import { toast } from "react-toastify";
import algoliasearch from "algoliasearch/lite";
import { debounce } from "lodash";
import AppSelection from "../components/AppSelection.jsx";
import AppModal from "../components/AppModal.jsx";
import AppCreationModal from "../components/AppCreationModal.jsx";


const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
);

// AppCard Component
const AppCard = ({ data, index, mouseHoverIndex, setMouseHoverIndex, globalUrl, deactivatedIndexes, currTab, handleAppClick, leftSideBarOpenByClick, userdata, fetchApps, appsToShow, setAppsToShow, setUserApps, }) => {
  const navigate = useNavigate();
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "localhost:3000";
  //const appUrl = isCloud ? `/apps/${data.id}` : `https://shuffler.io/apps/${data.id}`;
  const appUrl = `/apps/${data.id}` 

  var canEditApp = userdata?.support || userdata?.id === data?.owner || 
        (userdata?.admin === "true" && userdata?.active_org?.id === data?.reference_org) || data?.contributors?.includes(userdata?.id)

  const paperStyle = {
    backgroundColor: mouseHoverIndex === index ? "rgba(26, 26, 26, 1)" : "#212121",
    color: "rgba(241, 241, 241, 1)",
    cursor: "pointer",
    fontFamily: theme?.typography?.fontFamily,
    // position: "relative",
    width: "100%",
    height: 96,
    borderRadius: 8,
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
    transition: "width 0.3s ease",
  }

  return (
    <Grid item xs={12} key={index}>
      <Paper elevation={0}
        style={paperStyle}
        onMouseOver={() => setMouseHoverIndex(index)}
        onMouseOut={() => setMouseHoverIndex(-1)}
      >
        <Tooltip
          title="View app details"
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                backgroundColor: "rgba(33, 33, 33, 1)",
                color: "rgba(241, 241, 241, 1)",
                fontSize: 14,
                border: "1px solid rgba(73, 73, 73, 1)",
                fontFamily: theme?.typography?.fontFamily,
              }
            },
          }}
          arrow
        >
          <ButtonBase
            style={{
              borderRadius: 6,
              fontSize: 16,
              overflow: "hidden",
              display: "flex",
              fontFamily: theme?.typography?.fontFamily,
              width: '100%',
              backgroundColor: mouseHoverIndex === index ? "#2F2F2F" : "#212121"
            }}
            onClick={() => {
              handleAppClick(data);
            }}
          >
            <img
              alt={data.name}
              src={data.small_image || data.large_image ? (data.small_image || data.large_image) : "/images/no_image.png"}
              style={{
                width: 100,
                height: 100,
                borderRadius: 6,
                margin: 10,
                border: "1px solid #212122",
                boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)"
              }}
            />
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: 339,
              gap: 8,
              fontWeight: '400',
              overflow: "hidden",
              margin: "12px 0",
              fontFamily: theme?.typography?.fontFamily,
            }}>

              <div style={{
                display: 'flex',
                flexDirection: 'row',
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: 600,
                whiteSpace: "nowrap",
                marginLeft: 8,
                maxWidth: "90%",
                gap: 8
              }}>

                <div style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: '#F1F1F1'
                }}>
                  {data.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                </div>

              </div>
              <div style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginLeft: 8,
                color: "rgba(158, 158, 158, 1)"
              }}>
                {data.categories ? data.categories.join(", ") : "NA"}
              </div>

              <div style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                marginLeft: 8,
                color: "rgba(158, 158, 158, 1)",
                display: "flex",
                justifyContent: 'space-between',
                paddingRight: 15,
                height: 35,
              }}>
                <div style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "rgba(158, 158, 158, 1)",
                }}>
                  {data.generated !== true && data.tags && data.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span key={tagIndex}>
                      {tag}
                      {tagIndex < data.tags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>

                {/* Deactivate button */}
                {(currTab === 0 || currTab === 1) && !deactivatedIndexes.includes(index) && mouseHoverIndex === index && data.generated === true && (
                  <div style={{
                    display: "flex",
                    gap: 8,
                    alignItems: 'center',
                    paddingRight: 20
                  }}>
                    {
                      canEditApp ? (
                        <button style={{ backgroundColor: "rgba(73, 73, 73, 1)", border: "none", cursor: "pointer", color: "white", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", height: 35 }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (canEditApp) {
                              const editUrl = "/apps/edit/" + data?.id;
                              navigate(editUrl)
                            }
                          }}
                        >
                          <EditIcon />
                        </button>
                      ) : (
                        <button style={{ backgroundColor: "rgba(73, 73, 73, 1)", border: "none", cursor: "pointer", color: "white", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", height: 35 }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const editUrl = "/apps/new?id=" + data?.id;
                          navigate(editUrl)
                        }}
                        >
                        <ForkRightIcon />
                        </button>
                      )
                    }

                    <Button
					  disabled={data?.reference_org === userdata?.active_org?.id}
                      className="deactivate-button"
                      sx={{
                        width: 110,
                        height: 35,
                        borderRadius: 0.75,
                        bgcolor: "rgba(73, 73, 73, 1)",
                        color: "rgba(241, 241, 241, 1)",
                        textTransform: "none",
                        fontSize: 16,
                        fontFamily: theme?.typography?.fontFamily,
                        transition: "background-color 0.3s ease",
                        "&:hover": {
                          bgcolor: "rgba(93, 93, 93, 1)",
                        },
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const url = `${globalUrl}/api/v1/apps/${data.id}/deactivate`;
                        //toast("Deactivating app. Please wait...");
                        fetch(url, {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                          },
                          credentials: "include",
                        })
                          .then((response) => response.json())
                          .then((responseJson) => {
                            if (responseJson.success === false) {
							  if (responseJson?.reason !== undefined && responseJson?.reason !== null && responseJson?.reason !== "") {
                              	  toast.error(responseJson.reason);
							  } else {
								  toast.error("Failed to deactivate app. Please try again later.")
							  }
                            } else {
                              toast.success("App deactivated successfully. Will take effect on refresh..")
							}
                          })
                          .catch(error => {
                            console.log("app error: ", error.toString());
                          });
                      }}
                    >
                      Deactivate
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ButtonBase>
        </Tooltip>
      </Paper>
    </Grid>
  );
};


// Component to fetch all public app from the algolia.
const Hits = ({
  userdata,
  hits,
  handleAppClick,
  setIsAnyAppActivated,
  searchQuery,
  globalUrl,
  isLoggedIn,
  currTab,
  leftSideBarOpenByClick
}) => {
  const [hoverEffect, setHoverEffect] = useState(-1);
  const [allActivatedAppIds, setAllActivatedAppIds] = useState([]);
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
  const [deactivatedIndexes, setDeactivatedIndexes] = React.useState([]);
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    var baseurl = globalUrl;
    setIsLoading(true)
    fetch(baseurl + "/api/v1/me", {
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.success) {
          setAllActivatedAppIds(responseJson.active_apps)
        }
        setIsLoading(false)
      })
      .catch(error => {
        console.log("Failed login check: ", error);
      });
  }, [currTab]);

  const normalizedString = (name) => {
    if (typeof name === 'string') {
      return name.replace(/_/g, ' ');
    } else {
      return name;
    }
  };

  useEffect(() => {
    if (userdata && userdata.active_apps) {
      setAllActivatedAppIds(userdata.active_apps);
    }
  }, [currTab, window.location]);


  //Function for activation and deactivation of app
  const handleActivateButton = (event, data, type) => {

    //use prevent default so it will stop redirection to the app page
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Please log in to your account to activate the app.")
      return;
    }
    if (type === "activate") {
      toast.success(`The ${normalizedString(data.name)} app is activating. Please wait...`);
    }
    if (type === "deactivate") {
      toast.success(`The ${normalizedString(data.name)} app is deactivating. Please wait...`);
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
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.success === false) {
          toast.error(responseJson.reason);
        } else {
          //toast.success(`App ${type}d Successfully!`);
          if (type === 'activate') {
            setAllActivatedAppIds(prev => [...prev, data.objectID]);
            setIsAnyAppActivated(true);
          }
          if (type === 'deactivate') {
            const updatedIds = allActivatedAppIds.filter(id => id !== data.objectID);
            setAllActivatedAppIds(updatedIds);
          }
        }
      })
      .catch(error => {
        console.log("app error: ", error.toString());
      });
  }

  let workflowDelay = 0;
  const isHeader = true;



  return (
    <div>
      {!isLoading ?
        (
          <div>
            {hits?.length === 0 && searchQuery.length >= 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                gap: 16,
                color: "#F1F1F1",
                fontFamily: theme?.typography?.fontFamily
              }}>
                <SearchIcon style={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.7)' }} />
                <Typography variant="h6" style={{ 
                  fontFamily: theme?.typography?.fontFamily,
                  textAlign: "center" 
                }}>
                  No apps found matching your search criteria
                </Typography>
                <Typography 
                  variant="body1" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: "center",
                    maxWidth: 400
                  }}
                >
                  Try adjusting your search terms or filters to find what you're looking for
                </Typography>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 16,
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
                  gap: "20px",
                  fontFamily: theme?.typography?.fontFamily,
                  justifyContent: "space-between",
                  alignItems: "start",
                  padding: "0 10px",
                  paddingBottom: 40
                }}
              >
                {hits?.map((data, index) => {
                  const appUrl =
                    isCloud
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
                      <Paper
                        elevation={0}
                        style={{
                          backgroundColor: hoverEffect === index ? "rgba(26, 26, 26, 1)" : "#212121",
                          color: "rgba(241, 241, 241, 1)",
                          cursor: "pointer",
                          fontFamily: theme?.typography?.fontFamily,
                          // position: "relative",
                          width: "100%",
                          height: 96,
                          borderRadius: 8,
                          boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
                          marginBottom: 20,
                          transition: "width 0.3s ease",
                        }}
                        onMouseEnter={() => {
                          setHoverEffect(index);
                        }}
                        onMouseLeave={() => {
                          setHoverEffect(-1);
                        }}
                      >
                        <Tooltip
                          title="View app details"
                          placement="top"
                          componentsProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: "rgba(33, 33, 33, 1)",
                                color: "rgba(241, 241, 241, 1)",
                                fontSize: 14,
                                border: "1px solid rgba(73, 73, 73, 1)",
                                fontFamily: theme?.typography?.fontFamily,
                              }
                            },
                          }}
                          arrow
                        >
                          <ButtonBase style={{
                            borderRadius: 6,
                            fontSize: 16,
                            overflow: "hidden",
                            display: "flex",
                            width: '100%',
                            backgroundColor: hoverEffect === index ? "#2F2F2F" : "#212121",
                            fontFamily: theme?.typography?.fontFamily
                          }}
                            onClick={() => {
                              handleAppClick(data);
                            }}
                          >
                            <img
                              alt={data.name}
                              src={data.image_url ? data.image_url : "/images/no_image.png"}
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 6,
                                margin: 10,
                                border: "1px solid #212122",
                                boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)"
                              }}
                            />
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                width: 339,
                                gap: 6,
                                fontWeight: '400',
                                overflow: "hidden",
                                fontFamily: theme?.typography?.fontFamily,
                                marginTop: 8,
                                marginLeft: 16,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: "row",
                                  overflow: "hidden",
                                  gap: 8,
                                  fontWeight: 600,
                                  maxWidth: "90%",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: '#F1F1F1'
                                }}
                              >
                                {(allActivatedAppIds && allActivatedAppIds.includes(data.objectID)) && <Box sx={{ width: 8, height: 8, backgroundColor: "#02CB70", borderRadius: '50%' }} />}
                                <div style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: '#F1F1F1'
                                }}>
                                  {normalizedString(data.name)}
                                </div>
                              </div>

                              <div
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: "rgba(158, 158, 158, 1)",
                                  marginTop: 5,
                                }}
                              >
                                {data.categories !== null
                                  ? normalizedString(data.categories).join(", ")
                                  : "NA"}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: 'space-between',
                                  width: "100%",
                                  textAlign: 'start',
                                  color: "rgba(158, 158, 158, 1)",
                                  height: 35,
                                  alignItems: 'center'
                                }}
                              >
                                <div style={{
                                  flex: 1
                                }}>
                                  {hoverEffect === index ? (
                                    <div>
                                      {data.tags && (
                                        <Tooltip
                                          title={data.tags.join(", ")}
                                          placement="bottom"
                                          componentsProps={{
                                            tooltip: {
                                              sx: {
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
                                    <div style={{
                                      width: 230,
                                      textOverflow: "ellipsis",
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                    }}>
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

                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  alignItems: 'center',
                                  paddingRight: 10,
                                  minWidth: 110
                                }}>
                                  {hoverEffect === index && (
                                    <div>
                                      {allActivatedAppIds && allActivatedAppIds?.includes(data.objectID) ? (
                                        <Button
                                          style={{
                                            width: 110,
                                            height: 35,
                                            borderRadius: 4,
                                            backgroundColor: "rgba(73, 73, 73, 1)",
                                            color: "rgba(241, 241, 241, 1)",
                                            textTransform: "none",
                                            fontFamily: theme?.typography?.fontFamily,
                                            fontSize: 16,
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onMouseUp={(e) => e.stopPropagation()}
                                          onClick={(event) => {
                                            handleActivateButton(event, data, "deactivate");
                                          }}>
                                          Deactivate
                                        </Button>

                                      ) : (

                                        <Button
                                          style={{
                                            backgroundColor: "#FF8544",
                                            color: "black",
                                            width: 102,
                                            height: 35,
                                            borderRadius: 4,
                                            textTransform: "none",
                                            fontFamily: theme?.typography?.fontFamily,
                                            fontSize: 16
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onMouseUp={(e) => e.stopPropagation()}
                                          onClick={(event) => {
                                            handleActivateButton(event, data, "activate");
                                          }}
                                        >
                                          Activate
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </ButtonBase>
                        </Tooltip>
                      </Paper>
                    </Zoom>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <LoadingGrid />
        )
      }
    </div >
  );
}



// Custom SearchBox Component
const SearchBox = ({ refine, searchQuery, setSearchQuery }) => {
  const inputRef = useRef(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const location = useLocation();
  // Initialize search when component mounts or when switching to Discover tab
  useEffect(() => {
    if (searchQuery) {
      setLocalQuery(searchQuery);
      refine(searchQuery); // This will trigger the Algolia search
    }
  }, [searchQuery, refine]);

  // Debounced function to refine search
  const debouncedRefine = useRef(
    debounce((value) => {
      setSearchQuery(value);
      removeQuery("q");
      refine(value);
    }, 300)
  ).current;

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const foundQuery = params["q"];
    if (foundQuery) {
      setLocalQuery(foundQuery);
      debouncedRefine(foundQuery);
    }
  }, [debouncedRefine]);

  useEffect(() => {
    if (searchQuery === "") {
      return;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchQuery]);

  const handleChange = (event) => {
    const value = event.target.value;
    setLocalQuery(value);
    debouncedRefine(value);
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Search from 2500+ public apps"
      value={localQuery}
      id="shuffle_search_field"
      inputRef={inputRef}
      onChange={handleChange}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
        }
      }}
      style={{ borderRadius: 4, height: 45, fontFamily: theme?.typography?.fontFamily, flex: 1 }}
      InputProps={{
        style: {
          borderRadius: 4,
          height: 45
        },
        endAdornment: (
          <InputAdornment position="end">
            {localQuery?.length === 0 ? <SearchIcon /> : (
              <ClearIcon
                style={{
                  cursor: "pointer",
                }}
                onClick={() => {
                  setLocalQuery('');
                  debouncedRefine('');
                  const queryParams = new URLSearchParams(location.search);
                  queryParams.delete('q');
                  window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
                }}
              />
            )}
          </InputAdornment>
        ),
      }}
    />
  );
};

const CustomSearchBox = connectSearchBox(SearchBox);
const CustomHits = connectHits(Hits);

// Custom Category Dropdown Component
const CategoryDropdown = ({ items, currentRefinement, refine }) => {
  const handleChange = (event) => {
    const value = event.target.value;
    refine(value);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Select
        fullWidth
        variant="outlined"
        value={currentRefinement}
        onChange={handleChange}
        displayEmpty
        multiple
        style={{ borderRadius: 4, height: 45, fontFamily: theme?.typography?.fontFamily, flex: 1 }}
        renderValue={(selected) => {
          if (selected.length === 0) return 'All Categories';
          return (
            <div style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '90%'
            }}>
              {selected.join(', ')}
            </div>
          );
        }}
      >
        <MenuItem disabled value="" style={{ fontFamily: theme?.typography?.fontFamily }}>
          All Categories
        </MenuItem>
        {items.map(item => (
          <MenuItem key={item.label} value={item.label} style={{ fontFamily: theme?.typography?.fontFamily, fontSize: 16 }}>
            <Checkbox checked={currentRefinement.includes(item.label)} />
            {item.label} ({item.count})
          </MenuItem>
        ))}
      </Select>
      {currentRefinement.length > 0 && (
        <ClearIcon
          style={{
            position: 'absolute',
            right: 35,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: 'white',
            fontSize: 20,
            zIndex: 1000
          }}
          onClick={() => refine([])}
        />
      )}
    </div>
  );
};
const CustomCategoryDropdown = connectRefinementList(CategoryDropdown);

// Custom Label Dropdown Component
const LabelDropdown = ({ items, currentRefinement, refine }) => {
  const handleChange = (event) => {
    const value = event.target.value;
    refine(value);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Select
        fullWidth
        variant="outlined"
        value={currentRefinement}
        onChange={handleChange}
        displayEmpty
        multiple
        style={{ borderRadius: 4, height: 45, fontFamily: theme?.typography?.fontFamily, flex: 1 }}
        renderValue={(selected) => {
          if (selected.length === 0) return 'All Labels';
          return (
            <div style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '90%'
            }}>
              {selected.join(', ')}
            </div>
          );
        }}
      >
        <MenuItem disabled value="">
          All Labels
        </MenuItem>
        {items.map(item => (
          <MenuItem key={item.label} value={item.label} style={{
            fontFamily: theme?.typography?.fontFamily,
            fontSize: 16
          }}>
            <Checkbox checked={currentRefinement.includes(item.label)} />
            {item.label} ({item.count})
          </MenuItem>
        ))}
      </Select>
      {currentRefinement.length > 0 && (
        <ClearIcon
          style={{
            position: 'absolute',
            right: 35,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            color: 'white',
            fontSize: 20,
            zIndex: 1000
          }}
          onClick={() => refine([])}
        />
      )}
    </div>
  );
};
const CustomLabelDropdown = connectRefinementList(LabelDropdown);



// New filter function
const filterApps = (apps, searchQuery, selectedCategory, selectedLabel) => {
  if (!Array.isArray(apps)) return [];

  return apps.filter((app) => {
    const matchesSearchQuery = (
      searchQuery === "" || // If searchQuery is empty, match all apps
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.tags && app.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )) ||
      (app.categories && app.categories.some((category) =>
        category.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );

    const matchesSelectedCategories = (
      selectedCategory.length === 0 || // If no category is selected, match all apps
      (app.categories && app.categories.some(category =>
        selectedCategory.includes(category)
      ))
    );

    const matchesSelectedTags = (
      selectedLabel.length === 0 || // If no label is selected, match all apps
      (app.tags && app.tags.some(tag =>
        selectedLabel.includes(tag)
      ))
    );

    return matchesSearchQuery && matchesSelectedCategories && matchesSelectedTags;
  });
};

const LoginPrompt = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 400,
      gap: 20,
      color: "#F1F1F1",
      fontFamily: theme?.typography?.fontFamily
    }}>
      <Typography variant="h6" style={{ fontFamily: theme?.typography?.fontFamily }}>
        Log in to see your organization's apps
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate("/login")}
        style={{
          backgroundColor: "#FF8544",
          color: "#1A1A1A",
          textTransform: "none",
          fontFamily: theme?.typography?.fontFamily,
          fontSize: 16,
          padding: "10px 20px",
          borderRadius: 4,
          fontWeight: 600
        }}
      >
        Log In
      </Button>
    </div>
  )
};

// Add this new component for the app skeleton
const AppSkeleton = () => {
  return (
    <Paper elevation={0} style={{
      backgroundColor: "#212121",
      width: "100%",
      height: 120,
      borderRadius: 4,
    }}>
      <div style={{
        display: "flex",
        padding: 10,
        width: "100%",
        height: "100%"
      }}>
        <Skeleton
          variant="rectangular"
          width={100}
          height={90}
          style={{
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.1)"
          }}
        />
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginLeft: 10,
          flex: 1,
          gap: 6
        }}>
          <Skeleton
            variant="text"
            width="40%"
            height={24}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          />
          <Skeleton
            variant="text"
            width="60%"
            height={20}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          />
          <Skeleton
            variant="text"
            width="30%"
            height={20}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          />
        </div>
      </div>
    </Paper>
  );
};

// Replace the loading sections in the main component with this
const LoadingGrid = () => {
  return (
    <div style={{
      marginTop: 16,
      width: "100%",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
      gap: "20px",
      justifyContent: "space-between",
      alignItems: "start",
      padding: "0 10px"
    }}>
      {[...Array(7)].map((_, index) => (
        <AppSkeleton key={index} />
      ))}
    </div>
  );
};

// Main Apps Component
const Apps2 = (props) => {
  const { globalUrl, isLoaded, serverside, userdata, isLoggedIn, checkLogin } = props;
  let navigate = useNavigate();
  const { leftSideBarOpenByClick } = useContext(Context);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState([]);
  const [currTab, setCurrTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userApps, setUserApps] = useState([]);
  const [orgApps, setOrgApps] = useState([]);
  const [appsToShow, setAppsToShow] = useState([]);
  const [deactivatedIndexes, setDeactivatedIndexes] = React.useState([]);
  const [IsAnyAppActivated, setIsAnyAppActivated] = useState(false);
  const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
  var counted = 0;
  const [showNoAppFound, setShowNoAppFound] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appFramework, setAppFramework] = useState(undefined);
  const [defaultSearch, setDefaultSearch] = useState("");

  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [appSearchLoading, setAppSearchLoading] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState({});
  const [openApi, setOpenApi] = React.useState("");
  const [loadAppsModalOpen, setLoadAppsModalOpen] = useState(false);
  const [downloadBranch, setDownloadBranch] = useState("master");
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [validation, setValidation] = useState(null);
  const [createAppModalOpen, setCreateAppModalOpen] = useState(false);

  const baseRepository = "https://github.com/frikky/shuffle-apps";

  const isCloud =
    window.location.host === "localhost:3002" ||
      window.location.host === "shuffler.io"
      ? true
      : false;

  // Set the current tab based on the query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam !== null && tabParam !== undefined) {
      if (tabParam === 'org_apps') {
        setCurrTab(0);
      } else if (tabParam === 'my_apps') {
        setCurrTab(1);
      } else {
        setCurrTab(2);
      }
    }
  }, [location.search]);

  useEffect(() => {

    const getFramework = () => {
      fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.status !== 200) {
            console.log("Status not 200 for framework!");
          }

          return response.json();
        })
        .then((responseJson) => {
          if (responseJson.success === false) {
            setAppFramework({})

            if (responseJson.reason !== undefined) {
              //toast("Failed loading: " + responseJson.reason)
            } else {
              //toast("Failed to load framework for your org.")
            }
          } else {
            setAppFramework(responseJson)
          }
        })
        .catch((error) => {
          console.log("err in framework: ", error.toString());
        })
    }

    getFramework();
  }, []);

  // Fetch apps based on the current tab : 0 -> org_apps, 1 -> my_apps, 2 -> all_apps
  const fetchApps = async () => {
    const baseUrl = globalUrl;
    let url;
    setIsLoading(true);
    const userId = userdata?.id;
    if (currTab === 1 && userId) {
      url = `${baseUrl}/api/v1/users/${userId}/apps`;
    } else if (currTab === 0) {
      url = `${baseUrl}/api/v1/apps`;
    }
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (currTab === 1) {
        setAppsToShow(data);
        setUserApps(data);
      } else if (currTab === 0) {
        setAppsToShow(data);
        setOrgApps(data);
        // For testing the empty state
        // setAppsToShow([]);
        // setOrgApps([]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching apps:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {

    // Only fetch if we have required data
    if (globalUrl && (currTab === 0 || (currTab === 1 && userdata?.id))) {
      fetchApps();
    }
  }, [currTab, globalUrl, userdata?.id]); // Remove location.search dependency

  // useEffect(() => {
  //   // setSearchQuery("");
  //   setSelectedCategory([]);
  //   setSelectedLabel([]);
  // }, [currTab])


  // Find top categories and tags based on the current tab
  useEffect(() => {
    if (currTab === 0 || currTab === 1) {
      setCategories(findTopCategories());
      setLabels(findTopTags());
    }
  }, [currTab, appsToShow])

  const getUserProfile = (username) => {
    if (serverside === true || !isCloud) {
      setCreatorProfile({})
      return;
    }

    fetch(`${globalUrl}/api/v1/users/creators/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for WORKFLOW EXECUTION :O!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success !== false) {
          console.log("creator profile: ", responseJson)
          setCreatorProfile(responseJson);
        } else {
          setCreatorProfile({})
        }
      })
      .catch((error) => {
        console.log(error);
        setCreatorProfile({})
      });
  };

  useEffect(() => {
    if (serverside) {
      return null;
    }
  }, [serverside]);

  const getApps = () => {
    // Get apps from localstorage
    var storageApps = []
    try {
      const appstorage = localStorage.getItem("apps")
      storageApps = JSON.parse(appstorage)
      if (storageApps === null || storageApps === undefined || storageApps.length === 0) {
        storageApps = []
      } else {
        setAppsToShow(storageApps)
        setOrgApps(storageApps)
        setApps(storageApps)
        // setFilteredApps(storageApps)
        // setAppSearchLoading(false)
      }
    } catch (e) {
      //console.log("Failed to get apps from localstorage: ", e)
    }

    setIsLoading(true);

    fetch(globalUrl + "/api/v1/apps", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        setIsLoading(false);
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");

          //if (isCloud) {
          //  window.location.pathname = "/search";
          //}
        }

        return response.json();
      })
      .then((responseJson) => {
        var privateapps = [];
        var valid = [];
        var invalid = [];
        for (var key in responseJson) {
          const app = responseJson[key];

          if (app.categories !== undefined && app.categories !== null && app?.categories.includes("Eradication")) {
            app.categories = ["EDR"]
          }

          if (app.is_valid && !(!app.activated && app.generated)) {
            privateapps.push(app);
          } else if (
            app.private_id !== undefined &&
            app.private_id.length > 0
          ) {
            valid.push(app);
          } else {
            invalid.push(app);
          }
        }

        privateapps.push(...valid);
        privateapps.push(...invalid);
        console.log("privateapps: setting apps ", privateapps)
        setAppsToShow(privateapps);
        setOrgApps(privateapps);
        setApps(privateapps);

        // setFilteredApps(privateapps);
        if (privateapps.length > 0) {
          if (selectedApp.id === undefined || selectedApp.id === null) {
            if (privateapps[0].owner !== undefined && privateapps[0].owner !== null) {
              getUserProfile(privateapps[0].owner);
            }

            // setContact(privateapps[0].contact_info)

            // setSelectedApp(privateapps[0]);
            // setSharingConfiguration(privateapps[0].sharing === true ? "public" : "you")
          }

          // if (
          //   privateapps[0].actions !== null &&
          //   privateapps[0].actions.length > 0
          // ) {
          //   setSelectedAction(privateapps[0].actions[0]);
          // } else {
          //   setSelectedAction({});
          // }
        }

        if (privateapps.length > 0 && storageApps.length === 0) {
          try {
            localStorage.setItem("apps", JSON.stringify(privateapps))
          } catch (e) {
            console.log("Failed to set apps in localstorage: ", e)
          }
        }

        //setTimeout(() => {
        //	setFirstLoad(false)
        //}, 5000)
      })
      .catch((error) => {
        toast(error.toString());
        setIsLoading(false);
      });
  };

  // Locally hotloads app from folder
  const hotloadApps = () => {
    toast("Hotloading apps from location in .env");
    setIsLoading(true);
    fetch(globalUrl + "/api/v1/apps/run_hotload", {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          //toast("Hotloaded apps!")
          getApps();
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          toast("Successfully finished hotload");
        } else {
          console.log("failed hotload: ", responseJson)
          // toast(`Failed hotload: ${responseJson.reason}`);
          //(responseJson.reason !== undefined && responseJson.reason.length > 0) {
        }
      })
      .catch((error) => {
        toast(`Failed hotload: ${error.toString()}`);
      });
  };


  // Load data e.g. from github
  const getSpecificApps = (url, forceUpdate) => {
    setValidation(true);

    setIsLoading(true);
    //start()

    const parsedData = {
      url: url,
      branch: downloadBranch || "master",
    };

    if (field1.length > 0) {
      parsedData["field_1"] = field1;
    }

    if (field2.length > 0) {
      parsedData["field_2"] = field2;
    }

    parsedData["force_update"] = forceUpdate;

    toast("Getting specific apps from your URL.");
    var cors = "cors";
    fetch(globalUrl + "/api/v1/apps/get_existing", {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify(parsedData),
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          toast("Loaded existing apps!");
        }

        //stop()
        setIsLoading(false);
        setValidation(false);
        return response.json();
      })
      .then((responseJson) => {
        console.log("DATA: ", responseJson);
        if (responseJson.reason !== undefined) {
          toast("Failed loading: " + responseJson.reason);
        }
      })
      .catch((error) => {
        console.log("ERROR: ", error.toString());
        //toast(error.toString());
        //stop()

        setIsLoading(false);
        setValidation(false);
      });
  };

  const handleGithubValidation = (forceUpdate) => {
    getSpecificApps(openApi, forceUpdate);
    setLoadAppsModalOpen(false);
  };


  const appsModalLoad = loadAppsModalOpen ? (
    <Dialog
      open={loadAppsModalOpen}
      onClose={() => {
        setOpenApi("");
        setLoadAppsModalOpen(false);
        setField1("");
        setField2("");
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: "1px solid #494949",
          minWidth: '440px',
          fontFamily: theme?.typography?.fontFamily,
          backgroundColor: "#212121",
          zIndex: 1000,
          '& .MuiDialogContent-root': {
            backgroundColor: "#212121",
          },
          '& .MuiDialogTitle-root': {
            backgroundColor: "#212121",
          },
          '& .MuiTypography-root': {
            fontFamily: theme?.typography?.fontFamily,
          },
          '& .MuiButton-root': {
            fontFamily: theme?.typography?.fontFamily,
          },
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          pt: 2,
          pl: 3,
          pr: 2,
        }}
      >
        <Typography component="div" sx={{ fontWeight: 500, color: "#F1F1F1", fontSize: "22px" }}>
          Load from Github Repository
        </Typography>
        <IconButton
          onClick={() => {
            setOpenApi("");
            setLoadAppsModalOpen(false);
            setField1("");
            setField2("");
          }}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 3, px: 3 }}>
        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Repository (supported: github, gitlab, bitbucket)
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          defaultValue="https://github.com/frikky/shuffle-apps"
          placeholder="https://github.com/frikky/shuffle-apps"
          value={openApi}
          onChange={(e) => setOpenApi(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              height: '50px',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
            },
          }}
        />

        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Branch (default value is "master")
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={downloadBranch}
          onChange={(e) => setDownloadBranch(e.target.value)}
          placeholder="master"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              height: '50px',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
            },
          }}
        />

        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Authentication (optional - private repos etc)
        </Typography>
        <div style={{ display: 'flex', gap: 16 }}>
          <TextField
            fullWidth
            variant="outlined"
            type="text"
            placeholder="Username / APIkey (optional)"
            value={field1}
            onChange={(e) => setField1(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                height: '50px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
              },
            }}
          />
          <TextField
            fullWidth
            variant="outlined"
            type="password"
            placeholder="Password (optional)"
            value={field2}
            onChange={(e) => setField2(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                height: '50px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
              },
            }}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{
        p: 3,
        backgroundColor: "#212121"
      }}>
        <Button
          variant="contained"
          sx={{
            bgcolor: '#494949',
            '&:hover': { bgcolor: '#494949' },
            textTransform: 'none',
            borderRadius: 1,
            py: 1,
            px: 3,
            color: "#fff",
            fontFamily: theme?.typography?.fontFamily
          }}
          onClick={() => setLoadAppsModalOpen(false)}
        >
          Cancel
        </Button>
        {!isCloud && (
          <Button
            variant="contained"
            sx={{
              bgcolor: '#494949',
              '&:hover': { bgcolor: '#494949' },
              textTransform: 'none',
              borderRadius: 1,
              py: 1,
              px: 3,
              color: "#fff",
              fontFamily: theme?.typography?.fontFamily
            }}
            disabled={openApi.length === 0 || !openApi.includes("http")}
            onClick={() => handleGithubValidation(true)}
          >
            Force Update
          </Button>
        )}
        <Button
          variant="contained"
          sx={{
            bgcolor: '#FF8544',
            '&:hover': { bgcolor: '#FF8544' },
            textTransform: 'none',
            borderRadius: 1,
            py: 1,
            px: 3,
            color: "black",
            fontFamily: theme?.typography?.fontFamily
          }}
          disabled={openApi.length === 0 || !openApi.includes("http")}
          onClick={() => handleGithubValidation(false)}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;


  const findTopCategories = () => {
    const categoryCountMap = {};
    const apps = currTab === 1 ? userApps : orgApps;
    // Check if userAndOrgsApp is an array before iterating over it and Find top 10 Category from the apps
    if (Array.isArray(apps)) {
      apps.forEach((app) => {
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

      const topCategories = categoryArray.slice(0, 7);

      return topCategories;
    }
  };

  const findTopTags = () => {
    const tagCountMap = {};
    const apps = currTab === 1 ? userApps : orgApps;

    if (Array.isArray(apps)) {
      apps.forEach((app) => {
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

    const topTags = tagArray.slice(0, 8);

    return topTags;
  };

  const handleCreateApp = (e) => {
    e.preventDefault();
    setCreateAppModalOpen(true);
    // setOpenModal(true);
  };


  useEffect(() => {
    const apps = currTab === 1 ? userApps : orgApps;
    const filteredUserAppdata = filterApps(apps, searchQuery, selectedCategory, selectedLabel);
    setAppsToShow(filteredUserAppdata);
  }, [searchQuery, selectedCategory, selectedLabel, currTab]);


  const handleTabChange = (event, newTab) => {
    setCurrTab(newTab);

    // Apply filters immediately when changing tabs
    if (newTab === 0) {
      const filteredOrgApps = filterApps(orgApps, searchQuery, selectedCategory, selectedLabel);
      setAppsToShow(filteredOrgApps);
    } else if (newTab === 1) {
      const filteredUserApps = filterApps(userApps, searchQuery, selectedCategory, selectedLabel);
      setAppsToShow(filteredUserApps);
    }

    // Update URL query params based on tab index
    const tabMapping = {
      0: 'org_apps',
      1: 'my_apps',
      2: 'all_apps'
    };

    const queryParams = new URLSearchParams(location.search);
    queryParams.set('tab', tabMapping[newTab]);

    // Maintain search query in URL regardless of tab
    if (searchQuery) {
      queryParams.set('q', searchQuery);
    } else {
      queryParams.delete('q');
    }

    navigate(`${location.pathname}?${queryParams.toString()}`);
  };

  // Update useEffect for filtering without URL manipulation
  useEffect(() => {
    if (currTab === 2) return; // Skip for "Discover Apps" tab as it uses Algolia

    const apps = currTab === 1 ? userApps : orgApps;
    const filteredApps = filterApps(apps, searchQuery, selectedCategory, selectedLabel);
    setAppsToShow(filteredApps);
  }, [searchQuery, selectedCategory, selectedLabel, currTab, userApps, orgApps]);

  // Add URL update only when search is performed
  const handleSearchChange = (event) => {
    const newSearchQuery = event.target.value;
    setSearchQuery(newSearchQuery);

    // Update URL only when user performs search
    const queryParams = new URLSearchParams(location.search);
    if (newSearchQuery) {
      queryParams.set('q', newSearchQuery);
    } else {
      queryParams.delete('q');
    }
    window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
  };

  const boxStyle = {
    color: "white",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    margin: "auto",
    maxWidth: "70%",
    fontFamily: theme?.typography?.fontFamily,
    // padding: '20px 380px',
  };


  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategory(value);
  };

  const handleLabelChange = (event) => {
    const value = event.target.value;
    setSelectedLabel(value);
  };

  const handleAppClick = (app) => {
    setSelectedApp(app);
    setOpenModal(true);
  }

  const handleAppModalClose = () => {
    setOpenModal(false)
  }

  const tabStyle = {
    textTransform: 'none',
    marginRight: 20,
    fontFamily: theme?.typography?.fontFamily,
    fontSize: 16,
    borderBottom: "5px solid transparent",
    minHeight: "48px",
    padding: "12px 16px",
  }

  const tabActive = {
    borderBottom: "5px solid #FF8544",
    borderRadius: "2px",
    color: "#FF8544"
  }

  return (
    <div style={{ paddingTop: 70, paddingLeft: leftSideBarOpenByClick ? 200 : 0, transition: "padding-left 0.3s ease", backgroundColor: "#1A1A1A", fontFamily: theme?.typography?.fontFamily, zoom: 0.7, }}>
      <InstantSearch searchClient={searchClient} indexName="appsearch">
        <AppModal
          open={openModal}
          onClose={handleAppModalClose}
          app={selectedApp}
          userdata={userdata}
          globalUrl={globalUrl}
          getApps={getApps}
        />
        <AppCreationModal
          open={createAppModalOpen}
          onClose={() => setCreateAppModalOpen(false)}
          theme={theme}
          globalUrl={globalUrl}
          isCloud={isCloud}
        />
        {appsModalLoad}
        <div style={boxStyle}>
          <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
            <Typography variant="h4" style={{ marginBottom: 20, paddingLeft: 15, textTransform: 'none', fontFamily: theme?.typography?.fontFamily }}>
				{currTab === 0 ? "Org" : currTab === 1 ?  "Your" : "Discover"} Apps
            </Typography>
            {isCloud ? null : (
              <span style={{ display: "flex", gap: 15 }}>
                {userdata === undefined || userdata === null || isLoading ? null : (
                  <Tooltip
                    title={"Reload apps locally"}
                    style={{ marginTop: "28px" }}
                    placement="bottom"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "rgba(33, 33, 33, 1)",
                          color: "rgba(241, 241, 241, 1)",
                          fontSize: 14,
                          border: "1px solid rgba(73, 73, 73, 1)",
                          fontFamily: theme?.typography?.fontFamily,
                        }
                      }
                    }}
                  >
                    <Button
                      variant="contained"
                      style={{
                        height: 45,
                        minWidth: 45,
                        backgroundColor: "#2F2F2F",
                        borderRadius: 4,
                        padding: "8px 16px",
                      }}
                      disabled={isLoading}
                      onClick={() => {
                        hotloadApps();
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={20} style={{ color: "#FF8544" }} />
                      ) : (
                        <CachedIcon style={{ color: "#F1F1F1" }} />
                      )}
                    </Button>
                  </Tooltip>
                )}

                {userdata === undefined || userdata === null || userdata.admin === "false" ? null :
                  <Tooltip
                    title={"Download from Github"}
                    style={{ marginTop: "28px" }}
                    placement="bottom"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "rgba(33, 33, 33, 1)",
                          color: "rgba(241, 241, 241, 1)",
                          fontSize: 14,
                          border: "1px solid rgba(73, 73, 73, 1)",
                          fontFamily: theme?.typography?.fontFamily,
                        }
                      }
                    }}
                  >
                    <Button
                      variant="contained"
                      style={{
                        height: 45,
                        minWidth: 45,
                        backgroundColor: "#2F2F2F",
                        borderRadius: 4,
                        padding: "8px 16px",
                      }}
                      disabled={isLoading}
                      onClick={() => {
                        console.log("opening modal")
                        setOpenApi(baseRepository);
                        setLoadAppsModalOpen(true);
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={20} style={{ color: "#FF8544" }} />
                      ) : (
                        <CloudDownloadIcon style={{ color: "#F1F1F1" }} />
                      )}
                    </Button>
                  </Tooltip>
                }
              </span>
            )}
          </div>
          <div style={{ borderBottom: '1px solid gray', marginBottom: 30 }}>
            <Tabs
              value={currTab}
              onChange={(event, newTab) => handleTabChange(event, newTab)}
              style={{
                fontFamily: theme?.typography?.fontFamily,
                fontSize: 16,
                marginBottom: "-2px"
              }}
              TabIndicatorProps={{ style: { display: 'none' } }}
            >
              <Tab
                label="Organization Apps"
                style={{
                  ...tabStyle,
                  ...(currTab === 0 ? tabActive : {})
                }}
              />
              <Tab
                label="My Apps"
                style={{
                  ...tabStyle,
                  ...(currTab === 1 ? tabActive : {})
                }}
              />
              <Tab
                label="Discover Public Apps"
                style={{
                  ...tabStyle,
                  marginRight: 0,
                  ...(currTab === 2 ? tabActive : {})
                }}
              />
            </Tabs>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 20, height: 45, paddingRight: 25 }}>
            <div style={{
              width: "25%",
              minWidth: "25%",
              maxWidth: "25%"
            }}>
              {(currTab === 0 || currTab === 1) ? (
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={currTab === 1 ? "Search your apps" : "Search org apps"}
                  disabled={!isLoggedIn}
                  value={searchQuery}
                  id="shuffle_search_field"
                  onChange={handleSearchChange}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                    }
                  }}
                  limit={5}
                  InputProps={{
                    style: {
                      borderRadius: 4,
                      height: 45
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        {searchQuery.length === 0 ? <SearchIcon /> : (
                          <ClearIcon
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSearchQuery("")
                              const queryParams = new URLSearchParams(location.search);
                              queryParams.delete('q');
                              window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
                            }}
                          />
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <CustomSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              )}
            </div>
            <div style={{
              width: "25%",
              minWidth: "25%",
              maxWidth: "25%",
              position: 'relative'
            }}>
              {currTab === 2 ? (
                <CustomCategoryDropdown attribute="categories" />
              ) : (
                <>
                  <Select
                    fullWidth
                    variant="outlined"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    disabled={!isLoggedIn}
                    displayEmpty
                    multiple
                    style={{
                      borderRadius: 4,
                      height: 45,
                      fontFamily: theme?.typography?.fontFamily
                    }}
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'All Categories';
                      return (
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '90%'
                        }}>
                          {selected.join(', ')}
                        </div>
                      );
                    }}
                  >
                    <MenuItem disabled value="" style={{ fontFamily: theme?.typography?.fontFamily }}>
                      All Categories
                    </MenuItem>
                    {categories?.map((category) => (
                      <MenuItem key={category.category} value={category.category} style={{ fontFamily: theme?.typography?.fontFamily, fontSize: 16 }}>
                        <Checkbox checked={selectedCategory.includes(category.category)} />
                        {category.category}
                      </MenuItem>
                    ))}
                  </Select>
                  {selectedCategory.length > 0 && (
                    <ClearIcon
                      style={{
                        position: 'absolute',
                        right: 35,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: 20,
                        zIndex: 1000
                      }}
                      onClick={() => setSelectedCategory([])}
                    />
                  )}
                </>
              )}
            </div>
            <div style={{
              width: "25%",
              minWidth: "25%",
              maxWidth: "25%",
              position: 'relative'
            }}>
              {currTab === 2 ? (
                <CustomLabelDropdown attribute="action_labels" />
              ) : (
                <>
                  <Select
                    fullWidth
                    variant="outlined"
                    value={selectedLabel}
                    onChange={handleLabelChange}
                    disabled={!isLoggedIn}
                    displayEmpty
                    multiple
                    style={{
                      borderRadius: 4,
                      height: 45,
                      fontFamily: theme?.typography?.fontFamily
                    }}
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'All Labels';
                      return (
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '90%'
                        }}>
                          {selected.join(', ')}
                        </div>
                      );
                    }}
                  >
                    <MenuItem disabled value="" style={{ fontFamily: theme?.typography?.fontFamily }}>
                      All Labels
                    </MenuItem>
                    {labels?.map((tag) => (
                      <MenuItem key={tag.tag} value={tag.tag} style={{ fontFamily: theme?.typography?.fontFamily, fontSize: 16 }}>
                        <Checkbox checked={selectedLabel.includes(tag.tag)} />
                        {tag.tag}
                      </MenuItem>
                    ))}
                  </Select>
                  {selectedLabel.length > 0 && (
                    <ClearIcon
                      style={{
                        position: 'absolute',
                        right: 35,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: 20,
                        zIndex: 1000
                      }}
                      onClick={() => setSelectedLabel([])}
                    />
                  )}
                </>
              )}
            </div>
            <div style={{
              width: "25%",
              minWidth: "25%",
              maxWidth: "25%"
            }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateApp}
                disabled={!isLoggedIn}
                style={{
                  height: "100%",
                  width: '100%',
                  borderRadius: '4px',
                  textTransform: 'none',
                  backgroundColor: "#FF8544",
                  color: "#1A1A1A",
                  fontFamily: theme?.typography?.fontFamily,
                  fontSize: 16,
                  fontWeight: 500
                }}
                startIcon={<AddIcon style={{ color: "#1A1A1A" }} />}
              >
                Create an App
              </Button>
            </div>
          </div>
          <div>

            {
              currTab === 0 && (
                <div style={{ minHeight: 570 }}>
                  {isLoading ? (
                    <LoadingGrid />
                  ) : (
                    isLoggedIn && !isLoading ? (
                      <>
                        {appsToShow?.length > 0 && appsToShow !== undefined && !isLoading ? (
                          <div style={{
                            marginTop: 16,
                            width: "100%",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
                            gap: "20px",
                            justifyContent: "space-between",
                            alignItems: "start",
                            padding: "0 10px",
                            paddingBottom: 40
                          }}>
                            {appsToShow.map((data, index) => (
                              <AppCard
                                key={index}
                                data={data}
                                index={index}
                                mouseHoverIndex={mouseHoverIndex}
                                setMouseHoverIndex={setMouseHoverIndex}
                                globalUrl={globalUrl}
                                deactivatedIndexes={deactivatedIndexes}
                                currTab={currTab}
                                handleAppClick={handleAppClick}
                                leftSideBarOpenByClick={leftSideBarOpenByClick}
                                userdata={userdata}
                                fetchApps={fetchApps}

								setUserApps={setUserApps}
								appsToShow={appsToShow}
								setAppsToShow={setAppsToShow}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ width: "100%", marginTop: 60, textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <AppSelection
                              userdata={userdata}
                              globalUrl={globalUrl}
                              appFramework={appFramework}
                              setAppFramework={setAppFramework}
                              defaultSearch={defaultSearch}
                              setDefaultSearch={setDefaultSearch}
                              checkLogin={checkLogin}
                              isAppPage={true}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <LoginPrompt />
                    )
                  )}
                </div>
              )
            }
            {
              currTab === 1 && (
                <div style={{ minHeight: 570 }}>
                  {isLoading ? (
                    <LoadingGrid />
                  ) : (
                    isLoggedIn && !isLoading ? (
                      <>
                        {appsToShow?.length > 0 && appsToShow !== undefined ? (
                          <div style={{
                            marginTop: 16,
                            width: "100%",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(365px, 1fr))",
                            gap: "20px",
                            justifyContent: "space-between",
                            alignItems: "start",
                            padding: "0 10px",
                            paddingBottom: 40
                          }}>
                            {appsToShow.map((data, index) => (
                              <AppCard key={index} data={data} index={index} mouseHoverIndex={mouseHoverIndex} setMouseHoverIndex={setMouseHoverIndex} globalUrl={globalUrl} deactivatedIndexes={deactivatedIndexes} currTab={currTab} userdata={userdata}
                                handleAppClick={handleAppClick} leftSideBarOpenByClick={leftSideBarOpenByClick}
                                fetchApps={fetchApps}
								setUserApps={setUserApps}
								appsToShow={appsToShow}
								setAppsToShow={setAppsToShow}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ width: "100%", marginTop: 60, textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <AppSelection
                              userdata={userdata}
                              globalUrl={globalUrl}
                              appFramework={appFramework}
                              setAppFramework={setAppFramework}
                              defaultSearch={defaultSearch}
                              setDefaultSearch={setDefaultSearch}
                              checkLogin={checkLogin}
                              isAppPage={true}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <LoginPrompt />
                    )
                  )}
                </div>
              )
            }

            {
              currTab === 2 &&
              <CustomHits
                isLoggedIn={isLoggedIn}
                userdata={userdata}
                handleAppClick={handleAppClick}
                setIsAnyAppActivated={setIsAnyAppActivated}
                hitsPerPage={5}
                globalUrl={globalUrl}
                searchQuery={searchQuery}
                mouseHoverIndex={mouseHoverIndex}
                setMouseHoverIndex={setMouseHoverIndex}
                currTab={currTab}
                leftSideBarOpenByClick={leftSideBarOpenByClick}
              />
            }
          </div>
        </div >
        <Configure clickAnalytics />
      </InstantSearch>
    </div>
  );
};

export default Apps2;
