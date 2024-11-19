import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import {
    TextField,
    Button,
    Typography,
    MenuItem,
    Select,
    Tabs,
    Tab,
    Grid,
    Paper,
    ButtonBase,
    InputAdornment,
    Box,
    CircularProgress,
    Checkbox,
    Tooltip,
    IconButton,
} from "@mui/material";

import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import GridOnIcon from '@mui/icons-material/GridOn';
import ListIcon from '@mui/icons-material/List';
import PublishIcon from '@mui/icons-material/Publish';
import GetAppIcon from '@mui/icons-material/GetApp';


// Workflow Card Component
const WorkflowCard = ({ data, index, mouseHoverIndex, setMouseHoverIndex }) => {
    return (
        <Grid item xs={12}>
            <Paper
                elevation={0}
                style={{
                    backgroundColor: mouseHoverIndex === index ? "rgba(26, 26, 26, 1)" : "#1A1A1A",
                    color: "rgba(241, 241, 241, 1)",
                    cursor: "pointer",
                    position: "relative",
                    width: 365,
                    height: 96,
                    borderRadius: 8,
                    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
                    marginBottom: 20,
                }}
                onMouseOver={() => setMouseHoverIndex(index)}
                onMouseOut={() => setMouseHoverIndex(-1)}
            >
                <ButtonBase
                    style={{
                        borderRadius: 6,
                        fontSize: 16,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "flex-start",
                        width: '100%',
                        backgroundColor: mouseHoverIndex === index ? "#2F2F2F" : "#212121"
                    }}
                >
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        width: '100%',
                        padding: 16,
                        gap: 8,
                    }}>
                        <Typography variant="h6" style={{ color: '#F1F1F1' }}>
                            {data.name}
                        </Typography>
                        <div style={{ display: 'flex', gap: 8, color: "rgba(158, 158, 158, 1)" }}>
                            {data.tags?.map((tag, index) => (
                                <span key={index}>{tag}</span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span>⚡</span>
                                <span>{data.actions || 0}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span>🔄</span>
                                <span>{data.triggers || 0}</span>
                            </div>
                        </div>
                    </div>
                </ButtonBase>
            </Paper>
        </Grid>
    );
};

const Workflows2 = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currTab, setCurrTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState([]);
    const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState("grid");

    // Mock data - replace with actual API calls
    const mockWorkflows = [
        { id: 1, name: "Workflow 1", tags: ["webhook", "alert"], actions: 2, triggers: 2 },
        { id: 2, name: "Workflow 2", tags: ["tag1", "tag2"], actions: 0, triggers: 5 },
        // Add more mock workflows as needed
    ];

    const handleTabChange = (event, newValue) => {
        setCurrTab(newValue);
    };

    const handleCreateWorkflow = () => {
        console.log("Create workflow clicked");
    };

    return (
        <div style={{
            color: "white",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            marginTop: 50,
            margin: "auto",
            maxWidth: "60%",
        }}>
            <Typography variant="h4" style={{ marginBottom: 20, paddingLeft: 15 }}>
                Workflows
            </Typography>

            <div style={{ borderBottom: '1px solid gray', marginBottom: 30 }}>
                <Tabs
                    value={currTab}
                    onChange={handleTabChange}
                    TabIndicatorProps={{ style: { height: '3px', borderRadius: 10 } }}
                >
                    <Tab label="Organization Workflows" style={{ textTransform: 'none', marginRight: 20 }} />
                    <Tab label="My Workflows" style={{ textTransform: 'none', marginRight: 20 }} />
                    <Tab label="Discover Workflow" style={{ textTransform: 'none' }} />
                </Tabs>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search workflows"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 0.7, borderRadius: 8 }}
                    InputProps={{
                        style: { borderRadius: 8 },
                        endAdornment: (
                            <InputAdornment position="end">
                                {searchQuery.length === 0 ? <Search /> :
                                    <ClearIcon
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSearchQuery('')}
                                    />
                                }
                            </InputAdornment>
                        ),
                    }}
                />

                <Select
                    fullWidth
                    variant="outlined"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    displayEmpty
                    multiple
                    style={{ flex: 0.7, maxWidth: 300 }}
                    renderValue={(selected) => selected.length ? selected.join(', ') : 'All Categories'}
                >
                    <MenuItem disabled value="">All Categories</MenuItem>
                    {/* Add category items here */}
                </Select>

                <div style={{ display: "flex", gap: 8, height: "100%" }}>
                    <Tooltip title="Explore Workflow Runs" placement="top">
                        <IconButton
                            style={{
                                color: 'white',
                                backgroundColor: '#212121',
                                borderRadius: '8px',
                                padding: '6px',
                                width: '55px',
                                height: '55px',
                            }}
                            onClick={() => navigate("/workflows/debug")}
                        >
                            <QueryStatsIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="List View" placement="top">
                        <IconButton
                            style={{
                                color: 'white',
                                backgroundColor: '#212121',
                                borderRadius: '8px',
                                padding: '6px',
                                width: '55px',
                                height: '55px',
                            }}
                            onClick={() => {
                                if (view === "grid") {
                                    setView("list");
                                } else {
                                    setView("grid");
                                }
                            }}
                        >
                            {
                                view === "list" ? <ListIcon /> : <GridOnIcon />
                            }
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Import workflows" placement="top">
                        <IconButton
                            style={{
                                color: 'white',
                                backgroundColor: '#212121',
                                borderRadius: '8px',
                                padding: '6px',
                                width: '55px',
                                height: '55px',
                            }}
                            onClick={() => {/* Add upload handling */ }}
                        >
                            <PublishIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Download ALL workflows" placement="top">
                        <IconButton
                            style={{
                                color: 'white',
                                backgroundColor: '#212121',
                                borderRadius: '8px',
                                padding: '6px',
                                width: '55px',
                                height: '55px',
                            }}
                            onClick={() => {/* Add export handling */ }}
                        >
                            <GetAppIcon />
                        </IconButton>
                    </Tooltip>
                </div>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateWorkflow}
                    style={{
                        height: "56px",
                        borderRadius: 7,
                        flex: 0.7,
                        textTransform: 'none',

                    }}
                >
                    <Add style={{ marginRight: 10 }} />
                    Create Workflow
                </Button>
            </div>

            <div style={{ minHeight: 570, overflowY: "auto", overflowX: "hidden" }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <div style={{
                        rowGap: 16,
                        columnGap: 16,
                        marginTop: 16,
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "flex-start"
                    }}>
                        {mockWorkflows.map((workflow, index) => (
                            <WorkflowCard
                                key={workflow.id}
                                data={workflow}
                                index={index}
                                mouseHoverIndex={mouseHoverIndex}
                                setMouseHoverIndex={setMouseHoverIndex}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workflows2;