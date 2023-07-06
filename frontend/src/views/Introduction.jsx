import React, { useEffect, useState } from "react";
import { useTheme } from "@material-ui/core/styles";
import { Link, useParams } from "react-router-dom";

import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

const Workflows = (defaultprops) => {
  const { globalUrl, isLoggedIn, isLoaded } = defaultprops;

  const theme = useTheme();
	const params = useParams();
	var props = JSON.parse(JSON.stringify(defaultprops))
	props.match = {}
	props.match.params = params

  const [curView, setCurView] = useState(0);
  const [firstrequest, setFirstrequest] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  const viewdata1 = [
    {
      title: "General",
      content: "Learn about our ticketing solutions",
      subitems: [
        {
          name: "Search",
          subtitle: "Search for anything, anywhere",
        },
        {
          name: "Message",
          subtitle: "Read and send messages",
        },
        {
          name: "Parse emails",
          subtitle: "what",
        },
      ],
    },
    {
      title: "Ticketing",
      subitems: [
        {
          name: "Search",
          subtitle: "Search for anything, anywhere",
        },
        {
          name: "Message",
          subtitle: "Read and send messages",
        },
        {
          name: "Parse emails",
          subtitle: "what",
        },
      ],
    },
    {
      title: "Threat intel",
      subitems: [
        {
          name: "Search",
          subtitle: "Search for anything, anywhere",
        },
        {
          name: "Message",
          subtitle: "Read and send messages",
        },
        {
          name: "Parse emails",
          subtitle: "what",
        },
      ],
    },
  ];

  if (firstrequest) {
    setFirstrequest(false);
    if (props.match.params.key) {
      console.log("PROPS: ", props.match.params.key);
      const viewitem = viewdata1.find(
        (item) =>
          item.title.toLowerCase() === props.match.params.key.toLowerCase()
      );
      if (viewitem !== undefined && viewitem !== null) {
        setCurView(1);
        //setSelectedItem(viewitem)
      }
    }
  }

  const cardContentStyle = {
    height: "100%",
    width: "100%",
    padding: 40,
  };

  const outerGridView = {
    width: "100%",
    marginTop: 15,
  };

  const paperStyle = {
    height: 300,
    color: "white",
    backgroundColor: theme.palette.surfaceColor,
    color: "white",
    cursor: "pointer",
    display: "flex",
    textAlign: "center",
  };

  const HandleSelection = (data) => {
    const [selected, setSelected] = useState(false);

    var baseStyle = JSON.parse(JSON.stringify(paperStyle));
    if (selected) {
      baseStyle.backgroundColor = "white";
      baseStyle.color = "black";
    }

    return (
      <Grid
        item
        xs={4}
        onClick={() => {
          console.log(selectedItems);
          if (selected) {
            const index = selectedItems.findIndex(
              (item) => item.title === data.title
            );
            if (index >= 0) {
              selectedItems.splice(index, 1);
              setSelectedItems(selectedItems);
            }
          } else {
            selectedItems.push(data);
            setSelectedItems(selectedItems);
          }

          setSelected(!selected);

          //setCurView(1)
          //setSelectedItem(data)
          //window.location.pathname += "/"+data.title.toLowerCase()
        }}
      >
        <Card style={baseStyle}>
          <CardActionArea style={cardContentStyle}>
            <CardContent>
              <Typography variant="h4">{data.title}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  };

  const view1 =
    curView === 0 ? (
      <div>
        <Typography variant="h4">What are you interested in?</Typography>
        <Grid container style={outerGridView} spacing={3}>
          {viewdata1.map((data) => {
            return HandleSelection(data);
          })}
        </Grid>
        {/*
			<Button variant="contained" color="primary" style={{height: 50, width: 300, margin: "auto",}} onClick={() => {
				setCurView(1)
			}}>
				Continue
			</Button>
			*/}
      </div>
    ) : null;

  const view2 =
    curView === 1 ? (
      <div>
        <Typography variant="h4">Step 2.</Typography>
        {/*
			<Grid container style={outerGridView} spacing={3}>
				{selectedItem.subitems === undefined ? null : 
					selectedItem.subitems.map(data => {
					return (
						<Grid item xs={4}>
							<Card style={paperStyle}>
								<CardActionArea style={cardContentStyle}>	
									<CardContent>	
										<Typography variant="h4">
											{data.name}
										</Typography>
										<Typography variant="body1" style={{marginTop: 10}}>
											{data.subtitle}
										</Typography>
									</CardContent>	
								</CardActionArea>	
							</Card>
						</Grid>
					)
				})}
			</Grid>
			*/}
      </div>
    ) : null;

  const baseView = (
    <div style={{ maxWidth: 1024, margin: "auto", paddingTop: 50 }}>
      {view1}
      {view2}
    </div>
  );

  return <div>{baseView}</div>;
};

export default Workflows;
