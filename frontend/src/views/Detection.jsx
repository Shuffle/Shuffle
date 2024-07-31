import React, { useState } from "react";
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
import CircularProgress from "@material-ui/core/CircularProgress";

const handleDirectoryChange = (folderDisabled, setFolderDisabled, globalUrl, isTenzirActive) => {

  if (!isTenzirActive) {
    toast("connect to siem first for global enable/disable to work");
    return;
  }
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
  isTenzirActive,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnectClick = () => {
    if (!isTenzirActive) {
      setLoading(true);
      const url = `${globalUrl}/api/v1/detection/siem/connect`;

      fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) =>
          response.json().then((responseJson) => {
            if (responseJson["success"] === true) {
              setTimeout(() => {
                setLoading(false);
                window.location.reload();
              }, 15000); 
            } else {
              setLoading(false);
              toast("Failed to connect to SIEM");
            }
          })
        )
        .catch((error) => {
          setLoading(false);
          console.log(`Error in connecting to SIEM: `, error);
          toast("An error occurred while connecting to SIEM");
        });
    } else {
      console.log("Already connected to SIEM");
    }
  };

  const filteredRules = ruleInfo?.filter((rule) =>
    rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Button
      variant="contained"
      onClick={handleConnectClick}
      disabled={loading} // Disable the button while loading
      style={{ backgroundColor: isTenzirActive ? "green" : "red"}}
    >
      {loading ? <CircularProgress size={24} /> : isTenzirActive ? "Connected to siem" : "Connect to siem"}
    </Button>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
            }}
          >
            <TextField
              label="Search rules"
              variant="outlined"
              size="small"
              sx={{ mr: 2 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* <Button
              color="primary"
              variant="contained"
              onClick={() => uploadRef.current.click()}
            >
              <PublishIcon /> Upload sigma file
            </Button>
            <input
              hidden
              type="file"
              multiple
              ref={uploadRef}
              onChange={(event) => {
                uploadFiles(event.target.files);
              }}
            /> */}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Global disable/enable
            </Typography>
            <Switch
              checked={!folderDisabled}
              onChange={() =>
                handleDirectoryChange(folderDisabled, setFolderDisabled, globalUrl, isTenzirActive)
              }
              disabled={!isTenzirActive}
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
          {filteredRules?.length > 0 &&
            filteredRules.map((card) => (
              <RuleCard
                key={card.file_id}
                ruleName={card.title}
                description={card.description}
                file_id={card.file_id}
                globalUrl={globalUrl}
                folderDisabled={folderDisabled}
                isTenzirActive={isTenzirActive}
                {...card}
              />
            ))}
        </Box>
      </Box>
    </Container>
  );
};

export default Detection;
