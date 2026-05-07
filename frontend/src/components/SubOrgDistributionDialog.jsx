import React, { useState, useContext } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    InputAdornment,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { Context } from "../context/ContextApi.jsx";
import { getTheme } from "../theme.jsx";

/**
 * A reusable dialog for selecting/distributing sub-organizations.
 *
 * Props:
 *   open               {boolean}      - controls dialog visibility
 *   onClose            {function}     - called on Cancel or backdrop click (no args)
 *   title              {string}       - dialog title text
 *   extraInfo          {string}       - secondary line below the title (e.g. "Selected Key: xxx")
 *   orgs               {Array}        - ordered array of { id, name, image? } objects to display
 *   selectedOrgIds     {string[]}     - currently selected org IDs (controlled)
 *   onSelectionChange  {function}     - called with a updater fn (prev => next) when selection changes
 *   onSave             {function}     - called with the final selectedOrgIds array when Save is clicked
 *   disabled           {boolean}      - disables checkboxes and Save button (default: false)
 */
const SubOrgDistributionDialog = ({
    open,
    onClose,
    title,
    extraInfo = null,
    orgs = [],
    selectedOrgIds = [],
    onSelectionChange,
    onSave,
    disabled = false,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const { themeMode, brandColor } = useContext(Context);
    const theme = getTheme(themeMode, brandColor);

    const safeOrgs = orgs || [];

    const filteredOrgs = safeOrgs.filter(
        o => o && o.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectAll = () => {
        if (searchQuery) {
            const filteredIds = filteredOrgs.map(o => o.id);
            onSelectionChange(prev => [...new Set([...prev, ...filteredIds])]);
        } else {
            const allIds = safeOrgs.map(o => o.id);
            onSelectionChange(prev => [...new Set([...prev, ...allIds])]);
        }
    };

    const handleDeselectAll = () => {
        if (searchQuery) {
            const filteredIds = filteredOrgs.map(o => o.id);
            onSelectionChange(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            onSelectionChange([]);
        }
    };

    const handleToggle = (id) => {
        if (disabled) return;
        onSelectionChange(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleClose = () => {
        setSearchQuery("");
        onClose();
    };

    const filteredSelected = filteredOrgs.filter(o => selectedOrgIds.includes(o.id)).length;
    const countText = searchQuery
        ? `${filteredSelected} of ${filteredOrgs.length} filtered selected`
        : `${selectedOrgIds.length} of ${safeOrgs.length} selected`;

    const imageSize = 22;
    const imageStyle = { width: imageSize, height: imageSize, pointerEvents: "none", marginRight: 10 };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                    border: theme?.palette?.DialogStyle?.border,
                    fontFamily: theme?.typography?.fontFamily,
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    zIndex: 1000,
                    height: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    "& .MuiDialogContent-root": {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    },
                    "& .MuiDialogTitle-root": {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    },
                    "& .MuiDialogActions-root": {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                    },
                },
            }}
        >
            <DialogTitle>
                <Typography variant="h6" color="textPrimary" style={{ textTransform: "none" }}>
                    {title}
                </Typography>
                {extraInfo && (
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: 2 }}>
                        {extraInfo}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden", pt: "8px !important" }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search sub-organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon style={{ opacity: 0.5 }} />
                            </InputAdornment>
                        ),
                        style: { color: theme.palette.textFieldStyle?.color },
                    }}
                    style={{ backgroundColor: theme.palette.textFieldStyle?.backgroundColor, flexShrink: 0 }}
                />

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        style={{ textTransform: "none" }}
                        onClick={handleSelectAll}
                    >
                        Select All{searchQuery ? " Filtered" : ""}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        style={{ textTransform: "none" }}
                        onClick={handleDeselectAll}
                    >
                        Deselect All{searchQuery ? " Filtered" : ""}
                    </Button>
                    <Typography variant="body2" color="textSecondary" style={{ marginLeft: "auto" }}>
                        {countText}
                    </Typography>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    border: theme.palette.defaultBorder,
                    borderRadius: 4,
                    scrollbarColor: theme.palette.scrollbarColorTransparent,
                    scrollbarWidth: "thin",
                }}>
                    <List dense sx={{ py: 0 }}>
                        {filteredOrgs.map((org, index) => {
                            const isSelected = selectedOrgIds.includes(org.id);
                            const hasImage = org.image !== undefined;
                            return (
                                <ListItem
                                    key={org.id}
                                    onClick={() => handleToggle(org.id)}
                                    sx={{
                                        cursor: disabled ? "default" : "pointer",
                                        backgroundColor: index % 2 === 0
                                            ? "transparent"
                                            : themeMode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                                        "&:hover": {
                                            backgroundColor: themeMode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                        },
                                    }}
                                >
                                    <Checkbox
                                        edge="start"
                                        checked={isSelected}
                                        tabIndex={-1}
                                        disableRipple
                                        color="primary"
                                        disabled={disabled}
                                    />
                                    {hasImage && (
                                        org.image === "" ? (
                                            <img alt={org.name} src={theme.palette.defaultImage} style={imageStyle} />
                                        ) : (
                                            <img alt={org.name} src={org.image} style={imageStyle} />
                                        )
                                    )}
                                    <ListItemText
                                        primary={org.name}
                                    />
                                </ListItem>
                            );
                        })}
                        {filteredOrgs.length === 0 && (
                            <ListItem>
                                <ListItemText
                                    primary="No sub-organizations found"
                                    style={{ textAlign: "center", opacity: 0.5 }}
                                />
                            </ListItem>
                        )}
                    </List>
                </div>
            </DialogContent>

            <Box sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                p: 2,
                borderTop: theme.palette.defaultBorder,
                backgroundColor: theme.palette.platformColor,
            }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        onClick={handleClose}
                        style={{ textTransform: "none", color: theme.palette.text.primary }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={disabled}
                        style={{ textTransform: "none" }}
                        onClick={() => {
                            onSave(selectedOrgIds);
                            setSearchQuery("");
                        }}
                    >
                        Save Changes
                    </Button>
                </div>
            </Box>
        </Dialog>
    );
};

export default SubOrgDistributionDialog;
