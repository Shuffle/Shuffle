import React, { useEffect, useContext } from "react";
import theme from '../theme';
import { isMobile } from "react-device-detect" 
import ChipInput from "material-ui-chip-input";

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
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Chip,
  Switch,
  Typography,
  Zoom,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
	OutlinedInput,
	Checkbox,
	ListItemText,
} from "@material-ui/core";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Publish as PublishIcon,
} from "@material-ui/icons";

const EditWorkflow = (props) => {
	const { workflow, setWorkflow, modalOpen, setModalOpen, showUpload, usecases, } = props

  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [selectedUsecases, setSelectedUsecases] = React.useState([]);
  const [showMoreClicked, setShowMoreClicked] = React.useState(false);
	const [innerWorkflow, setInnerWorkflow] = React.useState(workflow)
  const [_, setUpdate] = React.useState(""); // Used for rendering, don't remove
  const [newWorkflowTags, setNewWorkflowTags] = React.useState(workflow.tags !== undefined && workflow.tags !== null ? JSON.parse(JSON.stringify(workflow.tags)) : [])

	if (workflow === undefined || workflow.id === undefined || setWorkflow === undefined || modalOpen !== true) {
		return null
	}

  var upload = "";
	var total_count = 0

	return (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.surfaceColor,
          color: "white",
          minWidth: isMobile ? "90%" : "800px",
          maxWidth: isMobile ? "90%" : "800px",
        },
      }}
    >
      <DialogTitle>
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          {workflow.id !== undefined ? "Editing" : "New"} workflow
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
      </DialogTitle>
      <FormControl>
        <DialogContent>
          <TextField
            onBlur={(event) => {
							innerWorkflow.name = event.target.value
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
            autoFocus
            fullWidth
          />
          <TextField
            onBlur={(event) => {
							innerWorkflow.description = event.target.value
							setInnerWorkflow(innerWorkflow)
						}}
            InputProps={{
              style: {
                color: "white",
              },
            }}
            color="primary"
            defaultValue={innerWorkflow.description}
            placeholder="Description"
            multiline
            margin="dense"
            fullWidth
          />
					<div style={{display: "flex", marginTop: 10, }}>
						<ChipInput
							style={{ flex: 1}}
							InputProps={{
								style: {
									color: "white",
								},
							}}
							placeholder="Tags"
							color="primary"
							fullWidth
							value={newWorkflowTags}
							onAdd={(chip) => {
								newWorkflowTags.push(chip);
								setNewWorkflowTags(newWorkflowTags);
							}}
							onDelete={(chip, index) => {
								newWorkflowTags.splice(index, 1);
								setNewWorkflowTags(newWorkflowTags);
							}}
						/>
						{usecases !== null && usecases !== undefined && usecases.length > 0 ? 
      				<FormControl style={{flex: 1, marginLeft: 5, }}>
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
					</div>

  				{showMoreClicked === true ? 
						<span style={{marginTop: 25, }}>
							<TextField
								onBlur={(event) => {
									if (event.target.value.toLowerCase() === "test") {
										innerWorkflow.status = "test"
									} else if (event.target.value.toLowerCase() === "production" || event.target.value.toLowerCase() === "prod") {
										innerWorkflow.status = "production"
									} else {
										innerWorkflow.status = "test"
									}

									setInnerWorkflow(innerWorkflow)
								}}
								InputProps={{
									style: {
										color: "white",
									},
								}}
								color="primary"
								defaultValue={innerWorkflow.status}
								placeholder="The status of the workflow. Can be test or production."
								rows="1"
								margin="dense"
								fullWidth
							/>
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
							{showMoreClicked ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
					</Tooltip>

        </DialogContent>
        <DialogActions>
          <Button
            style={{}}
            onClick={() => {
							setModalOpen(false)
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{}}
            disabled={innerWorkflow.name.length === 0}
            onClick={() => {
							if (newWorkflowTags.length > 0) {
								innerWorkflow.tags = newWorkflowTags
							}

							setWorkflow(innerWorkflow)
							setModalOpen(false)
            }}
            color="primary"
          >
            {submitLoading ? <CircularProgress color="secondary" /> : "Submit"}
          </Button>
        </DialogActions>
      </FormControl>
    </Dialog>
	)
}

export default EditWorkflow;
