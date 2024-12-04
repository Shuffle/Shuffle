import React, { useState, useEffect } from "react";
import { Container, CircularProgress, Typography } from "@mui/material";
import { toast } from "react-toastify";
import Detection from "../views/Detection";

const DetectionDashBoard = (props) => {
  const { globalUrl } = props;
  const [ruleInfo, setRuleInfo] = useState(null);
  const [, setSelectedRule] = useState(null);
  const [, setFileData] = useState("");
  const [isTenzirActive, setIsTenzirActive] = useState(false);
  const [folderDisabled, setFolderDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importAttempts, setImportAttempts] = useState(0);
  const maxImportAttempts = 2;

  useEffect(() => {
    const fetchTimeout = setTimeout(() => {
      fetchSigmaInfo();
    }, 1000); // Delay by 1 second

    return () => clearTimeout(fetchTimeout);
  }, [globalUrl]);

  useEffect(() => {
    if (ruleInfo && ruleInfo.length === 0 && importAttempts < maxImportAttempts) {
      importSigmaFromUrl();
    }
  }, [ruleInfo]);

  const openEditBar = (rule) => {
    setSelectedRule(rule);
    fetchFileContent(rule.file_id);
  };

  const handleSave = (updatedContent) => {
    toast("This will be saved");
  };

  const fetchFileContent = (file_id) => {
    setFileData("");
    fetch(`${globalUrl}/api/v1/files/${file_id}/content`, {
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
        setFileData(respdata);
      })
      .catch((error) => {
        toast(error.toString());
      });
  };

  const fetchSigmaInfo = () => {
    const url = `${globalUrl}/api/v1/files/detection/sigma_rules`;
    setIsLoading(true);

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson["success"] === false) {
          toast("Failed to get sigma rules");
        } else {
          setRuleInfo(responseJson.sigma_info || []);
          setFolderDisabled(responseJson.folder_disabled);
          setIsTenzirActive(responseJson.is_tenzir_active);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log("Error in getting sigma files: ", error);
        toast("An error occurred while fetching sigma rules");
        setRuleInfo([]);
      });
  };

  const importSigmaFromUrl = () => {
    setIsLoading(true);
    setImportAttempts((prevAttempts) => prevAttempts + 1);

    const url = "https://github.com/satti-hari-krishna-reddy/shuffle_sigma";
    const folder = "sigma";

    const parsedData = {
      url: url,
      path: folder,
      field_3: "main",
    };

    toast(`Getting files from url ${url}. This may take a while if the repository is large. Please wait...`);
    fetch(`${globalUrl}/api/v1/files/download_remote_enhanced`, {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify(parsedData),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.success) {
          toast("Successfully loaded files from " + url);
          fetchSigmaInfo(); // Fetch again after successful import
        } else {
          toast(responseJson.reason ? `Failed loading: ${responseJson.reason}` : "Failed loading");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        toast(error.toString());
        setIsLoading(false);
      });
  };

  if (isLoading && (!ruleInfo || ruleInfo.length === 0)) {
    return (
      <Container style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>
          <CircularProgress />
          <Typography variant="h6" style={{ marginTop: 20 }}>Downloading rules, please wait...</Typography>
        </div>
      </Container>
    );
  }

  return (
    <Container style={{ display: "flex" }}>
      <Detection
        globalUrl={globalUrl}
        ruleInfo={ruleInfo}
        folderDisabled={folderDisabled}
        setFolderDisabled={setFolderDisabled}
        isTenzirActive={isTenzirActive}
      />
    </Container>
  );
};

export default DetectionDashBoard;
