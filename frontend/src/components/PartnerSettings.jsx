import React, { useEffect, useState, useContext } from 'react';
import { toast } from "react-toastify";
import { Context } from '../context/ContextApi.jsx';
import { getTheme  } from '../theme.jsx';
import {
    Button,
    Typography,
    Box,
    IconButton,
    Tooltip,
} from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router';
import PartnerHeader from '../components/PartnerHeader.jsx';
import PartnerDetails from '../components/PartnerDetails.jsx';

const PartnerSettings = (props) => {
    const {
        isCloud,
        userdata,
        globalUrl,
        serverside,
        loadingPartnerData,
        selectedOrganization,
        setSelectedOrganization, 
        handleGetOrg, 
        partnerData,
        setPartnerData,
    } = props;

    const [isPartner, setIsPartner] = React.useState(isCloud ? userdata?.active_org?.is_partner ? true : false : false);
    const [partnerTypes, setPartnerTypes] = React.useState({});
    const [isPublishing, setIsPublishing] = React.useState(false);
    const [isToggling, setIsToggling] = React.useState(false);
    
    useEffect(() => {
        setIsPartner(isCloud ? userdata?.active_org?.is_partner ? true : false : false);
        if(userdata?.support){
            setIsPartner(true);
        }
    }, [userdata, isCloud]);
    // Partner Types handling : Getting from org status
    useEffect(() => {
        const partnerTypes = {};
        userdata?.org_status.forEach(status => {
            if (status.includes("_partner")) {
                partnerTypes[status] = true;
            }
        });
        setPartnerTypes(partnerTypes);
    }, [selectedOrganization]);
    // Partner Type Colors
    const partnerTypeColors = {
        "tech_partner": "#ff8544",
        "distribution_partner": "#2BC07E",
        "service_partner": "#a99cf9",
        "integration_partner": "#fb47a0"
    }

    const handleSendUpdateRequest = () => {
        toast("Your request has been sent to the support team. They will review your request and get back to you as soon as possible.")
    }

    // Open partner page in new tab
    const handleOpenPartnerPage = () => {
        if (partnerData?.id) {
            if(partnerData?.public){
                window.open(`${window.location.origin}/partners/${partnerData.name.toLowerCase().replaceAll(" ", "_")}`)
            }else{
                window.open(`${window.location.origin}/partners/${partnerData?.id}`, "_blank");
            }
        } else {
            toast.error("Partner ID not found");
        }
    }

    // Update Partner Details
    const handleUpdatePartnerDetails = () => {
        // Validate required fields before publishing
        const requiredStringFields = [
            { field: partnerData?.name, name: "Partner Name" },
            { field: partnerData?.description, name: "Description" },
            { field: selectedOrganization?.id, name: "Organization Id" },
            { field: partnerData?.image_url, name: "Logo Image" },
            { field: partnerData?.landscape_image_url, name: "Landscape Image" },
            { field: partnerData?.website_url, name: "Website URL" },
            { field: partnerData?.article_url, name: "Article URL" },
            { field: partnerData?.country, name: "Country" },
            { field: partnerData?.region, name: "Region" },
        ];
        
        // Required array fields (multi-select dropdowns)
        const requiredArrayFields = [
            { field: partnerData?.solutions, name: "Solutions" },
        ];
        
        // Check if any required string fields are empty
        const emptyStringFields = requiredStringFields.filter(item => 
            !item.field || item.field.trim() === ""
        );
        
        // Check if any required array fields are empty
        const emptyArrayFields = requiredArrayFields.filter(item => 
            !item.field || !Array.isArray(item.field) || item.field.length === 0
        );
        
        // Combine all empty fields
        const allEmptyFields = [...emptyStringFields, ...emptyArrayFields];
        
        // If there are empty required fields, show error and return
        if (allEmptyFields.length > 0) {
            const missingFields = allEmptyFields.map(item => item.name).join(", ");
            toast.error(`Please fill in all required fields: ${missingFields}`);
            return;
        }
        
        // Check if at least one partner type is selected
        if (Object.keys(partnerTypes).length === 0) {
            toast.error("There should be at least one partner type");
            return;
        }
       
        setIsPublishing(true);
        const url = globalUrl + "/api/v1/partners/" + userdata?.active_org?.id;
        const data = {
            id: partnerData.id?.trim() || null,
            name: partnerData.name?.trim(),
            org_id: selectedOrganization?.id?.trim(),
            description: partnerData.description?.trim(),
            website_url: partnerData.website_url?.trim(),
            article_url: partnerData.article_url?.trim(),
            partner_type: partnerTypes,
            expertise: partnerData?.expertise || [],
            services: partnerData?.services || [],
            solutions: partnerData?.solutions || [],
            country: partnerData?.country || "",
            region: partnerData?.region || "",
            image_url: partnerData?.image_url?.trim(),
            landscape_image_url: partnerData?.landscape_image_url?.trim(),
            public: partnerData?.public
        }
        fetch(url, {
            mode: "cors",
			method: "POST",
			body: JSON.stringify(data),
			credentials: "include",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
        })
        .then((response) => {
            setIsPublishing(false);
            if (response.status !== 200) {
                toast.error("Failed to publish partner");
            }
            return response.json();
        })
        .then((responseJson) => {
            toast.success("Partner details successfully updated");
        })
        .catch((error) => {
            setIsPublishing(false);
            toast.error("Failed to update partner details: " + error?.message);
        })
    }

    // Toggle Partner Publish Status
    const handleTogglePublishStatus = () => {
        setIsToggling(true);
        const newPublishStatus = !partnerData?.public;
        const url = globalUrl + "/api/v1/partners/" + userdata?.active_org?.id;
        
        const data = {
            id: partnerData.id?.trim() || null,
            name: partnerData.name?.trim(),
            org_id: selectedOrganization?.id?.trim(),
            description: partnerData.description?.trim(),
            website_url: partnerData.website_url?.trim(),
            article_url: partnerData.article_url?.trim(),
            partner_type: partnerTypes,
            usecases: partnerData?.usecases || [],
            expertise: partnerData?.expertise || [],
            services: partnerData?.services || [],
            solutions: partnerData?.solutions || [],
            country: partnerData?.country || "",
            region: partnerData?.region || "",
            image_url: partnerData?.image_url?.trim(),
            landscape_image_url: partnerData?.landscape_image_url?.trim(),
            public: newPublishStatus
        }
        
        fetch(url, {
            mode: "cors",
            method: "POST",
            body: JSON.stringify(data),
            credentials: "include",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        })
        .then((response) => {
            setIsToggling(false);
            if (response.status !== 200) {
                toast.error("Failed to update publish status");
            }
            return response.json();
        })
        .then((responseJson) => {
            // Update local state
            setPartnerData(prev => ({
                ...prev,
                public: newPublishStatus
            }));
            toast.success(`Partner ${newPublishStatus ? 'published' : 'unpublished'} successfully`);
        })
        .catch((error) => {
            setIsToggling(false);
            toast.error("Failed to update publish status: " + error?.message);
        })
    }

    const { themeMode } = useContext(Context);
    const theme = getTheme(themeMode);
    const navigate = useNavigate();

    return (
        <div style={{ width: "100%", boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: theme.palette.platformColor, borderRadius: '16px',  }}>
            <div style={{ height: "100%", width: "100%", overflowX: 'hidden', scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin'}} >
            <div style={{ marginBottom: 40 }}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <div style={{width:'100%'}}>
                <Box
                sx={{display:"flex", alignItems:"flex-start", gap:2, justifyContent:"flex-start"
                }}>
                <Typography variant='h3' sx={{ marginBottom: "15px", marginTop: 0, }}>Configuration</Typography>
                {Object?.entries(partnerTypes)?.map(([key, value]) => (
                    <Box
                        sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "999px",
                        py: 1.2,
                        px: 2.5,
                        fontSize: "13px",
                        fontWeight: 500,
                        fontFamily: theme.typography.fontFamily,
                        color: "#fff",
                        backgroundColor: "transparent",
                        border: `1.5px solid ${
                            partnerTypeColors[key]
                        }`,
                        transition: "all 0.2s ease",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        color: partnerTypeColors[key],
                    }}
                    >
                    {key.replace("_", " ").replace(/\b\w/g, char => char.toUpperCase())}
                </Box>
                ))}
                </Box>
                <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    marginTop: 0.5,
                }}>
                <Typography variant="body2" style={{ color: theme.palette.text.secondary, fontSize: 16, maxWidth: "60%" }}>
                Set up and manage partner details and information to be displayed on the Partners page.
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    {isPartner && (
                        <>  
                            {/* View Partner Page Button */}
                            <Tooltip title="View Partner Page">
                                <IconButton
                                    sx={{ 
                                        color: theme.palette.primary.main,
                                        backgroundColor: theme.palette.action.hover,
                                        "&:hover": {
                                            backgroundColor: theme.palette.action.selected,
                                        }
                                    }}
                                    onClick={handleOpenPartnerPage}
                                    disabled={!partnerData?.id}
                                >
                                    <OpenInNewIcon />
                                </IconButton>
                            </Tooltip>
                            
                            {/* Update Details Button */}
                            <Button
                                sx={{ 
                                    fontSize: 16, 
                                    textTransform: 'capitalize',  
                                    boxShadow: "none", 
                                    px: 4,
                                }}
                                variant="contained"
                                color="primary"
                                disabled={isPublishing || isToggling}
                                onClick={handleUpdatePartnerDetails}
                            >
                                {isPublishing ? "Updating..." : "Update Details"}
                            </Button>
                                {/* Toggle Publish/Unpublish Button */}
                                <Button
                                sx={{ 
                                    fontSize: 16, 
                                    textTransform: 'capitalize',  
                                    boxShadow: "none", 
                                    marginRight: 4,
                                    px: 3,
                                    backgroundColor: partnerData?.public ? "#FD4C62" : "#4caf50",
                                    "&:hover": {
                                        backgroundColor: partnerData?.public ? "#FD4C62" : "#4caf50"
                                    }
                                }}
                                variant="contained"
                                disabled={isToggling || isPublishing}
                                onClick={handleTogglePublishStatus}
                            >
                                {isToggling ? (partnerData?.public ? "Unpublishing..." : "Publishing...") : (partnerData?.public ? "Unpublish" : "Publish")}
                            </Button>
                        </>
                    )}
                    
                    {!isPartner && (
                        <Button
                            sx={{ 
                                fontSize: 16, 
                                textTransform: 'capitalize',  
                                boxShadow: "none", 
                                px: 5, 
                                textDecoration: "none", 
                                marginRight: 4 
                            }}
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                if(!isCloud){
                                    navigate("/become-partner")
                                }else{
                                    window.open("https://shuffler.io/become-partner")
                                }
                            }}
                        >
                            Become a partner
                        </Button>
                    )}
                </Box>
                </Box>
                </div>
                </div>
            </div>
            <PartnerHeader
                isCloud={isCloud}
                userdata={userdata}
                isPublishing={isPublishing}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                isEditOrgTab={true}
                loadingPartnerData={loadingPartnerData}
                partnerData={partnerData}
                setPartnerData={setPartnerData}
                handleGetOrg={handleGetOrg}
            />
            <PartnerDetails
                isCloud={isCloud}
                userdata={userdata}
                partnerData={partnerData}
                isPublishing={isPublishing}
                loadingPartnerData={loadingPartnerData}
                setPartnerData={setPartnerData}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                isEditOrgTab={true}
                handleGetOrg={handleGetOrg}
                serverside={serverside}
            />
            </div>
        </div >
    )
}

export default PartnerSettings;
