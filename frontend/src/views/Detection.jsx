import React, { useState, useRef } from "react";
import {
  Container,
  Box,
  TextField,
  Switch,
  Typography,
  Button,
} from "@mui/material";
import { Publish as PublishIcon } from "@mui/icons-material";
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
  const [searchQuery, setSearchQuery] = useState("");
  const uploadRef = useRef(null);

  const uploadFiles = (files) => {
    for (const key in files) {
      try {
        const filename = files[key].name;
        const filedata = new FormData();
        filedata.append("shuffle_file", files[key]);

        if (typeof files[key] === "object") {
          handleCreateFile(filename, filedata);
        }
      } catch (e) {
        console.log("Error in dropzone: ", e);
      }
    }

    setTimeout(() => {
      // Additional logic if needed
    }, 2500);
  };

  const handleCreateFile = (filename, file) => {
    const data = {
      filename: filename,
      org_id: "default",
      workflow_id: "global",
      namespace: "sigma",
    };

    fetch(globalUrl + "/api/v1/files/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for apps :O!");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === true) {
          handleFileUpload(responseJson.id, file);
        } else {
          toast("Failed to upload file ", filename);
        }
      })
      .catch((error) => {
        toast("Failed to upload file ", filename);
        console.log(error.toString());
      });
  };

  const handleFileUpload = (file_id, file) => {
    fetch(`${globalUrl}/api/v1/files/${file_id}/upload`, {
      method: "POST",
      credentials: "include",
      body: file,
    })
      .then((response) => {
        if (response.status !== 200 && response.status !== 201) {
          console.log("Status not 200 for apps :O!");
          toast("File was created, but failed to upload.");
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        // Handle the response as needed
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const filteredRules = ruleInfo.filter((rule) =>
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
          <ConnectedButton variant="contained" isConnected={isTenzirActive}>
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
            <Button
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
            />
          </Box>
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
          {filteredRules.length > 0 &&
            filteredRules.map((card) => (
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
