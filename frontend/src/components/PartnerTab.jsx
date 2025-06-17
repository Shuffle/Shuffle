import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Branding from "../components/Branding.jsx";
import { ToastContainer, toast } from "react-toastify";
import { Button } from '@mui/material';
import { getTheme } from '../theme.jsx';
import { Context } from '../context/ContextApi.jsx';
import PartnerSettings from '../components/PartnerSettings.jsx';
import PartnersUsecasesTab from '../components/PartnersUsecasesTab.jsx';
import PartnersApps from '../components/PartnerApps.jsx';
import PartnerArticles from '../components/PartnersArticles.jsx';
const PartnerTab = (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        userdata,
        globalUrl,
        serverside,
        isCloud,
        setSelectedOrganization,
        selectedOrganization, handleGetOrg, 
        handleStatusChange,
        isLoaded,
        removeCookie
    } = props;

    
    const [selectedTab, setSelectedTab] = useState('partner_settings');
    const [loadingPartnerData, setLoadingPartnerData] = useState(false);
    const [curIndex, setCurIndex] = React.useState(0);
    const [partnerData, setPartnerData] = React.useState({
        name: "",
        description: "",
        image_url: "",
        landscape_image_url: "",
        website_url: "",
        article_url: "",
        expertise: [],
        usecases: [],
        services: [],
        solutions: [],
        country: "",
        region: "",
        partner_type: {},
    });

    const tabsOnPartnerTab = [ 'Partner Settings', 'Usecases', 'Apps', 'AI Agents', 'Articles', 'Branding'];

    const { themeMode } = useContext(Context);
    const theme = getTheme(themeMode);

    useEffect(() => {
        if(!isCloud || !userdata?.active_org?.is_partner) {
            // If the user is not a partner or if it's not a cloud environment do not make api call :)
            return;
        }
        setLoadingPartnerData(true);
        const url = globalUrl + "/api/v1/partners/" + userdata?.active_org?.id;
        fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
        .then((response) => {
            if (response.status !== 200) {
                toast("Failed to get partner data")
            }
            return response.json();
        })
        .then((responseJson) => {
            if(responseJson.success) {
                setPartnerData(responseJson?.partner);
                console.log("responseJson", responseJson)
                setLoadingPartnerData(false);
            }else{  
                setLoadingPartnerData(false);
                toast(responseJson?.reason)
            }
        })
        .catch((error) => {
            setLoadingPartnerData(false);
        })
    }, [globalUrl]);

    // Used to auto select the tab based on the url : partner_tab
    useEffect(() => {
      const queryParams = new URLSearchParams(location.search);
      const tabName = queryParams.get('partner_tab');
      if (tabName) {
          const decodedTabName = decodeURIComponent(tabName);
          setSelectedTab(decodedTabName);
          if (decodedTabName === 'partner_settings') {
              setCurIndex(0);
          } else if(decodedTabName === 'usecases'){
              setCurIndex(1)
          }else if (decodedTabName === 'apps'){
              setCurIndex(2);
          } else if (decodedTabName === 'aiagents') {
              setCurIndex(3);
          } else if (decodedTabName === 'articles') {
              setCurIndex(4);
          } else if (decodedTabName === 'branding') {
              setCurIndex(5);
          }
      }
    }, [location.search]);

    // Tab click on partner tab
    const handleTabClick = (tabName) => {
        const formattedTabName = tabName.toLowerCase().replace(/[\s&]+/g, '');
        const encodedTabName = encodeURIComponent(formattedTabName);
        setSelectedTab(formattedTabName);
        document.title = `Shuffle - partner - ${formattedTabName}`;
        navigate(`?partner_tab=${encodedTabName}`);
    };

    // Rendering the content based on the selected tab
    const renderContent = () => {
        switch (selectedTab) {
            case 'partner_settings':
                return <PartnerSettings isCloud={isCloud} loadingPartnerData={loadingPartnerData} partnerData={partnerData} setPartnerData={setPartnerData} handleStatusChange={handleStatusChange} userdata={userdata} globalUrl={globalUrl} serverside={serverside} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} selectedTab={selectedTab} />;
            case 'usecases': 
                return <PartnersUsecasesTab isCloud={isCloud} partnerData={partnerData} setPartnerData={setPartnerData} handleStatusChange={handleStatusChange} userdata={userdata} globalUrl={globalUrl} serverside={serverside} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} selectedTab={selectedTab} />;
            case `apps`:
                return <PartnersApps isCloud={isCloud} partnerData={partnerData} setPartnerData={setPartnerData} handleStatusChange={handleStatusChange} userdata={userdata} globalUrl={globalUrl} serverside={serverside} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} selectedTab={selectedTab} />;
            case 'articles' :
                return <PartnerArticles isCloud={isCloud} partnerData={partnerData} setPartnerData={setPartnerData} handleStatusChange={handleStatusChange} userdata={userdata} globalUrl={globalUrl} serverside={serverside} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} selectedTab={selectedTab} />;
            case `ai_agents`:
                return <PartnerArticles isCloud={isCloud} partnerData={partnerData} setPartnerData={setPartnerData} handleStatusChange={handleStatusChange} userdata={userdata} globalUrl={globalUrl} serverside={serverside} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} selectedTab={selectedTab} />;
            case 'branding':
                return <Branding
                    isCloud={isCloud}
                    userdata={userdata}
                    globalUrl={globalUrl}
                    handleGetOrg={handleGetOrg}
                    selectedOrganization={selectedOrganization}
                    clickedFromOrgTab={true}
                    setSelectedOrganization={setSelectedOrganization}
                />;
            default:
                return <PartnerSettings isCloud={isCloud} partnerData={partnerData} setPartnerData={setPartnerData} handleStatusChange={handleStatusChange} userdata={userdata} globalUrl={globalUrl} serverside={serverside} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} />;
        }
    };

    const isTabDisabled = (tabName) => {
        // If user is a support user, enable all tabs
        if (userdata?.support) {
            return false;
        }
        
        // For non-support users, apply the following restrictions:
        
        // For onPrem only partner settings and branding are enabled
        if (
            !isCloud &&
            (tabName === "Usecases" ||
            tabName === "Apps" ||
            tabName === "AI Agents" ||
            tabName === "Articles")
        ) {
            return true;
        }

        // Disable Apps, Articles, and AI Agents for all non-support users
        if (
            tabName === "Apps" ||
            tabName === "Articles" ||
            tabName === "AI Agents"
        ) {
            return true;
        }

        // Disable Usecases tab for cloud users if not a partner or is in a sub-org
        if (isCloud && tabName === "Usecases") {
            if (
                !userdata?.active_org?.is_partner ||
                userdata?.active_org?.is_sub_org
            ) {
                return true;
            }
        }

        // Disable Branding tab if not an integration partner
        const isIntegrationPartner =
            userdata &&
            userdata?.org_status?.includes("integration_partner") &&
            !userdata?.org_status?.includes("sub_org");
        if (tabName === "Branding" && !isIntegrationPartner) {
            return true;
        }

        // Enable the tab by default
        return false;
    }
   
    return (
        <div style={{ height: "100%", width: "100%", color: theme.palette.platformColor, backgroundColor: theme.palette.platformColor, borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: theme.palette.defaultBorder, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', width: "100%", borderBottom: theme.palette.defaultBorder ,boxSizing: 'border-box' }}>
                {tabsOnPartnerTab?.map((tabName, index) => (
                        <div style={{ pointerEvents: 'auto', width: '100%',}}>
                            <Button
                                key={tabName}
                                onClick={() => {
                                    setCurIndex(index); 
                                    handleTabClick(index === 0 ? "partner_settings" : tabName.toLowerCase().replace(/[\s&]+/g, ''));
                                }}
                                disabled={isTabDisabled(tabName)}
                                variant="text"
                                sx={{
                                    "&.MuiButton-root": {
                                        padding: '28px 0',
                                        borderBottom: index === curIndex ? '2px solid #FF8444' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: index === curIndex ? 'bold' : 'normal',
                                        color: index === curIndex ? "#FF8444" : theme.palette.text.primary,
                                        textTransform: 'none',
                                        fontSize: 16,
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 0,
                                    },
                                    "&: hover": {
                                        backgroundColor: theme.palette.hoverColor
                                    },
                                    "&.Mui-disabled": {
                                        color: "#6F6F6F",
                                    },
                                }}
                            >
                              {tabName}
                            </Button>
                        </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', width: "100%", height: "100%", paddingBottom: 200, boxSizing:'border-box'}}>
                {renderContent()}
            </div>
        </div>
    );
};

export default PartnerTab;
