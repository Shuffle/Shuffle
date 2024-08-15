import React from "react";
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";
import theme from '../theme.jsx';

const RuleCard = ({ ruleName, description, file_id, globalUrl, folderDisabled, isTenzirActive, ...otherProps }) => {
  const [openCodeEditor, setOpenCodeEditor] = React.useState(false);
  const [fileData, setFileData] = React.useState("");
  const [isEnabled, setIsEnabled] = React.useState(otherProps.is_enabled);
  const isCloud = ["localhost:3002", "shuffler.io"].includes(window.location.host);

  const handleSwitchChange = (event) => {
    if (folderDisabled) {
      toast("enable the directory to enable individual rules");
      return;
    }
    if (!isTenzirActive) {
      toast("connect to the siem to enable/disable the rule");
      return;
    }
    const newIsEnabled = event.target.checked;
    toggleRule(file_id, !newIsEnabled, globalUrl, () => {
      setIsEnabled(newIsEnabled);
    });
  };

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
		borderRadius: theme.palette.borderRadius,
		minHeight: 100, 
	}}>
      <CardContent>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
		color: "white",
          }}
        >
	  	  <h1> HELO</h1>
          <Typography variant="h6">{ruleName}</Typography>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => openEditBar(file_id, setOpenCodeEditor, setFileData, globalUrl)}>
              <EditIcon />
            </IconButton>
            <Switch
              checked={isEnabled && !folderDisabled}
              onChange={handleSwitchChange}
              disabled={!isTenzirActive}
            />
          </div>
        </div>
        <Typography variant="body2" style={{ marginTop: '2%' }}>
          {description}
        </Typography>

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
  const url = `${globalUrl}/api/v1/files/detection/${fileId}/${action}_rule`;

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
