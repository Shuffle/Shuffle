import React, { useState } from "react";
import {
  Container,
  Box,
  TextField,
  Switch,
  Typography,
  Button,
  CircularProgress, 
  Paper, 
} from "@mui/material";

import { toast } from "react-toastify";
import theme from '../theme.jsx';
import DetectionRuleCard from "../components/DetectionRuleCard.jsx";

const handleDirectoryChange = (folderDisabled, setFolderDisabled, globalUrl, isTenzirActive) => {
  if (!isTenzirActive) {
    toast.warn("Connect to siem first for global enable/disable to work");
    return;
  }

  const action = folderDisabled ? "enable_folder" : "disable_folder";
  const url = `${globalUrl}/api/v1/detections/${action}`;

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

const Detection = (props)  => {
  const { globalUrl, ruleInfo, folderDisabled, setFolderDisabled, isTenzirActive, detectionInfo } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnectClick = () => {
    if (isTenzirActive) {
		return
	}

	if (detectionInfo.category === undefined || detectionInfo.category === null) {
		toast.warn("Detection category not found. Please try again or contact support@shuffler.io if you think this is a bug.")
		return
	}

    setLoading(true);
    const url = `${globalUrl}/api/v1/detections/${detectionInfo?.category}/connect`;

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
		  if (responseJson.reason !== undefined && responseJson.reason !== null) {
			  toast(responseJson.reason)
		  } else {
		  	toast(`Failed to connect to ${detectionInfo?.category}`);
		  }

		  if (responseJson.action !== undefined && responseJson.actio !== null && responseJson.action.length > 0) {
			  //if (responseJson.action === "environment_create") {
			  //	navigate("/admin?tab=environments")
			  //}
		  }

		  setLoading(false);
		}
	  })
	)
	.catch((error) => {
	  setLoading(false);
	  console.log(`Error in connecting to ${detectionInfo?.category}: `, error);
	  toast(`An error occurred while connecting to ${detectionInfo?.category}`);
	});
  }

  const filteredRules = ruleInfo === "default" ? [] : ruleInfo?.filter((rule) =>
    rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Container>
      <Paper
	    style={{
		  marginTop: 50, 
	  	  width: "100%", 
		  padding: 50, 
	  	  backgroundColor: theme.palette.backgroundColor,
		  borderRadius: theme.palette.borderRadius,
	    }}
	  >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
	  		{detectionInfo?.name} ({filteredRules?.length})
          </Typography>
          <Button
			  variant="contained"
			  onClick={handleConnectClick}
			  disabled={loading} // Disable the button while loading
	  		  color={isTenzirActive ? "primary" : "secondary"}
			  style={{ }}
		  >
      		{loading ? <CircularProgress size={24} /> : isTenzirActive ? `Connected to ${detectionInfo?.category}` : `Connect to ${detectionInfo?.category}`}
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
            />
          </Box>
        </Box>
        <Box
          sx={{
            height: "500px",
            width: "100%",
            overflowY: "auto",
            p: 1,
          }}
        >
          {filteredRules?.length > 0 ?
			  filteredRules.map((rule, index) => {
				console.log("RULE CARD: ", rule);

				return (
				  <DetectionRuleCard
					key={index}
					ruleName={rule.file_name}
					description={rule.description}

					file_id={rule.file_id}
					globalUrl={globalUrl}
					folderDisabled={folderDisabled}
					isTenzirActive={isTenzirActive}
					{...rule}
				  />
				)
			  }) 
			: null } 
        </Box>
      </Paper>
    </Container>
  );
};

export default Detection;
