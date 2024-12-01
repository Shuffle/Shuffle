import React, { useState, useEffect, useContext, useCallback, memo, useMemo, useRef } from "react";
import theme from "../theme.jsx";
import { isMobile } from "react-device-detect";
import AppGrid from "../components/AppGrid.jsx";
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
} from "@mui/material";
import { Context } from "../context/ContextApi.jsx";
import Add from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { ClearRefinements, connectHits, connectSearchBox, connectStateResults, InstantSearch, RefinementList, connectRefinementList, Configure } from "react-instantsearch-dom";
import { removeQuery } from "../components/ScrollToTop.jsx";
import { toast } from "react-toastify";
import algoliasearch from "algoliasearch/lite";
import { debounce } from "lodash";
import AppSelection from "../components/AppSelection.jsx";
import AppModal from "../components/AppModal.jsx";


const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
);

// AppCard Component
const AppCard = ({ data, index, mouseHoverIndex, setMouseHoverIndex, globalUrl, deactivatedIndexes, currTab, handleAppClick, leftSideBarOpenByClick, userdata }) => {
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "localhost:3000";
  const appUrl = isCloud ? `/apps/${data.id}` : `https://shuffler.io/apps/${data.id}`;
  var canEditApp = userdata.admin === "true" || userdata.id === data?.owner || data?.owner === "" || (userdata.admin === "true" && userdata.active_org.id === data?.reference_org) || !data?.generated

  const paperStyle = {
    backgroundColor: mouseHoverIndex === index ? "rgba(26, 26, 26, 1)" : "#212121",
    color: "rgba(241, 241, 241, 1)",
    cursor: "pointer",
    fontFamily: "Inter",
    // position: "relative",
    width: "100%",
    height: 96,
    borderRadius: 8,
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
    transition: "width 0.3s ease",
  };

  return (
    <Grid item xs={12} key={index}>
      <Paper elevation={0}
        style={paperStyle}
        onMouseOver={() => setMouseHoverIndex(index)}
        onMouseOut={() => setMouseHoverIndex(-1)}
      >
        <ButtonBase
          style={{
            borderRadius: 6,
            fontSize: 16,
            overflow: "hidden",
            display: "flex",
            fontFamily: "Inter",
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
            fontFamily: "Inter"
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 600,
              whiteSpace: "nowrap",
              marginLeft: 8,
              gap: 8
            }}>
              {data.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
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
            }}>
              <div style={{ overflow: "hidden", textAlign: 'start' }}>
                {data.generated !== true && data.tags && data.tags.slice(0, 2).map((tag, tagIndex) => (
                  <span key={tagIndex}>
                    {tag}
                    {tagIndex < data.tags.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
              {/* Deactivate button */}
              {currTab === 0 && !deactivatedIndexes.includes(index) && mouseHoverIndex === index && data.generated === true && (
                <div style={{
                  display: "flex",
                  gap: 8
                }}>
                  {
                    canEditApp && (
                      <button style={{ backgroundColor: "rgba(73, 73, 73, 1)", border: "none", cursor: "pointer", color: "white", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <EditIcon />
                      </button>
                    )
                  }
                  <Button
                    className="deactivate-button"
                    style={{
                      // marginLeft: 15,
                      width: 102,
                      height: 35,
                      borderRadius: 6,
                      backgroundColor: "rgba(73, 73, 73, 1)",
                      color: "rgba(241, 241, 241, 1)",
                      textTransform: "none",
                      fontFamily: "Inter"
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      const url = `${globalUrl}/api/v1/apps/${data.id}/deactivate`;

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
                            toast.success("App Deactivated Successfully. Reload UI to see updated changes.");
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
  isLoading,
  isLoggedIn,
  leftSideBarOpenByClick
}) => {
  const [hoverEffect, setHoverEffect] = useState(-1);
  const [allActivatedAppIds, setAllActivatedAppIds] = useState(userdata?.active_apps);
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
  const [deactivatedIndexes, setDeactivatedIndexes] = React.useState([]);

  const normalizedString = (name) => {
    if (typeof name === 'string') {
      return name.replace(/_/g, ' ');
    } else {
      return name;
    }
  };


  //Function for activation and deactivation of app
  const handleActivateButton = (event, data, type) => {

    //use prevent default so it will stop redirection to the app page
    event.preventDefault();
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

  const [showNoAppFound, setShowNoAppFound] = useState(false);

  //show some delay to show the "App Not Found." so it doesn't not show while changing tab.
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNoAppFound(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);



  return (
    <div>
      {!isLoading ? (
        <div>
          {hits?.length === 0 && searchQuery.length >= 0 && showNoAppFound ? (
            <div style={{ marginTop: 100, fontSize: 20, fontWeight: 500, width: "100%", textAlign: "center" }}>
              <Typography variant="body1">No Apps Found</Typography>
            </div>
          ) : (
            <Grid item spacing={2} justifyContent="flex-start">
              <div
                style={{
                  minHeight: 570,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}>
                <div
                  style={{
                    rowGap: 16,
                    columnGap: 16,
                    marginTop: 16,
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "flex-start",
                    maxHeight: 570,
                    scrollbarWidth: "thin",
                    scrollbarColor: "#494949 #2f2f2f",
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
                        <div
                          onClick={
                            () => {
                              handleAppClick(data);
                            }
                          }
                          style={{
                            color: "#f85a3e",
                          }}
                        >
                          <Paper
                            elevation={0}
                            style={{
                              backgroundColor: hoverEffect === index ? "rgba(26, 26, 26, 1)" : "#1A1A1A",
                              color: "rgba(241, 241, 241, 1)",
                              cursor: "pointer",
                              position: "relative",
                              width: leftSideBarOpenByClick ? 325 : 365,
                              height: 96,
                              borderRadius: 8,
                              boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
                              marginBottom: 20,
                            }}
                            onMouseEnter={() => {
                              setHoverEffect(index);
                            }}
                            onMouseLeave={() => {
                              setHoverEffect(-1);
                            }}
                          >
                            <ButtonBase style={{
                              borderRadius: 6,
                              fontSize: 16,
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "flex-start",
                              width: '100%',
                              backgroundColor: hoverEffect === index ? "#2F2F2F" : "#212121"
                            }}>
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
                                  gap: 8,
                                  fontWeight: '400',
                                  overflow: "hidden",
                                  margin: "12px 0",
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
                                    color: '#F1F1F1'
                                  }}
                                >
                                  {(allActivatedAppIds && allActivatedAppIds.includes(data.objectID)) && <Box sx={{ width: 8, height: 8, backgroundColor: "#02CB70", borderRadius: '50%' }} />}
                                  {normalizedString(data.name)}
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
                                    width: 230,
                                    textAlign: 'start',
                                    color: "rgba(158, 158, 158, 1)",
                                  }}
                                >
                                  <div style={{ marginBottom: 15, }}>
                                    {hoverEffect === index && isCloud ? (
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
                                      <div style={{ width: 230, textOverflow: "ellipsis", overflow: 'hidden', whiteSpace: 'nowrap', }}>
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
                                  <div style={{ position: 'relative', bottom: 5 }}>
                                    {hoverEffect === index && isCloud && (
                                      <div>
                                        {allActivatedAppIds && allActivatedAppIds.includes(data.objectID) ? (
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
                                        ) : (
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
                                            Activate
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </ButtonBase>
                          </Paper>
                        </div>
                      </Zoom>
                    );
                  })}
                </div>
              </div>
            </Grid>
          )}
        </div>
      ) : (
        <div><Box sx={{ position: 'absolute', top: '30%', left: '50%', }}> <CircularProgress /></Box></div>
      )}
    </div>
  );
}



// Custom SearchBox Component
const SearchBox = ({ refine, searchQuery, setSearchQuery }) => {
  const inputRef = useRef(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

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
      placeholder="Search for apps"
      value={localQuery}
      id="shuffle_search_field"
      inputRef={inputRef}
      onChange={handleChange}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
        }
      }}
      style={{ borderRadius: 8, height: 45, fontFamily: "Inter", flex: 1 }}
      InputProps={{
        style: {
          borderRadius: 8,
          height: 45
        },
        endAdornment: (
          <InputAdornment position="end">
            {localQuery?.length === 0 ? <Search /> : (
              <ClearIcon
                style={{
                  cursor: "pointer",
                  marginRight: 10
                }}
                onClick={() => {
                  setLocalQuery('');
                  debouncedRefine('');
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
    <Select
      fullWidth
      variant="outlined"
      value={currentRefinement}
      onChange={handleChange}
      displayEmpty
      multiple
      style={{ borderRadius: 8, height: 45, fontFamily: "Inter", flex: 1 }}
      renderValue={(selected) => selected.length ? selected.join(', ') : 'All Categories'}
    >
      <MenuItem disabled value="" style={{ fontFamily: "Inter" }}>
        All Categories
      </MenuItem>
      {items.map(item => (
        <MenuItem key={item.label} value={item.label} style={{ fontFamily: "Inter" }}>
          <Checkbox checked={currentRefinement.includes(item.label)} />
          {item.label} ({item.count})
        </MenuItem>
      ))}
    </Select>
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
    <Select
      fullWidth
      variant="outlined"
      value={currentRefinement}
      onChange={handleChange}
      displayEmpty
      multiple
      style={{ borderRadius: 8, height: 45, fontFamily: "Inter", flex: 1 }}
      renderValue={(selected) => selected.length ? selected.join(', ') : 'All Labels'}
    >
      <MenuItem disabled value="">
        All Labels
      </MenuItem>
      {items.map(item => (
        <MenuItem key={item.label} value={item.label}>
          <Checkbox checked={currentRefinement.includes(item.label)} />
          {item.label} ({item.count})
        </MenuItem>
      ))}
    </Select>
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
  useEffect(() => {
    const fetchApps = async () => {
      const baseUrl = globalUrl;
      let url;

      const userId = userdata?.id;
      if (currTab === 1 && userId) {
        url = `${baseUrl}/api/v1/users/${userId}/apps`;
      } else if (currTab === 0) {
        url = `${baseUrl}/api/v1/apps`;
      }
      setIsLoading(true);
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


  useEffect(() => {
    if (serverside) {
      return null;
    }
  }, [serverside]);


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
    // setOpenModal(true);
  };


  useEffect(() => {
    const apps = currTab === 1 ? userApps : orgApps;
    const filteredUserAppdata = filterApps(apps, searchQuery, selectedCategory, selectedLabel);
    setAppsToShow(filteredUserAppdata);
  }, [searchQuery, selectedCategory, selectedLabel, currTab]);


  const handleTabChange = (newTab) => {
    setCurrTab(newTab);
    // Apply filters immediately when changing tabs
    if (newTab === 0) {
      const filteredOrgApps = filterApps(orgApps, searchQuery, selectedCategory, selectedLabel);
      setAppsToShow(filteredOrgApps);
    } else if (newTab === 1) {
      const filteredUserApps = filterApps(userApps, searchQuery, selectedCategory, selectedLabel);
      setAppsToShow(filteredUserApps);
    }

    // Update URL query params
    const newQueryParam = newTab === 0 ? 'org_apps' : newTab === 1 ? 'my_apps' : 'all_apps';
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('tab', newQueryParam);
    // Only remove 'q' param if search is empty
    if (!searchQuery) {
      queryParams.delete('q');
    }
    window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
  };

  // Update useEffect to handle initial load and URL search params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchParam = queryParams.get('q');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Update useEffect for filtering to handle both tabs
  useEffect(() => {
    if (currTab === 2) return; // Skip for "Discover Apps" tab as it uses Algolia

    const apps = currTab === 1 ? userApps : orgApps;
    const filteredApps = filterApps(apps, searchQuery, selectedCategory, selectedLabel);
    setAppsToShow(filteredApps);

    // Update URL with search query
    const queryParams = new URLSearchParams(location.search);
    if (searchQuery) {
      queryParams.set('q', searchQuery);
    } else {
      queryParams.delete('q');
    }
    window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
  }, [searchQuery, selectedCategory, selectedLabel, currTab, userApps, orgApps]);

  // Update search input handler to maintain state across tabs
  const handleSearchChange = (event) => {
    const newSearchQuery = event.target.value;
    setSearchQuery(newSearchQuery);
  };

  const boxStyle = {
    color: "white",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    margin: "auto",
    maxWidth: "70%",
    fontFamily: "Inter",
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

  return (
    <div style={{ paddingTop: 70, minHeight: 1000, paddingLeft: leftSideBarOpenByClick ? 200 : 0, transition: "padding-left 0.3s ease", backgroundColor: "#1A1A1A" }}>
      <InstantSearch searchClient={searchClient} indexName="appsearch">
        <AppModal
          open={openModal}
          onClose={handleAppModalClose}
          app={selectedApp}
          userdata={userdata}
          globalUrl={globalUrl}
        />
        <div style={boxStyle}>
          <Typography variant="h4" style={{ marginBottom: 20, paddingLeft: 15, textTransform: 'none', fontFamily: "Inter" }}>
            Apps
          </Typography>
          <div style={{ borderBottom: '1px solid gray', marginBottom: 30, marginRight: 10 }}>
            <Tabs
              value={currTab}
              onChange={(event, newTab) => handleTabChange(newTab)}
              TabIndicatorProps={{ style: { height: '3px', borderRadius: 10 } }}
              style={{ fontFamily: "Inter" }}
            >
              <Tab label="Organization Apps" style={{ textTransform: 'none', marginRight: 20, fontFamily: "Inter" }} />
              <Tab label="My Apps" style={{ textTransform: 'none', marginRight: 20, fontFamily: "Inter" }} />
              <Tab label="Discover Apps" style={{ textTransform: 'none', fontFamily: "Inter" }} />
            </Tabs>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 20, height: 45 }}>
            <div style={{ flex: 1, width: '100%', borderRadius: '7px' }}>
              {
                (currTab === 0 || currTab === 1) &&
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search for apps"
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
                      borderRadius: 8,
                      height: 45
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        {searchQuery.length === 0 ? (
                          <Search />
                        ) : (
                          <ClearIcon
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSearchQuery("");
                            }}
                          />
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
              }
              {
                currTab === 2 &&
                <CustomSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              }
            </div>
            <div style={{ flex: 1, width: '100%', borderRadius: '7px', position: 'relative' }}>
              {currTab === 2 ? (
                <CustomCategoryDropdown attribute="categories" />
              ) : (
                <>
                  <Select
                    fullWidth
                    variant="outlined"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    displayEmpty
                    multiple
                    style={{ borderRadius: 8, height: 45, fontFamily: "Inter" }}
                    renderValue={(selected) => selected.length ? selected.join(', ') : 'All Categories'}
                  >
                    <MenuItem disabled value="" style={{ fontFamily: "Inter" }}>
                      All Categories
                    </MenuItem>
                    {categories?.map((category) => (
                      <MenuItem key={category.category} value={category.category} style={{ fontFamily: "Inter" }}>
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
            <div style={{ flex: 1, width: '100%', borderRadius: '7px', position: 'relative' }}>
              {currTab === 2 ? (
                <CustomLabelDropdown attribute="action_labels" />
              ) : (
                <>
                  <Select
                    fullWidth
                    variant="outlined"
                    value={selectedLabel}
                    onChange={handleLabelChange}
                    displayEmpty
                    multiple
                    style={{ borderRadius: 8, height: 45, fontFamily: "Inter" }}
                    renderValue={(selected) => selected.length ? selected.join(', ') : 'All Labels'}
                  >
                    <MenuItem disabled value="" style={{ fontFamily: "Inter" }}>
                      All Labels
                    </MenuItem>
                    {labels?.map((tag) => (
                      <MenuItem key={tag.tag} value={tag.tag} style={{ fontFamily: "Inter" }}>
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
            <div style={{ flex: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateApp}
                style={{ height: "100%", width: '100%', borderRadius: '7px', textTransform: 'none', backgroundColor: "#FF8544", color: "#1A1A1A", fontFamily: "Inter" }}
              >
                <Add style={{ marginRight: 10, color: "#1A1A1A", fontSize: 20 }} />
                Create an App
              </Button>
            </div>
          </div>
          <div>

            {
              currTab === 0 && (
                <div style={{ minHeight: 570 }}>
                  {isLoading ? (
                    <div style={{ width: "100%", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <CircularProgress />
                    </div>
                  ) : (
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
                          padding: "0 10px"
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
                  )}
                </div>
              )
            }
            {
              currTab === 1 && (
                <div style={{ minHeight: 570, overflowY: "auto", overflowX: "hidden" }}>
                  {isLoading ? (
                    <div style={{ width: "100%", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <CircularProgress />
                    </div>
                  ) : (
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
                          padding: "0 10px"
                        }}>
                          {appsToShow.map((data, index) => (
                            <AppCard key={index} data={data} index={index} mouseHoverIndex={mouseHoverIndex} setMouseHoverIndex={setMouseHoverIndex} globalUrl={globalUrl} deactivatedIndexes={deactivatedIndexes} currTab={currTab} userdata={userdata}
                              handleAppClick={handleAppClick} leftSideBarOpenByClick={leftSideBarOpenByClick}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ width: "100%", marginTop: 60, textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <Typography variant="body1">No Apps Found</Typography>
                        </div>
                      )}
                    </>
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
