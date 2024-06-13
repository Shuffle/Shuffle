import React, { useState, useEffect } from "react";
import { Container} from "@mui/material";
import { toast } from "react-toastify";
import Detection from "./Detection";
import EditComponent from "./EditRules";

const getSigmaInfo = (globalUrl, setRuleInfo) => {
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

const DetectionDashBoard = (props) => {
  const { globalUrl } = props;
  const [ruleInfo, setRuleInfo] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [fileData, setFileData] = useState("")

  useEffect(() => {
    getSigmaInfo(globalUrl, setRuleInfo);
  }, [globalUrl]);

  useEffect(() => {
    if (ruleInfo.length > 0) {
      openEditBar(ruleInfo[0]);
    }
  }, [ruleInfo]);

  const openEditBar = (rule) => {
    setSelectedRule(rule);
    getFileContent(rule.file_id)
  };

  const handleSave = (updatedContent) => {
   toast("this will be saved");
    setSelectedRule(null); // Close the edit bar after saving
  };

  const getFileContent = (file_id) => {
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

  return (
    <Container style={{display: "flex"}}>
      {selectedRule ? (
        <EditComponent
          ruleName={selectedRule.title}
          description={selectedRule.description}
          content={fileData}
          setContent={setFileData}
          lastEdited={selectedRule.lastEdited}
          editedBy={selectedRule.editedBy}
          onSave={handleSave}
        />
      ) : null}
      <Detection globalUrl={globalUrl} ruleInfo={ruleInfo} openEditBar={openEditBar} />
    </Container>
  );  
};

export default DetectionDashBoard;
