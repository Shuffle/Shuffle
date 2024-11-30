import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { CheckCircle, Error, ArrowBack, Close, Cached as CachedIcon, Pause as PauseIcon } from '@mui/icons-material';
import theme from '../theme.jsx';
import ReactJson from "react-json-view-ssr";
import { toast } from 'react-toastify';
import { validateJson } from "../views/Workflows.jsx";
// import HandleJsonCopy from "./ShuffleCodeEditor1";

const STATUS_CONFIG = {
  EXECUTING: {
    color: '#64B5F6',
    icon: () => <CircularProgress size={16} thickness={4} sx={{ color: '#64B5F6' }} />,
    label: 'Executing'
  },
  SUCCESS: {
    color: '#4CAF50',
    icon: () => <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />,
    label: 'Success'
  },
  FINISHED: {
    color: '#4CAF50',
    icon: () => <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />,
    label: 'Finished'
  },
  ABORTED: {
    color: '#F44336',
    icon: () => <Error sx={{ color: '#F44336', fontSize: 16 }} />,
    label: 'Aborted'
  }
};

let to_be_copied = ""

const handleReactJsonClipboard = (copy) => {
  toast("Copied JSON path to clipboard, NOT Path")
};


const HandleJsonCopy = (base, copy, base_node_name) => {
  if (typeof copy.name === "string") {
    copy.name = copy.name.replaceAll(" ", "_");
  }

  //lol
  if (typeof base === 'object' || typeof base === 'dict') {
    base = JSON.stringify(base)
  }

  if (base_node_name === "execution_argument" || base_node_name === "Execution Argument") {
    base_node_name = "exec"
  }

  console.log("COPY: ", base_node_name, copy);

  //var newitem = JSON.parse(base);
  var newitem = validateJson(base).result
  to_be_copied = "$" + base_node_name.toLowerCase().replaceAll(" ", "_");
  for (let copykey in copy.namespace) {
    if (copy.namespace[copykey].includes("Results for")) {
      continue;
    }

    if (newitem !== undefined && newitem !== null) {
      newitem = newitem[copy.namespace[copykey]];
      if (!isNaN(copy.namespace[copykey])) {
        to_be_copied += ".#";
      } else {
        to_be_copied += "." + copy.namespace[copykey];
      }
    }
  }

  if (newitem !== undefined && newitem !== null) {
    newitem = newitem[copy.name];
    if (!isNaN(copy.name)) {
      to_be_copied += ".#";
    } else {
      to_be_copied += "." + copy.name;
    }
  }

  to_be_copied.replaceAll(" ", "_");
  const elementName = "copy_element_shuffle";
  var copyText = document.getElementById(elementName);
  if (copyText !== null && copyText !== undefined) {
    console.log("NAVIGATOR: ", navigator);
    const clipboard = navigator.clipboard;
    if (clipboard === undefined) {
      toast("Can only copy over HTTPS (port 3443)");
      return;
    }

    navigator.clipboard.writeText(to_be_copied);
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices *

    /* Copy the text inside the text field */
    document.execCommand("copy");
    toast("Copied JSON path to clipboard.")
    console.log("COPYING!");
  } else {
    console.log("Couldn't find element ", elementName);
  }
}

const ExecuteWorkflow = async (executionData, globalUrl) => {
  try {
    const workflowData = executionData.workflow;

    // Execute workflow with original parameters
    await fetch(`${globalUrl}/api/v1/workflows/${workflowData.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: workflowData
    }).then(response => {
      window.location.href = `/workflows/${workflowData.id}/code?execution_id=` + response.json().execution_id;
    });

  } catch (error) {
    console.error('Error re-executing workflow:', error);
  }
};

const ExecutionsList = ({ executions, onSelectExecution, activeExecutionId }) => {
  return (
    <Box>
      {executions.map((execution) => {
        const status = STATUS_CONFIG[execution.status] || STATUS_CONFIG.ABORTED;
        return (
          <Box
            key={execution.execution_id}
            onClick={() => onSelectExecution(execution)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              py: 1,
              px: 2,
              borderBottom: '1px solid #2A2A2A',
              backgroundColor: activeExecutionId === execution.execution_id ?
                'rgba(255,255,255,0.05)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            {status.icon()}

            <Box sx={{ ml: 2, flex: 1, overflow: 'hidden' }}>
              <Typography variant="body2" sx={{
                color: '#E0E0E0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {new Date(execution.started_at * 1000).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{
                color: status.color
              }}>
                {status.label}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const ExecutionDetail = ({ execution: initialExecution, onBack, globalUrl, onExecutionUpdate, selectedAction, executeWorkflow }) => {
  const [execution, setExecution] = useState(initialExecution);
  const [status, setStatus] = useState(STATUS_CONFIG[execution.status] || STATUS_CONFIG.EXECUTING);
  const [validResult, setValidResult] = useState("{}")

  const abortExecution = async () => {
    try {
      await fetch(`${globalUrl}/api/v1/workflows/${execution.workflow.id}/executions/${execution.execution_id}/abort`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }).then((response) => {
        if (response.ok) {
          const updatedExecution = {
            ...execution,
            status: "ABORTED",
          };
          setExecution(updatedExecution);
          onExecutionUpdate(updatedExecution);
        }
      });

    } catch (error) {
      console.log("Abort error:", error);
    }
  };

  useEffect(() => {
    setStatus(STATUS_CONFIG[execution.status] || STATUS_CONFIG.EXECUTING);
  }, [execution]);

  const pollExecutionStatus = useCallback(async () => {
    try {
      const response = await fetch(`${globalUrl}/api/v1/streams/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          execution_id: execution.execution_id,
          authorization: execution.authorization,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const currentStatus = data.results?.[0]?.status || 'EXECUTING';

        const updatedExecution = {
          ...execution,
          ...data,
          status: currentStatus
        };

        setExecution(updatedExecution);
        onExecutionUpdate(updatedExecution);

      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [execution, globalUrl, onExecutionUpdate]);

  useEffect(() => {
    let pollTimeout;
    if (execution.status === 'EXECUTING') {
      pollTimeout = setTimeout(() => pollExecutionStatus(), 3000);
    }

    if (execution?.results?.length === 1) {
      setValidResult(JSON.parse(execution?.results[0]?.result || "{}"))
    }

    return () => clearTimeout(pollTimeout);
  }, [execution.status, pollExecutionStatus]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #454545'
      }}>
        <IconButton onClick={onBack} size="small" sx={{ mr: 2 }}>
          <ArrowBack fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ color: '#E0E0E0', mr: 2 }}>
          Execution Details
        </Typography>
        {status.icon()}
        <Typography variant="body2" sx={{ ml: 1, color: status.color }}>
          {status.label}
        </Typography>

        <Box sx={{ ml: 'auto' }}>
          {execution.status === "EXECUTING" && (
            <Tooltip title="Abort workflow" placement="top">
              <IconButton
                size="small"
                onClick={abortExecution}
                sx={{ color: theme.palette.error.main }}
              >
                <PauseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Rerun workflow (uses same startnode as the original)" placement="top">
            <IconButton
              size="small"
              onClick={() => {
                ExecuteWorkflow(
                  execution,
                  globalUrl
                );
              }}
              sx={{ color: theme.palette.primary.main }}
            >
              <CachedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
            Started at
          </Typography>
          <Typography variant="body2">
            {new Date(execution.started_at * 1000).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
            Execution ID
          </Typography>
          <Typography variant="body2" sx={{
            backgroundColor: '#2A2A2A',
            p: 1,
            borderRadius: 1,
            fontFamily: 'monospace'
          }}>
            {execution.execution_id}
          </Typography>
        </Box>

        <Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
              Result
            </Typography>
            <Box sx={{
              backgroundColor: '#2A2A2A',
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <pre style={{
                margin: 0,
                padding: '1rem',
                fontSize: '12px',
                color: status.color,
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {execution?.status === 'EXECUTING' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                    <Typography sx={{ ml: 2, color: '#888' }}>Executing...</Typography>
                  </Box>
                ) : (
                  execution?.results?.length === 1 ?
                    <ReactJson
                      src={validResult}
                      theme={theme.palette.jsonTheme}
                      style={{
                        borderRadius: 5,
                        border: `2px solid ${theme.palette.inputColor}`,
                        padding: 10,
                        maxHeight: 450,
                        minheight: 450,
                        overflow: "auto",
                        minWidth: 450,
                        maxWidth: "100%",
                        zIndex: 1200
                      }}
                      enableClipboard={(copy) => {
                        handleReactJsonClipboard(copy);
                      }}
                      collapsed={false}
                      displayDataTypes={false}
                      onSelect={(select) => {
                        var basename = "exec"
                        if (selectedAction !== undefined && selectedAction !== null && Object.keys(selectedAction).length !== 0) {
                          basename = selectedAction.label.toLowerCase().replaceAll(" ", "_")
                        }
                        HandleJsonCopy(validResult, select, basename)
                      }}
                      name={"JSON autocompletion"}
                    /> :
                    <ReactJson
                      src={{}}
                      theme={theme.palette.jsonTheme}
                      style={{
                        borderRadius: 5,
                        border: `2px solid ${theme.palette.inputColor}`,
                        padding: 10,
                        maxHeight: 450,
                        minheight: 450,
                        overflow: "auto",
                        minWidth: 450,
                        maxWidth: "100%",
                        zIndex: 1200
                      }}
                      collapsed={false}
                      enableClipboard={(copy) => { }}
                      displayDataTypes={false}
                      name={"JSON autocompletion"}
                    />
                )}
              </pre>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
const ExecutionPanel = ({
  workflow,
  globalUrl,
  onClose,
  currentExecution,
  mainAction
}) => {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleExecutionUpdate = useCallback((updatedExecution) => {
    setExecutions(prevExecutions => {
      const updatedExecutions = [...prevExecutions];
      const index = updatedExecutions.findIndex(
        e => e.execution_id === updatedExecution.execution_id
      );
      if (index !== -1) {
        updatedExecutions[index] = updatedExecution;
      }
      return updatedExecutions;
    });
  }, []);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${globalUrl}/api/v2/workflows/${workflow.id}/executions`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions);

        const urlParams = new URLSearchParams(window.location.search);
        const executionId = urlParams.get('execution_id');
        if (executionId) {
          const execution = data.executions.find(e => e.execution_id === executionId);
          if (execution) {
            setSelectedExecution(execution);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
    }
  }, [workflow.id, globalUrl]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  useEffect(() => {
    if (currentExecution?.execution_id) {
      setExecutions(prev => {
        const existingIndex = prev.findIndex(e => e.execution_id === currentExecution.execution_id);
        if (existingIndex === -1) {
          return [currentExecution, ...prev];
        }
        const updated = [...prev];
        updated[existingIndex] = currentExecution;
        return updated;
      });
      setSelectedExecution(currentExecution);
    }
  }, [currentExecution]);

  return (
    <Box
      sx={{
        position: 'relative',
        height: "fit-content",
        backgroundColor: '#1E1E1E',
        borderTop: '1px solid #454545',
        overflow: 'hidden',
        color: '#CCCCCC',
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {loading && !executions.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={24} />
        </Box>
      ) : selectedExecution ? (
        <ExecutionDetail
          execution={selectedExecution}
          onBack={() => {
            setSelectedExecution(null);
            const url = new URL(window.location);
            url.searchParams.delete('execution_id');
            window.history.pushState({}, '', url);
            fetchExecutions();
          }}
          globalUrl={globalUrl}
          selecteAction={mainAction}
          onExecutionUpdate={handleExecutionUpdate}
        />
      ) : (
        <>
          <Box sx={{
            p: 2,
            borderBottom: '1px solid #454545',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#E0E0E0' }}>
              Execution History
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: '#888' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <ExecutionsList
              executions={executions}
              onSelectExecution={(execution) => {
                setSelectedExecution(execution);
                const url = new URL(window.location);
                url.searchParams.set('execution_id', execution.execution_id);
                window.history.pushState({}, '', url);
              }}
              activeExecutionId={currentExecution?.execution_id}
            />
          </Box>
        </>
      )}
    </Box>
  );
};


export default ExecutionPanel;
