import React, { useState, useEffect, useContext, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrganizationTab from '../components/OrganizationTab.jsx';
import PartnerTab from '../components/PartnerTab.jsx';
import UserManagmentTab from '../components/UserManagmentTab.jsx';
import CacheView from "../components/CacheView.jsx";
import Files from "../components/Files.jsx";
import AppAuthTab from "../components/AppAuthTab.jsx";
import SchedulesTab from "../components/SchedulesTab.jsx";
import EnvironmentTab from "../components/EnvironmentTab.jsx";
import TenantsTab from "../components/TenantsTab.jsx";

import {
    Business as BusinessIcon,
    PermIdentity as PermIdentityIcon,
    HttpsOutlined as HttpsOutlinedIcon,
    InsertDriveFileOutlined as InsertDriveFileOutlinedIcon,
    StorageOutlined as StorageOutlinedIcon,
    AccessTimeOutlined as AccessTimeOutlinedIcon,
    FmdGoodOutlined as FmdGoodOutlinedIcon,
    GroupOutlined as GroupOutlinedIcon
} from '@mui/icons-material';
import theme, { getTheme } from '../theme.jsx';
import { Button, Skeleton, Tooltip } from '@mui/material';
import { Index } from 'react-instantsearch-dom';
import { Context } from '../context/ContextApi.jsx';
import { toast } from 'react-toastify';

const PartnerIcon = ({ strokeColor, fillColor = 'transparent', width = 22, height = 22 }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5327 4.49465C14.0102 4.60513 13.5779 4.90684 13.2905 5.31071L12.382 1L1.7665 3.23791C1.24516 3.34838 0.911462 3.86034 1.02072 4.38181L3.25807 15L7.57601 14.0901C7.16749 13.8026 6.85992 13.3679 6.74948 12.8393C6.51672 11.7334 7.22331 10.6477 8.32892 10.4149C9.43453 10.1821 10.52 10.8889 10.7527 11.9947C10.8643 12.5221 10.7587 13.0448 10.501 13.4724L14.8189 12.5625L13.9104 8.25182C14.3368 8.50484 14.8533 8.60699 15.3759 8.49652C16.4815 8.2637 17.1893 7.17801 16.9553 6.07212C16.7225 4.96623 15.6371 4.25827 14.5315 4.49228L14.5327 4.49465Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
);

const AdminNavBar = (props) => {
    const location = useLocation();
    const { globalUrl, userdata, isCloud,isOrgLoaded, isLoaded,removeCookie,  handleStatusChange, selectedStatus, setSelectedStatus, handleEditOrg, serverside, notifications, handleGetOrg, orgId, checkLogin, setNotifications, stripeKey, setSelectedOrganization, selectedOrganization } = props;
    const [selectedItem, setSelectedItem] = useState("Organization");
    const [isSelectedFiles, setIsSelectedFiles] = useState(true);
    const [isSelectedDataStore, setIsSelectedDataStore] = useState(true);
    const [isIntegrationPartner, setIsIntegrationPartner] = useState(false);
    const [isChildOrg, setIsChildOrg] = useState(false);
    const [isGlobalUser, setIsGlobalUser] = useState(false);
    const [visibleItems, setVisibleItems] = useState([]);
    const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);


    useEffect(() => {
        if (userdata && userdata?.active_org?.id?.length > 0) {
            setIsUserDataLoaded(true);
        }
    }, [userdata]);


    
    const { themeMode, brandColor } = React.useContext(Context);
    const theme = getTheme(themeMode, brandColor);

    const HandlePartnerChange = () => {
        if (userdata?.id?.length > 0) {
            const isIntegrationPartner = userdata?.org_status?.includes("integration_partner") || false;
            setIsIntegrationPartner(isIntegrationPartner);
            const isChildOrg = userdata?.org_status?.includes("sub_org") || false;
            setIsChildOrg(isChildOrg);
            const isGlobalUser = userdata?.active_org?.branding?.global_user || false;
            setIsGlobalUser(isGlobalUser);
        } else {
            setIsIntegrationPartner(false);
            setIsChildOrg(false);
            setIsGlobalUser(false);
        }
    }

    useEffect(() => {
        if (userdata && userdata?.id?.length > 0) {
            HandlePartnerChange();
        }
    }, [userdata]);

    const HandleVisibleTabs = () => {
        if (userdata?.id?.length > 0) {
            if (userdata?.active_org?.role === "admin" || userdata?.support) {
                setVisibleItems(items);
            }else {
                const filteredItems = items.filter(item => item.text !== "Users" && item.text !== "Files" && item.text !== "Datastore" && item.text !== "Triggers" && item.text !== "Locations");
                setVisibleItems(filteredItems);
            }
        }
    }

    useEffect(() => {
        if (isIntegrationPartner && isChildOrg && !isGlobalUser) {
            // Filter out Users and Tenants tabs
            if (userdata?.active_org?.role === "admin" || userdata?.support) {
                const filteredItems = items.filter(item => 
                    item.text !== "Users" && item.text !== "Tenants"
                );
                setVisibleItems(filteredItems);
            }else {
                const filteredItems = items.filter(item => 
                    item.text !== "Users" && item.text !== "Tenants" && item.text !== "Files" && item.text !== "Datastore" && item.text !== "Triggers" && item.text !== "Locations"
                );
                setVisibleItems(filteredItems);
            }
        } else {
            HandleVisibleTabs();
        }
    }, [isIntegrationPartner, isChildOrg, isGlobalUser, selectedOrganization, userdata]);

    const navigate = useNavigate();

	//const leadinfo = selectedOrganization.lead_info === undefined || selectedOrganization.lead_info === null || selectedOrganization.lead_info === "" ? "" : JSON.stringify(selectedOrganization.lead_info)
	//const isPartner = leadinfo.includes("partner")

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tabName = queryParams.get('tab');
        const partnerTab = queryParams.get('partner_tab');

        // if(!isCloud){
        //     if(tabName === "partner" || partnerTab !== null) {
        //         setSelectedItem("Organization");
        //         navigate(`?tab=organization`, { replace: true });
        //     }
        // }
        if (partnerTab) {
            setSelectedItem("Partner");
        }
        if (tabName === "environments") {
            setSelectedItem("Locations");
        } else if (tabName === "suborgs") {
            setSelectedItem("Tenants");
        }else if (tabName === "cache") {	
            setSelectedItem("Datastore");
        }else if (tabName) {
            setSelectedItem(tabName.charAt(0).toUpperCase() + tabName.slice(1));
        }else if (tabName === "partner") {
            setSelectedItem("Partner");
        }

    }, [location.search]);

    const items = [
        { iconSrc: <BusinessIcon />, alt: "Organization Icon", text: "Organization", component: OrganizationTab, props: { isIntegrationPartner, isChildOrg, isGlobalUser,globalUrl,removeCookie,  selectedStatus, isLoaded, setSelectedStatus, handleStatusChange, handleEditOrg, handleGetOrg, userdata, isCloud, serverside, notifications, checkLogin, setNotifications, stripeKey, setSelectedOrganization, selectedOrganization } },
        { iconSrc: undefined, alt: "Partner Icon", text: "Partner", component: PartnerTab, props: { globalUrl,removeCookie, isLoaded, handleGetOrg, userdata, isCloud, serverside, checkLogin, setSelectedOrganization, selectedOrganization } },
        { iconSrc: <PermIdentityIcon />, alt: "Users Icon", text: "Users", component: UserManagmentTab, props: { globalUrl, userdata, serverside, isCloud, selectedOrganization, setSelectedOrganization, handleEditOrg } },
        { iconSrc: <HttpsOutlinedIcon />, alt: "App Auth Icon", text: "App_auth", component: AppAuthTab, props: { globalUrl, userdata, isCloud, selectedOrganization } },
        { iconSrc: <StorageOutlinedIcon />, alt: "Datastore Icon", text: "Datastore", component: CacheView, props: { globalUrl, userdata, selectedOrganization, serverside, isSelectedDataStore, orgId , isCloud} },
        { iconSrc: <InsertDriveFileOutlinedIcon />, alt: "Files Icon", text: "Files", component: Files, props: { isCloud, globalUrl, userdata, serverside, selectedOrganization, isSelectedFiles } },
        { iconSrc: <AccessTimeOutlinedIcon />, alt: "Trigger Icon", text: "Triggers", component: SchedulesTab, props: { globalUrl, userdata, isCloud, serverside } },
        { iconSrc: <FmdGoodOutlinedIcon />, alt: "Environments Icon", text: "Locations", component: EnvironmentTab, props: { globalUrl, userdata, isCloud, selectedOrganization } },
        { iconSrc: <GroupOutlinedIcon />, alt: "Tenants Icon", text: "Tenants", component: TenantsTab, props: {isCloud, globalUrl, userdata, serverside, selectedOrganization, setSelectedOrganization, checkLogin } }
    ].filter(Boolean);

    const setConfig = (newValue) => {
        setSelectedItem(newValue);
        if (newValue === "App Auth") {
            const tabName = newValue.toLowerCase().replace(/\s+/g, '_');
            navigate(`?tab=${tabName}`, { replace: true });
        } else {
            const tabName = newValue.toLowerCase().replace(/\s+/g, '_');
            navigate(`?tab=${tabName}`, { replace: true });
        }
    };

    useEffect(() => {
        if (isIntegrationPartner && isChildOrg && !isGlobalUser && isOrgLoaded && isUserDataLoaded) {
            const queryParams = new URLSearchParams(location.search);
            const tabName = queryParams?.get('admin_tab')?.toLowerCase();
            if (tabName === "sso" || tabName === "branding") {
                toast.info("You are not allowed to access this tab. Please contact your admin for more information. Redirecting to Organization Configuration tab.");
                setTimeout(() => {
                    setSelectedItem("Organization");
                    navigate(`?admin_tab=org_config`, { replace: true });
                    window.location.reload();
                }
                , 3000);
            }

            const params = new URLSearchParams(location.search);
            const tab = params?.get('tab')?.toLowerCase();
            if (tab === "users" || tab === "tenants") {
                toast.info("You are not allowed to access this tab. Please contact your admin for more information. Redirecting to Organization Configuration tab.");
                setTimeout(() => {
                    setSelectedItem("Organization");
                    navigate(`?admin_tab=org_config`, { replace: true });
                    window.location.reload();
                }
                , 3000);
            }
        } else if (userdata && isOrgLoaded && isUserDataLoaded && userdata?.active_org?.role !== "admin" && !userdata?.support) {
            const queryParams = new URLSearchParams(location.search);
            const tabName = queryParams?.get('admin_tab')?.toLowerCase();
            if (tabName === "sso") {
                toast.info("You are not allowed to access this tab. Please contact your admin for more information. Redirecting to Organization Configuration tab.");
                setTimeout(() => {
                    setSelectedItem("Organization");
                    navigate(`?admin_tab=org_config`, { replace: true });
                    window.location.reload();
                }
                , 3000);
            }

            const params = new URLSearchParams(location.search);
            const tab = params?.get('tab')?.toLowerCase();
            if (tab === "users" || tab === "locations" || tab === "environments" || tab === "files" || tab === "datastore" || tab === "triggers") {
                toast.info("You are not allowed to access this tab. Please contact your admin for more information. Redirecting to Organization Configuration tab.");
                setTimeout(() => {
                    setSelectedItem("Organization");
                    navigate(`?admin_tab=org_config`, { replace: true });
                    window.location.reload();
                }
                , 3000);
            }
        }
    }, [isIntegrationPartner, isChildOrg, isGlobalUser, location.search, userdata, isOrgLoaded, isUserDataLoaded]); 


    const renderComponent = () => {
        const selectedItemData = visibleItems.find(item => item.text === selectedItem);
        if (!selectedItemData) {
            setSelectedItem("Organization");
            // If no tab is specified, default to "Organization" tab
            return <OrganizationTab isIntegrationPartner={isIntegrationPartner} isChildOrg={isChildOrg} isGlobalUser={isGlobalUser} globalUrl={globalUrl} removeCookie={removeCookie} selectedStatus={selectedStatus} isLoaded={isLoaded} setSelectedStatus={setSelectedStatus} handleStatusChange={handleStatusChange} handleEditOrg={handleEditOrg} handleGetOrg={handleGetOrg} userdata={userdata} isCloud={isCloud} serverside={serverside} notifications={notifications} checkLogin={checkLogin} setNotifications={setNotifications} stripeKey={stripeKey} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization}/>;
        };

        const ComponentToRender = selectedItemData.component;
        const componentProps = selectedItemData.props;

		const updatedProps = {
			...componentProps,
			notifications: notifications,
			setNotifications: setNotifications, 
			userdata: userdata, 
			selectedOrganization: selectedOrganization
		};

		return <ComponentToRender {...updatedProps} />;
	};

    const defaultImage = "/images/logos/orange_logo.svg"
    const imageData =
        selectedOrganization?.image === undefined || selectedOrganization?.image.length === 0
            ? defaultImage
            : selectedOrganization?.image;

    return (
        !isOrgLoaded && !isUserDataLoaded ? <Loader /> :
        <Wrapper>
            <div style={{ flexDirection: 'column', width: 220, }}>
                <nav style={{ padding: '25px 25px 3px 25px', height: isCloud ? "calc(100% - 60px)" : "calc(100% - 30px)" , fontSize: '16px', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, background: theme.palette.platformColor, color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', }}>
                        <img loading="lazy" src={imageData} alt="Logo" style={{ width: '30px', borderRadius: 8, height: '30px', marginRight: '8px' }} />
                        <div style={{
                            fontFamily: theme?.typography?.fontFamily,
                            fontSize: '16px',
                            color: theme.palette.text.primary,
                            fontWeight: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
							marginLeft: 5, 
                        }}>{selectedOrganization?.name}</div>
                    </div>
                    <div style={{ borderTop: theme.palette.defaultBorder, marginTop: 23 }} />
                    {visibleItems.map((item, index) => (
                        <Tooltip
                            key={index}
                            title={
                            ((item.text === "Users") || (item.text === "Files") || (item.text === "Triggers") || (item.text === "Locations")) && !(userdata?.support || userdata?.active_org?.role === "admin")
                                ? "Your role is not admin. Please ask the admin to change your role."
                                : ""
                            }
                            placement="right"
                        >
                            <span style={{ display: "inline-block", width: "100%" }}>
                            <Button
                                key={item.text}
                                variant="text"
                                color="primary"
                                sx={{
                                gap: 1,
                                "&.MuiButton-root": {
                                    color: selectedItem === item.text 
                                        ? theme.palette.text.primary 
                                        : theme.palette.text.secondary,
                                    fontSize: 16,
                                    backgroundColor: "transparent",
                                    textTransform: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    border: "none",
                                    marginTop: index === 0 ? "15px" : "5px",
                                    width: "100%",
                                    justifyContent: "flex-start",
                                    borderLeft:
                                    selectedItem === item.text
                                        ? `3px solid ${theme.palette.primary.main}`
                                        : "none",
                                    borderTopLeftRadius: selectedItem === item.text ? "2.5px" : null,
                                    borderBottomLeftRadius: selectedItem === item.text ? "2.5px" : null,
                                    paddingLeft: selectedItem === item.text ? "15px" : "10px",
                                    fontWeight: selectedItem === item.text ? 200 : "normal",
                                    flex: 1,
                                    "&:hover": {
                                    backgroundColor: theme.palette.hoverColor,
                                },
                                },
                                "&.Mui-disabled": {
                                    color: "#6F6F6F",
                                },
                                }}
                                disabled={
                                ((item.text === "Users") || (item.text === "Files") || (item.text === "Triggers") || (item.text === "Locations")) && !(userdata?.support || userdata?.active_org?.role === "admin")
                                }
                                startIcon={item?.iconSrc === undefined ? <PartnerIcon strokeColor={selectedItem === item.text ? theme.palette.text.primary : theme.palette.text.secondary} /> : item?.iconSrc}
                                onClick={() => setConfig(item.text)}
                            >
                                {item.text.replace(/_/g, " ")}
                            </Button>
                            </span>
                        </Tooltip>
                        ))}


                </nav>
            </div>

            <Wrapper2>
				{renderComponent()}
			</Wrapper2>
        </Wrapper>
    );
};

export default AdminNavBar;

const Loader = () => {
  const dummyItems = Array.from({ length: 6 });
  const dummyNavItems = Array.from({ length: 6 });
  const dummyTabItems = ['Org Configuration', 'SSO', 'Notifications', 'Billing & Stats', 'Branding'];
  const { leftSideBarOpenByClick, windowWidth, themeMode } = useContext(Context);
  const theme = getTheme(themeMode);
  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      height: '100%',
      minHeight: '100vh',
      maxWidth: '1200px',
      fontFamily: 'Arial, sans-serif',
      paddingLeft: leftSideBarOpenByClick ? windowWidth <= 1300 ? 220 : 200 : 80,
        transition: "padding-left 0.3s ease",
    }}>

      <div style={{ 
        width: '220px', 
        backgroundColor: theme.palette.platformColor,
        borderTopLeftRadius: '8px', 
        borderBottomLeftRadius: '8px',
        padding: '25px 25px 3px 25px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <Skeleton 
            width="30px" 
            height="30px" 
            sx={{ borderRadius: '8px', marginRight: '8px', }} 
          />
          <Skeleton width="120px" height="24px" />
        </div>
        
        {/* Divider */}
        <Skeleton 
          width="100%" 
          height="1px" 
          sx={{ marginBottom: '15px' }} 
        />
        
        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
          {dummyNavItems.map((_, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }}>
              <Skeleton 
                width="18px" 
                height="18px" 
                sx={{ marginRight: '10px' }} 
              />
              <Skeleton width={`${100 + Math.random() * 40}px`} height="36px" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ 
        flex: 1, 
        backgroundColor: theme.palette.platformColor,
        borderTopRightRadius: '8px', 
        borderBottomRightRadius: '8px',
        borderLeft: theme.palette.defaultBorder,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: theme.palette.defaultBorder,
          padding: '0 16px'
        }}>
          {dummyTabItems.map((_, index) => (
            <div 
              key={index} 
              style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: '28px 0',
                borderBottom: index === 0 ? '2px solid #FF8444' : 'none'
              }}
            >
              <Skeleton width={`${80 + Math.random() * 30}px`} height="24px" />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: '0 auto', alignItems: 'flex-start' }}>
            <Skeleton variant='square' width="200px" height="200px" sx={{ marginBottom: '20px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '50px' }}>
                {dummyItems.map((_, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Skeleton width={'400px'} height="36px" />
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
  

const PaddingWrapper2 = memo(({ children }) => {

    return (
        <div style={{
			marginBottom: 30, 
			width: "75%" , 
			maxWidth: 1200, 
			height: "100%", 
			boxSizing: 'border-box',
		}}>
            {children}
        </div>
    )
});

const Wrapper2 = memo(({children}) => {

    return (
        <PaddingWrapper2>
            {children}
        </PaddingWrapper2>
    );
})

const PaddingWrapper = memo(({ children }) => {
    const { leftSideBarOpenByClick, windowWidth } = useContext(Context);

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                paddingLeft: leftSideBarOpenByClick ? windowWidth <= 1300 ? 220 : 200 : 80,
                transition: "padding-left 0.3s ease",
                width: "100%",
                overflow: "hidden",
                height: "100%",
            }}
        >
            {children}
        </div>
    );
});

const Wrapper = memo(({ children }) => {
    return (
        <PaddingWrapper>
            {children}
        </PaddingWrapper>
    );
})
