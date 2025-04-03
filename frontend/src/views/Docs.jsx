import React, { useEffect, useLayoutEffect, useRef, useState, useContext, memo } from "react"
import { toast } from 'react-toastify';
import Markdown from 'react-markdown'
import theme from '../theme.jsx';
import ReactJson from "react-json-view-ssr";
import { isMobile } from "react-device-detect";
import { BrowserView, MobileView } from "react-device-detect";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { validateJson, GetIconInfo } from "../views/Workflows.jsx";
import remarkGfm from 'remark-gfm'
import { Context } from "../context/ContextApi.jsx";
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
    ListItemText,
    Dialog,
    DialogTitle,
    Box,
    DialogContent,
    InputAdornment
} from "@mui/material";
import {
    Link as LinkIcon,
    Edit as EditIcon,
    KeyboardArrowRight as KeyboardArrowRightIcon,
    ExpandMore as ExpandMoreIcon,
    FileCopy as FileCopyIcon,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon,
    Close as CloseIcon
} from "@mui/icons-material";
import { fontGrid } from "@mui/material/styles/cssUtils.js";
import SearchBox from "../components/SearchData.jsx";

const Body = {
    //maxWidth: 1000,
    //minWidth: 768,
    maxWidth: "100%",
    minWidth: "100%",
    display: "flex",
    height: "100%",
    color: "white",
    position: "relative",
	paddingTop: 40, 
    //textAlign: "center",
};

const dividerColor = "rgb(225, 228, 232)";
const hrefStyle = {
    color: "rgba(255, 255, 255, 0.8)",
    textDecoration: "none",
    marginRight: window.location.pathname.includes("/articles/") ? "0.8em" : undefined,
};


const hrefStyleToc2 = {
    color: "rgba(255, 255, 255, 0.6)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 400,
    padding: "4px 0",
    paddingLeft: "12px",
    paddingRight: "12px",
    lineHeight: "20px",
};

const hrefStyle2 = {
    color: "#f86a3e",
    textDecoration: "none",
};

const innerHrefStyle = {
    color: "rgba(255, 255, 255, 0.75)",
    textDecoration: "none",
};


export const CopyToClipboard = (props) => {
    const { text, style, onCopy } = props;
    const parsedstyle = style !== undefined ? style : {
        position: "absolute",
        right: 0,
        top: -10,
    }

    return (
        <div
            style={parsedstyle}
        >
            <IconButton
                onClick={() => {
                    navigator.clipboard.writeText(text);
                    toast("Copied to clipboard")
                }}
            >
                <FileCopyIcon />
            </IconButton>
        </div>
    )
}

export const Paragraph = (props) => {
    const element = React.createElement(
        `p`,
        {},
        props.children,
    )

    if (props.children[0] != undefined) {
        if(typeof props.children[0] === "string") {
            if (props.children[0].includes('.mp4')) {
                return (
                    <div>
                        <video width="640" height="480" controls>
                            <source src={`${props.children[0]}`} type="video/mp4" />
                        </video>
                    </div>
                )
            }
        }
    }


    return (
        <div> 
            {element}
        </div>
    )
}

export const OuterLink = (props) => {
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



export const Img = (props) => {
	// Find parent container and check width
    const isArticlePage = window.location.pathname.includes("/articles/")
    const isFormPage = window.location.pathname.includes("/forms/")
	var height = "auto" 
	var width = isArticlePage ? 1000 : isFormPage ? 400: 750

    const docsImageStyle = {
		border: isFormPage ? null : "1px solid rgba(255,255,255,0.3)", 
        borderRadius: theme.palette?.borderRadius, 
        width: width, 
        maxWidth: width, 
        margin: "auto", 
        marginTop: 10, 
        marginBottom: 10
    }
    
    const articleImageStyle = {
        borderRadius: theme.palette?.borderRadius,
        minWidth: 350, 
        maxWidth: "100%", 
        textAlign: "center", 
        margin: "auto", 
        marginTop: 20, 
        marginBottom: 20, 
    }

	if (props.height !== undefined && props.height !== null) {
		height = props.height
	}

	if (props.width !== undefined && props.width !== null) {
		width = props.width
	}

    return(
	  <div style={{width: "100%", textAlign: "center", }}> 
		  <img 
			style={isArticlePage ? articleImageStyle : docsImageStyle} 
			alt={props.alt} 
			src={props.src} 
		  />
	  </div>
	)
}


export const CodeHandler = (props) => {
    const propvalue = props.value !== undefined && props.value !== null ? props.value : props.children !== undefined && props.children !== null && props.children.length > 0 ? props.children[0] : ""

    const validate = validateJson(propvalue)

    var newprop = propvalue
    if (validate.valid === false) {
        // Check if https://shuffler.io in the url
        // if so, then we change it for the current url	
        if (propvalue.includes("https://shuffler.io/api")) {
            newprop = propvalue.replace("https://shuffler.io/api", window.location.origin+"/api")

	
			const foundurl = localStorage.getItem("globalUrl")
			if (foundurl !== undefined && foundurl !== null && foundurl !== "") {
				newprop = propvalue.replace("https://shuffler.io/api", foundurl+"/api")
			}
        }
    }

    // Need to check if it's singletick or multi
    if (props.inline === true) {
        // Show it inline
        return (
            <span style={{ backgroundColor: theme.palette.inputColor, display: "inline", whiteSpace: "pre-wrap", padding: "6px 3px 6px 3px", }}>
                {newprop}
            </span>
        )
    }

    return (
        <div
            style={{
                padding: 15,
                minWidth: "50%",
                maxWidth: "100%",
                backgroundColor: theme.palette.inputColor,
                overflowY: "auto",
                // Have it inline
                borderRadius: theme.palette?.borderRadius,
            }}
        >
            {validate.valid === true ?
                <ReactJson
                    src={validate.result}
                    theme={theme.palette.jsonTheme}
                    style={theme.palette.reactJsonStyle}
                    collapsed={false}
                    displayDataTypes={false}
		  			displayArrayKey={false}
					iconStyle={theme.palette.jsonIconStyle}
					collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
                    name={false}
                />
                :
                <div style={{ display: "flex", position: "relative", }}>
                    <code
                        style={{
                            // Wrap if larger than X
                            whiteSpace: "pre-wrap",
                            overflow: "auto",
                            marginRight: 40,
                        }}
                    >
                        {newprop}
                    </code>
                    <CopyToClipboard
                        text={newprop}
                    />
                </div>
            }
        </div>
    )
}

const Docs = (defaultprops) => {
    const { globalUrl, selectedDoc, serverside, serverMobile, isLoggedIn, isLoaded, userdata } = defaultprops;

    const { searchBarModalOpen, setSearchBarModalOpen, isDocSearchModalOpen, setIsDocSearchModalOpen, leftSideBarOpenByClick } = useContext(Context);

    let navigate = useNavigate();
    const location = useLocation();
    // Quickfix for react router 5 -> 6 
    const params = useParams();
    //var props = JSON.parse(JSON.stringify(defaultprops))
    var props = Object.assign({ selected: false }, defaultprops);
    props.match = {}
    props.match.params = params

    //console.log("PARAMS: ", params)

    const [mobile, setMobile] = useState(serverMobile === true || isMobile === true ? true : false);
    const [data, setData] = useState("");
    const [firstrequest, setFirstrequest] = useState(true);
    const [list, setList] = useState([]);
    const [lastHeading, setLastHeading] = useState(false);
    const [activeId, setActiveId] = useState()
    const [isopen, setOpen] = useState(-1);
    const [hover, setHover] = useState(false);
    const [, setListLoaded] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [anchorElToc, setAnchorElToc] = React.useState(null);
    const [headingSet, setHeadingSet] = React.useState(false);
    const [selectedMeta, setSelectedMeta] = React.useState({
        link: "hello",
        read_time: 2,
    });
    const [tocLines, setTocLines] = React.useState([]);
    const [baseUrl, setBaseUrl] = React.useState(
        serverside === true ? "" : window.location.href
    );
    const [hashRendered, setHashRendered] = React.useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSubItem, setActiveSubItem] = useState(false);
    const headingElementsRef = useRef({})
    var isArticlePage = window.location.pathname.includes("/articles/") || window.location.pathname === "/articles" ? true : false;
    const searchFieldRef = useRef(null);


    useEffect(() => {
        fetchDocList();
        setSidebarOpen(false);

		if (props.match.params === undefined || props.match.params === null) {
			return
		}

		const propkey = props.match.params.key
		if (propkey === undefined || propkey === null) {
			return
		}

		console.log("PROPKEY: ", propkey)
		if (location.pathname.includes("/docs/")) {
			if (propkey === "cookie_policy" || propkey === "compliance" || propkey === "privacy_policy" || propkey === "terms_of_service") {
				navigate(`/legal/${propkey}`)
			}

			if (propkey === "app_creation") {
				navigate('/docs/apps#app-creation-introduction')
			}
		}
    }, [location]);

    useEffect(() => {
        return () => {
            setIsDocSearchModalOpen(false);
            setSearchBarModalOpen(false);
        };
    }, []); 
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    }

    const handleClickToc = (event) => {
        setAnchorElToc(event.currentTarget);
    }

    const handleCollapse = (index) => {
        setOpen(isopen === index ? -1 : index)
    }

    const handleMouseOver = () => {
        setHover(!hover);
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleCloseToc = () => {
        setAnchorElToc(null)
    }

    const intersectionObserver = () => {
        const callback = (headings) => {
            headingElementsRef.current = headings.reduce((map, headingElement) => {
                if (map === undefined) {
                    return {}
                }

                if (headingElement === undefined || headingElement.target === undefined || headingElement.target.id === undefined || headingElement.target.id === null || headingElement.target.id === "") {
                    return map
                }

                if (headingElement.target.id != undefined || headingElement.target.id != "") {
                    map[headingElement.target.id] = headingElement
                    return map
                }
            }, headingElementsRef.current)

            const visibleHeadings = []
            const keys = Object.keys(headingElementsRef.current)

            for (var i = 0; i < keys.length; i++) {
                const headingElement = headingElementsRef.current[keys[i]]
                if (headingElement.isIntersecting) {
                    visibleHeadings.push(headingElement)
                }
            }

            if (visibleHeadings.length > 0) {
                const tocs = document.getElementsByClassName('toc')
                for (const t of tocs) {
                    const currentPoint = t.getElementsByTagName('a')[0]
                    currentPoint.style.color = "white";
                    if (`#${visibleHeadings[0].target.id}`
                        === currentPoint.hash) {
                        currentPoint.style.color = "#f86a3e";
                    }
                }
            }
        }

        const observer = new IntersectionObserver(callback, {
            threshold: [1]
        })

        const headingElements = Array.from(document.querySelectorAll("h2"))
        if (headingElements.length != 0) {
            for (var i = 0; i < headingElements.length; i++) {
                var element = headingElements[i]
                observer.observe(element)
            }
            return () => observer.disconnect()
        }
    }

    if (lastHeading) {
        setTimeout(() => {
            intersectionObserver()
        }, 100)
    }


    const scrollToHash = () => {
        var hash = window.location.hash.replace("#", "").replaceAll("_", "-");
        if (hash.includes('?')) {
            hash = hash.split('?')[0]
        }

        if (hash) {
            const element = document.getElementById(hash.toLowerCase())
            if (element) {
                element.scrollIntoView({
                    behavior: "instant",
                })
            }
        }
    }

    const extractHeadings = content => {
        const headings = [];
        const lines = content.split('\n');
        let inCodeBlock = false;

        for (const line of lines) {
            if (line.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
            }

            if (!inCodeBlock) {
                const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    const title = headingMatch[2].trim();
                    const id = title.toLowerCase().replace(/\s+/g, '-');

                    if (level === 2) {
                        headings.push({ id, title, items: [] });
                    } else if (level === 3 && headings.length) {
                        headings[headings.length - 1].items.push({ id, title });
                    }
                }
            }
        }
        return headings;
    };

    const modalView = (
        <Dialog
          open={searchBarModalOpen && isDocSearchModalOpen}
          onClose={() => {
            setSearchBarModalOpen(false);
            if (searchFieldRef.current) {
                searchFieldRef.current.blur();
            }
          }}
          PaperProps={{
            style: {
              color: "white",
              minWidth: 750,
              minHeight: "180px",
              maxHeight: "85vh",
              borderRadius: 16,
              border: "1px solid var(--Container-Stroke, #494949)",
              background: "var(--Container, #000000)",
              boxShadow: "0px 16px 24px 8px rgba(0, 0, 0, 0.25)",
              position: "fixed",
              top: "70px",
              left: "50%",
              transform: "translateX(-50%)",
            },
          }}
          sx={{
            zIndex: 50005,
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pr: 3, pt: 2 }}>
            <DialogTitle
              sx={{ 
                color: "var(--Paragraph-text, #C8C8C8)",
                p: 0,
                m: 0,
                ml: 1.5,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              Search for Documentation
            </DialogTitle>
            <IconButton 
              onClick={() => setSearchBarModalOpen(false)}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent>
            <Box sx={{ pt: 3 }}>
              <SearchBox globalUrl={globalUrl} serverside={serverside} userdata={userdata} />
            </Box>
          </DialogContent>
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}/>
        </Dialog>
      );


    // extract TOC from actual markdown
    const tocvalue = (markdown) => {
        const items = [];
        let currentMainItem = null;

        const lines = markdown.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('* [') && !line.startsWith(" ", 5)) {
                const matches = line.match(/^\* \[([^)]+)\]\(#([^)]+)\)/);
                if (matches) {
                    currentMainItem = {
                        id: matches[2],
                        title: matches[1],
                        items: [],
                    };
                    items.push(currentMainItem);
                }
            } else if (line.startsWith('  * [')) {
                if (currentMainItem) {
                    const matches = line.match(/^  \* \[([^)]+)\]\(#([^)]+)\)/);
                    if (matches) {
                        currentMainItem.items.push({
                            id: matches[2],
                            title: matches[1],
                        });
                    }
                }
            } else if (line.startsWith('##')) {
                continue
            }
        }
        return items
    }

    const SidebarPaperStyle = {
        backgroundColor: isArticlePage ? "transparent" : "rgb(26,26,26)",
        border: isArticlePage ? "none" : undefined,
        borderRadius: isArticlePage ? "none" : undefined,
        boxShadow: isArticlePage ? "none" : undefined,
        backgroundImage: "none",
        width: isArticlePage ? "100%" : undefined,
        height: isArticlePage ? "100%" : undefined,
        overflowX: "hidden",
        position: "relative",
        paddingLeft: 15,
        paddingRight: 15,
        minHeight: "80vh",
    };

    const noteLabelStyle = {
        fontWeight: "bold",
        color: "#f86a3e",
        display: "block",
        marginBottom: "5px",
    };

    const Blockquote = ({ children }) => {

        const textContent = children.map(child =>
          child.props && child.props.children ? child.props.children.join('') : child
        ).join('').trim();

        // Maybe some more contents....
        const isNote = textContent.startsWith("[!TIP]");
        return (
          <blockquote style={isNote ? alertNote : {}}>
            {isNote && <span style={noteLabelStyle}>Tips:</span>}
            {isNote ? textContent.replace("[!TIP]", "").trim() : children}
          </blockquote>
        );
      };


    const Heading = (props) => {
        const [hover, setHover] = useState(false);
        var id = props.children[0].toLowerCase().toString()
        if (props.level <= 3) {
            id = props.children[0].toLowerCase().toString().replaceAll(" ", "-");
        }

        const element = React.createElement(
            `h${props.level}`,
            { id: `${id}` },
            props.children,
        )

        if (serverside !== true && window.location.hash.length > 0 && props.level === 1 && !hashRendered) {
            setTimeout(() => {
                setHashRendered(true)
                scrollToHash()
            }, 500)
        }

        if (serverside !== true && !lastHeading) {
            setTimeout(() => {
                setLastHeading(true)
            }, 500)
        }

        var extraInfo = "";
        if (props.level === 1) {
            extraInfo = (
                <div
                    style={{
                        backgroundColor: theme.palette.inputColor,
                        padding: 15,
                        borderRadius: theme.palette?.borderRadius,
                        marginBottom: isArticlePage ? 25 : 30,
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

        if (extraInfo !== "" && props.level === 1 && props.children !== undefined && props.children !== null && props.children.length > 0) {
            if (props.children[0].toLowerCase().includes("privacy") || props.children[0].toLowerCase().includes("terms")) {
                extraInfo = ""
            }
        }
        return (
            <Typography
                onMouseOver={() => {
                    setHover(true);
                }}
                id={id}
                style={{
                    scrollPaddingTop: 20,
                }}
            >
                {props.level !== 1 ? (
                    <Divider
                        style={{
                            width: "90%",
                            marginTop: 60,
							marginBottom: isArticlePage ? 40 : 20, 
                            backgroundColor: theme.palette.inputColor,
                        }}
                    />
                ) : null}
                <div style={{
                    display: "flex", marginTop: props.level === 1 ? 20 : 50,
                    marginBlock: "0.85em", alignItems: "center"
                }}>
                    {element}
                    <Link to={`#${id}`}
                     onClick={(e) => {
                        e.preventDefault(); // Prevent default navigation
                        document.getElementById(id)?.scrollIntoView({
                            behavior: 'smooth'
                        });

                        const url = `${window.location.origin}${window.location.pathname}#${id}`;
                        navigator.clipboard.writeText(url);
                        toast("Link copied to clipboard", {
                            position: "bottom-center",
                            autoClose: 2000,
                        });
                    }}
                    style={{
                        textDecoration: "none", color: "white",
                        paddingLeft: "0.3em", rotate: "-30deg",
                        paddingTop: "0.9em", display: props.level === 1 ? "none" : "block",
                    }}>
                        <LinkIcon />
                    </Link>
                </div>
                {isArticlePage ? (userdata?.support ? extraInfo : "") : extraInfo}
            </Typography>
        )
    }


    const SideBar = {
        width: "17%",
        borderRight: !isArticlePage ? "1px solid rgba(255,255,255,0.3)" : undefined,
        minWidth: isArticlePage ? "250px" : "17%",
        maxWidth: isArticlePage ? "250px" : "17%",
        marginLeft: isArticlePage ? sidebarOpen ? 40 : 50 : undefined,
        position: "sticky",
        top: isArticlePage ? 120 : 50,
        paddingTop: isArticlePage ? "0.65em" : "0.25em",
        paddingRight: isArticlePage ? "1em" : undefined,
        minHeight: isArticlePage ? "80vh" : "95vh",
        maxHeight: isArticlePage ? "80vh" : "95vh",
        overflowX: "hidden",
        overflowY: "auto",
        zIndex: 1000,
        backgroundColor: isArticlePage ? "#212121" : undefined,
        borderRadius: isArticlePage ? theme.palette?.borderRadius : undefined,
        transition: isArticlePage ? "width 0.3s ease, min-width 0.3s ease" : undefined,
    };

    const sideBarToggleButton = {
        position: "absolute",
        bottom: sidebarOpen ? 20 : "50%",
        right: sidebarOpen ? 30 : 21,
        zIndex: 1000,
        backgroundColor: "#212121",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "50%",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "transform 0.3s ease",
        "&:hover": {
            backgroundColor: "#2c2c2c",
        }
    };

    const collapsedSideBar = {
        ...SideBar,
        width: "40px",
        minWidth: "40px",
        maxWidth: "40px",
        overflow: "hidden",
    };

    const IndexBar = {
        alignSelf: "flex-start",
        position: "sticky",
        top: 120,
        overflowY: "auto",
        minHeight: "93vh",
        maxHeight: "93vh",
        marginTop: 70,
		maxWidth: 250, 
		overflow: "hidden", 
    }

    const fetchDocList = (resetCache = false) => {
        var url = `${globalUrl}/api/v1/docs`
		if (location.pathname.includes("/legal")) {
			url = `${globalUrl}/api/v1/docs?folder=legal&resetCache=${resetCache}`
		} else if (location.pathname.includes("/articles")) {
			url = `${globalUrl}/api/v1/docs?folder=articles&resetCache=${resetCache}`
		}

        fetch(url, {
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
                    setList(["# Error loading documentation. Please contact us if this persists.",]);
                    toast("Failed loading documentation. Please reload the window")
                }
                setListLoaded(true);
            })
            .catch((error) => { });
    };

    const fetchDoc = (docId) => {
		if (docId === undefined) {
			return 
		}

        var url = `${globalUrl}/api/v1/docs/${docId}`
		if (location.pathname.includes("/legal")) {
			url = `${globalUrl}/api/v1/docs/${docId}?folder=legal`
		} else if (location.pathname.includes("/articles")) {
			url = `${globalUrl}/api/v1/docs/${docId}?folder=articles`
		}

        fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.success === false) {
                    //toast("Failed loading documentation. Please reload the UI")
                }

                if (responseJson.success && responseJson.reason !== undefined) {

                    if(isArticlePage && window.location.pathname.includes("/articles/")) {
                        if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.includes("404: Not Found")) {
                            setData("# Error\nThis page doesn't exist.");
                            toast("This page doesn't exist. Redirecting to the latest article...", {
                                position: "bottom-center",
                                autoClose: 2000,
                            });
                            setTimeout(() => {
                                navigate(`/articles/2.0_release`)
                            }, 2000)
                            return
                        }
                    }
                    // Find <img> tags and translate them into ![]() format
                    const imgRegex = /<img.*?src="(.*?)"/g;
                    const tocRegex = /^## Table of contents[\s\S]*?(?=^## )|^## Table of contents[\s\S]*$/gm;
                    const newdata = responseJson.reason.replace(imgRegex, '![]($1)').replace(tocRegex, "");
                    setData(newdata);
                    if (docId === undefined) {
                        document.title = isArticlePage ? "Shuffle Articles introduction" : "Shuffle documentation";
                    } else {
                        document.title = "Shuffle " + docId.replace("_", " ") + (isArticlePage ? " articles" : " documentation");
                    }

                    if (responseJson.reason !== undefined && responseJson.reason !== null && responseJson.reason.includes("404: Not Found") && !isArticlePage) {
                        //navigate("/docs")
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
                        /*
                        const values = tocvalue(responseJson.reason.match(tocRegex)
                            .join()
                            .toString());
                        setTocLines(values);
                        */
                        const values = extractHeadings(newdata)
                        setTocLines(values)
                    }
                } else {
                    setData("# Error\nThis page doesn't exist.");
                }
            })
            .catch((error) => { });
    };

    const handleResetCache = () => {
        fetchDocList(true);
        toast("Cache has been reset");
    }

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
                if (props.match.params.key === undefined && isArticlePage) {
                    fetch(`${globalUrl}/api/v1/articles`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                    })
                        .then((response) => response.json())
                        .then((responseJson) => {
                            if (responseJson.success && responseJson.list && responseJson.list.length > 0) {
                                // Navigate to the latest article
                                if (responseJson?.list[0]?.name) {
                                    navigate(`/articles/${responseJson?.list[0].name}`);
                                }
                            }
                        })
                        .catch((error) => {
                            console.error("Error fetching articles:", error);
                        });
                } else {
                    console.log("DOCID: ", props.match.params.key)
                    fetchDoc(props.match.params.key)
                }
            }
        }
    }

    // Handles search-based changes that origin from outside this file
    if (serverside !== true && window.location.href !== baseUrl) {
        setBaseUrl(window.location.href);
        fetchDoc(props.match.params.key);
    }

    const markdownStyle = {
        color: "rgba(255, 255, 255, 0.90)",
        overflow: "hidden",
        paddingBottom: 100,
        margin: "auto",
        maxWidth: "100%",
        minWidth: "100%",
        overflow: "hidden",
        fontSize: isMobile ? "1.3rem" : "1.1rem",
    };

    const alertNote = {
        padding: "10px",
        borderLeft: "5px solid #f86a3e",
        backgroundColor: "rgb(26,26,26)",
    };

    const CustomButton = (props) => {
        const { title, icon, link } = props

        return (
            <a
                href={link}
                rel="noopener noreferrer"
                target="_blank"
                style={{ textDecoration: "none", color: "inherit", flex: 1, margin: 10, }}
            >
                <div style={{ cursor: hover ? "pointer" : "default", borderRadius: theme.palette?.borderRadius, flex: 1, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: hover ? theme.palette.surfaceColor : theme.palette.inputColor, padding: 25, }}
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


        if (link === undefined || link === null) {
            return null
        }

        return (
            <Link to={link} style={hrefStyle}>
                <div style={{ width: "100%", height: 80, cursor: hover ? "pointer" : "default", borderRadius: theme.palette?.borderRadius, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: hover ? theme.palette.surfaceColor : theme.palette.inputColor, }}
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

  	const showPartnerLogo = userdata?.org_status?.includes("integration_partner") && userdata?.active_org?.image !== undefined && userdata?.active_org?.image !== null && userdata?.active_org?.image.length > 0 
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
            <Typography variant="h4" style={{ textAlign: "center", marginTop: 20 }}>
                Documentation
            </Typography>
			{showPartnerLogo === true ? null : 
				<div style={{ display: "flex", marginTop: 25, }}>
					<CustomButton title="Talk to Support" icon=<img src="/images/Shuffle_logo_new.png" style={{ height: 35, width: 35, border: "", borderRadius: theme.palette?.borderRadius, }} /> />
					<CustomButton title="Ask the community" icon=<img src="/images/social/discord.png" style={{ height: 35, width: 35, border: "", borderRadius: theme.palette?.borderRadius, }} /> link="https://discord.gg/B2CBzUm" />
				</div>
			}

            <div style={{ textAlign: "left" }}>
                <Typography variant="h6" style={headerStyle} >Tutorial</Typography>
                <Typography variant="body1">
                    <b>Dive in.</b> Hands-on is the best approach to see how Shuffle can transform your security operations. Our set of tutorials and videos teach you how to build your skills. Check out the <Link to="/docs/getting_started" style={hrefStyle2}>getting started</Link> section to give it a go!
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
        </div>

    const markdownComponents = {
        img: Img,
        code: CodeHandler,
        h1: Heading,
        h2: Heading,
        h3: Heading,
        h4: Heading,
        h5: Heading,
        h6: Heading,
        a:  OuterLink,
        p:  Paragraph,
        blockquote: Blockquote,
    }


    const activeHrefStyleToc2 = {
        ...hrefStyleToc2,
        color: "#f86a3e",
    };

    const activeListItemStyle = {
        backgroundColor: "rgba(248, 106, 62, 0.08)", // Slight orange tint
        marginRight: window.location.pathname.includes("/articles/") ? "0.8em" : undefined,
        borderLeft: "3px solid #f86a3e",
        paddingLeft: "13px", // Compensate for the border
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };
    


    // PostDataBrowser Section
    const postDataBrowser =
        list === undefined || list === null ? null : (
            <div style={Body}>
                <div style={!isArticlePage ? SideBar : (sidebarOpen ? SideBar : collapsedSideBar)}>
                    <Paper style={SidebarPaperStyle}>
                        {modalView}
                        {
                            !isArticlePage && (
                                <TextField
                                    variant="outlined"
                                    placeholder="Search Docs..."
                                    size="small"
                                    onClick={() => {
                                        setIsDocSearchModalOpen(true)
                                        setSearchBarModalOpen(true)
                                    }}
                                    inputRef={searchFieldRef}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon style={{ color: "white" }} />
                                            </InputAdornment>
                                        ),
                                        style: {
                                            backgroundColor: "#212121",
                                            borderRadius: 4,
                                            color: "white",
                                        },
                                    }}
                                    style={{
                                        marginTop: 10,
                                        marginLeft: 10,
                                        borderRadius: 4,
                                        width: !isLoggedIn ? "14%" : !leftSideBarOpenByClick ?  "12%" : "11%",
                                        maxWidth: "285px",
                                        position: "fixed",
                                        zIndex: 1100,
                                    }}
                                    inputProps={{
                                        readOnly: true,
                                    }}
                                />
                            )
                        }
                        <List style={{ 
                            listStyle: "none", 
                            paddingLeft: "0",
                            paddingTop: !isArticlePage ? "60px" : undefined,
                            paddingBottom: !isArticlePage ? "30px" : undefined,
                            display: isArticlePage ? sidebarOpen ? "block" : "none" : undefined,
                            opacity: isArticlePage ? sidebarOpen ? 1 : 0 : undefined,
                            transition: isArticlePage ? "opacity 0.3s ease" : undefined,
                            height: isArticlePage ? "90%" : undefined,  
                            }}>
                            {list.map((data, index) => {
                                const item = data.name;
                                if (item === undefined) {
                                    return null;
                                }

                                var path = "/docs/" + item;
								if (location.pathname.includes("/legal")) {
									path = "/legal/" + item
								} else if (location.pathname.includes("/articles")) {
									path = "/articles/" + item
								}

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
                                            style={{
                                                ...hrefStyle,
                                                ...(itemMatching ? activeListItemStyle : {}),
                                            }}
                                            to={path}
                                        >
                                            <ListItemText
                                                style={{ 
                                                    color: itemMatching ? "#f86a3e" : "inherit",
                                                    flex: 1,
                                                }}
                                                primary={
                                                    <Typography
                                                        variant="body1"
                                                        style={{
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                    >
                                                        {newname}
                                                    </Typography>
                                                }
                                            />
                                            <KeyboardArrowRightIcon 
                                                style={{ 
                                                    color: itemMatching ? "#f86a3e" : "inherit",
                                                    fontSize: "1.1rem",
                                                    marginRight: "-6px",
                                                }}
                                            />
                                        </ListItemButton>
                                    </li>
                                );
                            })}
                        </List>
                        {
                            isArticlePage && (
                                <IconButton
                                    onClick={toggleSidebar}
                                    style={sideBarToggleButton}
                                >
                                    {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                                </IconButton>
                            )
                        }
                    </Paper>
                </div>
                <div style={{
                    width: isArticlePage ? sidebarOpen ? "60%" : "70%" : "60%", 
                    margin: isArticlePage ? sidebarOpen ? "0 0px 30px 30px" : "0 0px 30px 60px" : "30px 0px 30px 30px", 
                    overflow: "hidden", 
                    paddingRight: 50, 
                    paddingLeft: 40,
                    transition: "width 0.3s ease, margin 0.3s ease",
                }}>
                    {props.match.params.key === undefined ?
                        mainpageInfo
                        :
                        <div id="markdown_wrapper_outer" style={markdownStyle}>
                            <Markdown
                                components={markdownComponents}
                                id="markdown_wrapper"
                                className={"style.reactMarkdown"}
                                escapeHtml={false}
                                skipHtml={false}
                                remarkPlugins={[remarkGfm]}
                                style={{
                                    maxWidth: "100%", minWidth: "100%",
                                }}
                            >
                                {data}
                            </Markdown>
                        </div>
                    }
                </div>
                <div style={IndexBar}>
                     {userdata?.support && isArticlePage && (
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            onClick={handleResetCache}
                            style={{marginBottom: "15px"}}
                        >
                            Reset Cache
                        </Button>
                    )}
                    {tocLines.length > 0 ?
                        (
                            <h4 style={{ fontWeight: 600, margin: 0, fontSize: "16px", marginBottom: "8px" }}>Table Of Content</h4>

                        ) : null}
                    <div
                    style={{
                        overflowY: "auto",
                        maxHeight: "90vh",
                    }}>
                        {tocLines.map((data, index) => {
                            return (
                                <div className="toc"
								>
                                    <ListItemButton
                                        key={data.text}
                                        href={`#${data.id}`}
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 400,
											padding: isArticlePage ? "4px 0" : "4px 8px 4px 8px",
                                            paddingLeft: isArticlePage ? "0" : "8px",
                                            paddingRight: isArticlePage ? "0" : "8px",
                                            lineHeight: "20px",
                                            color: activeId === data.id ? "#f86a3e" : "inherit", 
                                        }}
                                        onClick={(e) => {
                                            handleCollapse(index)
                                            setActiveId(data.id)
                                        }}
                                    >
                                        {data.title}
                                        {data.items.length > 0 ? (
                                            <>{isopen == index ? <ExpandMoreIcon /> : <KeyboardArrowRightIcon />}</>
                                        ) : null}
                                    </ListItemButton>
                                    {
                                        data.items.length > 0 &&
                                            data.items !== null &&
                                            data.items !== undefined ? (
                                            <Collapse in={isopen === index} timeout="auto" unmountOnExit>
                                                {data.items.map((d, i) => {
                                                    return (
                                                        <ListItemButton
                                                            key={i}
                                                            style={activeSubItem === d.id ? activeHrefStyleToc2 : hrefStyleToc2}
                                                            href={`#${d.id}`}
                                                            onClick={(e) => {
                                                                // e.preventDefault()
                                                                setActiveSubItem(d.id)
                                                            }}
                                                        >
                                                            {d.title}
                                                        </ListItemButton>
                                                    )
                                                })}
                                            </Collapse>
                                        ) : null
                                    }
                                </div>

                            )
                        })}
                    </div>
                </div >

            </div >
        );

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
                        <div style={{ color: "white" }}>More {isArticlePage ? "articles" : "docs"}</div>
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

                            const path = isArticlePage ? "/articles/" + item : "/docs/" + item;
                            const newname =
                                item.charAt(0).toUpperCase() +
                                item.substring(1).split("_").join(" ").split("-").join(" ");
                            return (
                                <MenuItem
                                    key={index}
                                    style={{ color: "white" }}
                                    onClick={() => {
                                        navigate(path)
                                        handleClose()
                                    }}
                                >
                                    {newname}
                                </MenuItem>
                            );
                        })}
                    </Menu>
                    <Button
                        fullWidth
                        style={{ marginTop: "2px" }}
                        aria-controls="simple-menu"
                        aria-haspopup="ture"
                        variant="outlined"
                        color="primary"
                        onClick={handleClickToc}
                    >
                        <div style={{ color: "white" }}>Table Of Contents</div>
                    </Button>
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorElToc}
                        style={{}}
                        keepMounted
                        open={Boolean(anchorElToc)}
                        onClose={handleCloseToc}
                    >
                        {tocLines.map((data, index) => {
                            return (
                                <MenuItem
                                    key={index}
                                    style={{ color: "white" }}
                                    component={Link}
                                    to={`#${data.id}`}
                                    onClick={() => {
                                        console.log(`Scrolling to: ${data.id}`);
                                        setTimeout(() => {
                                            const element = document.getElementById(data?.id);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            } else {
                                                console.error(`Element with id ${data.id} not found.`);
                                            }
                                        }, 100); // Delay to ensure the content is loaded
                                        handleCloseToc();
                                    }}
                                >
                                    {data.title}
                                </MenuItem>
                            )
                        })}
                    </Menu>
                </div>
                {props.match.params.key === undefined ?
                    mainpageInfo
                    :
                    <div id="markdown_wrapper_outer" style={markdownStyle}>
                        <Markdown
                            components={markdownComponents}
                            id="markdown_wrapper"
                            escapeHtml={false}
                            style={{
                                maxWidth: "100%", minWidth: "100%",
                            }}
                        >
                            {data}
                        </Markdown>
                    </div>
                }
                <Divider
                    style={{
                        marginTop: "10px",
                        marginBottom: 30,
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
                    <div style={{ color: "white" }}>More {isArticlePage ? "articles" : "docs"}</div>
                </Button>
            </div>
        );

    // Padding and zIndex etc set because of footer in cloud.
const loadedCheck = (
    <DocsWrapper isLoggedIn={isLoggedIn} isLoaded={isLoaded}>
        <DocsContent postDataBrowser={postDataBrowser} postDataMobile={postDataMobile}/>
    </DocsWrapper>
);

return <div>{loadedCheck}</div>;

};

export default Docs;

const DocsContent = memo(({postDataBrowser, postDataMobile}) => {
    return(
        <div style={{fontFamily: theme?.palette?.fontFamily}}>
            <BrowserView>{postDataBrowser}</BrowserView>
            <MobileView>{postDataMobile}</MobileView>
        </div>
)})

const DocsWrapper = memo(({isLoggedIn, isLoaded, children })=>{
    
    const { leftSideBarOpenByClick, windowWidth } = useContext(Context);

    return (
        <div style={{
            marginTop: window.location.pathname.includes("/articles/") ? 50 : undefined, 
            paddingBottom: 50,
            minHeight: 1000, zIndex: 1, 
            maxWidth: Math.min(!(isLoggedIn && isLoaded) ? 1920 : leftSideBarOpenByClick ? windowWidth - 300 : windowWidth - 200, 1920), 
            minWidth: isMobile ? null : (isLoggedIn && isLoaded) ? leftSideBarOpenByClick ? 800 : 900 : null, margin: "auto", 
            position: (isLoggedIn && isLoaded) && leftSideBarOpenByClick ? "relative" : "static", 
            left: (isLoggedIn && isLoaded) && leftSideBarOpenByClick ? 120 : (isLoggedIn && isLoaded) && !leftSideBarOpenByClick ? 80 : 0, 
            marginLeft: windowWidth < 1920 ? leftSideBarOpenByClick && (isLoggedIn && isLoaded) ? window.location.pathname.includes("/articles/") ? 0 : 90 : (isLoggedIn && isLoaded) && !leftSideBarOpenByClick ? 80 : 0 : "auto", width: "100%", 
            transition: "left 0.3s ease-in-out, min-width 0.3s ease-in-out, max-width 0.3s ease-in-out, position 0.3s ease-in-out, margin 0.3s ease-in-out, margin-left 0.3s ease"
            }}>
            {children}
        </div>
    )
})
