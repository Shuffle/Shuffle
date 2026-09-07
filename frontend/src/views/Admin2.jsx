import React, { useContext, useEffect, useState } from 'react';
import AdminNavBar from '../components/AdminNavBar.jsx';
import { toast } from "react-toastify";
import { Context } from '../context/ContextApi.jsx';
import { useNavigate, Link } from "react-router-dom";


const Admin2 = (props) => {
    // Destructure props if needed
    const { userdata, globalUrl, serverside, checkLogin, notifications, setNotifications, stripeKey, isLoaded, } = props;
    const [selectedTab, setSelectedTab] = useState('editdetails');
    const [selectedStatus, setSelectedStatus] = React.useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState({});
    const [organizationFeatures, setOrganizationFeatures] = useState({});
    const [orgRequest, setOrgRequest] = React.useState(true);
    const [isOrgLoaded, setIsOrgLoaded] = React.useState(false);
    const {brandName, updateOrg, setUpdateOrg}  = useContext(Context)
    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";

    let navigate = useNavigate();        

	if (document !== undefined) {
        if (selectedOrganization?.name !== undefined) {
			document.title = brandName?.length > 0 ? selectedOrganization?.name + ` - Admin - ${brandName}` : selectedOrganization?.name + ` - Admin - Shuffle`;
		} else {
  			document.title = brandName?.length > 0 ? `Admin - ${brandName}` : `Admin - Shuffle`;
		}
	}

    const handleGetOrg = (orgId) => {
		if (orgId === undefined || orgId === null || orgId.length !== 36) {
			return
		}

        fetch(`${globalUrl}/api/v1/orgs/${orgId}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (response.status === 401) {
                }

                return response.json();
            })
            .then((responseJson) => {
                if (responseJson["success"] === false) {
                    toast.warn("Failed getting your org. If this persists, please contact support. Redirecting to workflows...")
                    setTimeout(() => {
                        window.location.href = "/workflows";
                    }, 3000);
                } else {

                    setUpdateOrg(false);
                    if (
                        responseJson.sync_features === undefined ||
                        responseJson.sync_features === null
                    ) {
                        responseJson.sync_features = {};
                    }

                    if (
                        responseJson.lead_info !== undefined &&
                        responseJson.lead_info !== null
                    ) {
                        var leads = [];
                        if (responseJson.lead_info.pov) {
                            leads.push("POC License");
                        }

                        if (responseJson.lead_info.shuffle_enterprise_license_old_customer) {
                            leads.push("Enterprise License (Legacy)");
                        }

                        if (responseJson.lead_info.scale_license_cloud_trial) {
                            leads.push("Scale License Cloud Trial");
                        }

                        if (responseJson.lead_info.scale_license_cloud_customer) {
                            leads.push("Scale License Cloud");
                        }

                        if (responseJson.lead_info.scale_license_onprem_customer) {
                            leads.push("Scale License Onprem");
                        }

                        if (responseJson.lead_info.opensource_license) {
                            leads.push("Open Source License");
                        }

                        if (responseJson.lead_info.business_license_cloud) {
                            leads.push("Business License Cloud");
                        }

                        if (responseJson.lead_info.business_license_onprem) {
                            leads.push("Business License Onprem");
                        }

                        if (responseJson.lead_info.enterprise_license_cloud) {
                            leads.push("Enterprise License Cloud");
                        }

                        if (responseJson.lead_info.enterprise_license_onprem) {
                            leads.push("Enterprise License Onprem");
                        }

                        if (responseJson.lead_info.integration_partner) {
                            leads.push("Integration Partner");
                        }

                        if (responseJson.lead_info.service_partner) {
                            leads.push("Service Partner");
                        }

                        if (responseJson.lead_info.channel_partner) {
                            leads.push("Channel Partner");
                        }

                        if (responseJson.lead_info.tech_partner) {
                            leads.push("Technology Partner");
                        }

                        // Legacy statuses
                        if (responseJson.lead_info.contacted) {
                            leads.push("Contacted");
                        }

                        if (responseJson.lead_info.lead) {
                            leads.push("Lead");
                        }

                        if (responseJson.lead_info.demo_done) {
                            leads.push("Demo Done");
                        }

                        if (responseJson.lead_info.customer) {
                            leads.push("Customer");
                        }

                        if (responseJson.lead_info.old_customer) {
                            leads.push("Old Customer");
                        }

                        if (responseJson.lead_info.old_lead) {
                            leads.push("Old Lead");
                        }

                        if (responseJson.lead_info.opensource) {
                            leads.push("Open Source");
                        }

                        if (responseJson.lead_info.opensource_license) {
                            leads.push("Open Source License");
                        }

                        if (responseJson.lead_info.internal) {
                            leads.push("Internal");
                        }

                        if (responseJson.lead_info.sub_org) {
                            leads.push("Sub Org");
                        }

                        if (responseJson.lead_info.student) {
                            leads.push("Student");
                        }

                        if (responseJson.lead_info.creator) {
                            leads.push("Creator");
                        }

                        if (responseJson.lead_info.testing_shuffle) {
                            leads.push("Testing Shuffle");
                        }

                        if (responseJson.lead_info.distribution_partner) {
                            leads.push("Distribution Partner");
                        }

                        setSelectedStatus(leads);
                    }


                    setSelectedOrganization(responseJson)
                    var lists = {
                        active: {
                            triggers: [],
                            features: [],
                            sync: [],
                        },
                        inactive: {
                            triggers: [],
                            features: [],
                            sync: [],
                        },
                    };

                    // FIXME: Set up features
                    //Object.keys(responseJson.sync_features).map(function(key, index) {
                    //	//console.log(responseJson.sync_features[key])
                    //})

                    //setOrgName(responseJson.name)
                    //setOrgDescription(responseJson.description)
                    setOrganizationFeatures(lists);
                }
            })
            .catch((error) => {
                console.log("Error getting org: ", error);
                toast("Error getting current organization");
            }).finally(() => {
                setIsOrgLoaded(true)
            });
    };

    useEffect(() => {
        if (updateOrg && userdata?.active_org?.id !== undefined && userdata?.active_org?.id !== null && userdata?.active_org?.id.length > 0) {
            handleGetOrg(userdata.active_org.id);
            setUpdateOrg(false);
        }
        
    }, [updateOrg]);
    
    useEffect(() => {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        const foundOrgID = params["org_id"] 
        if(foundOrgID !== null && foundOrgID !== undefined && userdata?.support && foundOrgID?.length > 0) {
              handleClickChangeOrg(foundOrgID)
          }
      }, [userdata]);

      const handleClickChangeOrg = (orgId) => {
        // Don't really care about the logout
        //name: org.name,
        //orgId = "asd"
        const data = {
          org_id: orgId,
        };
    
        localStorage.setItem("globalUrl", "");
        localStorage.setItem("getting_started_sidebar", "open");
    
        fetch(`${globalUrl}/api/v1/orgs/${orgId}/change`, {
          mode: "cors",
          credentials: "include",
          crossDomain: true,
          method: "POST",
          body: JSON.stringify(data),
          withCredentials: true,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        })
          .then(function (response) {
            if (response.status !== 200) {
              console.log("Error in response");
            } else {
              localStorage.removeItem("apps")
              localStorage.removeItem("workflows")
              localStorage.removeItem("userinfo")
            }
    
            return response.json();
          })
          .then(function (responseJson) {
            if (responseJson.success === true) {
              if (responseJson.region_url !== undefined && responseJson.region_url !== null && responseJson.region_url.length > 0) {
                localStorage.setItem("globalUrl", responseJson.region_url)
                //globalUrl = responseJson.region_url
              }
    
              setTimeout(() => {
                window.location.reload()
              }, 3000);

			  toast.success("Successfully changed active organization - refreshing!");
			  if (responseJson.org_id !== undefined && responseJson.org_id !== null && responseJson.org_id.length === 36) {
				  navigate(`/admin?org_id=${responseJson.org_id}`)
			  } else {
				  if (orgId !== undefined && orgId !== null && orgId?.includes("@")) {
					  navigate(`/admin`)
				  } else {
					  toast("No pivot?")
				  }
			  }
			} else {
				if (responseJson.reason !== undefined && responseJson.reason !== null) {
					if (!responseJson.reason.includes("already")) {
						toast("Failed changing org: " + responseJson.reason);
					}
				} else {
					toast("Failed changing org")
				}
			}
          })
          .catch((error) => {
            console.log("error changing: ", error);
            //removeCookie("session_token", {path: "/"})
          });
      };

    const handleEditOrg = (
        name,
        description,
        orgId,
        image,
        defaults,
        sso_config,
        lead_info,
        { mfa_required } = {},
        editing,
    ) => {
        const data = {
            name: name,
            description: description,
            org_id: orgId?.length > 0 ? orgId : selectedOrganization?.id,
            image: image,
            defaults: defaults,
            sso_config: sso_config,
            lead_info: lead_info,
            mfa_required: mfa_required !== undefined  ? mfa_required : selectedOrganization?.mfa_required,
            editing: editing?.length > 0 ? editing : "",
        };

        const url = globalUrl + `/api/v1/orgs/${selectedOrganization.id}`;
        fetch(url, {
            mode: "cors",
            method: "POST",
            body: JSON.stringify(data),
            credentials: "include",
            crossDomain: true,
            withCredentials: true,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson["success"] === false) {
                        toast("Failed updating org: ", responseJson.reason);
                    } else {
                        handleGetOrg(selectedOrganization?.id);
                        if (
                            lead_info === undefined ||
                            lead_info === null ||
                            lead_info === []
                        ) {
                            toast("Successfully edited org!");
                        }
                    }
                }),
            )
            .catch((error) => {
                toast("Err: " + error.toString());
            });
    };


    const handleStatusChange = (event) => {
        let { value } = event.target
        console.log("selcted status is: ", event.target.value)
        const customerLicenses = [
            "Enterprise License (Legacy)",
            "Scale License Cloud",
            "Scale License Onprem",
            "Business License Cloud",
            "Business License Onprem",
            "Enterprise License Cloud",
            "Enterprise License Onprem",
        ]
        const openSourceLicenses = [
            "Scale License Onprem",
            "Open Source License",
            "Business License Onprem",
            "Enterprise License Onprem",
        ]

        // License tiers are mutually exclusive - an org can only be on one at a time.
        const tierLicenses = [
            "POC License",
            "Scale License Cloud Trial",
            "Scale License Cloud",
            "Scale License Onprem",
            "Business License Cloud",
            "Business License Onprem",
            "Enterprise License Cloud",
            "Enterprise License Onprem",
        ]
        const selectedTiers = value.filter(v => tierLicenses.includes(v))
        if (selectedTiers.length > 1) {
            const newlyAddedTier = selectedTiers.find(v => !selectedStatus.includes(v))
            const tierToKeep = newlyAddedTier || selectedTiers[selectedTiers.length - 1]
            value = value.filter(v => !tierLicenses.includes(v) || v === tierToKeep)
        }

        const hasCustomerLicense = value.some(v => customerLicenses.includes(v))
        const hasOpenSourceLicense = value.some(v => openSourceLicenses.includes(v))

        if (hasCustomerLicense) {
            if (!value.includes("Customer")) {
                value = [...value, "Customer"]
            }
        } else {
            value = value.filter(v => v !== "Customer")
        }

        if (hasOpenSourceLicense) {
            if (!value.includes("Open Source")) {
                value = [...value, "Open Source"]
            }
        } else {
            value = value.filter(v => v !== "Open Source")
        }

        setSelectedStatus(value)

        handleEditOrg(
            selectedOrganization?.name,
            selectedOrganization?.description,
            selectedOrganization.id,
            selectedOrganization?.image,
            {
                app_download_repo: selectedOrganization?.defaults?.app_download_repo,
                app_download_branch: selectedOrganization?.defaults?.app_download_branch,
                workflow_download_repo: selectedOrganization?.defaults?.workflow_download_repo,
                workflow_download_branch: selectedOrganization?.defaults?.workflow_download_branch,
                notification_workflow: selectedOrganization?.defaults?.notification_workflow,
                documentation_reference: selectedOrganization?.defaults?.documentation_reference,
                workflow_upload_repo: selectedOrganization?.defaults?.workflow_upload_repo,
                workflow_upload_branch: selectedOrganization?.defaults?.workflow_upload_branch,
                workflow_upload_username: selectedOrganization?.defaults?.workflow_upload_username,
                workflow_upload_token: selectedOrganization?.defaults?.workflow_upload_token,
                newsletter: !selectedOrganization?.defaults?.newsletter,
                weekly_recommendations: selectedOrganization?.defaults?.weekly_recommendations,
            },
            {
                sso_entrypoint: selectedOrganization?.sso_config?.sso_entrypoint,
                sso_certificate: selectedOrganization?.sso_config?.sso_certificate,
                client_id: selectedOrganization?.sso_config?.client_id,
                client_secret: selectedOrganization?.sso_config?.client_secret,
                openid_authorization: selectedOrganization?.sso_config?.openid_authorization,
                openid_token: selectedOrganization?.sso_config?.openid_token,
                SSORequired: selectedOrganization?.sso_config?.SSORequired,
                auto_provision: selectedOrganization?.sso_config?.auto_provision,
            },
            value.length === 0 ? ["none"] : value,
        );
    };

    if (
        selectedOrganization.id === undefined &&
        userdata !== undefined &&
        userdata.active_org !== undefined &&
        orgRequest
    ) {
        const orgId = userdata.active_org.id
        
        setOrgRequest(false);
        handleGetOrg(orgId);
    }

    return (
        //<div style={{ display: 'flex', justifyContent: 'center', paddingTop: 29, zoom: 0.9}}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 29, zoom: 1, }}>
            <AdminNavBar userdata={userdata} isLoaded={isLoaded} isOrgLoaded={isOrgLoaded} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedTab={selectedTab} orgId={selectedOrganization.id} handleStatusChange={handleStatusChange} handleEditOrg={handleEditOrg} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} setNotifications={setNotifications} stripeKey={stripeKey} notifications={notifications} checkLogin={checkLogin} globalUrl={globalUrl} isCloud={isCloud}/>
        </div>
    );
};

export default Admin2;
