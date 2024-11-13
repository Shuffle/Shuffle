import React, { useState, useEffect, useContext } from "react";
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
} from "@mui/material";
import { Context } from "../context/ContextApi.jsx";
import Add from '@mui/icons-material/Add';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { ClearRefinements, connectHits, connectSearchBox, connectStateResults, RefinementList } from "react-instantsearch-dom";
import { removeQuery } from "../components/ScrollToTop.jsx";
import { toast } from "react-toastify";

const AppCard = ({ data, index, mouseHoverIndex, setMouseHoverIndex, globalUrl }) => {
  const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";
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
          <ButtonBase style={{ borderRadius: 6, fontSize: 16, overflow: "hidden", display: "flex", alignItems: "flex-start", width: '100%', backgroundColor: mouseHoverIndex === index ? "#2F2F2F" : "#212121" }}>
            <img alt={data.name} src={data.small_image || data.large_image ? (data.small_image || data.large_image) : "/images/no_image.png"} style={{ width: 100, height: 100, borderRadius: 6, margin: 10, border: "1px solid #212122", boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: 339, gap: 8, fontWeight: '400', overflow: "hidden", margin: "12px 0 12px 0", fontFamily: "var(--zds-typography-base,Inter,Helvetica,arial,sans-serif)" }}>
              <div style={{ display: 'flex', flexDirection: 'row', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 8, gap: 8 }}>
                {data.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
              </div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 8, color: "rgba(158, 158, 158, 1)" }}>
                {data.categories ? data.categories.join(", ") : "NA"}
              </div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: 230, textAlign: 'start', marginLeft: 8, color: "rgba(158, 158, 158, 1)", display: "flex" }}>
                <div style={{ minWidth: 120, overflow: "hidden" }}>
                  {data.generated !== true && data.tags && data.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span key={tagIndex}>
                      {tag}
                      {tagIndex < data.tags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
                {/* Deactivate button logic */}
                {data.generated === true ? (
                  <Button style={{ marginLeft: 15, width: 102, height: 35, borderRadius: 200, backgroundColor: "rgba(73, 73, 73, 1)", color: "rgba(241, 241, 241, 1)", textTransform: "none" }}>
                    Deactivate
                  </Button>
                ) : null}
              </div>
            </div>
          </ButtonBase>
        </Paper>
      </a>
    </Grid>
  );
};

const Apps2 = (props) => {
  const { globalUrl, isLoaded, serverside, userdata } = props;
  let navigate = useNavigate();
  const { leftSideBarOpenByClick } = useContext(Context);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [currTab, setCurrTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userApps, setUserApps] = useState([]);
  const [orgApps, setOrgApps] = useState([]);
  const [selectedCategoryForUsersAndOgsApps, setselectedCategoryForUsersAndOgsApps] = useState([]);
  const [selectedTagsForUserAndOrgApps, setSelectedTagsForUserAndOrgApps] = useState([]);
  const [appsToShow, setAppsToShow] = useState([]);
  const [deactivatedIndexes, setDeactivatedIndexes] = React.useState([]);


  const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
  var counted = 0;
  const [showNoAppFound, setShowNoAppFound] = useState(false);

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNoAppFound(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
    if (currTab === 1) {
      const baseUrl = globalUrl;
      const userAppsUrl = `${baseUrl}/api/v1/users/me/apps`;
      fetch(userAppsUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setUserApps(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user apps:", err);
        });
    } else if (currTab === 0) {
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
          console.log("data of orgApps", data)
          setOrgApps(data);
          setIsLoading(false)
        })
        .catch((err) => {
          console.error("Error fetching apps:", err);
        });
    }
  }, [currTab]);




  useEffect(() => {
    if (serverside) {
      return null;
    }
  }, [serverside]);


  useEffect(() => {

    const findTopCategories = () => {
      const categoryCountMap = {};

      // Check if userAndOrgsApp is an array before iterating over it and Find top 10 Category from the apps
      if (Array.isArray(appsToShow)) {
        appsToShow.forEach((app) => {
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

      if (Array.isArray(appsToShow)) {
        appsToShow.forEach((app) => {
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

    const categories = findTopCategories();
    if (categories) {
      setCategories(categories)
    }
    console.log(categories)
    const tags = findTopTags();
    if (tags) {
      setLabels(tags);
    }
    console.log(tags)
  }, [currTab])

  const handleCreateApp = () => {
    navigate('/create-app');
  };


  //Search app base on app name, category and tag
  const filteredUserAppdata = Array.isArray(appsToShow) ? appsToShow.filter((app) => {
    const matchesSearchQuery = (
      searchQuery === "" ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.tags && app.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )) ||
      (app.categories && app.categories.some((category) =>
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
      selectedTagsForUserAndOrgApps.length === 0 ||
      (app.tags && selectedTagsForUserAndOrgApps.some(tag =>
        app.tags.includes(tag)
      ))
    );


    return matchesSearchQuery && matchesSelectedCategories && matchesSelectedTags;
  }) : [];


  const handleTabChange = (newTab) => {
    setCurrTab(newTab);
    if (currTab === 0) {
      setAppsToShow(orgApps)
    }
    if (currTab === 1) {
      setAppsToShow(userApps)
    }
    const newQueryParam = newTab === 0 ? 'org_apps' : newTab === 1 ? 'my_apps' : 'all_apps';
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('tab', newQueryParam);
    queryParams.delete('q');
    window.history.replaceState({}, '', `${location.pathname}?${queryParams.toString()}`);
    console.log("Current Tab", currTab)
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
                <Search style={{ marginLeft: 5 }} />
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
                )
                }
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
          placeholder="Search more than 2500 Apps"
          id="shuffle_search_field"
          onChange={(event) => {
            setSearchQuery(event.currentTarget.value);
            removeQuery("q");
            refine(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          limit={5}
        />
        {/*isSearchStalled ? 'My search is stalled' : ''*/}
      </form>
    );
  };




  const CustomSearchBox = connectSearchBox(SearchBox);
  // const CustomHits = connectHits(Hits);




  return (
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
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for apps"
            value={searchQuery}
            id="shuffle_search_field"
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
              removeQuery("q");
              // refine(event.currentTarget.value);
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
          {/* <CustomSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} /> */}
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
            <MenuItem value="" >
              All Categories
            </MenuItem>
            {categories?.map((category) => (
              <MenuItem value={category.category}>
                {category.category}
              </MenuItem>
            ))}

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
            {labels?.map((tag) => (
              <MenuItem value={tag.tag}>
                {tag.tag}
              </MenuItem>
            ))}
            {/* Add label options here */}
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
        <div style={{ rowGap: 16, columnGap: 16, marginTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "flex-start", overflowY: "auto", overflowX: "hidden", maxHeight: 570, scrollbarWidth: "thin", scrollbarColor: "#494949 #2f2f2f", maxHeight: 570 }}>
          {orgApps.map((data, index) => (
            <AppCard key={index} data={data} index={index} mouseHoverIndex={mouseHoverIndex} setMouseHoverIndex={setMouseHoverIndex} globalUrl={globalUrl} />
          ))}
        </div>
      </div>
      <AppGrid
        maxRows={4}
        showSuggestion={true}
        globalUrl={globalUrl}
        isMobile={isMobile}
        userdata={userdata}
      />
    </div>
  );
};

export default Apps2;
