import React from "react";
import {
  Container,
  Box,
  TextField,
  Switch,
  Card,
  CardContent,
  IconButton,
  Typography,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { styled } from "@mui/system";
import { toast } from "react-toastify";

const ConnectedButton = styled(Button)({
  backgroundColor: "red",
  color: "white",
});

const RuleCard = ({ ruleName, description, file_id, globalUrl, ...otherProps }) => {
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
            <IconButton>
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

const Detection = (props) => {
  const { globalUrl } = props;
  const [ruleInfo, setRuleInfo] = React.useState([]);

  const getSigmaInfo = () => {
    const url = globalUrl + "/api/v1/files/detection/sigma_rules";

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) =>
        response.json().then((responseJson) => {
          if (responseJson["success"] === false) {
            toast("Failed to get sigma rules");
          } else {
            setRuleInfo(responseJson);
          }
        })
      )
      .catch((error) => {
        console.log("Error in getting sigma files: ", error);
        toast("An error occurred while fetching sigma rules");
      });
  };

  React.useEffect(() => {
    getSigmaInfo();
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            Group 1 Title
          </Typography>
          <ConnectedButton variant="contained">
            Not Connected to SIEM
          </ConnectedButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <TextField label="Search rules" variant="outlined" size="small" />
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Global disable/enable
            </Typography>
            <Switch defaultChecked />
          </Box>
        </Box>
        {ruleInfo.length > 0 &&
          ruleInfo.map((card) => (
            <RuleCard
              key={card.file_id}
              ruleName={card.title}
              description={card.description}
              file_id={card.file_id}
              globalUrl={globalUrl}
              {...card}
            />
          ))}
      </Box>
    </Container>
  );
};

export default Detection;
