import React, { useState, useEffect, useLayoutEffect } from "react";
import theme from '../theme.jsx';

import {
	Chip,
	Typography,
	Paper, 
	Avatar,
	Grid,
	Tooltip,
} from "@mui/material";

import {
  AvatarGroup,
} from "@mui/material"

import {
	Restore as RestoreIcon,
	Edit as EditIcon,
	BubbleChart as BubbleChartIcon,
	MoreVert as MoreVertIcon,
} from '@mui/icons-material';

import { useNavigate, Link, useParams } from "react-router-dom";

const workflowActionStyle = {
	display: "flex",
	width: 160,
	height: 44,
	justifyContent: "space-between",
}


const chipStyle = {
	backgroundColor: "#3d3f43",
	marginRight: 5,
	paddingLeft: 5,
	paddingRight: 5,
	height: 28,
	cursor: "pointer",
	borderColor: "#3d3f43",
	color: "white",
}

const WorkflowPaper = (props) => {
    const { data } = props;
		let navigate = useNavigate();

    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
		const appGroup = data.action_references === undefined || data.action_references === null ? [] : data.action_references

  	const isCloud =
			window.location.host === "localhost:3002" ||
			window.location.host === "shuffler.io";

		//console.log("Workflow: ", data)
    var boxColor = "#86c142";

		const paperAppStyle = {
			minHeight: 130,
			maxHeight: 130,
			overflow: "hidden",
			width: "100%",
			color: "white",
			backgroundColor: theme.palette.surfaceColor,
			padding: "12px 12px 0px 15px",
			borderRadius: 5,
			display: "flex",
			boxSizing: "border-box",
			position: "relative",
		}

    var parsedName = data.name;
    if (
      parsedName !== undefined &&
      parsedName !== null &&
      parsedName.length > 20
    ) {
      parsedName = parsedName.slice(0, 21) + "..";
    }

		
		const imageStyle = {
			width: 24, 
			height: 24,
			marginRight: 10, 
			border: "1px solid rgba(255,255,255,0.3)",
		}
    var image = data.creator_info !== undefined && data.creator_info !== null && data.creator_info.image !== undefined && data.creator_info.image !== null && data.creator_info.image.length > 0 ? <Avatar alt={data.creator} src={data.creator_info.image} style={imageStyle}/> : <Avatar alt={"shuffle_image"} src={theme.palette.defaultImage} style={imageStyle}/>
		const creatorname = data.creator_info !== undefined && data.creator_info !== null && data.creator_info.username !== undefined && data.creator_info.username !== null && data.creator_info.username.length > 0 ? data.creator_info.username : ""
    var orgName = "";
    var orgId = "";
		if ((data.objectID === undefined || data.objectID === null) && data.id !== undefined && data.id !== null) {
			data.objectID = data.id
		}

		//console.log("IMG: ", data)
		var parsedUrl = `/workflows/${data.objectID}`
		if (data.__queryID !== undefined && data.__queryID !== null) {
			parsedUrl += `?queryID=${data.__queryID}`
		}

		if (!isCloud) {
			parsedUrl = `https://shuffler.io${parsedUrl}`
		}

    return (
			<div style={{width: "100%", position: "relative",}}>
        <Paper square style={paperAppStyle}>
          <div
            style={{
              position: "absolute",
              bottom: 1,
              left: 1,
              height: 12,
              width: 12,
              backgroundColor: boxColor,
              borderRadius: "0 100px 0 0",
            }}
          />
          <Grid
            item
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <Grid item style={{ display: "flex", maxHeight: 34 }}>
              <Tooltip title={`${creatorname}`} placement="bottom">
                <div
                  style={{ cursor: data.creator_info !== undefined ? "pointer" : "inherit" }}
                  onClick={() => {
										if (data.creator_info !== undefined) {
											navigate("/creators/"+data.creator_info.username)
										}
                  }}
                >
                  {image}
                </div>
              </Tooltip>
              <Tooltip title={`Edit ${data.name}`} placement="bottom">
                <Typography
                  variant="body1"
                  style={{
                    marginBottom: 0,
                    paddingBottom: 0,
                    maxHeight: 30,
                    flex: 10,
                  }}
                >
                  <a
                    href={parsedUrl}
										rel="norefferer"
										target="_blank"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {parsedName}
                  </a>
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item style={workflowActionStyle}>
							{appGroup.length > 0 ? 
								<div style={{display: "flex", marginTop: 8, }}>
									<AvatarGroup max={4} style={{marginLeft: 5, maxHeight: 24,}}>
										{appGroup.map((app, index) => {
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
														navigate("/apps/"+app.id)
													}}
												>
													<Tooltip color="primary" title={app.name} placement="bottom">
														<Avatar alt={app.name} src={app.image_url} style={{width: 24, height: 24}}/>
													</Tooltip>
												</div>
											)
										})}
									</AvatarGroup>
								</div>
								: 
								<Tooltip color="primary" title="Action amount" placement="bottom">
									<span style={{ color: "#979797", display: "flex" }}>
										<BubbleChartIcon
											style={{ marginTop: "auto", marginBottom: "auto" }}
										/>
										<Typography
											style={{
												marginLeft: 5,
												marginTop: "auto",
												marginBottom: "auto",
											}}
										>
                    	{data.actions === undefined || data.actions === null ? 1 : data.actions.length}
										</Typography>
									</span>
								</Tooltip>
							}
              <Tooltip
                color="primary"
                title="Trigger amount"
                placement="bottom"
              >
                <span
                  style={{ marginLeft: 15, color: "#979797", display: "flex" }}
                >
                  <RestoreIcon
                    style={{
                      color: "#979797",
                      marginTop: "auto",
                      marginBottom: "auto",
                    }}
                  />
                  <Typography
                    style={{
                      marginLeft: 5,
                      marginTop: "auto",
                      marginBottom: "auto",
                    }}
                  >
                    {data.triggers === undefined || data.triggers === null ? 1 : data.triggers.length}
                  </Typography>
                </span>
              </Tooltip>
              <Tooltip color="primary" title="Subflows used" placement="bottom">
                <span
                  style={{
                    marginLeft: 15,
                    display: "flex",
                    color: "#979797",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      color: "#979797",
                      marginTop: "auto",
                      marginBottom: "auto",
                    }}
                  >
                    <path
                      d="M0 0H15V15H0V0ZM16 16H18V18H16V16ZM16 13H18V15H16V13ZM16 10H18V12H16V10ZM16 7H18V9H16V7ZM16 4H18V6H16V4ZM13 16H15V18H13V16ZM10 16H12V18H10V16ZM7 16H9V18H7V16ZM4 16H6V18H4V16Z"
                      fill="#979797"
                    />
                  </svg>
                  <Typography
                    style={{
                      marginLeft: 5,
                      marginTop: "auto",
                      marginBottom: "auto",
                    }}
                  >
                    {0}
                  </Typography>
                </span>
              </Tooltip>
            </Grid>
            <Grid
              item
              style={{
                justifyContent: "left",
                overflow: "hidden",
                marginTop: 5,
              }}
            >
              {data.tags !== undefined && data.tags !== null 
                ? data.tags.map((tag, index) => {
                    if (index >= 2) {
                      return null;
                    }

                    return (
                      <Chip
                        key={index}
                        style={chipStyle}
                        label={tag}
                        variant="outlined"
                        color="primary"
                      />
                    );
                  })
                : null}
            </Grid>
					</Grid>
				</Paper>
			</div>
		)
  }

export default WorkflowPaper
