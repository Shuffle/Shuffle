import React, { useEffect, useState, useContext } from 'react';
import OrgHeaderexpanded from "../components/OrgHeaderexpandedNew.jsx";
import OrgHeader from '../components/OrgHeaderNew.jsx';
import { toast } from "react-toastify";
import CloudSyncTab from '../components/CloudSyncTab.jsx';
import { Context } from '../context/ContextApi.jsx';
import { getTheme  } from '../theme.jsx';
import {
    FileCopy as FileCopyIcon,
} from "@mui/icons-material";
import {
    Button,
    Tooltip,
    IconButton,
    Typography,
} from "@mui/material";

const EditOrgTab = (props) => {
    const {
        userdata,
        globalUrl,
        serverside,
        selectedOrganization,
        setSelectedOrganization, 
        handleGetOrg, 
         selectedStatus, setSelectedStatus,
         handleEditOrg,
         handleStatusChange
    } = props;
    const [organizationFeatures, setOrganizationFeatures] = React.useState({});
    const [users, setUsers] = React.useState([]);
    const [orgRequest, setOrgRequest] = React.useState(true);
    const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
    useEffect(() => { 
        if(users.length === 0) {
            getUsers();
        }
    }, []);

    const { themeMode, brandColor } = useContext(Context);
    const theme = getTheme(themeMode, brandColor);


    const getUsers = () => {
        fetch(globalUrl + "/api/v1/getusers", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                    // Ahh, this happens because they're not admin
                    // window.location.pathname = "/workflows"
                    return;
                }

                return response.json();
            })
            .then((responseJson) => {
                setUsers(responseJson);
            })
            .catch((error) => {
                toast(error.toString());
            });
    };
    const mailsendingButton = (org) => {
        if (org === undefined || org === null) {
            return ""
        }

        if (users.length === 0) {
            return ""
        }

        // 1 mail based on users that have only apps
        // Another based on those doing workflows
        // Another based on those trying usecases(?) or templates
        //
        // Start based on edr, siem & ticketing
        // Talk about enrichment?
        // Check suggested usecases
        // Check suggested workflows 
        var your_apps = "- Connecting "

        var subject_add = 0
        var subject = "POC to automate "

        if (org.security_framework !== undefined && org.security_framework !== null) {
            if (org.security_framework.cases.name !== undefined && org.security_framework.cases.name !== null && org.security_framework.cases.name !== "") {
                your_apps += org.security_framework.cases.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

                if (subject_add < 2) {
                    if (subject_add === 1) {
                        subject += " and "
                    }

                    subject_add += 1
                    subject += org.security_framework.cases.name.replace("_", " ", -1).replace(" API", "", -1)
                }
            }

            if (org.security_framework.siem.name !== undefined && org.security_framework.siem.name !== null && org.security_framework.siem.name !== "") {
                your_apps += org.security_framework.siem.name.replace("_", " ", -1).replace(" API", "", -1) + ", "
                if (subject_add < 2) {
                    if (subject_add === 1) {
                        subject += " and "
                    }

                    subject_add += 1
                    subject += org.security_framework.siem.name.replace("_", " ", -1).replace(" API", "", -1)
                }
            }

            if (org.security_framework.communication.name !== undefined && org.security_framework.communication.name !== null && org.security_framework.communication.name !== "") {
                your_apps += org.security_framework.communication.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

                if (subject_add < 2) {
                    if (subject_add === 1) {
                        subject += " and "
                    }

                    subject_add += 1
                    subject += org.security_framework.communication.name.replace("_", " ", -1).replace(" API", "", -1)
                }
            }

            if (org.security_framework.edr.name !== undefined && org.security_framework.edr.name !== null && org.security_framework.edr.name !== "") {
                your_apps += org.security_framework.edr.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

                if (subject_add < 2) {
                    if (subject_add === 1) {
                        subject += " and "
                    }

                    subject_add += 1
                    subject += org.security_framework.edr.name.replace("_", " ", -1).replace(" API", "", -1)
                }
            }

            if (org.security_framework.intel.name !== undefined && org.security_framework.intel.name !== null && org.security_framework.intel.name !== "") {
                your_apps += org.security_framework.intel.name.replace("_", " ", -1).replace(" API", "", -1) + ", "

                if (subject_add < 2) {
                    if (subject_add === 1) {
                        subject += " and "
                    }

                    subject_add += 1
                    subject += org.security_framework.intel.name.replace("_", " ", -1).replace(" API", "", -1)
                }
            }


            // Remove comma
            //subject += "?"
            your_apps = your_apps.substring(0, your_apps.length - 2)
        }


        // Add usecases they may not have tried (from recommendations): org.priorities where item type is usecase
        var usecases = "- Building usecases like "
        const active_usecase = org.priorities.filter((item) => item.type === "usecase" && item.active === true)
        if (active_usecase.length > 0) {
            for (var i = 0; i < active_usecase.length; i++) {
                if (active_usecase[i].name.includes("Suggested Usecase: ")) {
                    usecases += active_usecase[i].name.replace("Suggested Usecase: ", "", -1) + ", "
                } else {
                    usecases += active_usecase[i].name + ", "
                }
            }

            usecases = usecases.substring(0, usecases.length - 2)
        }

        if (your_apps.length <= 15) {
            your_apps = ""
        }

        if (usecases.length <= 30) {
            usecases = ""
        }

        var workflow_amount = "a few"
        var admins = ""

        // Loop users
        var lastLogin = 0
        for (var i = 0; i < users.length; i++) {
            if (users[i].username.includes("shuffler")) {
                continue
            }

            if (users[i].role === "admin") {
                admins += users[i].username + ","
            }

            const data = users[i]
            for (var i = 0; i < data.login_info.length; i++) {
                if (data.login_info[i].timestamp > lastLogin) {
                    lastLogin = data.login_info[i].timestamp
                }
            }
        }


        // Remove last comma
        admins = admins.substring(0, admins.length - 1)

        if (your_apps.length > 5) {
            your_apps += "%0D%0A"
        }

        if (usecases.length > 5) {
            usecases += "%0D%0A"
        }

        // Get drift username from userdata.username before @ in email
        const username = userdata.username.substring(0, userdata.username.indexOf("@"))

        // Check if timestamp is more than 2 weeks ago and add "a while back" to the message
        const timeComparison = 1209600
        const extra_timestamp_text = lastLogin === 0 ? 0 : (Date.now() / 1000 - lastLogin) > timeComparison ? " a while back" : ""
        console.log("LAST LOGIN: " + lastLogin, extra_timestamp_text)

        // Check if cloud sync is active, and if so, add a message about it
        const cloudSyncInfo = selectedOrganization.cloud_sync === true ? "- Scale your onprem installation" : ""

        var body = `Hey,%0D%0A%0D%0AI noticed you tried to use Shuffle${extra_timestamp_text}, and thought you may be interested in a POC. It looks like you have ${workflow_amount} workflows made, but it still doesn't look like you are getting what you wanted out of  Shuffle. If you're interested, I'd love to set up a quick call to see if we can help you get more out of Shuffle. %0D%0A%0D%0A

Some of the things we can help with:%0D%0A
${your_apps}
- Configuring and authenticating your apps%0D%0A
${usecases}
- Multi-Tenancy and creating special usecases%0D%0A
${cloudSyncInfo}%0D%0A

If you're interested, please let me know a time that works for you, or set up a call here: https://drift.me/${username}`

        return `mailto:${admins}?bcc=frikky@shuffler.io,binu@shuffler.io&subject=${subject}&body=${body}`
    }

    if (
        selectedOrganization.id === undefined &&
        userdata !== undefined &&
        userdata.active_org !== undefined &&
        orgRequest
    ) {
        setOrgRequest(false);
    }


    return (
        <div style={{ width: "100%", boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: theme.palette.platformColor, borderRadius: '16px',  }}>
            <div style={{ height: "100%", width: "100%", overflowX: 'hidden', scrollbarColor: theme.palette.scrollbarColorTransparent, scrollbarWidth: 'thin'}} >
            <div style={{ marginBottom: 20 }}>
                <div style={{display:"flex"}}>
                    <div style={{width:'70%'}}>
                <Typography variant='h3' sx={{ marginBottom: "15px", marginTop: 0, }}>Organization overview</Typography>
                <Typography variant="body2" style={{ color: theme.palette.text.secondary, fontSize: 16 }}>
                    On this page organization admins can configure organisations, and sub-orgs (MSSP).{" "}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="/docs/organizations#organization"
                        style={{ color: theme.palette.linkColor, }}
                    >
                        Learn more
                    </a>
                </Typography>
                </div>
                <div style={{display:"flex", alignItems:"center", marginLeft:50}}>
                <Tooltip
                    title="Copy Organization ID"
                    aria-label="Copy orgid"
                >
                    <IconButton
                        style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            width: 40, 
                            height: 40, 
                            backgroundColor: "rgba(47, 47, 47, 1)", 
                            borderRadius: 200 
                        }}
                        onClick={() => {
                            const org_id = selectedOrganization.id;
                            
                            // Check if organization ID exists
                            if (!org_id) {
                                toast("No organization ID found");
                                return;
                            }

                            // Use clipboard API
                            navigator.clipboard.writeText(org_id)
                                .then(() => {
                                    toast.success(`${org_id} copied to clipboard`);
                                })
                                .catch((error) => {
                                    // Fallback for browsers that don't support clipboard API
                                    try {
                                        // Create temporary input element
                                        const tempInput = document.createElement('input');
                                        tempInput.value = org_id;
                                        document.body.appendChild(tempInput);
                                        tempInput.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(tempInput);
                                        toast(`${org_id} copied to clipboard`);
                                    } catch (err) {
                                        toast("Failed to copy. Please try again.");
                                        console.error("Copy failed:", err);
                                    }
                                });
                        }}
                    >
                        <FileCopyIcon style={{ color: "rgba(255,255,255,0.8)" }} />
                    </IconButton>
                </Tooltip>
                {userdata.support === true ?
                    <span style={{ display: "flex", alignItems: "center", marginLeft:16 }}>
                        {/*<a href={mailsendingButton(selectedOrganization)} target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}} disabled={selectedStatus.length !== 0}>*/}
                        <Button
                            // variant="outlined"
                            // color="primary"
                            // disabled={selectedStatus.length !== 0}
                            style={{
                                width: 180,
                                height: 40,
                                borderRadius: 4,
                                border: "1.5px solid #ff8544",
                                background: "transparent",
                                color: "#ff8544",
                                fontSize: 16,
                                textTransform: "none",
                                boxShadow: "none",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onClick={() => {
                                console.log("Should send mail to admins of org with context")
                                handleStatusChange({ target: { value: ["contacted"] } })
                                // Open a new tab
                                window.open(mailsendingButton(selectedOrganization), "_blank")
                            }}
                        >
                            Sales mail
                        </Button>

                    </span>
                    : null}
                </div>
                </div>
                
                {/* {isCloud ?
                    <Tooltip
                        title={`Your organization is in ${regiontag}. Click to change!`}
                        style={{
                        }}
                    >
                        <Avatar
                            style={{ cursor: "pointer", top: -10, right: 50, position: "absolute", }}
                            onClick={() => {
                                if (userdata.support === false) {
                                    toast("Region change is not directly implemented yet, and requires support help.")

                                    if (window.drift !== undefined) {
                                        window.drift.api.startInteraction({
                                            interactionId: 386411,
                                        })
                                    }
                                } else {
                                    // Show region change modal
                                    console.log("Should open region change modal")
                                    setRegionChangeModalOpen(true)
                                }
                            }}
                        >
                            {regiontag}
                        </Avatar>
                    </Tooltip>
                    : null} */}
            </div>
            <OrgHeader
                isCloud={isCloud}
                userdata={userdata}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                handleEditOrg={handleEditOrg}
                isEditOrgTab={true}
                handleGetOrg={handleGetOrg}
            />
            <OrgHeaderexpanded
                isCloud={isCloud}
                userdata={userdata}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                setSelectedOrganization={setSelectedOrganization}
                globalUrl={globalUrl}
                selectedOrganization={selectedOrganization}
                isEditOrgTab={true}
                handleGetOrg={handleGetOrg}
                serverside={serverside}
                handleStatusChange={handleStatusChange}
            />
            </div>
        </div >
    )
}

export default EditOrgTab;
