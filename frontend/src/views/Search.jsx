import React, { useState, useEffect, useMemo, useContext } from "react";

import theme from "../theme.jsx";
import { isMobile } from "react-device-detect";
import AppGrid from "../components/AppGrid.jsx";
import WorkflowGrid from "../components/WorkflowGrid.jsx";
import CreatorGrid from "../components/CreatorGrid.jsx";
import DocsGrid from "../components/DocsGrid.jsx";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab, setRef } from "@mui/material";
import { styled } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import DiscordChat from "../components/DiscordChat.jsx";
import { Context } from "../context/ContextApi.jsx";

import {
  Apps as AppsIcon,
  Code as CodeIcon,
  EmojiObjects as EmojiObjectsIcon,
  Chat as ChatIcon,
  PeopleAltOutlined as PeopleAltOutlinedIcon, 
  DescriptionOutlined as DescriptionOutlinedIcon, 
} from "@mui/icons-material";

import {Typography} from "@mui/material";

// Should be different if logged in :|
const Search = (props) => {
  const { globalUrl, isLoaded, serverside, userdata, hidemargins, isHeader } =
    props;
  let navigate = useNavigate();
  const { leftSideBarOpenByClick } = useContext(Context);

  const [curTab, setCurTab] = useState(0);
  const iconStyle = { marginRight: isHeader ? null : 10 };

  useEffect(() => {
    if (
      serverside !== true &&
      window.location.search !== undefined &&
      window.location.search !== null
    ) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
      const foundTab = params["tab"];
      if (foundTab !== null && foundTab !== undefined) {
        for (let key in views) {
          const value = views[key];
          if (value === foundTab) {
            setConfig(null, key);
            break;
          }
        }
      }
    }
  }, []);

  //Stop unnecessariry re-rendering of the component to improve performace
  const MemoizedAppGrid = useMemo(() => <AppGrid
    maxRows={4}
    isHeader={true}
    showSuggestion={true}
    globalUrl={globalUrl}
    isMobile={isMobile}
    userdata={userdata}
  />, [curTab]);

  const MemoizedWorkflowGrid = useMemo(() => <WorkflowGrid
    maxRows={3}
    showSuggestion={true}
    globalUrl={globalUrl}
    isMobile={isMobile}
    userdata={userdata}
  />, [curTab]);

  const MemoizedDocsGrid = useMemo(() => <DocsGrid
    maxRows={6}
    parsedXs={12}
    showSuggestion={true}
    globalUrl={globalUrl}
    isMobile={isMobile}
    userdata={userdata}
  />, [curTab]);

  const MemoizedCreatorGrid = useMemo(() => <CreatorGrid
    parsedXs={4}
    isHeader={true}
    showSuggestion={true}
    globalUrl={globalUrl}
    isMobile={isMobile}
    userdata={userdata}
  />, [curTab]);

  const MemoizedDiscordChat = useMemo(() => <DiscordChat isMobile={isMobile} />)

  const useStyles = makeStyles({
    hideIndicator: {
      display: 'none',
    },
    customTab: {
      justifyContent: "center",
      "& .MuiButtonBase-root": {
        color: "white",
      },
    },
  });
  const classes = useStyles();

  if (serverside === true) {
    return null;
  }

  const bodyDivStyle = {
    margin: "auto",
    maxWidth: "100%",
    scrollX: "hidden",
    overflowX: "hidden",
    justifyContent: isHeader ? "center" : null,
  };

  const boxStyle = {
    color: "white",
    flex: "1",
    marginLeft: isHeader ? null : 10,
    marginRight: isHeader ? null : 10,
    paddingRight: isHeader ? null : 30,
    paddingBottom: isHeader ? null : 30,
    paddingTop: hidemargins === true ? 0 : isHeader ? null : 30,
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
    minHeight: 400,
    paddingLeft: leftSideBarOpenByClick ? 250 : 0,
    transition: "padding-left 0.3s ease",
  };

  const views = {
    0: "apps",
    1: "workflows",
    2: "docs",
    3: "creators",
    4: "discord"
  };

  const setConfig = (event, inputValue) => {
    const newValue = parseInt(inputValue);

    setCurTab(newValue);
    if (newValue === 0) {
      document.title = "Shuffle - search - apps";
    } else if (newValue === 1) {
      document.title = "Shuffle - search - workflows";
    } else if (newValue === 2) {
      document.title = "Shuffle - search - documentation";
    } else if (newValue === 3) {
      document.title = "Shuffle - search - creators";
    } else if (newValue === 4) {
      document.title = "Shuffle - search - Discord Chat";
    } else {
      document.title = "Shuffle - search";
    }

    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const foundQuery = params["q"];
    var extraQ = "";
    if (foundQuery !== null && foundQuery !== undefined) {
      extraQ = "&q=" + foundQuery;
    }

    if (
      (serverside === false || serverside === undefined) &&
      window.location.pathname.includes("/search")
    ) {
      navigate(`/search?tab=${views[newValue]}` + extraQ);
    }
  };

  if (isLoaded === false) {
    return null;
  }

  const StyledTab = styled(Tab)(({ theme }) => ({
    width: 151,
    height: 51,
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 600,
    textTransform: "none",
    border: 'none',
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      "& .MuiSvgIcon-root": {
        color: theme.palette.common.white,
      },
    },
  }));

  const tabSpanStyling = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }

  const tabTextStyling = {
    marginLeft: '5px',
    color: 'white'
  }

  // Random names for type & autoComplete. Didn't research :^)
  const landingpageDataBrowser = (
    <div
      style={{
        paddingBottom: hidemargins === true ? 0 : 100,
        color: "white",
      }}
    >
      <div style={boxStyle}>
        <Tabs
          style={{
            width: 757,
            margin: isHeader ? null : "auto",
            marginTop: hidemargins === true ? 0 : isHeader ? null : 25,
            backgroundColor: "rgba(33, 33, 33, 1)",
            borderRadius: 8,
          }}
          value={curTab}
          indicatorColor="primary"
          textColor="secondary"
          onChange={setConfig}
          aria-label="disabled tabs example"
          // variant="scrollable"
          // scrollButtons="auto"
          classes={{ indicator: classes.hideIndicator, root: classes.customTab }}
        >
          <StyledTab
            style={{
              backgroundColor: curTab === 0 ? theme.palette.primary.main : 'inherit',
              color: curTab === 0 ? theme.palette.common.white : 'inherit',
            }}
            label={
              <span style={tabSpanStyling}>
                <AppsIcon style={{ iconStyle, color: "#F1F1F1" }} />
                <Typography variant="body1" style={tabTextStyling}>App</Typography>
              </span>
            }
          />
          <StyledTab
            style={{
              backgroundColor: curTab === 1 ? theme.palette.primary.main : 'inherit',
              color: curTab === 1 ? theme.palette.common.white : 'inherit',
            }}
            label={
              <span style={tabSpanStyling}>
                <CodeIcon style={{ iconStyle, color: "#F1F1F1" }} />
                <Typography variant="body1" style={tabTextStyling}>Workflow</Typography>
              </span>
            }
          />
          <StyledTab
            style={{
              backgroundColor: curTab === 2 ? theme.palette.primary.main : 'inherit',
              color: curTab === 2 ? theme.palette.common.white : 'inherit',
            }}
            label={
              <span style={tabSpanStyling}>
                <DescriptionOutlinedIcon style={{ iconStyle, color: "#F1F1F1" }} />
                <Typography variant="body1" style={tabTextStyling}>Docs</Typography>
              </span>
            }
          />
          <StyledTab
            style={{
              backgroundColor: curTab === 3 ? theme.palette.primary.main : 'inherit',
              color: curTab === 3 ? theme.palette.common.white : 'inherit'
            }}
            label={
              <span style={tabSpanStyling}>
                <PeopleAltOutlinedIcon style={{ iconStyle, color: "#F1F1F1" }} />
                <Typography variant="body1" style={tabTextStyling}>Creators</Typography>
              </span>
            }
          />
          <StyledTab
            style={{
              backgroundColor: curTab === 4 ? theme.palette.primary.main : 'inherit',
              color: curTab === 4 ? theme.palette.common.white : 'inherit'
            }}
            label={
              <span style={tabSpanStyling}>
                <ChatIcon style={{ iconStyle, color: "#F1F1F1" }} />
                <Typography variant="body1" style={{ marginLeft: 5, whiteSpace: "nowrap", color: "#F1F1F1" }}>Discord Chat</Typography>
              </span>
            }
          />
        </Tabs>
        {curTab === 0 && MemoizedAppGrid}
        {curTab === 1 && MemoizedWorkflowGrid}
        {curTab === 2 && MemoizedDocsGrid}
        {curTab === 3 && MemoizedCreatorGrid}
        {curTab === 4 && MemoizedDiscordChat}
      </div>
    </div>
  );
  //{/*alternativeView={true} />*/}

  const loadedCheck = isLoaded ? (
    <div>
      <div style={bodyDivStyle}>{landingpageDataBrowser}</div>
    </div>
  ) : (
    <div></div>
  );

  // #1f2023?
  return <div style={{}}>{loadedCheck}</div>;
};

export default Search;
