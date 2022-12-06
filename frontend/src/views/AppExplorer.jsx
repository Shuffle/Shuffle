
import { Grid, Divider, List, ListItem, ListItemText } from "@mui/material";
import { experimentalStyled as styled } from '@mui/material/styles';
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Button from '@mui/material/Button';
import Box from '@material-ui/core/Box';
import React, { useState, useEffect } from "react";


import algoliasearch from "algoliasearch";
//import algoliarecommend from "algoliarecommend";

const searchClient = algoliasearch(
  "JNSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
);

// https://www.algolia.com/doc/api-client/getting-started/install/
/*const algoliarecommend = require('@algolia/recommend');

const client = algoliarecommend(
  "NSS5CFDZZ",
  "db08e40265e2941b9a7d8f644b6e5240"
);*/


const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  border: "0.0625rem solid #b2b2b2",
  borderRadius: "1.5625rem",
  boxSizing: "content-box",
  backgroundColor: "transparent",
  width: "200px",
  textAlign: 'center',
  color: theme.palette.text.secondary,
  marginTop: "20px",
  marginBottom: "20px",
  color: "textPrimary"
}));
const AppExplorer = (props) => {
  const [algoliaResult, setAlgoliaResult] = useState("");

  const runAlgoliaAppSearch = (query) => {
    const index = searchClient.initIndex("appsearch");

    index
      .search(`${query}`)
      .then(({ hits }) => {
        setAlgoliaResult(hits);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {

    runAlgoliaAppSearch("wazuh")

  }, [])


  const brandApp = () => {
    const index = searchClient.initIndex("appsearch");

    const replicaIndex = searchClient.initIndex('appsearch');
    replicaIndex.setSettings({
      customRanking: [
        "asc(time_edited)"
      ]
    })

      .then(({ hits }) => {
        console.log(hits);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {

    brandApp()

  }, [])

  /*const trandingApp = () => {

    const index = client.getTrendingGlobalItems([
      {
        indexName: "appsearch",
        threshold: 60
      },
    ])
    .then(({ results }) => {
      console.log(results);
    })
    .catch(err => {
      console.log(err);
    });
  };

  useEffect(() => {
    
    trandingApp();
  	
  }, [])
  */

  const SideBar = {
    minWidth: 250,

    borderRight: "1px solid rgba(255,255,255,0.3)",
    left: 0,
    position: "sticky",
    minHeight: "90vh",
    maxHeight: "90vh",
    overflowX: "hidden",
    overflowY: "auto",
    zIndex: 1000,
    color: "white"
  };
  const contentbar = {
    padding: "40px",

  };
  const boxdata = {
    paddingLeft: "30px"
  }
  const link = {
    textDecoration: "none"
  }
  const catItems = (
    <div style={SideBar}>
      <List>
        <ListItem >
          <ListItemText>
            <span><Typography variant="primary">Categories</Typography></span>
          </ListItemText>
        </ListItem>
        <span></span>
        <Divider />
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              ASSETS
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              CASES
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              COMMS
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              EDR & AV
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              IAM
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              INTEL
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              NETWORK
            </Button>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText>
            <Button variant="primary">
              SIEM
            </Button>
          </ListItemText>
        </ListItem>
      </List>
    </div>
  )
  return (
    <div>
      <div style={{ display: "flex" }}>

        {catItems}
        <div style={contentbar}>
          <Grid>
            <Grid item xl={8} style={{ "border": "20px" }}>

              <Typography type="title" variant="h6">
                Getting Started
              </Typography>
              <div style={{
                paddingLeft: "50px",

              }}>
              </div>

            </Grid>
          </Grid>
          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              spacing={{ xs: 1, md: 4 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              {Array.from(Array(algoliaResult.length)).map((_, index) => (

                <Grid item xs={2} sm={4} md={4} key={index}>
                  <a href={algoliaResult[0]["objectID"]} style={link}>
                    <Item>


                      <div class="row">

                        <div class="column" style={{ float: "left" }}>
                          <img src={algoliaResult[0]["image_url"]} alt="shuffle" width="50px" />
                        </div>
                        <div class="column " style={boxdata}>
                          <div style={boxdata}>
                            <Typography align="left" variant="body1">
                              {algoliaResult[0]["name"]}
                            </Typography>
                          </div>
                          <div style={boxdata}>
                            <Typography align="left" variant="body2">
                              {algoliaResult[0]["description"].substring(0, 20)}
                            </Typography>
                          </div>
                        </div>

                      </div>
                    </Item>
                  </a>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Grid item xl={8} style={{ "border": "20px" }}>

            <Typography type="title" variant="h6">
              Most Popular
            </Typography>
            <div style={{
              paddingLeft: "50px",

            }}>
            </div>

          </Grid>
          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              spacing={{ xs: 1, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              {Array.from(Array(3)).map((_, index) => (
                <Grid item xs={2} sm={4} md={4} key={index}>
                  <a href="#" style={link}>
                    <Item>
                      <div class="row">
                        <div class="column" style={{ float: "left" }}>
                          <img src="/images/testing.png" alt="shuffle" width="50px" />
                        </div>
                        <div class="column " style={boxdata}>
                          <div style={boxdata}>
                            <Typography align="left" variant="body1">
                              App Name
                            </Typography>
                          </div>
                          <div style={boxdata}>
                            <Typography align="left" variant="body2">
                              Description
                            </Typography>
                          </div>
                        </div>

                      </div>
                    </Item>
                  </a>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Grid item xl={8} style={{ "border": "20px" }}>

            <Typography type="title" variant="h6">
              Brand New
            </Typography>
            <div style={{
              paddingLeft: "50px",

            }}>
            </div>

          </Grid>
          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              spacing={{ xs: 1, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              {Array.from(Array(3)).map((_, index) => (
                <Grid item xs={2} sm={4} md={4} key={index}>
                  <a href="#" style={link}>
                    <Item>
                      <div class="row">
                        <div class="column" style={{ float: "left" }}>
                          <img src="/images/testing.png" alt="shuffle" width="50px" />
                        </div>
                        <div class="column " style={boxdata}>
                          <div style={boxdata}>
                            <Typography align="left" variant="body1">
                              App Name
                            </Typography>
                          </div>
                          <div style={boxdata}>
                            <Typography align="left" variant="body2">
                              Description
                            </Typography>
                          </div>
                        </div>

                      </div>
                    </Item>
                  </a>
                </Grid>
              ))}
            </Grid>
          </Box>


          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              spacing={{ xs: 1, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              {Array.from(Array(3)).map((_, index) => (
                <Grid item xs={2} sm={4} md={4} key={index}>

                  <div className="row" >
                    <div className="column" style={{ float: "left", width: "33.33%", marginTop: "20px", marginBottom: "20px", }}>
                      <img src="/images/shuffle_logo.png" alt="shuffle" width="200px" />
                    </div>
                  </div>

                </Grid>
              ))}
            </Grid>
          </Box>

          <Grid item xl={8} style={{ "border": "20px" }}>

            <Typography type="title" variant="h6">
              Hybrid work
            </Typography>
            <div style={{
              paddingLeft: "50px",

            }}>
            </div>

          </Grid>

          <Box sx={{ flexGrow: 1 }}>
            <Grid
              container
              spacing={{ xs: 1, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
            >
              {Array.from(Array(3)).map((_, index) => (
                <Grid item xs={2} sm={4} md={4} key={index}>
                  <a href="#" style={link}>
                    <Item>
                      <div class="row">
                        <div class="column" style={{ float: "left" }}>
                          <img src="/images/testing.png" alt="shuffle" width="50px" />
                        </div>
                        <div class="column " style={boxdata}>
                          <div style={boxdata}>
                            <Typography align="left" variant="body1">
                              App Name
                            </Typography>
                          </div>
                          <div style={boxdata}>
                            <Typography align="left" variant="body2">
                              Description
                            </Typography>
                          </div>
                        </div>

                      </div>
                    </Item>
                  </a>
                </Grid>
              ))}
            </Grid>
          </Box>

          <div className="row" style={{ display: "flex" }}>
            <div className="col" style={{ width: "40%", marginTop: "50px" }}>
              <Typography variant="h6">Don't see it? Build it!</Typography>
              <Typography variant="body2">Use our APIs to create an app that makes your working life better.And maybe even share it with the world.</Typography>
              <a href="#" target="_blank" rel="nonref"
                style={{
                  background: "#FF4500",
                  borderRadius: "3.125rem",
                  color: "#fff",
                  display: "block",
                  fontSize: ".9375rem",
                  fontWeight: "500",
                  height: "1rem",
                  letterSpacing: "-.02em",
                  lineHeight: ".875rem",
                  marginTop: "1.5rem",
                  padding: "1.3125rem 1.375rem",
                  textAlign: "center",
                  textDecoration: "none",
                  width: "8.5rem"
                }}><span>visit developer portal</span></a>
            </div>
            <div className="col" style={{ float: "right" }}>
              <div className="row" style={{ float: "left", marginLeft: "90px" }}>
                <div className="column" style={{ float: "left", margin: "60px 10px 20px 30px" }}>
                  <img src="/images/demo1.png" alt="shuffle" width="90px" />
                </div>
                <div className="column" style={{ float: "left", margin: "60px 10px 20px 30px" }}>
                  <img src="/images/demo1.png" alt="shuffle" width="90px" />
                </div>
                <div className="column" style={{ float: "left", margin: "60px 10px 20px 30px" }}>
                  <img src="/images/demo1.png" alt="shuffle" width="90px" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

  );
}
export default AppExplorer;
