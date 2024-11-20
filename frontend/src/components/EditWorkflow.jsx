import React, { useEffect, useContext } from "react";
import theme from '../theme.jsx';
import { isMobile } from "react-device-detect" 
import { MuiChipsInput } from "mui-chips-input";
import { toast } from "react-toastify" 
import UsecaseSearch from "../components/UsecaseSearch.jsx"
import WorkflowGrid from "../components/WorkflowGrid.jsx"
import dayjs from 'dayjs';
import WorkflowTemplatePopup from "./WorkflowTemplatePopup.jsx";
import WorkflowValidationTimeline from "../components/WorkflowValidationTimeline.jsx"

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
  Link,
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
	Slider,

} from "@mui/material";

import { 
	DatePicker, 
	LocalizationProvider,
} from '@mui/x-date-pickers'

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useStyles } from '../views/AppCreator.jsx'

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Publish as PublishIcon,
  OpenInNew as OpenInNewIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";

const EditWorkflow = (props) => {
	const { globalUrl, workflow, setWorkflow, modalOpen, setModalOpen, showUpload, usecases, setNewWorkflow, appFramework, isEditing, userdata, apps, saveWorkflow, expanded, scrollTo, setRealtimeMarkdown, boxWidth, setBoxWidth, } = props

  const [_, setUpdate] = React.useState(""); // Used for rendering, don't remove

  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [showMoreClicked, setShowMoreClicked] = React.useState(expanded === true ? true : false);
  const [innerWorkflow, setInnerWorkflow] = React.useState(workflow)

  const [newWorkflowTags, setNewWorkflowTags] = React.useState(workflow.tags !== undefined && workflow.tags !== null ? JSON.parse(JSON.stringify(workflow.tags)) : [])
  const [description, setDescription] = React.useState(workflow.description !== undefined ? workflow.description : "")

  const [selectedUsecases, setSelectedUsecases] = React.useState(workflow.usecase_ids !== undefined && workflow.usecase_ids !== null ? JSON.parse(JSON.stringify(workflow.usecase_ids)) : []);
	const [foundWorkflowId, setFoundWorkflowId] = React.useState("")
	const [name, setName] = React.useState(workflow.name !== undefined ? workflow.name : "")
	const [dueDate, setDueDate] = React.useState(workflow.due_date !== undefined && workflow.due_date !== null && workflow.due_date !== 0 ? dayjs(workflow.due_date*1000) : dayjs().subtract(1, 'day'))

    const [inputQuestions, setInputQuestions] = React.useState(workflow.input_questions !== undefined && workflow.input_questions !== null ? JSON.parse(JSON.stringify(workflow.input_questions)) : []) 
	const [inputMarkdown, setInputMarkdown] = React.useState(workflow?.form_control?.input_markdown !== undefined && workflow?.form_control?.input_markdown !== null ? workflow?.form_control?.input_markdown : "")
	const [scrollDone, setScrollDone] = React.useState(false)
	const [selectedYieldActions, setSelectedYieldActions] = React.useState(workflow?.form_control?.output_yields !== undefined && workflow?.form_control?.output_yields !== null ? JSON.parse(JSON.stringify(workflow?.form_control?.output_yields)) : [])
	const [formWidth, setFormWidth] = React.useState(boxWidth === undefined || boxWidth === null ? 500 : boxWidth)

  const classes = useStyles();

	useEffect(() => {
		if (setBoxWidth !== undefined && boxWidth !== formWidth) {
			setBoxWidth(formWidth)
		}
	}, [formWidth])

  if (scrollTo !== undefined && scrollTo !== null && scrollTo.length > 0 && scrollDone === false) {
	  setTimeout(() => {
		  const foundScroll = document.getElementById(scrollTo)
		  if (foundScroll !== null) {
			  // Smooth scroll
			  foundScroll.scrollIntoView({ behavior: "smooth" })
		  }
			  
	  }, 200)
	  setScrollDone(true)

  }

	// Gets the generated workflow 
  const getGeneratedWorkflow = (workflow_id) => {
	const url = `${globalUrl}/api/v1/workflows/${workflow_id}`
    fetch(url, {
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
  var upload = "";
	var total_count = 0

	return (
    <Drawer
	  anchor={"right"}
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
							<Tooltip title="Go to Public Form page">
								<IconButton>
									<a
										rel="noopener noreferrer"
										href={`/forms/${workflow.id}`}
										target="_blank"
										style={{
											textDecoration: "none",
											color: "#f85a3e",
											marginLeft: 5,
										}}
									>
										<EditNoteIcon />
									</a>
								</IconButton>
							</Tooltip>
						</div>
					}

				</div>
				<Typography variant="body2" color="textSecondary" style={{marginTop: 20, maxWidth: 440,}}>
					Workflows can be built from scratch, or from templates. <a href="/usecases2" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Usecases</a> can help you discover next steps, and you can <a href="/search?tab=workflows" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>search</a> for them directly. <a href="/docs/workflows" rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Learn more</a>
				</Typography>

				{/*
				<div style={{marginTop: 10, marginBottom: 10, marginRight: 50, }}>
					<WorkflowValidationTimeline 
					
					  apps={apps}
					  workflow={workflow}
					/>
				</div>
				*/}

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
		<div style={{borderTop: "1px solid rgba(255,255,255,0.5)", width: 600, position: "fixed", right: 20, bottom: 0, zIndex: 1002, backgroundColor: "rgba(53,53,53,1)", height: 75, paddingTop: 20, paddingLeft: 75, }}>
		  {/*
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
		  */}
          <Button
            variant="contained"
            style={{}}
            disabled={name.length === 0 || submitLoading === true}
            onClick={() => {
				setSubmitLoading(true)

				// Loop inputfields
				var validfields = []
				for (var i = 0; i < inputQuestions.length; i++) {
					if (inputQuestions[i].deleted === true) {
						continue
					}

					if (inputQuestions[i].value.length === 0) {
						continue
					}

					validfields.push(inputQuestions[i])
				}

				innerWorkflow.input_questions = validfields

				if (innerWorkflow.form_control === undefined || innerWorkflow.form_control === null) {
					innerWorkflow.form_control = {}
				}

				innerWorkflow.form_control.input_markdown = inputMarkdown
				innerWorkflow.form_control.output_yields = selectedYieldActions
				innerWorkflow.form_control.form_width = formWidth

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

				if (saveWorkflow !== undefined) {
					saveWorkflow(innerWorkflow)
					
					if (setWorkflow !== undefined) {
						setWorkflow(innerWorkflow)
					}
				} else if (setNewWorkflow !== undefined) {
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
            {submitLoading ? <CircularProgress color="secondary" /> : "Save Changes"}
          </Button>
        </div>

        <DialogContent style={{paddingTop: 10, display: "flex", minHeight: 300, zIndex: 1001, paddingBottom: 200, }}>
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
									setNewWorkflowTags(chip);
								}}
								onBlur={(event) => {
									if (event.target.value.length === 0) {
										return
									}

									if (newWorkflowTags.includes(event.target.value)) {
										return
									}

									newWorkflowTags.push(event.target.value)
									setNewWorkflowTags(newWorkflowTags)

									setUpdate(Math.random())
								}}
								onAdd={(chip) => {
									newWorkflowTags.push(chip)
									setNewWorkflowTags(newWorkflowTags)
								}}
								onDelete={(chip, index) => {
									console.log("Deleting: ", chip, index)
									newWorkflowTags.splice(index, 1)
									setNewWorkflowTags(newWorkflowTags)
									setUpdate(Math.random())
								}}
							/>
						</div>

  					{showMoreClicked === true ? 
						<div style={{marginTop: 50, }}>
							<TextField
							  onBlur={(event) => {
								setDescription(event.target.value)
							  }}
							  InputProps={{
								style: {
								  color: "white",
								},
							  }}
							  multiLine
							  rows={3}
							  color="primary"
							  defaultValue={innerWorkflow.description}
							  placeholder="Description"
							  multiline
							  label="Description"
							  margin="dense"
							  fullWidth
							/>

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

								<Divider style={{marginTop: 20, marginBottom: 20, }} />

								<Typography variant="h4" style={{marginTop: 50, }}>
									MSSP controls
								</Typography>


								<Typography variant="body1" style={{marginTop: 50, }}>
									MSSP Suborg Distribution (<b>beta</b> - contact support@shuffler.io for more info)
								</Typography>
								{userdata !== undefined && userdata !== null && userdata.orgs !== undefined && userdata.orgs !== null && userdata.orgs.length > 0 ?
									userdata.orgs.filter(org => org.creator_org === userdata.active_org.id).length === 0 ?
										userdata.active_org.creator_org === undefined || userdata.active_org.creator_org === null || userdata.active_org.creator_org === "" ?
											<Typography variant="body2" style={{marginTop: 10, color: "rgba(255,255,255,0.7)"}}>
												Your organization does not have any suborgs yet OR your user may not have access to available suborgs. Please <a href="/admin?tab=suborgs" style={{textDecoration: "none", color: "#f86a3e"}} target="_blank">make one</a> or get access to suborgs by another admin, then try again.
											</Typography>
											:
											<Typography variant="body2" style={{marginTop: 10, color: "rgba(255,255,255,0.7)"}}>
												{innerWorkflow.parentorg_workflow !== undefined && innerWorkflow.parentorg_workflow !== null && innerWorkflow.parentorg_workflow.length > 0 ? <span>This workflow is distributed from <a href={`/workflows/${innerWorkflow.parentorg_workflow}`} style={{textDecoration: "none", color: "#f86a3e"}} target="_blank">your parent workflow</a> (you may not have access).</span> : null}
												<br />
												<br />
												You can only distribute to suborgs from a parent org.
											</Typography>
									:
									<Select
										multiple
										style={{marginTop: 10, }}
										value={innerWorkflow.suborg_distribution === undefined || innerWorkflow.suborg_distribution === null ? ["none"] : innerWorkflow.suborg_distribution}
										onChange={(e) => {
											var newvalue = e.target.value
											if (newvalue.length > 1 && newvalue[0] === "none") {
												newvalue = newvalue.filter(value => value !== "none")
											}

											if (newvalue.includes("none")) {
												newvalue  = ["none"]
											} else if (newvalue.includes("all")) {
												newvalue  = userdata.orgs.filter(org => org.creator_org === userdata.active_org.id).map(org => org.id)
											}

											innerWorkflow.suborg_distribution = newvalue
											setInnerWorkflow(innerWorkflow)
											setUpdate(Math.random())
										}}
										label="Suborg Distribution"
										fullWidth
									>
										<MenuItem value="none">
											None
										</MenuItem>
										<MenuItem value="all">
											All	
										</MenuItem>
										{userdata.orgs.map((data, index) => {
                                           	var skipOrg = false;
                                           	if (data.creator_org !== undefined && data.creator_org !== null && data.creator_org === userdata.active_org.id) {
                                           	  // Finds the parent org
                                           	} else {
												return null
											}

                    						const imagesize = 22
											const imageStyle = {
											  width: imagesize,
											  height: imagesize,
											  pointerEvents: "none",
											  marginRight: 10,
											  marginLeft:
												data.creator_org !== undefined &&
												  data.creator_org !== null &&
												  data.creator_org.length > 0
												  ? data.id === userdata.active_org.id
													? 0
													: 20
												  : 0,
											}

											const image =
											  data.image === "" ? (
												<img
												  alt={data.name}
												  src={theme.palette.defaultImage}
												  style={imageStyle}
												/>
											  ) : (
												<img
												  alt={data.name}
												  src={data.image}
												  style={imageStyle}
												/>
											  )


											return (
												<MenuItem key={index} value={data.id}>
												  <Checkbox checked={innerWorkflow.suborg_distribution !== undefined && innerWorkflow.suborg_distribution !== null && innerWorkflow.suborg_distribution.includes(data.id)} />
													  {image}{" "}
													  <span style={{ marginLeft: 8 }}>
														{data.name}
													  </span>
												</MenuItem>
											)
										})}
									</Select>
								: 
									<Link to={"/admin?tab=suborgs"} style={{textDecoration: "none", color: "#f86a3e"}} target="_blank">
										<Typography variant="body2" style={{marginTop: 10, }}>
											Create a sub-org to distribute workflows to suborgs.
										</Typography>
									</Link>
								}
									
								{/*<Divider style={{marginTop: 20, marginBottom: 20, }} />*/}

								

								<Typography variant="body1" style={{marginTop: 100, }}>
									Git Backup Repository
								</Typography>
								<Typography variant="body2" style={{ textAlign: "left", marginTop: 5, }} color="textSecondary">
									Decide where this workflow is backed up in a Git repository. Will create logs and notifications if upload fails. <b>The repository and branch must already have been initialized</b>. Files will show up in the root folder in the format 'orgid/workflow status/workflow id.json' without images. Overrides your <a href="/admin?admin_tab=organization" style={{textDecoration: "none", color: "#f86a3e"}} target="_blank">default backup repository</a>. <a href="/docs/configuration#environment-variables" style={{textDecoration: "none", color: "#f86a3e"}} target="_blank">Credentials are encrypted.</a> Creates <a href="/admin?admin_tab=priorities" style={{textDecoration: "none", color: "#f86a3e"}} target="_blank">notifications</a> if it fails.
								</Typography>
								<Grid container style={{ marginTop: 10, }} spacing={2}>
									<Grid item xs={6} style={{}}>
										<span>
											<Typography>Workflow Backup Repository</Typography>
											<TextField
												required
												style={{
													flex: "1",
													marginTop: "5px",
													marginRight: "15px",
												}}
												fullWidth={true}
												type="name"
												multiline={true}
												rows={1}
												id="outlined-with-placeholder"
												margin="normal"
												variant="outlined"
												placeholder="github/com/shuffle/workflowbackup "
												defaultValue={innerWorkflow.backup_config === undefined || innerWorkflow.backup_config.upload_repo === undefined || innerWorkflow.backup_config.upload_repo === null  || innerWorkflow.backup_config.upload_repo === "" ? "" : innerWorkflow.backup_config.upload_repo}
												onChange={(e) => {
													//setUploadRepo(e.target.value);
													innerWorkflow.backup_config.upload_repo = e.target.value
													setInnerWorkflow(innerWorkflow)
												}}
												InputProps={{
													classes: {
														notchedOutline: classes.notchedOutline,
													},
													style: {
														color: "white",
													},
												}}
											/>
										</span>
									</Grid>
									<Grid item xs={6} style={{}}>
										<span>
											<Typography>Branch</Typography>
											<TextField
												style={{
													flex: "1",
													marginTop: "5px",
													marginRight: "15px",
												}}
												fullWidth={true}
												type="name"
												id="outlined-with-placeholder"
												margin="normal"
												variant="outlined"
												multiline={true}
												rows={1}
												placeholder="The branch to use (default: master)"
												defaultValue={innerWorkflow.backup_config === undefined || innerWorkflow.backup_config.upload_branch === undefined || innerWorkflow.backup_config.upload_branch === null  || innerWorkflow.backup_config.upload_branch === "" ? "" : innerWorkflow.backup_config.upload_branch}
												onChange={(e) => {
													innerWorkflow.backup_config.upload_branch = e.target.value
													setInnerWorkflow(innerWorkflow)
												}}
												InputProps={{
													classes: {
														notchedOutline: classes.notchedOutline,
													},
													style: {
														color: "white",
													},
												}}
											/>
										</span>
									</Grid>
								</Grid>
								<Grid container style={{ }} spacing={2}>
									<Grid item xs={6} style={{}}>
										<span>
											<Typography>Username</Typography>
											<TextField
												style={{
													flex: "1",
													marginTop: "5px",
													marginRight: "15px",
												}}
												fullWidth={true}
												type="name"
												multiline={true}
												rows={1}
												id="outlined-with-placeholder"
												margin="normal"
												variant="outlined"
												placeholder="Username to use" 
												defaultValue={innerWorkflow.backup_config === undefined || innerWorkflow.backup_config.upload_username === undefined || innerWorkflow.backup_config.upload_username === null  || innerWorkflow.backup_config.upload_username === "" ? "" : innerWorkflow.backup_config.upload_username}
												onChange={(e) => {
													innerWorkflow.backup_config.upload_username = e.target.value
													setInnerWorkflow(innerWorkflow)
												}}
												InputProps={{
													classes: {
														notchedOutline: classes.notchedOutline,
													},
													style: {
														color: "white",
													},
												}}
											/>
										</span>
									</Grid>
									<Grid item xs={6} style={{}}>
										<span>
											<Typography>Git token/password</Typography>
											<TextField
												required
												style={{
													flex: "1",
													marginTop: "5px",
													marginRight: "15px",
												}}
												fullWidth={true}
												id="outlined-with-placeholder"
												margin="normal"
												variant="outlined"
												multiline={true}
												rows={1}
												placeholder="Your API token. Required." 
												defaultValue={innerWorkflow.backup_config === undefined || innerWorkflow.backup_config.upload_token === undefined || innerWorkflow.backup_config.upload_token === null  || innerWorkflow.backup_config.upload_token === "" ? "" : innerWorkflow.backup_config.upload_token}
												onChange={(e) => {
													innerWorkflow.backup_config.upload_token = e.target.value
													setInnerWorkflow(innerWorkflow)
												}}
												InputProps={{
													classes: {
														notchedOutline: classes.notchedOutline,
													},
													style: {
														color: "white",
													},
												}}
												type="password"
											/>
										</span>
									</Grid>
								</Grid>

						<Divider style={{marginTop: 20, marginBottom: 20, }} />


						<div id="form_fill" style={{position: "relative", }}>
							<Typography variant="h4" style={{marginTop: 100, }}>
								Form Control
							</Typography>
							<Typography variant="body1" color="textSecondary" style={{marginTop: 10, }}>
								Form Control is used to control how the Form for the workflow is shown to users. You can add input fields, markdown, and more. This is the first step in the workflow, and is required for all workflows.
							</Typography>

							<Typography variant="h6" style={{marginTop: 50, }}>
								Input fields
							</Typography>

							<Tooltip title="Go to Public Form page">
								<IconButton style={{position: "absolute", top: 0, right: 10, }}>
									<a
										rel="noopener noreferrer"
										href={`/forms/${workflow.id}`}
										target="_blank"
										style={{
											textDecoration: "none",
											color: "#f85a3e",
											marginLeft: 5,
										}}
									>
										<EditNoteIcon />
									</a>
								</IconButton>
							</Tooltip>

						</div>

						<Typography variant="body2" color="textSecondary" style={{marginBottom: 20, }}>
							Input fields are fields that will be used during the startup of the workflow. These will be formatted in JSON and is most commonly used from the <a href={`/forms/${workflow.id}`} rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Form page</a> for this workflow. If chosen in the User Input node, these will be required fields. Use Semi-Colon ";" to create dropdown options. The first key will be the name shown, and subsequent keys will be the available values.
						</Typography>


						{inputQuestions.map((data, index) => {
							var showListinfo = false
							if (data.value !== undefined && data.value !== null && data.value.length > 0) {
								if (data.value.includes(";")) {
									showListinfo = true 
								}
							}

							return (
								<div style={{display: "flex", }}>
									<TextField
									  disabled={data.deleted === true}
									  style={{
										flex: 2,
										marginTop: 0,
										marginBottom: 0,
										backgroundColor: theme.palette.inputColor,
										marginRight: 5,
									  }}
									  fullWidth={true}
									  placeholder="Question"
									  id="standard-required"
									  margin="normal"
									  variant="outlined"
									  defaultValue={data.name}
									  onChange={(e) => {
										inputQuestions[index].name = e.target.value
										setInputQuestions(inputQuestions)
										setUpdate(Math.random());
									  }}
									  InputProps={{
										classes: {
										  notchedOutline: classes.notchedOutline,
										},
									  }}
									/>
									<TextField
									  disabled={data.deleted === true}
									  style={{
										flex: 2,
										marginTop: 0,
										marginBottom: 0,
										backgroundColor: theme.palette.inputColor,
										marginRight: 5,
									  }}
									  fullWidth={true}
									  placeholder="$exec JSON key"
									  id="standard-required"
									  margin="normal"
									  variant="outlined"
								      helperText={showListinfo === true ? "Dropdown list" : null}
									  defaultValue={data.value}
									  onChange={(e) => {
										// Replace multiple semicolon with one
										e.target.value = e.target.value.replace(";;", ";")

										inputQuestions[index].value = e.target.value
										setInputQuestions(inputQuestions)
										setUpdate(Math.random());
									  }}
									  InputProps={{
										classes: {
										  notchedOutline: classes.notchedOutline,
										},
									  }}
									/>
									<Button
									  color="primary"
									  style={{ maxWidth: 50, marginLeft: 15 }}
									  disabled={data.deleted === true}
									  variant="outlined"
									  onClick={() => {
										  // Remove current index
										  console.log("Removing index: ", index)
										  inputQuestions[index].deleted = true
										  setUpdate(Math.random());
									  }}
									>
									  <RemoveIcon style={{}} />
									</Button>
								</div>
							)
						})}

						<Button
						  color="primary"
						  style={{ maxWidth: 50, marginLeft: 15, marginTop: 20, }}
						  variant="outlined"

						  disabled={inputQuestions !== undefined && inputQuestions !== null && inputQuestions.length > 5}
						  onClick={() => {
							inputQuestions.push({
								"name": "",
								"value": "",
								"deleted": false, 
								"required": false
							})
							setInputQuestions(inputQuestions)
							setUpdate(Math.random());
						  }}
						>
						  <AddIcon style={{}} />
						</Button>
						
						<div id="input_markdown">
							<Typography variant="h6" style={{marginTop: 50, }}>
								Input Markdown 
							</Typography>
							<Typography variant="body2" color="textSecondary" style={{marginBottom: 20, }}>
								Markdown will be shown on the <a href={`/forms/${workflow.id}`} rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", color: "#f86a3e" }}>Form page</a>. The first image added will be used in your Form Toolbox list. Output for a Workflow is shown in Markdown, and is controlled by the LAST action that runs. Supports HTML. 
							</Typography>
							<TextField
								multiline
								minRows={3}
								fullWidth
								color="primary"
								value={inputMarkdown}
						  		onKeyDown={(e) => {
									//console.log("KEY: ", e.key)
									if (e.key === "Tab") {
      									e.preventDefault()
									}
								}}

								onChange={(e) => {
									if (setRealtimeMarkdown !== undefined) {
										setRealtimeMarkdown(e.target.value)
									}

									setInputMarkdown(e.target.value)
									workflow.form_control.input_markdown = e.target.value
									setWorkflow(workflow)
									setUpdate(Math.random())
								}}
							/>
						</div>

						<div id="form_size">
							<Typography variant="h6" style={{marginTop: 50, }}>
								Form Size
							</Typography>
							<Typography variant="body2" color="textSecondary" style={{marginBottom: 20, }}>
								Control the width of the form. It will grow vertically as needed.
							</Typography>
							<Slider
								defaultValue={formWidth}
								aria-labelledby="discrete-slider"
								valueLabelDisplay="auto"
								step={10}
								marks
								min={300}
								max={1000}
								onChange={(e, value) => {
									setFormWidth(value)
								}}
							/>
						</div>

						<div id="output_control">
							<Typography variant="h6" style={{marginTop: 50, }}>
								Output Control ({selectedYieldActions.length === 0 ? "No Returns" : selectedYieldActions.length === 1 ? "Returning 1 node" : `Returning ${selectedYieldActions.length} nodes`})
							</Typography>

							<Typography variant="body2" color="textSecondary" style={{marginBottom: 20, }}>
								When running this workflow, the output will be shown as a Markdown object by default, with JSON objects being rendered. By adding nodes below, they will be shown while the workflow is running as soon as they get a result. Failing/Skipped nodes are not shown. This makes it possible to track progress for more complex usecases.
							</Typography>

							<FormControl style={{marginTop: 15, }}>
							  <Select 
									defaultValue="" 
									id="output-yield-control" 
									label="Yielding nodes" 
									multiple
									fullWidth
									style={{width: 500, }}
									value={selectedYieldActions === [] ? ["none"] : selectedYieldActions}
									renderValue={(selected) => selected.join(', ')}
									onChange={(event) => {
										console.log("Value: ", event.target.value)
										if (event.target.value.length > 0) { 
											if (event.target.value.includes("none")) {
												setSelectedYieldActions([])
												return
											}
										}

										const newvalue = event?.target?.value
										if (newvalue === undefined || newvalue === null) {
										} else {
											setSelectedYieldActions(newvalue)
										}
									}}
								>
								<MenuItem value="none">
								  <em>None</em>
								</MenuItem>
								{workflow?.actions?.map((action, actionIndex) => {
									return (
										<MenuItem 
											key={actionIndex} 
											value={action.id} 
										>
											<Tooltip title={action.app_name} key={actionIndex}>
												<img src={action.large_image !== undefined && action.large_image !== null && action.large_image.length > 0 ? action.large_image : theme.palette.defaultImage} style={{width: 20, height: 20, marginRight: 10, }} />
											</Tooltip>
											{action.label}
										</MenuItem>
									)
								})}
							  </Select>
							</FormControl>
						</div>
					</div>
				: null}



			<Tooltip color="primary" title={"Add more details"} placement="top">
				<Button
					style={{ margin: "auto", marginTop: 50, marginBottom: 100, textAlign: "center",  textTransform: "none", }}
					variant="outlined"
					disabled={newWorkflow === true}
					color="secondary"
					onClick={() => {
						setShowMoreClicked(!showMoreClicked);
					}}
				>
					{showMoreClicked ? <ExpandLessIcon style={{marginRight: 10, }}/> : <ExpandMoreIcon style={{marginRight: 10, }}/>}
					{showMoreClicked ? "Less Options": "More Options"}

				</Button>
			</Tooltip>
		</div>

        </DialogContent>

        
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

		  {/*newWorkflow === true && name.length > 2 ?
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
		  : null*/}
      </FormControl>
    </Drawer>
	)
}

export default EditWorkflow;
