import {
  Box,
  Tooltip,
  Typography,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { getTheme } from "../theme.jsx";
import { Context } from "../context/ContextApi.jsx";
import { triggers } from "../views/AngularWorkflow.jsx";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoIcon from "@mui/icons-material/Info";
import { Link, useNavigate } from "react-router-dom";
import { grey } from "../views/AngularWorkflow.jsx"

const IMAGE_UPLOAD_PLACEHOLDER = "Uploading image...";

// Helper to extract the first markdown image URL from navigation content
export const getFirstImageFromNavigation = (navigation) => {
  if (!navigation || !Array.isArray(navigation.items)) {
    return "";
  }

  for (const item of navigation.items) {
    if (!item || !Array.isArray(item.content)) {
      continue;
    }

    for (const paragraph of item.content) {
      if (typeof paragraph !== "string") {
        continue;
      }

      const match = paragraph.match(/!\[[^\]]*]\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return "";
};

// Helper function to get the correct image path based on app category
export const getCategoryImagePath = (category) => {
  if (!category) return "/images/appCategories/other.svg";
  
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes("communication")) {
    return "/images/appCategories/cases.svg";
  } else if (lowerCategory.includes("cases")) {
    return "/images/appCategories/cases.svg";
  } else if (lowerCategory.includes("network")) {
    return "/images/appCategories/network.svg";
  } else if (lowerCategory.includes("siem")) {
    return "/images/appCategories/siem.svg";
  } else if (lowerCategory.includes("edr") || lowerCategory.includes("eradication")) {
    return "/images/appCategories/edr.svg";
  } else if (lowerCategory.includes("iam")) {
    return "/images/appCategories/iam.svg";
  } else if (lowerCategory.includes("assets")) {
    return "/images/appCategories/assets.svg";
  } else if (lowerCategory.includes("intel")) {
    return "/images/appCategories/intel.svg";
  } else if (lowerCategory.includes("email")) {
    return "/images/appCategories/email.svg";
  } else if (lowerCategory.includes("webhook")) {
    return triggers.find((trigger) => trigger?.name.toLowerCase() === "webhook")?.large_image;
  } else if (lowerCategory.includes("schedule")) {
    return triggers.find((trigger) => trigger?.name.toLowerCase() === "schedule")?.large_image;
  } else if (lowerCategory.includes("pipelines")) {
    return triggers.find((trigger) => trigger?.name.toLowerCase() === "pipelines")?.large_image;
  } else if (lowerCategory.includes("shuffle workflow")) {
    return triggers.find((trigger) => trigger?.name.toLowerCase() === "shuffle workflow")?.large_image;
  } else if (lowerCategory.includes("user input")) {
    return triggers.find((trigger) => trigger?.name.toLowerCase() === "user input")?.large_image;
  } else {
    return "/images/appCategories/other.svg";
  }
};

// Skeleton component for loading state
const UsecaseCardSkeleton = ({ isArticlesTab }) => {
  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);

  // Skeleton for Articles Tab
  if (isArticlesTab) {
    return (
      <Box
        sx={{
          textDecoration: "none",
          backgroundColor: theme.palette.usecaseCardColor,
          borderRadius: "16px",
          width: {
            xs: "230px",
            sm: "320px",
          },
          minWidth: {
            xs: "230px",
            sm: "320px",
          },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header image skeleton */}
        <Skeleton
          variant="rectangular"
          height={160}
          sx={{
            width: "100%",
            bgcolor:
              themeMode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
          }}
        />

        {/* Body skeleton */}
        <Box
          sx={{
            p: 2,
            pt: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Skeleton
            variant="text"
            width="80%"
            height={26}
            sx={{
              bgcolor:
                themeMode === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
            }}
          />
          <Skeleton
            variant="text"
            width="40%"
            height={20}
            sx={{
              bgcolor:
                themeMode === "dark"
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
            }}
          />

          <Box
            sx={{
              mt: "auto",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Skeleton
              variant="rectangular"
              width={38}
              height={22}
              sx={{
                borderRadius: "12px",
                bgcolor:
                  themeMode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.06)",
              }}
            />
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              sx={{
                bgcolor:
                  themeMode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.06)",
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // Skeleton for Usecases Tab
  return (
    <Box
      sx={{
        textDecoration: "none",
        backgroundColor: theme.palette.usecaseCardColor,
        borderRadius: "16px",
        padding: {
          xs: "15px 20px",
          sm: "20px 20px",
          lg: "28px 20px",
        },
        paddingRight: {
          xs: "12px",
          lg: "14px",
        },
        paddingLeft: {
          xs: "12px",
          lg: "24px",
        },
        display: "flex",
        alignItems: "start",
        flexDirection: "column",
        width: {
          xs: "130px",
          sm: "300px",
        },
        minWidth: {
          xs: "130px",
          sm: "300px",
        },
        gap: "20px",
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0px",
            position: "relative",
          }}
        >
          {/* Source App Icon Skeleton */}
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ 
              bgcolor: themeMode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              position: "relative",
              zIndex: 1,
            }}
          />
          
          {/* Destination App Icon Skeleton */}
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            sx={{ 
              bgcolor: themeMode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              marginLeft: "-12px",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Skeleton 
            variant="rectangular" 
            width={40} 
            height={20} 
            sx={{ 
              bgcolor: themeMode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', 
              borderRadius: "16px"
            }}
          />
          <Skeleton 
            variant="circular" 
            width={24} 
            height={24} 
            sx={{ 
              bgcolor: themeMode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
            }}
          />
        </div>
      </Box>
      <Skeleton 
        variant="text" 
        width="80%" 
        height={30} 
        sx={{ 
          bgcolor: themeMode === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
        }}
      />
    </Box>
  );
};

// Card renderer for both usecases and articles
const UsecaseCard = ({ usecase, handleToggle, handleOpenDialog, handleDeleteUsecase, isArticlesTab, partnerData }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    console.log("Edit usecase:", usecase.id);
    handleClose();
  };

  const handleStar = () => {
    console.log("Star usecase:", usecase.id);
    handleClose();
  };

  const handleCardClick = (e) => {
    // Navigate to usecase detail page
    navigate(`/usecases/${usecase.id}`);
  };

  // Article Card Layout
  if (isArticlesTab) {
    return (
      <Box
        sx={{
          textDecoration: "none",
          backgroundColor: theme.palette.usecaseCardColor,
          borderRadius: "16px",
          width: {
            xs: "230px",
            sm: "320px",
          },
          minWidth: {
            xs: "230px",
            sm: "320px",
          },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            backgroundColor: theme.palette.usecaseCardHoverColor,
          },
        }}
      >
        <Box
          component="img"
          src={usecase.headerImage || "/images/no_image.png"}
          alt={usecase.name}
          sx={{
            width: "100%",
            height: 160,
            objectFit: "cover",
          }}
        />

        <Box
          sx={{
            p: 2,
            pt: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            height: "100%",
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontSize: {
                xs: "15px",
                lg: "16px",
              },
              fontWeight: 600,
              fontFamily: theme.typography.fontFamily,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {usecase.name}
          </Typography>

          {usecase.created && (
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "13px",
              }}
            >
              {new Date(usecase.created * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Typography>
          )}

          <Box
            sx={{
              mt: -1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.5,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <OpenInNewIcon
              fontSize="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${window.location.origin}/partners/${partnerData?.name.toLowerCase().replaceAll(" ", "_")}/articles/${usecase.name.toLowerCase().replaceAll(" ", "_")}`, "_blank");
              }}
              sx={{
                color: theme.palette.primary.main,
                cursor: "pointer",
              }}
            />
            <Switch
              checked={usecase.public}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle(usecase.id);
              }}
              size="medium"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#4CAF50",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#4CAF50",
                },
              }}
            />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
              size="small"
              sx={{
                color: theme.palette.text.primary,
                "&:hover": {
                  backgroundColor:
                    themeMode === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{
              sx: {
                backgroundColor: theme.palette.DialogStyle.backgroundColor,
                border: theme.palette.defaultBorder,
                borderRadius: "8px",
                boxShadow: theme.palette.DialogStyle.boxShadow,
                "& .MuiMenuItem-root": {
                  fontSize: "14px",
                  color: theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor:
                      themeMode === "dark"
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(usecase);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <EditIcon
                  fontSize="small"
                  sx={{
                    color: theme.palette.text.primary,
                    fontFamily: theme.typography.fontFamily,
                  }}
                />
              </ListItemIcon>
              <ListItemText>Edit Article</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteUsecase(usecase.id);
              }}
            >
              <ListItemIcon>
                <DeleteIcon
                  fontSize="small"
                  sx={{
                    color: theme.palette.text.primary,
                    fontFamily: theme.typography.fontFamily,
                  }}
                />
              </ListItemIcon>
              <ListItemText>Delete Article</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    );
  }

  // Usecase Card Layout
  return (
    <Box
      sx={{
        textDecoration: "none",
        backgroundColor: theme.palette.usecaseCardColor,
        borderRadius: "16px",
        padding: {
          xs: "15px 20px",
          sm: "20px 20px",
          lg: "28px 20px",
        },
        paddingRight: {
          xs: "12px",
          lg: "14px",
        },
        paddingLeft: {
          xs: "12px",
          lg: "24px",
        },
        display: "flex",
        alignItems: "start",
        flexDirection: "column",
        width: {
          xs: "130px",
          sm: "300px",
        },
        minWidth: {
          xs: "130px",
          sm: "300px",
        },
        gap: "20px",
        "&:hover": {
          backgroundColor: theme.palette.usecaseCardHoverColor,
        },
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0px",
            position: "relative",
          }}
        >
          {/* Source App Icon */}
            <Tooltip
              title={usecase.srcapp}
              placement="top"
            >
              <img
                src={usecase.srcImg}
                alt="Source"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "100%",
                  position: "relative",
                  border: `1.5px solid ${themeMode === "dark" ? "#f1f1f1" : "#333333"}`,
                  zIndex: 1,
                }}
              />
            </Tooltip>
          
          {/* Destination App Icon */}
            <Tooltip
              title={usecase.dstapp}
              placement="top"
            >
              <img
                src={usecase.dstImg || getCategoryImagePath(usecase.dstapp)}
                alt="Destination"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "100%",
                  marginLeft: "-12px",
                  border: `1.5px solid ${themeMode === "dark" ? "#f1f1f1" : "#333333"}`,
                }}
              />
            </Tooltip>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <OpenInNewIcon
              fontSize="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${window.location.origin}/usecases/${usecase.name.toLowerCase().replaceAll(" ", "_")}`, "_blank");
              }}
              sx={{
                color: theme.palette.primary.main,
                cursor: "pointer",
              }}
            />
          <Switch
            checked={usecase.public}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggle(usecase.id);
            }}
            size="medium"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#4CAF50",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#4CAF50",
              },
            }}
          />
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleClick(e);
            }}
            size="small"
            sx={{
              color: theme.palette.text.primary,
              zIndex: 20,
              "&:hover": {
                backgroundColor: themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{
              sx: {
                backgroundColor: theme.palette.DialogStyle.backgroundColor,
                border: theme.palette.defaultBorder,
                borderRadius: "8px",
                boxShadow: theme.palette.DialogStyle.boxShadow,
                "& .MuiMenuItem-root": {
                  fontSize: "14px",
                  color: theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(usecase);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <EditIcon
                  fontSize="small"
                  sx={{
                    color: theme.palette.text.primary,
                    fontFamily: theme.typography.fontFamily,
                  }}
                />
              </ListItemIcon>
              <ListItemText>Edit Usecase</ListItemText>
            </MenuItem>
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              handleDeleteUsecase(usecase.id);
            }}>
              <ListItemIcon>
                <DeleteIcon
                  fontSize="small"
                  sx={{
                    color: theme.palette.text.primary,
                    fontFamily: theme.typography.fontFamily,
                  }}
                />
              </ListItemIcon>
              <ListItemText>Delete Usecase</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </Box>
      <Typography
        sx={{
          color: theme.palette.text.primary,
          fontSize: {
            xs: "14px",
            lg: "16px",
          },
          fontWeight: 600,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        {usecase.name}
      </Typography>
    </Box>
  );
};

const PartnersUsecasesTab = ({ isCloud, globalUrl, userdata, partnerData, setPartnerData, selectedTab }) => {
  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);
  const isArticlesTab = selectedTab?.toLowerCase() === "articles";
  const entityLabel = isArticlesTab ? "Article" : "Usecase";

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [publicWorkflows, setPublicWorkflows] = useState([]);
  const [usecaseData, setUsecaseData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    mainContent: {
      title: "",
      description: "",
      categories: [],
      publicWorkflowId: "",
      sourceAppType: "",
      destinationAppType: "",
    },
    navigation: {
      items: [
        {
          name: `About ${entityLabel}`,
          content: [""],
        },
      ],
    },
    public: false,
    created: null,
  });
  
  // App categories for dropdowns
  const appCategories = [
    { value: "communication", label: "Communication" },
    { value: "cases", label: "Cases" },
    { value: "network", label: "Network" },
    { value: "siem", label: "SIEM" },
    { value: "edr", label: "EDR" },
    { value: "eradication", label: "Eradication" },
    { value: "iam", label: "IAM" },
    { value: "assets", label: "Assets" },
    { value: "intel", label: "Intel" },
    { value: "email", label: "Email" },
    {value: "webhook", label: "Webhook"},
    {value: "schedule", label: "Schedule"},
    {value: "pipelines", label: "Pipelines"},
    {value: "shuffle workflow", label: "Shuffle Workflow"},
    {value: "user input", label: "User Input"},
    { value: "other", label: "Other" }
  ];

  // Sample workflow options
  const workflowOptions = [
    "Email Analysis Workflow",
    "Incident Response Workflow",
    "Alert Triage Workflow",
    "Threat Hunting Workflow",
    "Vulnerability Management",
  ];

  useEffect(() => {
    // Set loading state to true when fetching starts
    setIsLoading(true);
    if(!isCloud || !userdata?.active_org?.is_partner) {
      // If the user is not a partner or if it's not a cloud environment do not make api call :)
      return;
    }
    // Load usecase data from API
    fetch(`${globalUrl}/api/v1/partners/${partnerData?.id}/usecases`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for PARTNER USECASES :O!");
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success !== false) {
          const usecases = responseJson.usecases.map((usecase) => ({
            id: usecase.id,
            sourceAppType: usecase.mainContent?.sourceAppType || "",
            destinationAppType: usecase.mainContent?.destinationAppType || "",
            srcImg: getCategoryImagePath(usecase.mainContent?.sourceAppType),
            dstImg: getCategoryImagePath(usecase.mainContent?.destinationAppType),
            publicWorkflowId: usecase.mainContent?.publicWorkflowId || "",
            name: usecase.mainContent?.title,
            description: usecase.mainContent?.description,
            navigation: usecase.navigation || { items: [] },
            categories: usecase.mainContent?.categories || [],
            public: usecase?.public || false,
            created: usecase?.created || null,
            headerImage: getFirstImageFromNavigation(usecase.navigation),
          }));
          if (usecases.length > 0) {
            setUsecaseData(usecases);
          } else {
            setUsecaseData([]);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        // Set loading state to false when fetching completes (success or error)
        setIsLoading(false);
      });
  }, [partnerData?.id]);

  // Sample categories
  const categoryOptions = ["Collect","Enrich", "Detect", "Respond", "Verify"];

  // Uploading image to the public bucket
  const handleImageUpload = async (imageData) => {
    const folderName = "usecase_images";
    const usecaseId = formData?.id || partnerData?.id || "usecase";

    try {
      const response = await fetch(`${globalUrl}/api/v1/image_upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          imageData,
          folder: folderName,
          id: usecaseId,
        }),
      });

      // if (response.status !== 200) {
      //   toast.error("Failed to upload image" + response?.reason);
      //   return null;
      // }

      const responseJson = await response.json();
      if (!responseJson?.success || !responseJson?.url) {
        toast.error("Failed to upload image: " + responseJson?.reason);
        return null;
      }

      return responseJson.url;
    } catch (error) {
      toast.error("Failed to upload image" + error?.message);
      return null;
    }
  };

  // This function is used to update the content with the public image url
  const updateContentWithImageUrl = (itemIndex, contentIndex, imageUrl) => {
    setFormData((prevData) => {
      const newItems = [...(prevData.navigation.items || [])];
      const item = newItems[itemIndex];
      if (!item) {
        return prevData;
      }

      const contents = [...(item.content || [])];
      const existingContent = contents[contentIndex] || "";
      const markdownImage = imageUrl ? `![image](${imageUrl})` : "";

      const placeholderIndex = existingContent.indexOf(IMAGE_UPLOAD_PLACEHOLDER);
      if (placeholderIndex !== -1) {
        const before = existingContent.slice(0, placeholderIndex);
        const after = existingContent.slice(
          placeholderIndex + IMAGE_UPLOAD_PLACEHOLDER.length,
        );

        const trimmedBefore = before.replace(/\s*$/, "");
        const needsNewline =
          trimmedBefore.length > 0 && !trimmedBefore.endsWith("\n");
        const separator = needsNewline ? "\n" : "";

        contents[contentIndex] = `${trimmedBefore}${separator}${markdownImage}${after}`;
      } else {
        const needsNewline =
          existingContent.length > 0 && !existingContent.endsWith("\n");
        const separator = needsNewline ? "\n" : "";

        contents[contentIndex] = `${existingContent}${separator}${markdownImage}`;
      }

      newItems[itemIndex] = {
        ...item,
        content: contents,
      };

      return {
        ...prevData,
        navigation: {
          items: newItems,
        },
      };
    });
  };

  // This function is used to insert the image placeholder (Uploading image...) in the content to show that the image is being uploaded
  const insertImagePlaceholder = (itemIndex, contentIndex) => {
    setFormData((prevData) => {
      const newItems = [...(prevData.navigation.items || [])];
      const item = newItems[itemIndex];
      if (!item) {
        return prevData;
      }

      const contents = [...(item.content || [])];
      const existingContent = contents[contentIndex] || "";
      const needsNewline =
        existingContent.length > 0 && !existingContent.endsWith("\n");
      const separator = needsNewline ? "\n" : "";

      contents[contentIndex] = `${existingContent}${separator}${IMAGE_UPLOAD_PLACEHOLDER}`;

      newItems[itemIndex] = {
        ...item,
        content: contents,
      };

      return {
        ...prevData,
        navigation: {
          items: newItems,
        },
      };
    });
  };

  // This function is used to process the image file and upload it to the public bucket
  const processImageFile = (imageFile, itemIndex, contentIndex) => {
    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const imageData = loadEvent.target?.result;
      if (!imageData) {
        toast.error("Failed to read image");
        updateContentWithImageUrl(itemIndex, contentIndex, "");
        return;
      }

      const imageUrl = await handleImageUpload(imageData);
      if (!imageUrl) {
        // Clean up the placeholder if upload failed
        updateContentWithImageUrl(itemIndex, contentIndex, "");
        return;
      }

      updateContentWithImageUrl(itemIndex, contentIndex, imageUrl);
    };
    reader.readAsDataURL(imageFile);
  };

  // This function is used to handle the image paste event
  const handleContentPaste = async (event, itemIndex, contentIndex) => {
    const items = event.clipboardData?.items;
    if (!items || items.length === 0) {
      return;
    }

    let imageFile = null;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (!imageFile) {
      return;
    }

    event.preventDefault();

    insertImagePlaceholder(itemIndex, contentIndex);
    processImageFile(imageFile, itemIndex, contentIndex);
  };

  // This function is used to handle the image drop event
  const handleContentDrop = async (event, itemIndex, contentIndex) => {
    event.preventDefault();

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const imageFile = Array.from(files).find((file) => file.type.startsWith("image/"));
    if (!imageFile) {
      toast.error("Failed to upload image, only images are supported");
      return;
    }

    insertImagePlaceholder(itemIndex, contentIndex);
    processImageFile(imageFile, itemIndex, contentIndex);
  };

  const getUserProfileWorkflows = (orgId) => {
    if (selectedTab === "articles") {
      return;
    }
    setIsWorkflowLoading(true);
		fetch(`${globalUrl}/api/v1/partners/${orgId}/workflows`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
		})
			.then((response) => {
				if (response.status !== 200) {
					console.log("Status not 200 for WORKFLOW EXECUTION :O!");
				}

				return response.json();
			})
			.then((responseJson) => {
				if (responseJson.success !== false) {
					setPublicWorkflows(responseJson || []);
          setIsWorkflowLoading(false);
				}else {
          toast.info(responseJson.message || "No public workflows found for this organization.");
          setPublicWorkflows([]);
        }
			})
			.catch((error) => {
				console.log(error);
        setIsWorkflowLoading(false);
			});
	}

  useEffect(() => {
    const orgId = userdata?.active_org?.id;
    if(!isCloud || !userdata?.active_org?.is_partner) {
      // If the user is not a partner or if it's not a cloud environment do not make api call :)
      return;
    }
    getUserProfileWorkflows(orgId);
  }, []);


  const handleUpdateUsecase = async (usecaseId, updatedData) => {
    try {
      // Transform the frontend data structure to match the backend expected structure
      const backendUsecaseData = {
        id: updatedData.id,
        companyInfo: {
          id: partnerData?.id.trim(),
          name: partnerData?.name.trim(),
        },
        mainContent: {
          title: updatedData.name.trim(),
          description: updatedData.description.trim(),
          categories: updatedData.categories,
          publicWorkflowId: updatedData.publicWorkflowId.trim(),
          sourceAppType: updatedData.sourceAppType.trim(),
          destinationAppType: updatedData.destinationAppType.trim(),
        },
        navigation: updatedData.navigation,
        public: updatedData.public,
        edited: Date.now(),
      };


      // return
      const response = await fetch(`${globalUrl}/api/v1/usecases/${usecaseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(backendUsecaseData),
      });

      if (response.status !== 200) {
        console.error("Failed to update usecase");
        toast.error("Failed to update usecase");
        return false;
      }

      const responseData = await response.json();
      toast.success("Usecase published status updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating usecase:", error);
      toast.error("Error updating usecase");
      return false;
    }
  };

  const handleDeleteUsecase = async (usecaseId) => {
    try {
      const response = await fetch(
        `${globalUrl}/api/v1/usecases/${usecaseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        }
      );
      if (response.status !== 200) {
        console.error("Failed to delete usecase");
        toast.error("Failed to delete usecase");
        return false;
      }
      const responseData = await response.json();
      toast.success("Usecase deleted successfully");
      // Remove the deleted usecase from the state
      setUsecaseData((prevData) =>
        prevData?.filter((usecase) => usecase.id !== usecaseId)
      );
      // Remove the usecase ID from partnerData
      setPartnerData((prevData) => ({
        ...prevData,
        usecases: prevData.usecases?.filter((id) => id !== usecaseId),
      }));
      return true;
    } catch (error) {
      console.error("Error deleting usecase:", error);
      toast.error("Error deleting usecase");
      return false;
    }
  };

  const handleToggle = async (currentId) => {
    // Find the current usecase
    const currentUsecase = usecaseData.find(usecase => usecase.id === currentId);
    if (!currentUsecase) return;

    // Optimistically update the UI
    setUsecaseData((prevData) =>
      prevData.map((usecase) =>
        usecase.id === currentId
          ? { ...usecase, public: !usecase.public }
          : usecase
      )
    );

    // Prepare the updated data
    const updatedPublishedStatus = !currentUsecase.public;
    
    // Create a copy of the usecase with updated published status
    const updatedUsecase = {
      ...currentUsecase,
      public: updatedPublishedStatus
    };
    toast.info(`Updating usecase ${updatedUsecase.name}...`,{
      autoClose: 1000,
    })
    // Send the update to the server
    const success = await handleUpdateUsecase(currentId, updatedUsecase);
    
    // If the update failed, revert the UI change
    if (!success) {
      setUsecaseData((prevData) =>
        prevData.map((usecase) =>
          usecase.id === currentId
            ? { ...usecase, public: currentUsecase.public }
            : usecase
        )
      );
    }
  };

  const handleOpenDialog = (usecase) => {
    setFormData({
      id: usecase?.id || undefined,
      companyInfo: {
        id: usecase.companyInfo?.id || "",
        name: usecase.companyInfo?.name || "",
      },
      mainContent: {
        title: usecase?.name,
        description: usecase?.description,
        categories: usecase?.categories || [],
        publicWorkflowId: usecase?.publicWorkflowId || "",
        sourceAppType: usecase?.sourceAppType || "",
        destinationAppType: usecase?.destinationAppType || "",
      },
      navigation: usecase?.navigation || {
        items: [ 
          {
            name: `About ${entityLabel}`,
            content: [""],
          },
        ],
      },
      public: usecase?.public || false,
      created: usecase?.created || Math.floor(Date.now() / 1000),
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsSubmitting(false); // Reset loading state when closing dialog
    setFormData({
      id: "",
      mainContent: {
        title: "",
        description: "",
        categories: [],
        publicWorkflowId: "",
        sourceAppType: "",
        destinationAppType: "",
      },
      navigation: {
        items: [
          {
            name: "About Usecase",
            content: [""],
          },
        ],
      },
      public: false,
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    const validationErrors = [];

    // Check for public workflow selection
    if (!isArticlesTab && (!formData.mainContent.publicWorkflowId || formData.mainContent.publicWorkflowId.trim() === "")) {
      validationErrors.push("Please select a public workflow");
    }

    if (!isArticlesTab && (!formData.mainContent.sourceAppType || formData.mainContent.sourceAppType.trim() === "")) {
      validationErrors.push("Source app type is required");
    }

    if (!isArticlesTab && (!formData.mainContent.destinationAppType || formData.mainContent.destinationAppType.trim() === "")) {
      validationErrors.push("Destination app type is required");
    }

    // Validate that source and destination are different
    if (formData.mainContent.sourceAppType && formData.mainContent.destinationAppType && 
        formData.mainContent.sourceAppType.trim() === formData.mainContent.destinationAppType.trim()) {
      validationErrors.push("Source and destination app types must be different");
    }

    // Check main content fields
    if (!formData.mainContent.title || formData.mainContent.title.trim() === "") {
      validationErrors.push("Title is required");
    } else if (formData.mainContent.title.length < 5) {
      validationErrors.push("Title must be not be less than 5 characters");
    }

    if (!formData.mainContent.description || formData.mainContent.description.trim() === "") {
      validationErrors.push("Description is required");
    }

    // Check categories
    if (!isArticlesTab && (!formData.mainContent.categories || !Array.isArray(formData.mainContent.categories) || formData.mainContent.categories.length === 0)) {
      validationErrors.push("At least one category must be selected");
    }

    // Check navigation items
    if (!formData.navigation.items || !Array.isArray(formData.navigation.items) || formData.navigation.items.length === 0) {
      validationErrors.push("Please add at least one section");
    } else {
      // Validate each section
      for (let i = 0; i < formData.navigation.items.length; i++) {
        const item = formData.navigation.items[i];
        
        if (!item.name || item.name.trim() === "") {
          validationErrors.push(`Section ${i+1} must have a name`);
        }
        
        if (!item.content || !Array.isArray(item.content) || item.content.length === 0 || 
            !item.content.some(content => content && content.trim() !== "")) {
          validationErrors.push(`Section "${item.name || i+1}" must have content`);
        }
      }
    }

    // If there are validation errors, show the first one and return
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    // Set loading state to true
    setIsSubmitting(true);

    // Get the image paths for source and destination app types
    const srcImg = getCategoryImagePath(formData.mainContent.sourceAppType);
    const dstImg = getCategoryImagePath(formData.mainContent.destinationAppType);
    
    const response = {
      ...formData,
      companyInfo: {
        id: partnerData?.id,
        name: partnerData?.name,
      },
    }

    fetch(`${globalUrl}/api/v1/usecases/${formData.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(response),
    })
    .then((res) => {
      if (res.status !== 200) {
        console.error("Failed to submit usecase");
        toast.error("Failed to submit usecase");
        setIsSubmitting(false);
        return null;
      }
      return res.json();
    })
    .then((responseData) => {
      // Reset loading state
      setIsSubmitting(false);
      
      if (responseData) {
        // Only close the dialog if the request was successful
        const usecaseData = {
          id: responseData.usecaseId.trim(),
          sourceAppType: formData.mainContent?.sourceAppType.trim() || "",
          destinationAppType: formData.mainContent?.destinationAppType.trim() || "",
          srcImg: getCategoryImagePath(formData.mainContent?.sourceAppType.trim()),
          dstImg: getCategoryImagePath(formData.mainContent?.destinationAppType.trim()),
          publicWorkflowId: formData.mainContent?.publicWorkflowId.trim() || "",
          name: formData.mainContent?.title.trim(),
          description: formData.mainContent?.description.trim(),
          categories: formData.mainContent?.categories || [],
          navigation: formData.navigation || {},
          public: formData?.public || false,
          created: formData?.created || null,
          headerImage: getFirstImageFromNavigation(formData.navigation),
        }

        setUsecaseData((prevData) => {
          // Handle case when prevData is null or undefined
          if (!prevData) {
            return [usecaseData];
          }
          
          // Check if the usecase already exists
          const existingIndex = prevData.findIndex(
            (usecase) => usecase.id === responseData.usecaseId
          );
          if (existingIndex !== -1) {
            // Update existing usecase
            const updatedData = [...prevData];
            updatedData[existingIndex] = usecaseData;
            return updatedData;
          } else {
            // Add new usecase
            return [...prevData, usecaseData];
          }
        });

        setPartnerData((prevData) => {
          // Handle case when prevData is null or undefined
          if (!prevData) {
            return {
              usecases: [responseData.usecaseId.trim()]
            };
          }
          
          return {
            ...prevData,
            usecases: [
              ...(prevData.usecases || []),
              responseData.usecaseId.trim(),
            ],
          };
        });

        // Show success message
        if(formData?.id){
          toast.success("Usecase updated successfully");
        }else{
          toast.success("Usecase created successfully, publish it with toggle button");
        }
        handleCloseDialog();
      }
    })
    .catch((error) => {
      console.error("Error submitting usecase:", error);
      toast.error("Error submitting usecase");
      // Reset loading state on error
      setIsSubmitting(false);
    });
  };

  // This is used to filter the usecases based on the selected tab
  const filteredUsecases = Array.isArray(usecaseData)
    ? usecaseData.filter((usecase) => {
        const hasWorkflowId =
          !!usecase.publicWorkflowId &&
          usecase.publicWorkflowId.toString().trim() !== "";

        if (selectedTab === "articles") {
          // Articles: only items without a public workflow ID
          return !hasWorkflowId;
        }

        if (selectedTab === "usecases") {
          // Usecases: only items with a public workflow ID
          return hasWorkflowId;
        }

        // Fallback: show all
        return true;
      })
    : [];

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "500px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "20px",
        paddingLeft: "40px",
        justifyContent: "flex-start",
      }}
    >
      {/* Add Usecase / Article Button */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          pr: 4,
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 500, color: "#FFFFFF" }}>
          {selectedTab === "usecases" && "Usecases"}
          {selectedTab === "articles" && "Articles"}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            px: 3,
            textTransform: "none",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          {isArticlesTab ? "Add Article" : "Add Usecase"}
        </Button>
      </Box>

      {/* Usecases / Articles Grid */}
      {isLoading ? (
        // Skeleton loading state
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 2,
            pt: 4,
          }}
        >
          {/* Display 4 skeleton cards while loading */}
          {[...Array(4)].map((_, index) => (
            <UsecaseCardSkeleton key={index} isArticlesTab={isArticlesTab} partnerData={partnerData} />
          ))}
        </Box>
      ) : filteredUsecases.length > 0 ? (
        // Actual data display (filtered based on public workflow ID)
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: 2,
            pt: 4,
          }}
        >
          {filteredUsecases.map((usecase) => (
            <UsecaseCard
              handleOpenDialog={handleOpenDialog}
              key={usecase.id}
              usecase={usecase}
              handleToggle={handleToggle}
              handleDeleteUsecase={handleDeleteUsecase}
              isArticlesTab={isArticlesTab}
              partnerData={partnerData}
            />
          ))}
        </Box>
      ) : (
        // Empty state
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 500,
              color: "#FFFFFF",
            }}
          >
            {isArticlesTab ? "No articles found" : "No usecases found"}
          </Typography>
        </Box>
      )}

      {/* Add Usecase Dialog */}
      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            handleCloseDialog();
          }
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            background: theme.palette.backgroundColor,
            overflow: "hidden",
            margin: 0,
            borderRadius: 8,
            border: theme.palette.defaultBorder,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: theme.palette.backgroundColor,
            borderBottom: theme.palette.defaultBorder,
            p: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: theme.palette.text.primary }}>
            {formData?.id ? "Update" : "Add New"} {entityLabel} : {formData?.public ? "Published" : "Draft"}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                background: themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ background: theme.palette.backgroundColor, p: "24px" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              paddingTop: 3,
            }}
          >
            {!isArticlesTab && (
            <FormControl>
            <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.accentColor,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Public Workflow
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => {
                    // Open workflow in new tab - adjust URL as needed
                    window.open(`${window.location.origin}/workflows/${formData.mainContent.publicWorkflowId}`, "_blank");
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Box>
              <Select
                displayEmpty
                value={
                  publicWorkflows?.find(
                    (workflow) =>
                      workflow.objectID ===
                      formData.mainContent.publicWorkflowId
                  )?.name || ""
                }
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    mainContent: {
                      ...formData.mainContent,
                      publicWorkflowId: e.target.value,
                    },
                  });
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: themeMode === "dark" ? "#666666" : "#999999" }}>
                        Select Public Workflow
                      </span>
                    );
                  }
                  // Find the workflow with the matching ID and display its name
                  if (
                    Array.isArray(publicWorkflows) &&
                    publicWorkflows.length > 0
                  ) {
                    const selectedWorkflow = publicWorkflows.find(
                      (w) => w.id === selected
                    );
                    return selectedWorkflow ? selectedWorkflow.name : selected;
                  }
                  return selected;
                }}
                sx={{
                  backgroundColor: theme.palette.usecaseDialogFieldColor,
                  height: 40,
                  color: theme.palette.text.primary,
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: theme.palette.defaultBorder,
                  },
                  "& .MuiSelect-icon": {
                    color: theme.palette.text.secondary,
                  },
                  "& .MuiSelect-select": {
                    "&.MuiInputBase-input": {
                      color: theme.palette.text.primary,
                    },
                    "&.Mui-focused": {
                      backgroundColor: "transparent",
                    },
                  },
                }}
              >
                {Array.isArray(publicWorkflows) &&
                publicWorkflows.length > 0 ? (
                  publicWorkflows.map((workflow) => (
                    <MenuItem
                      key={workflow.id}
                      value={workflow.objectID}
                      sx={{
                        fontSize: "16px",
                        "&.Mui-selected": {
                          backgroundColor: themeMode === "dark" ? "rgba(255, 133, 68, 0.08)" : "rgba(255, 133, 68, 0.15)",
                        },
                        "&:hover": {
                          backgroundColor: themeMode === "dark" ? "rgba(255, 133, 68, 0.04)" : "rgba(255, 133, 68, 0.1)",
                        },
                      }}
                    >
                      {workflow.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="" sx={{ fontSize: "16px" }}>
                    No workflows available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            )}

	  		    {/* Other data selection (use all data types) */}
            {!isArticlesTab && (
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <Typography
                  sx={{
                    color: grey,
                    mb: 1,
                    fontSize: "16px",
                  }}
                >
	  				<b>Coming soon:</b> Files (detection)
                </Typography>
              </FormControl> 

              <FormControl fullWidth>
                <Typography
                  sx={{
                    color: grey,
                    mb: 1,
                    fontSize: "16px",
                  }}
                >
	  				<b>Coming soon:</b> Datastore category (threatlists)	
                </Typography>
              </FormControl>
            </Box>
            )}

            {/* App Type Selection */}
            {!isArticlesTab && (
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mt: isArticlesTab ? 0 : 2 }}>
              <FormControl fullWidth>
                <Typography
                  sx={{
                    color: "#ff8544",
                    mb: 1,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Source App Type
                </Typography>
                <Select
                  displayEmpty
                  value={formData.mainContent.sourceAppType}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mainContent: {
                        ...formData.mainContent,
                        sourceAppType: e.target.value,
                      },
                    });
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: themeMode === "dark" ? "#666666" : "#999999" }}>
                          Select Source App Type
                        </span>
                      );
                    }
                    const selectedCategory = appCategories.find(
                      (cat) => cat.value === selected
                    );
                    return selectedCategory ? selectedCategory.label : selected;
                  }}
                  sx={{
                    backgroundColor: theme.palette.usecaseDialogFieldColor,
                    height: 40,
                    color: theme.palette.text.primary,
                    "& .MuiSelect-icon": {
                      color: "#ff8544",
                    },
                    "& .MuiSelect-select": {
                      "&.MuiInputBase-input": {
                        color: theme.palette.text.primary,
                      },
                      "&.Mui-focused": {
                        backgroundColor: "transparent",
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: "16px" }}>
                    <em>None</em>
                  </MenuItem>
                  {appCategories.map((category) => (
                    <MenuItem
                      key={category.value}
                      value={category.value}
                      sx={{
                        fontSize: "16px",
                        "&.Mui-selected": {
                          backgroundColor: "rgba(255, 133, 68, 0.08)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(255, 133, 68, 0.04)",
                        },
                      }}
                    >
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>


              <FormControl fullWidth>
                <Typography
                  sx={{
                    color: "#ff8544",
                    mb: 1,
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Destination App Type
                </Typography>
                <Select
                  displayEmpty
                  value={formData.mainContent.destinationAppType}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      mainContent: {
                        ...formData.mainContent,
                        destinationAppType: e.target.value,
                      },
                    });
                  }}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span style={{ color: themeMode === "dark" ? "#666666" : "#999999" }}>
                          Select Destination App Type
                        </span>
                      );
                    }
                    const selectedCategory = appCategories.find(
                      (cat) => cat.value === selected
                    );
                    return selectedCategory ? selectedCategory.label : selected;
                  }}
                  sx={{
                    backgroundColor: theme.palette.usecaseDialogFieldColor,
                    height: 40,
                    color: theme.palette.text.primary,
                    "& .MuiSelect-icon": {
                      color: "#ff8544",
                    },
                    "& .MuiSelect-select": {
                      "&.MuiInputBase-input": {
                        color: theme.palette.text.primary,
                      },
                      "&.Mui-focused": {
                        backgroundColor: "transparent",
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: "16px" }}>
                    <em>None</em>
                  </MenuItem>
                  {appCategories.map((category) => (
                    <MenuItem
                      key={category.value}
                      value={category.value}
                      sx={{
                        fontSize: "16px",
                        "&.Mui-selected": {
                          backgroundColor: "rgba(255, 133, 68, 0.08)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(255, 133, 68, 0.04)",
                        },
                      }}
                    >
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            )}

            <Box sx={{ mb: 2, mt: 2 }}>
              <Typography
                sx={{
                  color: "#ff8544",
                  mb: 2,
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                Main Content
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl>
                  <Typography
                    sx={{ color: theme.palette.text.primary, mb: 1, fontSize: "14px" }}
                  >
                    Title
                  </Typography>
                  <TextField
                    placeholder="Enter Title"
                    value={formData.mainContent.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainContent: {
                          ...formData.mainContent,
                          title: e.target.value,
                        },
                      })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 40,
                        backgroundColor: theme.palette.usecaseDialogFieldColor,
                        color: theme.palette.text.primary,
                        "& fieldset": { border: theme.palette.defaultBorder },
                      },
                    }}
                  />
                </FormControl>
                <FormControl>
                  <Typography
                    sx={{ color: theme.palette.text.primary, mb: 1, fontSize: "14px" }}
                  >
                    Description
                  </Typography>
                  <TextField
                    placeholder="Enter Description"
                    multiline
                    rows={5}
                    value={formData.mainContent.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainContent: {
                          ...formData.mainContent,
                          description: e.target.value,
                        },
                      })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: theme.palette.usecaseDialogFieldColor,
                        p: 1.5,
                        color: theme.palette.text.primary,
                        "& fieldset": { border: theme.palette.defaultBorder },
                      },
                    }}
                  />
                </FormControl>
                {!isArticlesTab && (
                <FormControl>
                  <Typography
                    sx={{ color: theme.palette.text.primary, mb: 1, fontSize: "14px" }}
                  >
                    Categories
                  </Typography>
                  <Select
                    multiple
                    displayEmpty
                    value={formData.mainContent.categories || []}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainContent: {
                          ...formData.mainContent,
                          categories: e.target.value,
                        },
                      })
                    }
                    renderValue={(selected) => {
                      if (
                        !selected ||
                        (Array.isArray(selected) && selected.length === 0)
                      ) {
                        return (
                          <span style={{ color: themeMode === "dark" ? "#666666" : "#999999" }}>
                            Select Categories
                          </span>
                        );
                      }
                      return selected.join(", ");
                    }}
                    sx={{
                      backgroundColor: theme.palette.usecaseDialogFieldColor,
                      height: 40,
                      color: theme.palette.text.primary,
                      "& .MuiSelect-icon": {
                        color: "#ff8544",
                      },
                      "& .MuiChip-root": {
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.chipStyle.backgroundColor,
                        margin: "2px",
                      },
                      "& .MuiSelect-select": {
                        "&.MuiInputBase-input": {
                          color: theme.palette.text.primary,
                        },
                        "&.Mui-focused": {
                          backgroundColor: "transparent",
                        },
                      },
                    }}
                  >
                    {categoryOptions.map((category) => (
                      <MenuItem
                        key={category}
                        value={category}
                        sx={{
                          fontSize: "14px",
                          "&.Mui-selected": {
                            backgroundColor: "rgba(255, 133, 68, 0.08)",
                          },
                          "&:hover": {
                            backgroundColor: "rgba(255, 133, 68, 0.04)",
                          },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={
                            Array.isArray(formData.mainContent.categories) &&
                            formData.mainContent.categories.includes(category)
                          }
                        />
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                )}
              </Box>
            </Box>

            {/* Navigation Items Section */}
            <Box>
              <Typography
                sx={{
                  color: "#ff8544",
                  mb: 2,
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                Navigation Items
              </Typography>
              {formData.navigation.items.map((item, itemIndex) => (
                <Box
                  key={itemIndex}
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: theme.palette.usecaseDialogFieldColor,
                    borderRadius: 1,
                    border: theme.palette.defaultBorder,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      gap: 1,
                    }}
                  >
                    <TextField
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...formData.navigation.items];
                        newItems[itemIndex].name = e.target.value;
                        setFormData({
                          ...formData,
                          navigation: { items: newItems },
                        });
                      }}
                      placeholder="Section Name"
                      sx={{
                        flex: 1,
                        "& .MuiOutlinedInput-root": {
                          height: 40,
                          backgroundColor: theme.palette.usecaseDialogFieldColor,
                          color: theme.palette.text.primary,
                          "& fieldset": { border: theme.palette.defaultBorder },
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        onClick={() => {
                          if (itemIndex > 0) {
                            const newItems = [...formData.navigation.items];
                            [newItems[itemIndex - 1], newItems[itemIndex]] = [
                              newItems[itemIndex],
                              newItems[itemIndex - 1],
                            ];
                            setFormData({
                              ...formData,
                              navigation: { items: newItems },
                            });
                          }
                        }}
                        disabled={itemIndex === 0}
                        sx={{
                          color: theme.palette.text.secondary,
                          "&:not(:disabled):hover": {
                            backgroundColor: themeMode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        <KeyboardArrowUpIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          if (
                            itemIndex <
                            formData.navigation.items.length - 1
                          ) {
                            const newItems = [...formData.navigation.items];
                            [newItems[itemIndex], newItems[itemIndex + 1]] = [
                              newItems[itemIndex + 1],
                              newItems[itemIndex],
                            ];
                            setFormData({
                              ...formData,
                              navigation: { items: newItems },
                            });
                          }
                        }}
                        disabled={
                          itemIndex === formData.navigation.items.length - 1
                        }
                        sx={{
                          color: theme.palette.text.secondary,
                          "&:not(:disabled):hover": {
                            backgroundColor: themeMode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          const newItems = formData.navigation.items?.filter(
                            (_, i) => i !== itemIndex
                          );
                          setFormData({
                            ...formData,
                            navigation: { items: newItems },
                          });
                        }}
                        sx={{
                          color: "#ff4444",
                          "&:hover": {
                            backgroundColor: themeMode === "dark" ? "rgba(255, 68, 68, 0.08)" : "rgba(255, 68, 68, 0.15)",
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {item.content.map((content, contentIndex) => (
                    <Box key={contentIndex} sx={{ mb: 1 }}>
                      <TextField
                        multiline
                        rows={14}
                        value={content}
                        onChange={(e) => {
                          const newItems = [...formData.navigation.items];
                          newItems[itemIndex].content[contentIndex] =
                            e.target.value;
                          setFormData({
                            ...formData,
                            navigation: { items: newItems },
                          });
                        }}
                        onPaste={(event) => handleContentPaste(event, itemIndex, contentIndex)}
                        onDrop={(event) => handleContentDrop(event, itemIndex, contentIndex)}
                        onDragOver={(event) => event.preventDefault()}
                        placeholder="Content (Markdown supported)"
                        helperText={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <InfoIcon sx={{ fontSize: "14px", opacity: 0.7 }} />
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              Markdown syntax is supported and Use ### for subItem for Table of Contents. Drag and drop or paste images to the content to upload them.
                            </Typography>
                          </Box>
                        }
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: theme.palette.usecaseDialogFieldColor,
                            color: theme.palette.text.primary,
                            "& fieldset": { border: theme.palette.defaultBorder },
                          },
                          "& .MuiOutlinedInput-root textarea": {
                            overflow: "auto",
                            resize: "vertical",
                          },
                        }}
                      />
                      {item.content.length > 1 && (
                        <Button
                          size="small"
                          onClick={() => {
                            const newItems = [...formData.navigation.items];
                            newItems[itemIndex].content = newItems[
                              itemIndex
                            ].content?.filter((_, i) => i !== contentIndex);
                            setFormData({
                              ...formData,
                              navigation: { items: newItems },
                            });
                          }}
                          sx={{
                            color: "#ff4444",
                            "&:hover": {
                              textDecoration: "underline",
                              textUnderlineOffset: "4px",
                              backgroundColor: "transparent",
                            },
                          }}
                        >
                          Remove Paragraph
                        </Button>
                      )}
                    </Box>
                  ))}
{/* 
                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => {
                      const newItems = [...formData.navigation.items];
                      newItems[itemIndex].content.push("");
                      setFormData({
                        ...formData,
                        navigation: { items: newItems },
                      });
                    }}
                    sx={{
                      color: "#4CAF50",
                      "&:hover": { backgroundColor: themeMode === "dark" ? "rgba(76, 175, 80, 0.08)" : "rgba(76, 175, 80, 0.15)" },
                    }}
                  >
                    Add Paragraph
                  </Button> */}
                </Box>
              ))}

              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => {
                  setFormData({
                    ...formData,
                    navigation: {
                      items: [
                        ...formData.navigation.items,
                        { name: "", content: [""] },
                      ],
                    },
                  });
                }}
                sx={{
                  color: theme.palette.accentColor,
                  "&:hover": { backgroundColor: themeMode === "dark" ? "rgba(255, 133, 68, 0.08)" : "rgba(255, 133, 68, 0.15)" },
                }}
              >
                Add New Section
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: "16px 24px",
            background: theme.palette.backgroundColor,
            borderTop: theme.palette.defaultBorder,
            gap: 2,
          }}
        >
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                background: themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={16} sx={{color: "inherit"}}/> : <AddIcon />}
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{
              px: 3,
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting 
              ? (formData?.id ? "Updating..." : "Adding...") 
              : (formData?.id ? `Update ${entityLabel}` : `Add ${entityLabel}`)
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnersUsecasesTab;
