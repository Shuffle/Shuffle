import React from "react"

import { Link } from "react-router-dom";
import { 
	Avatar, 
	Box, 
	Button, 
	Typography,
	Tooltip,
} from "@mui/material"
import { useNavigate } from "react-router";
import theme from "../theme.jsx";

import {
	Lock as LockIcon,
} from '@mui/icons-material';

// onclickHandler = function override from parent onclick
const RecentWorkflow = ({ workflow, onclickHandler, leftNavOpen, currentWorkflowId, }) => {

    const navigate = useNavigate();

	const [hovered, setHovered] = React.useState(false)
	if (workflow === undefined || workflow === null) {
		console.log("No workflow")
		return null
	}

	/*
	 * Note for @Lalit:
	 *
	 * When you want to make a list of something that is complex,
	 * make a component. This way, you can easily manage
	 * the logic, and we can actually reuse it. This component is used 
	 * multiple places, so do make sure to not break it randomly.
	 */

	const expandLeftNav = leftNavOpen === true || leftNavOpen === undefined ? true : false

	// Check if workflow.input_markdown has an image in it
	// If it does, show it as the main thing
	var relevantImageUrl = ""
	if (workflow?.form_control?.input_markdown !== undefined && workflow?.form_control?.input_markdown !== null && workflow?.form_control?.input_markdown !== "") {
		// Look for <img> tag or ![alt](src) markdown
		// html > markdown
		const imgTag = workflow?.form_control?.input_markdown.match(/<img[^>]+>/g)

		if (imgTag !== null) {
			const src = imgTag[0].match(/src="([^"]+)"/)
			if (src !== null) {
				relevantImageUrl = src[1]
			}
		} else {
			const markdownTag = workflow?.form_control?.input_markdown.match(/!\[.*\]\(.*\)/g)

			if (markdownTag !== null) {
				const src = markdownTag[0].match(/\(([^)]+)\)/)
				if (src !== null) {
					relevantImageUrl = src[1]
				}
			}
		}
	}

	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<Link to={`/workflows/` + workflow?.id} style={{textDecoration: "none"}}>
			<Button
			  onClick={(e) => {
				if (onclickHandler !== undefined) {
					e.preventDefault()
					e.stopPropagation()
					onclickHandler()
				}
			  }}
			  style={{
				display: "flex",
				flexDirection: "column",
				textTransform: "none",
				width: "100%",
				justifyContent: "flex-start",
				textAlign: "left",
				opacity: expandLeftNav ? 1 : 0,
				transition: "opacity 0.1s",

				borderRadius: theme.palette?.borderRadius, 
				backgroundColor: hovered || currentWorkflowId === workflow.id ? "#1f1f1f" : "transparent",
			  }}
			  disableRipple
			>
			  <Box
				style={{
				  display: "flex",
				  marginRight: "auto",
				  alignItems: "center",
				}}
			  >

				{relevantImageUrl !== undefined && relevantImageUrl !== null && relevantImageUrl !== "" ? 
					<Avatar
						alt={workflow?.name}
						src={relevantImageUrl}
						style={{ width: 24, height: 24, marginRight: 5, }}
					/>
					:
				workflow?.apps?.slice(0, 2).map((data, index) => (
				  <Box
					key={index}
					style={{
					  position: "relative",
					  marginLeft: index === 1 ? -8 : 0,
					}}
				  >
					<Avatar
					  alt={data.app_name}
					  src={
						data.large_image
						  ? data.large_image
						  : "/images/no_image.png"
					  }
					  style={{ width: 24, height: 24 }}
					/>
				  </Box>
				))}
				<Typography
				  style={{
					color: "#CDCDCD",
					fontSize: 16,
					marginLeft: 8,
					maxWidth: 180,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				  }}
				>
				  {workflow?.name}
				</Typography>

				{onclickHandler !== undefined && workflow.sharing !== "form" ?
					<Tooltip title="Private Org Form" placement="right">
  						<LockIcon style={{height: 15, width: 15, color: "grey", position: "absolute", left: -17, }}/>
					</Tooltip>
					: null
				}
			  </Box>
			</Button>
			</Link> 
		</div>
	)
}

export default RecentWorkflow
