import React, { useState, useEffect, useRef } from 'react';
import theme from '../theme.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, CloudQueue as CloudQueueIcon, Code as CodeIcon } from '@mui/icons-material';

//import algoliasearch from 'algoliasearch/lite';
import algoliasearch from 'algoliasearch';
import { InstantSearch, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import {
    Grid,
    Paper,
    TextField,
    InputAdornment,
    Typography,
} from '@mui/material';
const searchClient = algoliasearch("JNSS5CFDZZ", "db08e40265e2941b9a7d8f644b6e5240")
const Appsearch = props => {
    const { maxRows, showName, showSuggestion, isMobile, globalUrl, parsedXs, newSelectedApp, setNewSelectedApp, defaultSearch, showSearch, ConfiguredHits, userdata, cy, isCreatorPage, actionImageList, setActionImageList, setUserSpecialzedApp, placeholder,

    } = props

    let navigate = useNavigate();
    const rowHandler = maxRows === undefined || maxRows === null ? 50 : maxRows
    const xs = parsedXs === undefined || parsedXs === null ? 12 : parsedXs
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = useState("");
    window.title = "Shuffle | Apps | Find and integration any app"

    const useCloseOnBlur = (setOpen) => {
        useEffect(() => {
            // Add event listener to detect clicks outside of the search box
            const handleClickOutside = (event) => {
                // Check if the click is outside the search box
                if (!event.target.closest('.search-box')) {
                    setOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);

            // Clean up event listener
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [setOpen]); // Ensure that this effect runs whenever setOpen changes
    };

    useCloseOnBlur(setOpen);

    const SearchBox = ({ currentRefinement, refine, isSearchStalled }) => {
        useEffect(() => {
            //console.log("FIRST LOAD ONLY? RUN REFINEMENT: !", currentRefinement)
            if (defaultSearch !== undefined && defaultSearch !== null) {
                refine(defaultSearch)
            }
        }, [])

        return (
            <div style={{ textAlign: isMobile ? "center" : "" }}>
                <form noValidate action="" role="search">
                    <TextField
                        sx={{
                            '& input[type="search"]': {
                                filter:
                                    'brightness(0) invert(1)',
                            },
                        }}
                        fullWidth
                        variant="standard"
                        style={{
                            width: isMobile ? 295 : 402,
                            borderRadius: 8,
                            border: 0,
                            boxShadow: 0,
                            margin: 10,
                            height: isMobile ? 51 : "",
                            textAlign: "center",
                            // border: "1px solid rgba(241.19, 241.19, 241.19, 0.10)",
                            boxShadow: "none",
                            backgroundColor: "rgba(241.19, 241.19, 241.19, 0.10)",
                            fontWeight: 400,
                            marginLeft: 10,
                            zIndex: 110,
                        }}
                        InputProps={{
                            disableUnderline: true,
                            style: {
                                fontSize: isMobile ? "0.8em" : "1em",
                                height: 50,
                                zIndex: 1100,
                                paddingLeft: 15,
                            },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <div
                                        style={{
                                            width: isMobile ? 42 : 42,
                                            height: isMobile ? 36 : 36,
                                            background: "#806BFF",
                                            borderRadius: 8,
                                            marginRight: 10,
                                        }}
                                    >
                                        <SearchIcon
                                            onClick={() => {
                                                navigate("/search?q=" + currentRefinement, { state: value, replace: true })
                                                //navigate("/search?q="+currentRefinement, { state: value, replace: true })
                                                //window.open("/apps"+currentRefinement, "_blank")
                                            }}
                                            style={{ cursor: 'pointer', width: isMobile ? 20 : "", marginright: 5, marginTop: isMobile ? 6 : 7 }}
                                        />
                                    </div>
                                </InputAdornment>
                            ),
                        }}
                        autoComplete="off"
                        type="search"
                        color="primary"
                        placeholder={placeholder !== undefined ? placeholder : "Search more than 2500 Apps"}
                        id="shuffle_search_field"
                        onChange={(event) => {
                            // Remove "q" from URL
                            // removeQuery("q")
                            refine(event.currentTarget.value)
                        }}
                        onKeyDown={(event) => {
                            if (event.keyCode === 13) {
                                navigate("/search?q=" + currentRefinement, { state: value, replace: true });
                            }
                        }}
                        onClick={(event) => {
                            setOpen(true);
                        }}
                    />
                    {/*isSearchStalled ? 'My search is stalled' : ''*/}
                </form>
            </div>
        )
    }

    const Hits = ({ hits, currentRefinement }) => {
        const [mouseHoverIndex, setMouseHoverIndex] = useState(-1)
        var counted = 0

        return (
            <Grid container spacing={0} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: isMobile ? 302 : 402, maxHeight: 250, minHeight: 250, overflowY: "auto", overflowX: "hidden", }}>
                {hits.map((data, index) => {
                    const paperStyle = {
                        backgroundColor: index === mouseHoverIndex ? "rgba(255,255,255,1)" : "#38383A",
                        color: index === mouseHoverIndex ? theme.palette.inputColor : "rgba(255,255,255,0.8)",
                        // border: newSelectedApp.objectID !== data.objectID ? `1px solid rgba(255,255,255,0.2)` : "2px solid #f86a3e", 
                        textAlign: "left",
                        padding: 10,
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        width: 402,
                        minHeight: 37,
                        maxHeight: 52,
                    }

                    if (counted === 12 / xs * rowHandler) {
                        return null
                    }

                    counted += 1
                    var parsedname = data.name.valueOf()
                    parsedname = (parsedname.charAt(0).toUpperCase() + parsedname.substring(1)).replaceAll("_", " ")
                    return (
                        <Paper key={index} elevation={0} style={paperStyle} onMouseOver={() => {
                            setMouseHoverIndex(index)
                        }} onMouseOut={() => {
                            setMouseHoverIndex(-1)
                        }} onClick={() => {
							if (setNewSelectedApp !== undefined) {
								setNewSelectedApp(data.name)
							} else {
								//need to add perfect url which redirect direct to app page
								const newname = data.name.toLowerCase().replaceAll(" ", "_")
								window.open("/apps/" + newname, "_blank")
							}
                        }}>
                            <div style={{ display: "flex" }}>
                                <img alt={data.name} src={data.image_url} style={{ width: "100%", maxWidth: 30, minWidth: 30, minHeight: 30, borderRadius: 40, maxHeight: 30, display: "block", }} />
                                <Typography variant="body1" style={{ marginTop: 2, marginLeft: 10, }}>
                                    {parsedname}
                                </Typography>
                            </div>
                        </Paper>
                    )
                })}
            </Grid>
        )
    }

    const InputHits = ConfiguredHits === undefined ? Hits : ConfiguredHits
    const CustomSearchBox = connectSearchBox(SearchBox)
    const CustomHits = connectHits(InputHits)

    return (
        <div className="search-box" style={{ width: isMobile ? null : "100%", height: 95, alignItems: "center", justifyContent: "center", gap: 138, zIndex: 11000, }}>
            <InstantSearch searchClient={searchClient} indexName="appsearch">
                <div style={{ maxWidth: 450, margin: "auto", }}>
                    <CustomSearchBox />
                </div>
                <div style={{ alignItems: "center", justifyContent: "center", width: "100%", display: "flex" }}>
                    {open ? <CustomHits hitsPerPage={1} /> : null}
                </div>
            </InstantSearch>
        </div>
    )
}

export default Appsearch;
