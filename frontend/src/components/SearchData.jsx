import React, { useState, useEffect, useRef, useContext } from 'react';

import theme from '../theme.jsx';
import { useNavigate, Link, useParams } from "react-router-dom";
import { toast } from "react-toastify" 

import {
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    List,
    Card,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Grid,
    Typography,
    Tooltip,
    Divider,
    Button,
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';

import {
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material'

import {
    AvatarGroup,
} from "@mui/material"

import { Context } from '../context/ContextApi.jsx';

import { Search as SearchIcon, Close as CloseIcon, Folder as FolderIcon, Code as CodeIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material'

import algoliasearch from 'algoliasearch/lite';
import aa from 'search-insights'
import { InstantSearch, Configure, connectSearchBox, connectHits, Index } from 'react-instantsearch-dom';
//import { InstantSearch, SearchBox, Hits, connectSearchBox, connectHits, Index } from 'react-instantsearch-dom';

// https://www.algolia.com/doc/api-reference/widgets/search-box/react/
const chipStyle = {
    backgroundColor: "#3d3f43", height: 30, marginRight: 5, paddingLeft: 5, paddingRight: 5, height: 28, cursor: "pointer", borderColor: "#3d3f43", color: "white",
}

const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const SearchData = props => {
    const { serverside, globalUrl, userdata } = props
    let navigate = useNavigate();
    const { searchBarModalOpen, setSearchBarModalOpen } = useContext(Context);
    const borderRadius = 3
    const node = useRef()
    const [searchOpen, setSearchOpen] = useState(false)
    const [oldPath, setOldPath] = useState("")
    const [value, setValue] = useState("");

    const handleLinkClick = () => {
        if (searchBarModalOpen) {
            setSearchBarModalOpen(false); // Assuming setModalOpen is defined correctly
        } else {
            console.log("Condition not met, staying on the same page");
        }
    };

    if (serverside === true) {
        return null
    }

    //if (window !== undefined && window.location !== undefined && window.location.pathname === "/search") {
    //    return null
    //}

    const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
    // if (window.location.pathname === "/docs" || window.location.pathname === "/apps" || window.location.pathname === "/usecases"  ) {
    //     setModalOpen(false)
    // }

    // useEffect(() => {
    // 	if (searchOpen) {
    // 		var tarfield = document.getElementById("shuffle_search_field")
    // 		tarfield.focus()
    // 	}
    // }, searchOpen)

    const SearchBox = ({ currentRefinement, refine, isSearchStalled, }) => {
        const [inputValue, setInputValue] = useState(currentRefinement);

        const textFieldRef = useRef(null);
        const keyPressHandler = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                // navigate(`/search?q=${currentRefinement}`, { state: value, replace: true });
                // setModalOpen(false);
                const trimmedValue = inputValue.trim();
                if (trimmedValue !== '') {
                    navigate(`/search?q=${trimmedValue}`, { state: trimmedValue, replace: true });
                    setSearchBarModalOpen(false);
                }
            }
        };

        useEffect(() => {
            if (searchOpen && textFieldRef.current) {
                textFieldRef.current.focus();
            }
        }, [searchOpen]);

        return (

            <form id="search_form" noValidate type="searchbox" action="" role="search" onClick={() => {
            }}
            >
                <TextField
                    fullWidth
                    style={{ zIndex: 1100, marginTop: -20, marginBottom: 200, position: "fixed", backgroundColor: theme.palette.inputColor, borderRadius: borderRadius, width: 685, }}
                    InputProps={{
                        style: {
                            color: "white",
                            fontSize: "1em",
                            height: 50,
                            margin: 0,
                            fontSize: "0.9em",
                            paddingLeft: 10,
                        },
                        disableUnderline: true,
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon style={{ marginLeft: 5, marginRight: 10, color: "#f86a3e", }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="start">
                                <Typography position="end" style={{ fontSize: 18, color: "#f86a3e", marginLeft: 10, textTransform: "lowercase", width: 30 }}>
                                    esc
                                </Typography>
                            </InputAdornment>
                        ),
                    }}
                    autoComplete='off'
                    type="search"
                    color="primary"
                    placeholder="Find Public Apps, Workflows, Documentation..."
                    value={inputValue}
                    id="shuffle_search_field"
                    onClick={(event) => {
                        if (inputValue.trim() !== '') {
                            setSearchOpen(true);
                        }
                    }}
                    onBlur={(event) => {
                        setSearchOpen(inputValue.trim() !== '')
                    }}
                    onChange={(event) => {
                        const newValue = event.target.value;
                        setInputValue(newValue);
                        refine(newValue);
                        if (newValue.trim() !== '') {
                            setSearchOpen(true);
                        } else {
                            setSearchOpen(false);
                        }
                    }}
                    onKeyDown={keyPressHandler}
                    inputRef={textFieldRef}
                    limit={5}
                    autoFocus
                />
                {/*isSearchStalled ? 'My search is stalled' : ''*/}
            </form>
        )
    }

    const WorkflowHits = ({ hits }) => {
        const [mouseHoverIndex, setMouseHoverIndex] = useState(0)

        var tmp = searchOpen
        if (!searchOpen) {
            return null
        }


        const positionInfo = document.activeElement.getBoundingClientRect()
        const outerlistitemStyle = {
            width: "100%",
            overflowX: "hidden",
            overflowY: "hidden",
            borderBottom: "1px solid rgba(255,255,255,0.4)",
        }

        if (hits.length > 4) {
            hits = hits.slice(0, 4)
        }

        var type = "workflows"
        const baseImage = <CodeIcon />

        return (
            <Card elevation={0} style={{ marginRight: 10, marginTop: 50, color: "white", zIndex: 1002, backgroundColor: theme.palette.inputColor, width: "100%", left: 75, boxShadows: "none", }}>
                <Typography variant="h6" style={{ margin: "10px 10px 0px 20px", color: "#FF8444", borderBottom: "1px solid", width: 105 }}>
                    Workflows
                </Typography>

                <List style={{ backgroundColor: theme.palette.inputColor, }}>
                    {hits.length === 0 ?
                        <ListItem style={outerlistitemStyle}>
                            <ListItemAvatar onClick={() => console.log(hits)}>
                                <Avatar>
                                    <FolderIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={"No workflows found."}
                                secondary={"Try a broader search term"}
                            />
                        </ListItem>
                        :
                        hits.map((hit, index) => {
                            const innerlistitemStyle = {
                                width: positionInfo.width + 35,
                                overflowX: "hidden",
                                overflowY: "hidden",
                                borderBottom: "1px solid rgba(255,255,255,0.4)",
                                backgroundColor: mouseHoverIndex === index ? "#1f2023" : "inherit",
                                cursor: "pointer",
                                marginLeft: 5,
                                marginRight: 5,
                                maxHeight: 75,
                                minHeight: 75,
                                maxWidth: 420,
                                minWidth: "100%",
                            }

                            const name = hit.name === undefined ?
                                hit.filename.charAt(0).toUpperCase() + hit.filename.slice(1).replaceAll("_", " ") + " - " + hit.title :
                                (hit.name.charAt(0).toUpperCase() + hit.name.slice(1)).replaceAll("_", " ")
                            const secondaryText = hit.description !== undefined && hit.description !== null && hit.description.length > 3 ? hit.description.slice(0, 40) + "..." : ""
                            const appGroup = hit.action_references === undefined || hit.action_references === null ? [] : hit.action_references
                            const avatar = baseImage


                            var parsedUrl = isCloud ? `/workflows/${hit.objectID}` : `https://shuffler.io/workflows/${hit.objectID}`

                            parsedUrl += `?queryID=${hit.__queryID}`
							const validated = hit.validated !== undefined && hit.validate !== null ? hit.validated : false

                            // <a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{textDecoration: "none", color: "white"}}>
                            return (
                                <Link key={hit.objectID} to={parsedUrl} rel="noopener noreferrer" style={{ textDecoration: "none", color: "white", }} onClick={(event) => {
                                    //console.log("CLICK")
                                    setSearchOpen(true)
                                    setSearchBarModalOpen(false)
                                    aa('init', {
                                        appId: searchClient.appId,
                                        apiKey: searchClient.transporter.queryParameters["x-algolia-api-key"]
                                    })

                                    const timestamp = new Date().getTime()
                                    aa('sendEvents', [
                                        {
                                            eventType: 'click',
                                            eventName: 'Workflow Clicked',
                                            index: 'workflows',
                                            objectIDs: [hit.objectID],
                                            timestamp: timestamp,
                                            queryID: hit.__queryID,
                                            positions: [hit.__position],
                                            userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
                                        }
                                    ])

                                    if (!isCloud) {
                                        event.preventDefault()
                                        window.open(parsedUrl, '_blank');
                                    }
                                }}>
                                    <ListItem key={hit.objectID} style={innerlistitemStyle} onMouseOver={() => {
                                        setMouseHoverIndex(index)
                                    }}>
                                        <ListItemAvatar>
											{validated === true ? 
												<Tooltip title="The functionality of this workflow manually verified by the Shuffle automation team" placement="top">
													<VerifiedUserIcon style={{marginLeft: 0, marginRight: 20, }} />
												</Tooltip>
										  		: 
												<Tooltip title="Community-built workflow" placement="top">
													{avatar}
												</Tooltip>
											}
                                        </ListItemAvatar>
                                        <div style={{}}>
                                            <ListItemText
                                                primary={name}
                                            />
                                            <AvatarGroup max={10} style={{ flexDirection: "row", padding: 0, margin: 0, itemAlign: "left", textAlign: "left", }}>
                                                {appGroup.map((app, index) => {
                                                    // Putting all this in secondary of ListItemText looked weird.
                                                    return (
                                                        <div
                                                            key={index}
                                                            style={{
                                                                height: 24,
                                                                width: 24,
                                                                filter: "brightness(0.6)",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => {
                                                                navigate("/apps/" + app.id)
                                                            }}
                                                        >
                                                            <Tooltip color="primary" title={app.name} placement="bottom">
                                                                <Avatar alt={app.name} src={app.image_url} style={{ width: 24, height: 24 }} />
                                                            </Tooltip>
                                                        </div>
                                                    )
                                                })}
                                            </AvatarGroup>
                                        </div>
                                        {/*
										<ListItemSecondaryAction>
											<IconButton edge="end" aria-label="delete">
												<DeleteIcon />
											</IconButton>
										</ListItemSecondaryAction>
										*/}
                                    </ListItem>
                                </Link>
                            )
                        })
                    }
                </List>
                {/*
				<span style={{display: "flex", textAlign: "left", float: "left", position: "absolute", left: 15, bottom: 10, }}>
					<Link to="/search" style={{textDecoration: "none", color: "#f85a3e"}}>
						<Typography variant="body2" style={{}}>
							See all workflows 
						</Typography>
					</Link>
				</span>
				*/}
            </Card>
        )
    }

	const activateApp = (name, appid, type) => {
	  if (globalUrl === undefined || globalUrl === null) {
		  console.log(`Global URL not set`)
		  return
	  }

	  if (name === undefined || name === null) {
		  name = ""
	  }

	  name = name.replaceAll("_", " ")

	  if (userdata === undefined || userdata === null || userdata.id === undefined) {
		  toast(`You need to be logged in to activate the ${name} app. Redirecting`)

		  setTimeout(() => {
		  	navigate(`/register?message=You need to be logged in to use the ${name} app.`)
		  }, 500)
		  return
	  }

	  const url = `${globalUrl}/api/v1/apps/${appid}/${type}` 

      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.status !== 200) {
			toast(`Failed to ${type} the app for your organization. Please try again or contact support@shuffler.io`)
          }

          return response.json()
        })
        .then((responseJson) => {
          if (responseJson.success === false) {
            toast(`Failed to ${type} the app for your organization. Please try again or contact support@shuffler.io for more info`) 
		  } else {
			  toast(`App successfully ${type}d. Please refresh the page to use it.`)
		  }
        })
        .catch(error => {
          //toast(error.toString())
          console.log("Activate app error: ", error.toString())
        });
    }  

    const AppHits = ({ hits }) => {
        const [mouseHoverIndex, setMouseHoverIndex] = useState(0)

        var tmp = searchOpen
        if (!searchOpen) {
            return null
        }

        const positionInfo = document.activeElement.getBoundingClientRect()
        const outerlistitemStyle = {
            width: "100%",
            overflowX: "hidden",
            overflowY: "hidden",
            borderBottom: "1px solid rgba(255,255,255,0.4)",
        }

        if (hits.length > 4) {
            hits = hits.slice(0, 4)
        }

        var type = "app"
        const baseImage = <LibraryBooksIcon />

        return (
            <Card elevation={0} style={{ marginRight: 10, color: "white", zIndex: 999, backgroundColor: theme.palette.inputColor, width: 685, boxShadows: "none", }}>
                {/* <IconButton style={{ zIndex: 5000, position: "absolute", right: 14, color: "grey" }} onClick={() => {
                    setSearchOpen(false)
                }}>
                    <CloseIcon />
                </IconButton> */}
                <Typography variant="h6" style={{ margin: "40px 10px 0px 20px", color: "#FF8444", borderBottom: "1px solid", width: 50 }}>
                    Apps
                </Typography>

                <List style={{ backgroundColor: theme.palette.inputColor, }}>
                    {hits.length === 0 ?
                        <ListItem style={outerlistitemStyle}>
                            <ListItemAvatar onClick={() => console.log(hits)}>
                                <Avatar>
                                    <FolderIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={"No apps found."}
                                secondary={"Try a broader search term"}
                            />
                        </ListItem>
                        :
                        hits.map((hit, index) => {
                            const innerlistitemStyle = {
                                width: positionInfo.width + 35,
                                overflowX: "hidden",
                                overflowY: "hidden",
                                borderBottom: "1px solid rgba(255,255,255,0.4)",
                                backgroundColor: mouseHoverIndex === index ? "#1f2023" : "inherit",
                                cursor: "pointer",
                                marginLeft: 5,
                                marginRight: 5,
                                maxHeight: 75,
                                minHeight: 75,
                                maxWidth: 420,
                                minWidth: "100%",
                            }

                            const name = hit.name === undefined ?
                                hit.filename.charAt(0).toUpperCase() + hit.filename.slice(1).replaceAll("_", " ") + " - " + hit.title :
                                (hit.name.charAt(0).toUpperCase() + hit.name.slice(1)).replaceAll("_", " ")
                            var secondaryText = hit.data !== undefined ? hit.data.slice(0, 40) + "..." : ""
                            const avatar = hit.image_url === undefined ?
                                baseImage
                                :
                                <Avatar
                                    src={hit.image_url}
                                    variant="rounded"
                                />
                            //console.log(hit)
                            if (hit.categories !== undefined && hit.categories !== null && hit.categories.length > 0) {
                                secondaryText = hit.categories.slice(0, 3).map((data, index) => {
                                    if (index === 0) {
                                        return data
                                    }

                                    return ", " + data

                                    /*
                                        <Chip
                                            key={index}
                                            style={chipStyle}
                                            label={data}
                                            onClick={() => {
                                                //handleChipClick
                                            }}
                                            variant="outlined"
                                            color="primary"
                                        />
                                    */
                                })
                            }

                            var parsedUrl = isCloud ? `/apps/${hit.objectID}` : `https://shuffler.io/apps/${hit.objectID}`
                            parsedUrl += `?queryID=${hit.__queryID}`

                            return (
                                <Link key={hit.objectID} to={parsedUrl} style={{ textDecoration: "none", color: "white", }} onClick={(event) => {
                                    setSearchOpen(true)
                                    setSearchBarModalOpen(false)
                                    aa('init', {
                                        appId: searchClient.appId,
                                        apiKey: searchClient.transporter.queryParameters["x-algolia-api-key"]
                                    })

                                    const timestamp = new Date().getTime()
                                    aa('sendEvents', [
                                        {
                                            eventType: 'click',
                                            eventName: 'App Clicked',
                                            index: 'appsearch',
                                            objectIDs: [hit.objectID],
                                            timestamp: timestamp,
                                            queryID: hit.__queryID,
                                            positions: [hit.__position],
                                            userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
                                        }
                                    ])

                                    if (!isCloud) {
                                        event.preventDefault()
                                        window.open(parsedUrl, '_blank');
                                    }
                                }}>
                                    <ListItem key={hit.objectID} style={innerlistitemStyle} onMouseOver={() => {
                                        setMouseHoverIndex(index)
                                    }}>
                                        <ListItemAvatar>
                                            {avatar}
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={name}
                                            secondary={secondaryText}
                                        />
                                        {/*
										<ListItemSecondaryAction>
											<IconButton edge="end" aria-label="delete">
												<DeleteIcon />
											</IconButton>
										</ListItemSecondaryAction>
										*/}
										<Button
											variant="outlined"
											color="secondary"
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()

												// This does nothing rofl
												if (userdata.active_apps === undefined || userdata.active_apps === null) {
													activateApp(hit.name, hit.objectID, "activate")
												} else {
													if (userdata.active_apps.includes(hit.objectID)) {
														activateApp(hit.name, hit.objectID, "deactivate")
													} else {
														activateApp(hit.name, hit.objectID, "activate")
													}
												}
											}}
										>
											{userdata.active_apps !== undefined && userdata.active_apps !== null && userdata.active_apps.includes(hit.objectID) ? "Deactivate" : "Activate"}
										</Button>
                                    </ListItem>
                                </Link>
                            )
                        })
                    }
                </List>
                {/* <span style={{ display: "flex", textAlign: "left", float: "left", position: "absolute", left: 15, bottom: 10, }}>
                    <Link to="/search" style={{ textDecoration: "none", color: "#f85a3e" }}>
                        <Typography variant="body1" style={{}}>
                            See more
                        </Typography>
                    </Link>
                </span> */}
            </Card>
        )
    }

    const DocHits = ({ hits }) => {
        const [mouseHoverIndex, setMouseHoverIndex] = useState(0)

        var tmp = searchOpen
        if (!searchOpen) {
            return null
        }


        const positionInfo = document.activeElement.getBoundingClientRect()
        const outerlistitemStyle = {
            width: "100%",
            overflowX: "hidden",
            overflowY: "hidden",
            borderBottom: "1px solid rgba(255,255,255,0.4)",
        }

        if (hits.length > 4) {
            hits = hits.slice(0, 4)
        }

        const type = "documentation"
        const baseImage = <LibraryBooksIcon />

        //console.log(type, hits.length, hits)

        return (
            <Card elevation={0} style={{ marginRight: 10, marginTop: 50, color: "white", zIndex: 1002, backgroundColor: theme.palette.inputColor, width: "100%", left: 470, boxShadows: "none", }}>
                {/* <IconButton style={{ zIndex: 5000, position: "absolute", right: 14, color: "grey" }} onClick={() => {
                    setSearchOpen(false)
                }}>
                    <CloseIcon />
                </IconButton> */}
                <Typography variant="h6" style={{ margin: "10px 10px 0px 20px", color: "#FF8444", borderBottom: "1px solid", width: 152 }}>
                    Documentation
                </Typography>
                {/*
				<IconButton edge="end" aria-label="delete" style={{position: "absolute", top: 5, right: 15,}} onClick={() => {
					setSearchOpen(false)
				}}>
					<DeleteIcon />
				</IconButton>
				*/}
                <List style={{ backgroundColor: theme.palette.inputColor, }}>
                    {hits.length === 0 ?
                        <ListItem style={outerlistitemStyle}>
                            <ListItemAvatar onClick={() => console.log(hits)}>
                                <Avatar>
                                    <FolderIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={"No documentation."}
                                secondary={"Try a broader search term"}
                            />
                        </ListItem>
                        :
                        hits.map((hit, index) => {
                            const innerlistitemStyle = {
                                width: positionInfo.width + 35,
                                overflowX: "hidden",
                                overflowY: "hidden",
                                borderBottom: "1px solid rgba(255,255,255,0.4)",
                                backgroundColor: mouseHoverIndex === index ? "#1f2023" : "inherit",
                                cursor: "pointer",
                                marginLeft: 5,
                                marginRight: 5,
                                maxHeight: 75,
                                minHeight: 75,
                                maxWidth: 420,
                                minWidth: "100%",
                            }

                            var name = hit.name === undefined ?
                                hit.filename.charAt(0).toUpperCase() + hit.filename.slice(1).replaceAll("_", " ") + " - " + hit.title
                                :
                                (hit.name.charAt(0).toUpperCase() + hit.name.slice(1)).replaceAll("_", " ")

                            if (name.length > 30) {
                                name = name.slice(0, 30) + "..."
                            }
                            const secondaryText = hit.data !== undefined ? hit.data.slice(0, 40) + "..." : ""
                            const avatar = hit.image_url === undefined ?
                                baseImage
                                :
                                <Avatar
                                    src={hit.image_url}
                                    variant="rounded"
                                />

                            var parsedUrl = hit.urlpath !== undefined ? hit.urlpath : ""
                            parsedUrl += `?queryID=${hit.__queryID}`
                            if (parsedUrl.includes("/apps/")) {
                                const extraHash = hit.url_hash === undefined ? "" : `#${hit.url_hash}`

                                parsedUrl = `/apps/${hit.filename}`
                                parsedUrl += `?tab=docs&queryID=${hit.__queryID}${extraHash}`
                            }

                            return (
                                <Link key={hit.objectID} to={parsedUrl} style={{ textDecoration: "none", color: "white", }} onClick={(event) => {
                                    aa('init', {
                                        appId: searchClient.appId,
                                        apiKey: searchClient.transporter.queryParameters["x-algolia-api-key"]
                                    })

                                    const timestamp = new Date().getTime()
                                    aa('sendEvents', [
                                        {
                                            eventType: 'click',
                                            eventName: 'Document Clicked',
                                            index: 'documentation',
                                            objectIDs: [hit.objectID],
                                            timestamp: timestamp,
                                            queryID: hit.__queryID,
                                            positions: [hit.__position],
                                            userToken: userdata === undefined || userdata === null || userdata.id === undefined ? "unauthenticated" : userdata.id,
                                        }
                                    ])

                                    console.log("CLICK")
                                    setSearchOpen(true)
                                    setSearchBarModalOpen(false)
                                }}>
                                    <ListItem key={hit.objectID} style={innerlistitemStyle} onMouseOver={() => {
                                        setMouseHoverIndex(index)
                                    }}>
                                        <ListItemAvatar>
                                            {avatar}
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={name}
                                            secondary={secondaryText}
                                        />
                                        {/*
									<ListItemSecondaryAction>
										<IconButton edge="end" aria-label="delete">
											<DeleteIcon />
										</IconButton>
									</ListItemSecondaryAction>
									*/}
                                    </ListItem>
                                </Link>
                            )
                        })
                    }
                </List>
            </Card>
        )
    }

    const DiscordHits = ({ hits }) => {
        const [mouseHoverIndex, setMouseHoverIndex] = useState(0);
        var tmp = searchOpen
        if (!searchOpen) {
            return null
        }


        const positionInfo = document.activeElement.getBoundingClientRect()
        const outerlistitemStyle = {
            width: "100%",
            overflowX: "hidden",
            overflowY: "hidden",
            borderBottom: "1px solid rgba(255,255,255,0.4)",
        }

        if (hits.length > 4) {
            hits = hits.slice(0, 4)
        }
        const type = "Discord Text"
        const handleHitClick = (url) => {
            const modifiedUrl = url.replace('https://ptb.discord.com/', 'https://discord.com/');
            window.open(modifiedUrl, '_blank');
        };
        return (
            <Card elevation={0} style={{ marginRight: 10, marginTop: 50, color: "white", zIndex: 1002, backgroundColor: theme.palette.inputColor, width: "100%", left: 470, boxShadows: "none", }}>
                <Typography variant="h6" style={{ margin: "10px 10px 0px 20px", color: "#FF8444", borderBottom: "1px solid", width: 152 }}>
                    Discord Chat
                </Typography>
                <List style={{ backgroundColor: theme.palette.inputColor, }}>
                {hits.length === 0 ?
                        <ListItem style={outerlistitemStyle}>
                            <ListItemAvatar onClick={() => console.log(hits)}>
                                <Avatar>
                                    <FolderIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={"No results found?"}
                                secondary={"Try refining your search."}
                            />
                        </ListItem>:
                        hits.map((chat, index) => (
                    <ListItem onClick={() => handleHitClick(chat.url)} key={index} style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.4)" }} onMouseOver={() => setMouseHoverIndex(index)}>
                        <ListItemAvatar>
                            <Avatar src="/discord-logo.png" />
                        </ListItemAvatar>
                        <ListItemText
                            primary={chat.text}
                            secondary={`User: ${(chat.user)}`}
                        />
                    </ListItem>
                ))}
            </List>
            </Card>
        );
    };
    const gettingStartData = !searchOpen ? (
        <Grid
            container
            direction="row"
            alignItems="center"
        // justify="space-evenly"
        >
            <Grid item xs={6} style={{ alignItems: "center", flexDirection: "row", marginTop: 70, }}>
                <List style={{ width: "100%", marginLeft: 10, color: "var(--Paragraph-text, #C8C8C8)" }}>
                    <ListItem>
                        <ArticleIcon style={{ marginRight: 10, display: "flex", width: 22 }} />
                        <Typography variant="body1" style={{ fontSize: 16 }}>Getting Started</Typography>
                    </ListItem>
                    <div style={{ marginLeft: 25, }}>
                        <ListItem>
                            <Link to="/docs" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Documentation</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                        <ListItem>
                            <a
                                href="https://github.com/Shuffle/Shuffle/blob/main/.github/install-guide.md"
                                style={{
                                    textDecoration: "none",
                                    color: "var(--Paragraph-text, #C8C8C8)",
                                    display: "flex"
                                }}
                            >
                                <Typography variant="body1" style={{ fontSize: 16 }}>
                                    Onprem Installation
                                </Typography>
                                <KeyboardArrowRightIcon />
                            </a>
                        </ListItem>
                        <ListItem>
                            <Link to="/usecases" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Explore Usecases</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                        <ListItem>
                            <Link to="/search?tab=workflows" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Find public workflows</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                    </div>
                </List>
            </Grid>
            <Grid item xs={6} style={{ alignItems: "center", flexDirection: "row", width: 22, marginTop: 70 }}>
                <List style={{ width: "100%", marginLeft: 10, color: "var(--Paragraph-text, #C8C8C8)", }}>
                    <ListItem>
                        <ManageSearchIcon style={{ marginRight: 10, display: "flex" }} />
                        <Typography variant="body1" style={{ display: "flex", fontSize: 16 }}>Popular searches</Typography>
                    </ListItem>
                    <div style={{ marginLeft: 35 }}>
                        <ListItem>
                            <Link to="/docs/app_creation" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Create Apps</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                        <ListItem>
                            <Link to="/apps" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Find Apps</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                        <ListItem>
                            <Link to="/workflows" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Workflows</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                        <ListItem>
                            <Link to="/creators" onClick={handleLinkClick} style={{ textDecoration: "none", color: "var(--Paragraph-text, #C8C8C8)", display: "flex" }}>
                                <Typography variant="body1" style={{ fontSize: 16, }}>Creator</Typography>
                                <KeyboardArrowRightIcon />
                            </Link>
                        </ListItem>
                    </div>
                </List>
            </Grid>
            <Grid style={{ textAlign: "end", width: "100%", textTransform: 'capitalize', }}>
                <Button style={{ textAlign: "center", textTransform: 'capitalize' }}
                    onClick={() => { window.location = "/search"; }} >
                    See More
                </Button>
            </Grid>
        </Grid>
    ) : null

    const CustomSearchBox = connectSearchBox(SearchBox)
    const CustomAppHits = connectHits(AppHits)
    const CustomWorkflowHits = connectHits(WorkflowHits)
    const CustomDocHits = connectHits(DocHits)
    const CustomDiscordHits = connectHits(DiscordHits);

    const modalView = (
        <div>
            <Grid container style={{ display: "contents", }}>
                <Grid item xs="auto" style={{}}>
                    <Index indexName="appsearch">
                        <CustomAppHits />
                    </Index>
                </Grid>
                <Grid item xs="auto" style={{}}>
                    <Index indexName="workflows">
                        <CustomWorkflowHits />
                    </Index>
                </Grid>
                <Grid item xs="auto" style={{}}>
                    <Index indexName="documentation">
                        <CustomDocHits />
                    </Index>
                </Grid>
                <Grid item xs="auto" style={{}}>
                    <Index indexName="discord_chat">
                        <CustomDiscordHits />
                    </Index>
                </Grid>
            </Grid>
        </div>
    )

    return (
        <div ref={node} style={{ width: "100%", maxWidth: "100%", margin: "auto", }}>
            <InstantSearch searchClient={searchClient} indexName="appsearch" onClick={() => {

                console.log("CLICKED")
            }}>
                <Configure clickAnalytics />
                <CustomSearchBox />
                {modalView}
            </InstantSearch>
            {gettingStartData}
        </div>
    )
}

export default SearchData;
