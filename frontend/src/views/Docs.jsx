import React, { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import { BrowserView, MobileView } from "react-device-detect";
import { useParams, useNavigate, Link } from "react-router-dom";
import { isMobile } from "react-device-detect";
import theme from '../theme.jsx';
import remarkGfm from 'remark-gfm'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
  Grid,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
  Typography,
  Paper,
  List,
  Collapse,
  ListItemButton,
  ListItemText
} from "@mui/material";

import {
  Link as LinkIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

const Body = {
  //maxWidth: 1000,
  //minWidth: 768,
  maxWidth: "100%",
  minWidth: "100%",
  display: "flex",
  height: "100%",
  color: "white",
  position: "relative",
  //textAlign: "center",
};

const dividerColor = "rgb(225, 228, 232)";
const hrefStyle = {
  color: "rgba(255, 255, 255, 0.40)",
  textDecoration: "none",
};

const hrefStyle2 = {
  color: "#f86a3e",
  textDecoration: "none",
};

const innerHrefStyle = {
  color: "rgba(255, 255, 255, 0.75)",
  textDecoration: "none",
};

const Docs = (defaultprops) => {
  const { globalUrl, selectedDoc, serverside, serverMobile } = defaultprops;

  let navigate = useNavigate();

  // Quickfix for react router 5 -> 6 
  const params = useParams();
  //var props = JSON.parse(JSON.stringify(defaultprops))
  var props = Object.assign({ selected: false }, defaultprops);
  props.match = {}
  props.match.params = params

  useEffect(() => {
    //if (params["key"] === undefined) {
    //	navigate("/docs/about")
    //	return
    //}
  }, [])
  //console.log("PARAMS: ", params)

  const [mobile, setMobile] = useState(serverMobile === true || isMobile === true ? true : false);
  const [data, setData] = useState("");
  const [firstrequest, setFirstrequest] = useState(true);
  const [list, setList] = useState([]);
  const [isopen, setOpen] = useState(-1);
  const [, setListLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [headingSet, setHeadingSet] = React.useState(false);
  const [selectedMeta, setSelectedMeta] = React.useState({
    link: "hello",
    read_time: 2,
  });
  const [tocLines, setTocLines] = React.useState([]);
  const [baseUrl, setBaseUrl] = React.useState(
    serverside === true ? "" : window.location.href
  );

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  const handleCollapse = (index) => {
    setOpen(isopen === index ? -1 : index)
  };

  const SidebarPaperStyle = {
    backgroundColor: theme.palette.surfaceColor,
    overflowX: "hidden",
    position: "relative",
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    marginTop: 15,
    minHeight: "80vh",
    //height: "50vh",
  };

  const SideBar = {
    minWidth: 300,
    width: "20%",
    left: 0,
    position: "sticky",
    top: 50,
    minHeight: "90vh",
    maxHeight: "90vh",
    overflowX: "hidden",
    overflowY: "auto",
    zIndex: 1000,
    //borderRight: "1px solid rgba(255,255,255,0.3)",
  };

  const fetchDocList = () => {
    fetch(globalUrl + "/api/v1/docs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.success) {
          setList(responseJson.list);
        } else {
          setList([
            "# Error loading documentation. Please contact us if this persists.",
          ]);
        }
        setListLoaded(true);
      })
      .catch((error) => { });
  };

  const fetchDocs = (docId) => {
    fetch(globalUrl + "/api/v1/docs/" + docId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.success) {
          setData(responseJson.reason);
          if (docId === undefined) {
            document.title = "Shuffle documentation introduction";
          } else {
            document.title = "Shuffle " + docId + " documentation";
          }

          if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.includes("404: Not Found")) {
            navigate("/docs")
            return
          }

          if (responseJson.meta !== undefined) {
            setSelectedMeta(responseJson.meta);
          }

          //console.log("TOC list: ", responseJson.reason)
          if (
            responseJson.reason !== undefined &&
            responseJson.reason !== null
          ) {
            const splitkey = responseJson.reason.split("\n");
            var innerTocLines = [];
            var record = false;
            for (var key in splitkey) {
              const line = splitkey[key];
              //console.log("Line: ", line)
              if (line.toLowerCase().includes("table of contents")) {
                record = true;
                continue;
              }

              if (record && line.length < 3) {
                record = false;
              }

              if (record) {
                const parsedline = line.split("](");
                if (parsedline.length > 1) {
                  parsedline[0] = parsedline[0].replaceAll("*", "");
                  parsedline[0] = parsedline[0].replaceAll("[", "");
                  parsedline[0] = parsedline[0].replaceAll("]", "");
                  parsedline[0] = parsedline[0].replaceAll("(", "");
                  parsedline[0] = parsedline[0].replaceAll(")", "");
                  parsedline[0] = parsedline[0].trim();

                  parsedline[1] = parsedline[1].replaceAll("*", "");
                  parsedline[1] = parsedline[1].replaceAll("[", "");
                  parsedline[1] = parsedline[1].replaceAll("]", "");
                  parsedline[1] = parsedline[1].replaceAll(")", "");
                  parsedline[1] = parsedline[1].replaceAll("(", "");
                  parsedline[1] = parsedline[1].trim();
                  //console.log(parsedline[0], parsedline[1])

                  innerTocLines.push({
                    text: parsedline[0],
                    link: parsedline[1],
                  });
                } else {
                  console.log("Bad line for parsing: ", line);
                }
              }
            }

            setTocLines(innerTocLines);
          }
        } else {
          setData("# Error\nThis page doesn't exist.");
        }
      })
      .catch((error) => { });
  };

  if (firstrequest) {
    setFirstrequest(false);
    if (!serverside) {
      if (window.innerWidth < 768) {
        setMobile(true);
      }
    }

    if (selectedDoc !== undefined) {
      setData(selectedDoc.reason);
      setList(selectedDoc.list);
      setListLoaded(true);
    } else {
      if (!serverside) {
        fetchDocList();

        //const propkey = props.match.params.key
        //if (propkey === undefined) {
        //	navigate("/docs/about")
        //	return null
        //}
        //
        if (props.match.params.key === undefined) {

        } else {
          console.log("DOCID: ", props.match.params.key)
          fetchDocs(props.match.params.key)
        }
      }
    }
  }

  // Handles search-based changes that origin from outside this file
  if (serverside !== true && window.location.href !== baseUrl) {
    setBaseUrl(window.location.href);
    fetchDocs(props.match.params.key);
  }

  const parseElementScroll = () => {
    const offset = 45;
    var parent = document.getElementById("markdown_wrapper_outer");
    if (parent !== null) {
      //console.log("IN PARENT")
      var elements = parent.getElementsByTagName("h2");

      const name = window.location.hash
        .slice(1, window.location.hash.lenth)
        .toLowerCase()
        .split("%20")
        .join(" ")
        .split("_")
        .join(" ")
        .split("-")
        .join(" ")
        .split("?")[0]

      //console.log(name)
      var found = false;
      for (var key in elements) {
        const element = elements[key];
        if (element.innerHTML === undefined) {
          continue;
        }

        // Fix location..
        if (element.innerHTML.toLowerCase() === name) {
          //console.log(element.offsetTop)
          element.scrollIntoView({ behavior: "smooth" });
          //element.scrollTo({
          //	top: element.offsetTop+offset,
          //	behavior: "smooth"
          //})
          found = true;
          //element.scrollTo({
          //	top: element.offsetTop-100,
          //	behavior: "smooth"
          //})
        }
      }

      // H#
      if (!found) {
        elements = parent.getElementsByTagName("h3");
        //console.log("NAMe: ", name)
        found = false;
        for (key in elements) {
          const element = elements[key];
          if (element.innerHTML === undefined) {
            continue;
          }

          // Fix location..
          if (element.innerHTML.toLowerCase() === name) {
            element.scrollIntoView({ behavior: "smooth" });
            //element.scrollTo({
            //	top: element.offsetTop-offset,
            //	behavior: "smooth"
            //})
            found = true;
            //element.scrollTo({
            //	top: element.offsetTop-100,
            //	behavior: "smooth"
            //})
          }
        }
      }
    }
    //console.log(element)

    //console.log("NAME: ", name)
    //console.log(document.body.innerHTML)
    //   parent = document.getElementById(parent);

    //var descendants = parent.getElementsByTagName(tagname);

    // this.scrollDiv.current.scrollIntoView({ behavior: 'smooth' });

    //$(".parent").find("h2:contains('Statistics')").parent();
  };

  if (serverside !== true && window.location.hash.length > 0) {
    parseElementScroll();
  }

  const markdownStyle = {
    color: "rgba(255, 255, 255, 0.65)",
    overflow: "hidden",
    paddingBottom: 100,
    margin: "auto",
    maxWidth: "100%",
    minWidth: "100%",
    overflow: "hidden",
    fontSize: isMobile ? "1.3rem" : "1.0rem",
  };

  function OuterLink(props) {
    console.log("Link: ", props.href)
    if (props.href.includes("http") || props.href.includes("mailto")) {
      return (
        <a
          href={props.href}
          style={{ color: "#f85a3e", textDecoration: "none" }}
        >
          {props.children}
        </a>
      );
    }
    return (
      <Link
        to={props.href}
        style={{ color: "#f85a3e", textDecoration: "none" }}
      >
        {props.children}
      </Link>
    );
  }

  function Img(props) {
    return <img style={{ borderRadius: theme.palette.borderRadius, width: 750, maxWidth: "100%", marginTop: 15, marginBottom: 15, }} alt={props.alt} src={props.src} />;
  }

  function CodeHandler(props) {
    console.log("PROPS: ", props)

    const propvalue = props.value !== undefined && props.value !== null ? props.value : props.children !== undefined && props.children !== null && props.children.length > 0 ? props.children[0] : ""

    return (
      <div
        style={{
          padding: 15,
          minWidth: "50%",
          maxWidth: "100%",
          backgroundColor: theme.palette.inputColor,
          overflowY: "auto",
        }}
      >
        <code
          style={{
            // Wrap if larger than X
            whiteSpace: "pre-wrap",
            overflow: "auto",
          }}
        >{propvalue}</code>
      </div>
    );
  }

  const Heading = (props) => {
    const element = React.createElement(
      `h${props.level}`,
      { style: { marginTop: props.level === 1 ? 20 : 50 } },
      props.children
    );
    const [hover, setHover] = useState(false);

    var extraInfo = "";
    if (props.level === 1) {
      extraInfo = (
        <div
          style={{
            backgroundColor: theme.palette.inputColor,
            padding: 15,
            borderRadius: theme.palette.borderRadius,
            marginBottom: 30,
            display: "flex",
          }}
        >
          <div style={{ flex: 3, display: "flex", vAlign: "center", position: "sticky", top: 50, }}>
            {mobile ? null : (
              <Typography style={{ display: "inline", marginTop: 6 }}>
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href={selectedMeta.link}
                  style={{ textDecoration: "none", color: "#f85a3e" }}
                >
                  <Button style={{ color: "white", }} variant="outlined" color="secondary">
                    <EditIcon /> &nbsp;&nbsp;Edit
                  </Button>
                </a>
              </Typography>
            )}
            {mobile ? null : (
              <div
                style={{
                  height: "100%",
                  width: 1,
                  backgroundColor: "white",
                  marginLeft: 50,
                  marginRight: 50,
                }}
              />
            )}
            <Typography style={{ display: "inline", marginTop: 11 }}>
              {selectedMeta.read_time} minute
              {selectedMeta.read_time === 1 ? "" : "s"} to read
            </Typography>
          </div>
          <div style={{ flex: 2 }}>
            {mobile ||
              selectedMeta.contributors === undefined ||
              selectedMeta.contributors === null ? (
              ""
            ) : (
              <div style={{ margin: 10, height: "100%", display: "inline" }}>
                {selectedMeta.contributors.slice(0, 7).map((data, index) => {
                  return (
                    <a
                      key={index}
                      rel="noopener noreferrer"
                      target="_blank"
                      href={data.url}
                      target="_blank"
                      style={{ textDecoration: "none", color: "#f85a3e" }}
                    >
                      <Tooltip title={data.url} placement="bottom">
                        <img
                          alt={data.url}
                          src={data.image}
                          style={{
                            marginTop: 5,
                            marginRight: 10,
                            height: 40,
                            borderRadius: 40,
                          }}
                        />
                      </Tooltip>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <Typography
        onMouseOver={() => {
          setHover(true);
        }}
      >
        {props.level !== 1 ? (
          <Divider
            style={{
              width: "90%",
              marginTop: 40,
              backgroundColor: theme.palette.inputColor,
            }}
          />
        ) : null}
        {element}
        {/*hover ? <LinkIcon onMouseOver={() => {setHover(true)}} style={{cursor: "pointer", display: "inline", }} onClick={() => {
					window.location.href += "#hello"
					console.log(window.location)
					//window.history.pushState('page2', 'Title', '/page2.php');
					//window.history.replaceState('page2', 'Title', '/page2.php');
				}} /> 
				: ""
				*/}
        {extraInfo}
      </Typography>
    );
  };
  //React.createElement("p", {style: {color: "red", backgroundColor: "blue"}}, this.props.paragraph)

  //function unicodeToChar(text) {
  //	return text.replace(/\\u[\dA-F]{4}/gi,
  //   		function (match) {
  //        	return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  //        }
  //	);
  //}


  const CustomButton = (props) => {
    const { title, icon, link } = props

    const [hover, setHover] = useState(false)

    return (
      <a
        href={link}
        rel="noopener noreferrer"
        target="_blank"
        style={{ textDecoration: "none", color: "inherit", flex: 1, margin: 10, }}
      >
        <div style={{ cursor: hover ? "pointer" : "default", borderRadius: theme.palette.borderRadius, flex: 1, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: hover ? theme.palette.surfaceColor : theme.palette.inputColor, padding: 25, }}
          onClick={(event) => {
            if (link === "" || link === undefined) {
              event.preventDefault()
              console.log("IN CLICK!")
              if (window.drift !== undefined) {
                window.drift.api.startInteraction({ interactionId: 340043 })
              } else {
                console.log("Couldn't find drift in window.drift and not .drift-open-chat with querySelector: ", window.drift)
              }
            } else {
              console.log("Link defined: ", link)
            }
          }} onMouseOver={() => {
            setHover(true)
          }}
          onMouseOut={() => {
            setHover(false);
          }}
        >
          {icon}
          <Typography variant="body1" style={{}} >
            {title}
          </Typography>
        </div>
      </a>
    )
  }


  const DocumentationButton = (props) => {
    const { item, link } = props

    const [hover, setHover] = useState(false);

    console.log("Link: ", link)
    if (link === undefined || link === null) {
      return null
    }

    return (
      <Link to={link} style={hrefStyle}>
        <div style={{ width: "100%", height: 80, cursor: hover ? "pointer" : "default", borderRadius: theme.palette.borderRadius, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: hover ? theme.palette.surfaceColor : theme.palette.inputColor, }}
          onMouseOver={() => {
            setHover(true)
          }}
          onMouseOut={() => {
            setHover(false);
          }}
        >
          <Typography variant="body1" style={{}} >
            {item}
          </Typography>
        </div>
      </Link>
    )
  }

  const headerStyle = {
    marginTop: 25,
  }

  const mainpageInfo =
    <div style={{
      color: "rgba(255, 255, 255, 0.65)",
      flex: "1",
      overflow: "hidden",
      paddingBottom: 100,
      marginLeft: mobile ? 0 : 50,
      marginTop: 50,
      textAlign: "center",
      margin: "auto",
      marginTop: 50,
    }}>
      <Typography variant="h4" style={{ textAlign: "center", }}>
        Documentation
      </Typography>
      <div style={{ display: "flex", marginTop: 25, }}>
        <CustomButton title="Talk to Support" icon=<img src="/images/Shuffle_logo_new.png" style={{ height: 35, width: 35, border: "", borderRadius: theme.palette.borderRadius, }} /> />
        <CustomButton title="Ask the community" icon=<img src="/images/social/discord.png" style={{ height: 35, width: 35, border: "", borderRadius: theme.palette.borderRadius, }} /> link="https://discord.gg/B2CBzUm" />
      </div>

      <div style={{ textAlign: "left" }}>
        <Typography variant="h6" style={headerStyle} >Tutorial</Typography>
        <Typography variant="body1">
          <b>Dive in.</b> Hands-on is the best approach to see how Shuffle can transform your security operations. Our set of tutorials and videos teach you how to build your skills. Check out the <Link to="/docs/getting-started" style={hrefStyle2}>getting started</Link> section to give it a go!
        </Typography>

        <Typography variant="h6" style={headerStyle}>Why Shuffle?</Typography>
        <Typography variant="body1">
          <b>Security first.</b> We incentivize trying before buying, and give you the full set of tools you need to automate your operations. What's more is we also help you <a href="https://shuffler.io/pricing?tag=docs" target="_blank" style={hrefStyle2}>find usecases</a> that fit your unique needs. Accessibility is key, and we intend to help every SOC globally use and share their usecases.
        </Typography>

        <Typography variant="h6" style={headerStyle}>Get help</Typography>
        <Typography variant="body1">
          <b>Our promise</b> is to make it easier and easier to automate your operations. In some cases however, it may be good with a helping hand. That's where <a href="https://shuffler.io/pricing?tag=docs" target="_blank" style={hrefStyle2}>Shuffle's consultancy and support</a> services come in handy. We help you build and automate your operational processes to a level you haven't seen before with the help of our <a href="https://shuffler.io/usecases?tag=docs" target="_blank" style={hrefStyle2}>usecases</a>.
        </Typography>

        <Typography variant="h6" style={headerStyle}>APIs</Typography>
        <Typography variant="body1">
          <b>Learn.</b> We're all about learning, and are continuously creating documentation and video tutorials to better understand how to get started. APIs are an extremely important part of how the internet works today, and our goal is helping every security professional learn about them.
        </Typography>

        <Typography variant="h6" style={headerStyle}>Workflow building</Typography>
        <Typography variant="body1">
          <b>Build.</b> Creating workflows has never been easier. Jump into things with our <Link to="/getting-started" style={hrefStyle2}>getting Started</Link> section and build to your hearts content. Workflows make it all come together, with an easy to use area.
        </Typography>

        <Typography variant="h6" style={headerStyle}>Managing Shuffle</Typography>
        <Typography variant="body1">
          <b>Organize.</b> Whether an organization of 1000 or 1, management tools are necessary. In Shuffle we offer full user management, MFA and single-signon options, multi-tenancy and a lot more - for free!
        </Typography>
      </div>

      {/*
				<Grid container spacing={2} style={{marginTop: 50, }}>
					{list.map((data, index) => {
						const item = data.name;
						if (item === undefined) {
							return null;
						}

						const path = "/docs/" + item;
						const newname =
							item.charAt(0).toUpperCase() +
							item.substring(1).split("_").join(" ").split("-").join(" ");

						const itemMatching = props.match.params.key === undefined ? false : 
							props.match.params.key.toLowerCase() === item.toLowerCase();

						return (
							<Grid key={index} item xs={4}>
								<DocumentationButton key={index} item={newname} link={"/docs/"+data.name} />
							</Grid>
						)
					})}
				</Grid>
				*/}

      {/*
				<TextField
					required
					style={{
						flex: "1", 
						backgroundColor: theme.palette.inputColor,
						height: 50, 
					}}
					InputProps={{
						style:{
							color: "white",
							height: 50, 
						},
					}}
					placeholder={"Search Knowledgebase"}
					color="primary"
					fullWidth={true}
					type="firstname"
					id={"Searchfield"}
					margin="normal"
					variant="outlined"
					onChange={(event) => {
						console.log("Change: ", event.target.value)
					}}
				/>
				*/}
    </div>

  // PostDataBrowser Section
  const postDataBrowser =
    list === undefined || list === null ? null : (
      <div style={Body}>
        <div style={SideBar}>
          <Paper style={SidebarPaperStyle}>
            <List style={{ listStyle: "none", paddingLeft: "0" }}>
              {list.map((data, index) => {
                const item = data.name;
                if (item === undefined) {
                  return null;
                }

                const path = "/docs/" + item;
                const newname =
                  item.charAt(0).toUpperCase() +
                  item.substring(1).split("_").join(" ").split("-").join(" ");

                const itemMatching = props.match.params.key === undefined ? false :
                  props.match.params.key.toLowerCase() === item.toLowerCase();
                return (
                  <li key={index}>
                    <ListItemButton
                      component={Link}
                      key={index}
                      style={hrefStyle}
                      to={path}
                      onClick={() => {
                        setTocLines([]);
                        fetchDocs(item);
                        handleCollapse(index);
                      }}
                    >
                      <ListItemText
                        style={{ color: itemMatching ? "#f86a3e" : "inherit" }}
                        variant="body1"
                      >
                        {newname}
                      </ListItemText>
                      {isopen === index ? <ExpandMoreIcon /> : <KeyboardArrowRightIcon />}
                    </ListItemButton>
                    {itemMatching &&
                      tocLines !== null &&
                      tocLines !== undefined &&
                      tocLines.length > 0 ? (
                      <Collapse in={isopen === index} timeout="auto" unmountOnExit>
                        {tocLines.map((data, index) => {

                          return (
                            <ListItemButton
                              component={Link}
                              key={index}
                              style={innerHrefStyle}
                              to={data.link}
                            >
                              <ListItemText
                                variant="body2"
                                style={{ cursor: "pointer" }}
                              >
                                {data.text}
                              </ListItemText>
                            </ListItemButton>
                          );
                        })}
                      </Collapse>
                    ) : null}
                  </li>
                );
              })}
            </List>
          </Paper>
        </div>
        <div style={{ width: "70%", margin: "auto", overflow: "hidden", marginTop: 50, paddingRight: 50 }}>
          {props.match.params.key === undefined ?
            mainpageInfo
            :
            <div id="markdown_wrapper_outer" style={markdownStyle}>
              <ReactMarkdown
                components={{
                  img: Img,
                  code: CodeHandler,
                  h1: Heading,
                  h2: Heading,
                  h3: Heading,
                  h4: Heading,
                  h5: Heading,
                  h6: Heading,
                  a: OuterLink,
                }}
                id="markdown_wrapper"
                escapeHtml={false}
                style={{
                  maxWidth: "100%", minWidth: "100%",
                }}
              >
                {data}
              </ReactMarkdown>
            </div>
          }
        </div>
      </div>
    );
  // remarkPlugins={[remarkGfm]}

  const mobileStyle = {
    color: "white",
    marginLeft: 25,
    marginRight: 25,
    paddingBottom: 50,
    backgroundColor: "inherit",
    display: "flex",
    flexDirection: "column",
  };

  const postDataMobile =
    list === undefined || list === null ? null : (
      <div style={mobileStyle}>
        <div>
          <Button
            fullWidth
            aria-controls="simple-menu"
            aria-haspopup="true"
            variant="outlined"
            color="primary"
            onClick={handleClick}
          >
            <div style={{ color: "white" }}>More docs</div>
          </Button>
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            style={{}}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {list.map((data, index) => {
              const item = data.name;
              if (item === undefined) {
                return null;
              }

              const path = "/docs/" + item;
              const newname =
                item.charAt(0).toUpperCase() +
                item.substring(1).split("_").join(" ").split("-").join(" ");
              return (
                <MenuItem
                  key={index}
                  style={{ color: "white" }}
                  onClick={() => {
                    window.location.pathname = path;
                  }}
                >
                  {newname}
                </MenuItem>
              );
            })}
          </Menu>
        </div>
        {props.match.params.key === undefined ?
          mainpageInfo
          :
          <div id="markdown_wrapper_outer" style={markdownStyle}>
            <ReactMarkdown
              components={{
                img: Img,
                code: CodeHandler,
                h1: Heading,
                h2: Heading,
                h3: Heading,
                h4: Heading,
                h5: Heading,
                h6: Heading,
                a: OuterLink,
              }}
              id="markdown_wrapper"
              escapeHtml={false}
              style={{
                maxWidth: "100%", minWidth: "100%",
              }}
            >
              {data}
            </ReactMarkdown>
          </div>
        }
        <Divider
          style={{
            marginTop: "10px",
            marginBottom: "10px",
            backgroundColor: dividerColor,
          }}
        />
        <Button
          fullWidth
          aria-controls="simple-menu"
          aria-haspopup="true"
          variant="outlined"
          color="primary"
          onClick={handleClick}
        >
          <div style={{ color: "white" }}>More docs</div>
        </Button>
      </div>
    );

  //const imageModal =
  //	<Dialog modal
  //		open={imageModalOpen}
  //	</Dialog>
  // {imageModal}

  // Padding and zIndex etc set because of footer in cloud.
  const loadedCheck = (
    <div style={{ minHeight: 1000, paddingBottom: 100, zIndex: 50000, }}>
      <BrowserView>{postDataBrowser}</BrowserView>
      <MobileView>{postDataMobile}</MobileView>
    </div>
  );

  return <div style={{}}>{loadedCheck}</div>;
};

export default Docs;
