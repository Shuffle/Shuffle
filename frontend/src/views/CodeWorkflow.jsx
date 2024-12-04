import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button, Box, Typography, Paper, Toolbar, Divider, CircularProgress } from '@mui/material';

import { 
	PlayArrow as PlayArrowIcon,
	Save as SaveIcon,
	History as HistoryIcon
} from '@mui/icons-material';

import ExecutionPanel from '../components/ExecutionPanel.jsx';
import ShuffleCodeEditor from "../components/ShuffleCodeEditor1.jsx";

const CodeWorkflow = (defaultprops) => {
    const { serverside, userdata, globalUrl, isLoaded, isLoggedIn, surfaceColor, inputColor, ...props } = defaultprops;

    const [workflow, setWorkflow] = useState({});

    const [showExecutions, setShowExecutions] = useState(false);
    // In CodeWorkflow, add this state
    const [panelHeight, setPanelHeight] = useState(400);
    const [executions, setExecutions] = useState([]);
    const [currentExecution, setCurrentExecution] = useState(null);
    const [mainAction, setMainAction] = useState(null);
    const editorRef = useRef(null);
    const [apiKey, setApiKey] = useState("");

    const [editorData, setEditorData] = React.useState({
        "name": "",
        "value": "",
        "field_number": -1,
        "actionlist": [],
        "field_id": "",
    })

    const getSettings = async () => {
        try {
            const response = await fetch(`${globalUrl}/api/v1/getsettings`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
            });

            if (response.status !== 200) {
                console.log("Status not 200 for getsettings :O!");
                if (response.status >= 500) {
                    toast("Something went wrong while loading the settings. Please reload.")
                }
                return null;
            }

            const responseJson = await response.json();
            setApiKey(responseJson.apikey);
            console.log("API Key: ", responseJson.apikey);

            return responseJson.apikey;
        } catch (error) {
            console.log("Get settings error: ", error.toString());
            return null;
        }
    }
    // Calculate editor height based on execution panel visibility
    const getEditorHeight = () => {
        return `calc(100vh - ${showExecutions ? `${panelHeight + 40}px` : '40px'})`;
    };

    let url = window.location.pathname;
    const workflowId = url.split("/")[2];

    const getWorkflow = async (workflow_id, sourcenode) => {
        try {
            const response = await fetch(`${globalUrl}/api/v1/workflows/${workflow_id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
            });
    
            if (response.status !== 200) {
                console.log("Status not 200 for workflows :O!");
                if (response.status >= 500) {
                    toast("Something went wrong while loading the workflow. Please reload.")
                }
            }
    
            const responseJson = await response.json();
            setWorkflow(responseJson);
            
            for (let i = 0; i < responseJson.actions.length; i++) {
                if (responseJson.actions[i].app_id === "3e320a20966d33c9b7e6790b2705f0bf") {
                    console.log("Setting code to: ", responseJson.actions[i].parameters[0].value);
                    setCode(responseJson.actions[i].parameters[0].value);
                    setMainAction(responseJson.actions[i]);
                    
                    if (responseJson.actions[i].parameters[0].value.length === 0) {
                        // fetch API key of the user
                        const result = await getSettings();

                        console.log("accessible result: ", result);

                        // await setCode(`
                        //     from shufflepy import Shuffle
                            
                        //     shuffle = Shuffle(
                        //         "${result}",
                        //         url='https://shuffler.io',
                        //     )
                        //     `
                        // );
                    }
                    break;
                }
            }
        } catch (error) {
            console.log("Get workflows error: ", error.toString());
        }
    };

    useEffect(() => {
        getWorkflow(workflowId);
    }, []);

    // In CodeWorkflow component, add this effect:
    useEffect(() => {
        if (workflow.id) {
            // Check URL for execution_id parameter
            const urlParams = new URLSearchParams(window.location.search);
            const executionId = urlParams.get('execution_id');
            if (executionId) {
                setShowExecutions(true); // Show the panel if execution_id is present
            }
        }
    }, [workflow]);

    const [code, setCode] = useState("");
    const [testResult, setTestResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const saveLatestWorkflow = () => {
        let newWorkflow = workflow;

        console.log("Workflow actions: ", newWorkflow.actions);

        // find the latest "Shuffle tools fork" node
        for (let i = 0; i < newWorkflow.actions.length; i++) {
            console.log("Actios: ", newWorkflow.actions[i]);
            if (newWorkflow.actions[i].app_id === "3e320a20966d33c9b7e6790b2705f0bf") {
                // update the code
                console.log("Updating code: ", code);
                newWorkflow.actions[i].parameters[0].value = code;
                break;
            }
        }

        fetch(`${globalUrl}/api/v1/workflows/${workflow.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify(newWorkflow),
        }).then((response) => {
            if (response.status !== 200) {
                console.log("Status not 200 for workflows :O!");
                toast("Something went wrong while saving the workflow. Please try again.", { type: "error" });
            } else if (response.status === 200) {
                toast("Workflow saved successfully!");
            }
        });
    };

    const getParents = async () => {
        return [
            {
                "label": "Execution Argument",
                "type": "INTERNAL"
            }
        ]
    }

    const handleRunCode = async () => {
        saveLatestWorkflow();
        setLoading(true);
        setError("");

        let start_node = "";

        for (let i = 0; i < workflow.actions.length; i++) {
            if (workflow.actions[i].isStartNode) {
                start_node = workflow.actions[i].id;
            }
        }

        try {
            const response = await fetch(`${globalUrl}/api/v1/workflows/${workflow.id}/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    "start": start_node,
                    "execution_arguments": "",
                }),
            });

            if (response.ok) {
                const responseJson = await response.json();
                const newExecution = {
                    execution_id: responseJson.execution_id,
                    authorization: responseJson.authorization,
                    status: 'EXECUTING',
                    started_at: new Date().toISOString()
                };
                setShowExecutions(true);
                setCurrentExecution(newExecution);
            }

        } catch (error) {
            console.log("Error: ", error);
            setError(error.toString());
        } finally {
            setLoading(false);
        }
    };


    const handleSaveCode = async () => {
        saveLatestWorkflow();
    };

    const handleEditorDidMount = (editor, monaco) => {
        if (monaco.languages && monaco.languages.python) {
            if (monaco.languages.python.pythonDefaults) {
                monaco.languages.python.pythonDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES2020,
                    allowNonTsExtensions: true
                });
            }
        }

        monaco.languages.setLanguageConfiguration('python', {
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ]
        });
    };

    const handleEditorChange = (value) => {
        setCode(value);
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh', // Set to full viewport height
            backgroundColor: '#252526',
            marginLeft: '100px',
        }}>
            {/* IDE-like toolbar */}
            <Toolbar
                variant="dense"
                sx={{
                    backgroundColor: '#333333',
                    borderBottom: '1px solid #454545',
                    minHeight: '40px',
                    px: 1,
                    flex: '0 0 auto' // Prevent toolbar from flexing
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: '#CCCCCC',
                        marginRight: 2
                    }}
                >
                    {workflow.name || 'Untitled Workflow'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={handleRunCode}
                        disabled={loading}
                        startIcon={<PlayArrowIcon />}
                        sx={{
                            backgroundColor: '#0098FF',
                            '&:hover': {
                                backgroundColor: '#0076CE'
                            },
                            textTransform: 'none',
                            minWidth: '80px'
                        }}
                    >
                        {loading ? 'Running...' : 'Run'}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => setShowExecutions(true)}
                        sx={{
                            color: '#CCCCCC',
                            borderColor: '#454545',
                            '&:hover': {
                                borderColor: '#666666',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            },
                            textTransform: 'none'
                        }}
                    >
                        Show Executions
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleSaveCode}
                        startIcon={<SaveIcon />}
                        sx={{
                            color: '#CCCCCC',
                            borderColor: '#454545',
                            '&:hover': {
                                borderColor: '#666666',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            },
                            textTransform: 'none',
                            marginLeft: 1
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Toolbar>

            {/* Editor container */}
            <Box sx={{
                height: getEditorHeight(),
                // flex: '1 1 auto', // Allow editor to grow and shrink
                // minHeight: 0, // Important for flex child
                transition: 'height 0.2s ease-in-out',
                position: 'relative' // Needed for Editor's absolute positioning
            }}>
                {workflow && mainAction ? (
                    <ShuffleCodeEditor
                        expansionModalOpen={true}
                        setExpansionModalOpen={true}
                        isCloud={true}
                        globalUrl={globalUrl}
                        workflowExecutions={executions}
                        getParents={getParents}
                        selectedAction={mainAction}
                        aiSubmit={() => { }}
                        toolsAppId={mainAction.app_id}
                        codedata={code}
                        setcodedata={setCode}
                        parameterName={editorData.name}
                        fieldCount={editorData.field_number}
                        actionlist={editorData.actionlist}
                        fieldname={editorData.field_id}
                        changeActionParameterCodeMirror={() => { }}
                        activeDialog={() => { }}
                        setActiveDialog={() => { }}
                        fullScreenMode={true}
                    />
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* <Editor
                    height="100%" // Take full height of container
                    language="python"
                    theme="vs-dark"
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineHeight: 24,
                        fontFamily: "'JetBrains Mono', Consolas, monospace",
                        fontLigatures: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        contextmenu: false,
                        wordWrap: 'on',
                        snippetSuggestions: 'top',
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: false
                        },
                        intellisenseOptions: {
                            includeAutoCompletionsFromLanguageFile: true,
                            maxCompletionItems: 10
                        }
                    }}
                /> */}
            </Box>

            {/* Create an input element called "copy_element_shuffle" that is not visible */}
            <input type="text" id="copy_element_shuffle" style={{ position: "absolute", left: "-9999px" }} />

            {/* Results Panel */}
            {(error || testResult) && (
                <Box sx={{
                    height: '200px',
                    backgroundColor: '#1E1E1E',
                    borderTop: '1px solid #454545',
                    overflow: 'auto',
                    flex: '0 0 auto' // Prevent panel from flexing
                }}>
                    {error && (
                        <Box sx={{ p: 2, color: '#f44336' }}>
                            <Typography variant="subtitle2">Error:</Typography>
                            <pre style={{ margin: 0 }}>{error}</pre>
                        </Box>
                    )}
                    {testResult && (
                        <Box sx={{ p: 2, color: '#4caf50' }}>
                            <Typography variant="subtitle2">Test Result:</Typography>
                            <pre style={{ margin: 0 }}>{JSON.stringify(testResult, null, 2)}</pre>
                        </Box>
                    )}
                </Box>
            )}

            {/* In CodeWorkflow component */}
            {showExecutions && (
                <ExecutionPanel
                    workflow={workflow}
                    globalUrl={globalUrl}
                    onClose={() => setShowExecutions(false)}
                    currentExecution={currentExecution}
                    height={panelHeight}
                    onHeightChange={setPanelHeight}  // Add this prop to handle height updates
                    mainAction={mainAction}
                />
            )}

        </Box>
    );
};

export default CodeWorkflow;
