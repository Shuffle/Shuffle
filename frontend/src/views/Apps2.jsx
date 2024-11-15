import React, { useState, useEffect, useContext, useCallback, memo, useMemo } from "react";
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
} from "@mui/material";
import { Context } from "../context/ContextApi.jsx";
import Add from '@mui/icons-material/Add';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { ClearRefinements, connectHits, connectSearchBox, connectStateResults, InstantSearch, RefinementList } from "react-instantsearch-dom";
import { removeQuery } from "../components/ScrollToTop.jsx";
import { toast } from "react-toastify";
import algoliasearch from "algoliasearch/lite";


const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
);

// AppCard Component
const AppCard = ({ data, index, mouseHoverIndex, setMouseHoverIndex, globalUrl, deactivatedIndexes }) => {
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "localhost:3000";
  const appUrl = isCloud ? `/apps/${data.id}` : `https://shuffler.io/apps/${data.id}`;

  const paperStyle = {
    backgroundColor: mouseHoverIndex === index ? "rgba(26, 26, 26, 1)" : "#1A1A1A",
    color: "rgba(241, 241, 241, 1)",
    cursor: "pointer",
    position: "relative",
    width: 365,
    height: 96,
    borderRadius: 8,
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
    marginBottom: 20,
  };

  return (
    <Grid item xs={12} key={index}>
      <a href={appUrl} rel="noopener noreferrer" style={{ textDecoration: "none", color: "#f85a3e" }}>
        <Paper elevation={0} style={paperStyle} onMouseOver={() => setMouseHoverIndex(index)} onMouseOut={() => setMouseHoverIndex(-1)}>
          <ButtonBase style={{
            borderRadius: 6,
            fontSize: 16,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-start",
            width: '100%',
            backgroundColor: mouseHoverIndex === index ? "#2F2F2F" : "#212121"
          }}>
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
              fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)"
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                overflow: "hidden",
                textOverflow: "ellipsis",
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
                width: 230,
                textAlign: 'start',
                marginLeft: 8,
                color: "rgba(158, 158, 158, 1)",
                display: "flex"
              }}>
                <div style={{ minWidth: 120, overflow: "hidden" }}>
                  {data.generated !== true && data.tags && data.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span key={tagIndex}>
                      {tag}
                      {tagIndex < data.tags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
                {/* Deactivate button logic */}
                {mouseHoverIndex === index ?
                  <Button style={{
                    marginLeft: 15,
                    width: 102,
                    height: 35,
                    borderRadius: 200,
                    backgroundColor: "rgba(73, 73, 73, 1)",
                    color: "rgba(241, 241, 241, 1)",
                    textTransform: "none",
                  }}
                    onClick={(event) => {
                      event.preventDefault();
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
                    }}>
                    Deactivate
                  </Button>
                  : null}
              </div>
            </div>
          </ButtonBase>
        </Paper>
      </a>
    </Grid>
  );
};


// Component to fetch all public app from the algolia.
const Hits = ({
  userdata,
  hits,
  algoliaSelectedCategories,
  setIsAnyAppActivated,
  searchQuery,
  globalUrl,
  isLoading,
  isLoggedIn,
}) => {
  var counted = 0;
  const [hoverEffect, setHoverEffect] = useState(-1);
  const [allActivatedAppIds, setAllActivatedAppIds] = useState(userdata?.active_apps);
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io" || window.location.host === "localhost:3000";
  const [deactivatedIndexes, setDeactivatedIndexes] = React.useState([]);

  const normalizedString = (name) => {
    if (typeof name === 'string') {
      return name.replace(/_/g, ' ');
    } else {
      return name;
    }
  };

  useEffect(() => {
    console.log("searchQuery", searchQuery)
    console.log("hits", hits)
  }, [searchQuery, hits])


  const filteredHits = hits?.filter(hit => {
    if (algoliaSelectedCategories?.length === 0) return true; // If no categories are selected, show all hits
    return hit.categories?.some(category => algoliaSelectedCategories.includes(category));
  });

  // const fetchUserData = useCallback(async () => {
  //   try {
  //     const response = await fetch(`${globalUrl}/api/v1/me`, {
  //       credentials: "include",
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //     const responseJson = await response.json();
  //     console.log("responseJson : user data", responseJson)
  //     if (responseJson.success) {
  //       setUserdata(responseJson);
  //       setAllActivatedAppIds(responseJson.active_apps);
  //       setIsLoggedIn(true);
  //     } else {
  //       setIsLoggedIn(false);
  //     }
  //   } catch (error) {
  //     console.log("Failed login check: ", error);
  //   }
  // }, [globalUrl]); // Added globalUrl as a dependency

  // useEffect(() => {
  //   fetchUserData();
  // }, [fetchUserData]); // Ensure fetchUserData is stable

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
          {filteredHits?.length === 0 && searchQuery.length >= 0 && showNoAppFound ? (
            <Typography variant="body1" style={{ marginTop: '30%' }}>No Apps Found</Typography>
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
                    // marginLeft: 24,
                    maxHeight: 570,
                    scrollbarWidth: "thin",
                    scrollbarColor: "#494949 #2f2f2f",
                  }}
                >
                  {filteredHits?.map((data, index) => {
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
                        <Grid>
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
                              style={{
                                backgroundColor: hoverEffect === index ? "rgba(26, 26, 26, 1)" : "#1A1A1A",
                                color: "rgba(241, 241, 241, 1)",
                                cursor: "pointer",
                                position: "relative",
                                width: 365,
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
                                    fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)"
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
                                      marginTop: 5
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
                          </a>
                        </Grid>
                      </Zoom>
                    );
                  })
                  }
                </div>
              </div>
            </Grid >
          )}
        </div>
      ) : (
        <div><Box sx={{ position: 'absolute', top: '30%', left: '50%', }}> <CircularProgress /></Box></div>
      )}
    </div>
  );
}

// Main Apps Component
const Apps2 = (props) => {
  const { globalUrl, isLoaded, serverside, userdata, isLoggedIn } = props;
  let navigate = useNavigate();
  const { leftSideBarOpenByClick } = useContext(Context);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [algoliaSelectedCategories, setAlgoliaSelectedCategories] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [algoliaSelectedLabels, setAlgoliaSelectedLabels] = useState([]);
  const [currTab, setCurrTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userApps, setUserApps] = useState([]);
  const [orgApps, setOrgApps] = useState([]);
  const [selectedCategoryForUsersAndOgsApps, setselectedCategoryForUsersAndOgsApps] = useState([]);
  const [selectedTagsForUserAndOrgApps, setSelectedTagsForUserAndOrgApps] = useState([]);
  const [appsToShow, setAppsToShow] = useState([]);
  const [deactivatedIndexes, setDeactivatedIndexes] = React.useState([]);
  const [IsAnyAppActivated, setIsAnyAppActivated] = useState(false);
  const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
  var counted = 0;
  const [showNoAppFound, setShowNoAppFound] = useState(false);


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
    } else {
      setCurrTab(0);
    }
  }, [location.search]);


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
      } else {
        return; // No need to fetch if not in the relevant tabs
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
          console.log("data from userApps", data)
          setAppsToShow(data);
          setUserApps(data);
          setIsLoading(false);
        } else if (currTab === 0) {
          console.log("data from orgApps", data)
          setAppsToShow(data);
          setOrgApps(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching apps:", err);
      }
    };

    fetchApps();
  }, [currTab, globalUrl, location.search]); // Added globalUrl to dependencies to avoid stale closures

  useEffect(() => {
    setSearchQuery("");
  }, [currTab])


  // Find top categories and tags based on the current tab
  useEffect(() => {
    if (currTab === 0) {
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

  const handleCreateApp = () => {
    navigate('/create-app');
  };


  useEffect(() => {
    const apps = currTab === 1 ? userApps : orgApps;
    // Search app based on app name, category, and tag
    const filteredUserAppdata = Array.isArray(apps) ? apps.filter((app) => {

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
        selectedCategory === "" || // If no category is selected, match all apps
        (app.categories && app.categories.some(category =>
          selectedCategory.includes(category)
        ))
      );

      const matchesSelectedTags = (
        selectedLabel === "" || // If no label is selected, match all apps
        (app.tags && app.tags.some(tag =>
          tag.toLowerCase().includes(selectedLabel.toLowerCase())
        ))
      );

      return matchesSearchQuery && matchesSelectedCategories && matchesSelectedTags;
    }) : [];
    
    setAppsToShow(filteredUserAppdata);
  }, [searchQuery, selectedCategory, selectedLabel]);


  const handleTabChange = (newTab) => {
    console.log("Current Tab", newTab)
    setCurrTab(newTab);
    if (newTab === 0) {
      setAppsToShow(orgApps)
      const categories = findTopCategories();
      const labels = findTopTags();
      setCategories(categories);
      setLabels(labels);
    }
    if (newTab === 1) {
      setAppsToShow(userApps)
    }
    const newQueryParam = newTab === 0 ? 'org_apps' : newTab === 1 ? 'my_apps' : 'all_apps';
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('tab', newQueryParam);
    queryParams.delete('q');
    window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
    console.log("Apps to show", appsToShow)
  };




  const boxStyle = {
    color: "white",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    margin: "auto",
    maxWidth: "60%",
    // padding: '20px 380px',
  };

  const CustomClearRefinements = connectStateResults(({ searchResults, ...rest }) => {
    const hasFilters = searchResults && searchResults.nbHits !== searchResults.nbSortedHits;
    return <ClearRefinements translations={{ reset: <span style={{ textDecoration: 'underline' }}>Clear All</span> }}  {...rest} disabled={!hasFilters} />;
  });




  const SearchBox = ({ refine, searchQuery, setSearchQuery }) => {
    const inputRef = React.useRef(null); // Create a ref for the input field

    // Check for query in URL and set it
    React.useEffect(() => {
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
          setSearchQuery(foundQuery); // Use setSearchQuery to update state
        }
      }
    }, [refine, setSearchQuery]); // Add dependencies

    // Use useEffect to focus the input when it mounts or when searchQuery changes
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [searchQuery]); // Focus whenever searchQuery changes

    console.log("searchQuery", searchQuery);

    return (
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search for apps"
        value={searchQuery}
        id="shuffle_search_field"
        inputRef={inputRef} // Attach the ref to the input field
        onChange={(event) => {
          setSearchQuery(event.target.value); // Update the search query
          removeQuery("q");
          refine(event.target.value); // Refine the search
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
          }
        }}
        limit={5}
        style={{ width: '100%', borderRadius: '7px', fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}
        InputProps={{
          style: {
            borderRadius: 8,
          },
          endAdornment: (
            <InputAdornment position="end">
              {searchQuery?.length === 0 ? <Search /> : (
                <ClearIcon
                  style={{
                    cursor: "pointer",
                    marginRight: 10
                  }}
                  onClick={() => {
                    setSearchQuery(''); // Clear the search query
                    removeQuery("q");
                    refine(''); // Clear the refinement
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
  const CustomHits = connectHits(Hits)


  const handleCategoryChange = (selectedValue) => {
    setAlgoliaSelectedCategories(prev => {
      if (prev.includes(selectedValue)) {
        // If the category is already selected, remove it
        return prev.filter(category => category !== selectedValue);
      } else {
        // Otherwise, add it to the selected categories
        return [...prev, selectedValue];
      }
    });
  };

  useEffect(() => {
    console.log("algoliaSelectedCategories", algoliaSelectedCategories)
  }, [algoliaSelectedCategories])


  return (
    <InstantSearch searchClient={searchClient} indexName="appsearch">
      <div style={boxStyle}>
        <Typography variant="h4" style={{ marginBottom: 20, paddingLeft: 15, textTransform: 'none' }}>
          Apps
        </Typography>
        <div style={{ borderBottom: '1px solid gray', marginBottom: 30, marginRight: 10 }}>
          <Tabs
            value={currTab}
            onChange={(event, newTab) => handleTabChange(newTab)}
            TabIndicatorProps={{ style: { height: '3px', borderRadius: 10 } }}
          >
            <Tab label="Organization Apps" style={{ textTransform: 'none', marginRight: 20 }} />
            <Tab label="My Apps" style={{ textTransform: 'none', marginRight: 20 }} />
            <Tab label="Discover Apps" style={{ textTransform: 'none' }} />
          </Tabs>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ flex: 1, marginRight: 10 }}>
            {
              (currTab === 0 || currTab === 1) &&
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search for apps"
                value={searchQuery}
                id="shuffle_search_field"
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                limit={5}
                style={{ width: '100%', borderRadius: '7px', fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}
                InputProps={{
                  style: {
                    borderRadius: 8,
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      {
                        searchQuery.length === 0 ? <Search /> : <ClearIcon />
                      }
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
          <div style={{ flex: 1, marginRight: 10 }}>
            <Select
              fullWidth
              variant="outlined"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              displayEmpty
              style={{ width: '100%', borderRadius: '7px', fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}
            >
              <MenuItem value="">
                All Categories
              </MenuItem>
              {
                currTab === 0 &&
                (
                  categories?.map((category) => (
                    <MenuItem key={category.category} value={category.category}>
                      {category.category}
                    </MenuItem>
                  ))
                )
              }
              {
                currTab === 2 &&
                (
                  <div style={{ padding: "5px 10px" }}>
                    <RefinementList
                      attribute="categories"
                      defaultRefinement={algoliaSelectedCategories}
                      onChange={(selectedItems) => {
                        handleCategoryChange(selectedItems);
                      }}
                      transformItems={(items) => {
                        console.log("items", items)
                        return items;
                      }}
                    />
                  </div>
                )
              }
            </Select>
          </div>
          <div style={{ flex: 1, marginRight: 10 }}>
            <Select
              fullWidth
              variant="outlined"
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              displayEmpty
              style={{ width: '100%', borderRadius: '7px', fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}
            >
              <MenuItem value="">
                All Labels
              </MenuItem>
              {
                currTab === 0 &&
                (
                  labels?.map((tag) => (
                    <MenuItem value={tag.tag}>
                      {tag.tag}
                    </MenuItem>
                  ))
                )
              }
              {
                currTab === 2 &&
                (
                  <div style={{ padding: "5px 10px" }}>
                    <RefinementList attribute="action_labels" />
                  </div>
                )
              }
            </Select>
          </div>
          <div style={{ flex: 1, marginRight: 10 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateApp}
              style={{ height: "100%", width: '100%', borderRadius: '7px', textTransform: 'none', fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}
            >
              <Add style={{ marginRight: 10 }} />
              Create an App
            </Button>
          </div>
        </div>
        <div>

          {
            currTab === 0 && (
              <div style={{ minHeight: 570, overflowY: "auto", overflowX: "hidden" }}>
                {isLoading ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <CircularProgress />
                  </div>
                ) : (
                  <>
                    {appsToShow?.length > 0 && appsToShow !== undefined && !isLoading ? (
                      <div style={{ rowGap: 16, columnGap: 16, marginTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "flex-start", maxHeight: 570, scrollbarWidth: "thin", scrollbarColor: "#494949 #2f2f2f" }}>
                        {appsToShow.map((data, index) => (
                          <AppCard key={index} data={data} index={index} mouseHoverIndex={mouseHoverIndex} setMouseHoverIndex={setMouseHoverIndex} globalUrl={globalUrl} deactivatedIndexes={deactivatedIndexes} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: 100, fontSize: 20, fontWeight: 500, width: "100%", textAlign: "center" }}>
                        No apps found
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          }
          {
            currTab === 1 &&
            (userApps.length > 0 ? (
              <div style={{
                minHeight: 570,
                overflowY: "auto",
                overflowX: "hidden",
              }}>
                <div style={{
                  rowGap: 16,
                  columnGap: 16,
                  marginTop: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  maxHeight: 570,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#494949 #2f2f2f",
                  // minHeight: 570
                }}>
                  {
                    isLoading ? <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    > <CircularProgress /></div>
                      :
                      (
                        userApps.map((data, index) => (
                          <AppCard key={index} data={data} index={index} mouseHoverIndex={mouseHoverIndex} setMouseHoverIndex={setMouseHoverIndex} globalUrl={globalUrl} deactivatedIndexes={deactivatedIndexes} />
                        ))
                      )
                  }
                </div>
              </div>
            ) : !isLoading && (
              <div
                style={{
                  marginTop: 100,
                  fontSize: 20,
                  fontWeight: 500,
                  width: "100%",
                  textAlign: "center",
                }}
              >No apps found</div>
            )
            )
          }

          {
            currTab === 2 &&

            <CustomHits
              isLoggedIn={isLoggedIn}
              userdata={userdata}
              setIsAnyAppActivated={setIsAnyAppActivated}
              hitsPerPage={5}
              globalUrl={globalUrl}
              searchQuery={searchQuery}
              algoliaSelectedCategories={algoliaSelectedCategories}
              mouseHoverIndex={mouseHoverIndex}
              setMouseHoverIndex={setMouseHoverIndex}
            />
          }
        </div>
        {/* <AppGrid
        maxRows={4}
        showSuggestion={true}
        globalUrl={globalUrl}
        isMobile={isMobile}
        userdata={userdata}
      /> */}
      </div >
    </InstantSearch>
  );
};

export default Apps2;
