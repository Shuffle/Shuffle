import React, { useEffect, useState } from "react";

import { getTheme } from '../theme.jsx';
import { toast } from "react-toastify"

import {
  Button,
  Dialog,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
  TextareaAutosize,
  TextField,
  ButtonGroup, 
} from "@mui/material";

import {
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const WorkflowGenerationModal = (props) => {

	const {
	  open = false,
	  supportEmail = "support@shuffler.io",
	  isMobile = false,
	  theme = null,
	  workflow={},
	  setWorkflow = () => {},
    saveWorkflow = () => {},
    setWorkflowGenerationModalOpen = () => {},
	  isCloud = false,
	  globalUrl = "",
	} = props;

  const [isFocused, setIsFocused] = useState(false);
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isAiEditing, setIsAiEditing] = React.useState(false);
  const [backupWorkflow, setBackupWorkflow] = React.useState(null);

  const currentTheme = theme || getTheme("dark");
  const hasBackup = backupWorkflow !== null && backupWorkflow !== undefined


  const handleKeyDown = (event) => {

  	if (open === false) {
		return
	}

  	if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
  		event.preventDefault()
  		const tryItButton = document.getElementById("try-it-button")
  		if (tryItButton !== undefined && tryItButton !== null) {
  			tryItButton.click()
  		} else {
			const keepChangesButton = document.getElementById("keep-changes-button")
			if (keepChangesButton !== undefined && keepChangesButton !== null) {
				keepChangesButton.click()
			}
		}
  	}

	// Ctrl+Z
	if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
		event.preventDefault()
		const discardChangesButton = document.getElementById("discard-changes-button")
		if (discardChangesButton !== undefined && discardChangesButton !== null) {
			discardChangesButton.click()
		}
	}

  // Escape
  if (event.key === 'Escape') {
      setWorkflowDescription("");
      setIsAiEditing(false);
      setWorkflowGenerationModalOpen(false);
  }
}

  useEffect(() => {
  	document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const discardAiWorkflow = () => {
    if (backupWorkflow === null || backupWorkflow === undefined) {
      toast("No backup workflow to discard to.");
      return;
    }

    // Deep copy to avoid reference issues and reset state
    const restored = JSON.parse(JSON.stringify(backupWorkflow));
    setWorkflow(restored);
    setBackupWorkflow(null);
    setWorkflowDescription("");
    setIsAiEditing(false); // Reset loading state
    setWorkflowGenerationModalOpen(false);

    toast.success("Changes discarded and previous workflow restored.");
  };

  const editAIWorkflow = () => {
    setIsAiEditing(true);
    setBackupWorkflow(null);

    var envToSend = isCloud ? "Cloud" : "Shuffle"
    for (var actionkey in workflow?.actions) {
      envToSend = workflow?.actions[actionkey]?.environment
      break
    }

    const data = { 
      query: workflowDescription,
      workflow_id: workflow?.id,
      environment: envToSend,
    }

    fetch(`${globalUrl}/api/v2/workflows/edit/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        return response.json().then((json) => {
          if (response.status !== 200) {
            toast.error(json.reason || "Unexpected response. Please contact support@shuffler.io if this persists.", {
				autoClose: 10000,
				onClick: () => {
					window.open("/docs/AI#self-hosting-models", "_blank")
				}
			})

            setIsAiEditing(false);

            return null;
          }

          if (json.success === true && typeof json.message === "string") {
            toast(json.message);
            setIsAiEditing(false);
            return null;
          }

          if (json.success === false) {
            toast(json.message || "Operation failed");
            setIsAiEditing(false);
            return null;
          }

          if (!json || Object.keys(json).length === 0) {
            toast("AI edit failed: empty response");
            setIsAiEditing(false);
            return null;
          }

          toast.success("Workflow load done. Choose what to do.");
          setBackupWorkflow(JSON.parse(JSON.stringify(workflow)));
          setWorkflow(json);
          setIsAiEditing(false);
          return json;
        });
      })
      .catch((error) => {
        console.error("AI Workflow Edit Error:", error);
        toast.error(`Failed to load LLM response due to: ${error.message || error}`);
        setIsAiEditing(false);
      });
  };

  const handleEdit = () => {
    if (workflowDescription.trim() === "") {
		return
	}

  	editAIWorkflow() 
  };

  const handleDiscard = () => {
    setWorkflowDescription("");

  }

  const handleKeep = () => {
    // Keep the AI-provided workflow: do not restore the backup.
    // Clear the stored backup and reset modal state.
    saveWorkflow(workflow);
    setBackupWorkflow(null)
    setWorkflowDescription("")
    setIsAiEditing(false)
    setWorkflowGenerationModalOpen(false);
  };

  if (open === false) {
	  if (hasBackup) {
	  }

	  return null
  }

  return (
	<div style={{position: "fixed", bottom: 100, left: "40%", minWidth: 540, border: "1px solid rgba(255,255,255,0.3)", padding: 10, borderRadius: theme?.palette?.borderRadius || 8, background: currentTheme?.palette?.background?.default || "#222", }}>

        
        {hasBackup && !isAiEditing ?
          <ButtonGroup fullWidth style={{MarginBottom: 5, }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              id="discard-changes-button"
              onClick={discardAiWorkflow}
            >
              Discard (Ctrl+z)
            </Button>
            <Button
              variant="aiButtonGhost"
              size="small"
              onClick={handleKeep}
			  id="keep-changes-button"
            >
              Keep (Ctrl+enter) 
            </Button>
          </ButtonGroup>
			
		  :

		  <TextField
		    placeholder={`Describe how you want to edit your workflow here...`}
		    multiline
		    minRows={1}
		    value={workflowDescription}
		    onChange={(e) => setWorkflowDescription(e.target.value)}
		    disabled={isAiEditing}
		    onFocus={() => setIsFocused(true)}
		    onBlur={() => setIsFocused(false)}
		    fullWidth

		    InputProps={{
		  	  endAdornment: (
		  		<Button
		  		  id="try-it-button"
		  		  color="primary"
		  		  size="small"
		  		  variant="aiButton"
		  		  disabled={isAiEditing || workflowDescription.trim() === ""}
		  		  onClick={handleEdit}
		  		  style={{maxHeight: 40, minHeight: 40, whiteSpace: 'nowrap'}}
		  		>
		  		  {isAiEditing
		  			? <CircularProgress size={16} />
		  			: <><SendIcon style={{ marginRight: 5, }} /> Ctrl+enter</>
		  		  }
		  		</Button>
		  	  )
		  	}}
		  />
        }

	  <Typography variant="body2" style={{ fontSize: 10, textAlign: "center", color: currentTheme.palette.text.secondary || "#ccc", marginTop: 10 }}>
	  	AI Edits require you to manually review and accept changes.<br/> You can discard unwanted edits. Uses your configured LLM or shuffler.io AI credits. <b>Alpha</b> feature.
	  </Typography>

	</div>
  );
};

export default WorkflowGenerationModal;
