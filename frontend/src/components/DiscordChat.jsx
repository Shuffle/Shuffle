import React, { useState, useEffect } from 'react';
import algoliasearch from 'algoliasearch';
import theme from '../theme.jsx';
import { InstantSearch, connectSearchBox, connectHits } from 'react-instantsearch-dom';
import {
    Grid,
    Paper,
    TextField,
    Typography,
    Button,
    InputAdornment,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';


const searchClient = algoliasearch("JNSS5CFDZZ", "1e5f29b1550939855de5915eac3bf5f7");

const DiscordChat = props => {
    const { isMobile, globalUrl } = props
    const [value, setValue] = useState("");
    const [formMail, setFormMail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [formMessage, setFormMessage] = React.useState("");
    const buttonStyle = {borderRadius: 30, height: 50, width: 220, margin: isMobile ? "15px auto 15px auto" : 20, fontSize: 18,}

    const borderRadius = 3

    const submitContact = (email, message) => {
		const data = {
			"firstname": "",
			"lastname": "",
			"title": "",
			"companyname": "",
			"email": email,
			"phone": "",
			"message": message,
		}
	
		const errorMessage = "Something went wrong. Please contact frikky@shuffler.io directly."

		fetch(globalUrl+"/api/v1/contact", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
		.then(response => response.json())
		.then(response => {
			if (response.success === true) {
				setFormMessage(response.reason)
				//toast("Thanks for submitting!")
			} else {
				setFormMessage(errorMessage)
			}

			setFormMail("")
			setMessage("")
    })
		.catch(error => {
			setFormMessage(errorMessage)
    	console.log(error)
		});
	}

    const SearchBox = ({ currentRefinement, refine }) => {
        return (
                <form noValidate action="" role="search">
                    <TextField
                        fullWidth
                        value={currentRefinement}
                        onChange={(event) => refine(event.currentTarget.value)}
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
					<div style={{paddingTop: 0, maxWidth: isMobile ? "100%" : "60%", margin: "auto"}}>
						<Typography variant="h6" style={{color: "white", marginTop: 50,}}>
							Can't find what you're looking for? 
						</Typography>
						<div style={{flex: "1", display: "flex", flexDirection: "row", textAlign: "center",}}>
							<TextField
								required
								style={{flex: "1", marginRight: "15px", backgroundColor: theme.palette.inputColor}}
								InputProps={{
									style:{
										color: "#ffffff",
									},
								}}
								color="primary"
								fullWidth={true}
								placeholder="Email (optional)"
								type="email"
							  id="email-handler"
								autoComplete="email"
								margin="normal"
								variant="outlined"
    	  	 				onChange={e => setFormMail(e.target.value)}
							/>
							<TextField
								required
								style={{flex: "1", backgroundColor: theme.palette.inputColor}}
								InputProps={{
									style:{
										color: "#ffffff",
									},
								}}
								color="primary"
								fullWidth={true}
								placeholder="What are we missing?"
								type=""
							  id="standard-required"
								margin="normal"
								variant="outlined"
								autoComplete="off"
    	  	 			onChange={e => setMessage(e.target.value)}
							/>
						</div>
						<Button
							variant="contained"
							color="primary"
							style={buttonStyle}
							disabled={message.length === 0}
							onClick={() => {
								submitContact(formMail, message)
							}}
						>
							Submit	
						</Button>
						<Typography style={{color: "white"}} variant="body2">{formMessage}</Typography>
					</div>
				<span style={{position: "absolute", display: "flex", textAlign: "right", float: "right", right: 0, bottom: 120, }}>
					<Typography variant="body2" color="textSecondary" style={{}}>
						Search by 
					</Typography>
					<a rel="noopener noreferrer" href="https://www.algolia.com/" target="_blank" style={{textDecoration: "none", color: "white"}}>
						<img src={"/images/logo-algolia-nebula-blue-full.svg"} alt="Algolia logo" style={{height: 17, marginLeft: 5, marginTop: 3,}} />
					</a>
				</span>
        </div>
    );
};

export default DiscordChat;
