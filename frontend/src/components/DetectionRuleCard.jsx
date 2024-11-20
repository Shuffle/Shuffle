import React, { useState, useEffect, } from "react";
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Switch,
  Tooltip,
  Select,
  MenuItem,
  Divider,
  FormLabel,
} from "@mui/material";

import DashboardBarchart, { LoadStats } from '../components/DashboardBarchart.jsx';
import {
	Edit as EditIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";
import theme from '../theme.jsx';


const RuleCard = ({ ruleName, description, file_id, globalUrl, folderDisabled, isTenzirActive, availableDetection, ruleMapping, setRuleMapping, ...otherProps }) => {
  const [openCodeEditor, setOpenCodeEditor] = React.useState(false);
  const [fileData, setFileData] = React.useState("");
  const [isEnabled, setIsEnabled] = React.useState(otherProps.is_enabled);
  const [filteredBarchart, setFilteredBarchart] = React.useState(null) 

  const [responseValue, setResponseValue] = React.useState("No response action")
  const isCloud = ["localhost:3002", "shuffler.io"].includes(window.location.host);

  console.log("Rulemapping: ", ruleMapping)
  useEffect(() => {

	//const url = `${globalUrl}/api/v1/stats/app_executions_test2`
	//const resp = LoadStats(globalUrl, ruleName)
	//const resp = LoadStats(globalUrl, "app_executions_test2")
	const resp = LoadStats(globalUrl, "app_executions_cloud")
	resp.then((data) => {
		if (data === undefined) {
			setFilteredBarchart([])
		} else {
			setFilteredBarchart(data)
		}
	})

	if (ruleMapping !== undefined && ruleMapping !== null && ruleMapping.value !== undefined && ruleMapping.value !== null) {
		console.log("FIX MAPPING FROM ruleMapping.value: ", ruleMapping)
	}
  }, [])

  console.log("Response Value: ", responseValue)

  const handleSwitchChange = (event) => {
    if (folderDisabled) {
      toast.warn("Enable the directory to enable individual rules");
      return;
    }

    if (!isTenzirActive) {
      toast.warn("Connect to the siem first to enable/disable the rule");
      return;
    }

    const newIsEnabled = event.target.checked;
    toggleRule(file_id, !newIsEnabled, globalUrl, () => {
      setIsEnabled(newIsEnabled);
    })
  }


  const UpdateText = (text) => {
    fetch(`${globalUrl}/api/v1/files/${file_id}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: text,
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Can't update file");
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          toast("Successfully updated rule");
        }
      })
      .catch((error) => {
        toast("Error updating file: " + error.toString());
      });
  };

  return (
    <Card style={{
		borderRadius: theme.palette?.borderRadius,
		minHeight: 100, 
		marginBottom: 10, 
		paddingBottom: 0, 
	}}>
      <CardContent
	  	style={{
			padding: "10px 30px 0px 30px",
		}}
	  >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
			color: "white",
          }}
        >
          <Typography variant="h6">{ruleName.replaceAll("_", " ")} ({filteredBarchart === null || filteredBarchart.total === undefined ? 0 : filteredBarchart.total})</Typography>
          <div style={{ display: 'flex', alignItems: 'center' }}>

	  		<Select
				  MenuProps={{
					disableScrollLock: true,
				  }}
				  labelId="Response Action"
				  value={responseValue}
				  SelectDisplayProps={{
					style: {
						color: "rgba(255,255,255,0.4)",
					},
				  }}
				  fullWidth
				  onChange={(e) => {
					  toast("Changing response: " + e.target.value)
					  console.log("Target: ", e.target.value)

					  setResponseValue(e.target.value)

					  // FIXME: Handle:
					  // 1. Get the current cache for the detection 
					  // 2. Create a new mapping for Detection -> Response
				  }}
				  style={{
					backgroundColor: theme.palette.inputColor,
					color: "white",
					height: 40,
					borderRadius: theme.palette?.borderRadius,
				  }}
				>
				  <MenuItem
					style={{
					  backgroundColor: theme.palette.inputColor,
					  color: "white",
					}}
					value="No response action"
				  >
					<em>No selected response</em>
				  </MenuItem>

	  			  <Divider />

				  {availableDetection === undefined || availableDetection === null ? null : availableDetection.map((data, index) => {
						return (
						  <MenuItem
							key={index}
							style={{
							  backgroundColor: theme.palette.inputColor,
							  color: "white",
							  overflowX: "auto",
							}}
							value={data.name}
						  >
							{data.name} 
						  </MenuItem>
						)
				  })}
				</Select>


	  		<Tooltip title="Edit Rule" placement="top">
				<IconButton onClick={() => openEditBar(file_id, setOpenCodeEditor, setFileData, globalUrl)}>
				  <EditIcon />
				</IconButton>
	  		</Tooltip>
	  		<Tooltip title={isEnabled && !folderDisabled ? "Disable Rule" : "Enable Rule"} placement="top">
			  <Switch
				  checked={isEnabled && !folderDisabled}
				  onChange={handleSwitchChange}
				  disabled={false}
	  		  />
	  	    </Tooltip>
          </div>
        </div>

	  	<div style={{
			overflow: 'visible', 
			zIndex: 10,
			//border: "1px solid rgba(255,255,255,0.3)", 
			borderRadius: theme.palette?.borderRadius,
			marginTop: 5, 

			minHeight: 40,
			maxHeight: 40,
		}}>
	  		{filteredBarchart === null ? null :
				<DashboardBarchart 
					timelineData={filteredBarchart}
				/>
			}
	  	</div>

	  	{/*
        <Typography variant="body2" style={{ marginTop: '2%' }}>
          {description}
        </Typography>
		*/}

        <ShuffleCodeEditor
          isCloud={isCloud}
          expansionModalOpen={openCodeEditor}
          setExpansionModalOpen={setOpenCodeEditor}
          setcodedata={setFileData}
          codedata={fileData}
          isFileEditor={true}
          key={fileData} // https://reactjs.org/docs/reconciliation.html#recursing-on-children
          runUpdateText={UpdateText}
        />
      </CardContent>
    </Card>
  );
}

const toggleRule = (fileId, isCurrentlyEnabled, globalUrl, callback) => {
  const action = isCurrentlyEnabled ? "disable" : "enable";
  const url = `${globalUrl}/api/v1/detections/${fileId}/${action}_rule`;

  fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) =>
      response.json().then((responseJson) => {
        if (responseJson["success"] === false) {
          toast(`Failed to ${action} the rule`);
        } else {
          toast(`Rule ${action}d successfully`);
          callback();
        }
      })
    )
    .catch((error) => {
      console.log(`Error in ${action}ing the rule: `, error);
      toast(`An error occurred while ${action}ing the rule`);
    });
};

const openEditBar = (file_id, setOpenCodeEditor, setFileData, globalUrl) => {
    getFileContent(file_id, setFileData, globalUrl)
    
    setOpenCodeEditor(true);
};

const getFileContent = (file_id, setFileData, globalUrl) => {
  setFileData("");
  fetch(globalUrl + "/api/v1/files/" + file_id + "/content", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
  })
    .then((response) => {
      if (response.status !== 200) {
        console.log("Status not 200 for file :O!");
        return "";
      }
      return response.text();
    })
    .then((respdata) => {    
      if (respdata.length === 0) {
        toast("Failed getting file. Is it deleted?");
        return;
      }
      return respdata
    })
    .then((responseData) => {
    
    setFileData(responseData);
    })
    .catch((error) => {
      toast(error.toString());
    });
};
export default RuleCard;
