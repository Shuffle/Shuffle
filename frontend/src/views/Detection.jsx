import React from "react";
import {
  Container,
  Box,
  TextField,
  Switch,
  Typography,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";
import RuleCard from "./RuleCard";
import { styled } from "@mui/system";

const ConnectedButton = styled(Button)(({ theme, isConnected }) => ({
  backgroundColor: isConnected ? "green" : "red",
  color: "white",
}));

const handleDirectoryChange = (folderDisabled, setFolderDisabled, globalUrl) => {
  const action = folderDisabled ? "enable_folder" : "disable_folder";
  const url = `${globalUrl}/api/v1/files/detection/${action}`;

  fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) =>
      response.json().then((responseJson) => {
        if (responseJson["success"] === true) {
          if (action === "enable_folder") setFolderDisabled(false);
          else setFolderDisabled(true);
        } else {
          //toast(`failed to disable rule`);
        }
      })
    )
    .catch((error) => {
      console.log(`Error in ${action} the rule: `, error);
      toast(`An error occurred while ${action} the rule`);
    });
};

const Detection = ({
  globalUrl,
  ruleInfo,
  folderDisabled,
  setFolderDisabled,
  openEditBar,
  isTenzirActive,
}) => {
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
            Sigma Detection Rules
          </Typography>
          <ConnectedButton
            variant="contained"
            isConnected={isTenzirActive}
          >
            {isTenzirActive ? "Connected to SIEM" : "Not Connected to SIEM"}
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
            <Switch
              checked={!folderDisabled}
              onChange={() =>
                handleDirectoryChange(folderDisabled, setFolderDisabled, globalUrl)
              }
            />
          </Box>
        </Box>
        <Box
          sx={{
            height: "500px",
            width: "100%",
            overflowY: "auto",
            border: "1px solid #ddd",
            p: 1,
          }}
        >
          {ruleInfo.length > 0 &&
            ruleInfo.map((card) => (
              <RuleCard
                key={card.file_id}
                ruleName={card.title}
                description={card.description}
                file_id={card.file_id}
                globalUrl={globalUrl}
                folderDisabled={folderDisabled}
                openEditBar={() => openEditBar(card)}
                {...card}
              />
            ))}
        </Box>
      </Box>
    </Container>
  );
};

export default Detection;
