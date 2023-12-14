import React, { useEffect, useContext } from "react";
import theme from '../theme.jsx';
import { isMobile } from "react-device-detect" 
import { MuiChipsInput } from "mui-chips-input";
import UsecaseSearch from "../components/UsecaseSearch.jsx"
import WorkflowGrid from "../components/WorkflowGrid.jsx"
import dayjs from 'dayjs';
import WorkflowTemplatePopup from "./WorkflowTemplatePopup.jsx";

import {
  Badge,
  Avatar,
  Grid,
	InputLabel,
	Select,
	ListSubheader,
  Paper,
  Tooltip,
  Divider,
  Button,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Chip,
  Switch,
  Typography,
  Zoom,
  CircularProgress,
  Drawer,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
	OutlinedInput,
	Checkbox,
	ListItemText,
	Radio,
	RadioGroup,
	FormControl,
	FormLabel,

} from "@mui/material";

import { 
	DatePicker, 
	LocalizationProvider,
} from '@mui/x-date-pickers'

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Publish as PublishIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";

const EditWorkflow = (props) => {
	const { globalUrl, workflow, setWorkflow, modalOpen, setModalOpen, showUpload, usecases, setNewWorkflow, appFramework, isEditing, userdata, apps, } = props

  const [_, setUpdate] = React.useState(""); // Used for rendering, don't remove

  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [showMoreClicked, setShowMoreClicked] = React.useState(false);
  const [innerWorkflow, setInnerWorkflow] = React.useState(workflow)

  const [newWorkflowTags, setNewWorkflowTags] = React.useState(workflow.tags !== undefined && workflow.tags !== null ? JSON.parse(JSON.stringify(workflow.tags)) : [])
  const [description, setDescription] = React.useState(workflow.description !== undefined ? workflow.description : "")

  const [selectedUsecases, setSelectedUsecases] = React.useState(workflow.usecase_ids !== undefined && workflow.usecase_ids !== null ? JSON.parse(JSON.stringify(workflow.usecase_ids)) : []);
	const [foundWorkflowId, setFoundWorkflowId] = React.useState("")
	const [name, setName] = React.useState(workflow.name !== undefined ? workflow.name : "")
	const [dueDate, setDueDate] = React.useState(workflow.due_date !== undefined && workflow.due_date !== null && workflow.due_date !== 0 ? dayjs(workflow.due_date*1000) : dayjs().subtract(1, 'day'))

	// Gets the generated workflow 
	const getGeneratedWorkflow = (workflow_id) => {
    fetch(globalUrl + "/api/v1/workflows/" + workflow_id, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 when getting workflow");
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson.id === workflow_id) {
				console.log("GOT WORKFLOW: ", responseJson)
				if (name === "") {
					innerWorkflow.name = responseJson.name
					setName(responseJson.name)
				}

				if (description === "") {
					innerWorkflow.description = responseJson.description
					setDescription(description)
				}

				if (newWorkflowTags === []) {
					innerWorkflow.tags = responseJson.tags
					setNewWorkflowTags(responseJson.tags)
				}

				if (selectedUsecases === []) {
					selectedUsecases = responseJson.usecase_ids
				}

				innerWorkflow.id = responseJson.id
				innerWorkflow.blogpost = responseJson.blogpost
				innerWorkflow.actions = responseJson.actions
				innerWorkflow.triggers = responseJson.triggers
				innerWorkflow.branches = responseJson.branches
				innerWorkflow.comments = responseJson.comments
				innerWorkflow.workflow_variables = responseJson.workflow_variables
				innerWorkflow.execution_variables = responseJson.execution_variables


				setInnerWorkflow(innerWorkflow)
    	  setUpdate(Math.random())
			}
		})
		.catch((error) => {
			//toast(error.toString());
			console.log("Get workflow error: ", error.toString());
		})
	}

	if (foundWorkflowId.length > 0) {
		getGeneratedWorkflow(foundWorkflowId)

		setFoundWorkflowId("")
	} else {
	}

	if (modalOpen !== true) {
		return null
	}

  const newWorkflow = isEditing === true ? false : true
  const priority = userdata === undefined || userdata === null ? null : userdata.priorities.find(prio => prio.type === "usecase" && prio.active === true)
  console.log("PRIO: ", priority)

  var upload = "";
	var total_count = 0

	return (
    <Drawer
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      PaperProps={{
        style: {
          color: "white",
          minWidth: isMobile ? "90%" : 650,
          maxWidth: isMobile ? "90%" : 650,
		  minHeight: 400,
		  paddingTop: 25, 
		  paddingLeft: 50, 
          //minWidth: isMobile ? "90%" : newWorkflow === true ? 1000 : 550,
          //maxWidth: isMobile ? "90%" : newWorkflow === true ? 1000 : 550,
        },
      }}
    >
      <DialogTitle style={{padding: 30, paddingBottom: 0, zIndex: 1000,}}>
		<div style={{display: "flex"}}>
        	<div style={{flex: 1, color: "rgba(255,255,255,0.9)" }}>
				<div style={{display: "flex"}}>
					<Typography variant="h4" style={{flex: 9, }}>
						{newWorkflow ? "New" : "Editing"} workflow
					</Typography>
					{newWorkflow === true ? null :
						<div style={{ marginLeft: 5, flex: 1 }}>
							<Tooltip title="Open Workflow Form for 'normal' users">
								<a
									rel="noopener noreferrer"
									href={`/workflows/${workflow.id}/run`}
									target="_blank"
									style={{
										textDecoration: "none",
										color: "#f85a3e",
										marginLeft: 5,
										marginTop: 10,
									}}
								>
									<OpenInNewIcon />
								</a>
							</Tooltip>
						</div>
					}
				</div>
				<Typography variant="body2" color="textSecondary" style={{marginTop: 20, maxWidth: 440,}}>
					Workflows can be built from scratch, or from templates. <a href="/usecases" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Usecases</a> can help you discover next steps, and you can <a href="/search?tab=workflows" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>search</a> for them directly. <a href="/docs/workflows" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Learn more</a>
				</Typography>
				{showUpload === true ? 
					<div style={{ float: "right" }}>
						<Tooltip color="primary" title={"Import manually"} placement="top">
							<Button
								color="primary"
								style={{}}
								variant="text"
								onClick={() => upload.click()}
							>
								<PublishIcon />
							</Button>
						</Tooltip>
        	  		</div>
				: null}
        	</div>
					{/*newWorkflow === true ? 
						<div style={{flex: 1, marginLeft: 45, }}>
							<Typography variant="h6">
								Use a Template
							</Typography>
							<Typography variant="body2" color="textSecondary" style={{maxWidth: 440,}}>
								Start your workflow from our templating system. This uses publied workflows from our <a href="/creators" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e"}}>Creators</a> to generate full Usecases or parts of your Workflow.
							</Typography>
						</div>
					: null*/}
				</div>
      </DialogTitle>
      <FormControl>
        <DialogContent style={{paddingTop: 10, display: "flex", minHeight: 300, zIndex: 1001, }}>
			<div style={{minWidth: newWorkflow ? 500 : 550, maxWidth: newWorkflow ? 450 : 500, }}>
          	<TextField
          	  onChange={(event) => {
				setName(event.target.value)
			  }}
          	  InputProps={{
          	    style: {
          	      color: "white",
          	    },
          	  }}
          	  color="primary"
          	  placeholder="Name"
							required
          	  margin="dense"
          	  defaultValue={innerWorkflow.name}
							label="Name"
          	  autoFocus
          	  fullWidth
          	/>
			<div style={{display: "flex", }}>
				<TextField
				  onBlur={(event) => {
					setDescription(event.target.value)
				  }}
				  InputProps={{
					style: {
					  color: "white",
					},
				  }}
				  maxRows={4}
				  color="primary"
				  defaultValue={innerWorkflow.description}
				  placeholder="Description"
				  multiline
				  label="Description"
				  margin="dense"
				  fullWidth
				/>
			</div>
						<div style={{display: "flex", marginTop: 10, }}>
							{usecases !== null && usecases !== undefined && usecases.length > 0 ? 
      					<FormControl style={{flex: 1, marginRight: 5,}}>
      					  <InputLabel htmlFor="grouped-select-usecase">Usecases</InputLabel>
      					  <Select 
										defaultValue="" 
										id="grouped-select" 
										label="Matching Usecase" 
										multiple
										value={selectedUsecases}
										renderValue={(selected) => selected.join(', ')}
										onChange={(event) => {
											console.log("Changed: ", event)
										}}
									>
      					    <MenuItem value="">
      					      <em>None</em>
      					    </MenuItem>
										{usecases.map((usecase, index) => {
											//console.log(usecase)
											return (
												<span key={index}>
													<ListSubheader
														style={{color: usecase.color}}
													>
														{usecase.name}
													</ListSubheader>
													{usecase.list.map((subcase, subindex) => {
														//console.log(subcase)
														total_count += 1
														return (
															<MenuItem key={subindex} value={total_count} onClick={(event) => {
																if (selectedUsecases.includes(subcase.name)) {
																	const itemIndex = selectedUsecases.indexOf(subcase.name)
																	if (itemIndex > -1) {
																		selectedUsecases.splice(itemIndex, 1)
																	}
																} else {
																	selectedUsecases.push(subcase.name)
																}

    	  												setUpdate(Math.random());
																setSelectedUsecases(selectedUsecases)
															}}>
          	  	  							<Checkbox style={{color: selectedUsecases.includes(subcase.name) ? usecase.color : theme.palette.inputColor}} checked={selectedUsecases.includes(subcase.name)} />
									              <ListItemText primary={subcase.name} />
															</MenuItem>
														)
													})}
												</span>
											)
										})}
      					  </Select>
      					</FormControl>
							: null}
							<MuiChipsInput
								style={{ flex: 1, maxHeight: 120, overflow: "auto",}}
								InputProps={{
									style: {
										color: "white",
									},
								}}
								placeholder="Tags"
								color="primary"
								fullWidth
								value={newWorkflowTags}
								onChange={(chip) => {
									console.log("Chip: ", chip)
									//newWorkflowTags.push(chip);
									setNewWorkflowTags(chip);
								}}
								onAdd={(chip) => {
									newWorkflowTags.push(chip);
									setNewWorkflowTags(newWorkflowTags);
								}}
								onDelete={(chip, index) => {
									console.log("Deleting: ", chip, index)
									newWorkflowTags.splice(index, 1);
									setNewWorkflowTags(newWorkflowTags);
									setUpdate(Math.random());
								}}
							/>
						</div>

  					{showMoreClicked === true ? 
							<span style={{marginTop: 25, }}>
								<div style={{display: "flex"}}>
									<FormControl style={{marginTop: 15, }}>
										<FormLabel id="demo-row-radio-buttons-group-label">Status</FormLabel>
											<RadioGroup
												row
												aria-labelledby="demo-row-radio-buttons-group-label"
												name="row-radio-buttons-group"
												defaultValue={innerWorkflow.status}
												onChange={(e) => {
													console.log("Data: ", e.target.value)
													
													//innerWorkflow.workflow_type = e.target.value
													innerWorkflow.status = e.target.value
													setInnerWorkflow(innerWorkflow)
												}}
											>
												<FormControlLabel value="test" control={<Radio />} label="Test" />
												<FormControlLabel value="production" control={<Radio />} label="Production" />

											</RadioGroup>
									</FormControl>
									<LocalizationProvider dateAdapter={AdapterDayjs}>
										<DatePicker 
											sx={{
												marginTop: 3, 
												marginLeft: 3, 
											}}
											value={dueDate} 
											label="Due Date"
											format="YYYY-MM-DD"
											onChange={(newValue) => {
												setDueDate(newValue)
											}}
										/>
									</LocalizationProvider>
								</div>
								<div />

								<FormControl style={{marginTop: 15, }}>
									<FormLabel id="demo-row-radio-buttons-group-label">Type</FormLabel>
										<RadioGroup
											row
											aria-labelledby="demo-row-radio-buttons-group-label"
											name="row-radio-buttons-group"
											defaultValue={innerWorkflow.workflow_type}
											onChange={(e) => {
												console.log("Data: ", e.target.value)
												
												innerWorkflow.workflow_type = e.target.value
												setInnerWorkflow(innerWorkflow)
											}}
										>
											<FormControlLabel value="trigger" control={<Radio />} label="Trigger" />
											<FormControlLabel value="subflow" control={<Radio />} label="Subflow" />
											<FormControlLabel value="standalone" control={<Radio />} label="Standalone" />

										</RadioGroup>
								</FormControl>


								<TextField
									onBlur={(event) => {
										innerWorkflow.blogpost = event.target.value
										setInnerWorkflow(innerWorkflow)
									}}
									InputProps={{
										style: {
											color: "white",
										},
									}}
									color="primary"
									defaultValue={innerWorkflow.blogpost}
									placeholder="A blogpost or other reference for how this work workflow was built, and what it's for."
									rows="1"
									label="blogpost"
									margin="dense"
									fullWidth
								/>
								<TextField
									onBlur={(event) => {
										innerWorkflow.video = event.target.value
										setInnerWorkflow(innerWorkflow)
									}}
									InputProps={{
										style: {
											color: "white",
										},
									}}
									color="primary"
									defaultValue={innerWorkflow.video}
									placeholder="A youtube or loom link to the video"
									rows="1"
									label="Video"
									margin="dense"
									fullWidth
								/>
								<TextField
									onBlur={(event) => {
										innerWorkflow.default_return_value = event.target.value
										setInnerWorkflow(innerWorkflow)
									}}
									InputProps={{
										style: {
											color: "white",
										},
									}}
									color="primary"
									defaultValue={innerWorkflow.default_return_value}
									placeholder="Default return value (used for Subflows if the subflow fails)"
									rows="3"
									multiline
									label="Default return value"
									margin="dense"
									fullWidth
								/>
							</span>
						: null}
          	<Tooltip color="primary" title={"Add more details"} placement="top">
				<IconButton
					style={{ color: "white", margin: "auto", marginTop: 10, textAlign: "center", width: 50,}}
					onClick={() => {
						setShowMoreClicked(!showMoreClicked);
					}}
				>
					{showMoreClicked ? <ExpandLessIcon /> : <ExpandMoreIcon/>}
				</IconButton>
			</Tooltip>
		</div>

        </DialogContent>

        <DialogActions style={{paddingRight: 100,  }}>
          <Button
            style={{}}
            onClick={() => {
				if (setNewWorkflow !== undefined) {
					setWorkflow({})
				}

				setModalOpen(false)
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{}}
            disabled={name.length === 0 || submitLoading === true}
            onClick={() => {
				setSubmitLoading(true)

				innerWorkflow.name = name 
				innerWorkflow.description = description 
				if (newWorkflowTags.length > 0) {
					innerWorkflow.tags = newWorkflowTags
				}

				if (selectedUsecases.length > 0) {
					innerWorkflow.usecase_ids = selectedUsecases
				}

				if (dueDate > 0) {
					innerWorkflow.due_date = new Date(`${dueDate["$y"]}-${dueDate["$M"]+1}-${dueDate["$D"]}`).getTime()/1000
				}

				if (setNewWorkflow !== undefined) {
					setNewWorkflow(
						innerWorkflow.name,
						innerWorkflow.description,
						innerWorkflow.tags,
						innerWorkflow.default_return_value,
						innerWorkflow,
						newWorkflow,
						innerWorkflow.usecase_ids,
						innerWorkflow.blogpost,
						innerWorkflow.status,
					)
					setWorkflow({})
				} else {
					setWorkflow(innerWorkflow)
					console.log("editing workflow: ", innerWorkflow)
				}
				
				setSubmitLoading(true)

				// If new workflow, don't close it
				if (isEditing) {
					setModalOpen(false)
				}
            }}
            color="primary"
          >
            {submitLoading ? <CircularProgress color="secondary" /> : "Done"}
          </Button>
        </DialogActions>
		{newWorkflow === true ?
			<span style={{marginTop: 30, }}>
			  <Typography variant="h6" style={{marginLeft: 30, paddingBottom: 0, }}>
				Relevant Workflows
			  </Typography>

			  {priority === null || priority === undefined ? null : 
				<div style={{marginLeft: 30, }}>
				  <WorkflowTemplatePopup 
					userdata={userdata}
					globalUrl={globalUrl}

					srcapp={priority.description.split("&").length > 2 ? priority.description.split("&")[0] : ""}
					img1={priority.description.split("&").length > 2 ? priority.description.split("&")[1] : ""}

					dstapp={priority.description.split("&").length > 3 ? priority.description.split("&")[2] : ""}
					img2={priority.description.split("&").length > 3 ? priority.description.split("&")[3] : ""}
					title={priority.name}
					description={priority.description.split("&").length > 4 ? priority.description.split("&")[4] : ""}

					apps={apps}
				  />
				</div>
				}
			  
			</span>
		: null}

		  {newWorkflow === true && name.length > 2 ?
			<div style={{marginLeft: 30, }}>
				<WorkflowGrid 
					maxRows={1}
					globalUrl={globalUrl}
					showSuggestions={false}
					isMobile={isMobile}
					userdata={userdata}
					inputsearch={name+description+newWorkflowTags.join(" ")}

					parsedXs={6}
					alternativeView={false}
					onlyResults={true}
				/>
			</div> 
		  : null}
      </FormControl>
    </Drawer>
	)
}

export default EditWorkflow;
