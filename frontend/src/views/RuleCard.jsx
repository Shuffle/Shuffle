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

const RuleCard = ({ ruleName, description, file_id, globalUrl, openEditBar, ...otherProps }) => {
  const [additionalProps, setAdditionalProps] = React.useState(otherProps);

  const handleSwitchChange = (event) => {
    const isEnabled = event.target.checked;
    toggleRule(file_id, !isEnabled, globalUrl, () => {
      setAdditionalProps((prevProps) => ({
        ...prevProps,
        is_enabled: isEnabled,
      }));
    });
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Typography variant="h6">{ruleName}</Typography>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => openEditBar({ ruleName, description, file_id, ...additionalProps })}>
              <EditIcon />
            </IconButton>
            <Switch
              checked={additionalProps.is_enabled}
              onChange={handleSwitchChange}
            />
          </div>
        </div>
        <Typography variant="body2" style={{ marginTop: '2%' }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const toggleRule = (fileId, isCurrentlyEnabled, globalUrl, callback) => {
  const action = isCurrentlyEnabled ? "disable" : "enable";
  const url = `${globalUrl}/api/v1/files/${fileId}/${action}_rule`;

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

export default RuleCard;
