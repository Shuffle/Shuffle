import React, { useState, useEffect, useContext, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrganizationTab from '../components/OrganizationTab.jsx';
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
import theme from '../theme.jsx';
import { Button, Tooltip } from '@mui/material';
import { Index } from 'react-instantsearch-dom';
import { Context } from '../context/ContextApi.jsx';

const AdminNavBar = (props) => {
    const location = useLocation();
    const { globalUrl, userdata, isCloud, isLoaded,removeCookie,  handleStatusChange, selectedStatus, setSelectedStatus, handleEditOrg, serverside, notifications, handleGetOrg, orgId, checkLogin, setNotifications, stripeKey, setSelectedOrganization, selectedOrganization } = props;
    const [selectedItem, setSelectedItem] = useState("Organization");
    const [isSelectedFiles, setIsSelectedFiles] = useState(true);
    const [isSelectedDataStore, setIsSelectedDataStore] = useState(true);

    const navigate = useNavigate();

	//const leadinfo = selectedOrganization.lead_info === undefined || selectedOrganization.lead_info === null || selectedOrganization.lead_info === "" ? "" : JSON.stringify(selectedOrganization.lead_info)
	//const isPartner = leadinfo.includes("partner")

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tabName = queryParams.get('tab');
    
        if (tabName === "environments") {
            setSelectedItem("Locations");
        } else if (tabName === "suborgs") {
            setSelectedItem("Tenants");
        }else if (tabName === "cache") {	
            setSelectedItem("Datastore");
        }else if (tabName) {
            setSelectedItem(tabName.charAt(0).toUpperCase() + tabName.slice(1));
        } else {
            setSelectedItem("Organization");
        }
    }, [location.search]);
    

    const items = [
        { iconSrc: <BusinessIcon />, alt: "Organization Icon", text: "Organization", component: OrganizationTab, props: { globalUrl,removeCookie,  selectedStatus, isLoaded, setSelectedStatus, handleStatusChange, handleEditOrg, handleGetOrg, userdata, isCloud, serverside, notifications, checkLogin, setNotifications, stripeKey, setSelectedOrganization, selectedOrganization } },
        { iconSrc: <PermIdentityIcon />, alt: "Users Icon", text: "Users", component: UserManagmentTab, props: { globalUrl, userdata, serverside, isCloud, selectedOrganization, setSelectedOrganization, handleEditOrg } },
        { iconSrc: <HttpsOutlinedIcon />, alt: "App Auth Icon", text: "App_auth", component: AppAuthTab, props: { globalUrl, userdata, isCloud, selectedOrganization } },
        { iconSrc: <StorageOutlinedIcon />, alt: "Datastore Icon", text: "Datastore", component: CacheView, props: { globalUrl, userdata, selectedOrganization, serverside, isSelectedDataStore, orgId , isCloud} },
        { iconSrc: <InsertDriveFileOutlinedIcon />, alt: "Files Icon", text: "Files", component: Files, props: { isCloud, globalUrl, userdata, serverside, selectedOrganization, isSelectedFiles } },
        { iconSrc: <AccessTimeOutlinedIcon />, alt: "Trigger Icon", text: "Triggers", component: SchedulesTab, props: { globalUrl, userdata, isCloud, serverside } },
        { iconSrc: <FmdGoodOutlinedIcon />, alt: "Environments Icon", text: "Locations", component: EnvironmentTab, props: { globalUrl, userdata, isCloud, selectedOrganization } },
        { iconSrc: <GroupOutlinedIcon />, alt: "Tenants Icon", text: "Tenants", component: TenantsTab, props: {isCloud, globalUrl, userdata, serverside, selectedOrganization, setSelectedOrganization, checkLogin } }
    ];

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

    const renderComponent = () => {
        const selectedItemData = items.find(item => item.text === selectedItem);
        if (!selectedItemData) {
            setSelectedItem("Organization");
            // If no tab is specified, default to "Organization" tab
            return <OrganizationTab globalUrl={globalUrl} removeCookie={removeCookie} selectedStatus={selectedStatus} isLoaded={isLoaded} setSelectedStatus={setSelectedStatus} handleStatusChange={handleStatusChange} handleEditOrg={handleEditOrg} handleGetOrg={handleGetOrg} userdata={userdata} isCloud={isCloud} serverside={serverside} notifications={notifications} checkLogin={checkLogin} setNotifications={setNotifications} stripeKey={stripeKey} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization}/>;
        };

        const ComponentToRender = selectedItemData.component;
        const componentProps = selectedItemData.props;

        return <ComponentToRender {...componentProps} />;
    };

    const defaultImage = "/images/logos/orange_logo.svg"
    const imageData =
        selectedOrganization?.image === undefined || selectedOrganization?.image.length === 0
            ? defaultImage
            : selectedOrganization?.image;

    return (
        <Wrapper>
            <div style={{ flexDirection: 'column', width: 220, }}>
                <nav style={{ padding: '25px 25px 3px 25px', height: isCloud ? "calc(100% - 60px)" : "calc(100% - 30px)" , fontSize: '16px', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, background: '#212121', color: '#9CA3AF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', }}>
                        <img loading="lazy" src={imageData} alt="Logo" style={{ width: '30px', borderRadius: 8, height: '30px', marginRight: '8px' }} />
                        <div style={{
                            fontFamily: theme?.typography?.fontFamily,
                            fontSize: '16px',
                            color: "#FFFFFF",
                            fontWeight: 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
							marginLeft: 5, 
                        }}>{selectedOrganization?.name}</div>
                    </div>
                    <div style={{ borderTop: '1px solid #494949', marginTop: 23 }} />
                    {items.map((item, index) => (
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
                                "&:hover": {
                                    backgroundColor: "#323232 !important",
                                },
                                "&.MuiButton-root": {
                                    color: selectedItem === item.text ? "#FFFFFF" : "#9E9E9E",
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
                                        ? "3px solid rgba(255, 132, 68, 1)"
                                        : "none",
                                    borderTopLeftRadius: selectedItem === item.text ? "2.5px" : null,
                                    borderBottomLeftRadius: selectedItem === item.text ? "2.5px" : null,
                                    paddingLeft: selectedItem === item.text ? "15px" : "10px",
                                    fontWeight: selectedItem === item.text ? 200 : "normal",
                                    flex: 1,
                                },
                                "&.Mui-disabled": {
                                    color: "#6F6F6F",
                                },
                                }}
                                disabled={
                                ((item.text === "Users") || (item.text === "Files") || (item.text === "Triggers") || (item.text === "Locations")) && !(userdata?.support || userdata?.active_org?.role === "admin")
                                }
                                startIcon={item.iconSrc}
                                onClick={() => setConfig(item.text)}
                            >
                                {item.text.replace(/_/g, " ")}
                            </Button>
                            </span>
                        </Tooltip>
                        ))}


                </nav>
            </div>
            <Wrapper2>{renderComponent()}</Wrapper2>
        </Wrapper>
    );
};

export default AdminNavBar;

const PaddingWrapper2 = memo(({ children }) => {

    return (
        <div div style={{marginBottom: 30, width: "75%" , maxWidth: 1200, height: "100%", boxSizing: 'border-box'}}>
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
