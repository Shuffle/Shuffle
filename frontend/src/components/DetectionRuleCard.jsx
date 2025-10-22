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

import LineChartWrapper, { LoadStats } from "../components/LineChartWrapper.jsx";
import {
	Edit as EditIcon,
	Refresh as RefreshIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";
import theme from '../theme.jsx';

const RuleCard = (props) => {
  const { ruleName, description, file_id, globalUrl, folderDisabled, isDetectionActive, availableDetection, ruleMapping, setRuleMapping, ruleDetails, key, ...otherProps } = props

  const [openCodeEditor, setOpenCodeEditor] = React.useState(false);
  const [fileData, setFileData] = React.useState("");
  const [isEnabled, setIsEnabled] = React.useState(otherProps.is_enabled);
  const [filteredBarchart, setFilteredBarchart] = React.useState(null) 

  const [responseValue, setResponseValue] = React.useState("No response action")
  const isCloud = ["localhost:3002", "shuffler.io"].includes(window.location.host);

  useEffect(() => {
		if (key < 10) {
			console.log("RuleCard Key: ", key, ruleName, file_id, otherProps)
		}

		if (ruleDetails?.title === undefined || ruleDetails?.title === null || ruleDetails?.title.length === 0) {
			//toast.error("Can't load stats for this rule. Contact support@shuffler.io if this persists.")
			return
		}

		const resp = LoadStats(globalUrl, `detection_rule_${ruleDetails?.title.replaceAll(" ", "_").toLowerCase()}`)
		resp.then((data) => {
			if (data === undefined) {
				setFilteredBarchart([])
			} else {
				setFilteredBarchart(data)
			}
		})
  }, [])

  const handleSwitchChange = (event) => {
    if (folderDisabled) {
      toast.warn("Enable the directory to enable individual rules");
      return;
    }

    if (!isDetectionActive) {
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

  var parsedRulename = ruleName.charAt(0).toUpperCase() + ruleName.slice(1).replaceAll("_", " ")
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
          <Typography variant="h6">
	  		{parsedRulename} {/*({filteredBarchart === null || filteredBarchart.total === undefined ? 0 : filteredBarchart.total})*/}
	  	  </Typography>
          <div style={{ display: 'flex', alignItems: 'center' }}>

	  		  {/*
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

					  toast.error("The automatic response system is NOT available for you yet. Please contact support@shuffler.io if you want to try this feature.")

					  // FIXME: Handle:
					  // 1. Get the current cache for the detection 
					  // 2. Create a new mapping for Detection -> Response
				  }}
				  style={{
					backgroundColor: theme.palette.inputColor,
					color: "white",
					height: 40,
					borderRadius: theme.palette?.borderRadius,
					marginRight: 20, 
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
			 */}


	  		<Tooltip title="Edit Rule" placement="top">
				<IconButton onClick={() => openEditBar(file_id, setOpenCodeEditor, setFileData, globalUrl)}>
				  <EditIcon />
				</IconButton>
	  		</Tooltip>
	  		<Tooltip title={isEnabled && !folderDisabled ? "Disable Rule" : "Enable Rule"} placement="top">
			  <Switch
				  checked={isEnabled && !folderDisabled}
				  onChange={handleSwitchChange}
				  disabled={true}
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
			display: "flex",
		}}>
	  		<Tooltip title="Refresh stats" placement="top">
				<IconButton 
	  				onClick={() => {
						if (ruleDetails?.title === undefined || ruleDetails?.title === null || ruleDetails?.title.length === 0) {
							toast.error("Can't load stats for this rule. Contact support@shuffler.io if this persists.")
							return
						}

						const resp = LoadStats(globalUrl, `detection_rule_${ruleDetails?.title.replaceAll(" ", "_").toLowerCase()}`)
						resp.then((data) => {
							console.log("DATA: ", data)
							if (data === undefined) {
								setFilteredBarchart([])
							} else {
								setFilteredBarchart(data)
							}
						})
					}}
	  			>
					<RefreshIcon 
						color="secondary"
					/>
				</IconButton>
	  		</Tooltip>

	  		{filteredBarchart === null ? <Typography variant="body2" color="textSecondary" style={{marginTop: 10, marginLeft: 18, }}>No stats yet</Typography> : 
				<div style={{minWidth: "90%", }}>
					<LineChartWrapper 
						inputname={""}
						keys={filteredBarchart} 
						height={100}
						width={"100%"}
						border={false}

						color={"#808080"}
					/>
				</div>
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
