import React, { useEffect, useContext } from "react";
import { makeStyles } from "@mui/styles";

import ReactGA from 'react-ga4';
import SecurityFramework from '../components/SecurityFramework.jsx';
import theme from '../theme.jsx';

import {
  Badge,
  Avatar,
  Grid,
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
} from "@mui/material";

import {
	Check as CheckIcon,
  GridOn as GridOnIcon,
  List as ListIcon,
  Close as CloseIcon,
  Compare as CompareIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  AddCircle as AddCircleIcon,
  Toc as TocIcon,
  Send as SendIcon,
  Search as SearchIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  BubbleChart as BubbleChartIcon,
  Restore as RestoreIcon,
  Cached as CachedIcon,
  GetApp as GetAppIcon,
  Apps as AppsIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Publish as PublishIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";


import { DataGrid, GridToolbar } from "@mui/x-data-grid";

//import JSONPretty from 'react-json-pretty';
//import JSONPrettyMon from 'react-json-pretty/dist/monikai'
import Dropzone from "../components/Dropzone.jsx";

import { useNavigate, Link, useParams } from "react-router-dom";
//import { useAlert
import { ToastContainer, toast } from "react-toastify" 
import { MuiChipsInput } from "mui-chips-input";
import { v4 as uuidv4 } from "uuid";

const inputColor = "#383B40";
const surfaceColor = "#27292D";
const svgSize = 24;
const imagesize = 22;

const useStyles = makeStyles((theme) => ({
  datagrid: {
    border: 0,
    "& .MuiDataGrid-columnsContainer": {
      backgroundColor:
        theme.palette.type === "light" ? "#fafafa" : theme.palette.inputColor,
    },
    "& .MuiDataGrid-iconSeparator": {
      display: "none",
    },
    "& .MuiDataGrid-colCell, .MuiDataGrid-cell": {
      borderRight: `1px solid ${
        theme.palette.type === "light" ? "white" : "#303030"
      }`,
    },
    "& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell": {
      borderBottom: `1px solid ${
        theme.palette.type === "light" ? "#f0f0f0" : "#303030"
      }`,
    },
    "& .MuiDataGrid-cell": {
      color:
        theme.palette.type === "light" ? "white" : "rgba(255,255,255,0.65)",
    },
    "& .MuiPaginationItem-root, .MuiTablePagination-actions, .MuiTablePagination-caption":
      {
        borderRadius: 0,
        color: "white",
      },
  },
}));

  
const chipStyle = {
  backgroundColor: "#3d3f43",
  marginRight: 5,
  paddingLeft: 5,
  paddingRight: 5,
  height: 28,
  cursor: "pointer",
  borderColor: "#3d3f43",
  color: "white",
};

const GettingStarted = (props) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata } = props;

  document.title = "Getting Started with Shuffle";
  //const alert = useAlert();
  const classes = useStyles(theme);
	let navigate = useNavigate();
  const imgSize = 60;

  const referenceUrl = globalUrl + "/api/v1/hooks/";


  var upload = "";

  const [workflows, setWorkflows] = React.useState([]);
  const [filteredWorkflows, setFilteredWorkflows] = React.useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = React.useState({});
  const [workflowDone, setWorkflowDone] = React.useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = React.useState("");

  const [field1, setField1] = React.useState("");
  const [field2, setField2] = React.useState("");
  const [downloadUrl, setDownloadUrl] = React.useState(
    "https://github.com/frikky/shuffle-workflows"
  );
  const [videoViewOpen, setVideoViewOpen] = React.useState(false)
  const [downloadBranch, setDownloadBranch] = React.useState("master");
  const [loadWorkflowsModalOpen, setLoadWorkflowsModalOpen] = React.useState(false);
  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const [exportData, setExportData] = React.useState("");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [newWorkflowName, setNewWorkflowName] = React.useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] =
    React.useState("");
  const [newWorkflowTags, setNewWorkflowTags] = React.useState([]);

  const [defaultReturnValue, setDefaultReturnValue] = React.useState("");

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);
  const [editingWorkflow, setEditingWorkflow] = React.useState({});
  const [importLoading, setImportLoading] = React.useState(false);
  const [isDropzone, setIsDropzone] = React.useState(false);
  const [view, setView] = React.useState("grid");
  const [filters, setFilters] = React.useState([]);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [actionImageList, setActionImageList] = React.useState([]);

  const [firstLoad, setFirstLoad] = React.useState(true);

  const isCloud =
    window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io";

  const findWorkflow = (filters) => {
    if (filters.length === 0) {
      setFilteredWorkflows(workflows);
      return;
    }

    var newWorkflows = [];
    for (var workflowKey in workflows) {
      const curWorkflow = workflows[workflowKey];

      var found = [false];
      if (curWorkflow.tags === undefined || curWorkflow.tags === null) {
        found = filters.map((filter) =>
          curWorkflow.name.toLowerCase().includes(filter)
        );
      } else {
        found = filters.map((filter) => {
          const newfilter = filter.toLowerCase();
          if (filter === undefined) {
            return false;
          }

          if (curWorkflow.name.toLowerCase().includes(filter.toLowerCase())) {
            return true;
          } else if (curWorkflow.tags.includes(filter)) {
            return true;
          } else if (curWorkflow.owner === filter) {
            return true;
          } else if (curWorkflow.org_id === filter) {
            return true;
          } else if (
            curWorkflow.actions !== null &&
            curWorkflow.actions !== undefined
          ) {
            for (var key in curWorkflow.actions) {
              const action = curWorkflow.actions[key];
              if (
                action.app_name.toLowerCase() === newfilter ||
                action.app_name.toLowerCase().includes(newfilter)
              ) {
                return true;
              }
            }
          }

          return false;
        });
      }

      if (found.every((v) => v === true)) {
        newWorkflows.push(curWorkflow);
        continue;
      }
    }

    if (newWorkflows.length !== workflows.length) {
      setFilteredWorkflows(newWorkflows);
    }
  };

  const addFilter = (data) => {
    if (data === null || data === undefined) {
      return;
    }

    if (data.includes("<") && data.includes(">")) {
      return;
    }

    if (filters.includes(data) || filters.includes(data.toLowerCase())) {
      return;
    }

    filters.push(data.toLowerCase());
    setFilters(filters);

    findWorkflow(filters);
  };

  const removeFilter = (index) => {
    var newfilters = filters;

    if (index < 0) {
      console.log("Can't handle index: ", index);
      return;
    }

    newfilters.splice(index, 1);

    if (newfilters.length === 0) {
      newfilters = [];
      setFilters(newfilters);
    } else {
      setFilters(newfilters);
    }

    findWorkflow(newfilters);
  };

  const exportVerifyModal = exportModalOpen ? (
    <Dialog
      open={exportModalOpen}
      onClose={() => {
        setExportModalOpen(false);
        setSelectedWorkflow({});
      }}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: 500,
          padding: 30,
        },
      }}
    >
      <DialogTitle style={{ marginBottom: 0 }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
          Want to auto-sanitize this workflow before exporting?
        </div>
      </DialogTitle>
      <DialogContent
        style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
      >
        <Typography variant="body1" style={{}}>
          This will make potentially sensitive fields such as username,
          password, url etc. empty
        </Typography>
        <Button
          variant="contained"
          style={{ marginTop: 20 }}
          onClick={() => {
            setExportModalOpen(false);
            exportWorkflow(exportData, true);
            setExportData("");
          }}
          color="primary"
        >
          Yes
        </Button>
        <Button
          style={{ marginTop: 20 }}
          onClick={() => {
            setExportModalOpen(false);
            exportWorkflow(exportData, false);
            setExportData("");
          }}
          color="primary"
        >
          No
        </Button>
      </DialogContent>
    </Dialog>
  ) : null;

  const publishModal = publishModalOpen ? (
    <Dialog
      open={publishModalOpen}
      onClose={() => {
        setPublishModalOpen(false);
        setSelectedWorkflow({});
      }}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: 500,
          padding: 50,
        },
      }}
    >
      <DialogTitle style={{ marginBottom: 0 }}>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
          Are you sure you want to PUBLISH this workflow?
        </div>
      </DialogTitle>
      <DialogContent
        style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
      >
        <div>
          <Typography variant="body1" style={{ marginBottom: 20 }}>
            Before publishing, we will sanitize all inputs, remove references to
            you, randomize ID's and remove your authentication.
          </Typography>
        </div>
        <Button
          variant="contained"
          style={{}}
          onClick={() => {
            publishWorkflow(selectedWorkflow);
            setPublishModalOpen(false);
          }}
          color="primary"
        >
          Yes
        </Button>
        <Button
          style={{}}
          onClick={() => {
            setPublishModalOpen(false);
          }}
          color="primary"
        >
          No
        </Button>
      </DialogContent>
    </Dialog>
  ) : null;

  const deleteModal = deleteModalOpen ? (
    <Dialog
      open={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setSelectedWorkflowId("");
      }}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: 500,
        },
      }}
    >
      <DialogTitle>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
          Are you sure you want to delete this workflow? <div />
          Other workflows relying on this one may stop working
        </div>
      </DialogTitle>
      <DialogContent
        style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}
      >
        <Button
          style={{}}
          onClick={() => {
            console.log("Editing: ", editingWorkflow);
            if (selectedWorkflowId) {
              deleteWorkflow(selectedWorkflowId);
              setTimeout(() => {
                getAvailableWorkflows();
              }, 1000);
            }
            setDeleteModalOpen(false);
          }}
          color="primary"
        >
          Yes
        </Button>
        <Button
          variant="outlined"
          style={{}}
          onClick={() => {
            setDeleteModalOpen(false);
          }}
          color="primary"
        >
          No
        </Button>
      </DialogContent>
    </Dialog>
  ) : null;

  const uploadFile = (e) => {
    const isDropzone =
      e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
    const files = isDropzone ? e.dataTransfer.files : e.target.files;

    const reader = new FileReader();
    toast("Starting upload. Please wait while we validate the workflows");

    try {
      reader.addEventListener("load", (e) => {
        var data = e.target.result;
        setIsDropzone(false);
        try {
          data = JSON.parse(reader.result);
        } catch (e) {
          toast("Invalid JSON: " + e);
          return;
        }

        // Initialize the workflow itself
        setNewWorkflow(
          data.name,
          data.description,
          data.tags,
          data.default_return_value,
          {},
          false
        )
          .then((response) => {
            if (response !== undefined) {
              // SET THE FULL THING
              data.id = response.id;

              // Actually create it
              setNewWorkflow(
                data.name,
                data.description,
                data.tags,
                data.default_return_value,
                data,
                false
              ).then((response) => {
                if (response !== undefined) {
                  toast(`Successfully imported ${data.name}`);
                }
              });
            }
          })
          .catch((error) => {
            toast("Import error: " + error.toString());
          });
      });
    } catch (e) {
      console.log("Error in dropzone: ", e);
    }

    reader.readAsText(files[0]);
  };

  useEffect(() => {
    if (isDropzone) {
      setIsDropzone(false);
    }
  }, [isDropzone]);

  const getAvailableWorkflows = () => {
    fetch(globalUrl + "/api/v1/workflows", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!: ", response.status);

          if (isCloud) {
            window.location.pathname = "/login";
          }

          toast("Failed getting workflows.");
          setWorkflowDone(true);

          return;
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson !== undefined) {
          setWorkflows(responseJson);

          if (responseJson !== undefined) {
            var actionnamelist = [];
            var parsedactionlist = [];
            for (var key in responseJson) {
              for (var actionkey in responseJson[key].actions) {
                const action = responseJson[key].actions[actionkey];
                //console.log("Action: ", action)
                if (actionnamelist.includes(action.app_name)) {
                  continue;
                }

                actionnamelist.push(action.app_name);
                parsedactionlist.push(action);
              }
            }

            //console.log(parsedactionlist)
            setActionImageList(parsedactionlist);
          }

          setFilteredWorkflows(responseJson);
          setWorkflowDone(true);
  
					// Ensures the zooming happens only once per load
        	setTimeout(() => {
						setFirstLoad(false)
						setVideoViewOpen(true)
					}, 100)
        } else {
          if (isLoggedIn) {
            toast("An error occurred while loading workflows");
          }

          return;
        }
      })
      .catch((error) => {
				setVideoViewOpen(true)

        toast(error.toString());
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (workflows.length <= 0) {
      const tmpView = localStorage.getItem("view");
      if (tmpView !== undefined && tmpView !== null) {
        setView(tmpView);
      }

      //setFirstrequest(false);
      getAvailableWorkflows();
    }
  }, [])

  const viewStyle = {
    color: "#ffffff",
    width: "100%",
    display: "flex",
    minWidth: 1024,
    maxWidth: 1024,
    margin: "auto",
  };

  const emptyWorkflowStyle = {
    paddingTop: "200px",
    width: 1024,
    margin: "auto",
  };

  const boxStyle = {
    padding: "20px 20px 20px 20px",
    width: "100%",
    height: "250px",
    color: "white",
    backgroundColor: surfaceColor,
    display: "flex",
    flexDirection: "column",
  };

  const paperAppContainer = {
    display: "flex",
    flexWrap: "wrap",
    alignContent: "space-between",
    marginTop: 5,
  };

  const paperAppStyle = {
    minHeight: 130,
    maxHeight: 130,
    overflow: "hidden",
    width: "100%",
    color: "white",
    backgroundColor: surfaceColor,
    padding: "12px 12px 0px 15px",
    borderRadius: 5,
    display: "flex",
    boxSizing: "border-box",
    position: "relative",
  };

  const gridContainer = {
    height: "auto",
    color: "white",
    margin: "10px",
    backgroundColor: surfaceColor,
  };

  const workflowActionStyle = {
    display: "flex",
    width: 160,
    height: 44,
    justifyContent: "space-between",
  };

  const exportAllWorkflows = () => {
    for (var key in workflows) {
      exportWorkflow(workflows[key], false);
    }
  };

  const deduplicateIds = (data) => {
    if (data.triggers !== null && data.triggers !== undefined) {
      for (var key in data.triggers) {
        const trigger = data.triggers[key];
        if (trigger.app_name === "Shuffle Workflow") {
          if (trigger.parameters.length > 2) {
            trigger.parameters[2].value = "";
          }
        }

        if (trigger.status === "running") {
          trigger.status = "stopped";
        }

        const newId = uuidv4();
        if (trigger.trigger_type === "WEBHOOK") {
          if (
            trigger.parameters !== undefined &&
            trigger.parameters !== null &&
            trigger.parameters.length === 2
          ) {
            trigger.parameters[0].value =
              referenceUrl + "webhook_" + trigger.id;
            trigger.parameters[1].value = "webhook_" + trigger.id;
          } else if (
            trigger.parameters !== undefined &&
            trigger.parameters !== null &&
            trigger.parameters.length === 3
          ) {
            trigger.parameters[0].value =
              referenceUrl + "webhook_" + trigger.id;
            trigger.parameters[1].value = "webhook_" + trigger.id;
            // FIXME: Add auth here?
          } else {
            toast("Something is wrong with the webhook in the copy");
          }
        }

        for (var branchkey in data.branches) {
          const branch = data.branches[branchkey];
          if (branch.source_id === trigger.id) {
            branch.source_id = newId;
          }

          if (branch.destination_id === trigger.id) {
            branch.destination_id = newId;
          }
        }

        trigger.environment = isCloud ? "cloud" : "Shuffle";
        trigger.id = newId;
      }
    }

    if (data.actions !== null && data.actions !== undefined) {
      for (key in data.actions) {
        data.actions[key].authentication_id = "";

        for (var subkey in data.actions[key].parameters) {
          const param = data.actions[key].parameters[subkey];
          if (
            param.name.includes("key") ||
            param.name.includes("user") ||
            param.name.includes("pass") ||
            param.name.includes("api") ||
            param.name.includes("auth") ||
            param.name.includes("secret") ||
            param.name.includes("domain") ||
            param.name.includes("url") ||
            param.name.includes("mail")
          ) {
            // FIXME: This may be a vuln if api-keys are generated that start with $
            if (param.value.startsWith("$")) {
              console.log("Skipping field, as it's referencing a variable");
            } else {
              param.value = "";
              param.is_valid = false;
            }
          }
        }

        const newId = uuidv4();
        for (branchkey in data.branches) {
          const branch = data.branches[branchkey];
          if (branch.source_id === data.actions[key].id) {
            branch.source_id = newId;
          }

          if (branch.destination_id === data.actions[key].id) {
            branch.destination_id = newId;
          }
        }

        if (data.actions[key].id === data.start) {
          data.start = newId;
        }

        data.actions[key].environment = "";
        data.actions[key].id = newId;
      }
    }

    if (
      data.workflow_variables !== null &&
      data.workflow_variables !== undefined
    ) {
      for (key in data.workflow_variables) {
        const param = data.workflow_variables[key];
        if (
          param.name.includes("key") ||
          param.name.includes("user") ||
          param.name.includes("pass") ||
          param.name.includes("api") ||
          param.name.includes("auth") ||
          param.name.includes("secret") ||
          param.name.includes("email")
        ) {
          param.value = "";
          param.is_valid = false;
        }
      }
    }

    return data;
  };

  const sanitizeWorkflow = (data) => {
    data = JSON.parse(JSON.stringify(data));
    data["owner"] = "";
    console.log("Sanitize start: ", data);
    data = deduplicateIds(data);

    data["org"] = [];
    data["org_id"] = "";
    data["execution_org"] = {};

    // These are backwards.. True = saved before. Very confuse.
    data["previously_saved"] = false;
    data["first_save"] = false;
    console.log("Sanitize end: ", data);

    return data;
  };

  const exportWorkflow = (data, sanitize) => {
    data = JSON.parse(JSON.stringify(data));
    let exportFileDefaultName = data.name + ".json";

    if (sanitize === true) {
      data = sanitizeWorkflow(data);

      if (data.subflows !== null && data.subflows !== undefined) {
        toast(
          "Not exporting with subflows when sanitizing. Please manually export them."
        );
        data.subflows = [];
      }

      //	for (var key in data.subflows) {
      //		if (data.sublof
      //	}
      //}
    }

    // Add correct ID's for triggers
    // Add mag

    let dataStr = JSON.stringify(data);
    let dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    let linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const publishWorkflow = (data) => {
    data = JSON.parse(JSON.stringify(data));
    data = sanitizeWorkflow(data);
    toast("Sanitizing and publishing " + data.name);

    // This ALWAYS talks to Shuffle cloud
    fetch(globalUrl + "/api/v1/workflows/" + data.id + "/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflow publish :O!");
        } else {
          if (isCloud) {
            toast("Successfully published workflow");
          } else {
            toast(
              "Successfully published workflow to https://shuffler.io"
            );
          }
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.reason !== undefined) {
          toast("Failed publishing: ", responseJson.reason);
        }

        getAvailableWorkflows();
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const copyWorkflow = (data) => {
    data = JSON.parse(JSON.stringify(data));
    toast("Copying workflow " + data.name);
    data.id = "";
    data.name = data.name + "_copy";
    data = deduplicateIds(data);

    fetch(globalUrl + "/api/v1/workflows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!");
          return;
        }
        return response.json();
      })
      .then(() => {
        setTimeout(() => {
          getAvailableWorkflows();
        }, 1000);
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const deleteWorkflow = (id) => {
    fetch(globalUrl + "/api/v1/workflows/" + id, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for setting workflows :O!");
          toast("Failed deleting workflow. Do you have access?");
        } else {
          toast("Deleted workflow " + id);
        }

        return response.json();
      })
      .then(() => {
        setTimeout(() => {
          getAvailableWorkflows();
        }, 1000);
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const handleChipClick = (e) => {
    addFilter(e.target.innerHTML);
  };

  const NewWorkflowPaper = () => {
    const [hover, setHover] = React.useState(false);

    const innerColor = "rgba(255,255,255,0.3)";
    const setupPaperStyle = {
      minHeight: paperAppStyle.minHeight,
      width: paperAppStyle.width,
      color: innerColor,
      padding: paperAppStyle.padding,
      borderRadius: paperAppStyle.borderRadius,
      display: "flex",
      boxSizing: "border-box",
      position: "relative",
      border: `2px solid ${innerColor}`,
      cursor: "pointer",
      backgroundColor: hover ? "rgba(39,41,45,0.5)" : "rgba(39,41,45,1)",
    };

    return (
      <Grid item xs={4} style={{ padding: "12px 10px 12px 10px" }}>
        <Paper
          square
          style={setupPaperStyle}
          onClick={() => setModalOpen(true)}
          onMouseOver={() => {
            setHover(true);
          }}
          onMouseOut={() => {
            setHover(false);
          }}
        >
          <Tooltip title={`New Workflow`} placement="bottom">
            <span style={{ textAlign: "center", width: 300, margin: "auto" }}>
              <AddCircleIcon style={{ height: 65, width: 65 }} />
            </span>
          </Tooltip>
        </Paper>
      </Grid>
    );
  };

  const WorkflowPaper = (props) => {
    const { data } = props;
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    var boxColor = "#FECC00";
    if (data.is_valid) {
      boxColor = "#86c142";
    }

    if (!data.previously_saved) {
      boxColor = "#f85a3e";
    }

    const menuClick = (event) => {
      setOpen(!open);
      setAnchorEl(event.currentTarget);
    };

    var parsedName = data.name;
    if (
      parsedName !== undefined &&
      parsedName !== null &&
      parsedName.length > 20
    ) {
      parsedName = parsedName.slice(0, 21) + "..";
    }

    const actions = data.actions !== null ? data.actions.length : 0;
    const [triggers, subflows] = getWorkflowMeta(data);

    const workflowMenuButtons = (
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={() => {
          setOpen(false);
          setAnchorEl(null);
        }}
      >
        <MenuItem
          style={{ backgroundColor: inputColor, color: "white" }}
          onClick={() => {
            setModalOpen(true);
            setEditingWorkflow(JSON.parse(JSON.stringify(data)));
            setNewWorkflowName(data.name);
            setNewWorkflowDescription(data.description);
            setDefaultReturnValue(data.default_return_value);
            if (data.tags !== undefined && data.tags !== null) {
              setNewWorkflowTags(JSON.parse(JSON.stringify(data.tags)));
            }
          }}
          key={"change"}
        >
          <EditIcon style={{ marginLeft: 0, marginRight: 8 }} />
          {"Change details"}
        </MenuItem>
        <MenuItem
          style={{ backgroundColor: inputColor, color: "white" }}
          onClick={() => {
            setSelectedWorkflow(data);
            setPublishModalOpen(true);
          }}
          key={"publish"}
        >
          <CloudUploadIcon style={{ marginLeft: 0, marginRight: 8 }} />
          {"Publish Workflow"}
        </MenuItem>
        <MenuItem
          style={{ backgroundColor: inputColor, color: "white" }}
          onClick={() => {
            copyWorkflow(data);
            setOpen(false);
          }}
          key={"duplicate"}
        >
          <FileCopyIcon style={{ marginLeft: 0, marginRight: 8 }} />
          {"Duplicate Workflow"}
        </MenuItem>
        <MenuItem
          style={{ backgroundColor: inputColor, color: "white" }}
          onClick={() => {
            setExportModalOpen(true);

            if (data.triggers !== null && data.triggers !== undefined) {
              var newSubflows = [];
              for (var key in data.triggers) {
                const trigger = data.triggers[key];

                if (
                  trigger.parameters !== null &&
                  trigger.parameters !== undefined
                ) {
                  for (var subkey in trigger.parameters) {
                    const param = trigger.parameters[subkey];
                    if (
                      param.name === "workflow" &&
                      param.value !== data.id &&
                      !newSubflows.includes(param.value)
                    ) {
                      newSubflows.push(param.value);
                    }
                  }
                }
              }

              var parsedworkflows = [];
              for (var key in newSubflows) {
                const foundWorkflow = workflows.find(
                  (workflow) => workflow.id === newSubflows[key]
                );
                if (foundWorkflow !== undefined && foundWorkflow !== null) {
                  parsedworkflows.push(foundWorkflow);
                }
              }

              if (parsedworkflows.length > 0) {
                console.log(
                  "Appending subflows during export: ",
                  parsedworkflows.length
                );
                data.subflows = parsedworkflows;
              }
            }

            setExportData(data);
            setOpen(false);
          }}
          key={"export"}
        >
          <GetAppIcon style={{ marginLeft: 0, marginRight: 8 }} />
          {"Export Workflow"}
        </MenuItem>
        <MenuItem
          style={{ backgroundColor: inputColor, color: "white" }}
          onClick={() => {
            setDeleteModalOpen(true);
            setSelectedWorkflowId(data.id);
            setOpen(false);
          }}
          key={"delete"}
        >
          <DeleteIcon style={{ marginLeft: 0, marginRight: 8 }} />
          {"Delete Workflow"}
        </MenuItem>
      </Menu>
    );

    var image = "";
    var orgName = "";
    var orgId = "";
    if (userdata.orgs !== undefined) {
      const foundOrg = userdata.orgs.find((org) => org.id === data["org_id"]);
      if (foundOrg !== undefined && foundOrg !== null) {
        //position: "absolute", bottom: 5, right: -5,
        const imageStyle = {
          width: imagesize,
          height: imagesize,
          pointerEvents: "none",
          marginLeft:
            data.creator_org !== undefined && data.creator_org.length > 0
              ? 20
              : 0,
          borderRadius: 10,
          border:
            foundOrg.id === userdata.active_org.id
              ? `3px solid ${boxColor}`
              : null,
          cursor: "pointer",
          marginRight: 10,
        };

        image =
          foundOrg.image === "" ? (
            <img
              alt={foundOrg.name}
              src={theme.palette.defaultImage}
              style={imageStyle}
            />
          ) : (
            <img
              alt={foundOrg.name}
              src={foundOrg.image}
              style={imageStyle}
              onClick={() => {}}
            />
          );

        orgName = foundOrg.name;
        orgId = foundOrg.id;
      }
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
              <Tooltip title={`Org "${orgName}"`} placement="bottom">
                <div
                  styl={{ cursor: "pointer" }}
                  onClick={() => {
                    addFilter(orgId);
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
                  <Link
                    to={"/workflows/" + data.id}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {parsedName}
                  </Link>
                </Typography>
              </Tooltip>
            </Grid>
            <Grid item style={workflowActionStyle}>
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
                    {actions}
                  </Typography>
                </span>
              </Tooltip>
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
                    {triggers}
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
                    if (subflows === 0) {
                      toast("No subflows for " + data.name);
                      return;
                    }

                    var newWorkflows = [data];
                    for (var key in data.triggers) {
                      const trigger = data.triggers[key];
                      if (trigger.app_name !== "Shuffle Workflow") {
                        continue;
                      }

                      if (
                        trigger.parameters !== undefined &&
                        trigger.parameters !== null &&
                        trigger.parameters.length > 0 &&
                        trigger.parameters[0].name === "workflow"
                      ) {
                        const newWorkflow = workflows.find(
                          (item) => item.id === trigger.parameters[0].value
                        );
                        if (newWorkflow !== null && newWorkflow !== undefined) {
                          newWorkflows.push(newWorkflow);
                          continue;
                        }
                      }
                    }

                    setFilters(["Subflows of " + data.name]);
                    setFilteredWorkflows(newWorkflows);
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
                    {subflows}
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
              {data.tags !== undefined
                ? data.tags.map((tag, index) => {
                    if (index >= 3) {
                      return null;
                    }

                    return (
                      <Chip
                        key={index}
                        style={chipStyle}
                        label={tag}
                        onClick={handleChipClick}
                        variant="outlined"
                        color="primary"
                      />
                    );
                  })
                : null}
            </Grid>
          {data.actions !== undefined && data.actions !== null ? (
						<div style={{position: "absolute", top: 10, right: 10, }}>
							<IconButton
								aria-label="more"
								aria-controls="long-menu"
								aria-haspopup="true"
								onClick={menuClick}
								style={{ padding: "0px", color: "#979797" }}
							>
								<MoreVertIcon />
							</IconButton>
							{workflowMenuButtons}
						</div>
          ) : null}
				</Grid>
			</Paper>
		</div>
  )
  }

  // Can create and set workflows
  const setNewWorkflow = (
    name,
    description,
    tags,
    defaultReturnValue,
    editingWorkflow,
    redirect
  ) => {
    var method = "POST";
    var extraData = "";
    var workflowdata = {};

    if (editingWorkflow.id !== undefined) {
      console.log("Building original workflow");
      method = "PUT";
      extraData = "/" + editingWorkflow.id + "?skip_save=true";
      workflowdata = editingWorkflow;

      console.log("REMOVING OWNER");
      workflowdata["owner"] = "";
      // FIXME: Loop triggers and turn them off?
    }

    workflowdata["name"] = name;
    workflowdata["description"] = description;
    if (tags !== undefined) {
      workflowdata["tags"] = tags;
    }

    if (defaultReturnValue !== undefined) {
      workflowdata["default_return_value"] = defaultReturnValue;
    }

    return fetch(globalUrl + "/api/v1/workflows" + extraData, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(workflowdata),
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!");
          return;
        }
        setSubmitLoading(false);

        return response.json();
      })
      .then((responseJson) => {
				if (responseJson.success === false) {
					if (responseJson.reason !== undefined) {
						toast("Error setting workflow: ", responseJson.reason)
					} else {
						toast("Error setting workflow.")
					}

					return
				}

        if (method === "POST" && redirect) {
          window.location.pathname = "/workflows/" + responseJson["id"];
          setModalOpen(false);
        } else if (!redirect) {
          // Update :)
          setTimeout(() => {
            getAvailableWorkflows();
          }, 1000);
          setImportLoading(false);
          setModalOpen(false);
        } else {
          toast("Successfully changed basic info for workflow");
          setModalOpen(false);
        }

        return responseJson;
      })
      .catch((error) => {
        toast(error.toString());
        setImportLoading(false);
        setModalOpen(false);
        setSubmitLoading(false);
      });
  };

  const importFiles = (event) => {
    console.log("Importing!");

    setImportLoading(true);
    if (event.target.files.length > 0) {
      for (var key in event.target.files) {
        const file = event.target.files[key];
        if (file.type !== "application/json") {
          if (file.type !== undefined) {
            toast("File has to contain valid json");
    				setImportLoading(false);
          }

          continue;
        }

        const reader = new FileReader();
        // Waits for the read
        reader.addEventListener("load", (event) => {
          var data = reader.result;
          try {
            data = JSON.parse(reader.result);
          } catch (e) {
            toast("Invalid JSON: " + e);
            setImportLoading(false);
            return;
          }

          // Initialize the workflow itself
          setNewWorkflow(
            data.name,
            data.description,
            data.tags,
            data.default_return_value,
            {},
            false
          )
            .then((response) => {
              if (response !== undefined) {
                // SET THE FULL THING
                data.id = response.id;
                data.first_save = false;
                data.previously_saved = false;
                data.is_valid = false;

                // Actually create it
                setNewWorkflow(
                  data.name,
                  data.description,
                  data.tags,
                  data.default_return_value,
                  data,
                  false
                ).then((response) => {
                  if (response !== undefined) {
                    toast("Successfully imported " + data.name);
                  }
                });
              }
            })
            .catch((error) => {
              toast("Import error: " + error.toString());
            });
        });

        // Actually reads
        reader.readAsText(file);
      }
    }

    setLoadWorkflowsModalOpen(false);
  };

  const getWorkflowMeta = (data) => {
    let triggers = 0;
    let subflows = 0;
    if (
      data.triggers !== undefined &&
      data.triggers !== null &&
      data.triggers.length > 0
    ) {
      triggers = data.triggers.length;
      for (let key in data.triggers) {
        if (data.triggers[key].app_name === "Shuffle Workflow") {
          subflows += 1;
        }
      }
    }

    return [triggers, subflows];
  };

  const WorkflowListView = () => {
    let workflowData = "";
    if (workflows.length > 0) {
      const columns = [
        {
          field: "image",
          headerName: "Logo",
          width: 50,
          sortable: false,
          renderCell: (params) => {
            const data = params.row.record;

            var boxColor = "#FECC00";
            if (data.is_valid) {
              boxColor = "#86c142";
            }

            if (!data.previously_saved) {
              boxColor = "#f85a3e";
            }

            var image = "";
            if (userdata.orgs !== undefined) {
              const foundOrg = userdata.orgs.find(
                (org) => org.id === data["org_id"]
              );
              if (foundOrg !== undefined && foundOrg !== null) {
                //position: "absolute", bottom: 5, right: -5,
                const imageStyle = {
                  width: imagesize + 7,
                  height: imagesize + 7,
                  pointerEvents: "none",
                  marginLeft:
                    data.creator_org !== undefined &&
                    data.creator_org.length > 0
                      ? 20
                      : 0,
                  borderRadius: 10,
                  border:
                    foundOrg.id === userdata.active_org.id
                      ? `3px solid ${boxColor}`
                      : null,
                  cursor: "pointer",
                  marginTop: 5,
                };

                //<Tooltip title={`Org: ${foundOrg.name}`} placement="bottom">
                image =
                  foundOrg.image === "" ? (
                    <img
                      alt={foundOrg.name}
                      src={theme.palette.defaultImage}
                      style={imageStyle}
                    />
                  ) : (
                    <img
                      alt={foundOrg.name}
                      src={foundOrg.image}
                      style={imageStyle}
                      onClick={() => {
                        //setFilteredWorkflows(newWorkflows)
                      }}
                    />
                  );
              }
            }

            return <div styl={{ cursor: "pointer" }}>{image}</div>;
          },
        },
        {
          field: "title",
          headerName: "Title",
          width: 330,
          renderCell: (params) => {
            const data = params.row.record;

            return (
              <Grid item>
                <Link
                  to={"/workflows/" + data.id}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography>{data.name}</Typography>
                </Link>
              </Grid>
            );
          },
        },

        {
          field: "options",
          headerName: "Options",
          width: 200,
          sortable: false,
          disableClickEventBubbling: true,
          renderCell: (params) => {
            const data = params.row.record;
            const actions = data.actions !== null ? data.actions.length : 0;
            let [triggers, subflows] = getWorkflowMeta(data);

            return (
              <Grid item>
                <div style={{ display: "flex" }}>
                  <Tooltip
                    color="primary"
                    title="Action amount"
                    placement="bottom"
                  >
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
                        {actions}
                      </Typography>
                    </span>
                  </Tooltip>
                  <Tooltip
                    color="primary"
                    title="Trigger amount"
                    placement="bottom"
                  >
                    <span
                      style={{
                        marginLeft: 15,
                        color: "#979797",
                        display: "flex",
                      }}
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
                        {triggers}
                      </Typography>
                    </span>
                  </Tooltip>
                  <Tooltip
                    color="primary"
                    title="Subflows used"
                    placement="bottom"
                  >
                    <span
                      style={{
                        marginLeft: 15,
                        display: "flex",
                        color: "#979797",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (subflows === 0) {
                          toast("No subflows for " + data.name);
                          return;
                        }

                        var newWorkflows = [data];
                        for (var key in data.triggers) {
                          const trigger = data.triggers[key];
                          if (trigger.app_name !== "Shuffle Workflow") {
                            continue;
                          }

                          if (
                            trigger.parameters !== undefined &&
                            trigger.parameters !== null &&
                            trigger.parameters.length > 0 &&
                            trigger.parameters[0].name === "workflow"
                          ) {
                            const newWorkflow = workflows.find(
                              (item) => item.id === trigger.parameters[0].value
                            );
                            if (
                              newWorkflow !== null &&
                              newWorkflow !== undefined
                            ) {
                              newWorkflows.push(newWorkflow);
                              continue;
                            }
                          }
                        }

                        setFilters(["Subflows of " + data.name]);
                        setFilteredWorkflows(newWorkflows);
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
                        {subflows}
                      </Typography>
                    </span>
                  </Tooltip>
                </div>
              </Grid>
            );
          },
        },
        {
          field: "tags",
          headerName: "Tags",
          maxHeight: 15,
          width: 300,
          sortable: false,
          disableClickEventBubbling: true,
          renderCell: (params) => {
            const data = params.row.record;
            return (
              <Grid item>
                {data.tags !== undefined
                  ? data.tags.map((tag, index) => {
                      if (index >= 3) {
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
            );
          },
        },
        {
          field: "",
          headerName: "",
          maxHeight: 15,
          width: 100,
          sortable: false,
          disableClickEventBubbling: true,
          renderCell: (params) => {},
        },
      ];
      let rows = [];
      rows = filteredWorkflows.map((data, index) => {
        let obj = {
          id: index + 1,
          title: data.name,
          record: data,
        };

        return obj;
      })

      workflowData = (
        <DataGrid
          color="primary"
          className={classes.datagrid}
          rows={rows}
          columns={columns}
          pageSize={20}
          checkboxSelection
          autoHeight
          density="standard"
          components={{
            Toolbar: GridToolbar,
          }}
        />
      );
    }
    return <div style={gridContainer}>{workflowData}</div>;
  };

  const modalView = modalOpen ? (
    <Dialog
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: "800px",
        },
      }}
    >
      <DialogTitle>
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          {editingWorkflow.id !== undefined ? "Editing" : "New"} workflow
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
        </div>
      </DialogTitle>
      <FormControl>
        <DialogContent>
          <TextField
            onBlur={(event) => setNewWorkflowName(event.target.value)}
            InputProps={{
              style: {
                color: "white",
              },
            }}
            color="primary"
            placeholder="Name"
            margin="dense"
            defaultValue={newWorkflowName}
            autoFocus
            fullWidth
          />
          <TextField
            onBlur={(event) => setNewWorkflowDescription(event.target.value)}
            InputProps={{
              style: {
                color: "white",
              },
            }}
            color="primary"
            defaultValue={newWorkflowDescription}
            placeholder="Description"
            rows="3"
            multiline
            margin="dense"
            fullWidth
          />
          <MuiChipsInput
            style={{ marginTop: 10 }}
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

          <TextField
            onBlur={(event) => setDefaultReturnValue(event.target.value)}
            InputProps={{
              style: {
                color: "white",
              },
            }}
            color="primary"
            defaultValue={defaultReturnValue}
            placeholder="Default return value (used for Subflows if the subflow fails)"
            rows="3"
            multiline
            margin="dense"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button
            style={{}}
            onClick={() => {
              setNewWorkflowName("");
              setNewWorkflowDescription("");
              setDefaultReturnValue("");
              setEditingWorkflow({});
              setNewWorkflowTags([]);
              setModalOpen(false);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{}}
            disabled={newWorkflowName.length === 0}
            onClick={() => {
              console.log("Tags: ", newWorkflowTags);
              if (editingWorkflow.id !== undefined) {
                setNewWorkflow(
                  newWorkflowName,
                  newWorkflowDescription,
                  newWorkflowTags,
                  defaultReturnValue,
                  editingWorkflow,
                  false
                );
                setNewWorkflowName("");
                setDefaultReturnValue("");
                setNewWorkflowDescription("");
                setEditingWorkflow({});
                setNewWorkflowTags([]);
              } else {
                setNewWorkflow(
                  newWorkflowName,
                  newWorkflowDescription,
                  newWorkflowTags,
                  defaultReturnValue,
                  {},
                  true
                );
              }

              setSubmitLoading(true);
            }}
            color="primary"
          >
            {submitLoading ? <CircularProgress color="secondary" /> : "Submit"}
          </Button>
        </DialogActions>
      </FormControl>
    </Dialog>
  ) : null;

  const viewSize = {
    workflowView: 4,
    executionsView: 3,
    executionResults: 4,
  };


  if (viewSize.workflowView === 0) {
    workflowViewStyle.display = "none";
  }

  const workflowButtons = (
    <span>
      {view === "list" && (
        <Tooltip color="primary" title={"Grid View"} placement="top">
          <Button
            color="primary"
            variant="text"
            onClick={() => {
              localStorage.setItem("view", "grid");
              setView("grid");
            }}
          >
            <GridOnIcon />
          </Button>
        </Tooltip>
      )}
      {view === "grid" && (
        <Tooltip color="primary" title={"List View"} placement="top">
          <Button
            color="primary"
            variant="text"
            onClick={() => {
              localStorage.setItem("view", "list");
              setView("list");
            }}
          >
            <ListIcon />
          </Button>
        </Tooltip>
      )}
      <Tooltip color="primary" title={"Import workflows"} placement="top">
        {importLoading ? (
          <Button color="primary" style={{}} variant="text" onClick={() => {}}>
            <CircularProgress style={{ maxHeight: 15, maxWidth: 15 }} />
          </Button>
        ) : (
          <Button
            color="primary"
            style={{}}
            variant="text"
            onClick={() => upload.click()}
          >
            <PublishIcon />
          </Button>
        )}
      </Tooltip>
      <input
        hidden
        type="file"
        multiple="multiple"
        ref={(ref) => (upload = ref)}
        onChange={importFiles}
      />
      {workflows.length > 0 ? (
        <Tooltip
          color="primary"
          title={`Download ALL workflows (${workflows.length})`}
          placement="top"
        >
          <Button
            color="primary"
            style={{}}
            variant="text"
            onClick={() => {
              exportAllWorkflows();
            }}
          >
            <GetAppIcon />
          </Button>
        </Tooltip>
      ) : null}
      {isCloud ? null : (
        <Tooltip color="primary" title={"Download workflows"} placement="top">
          <Button
            color="primary"
            style={{}}
            variant="text"
            onClick={() => setLoadWorkflowsModalOpen(true)}
          >
            <CloudDownloadIcon />
          </Button>
        </Tooltip>
      )}
    </span>
  );


	const workflowViewStyle = {
		flex: viewSize.workflowView,
		margin: "auto",
		marginTop: 25,
		textAlign: "center",
		maxWidth: 600,
	};


  const WorkflowView = () => {
		var workflowDelay = -150
		var appDelay = -75	

		const textSpacingDiff = 8
		const textType = "body2"
						
		// Discover <a target="_blank" href="https://shuffler.io/search?tab=workflows" style={{textDecoration: "none", color: "#f86a3e",}}>use-cases made by us and other creators</a>!
		const steps = [
			{
				html: (
					<Typography variant={textType} style={{marginTop: textSpacingDiff, textAlign: "left",}} onClick={() => {
						if (isCloud) {
							ReactGA.event({
								category: "getting-started",
								action: `integerations_find_click`,
							})
						}
					}}>
						<Link to="/welcome?tab=2" style={{textDecoration: "none", color: "#f86a3e",}}>Find relevant apps</Link> and start your automation journey
					</Typography>
				), 
				tutorial: "find_integrations",
			},
			{
				html: 
					<Typography variant={textType} style={{marginTop: textSpacingDiff, textAlign: "left",}}>
							Discover <Link to="/welcome?tab=3" style={{cursor: "pointer", textDecoration: "none", color: "#f86a3e",}}>Use-Case ideas</Link> and&nbsp;
							<span style={{cursor: "pointer", textDecoration: "none", color: "#f86a3e",}} onClick={() => {
    
  						if (isCloud) {
								navigate(`/search?tab=workflows`)

								ReactGA.event({
									category: "getting-started",
									action: `workflow_find_click`,
								})
								return
							} else {
								toast("TBD: Coming in version 1.0.0");
							}

							const ele = document.getElementById("shuffle_search_field")
							if (ele !== undefined && ele !== null) {
								console.log("Found ele: ", ele)
								ele.focus()
								ele.style.borderColor = "#f86a3e"
								ele.style.borderWidth = "2px"

							} else {
								//toast("TBD: Coming in version 1.0.0");
							}
						}}>
						workflows made by other creators</span>!
					</Typography>,
				tutorial: "discover_workflows",
			},
			{
				html: (
					<Typography variant={textType} style={{marginTop: textSpacingDiff, textAlign: "left",}} onClick={() => {
						if (isCloud) {
							ReactGA.event({
								category: "getting-started",
								action: `create_workflow_click`,
							})
						}
					}}>
						Learn to use Shuffle by&nbsp; 
						<span style={{cursor: "pointer", color: "#f86a3e",}} onClick={() => {setModalOpen(true)}}>
							creating your first workflow 
						</span> and <Link to="/docs/getting_started" style={{textDecoration: "none", color: "#f86a3e",}}>reading the docs.</Link>
					</Typography>
				),
				tutorial: "learn_shuffle",
			},
			{
				html: 
					<Typography variant={textType} style={{marginTop: textSpacingDiff, textAlign: "left",}}>
						Configure your organization name <Link to="/admin" style={{textDecoration: "none", color: "#f86a3e",}}>in the admin panel</Link> and <Link to="/admin?tab=users" style={{textDecoration: "none", color: "#f86a3e",}}>invite your team</Link>
					</Typography>,
				tutorial: "configure_organization",
			}
		]
	
    return (
      <div style={viewStyle}>
				<Dialog
					open={videoViewOpen}
					onClose={() => {
						setVideoViewOpen(false)
					}}
					PaperProps={{
						style: {
							backgroundColor: surfaceColor,
							color: "white",
							minWidth: 560,
							minHeight: 415,
							textAlign: "center",
						},
					}}
				>
					<DialogTitle>
						Welcome to Shuffle!	
					</DialogTitle>

					<Tooltip
						title="Close window"
						placement="top"
						style={{ zIndex: 10011 }}
					>
						<IconButton
							style={{ zIndex: 5000, position: "absolute", top: 10, right: 34 }}
							onClick={(e) => {
								e.preventDefault();
								setVideoViewOpen(false)
							}}
						>
							<CloseIcon style={{ color: "white" }} />
						</IconButton>
					</Tooltip>

					<iframe 
						width="560"
						height="315" 
						style={{margin: "0px auto 0px auto", width: 560, height: 315,}}
						src="https://www.youtube-nocookie.com/embed/rO7k9q3OgC0" 
						title="Introduction video" 
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
						allowfullscreen
					>
					</iframe>
				</Dialog>
        <div style={workflowViewStyle}>
					<Typography variant="h1" style={{fontSize: 30, marginTop: 25, }}>
						Getting Started with Shuffle
					</Typography>
					<Typography variant="body2" color="textSecondary" style={{marginTop: 25}}>
						We provide everything you need to automate your operations - apps, default workflows, security dashboards and analytics that work well together.
					</Typography>
					<Paper style={{backgroundColor: theme.palette.surfaceColor, border: "1px solid rgba(255,255,255,0.3)", padding: 40, marginTop: 25, }}>
						{steps.map((data, index) => {
							var tutorialFound = false
							if (userdata.tutorials !== undefined && userdata.tutorials !== null && userdata.tutorials.length > 0 && data.tutorial !== undefined) {
								const foundTutorial = userdata.tutorials.find(tutorial => tutorial === data.tutorial)
								if (foundTutorial !== undefined && foundTutorial !== null) {
									console.log("Found tutorial for ", data.tutorial)
									tutorialFound = true 
								}

								if (tutorialFound === false) {
									if (data.tutorial === "discover_workflows") {
										if (workflows.length > 0) {
											for (var key in workflows) {
												const tmpworkflow = workflows[key]
												if (tmpworkflow.published_id !== undefined && tmpworkflow.published_id !== null &&  tmpworkflow.published_id.length > 0) {
													tutorialFound = true
													break
												}
											}
										}
									}

									if (data.tutorial === "learn_shuffle") {
										//tutorial: "discover_workflows",
										if (workflows.length > 0) {
											tutorialFound = true
										}
									}

									if (data.tutorial === "configure_organization") {
										if (userdata.active_org.name !== userdata.username) {
											tutorialFound = true
										}
									}
								}
							}
								
							return (
								<div key={index} style={{display: "flex", marginBottom: index === steps.length-1 ? 0 : 20, }}>
									<div style={{maxWidth: 50, marginRight: 25, }}>
										<Typography variant="h6">
											{tutorialFound ? 
												<CheckIcon style={{color: "green", paddingTop: 5,}} />
												:
												<b>{index+1}</b>
											}
										</Typography>
									</div>
									<div style={{}}>
										{data.html}
									</div>
								</div>
							)
						})}
					</Paper>
					<div style={{textAlign: "left", display: "flex", marginTop: 25, width: "100%",}}>
						<div style={{flex: 1, padding: 10, marginRight: 10,}}>
							<Typography>
								<b>Invite your team</b>
							</Typography>
							<Typography color="textSecondary" variant="body2" style={{marginTop: 5,}} >
								Get teammates, managers and customers involved.
							</Typography>
							<Link to="/admin?tab=users" style={{textDecoration: "none",}}>
								<Button
									variant="outlined"
									style={{marginTop: 10}}
									onClick={() => {
									}}
								>
									Invite Users
								</Button>
							</Link>
						</div>
						<div style={{flex: 1, padding: 10, }}>
							<Typography>
								<b>Need help?</b>
							</Typography>
							<Typography color="textSecondary" variant="body2" style={{marginTop: 5,}} >
								We help with automation, scaling, training and more. Get involved!
							</Typography>
							<a href="https://discord.gg/B2CBzUm" style={{textDecoration: "none",}}>
								<Button
									variant="outlined"
									style={{marginTop: 10}}
									onClick={() => {
									}}
								>
									Join Discord community
								</Button>
							</a>
						</div>
						{/*
						<div style={{position: "fixed", bottom: 110, right: 110, display: "flex", }}>
							<Typography variant="body1" color="textSecondary" style={{marginRight: 0, maxWidth: 150, }}>
								Need assistance? Ask our support team (it's free!).
							</Typography>
							<img src="/images/Arrow.png" style={{width: 150}} />
						</div>
						*/}
					</div>
          {/*
					<div style={flexContainerStyle}>
						<div style={{...flexBoxStyle, ...activeWorkflowStyle}}>
							<div style={flexContentStyle}>
								<div><img src={mobileImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>ACTIVE WORKFLOWS</div>
								</div>
							</div>
						</div>
						<div style={{...flexBoxStyle, ...availableWorkflowStyle}}>
							<div style={flexContentStyle}>
								<div><img src={bookImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>AVAILABE WORKFLOWS</div>
								</div>
							</div>
						</div>
						<div style={{...flexBoxStyle, ...notificationStyle}}>
							<div style={flexContentStyle}>
								<div><img src={bagImage} style={iconStyle} /></div>
								<div style={ blockRightStyle }>
									<div style={counterStyle}>{workflows.length}</div>
									<div style={fontSize_16}>NOTIFICATIONS</div>
								</div>
							</div>
						</div>
					</div>
					*/}

          {/*
					chipRenderer={({ value, isFocused, isDisabled, handleClick, handleRequestDelete }, key) => {
						console.log("VALUE: ", value)

						return (
							<Chip
								key={key}
								style={chipStyle}

							>
								{value}
							</Chip>
						)
					}}
					*/}
					{/*
          <div style={{ display: "flex", margin: "0px 0px 20px 0px" }}>
            <div style={{ flex: 1 }}>
              <Typography style={{ marginTop: 7, marginBottom: "auto" }}>
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="https://shuffler.io/docs/workflows"
                  style={{ textDecoration: "none", color: "#f85a3e" }}
                >
                  Learn more about Workflows
                </a>
              </Typography>
            </div>
            <div style={{ flex: 1, float: "right" }}>
              <MuiChipsInput
                style={{}}
                InputProps={{
                  style: {
                    color: "white",
                  },
                }}
                placeholder="Add Filter"
                color="primary"
                fullWidth
                value={filters}
                onAdd={(chip) => {
                  addFilter(chip);
                }}
                onDelete={(_, index) => {
                  removeFilter(index);
                }}
              />
            </div>
            <div style={{ float: "right", flex: 1, textAlign: "right" }}>
              {workflowButtons}
            </div>
          </div>
          <div style={{ marginTop: 15 }} />
          {actionImageList !== undefined &&
          actionImageList !== null &&
          actionImageList.length > 0 ? (
            <div
              style={{
                display: "flex",
                maxWidth: 1024,
                zIndex: 11,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: theme.palette?.borderRadius,
                textAlign: "center",
                overflow: "auto",
              }}
            >
              {actionImageList.map((data, index) => {
                if (
                  data.large_image === undefined ||
                  data.large_image === null ||
                  data.large_image.length === 0
                ) {
                  return null;
                }

                if (data.app_name.toLowerCase() === "shuffle tools") {
                  data.large_image = theme.palette.defaultImage;
                }

								if (firstLoad) {
									appDelay += 75
								} else {
									appDelay = 0
								}

                return (
									<Zoom key={index} in={true} style={{ transitionDelay: `${appDelay}ms` }}>
                  <span key={index} style={{ zIndex: 10 }}>
                    <IconButton
                      style={{
                        backgroundColor: "transparent",
                        margin: 0,
                        padding: 12,
                      }}
                      onClick={() => {
                        console.log("FILTER: ", data);
                        addFilter(data.app_name);
                      }}
                    >
                      <Tooltip
                        title={`Filter by ${data.app_name}`}
                        placement="top"
                      >
                        <Badge
                          badgeContent={0}
                          color="secondary"
                          style={{ fontSize: 10 }}
                        >
                          <div
                            style={{
                              height: imgSize,
                              width: imgSize,
                              position: "relative",
                              filter: "brightness(0.6)",
                              backgroundColor: "#000",
                              borderRadius: imgSize / 2,
                              zIndex: 100,
                              overflow: "hidden",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              style={{
                                height: imgSize,
                                width: imgSize,
                                position: "absolute",
                                top: -2,
                                left: -2,
                                cursor: "pointer",
                                zIndex: 99,
                                border: "2px solid rgba(255,255,255,0.7)",
                              }}
                              alt={data.app_name}
                              src={data.large_image}
                            />
                          </div>
                        </Badge>
                      </Tooltip>
                    </IconButton>
                  </span>
									</Zoom>
                );
              })}
            </div>
          ) : null}
          {view === "grid" ? (
            <Grid container spacing={4} style={paperAppContainer}>
							<Zoom in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
              	<NewWorkflowPaper />
							</Zoom>
              {filteredWorkflows.map((data, index) => {
  							if (firstLoad) {
									workflowDelay += 75
								} else {
									workflowDelay = 0
								}

                return (
									<Zoom key={index} in={true} style={{ transitionDelay: `${workflowDelay}ms` }}>
      							<Grid item xs={4} style={{ padding: "12px 10px 12px 10px" }}>
											<WorkflowPaper key={index} data={data} />
      							</Grid>
									</Zoom>
								)
              })}
            </Grid>
          ) : (
            <WorkflowListView />
          )}

          <div style={{ marginBottom: 100 }} />
					*/}
        </div>
      </div>
    );
  };

  const importWorkflowsFromUrl = (url) => {
    console.log("IMPORT WORKFLOWS FROM ", downloadUrl);

    const parsedData = {
      url: url,
      field_3: downloadBranch || "master",
    };

    if (field1.length > 0) {
      parsedData["field_1"] = field1;
    }

    if (field2.length > 0) {
      parsedData["field_2"] = field2;
    }

    toast("Getting specific workflows from your URL.");
    fetch(globalUrl + "/api/v1/workflows/download_remote", {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify(parsedData),
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          toast("Successfully loaded workflows from " + downloadUrl);
          setTimeout(() => {
            getAvailableWorkflows();
          }, 1000);
        }

        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.success) {
          if (responseJson.reason !== undefined) {
            toast("Failed loading: " + responseJson.reason);
          } else {
            toast("Failed loading");
          }
        }
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const handleGithubValidation = () => {
    importWorkflowsFromUrl(downloadUrl);
    setLoadWorkflowsModalOpen(false);
  };

  const workflowDownloadModalOpen = loadWorkflowsModalOpen ? (
    <Dialog
      open={loadWorkflowsModalOpen}
      onClose={() => {}}
      PaperProps={{
        style: {
          backgroundColor: surfaceColor,
          color: "white",
          minWidth: "800px",
          minHeight: "320px",
        },
      }}
    >
      <DialogTitle>
        <div style={{ color: "rgba(255,255,255,0.9)" }}>
          Load workflows from github repo
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
        </div>
      </DialogTitle>
      <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
        Repository (supported: github, gitlab, bitbucket)
        <TextField
          style={{ backgroundColor: inputColor }}
          variant="outlined"
          margin="normal"
          defaultValue={downloadUrl}
          InputProps={{
            style: {
              color: "white",
              height: "50px",
              fontSize: "1em",
            },
          }}
          onChange={(e) => setDownloadUrl(e.target.value)}
          placeholder="https://github.com/frikky/shuffle-apps"
          fullWidth
        />
        <span style={{ marginTop: 10 }}>
          Branch (default value is "master"):
        </span>
        <div style={{ display: "flex" }}>
          <TextField
            style={{ backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            defaultValue={downloadBranch}
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
            }}
            onChange={(e) => setDownloadBranch(e.target.value)}
            placeholder="master"
            fullWidth
          />
        </div>
        <span style={{ marginTop: 10 }}>
          Authentication (optional - private repos etc):
        </span>
        <div style={{ display: "flex" }}>
          <TextField
            style={{ flex: 1, backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
            }}
            onChange={(e) => setField1(e.target.value)}
            type="username"
            placeholder="Username / APIkey (optional)"
            fullWidth
          />
          <TextField
            style={{ flex: 1, backgroundColor: inputColor }}
            variant="outlined"
            margin="normal"
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
            }}
            onChange={(e) => setField2(e.target.value)}
            type="password"
            placeholder="Password (optional)"
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          style={{ borderRadius: "0px" }}
          onClick={() => setLoadWorkflowsModalOpen(false)}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          style={{ borderRadius: "0px" }}
          disabled={downloadUrl.length === 0 || !downloadUrl.includes("http")}
          onClick={() => {
            handleGithubValidation();
          }}
          color="primary"
        >
          Submit Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  const loadedCheck =
    isLoaded && isLoggedIn && workflowDone ? (
      <div>
				{/*
				<ShepherdTour steps={newSteps} tourOptions={tourOptions}>
					<TourButton />
				</ShepherdTour>
				*/}
        <Dropzone
          style={{
            maxWidth: window.innerWidth > 1366 ? 1366 : 1200,
            margin: "auto",
            padding: 20,
          }}
          onDrop={uploadFile}
        >
          <WorkflowView />
        </Dropzone>
        {modalView}
        {deleteModal}
        {exportVerifyModal}
        {publishModal}
        {workflowDownloadModalOpen}
      </div>
    ) : (
      <div
        style={{
          paddingTop: 250,
          width: 250,
          margin: "auto",
          textAlign: "center",
        }}
      >
        <CircularProgress />
        <Typography>Loading Workflows</Typography>
      </div>
    );

  // Maybe use gridview or something, idk
  return <div>{loadedCheck}</div>;
};

export default GettingStarted;
