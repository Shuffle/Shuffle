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
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Link, useNavigate } from "react-router-dom";

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
  } else {
    return "/images/appCategories/other.svg";
  }
};

// Skeleton component for loading state
const UsecaseCardSkeleton = () => {
  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);
  
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

const UsecaseCard = ({ usecase, handleToggle, handleOpenDialog, handleDeleteUsecase }) => {
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

  return (
    <Box
      onClick={handleCardClick}
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
        cursor: "pointer",
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

const PartnersUsecasesTab = ({ isCloud, globalUrl, userdata, partnerData, setPartnerData }) => {
  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);

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
          name: "About Usecase",
          content: [""],
        },
      ],
    },
    public: false,
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

  const getUserProfileWorkflows = (orgId) => {
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
            name: "About Usecase",
            content: [""],
          },
        ],
      },
      public: usecase?.public || false,
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
    if (!formData.mainContent.publicWorkflowId || formData.mainContent.publicWorkflowId.trim() === "") {
      validationErrors.push("Please select a public workflow");
    }

    if (!formData.mainContent.sourceAppType || formData.mainContent.sourceAppType.trim() === "") {
      validationErrors.push("Source app type is required");
    }

    if (!formData.mainContent.destinationAppType || formData.mainContent.destinationAppType.trim() === "") {
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
    if (!formData.mainContent.categories || !Array.isArray(formData.mainContent.categories) || formData.mainContent.categories.length === 0) {
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
      console.log("Response data:", responseData);
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
      {/* Add Usecase Button */}
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
          Usecases
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          disabled={isWorkflowLoading}
          onClick={handleOpenDialog}
          sx={{
            px: 3,
            textTransform: "none",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          Add Usecase
        </Button>
      </Box>

      {/* Usecases Grid */}
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
            <UsecaseCardSkeleton key={index} />
          ))}
        </Box>
      ) : usecaseData.length > 0 ? (
        // Actual data display
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
          {usecaseData.map((usecase) => (
            <UsecaseCard
              handleOpenDialog={handleOpenDialog}
              key={usecase.id}
              usecase={usecase}
              handleToggle={handleToggle}
              handleDeleteUsecase={handleDeleteUsecase}
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
            No usecases found
          </Typography>
        </Box>
      )}

      {/* Add Usecase Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
            {formData?.id ? "Update" : "Add New"} Usecase : {formData?.public ? "Published" : "Draft"}
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
            <FormControl>
              <Typography
                sx={{
                  color: theme.palette.accentColor,
                  mb: 2,
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                Public Workflow
              </Typography>
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

            {/* App Type Selection */}
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mt: 2 }}>
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
                        rows={5}
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
                        placeholder="Content"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: theme.palette.usecaseDialogFieldColor,
                            color: theme.palette.text.primary,
                            "& fieldset": { border: theme.palette.defaultBorder },
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
                  </Button>
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
              : (formData?.id ? "Update Usecase" : "Add Usecase")
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnersUsecasesTab;
