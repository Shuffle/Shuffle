import React, { useState, useEffect } from 'react';
import algoliasearch from 'algoliasearch';
import theme from '../theme.jsx';
import { InstantSearch, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import {
    TextField,
    Typography,
    InputAdornment,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import SearchContactForm from '../components/SearchContactForm.jsx';
import useDebouncedCallback from '../utils/useDebouncedCallback.jsx';


const searchClient = algoliasearch("JNSS5CFDZZ", "1e5f29b1550939855de5915eac3bf5f7");

const DiscordChat = props => {
    const { isMobile, globalUrl } = props

    const borderRadius = 3

    const SearchBox = ({ currentRefinement, refine }) => {
        const [inputValue, setInputValue] = useState("");
        const debouncedRefine = useDebouncedCallback((value) => refine(value), 300);

        useEffect(() => {
            setInputValue(currentRefinement || "");
        }, [currentRefinement]);
        return (
                <form noValidate action="" role="search">
                    <TextField
                        fullWidth
                        value={inputValue}
                        onChange={(event) => {
                            const value = event.currentTarget.value;
                            setInputValue(value);
                            debouncedRefine(value);
                        }}
                        onKeyDown={(event) => {
                            if(event.key === "Enter") {
                                event.preventDefault();
                            }
                        }}
                        placeholder="Search Discord Chats..."
                        style={{ backgroundColor: theme.palette.inputColor, borderRadius: borderRadius, margin: 10, width: "100%", }}
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
                        }}
                    />
                </form>
        );
    };

    const highlightText = (text) => {
        if (!Array.isArray(text.matchedWords) || text.matchedWords.length === 0) {
            return text.value;
        }

        let highlightedText = '';
        let currentIndex = 0;

        text.matchedWords.forEach((word, index) => {
            const startIndex = text.value.toLowerCase().indexOf(word.toLowerCase(), currentIndex);
            const endIndex = startIndex + word.length;
            highlightedText += text.value.substring(currentIndex, startIndex);
            highlightedText += `<mark>${text.value.substring(startIndex, endIndex)}</mark>`;
            currentIndex = endIndex;
        });

        highlightedText += text.value.substring(currentIndex);
        return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    };

    const Hits = ({ hits }) => {
        const handleHitClick = (url) => {
            const modifiedUrl = url.replace('https://ptb.discord.com/', 'https://discord.com/');
            window.open(modifiedUrl, '_blank');
        };
        if (hits.length === 0) {
            return <Typography>No results found. Try refining your search.</Typography>;
        }
        return (
            <List>
                {hits.map((chat, index) => (
                    <ListItem key={index} onClick={() => handleHitClick(chat.url)} style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
                        <ListItemAvatar>
                            <Avatar src="/discord-logo.png" />
                        </ListItemAvatar>
                        <ListItemText
                            primary={highlightText(chat._highlightResult.text)}
                            secondary={`User: ${(chat.user)}`}
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    const CustomSearchBox = connectSearchBox(SearchBox);
    const CustomHits = connectHits(Hits);

    return (
        <div style={{textAlign:"center", position: "relative", height: "100%", padding:"0px 240px" }}>
            <InstantSearch searchClient={searchClient} indexName="discord_chat">
                <div style={{ maxWidth: 450, margin: "auto", marginTop: 15, marginBottom: 5, }}>
                    <CustomSearchBox />
                </div>
                <div style={{ width: "100%" }}>
                    <CustomHits />
                </div>
            </InstantSearch>
			<SearchContactForm globalUrl={globalUrl} isMobile={isMobile} tabName="discord chats" />
				{/* <span style={{position: "absolute", display: "flex", textAlign: "right", float: "right", right: 0, bottom: 120, }}>
					<Typography variant="body2" color="textSecondary" style={{}}>
						Search by 
					</Typography>
					<a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{textDecoration: "none", color: "white"}}>
						<img src={"/images/logo-algolia-nebula-blue-full.svg"} alt="Algolia logo" style={{height: 17, marginLeft: 5, marginTop: 3,}} />
					</a>
				</span> */}
        </div>
    );
};

export default DiscordChat;
