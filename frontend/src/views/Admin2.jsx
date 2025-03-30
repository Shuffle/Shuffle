import React, { useEffect, useState } from 'react';
import AdminNavBar from '../components/AdminNavBar.jsx';
import { toast } from "react-toastify";

const Admin2 = (props) => {
    // Destructure props if needed
    const { userdata, globalUrl, serverside, checkLogin, notifications, setNotifications, stripeKey, isLoaded, isLoggedIn} = props;
    const [selectedTab, setSelectedTab] = useState('editdetails');
    const [selectedStatus, setSelectedStatus] = React.useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState({});
    const [organizationFeatures, setOrganizationFeatures] = useState({});
    const [orgRequest, setOrgRequest] = React.useState(true);
    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";

	if (document !== undefined) {
		if (selectedOrganization?.name !== undefined) {
			document.title = selectedOrganization?.name + " - Admin - Shuffle"
		} else {
  			document.title = "Admin - Shuffle"
		}
	}

    const handleGetOrg = (orgId) => {

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
                    toast(
                        "Failed getting your org. If this persists, please contact support. Redirecting to workflows...",
                    );
                    setTimeout(() => {
                        window.location.href = "/workflows";
                    }, 3000);
                } else {
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
                        if (responseJson.lead_info.contacted) {
                            leads.push("contacted");
                        }

                        if (responseJson.lead_info.customer) {
                            leads.push("customer");
                        }

                        if (responseJson.lead_info.old_customer) {
                            leads.push("old customer");
                        }

                        if (responseJson.lead_info.old_lead) {
                            leads.push("old lead");
                        }

                        if (responseJson.lead_info.tech_partner) {
                            leads.push("tech partner");
                        }

                        if (responseJson.lead_info.integration_partner) {
                            leads.push("integration partner");
                        }

						if (responseJson.lead_info.distribution_partner) {
							leads.push("distribution partner");
						}

						if (responseJson.lead_info.service_partner) {
							leads.push("service partner");
						}

                        if (responseJson.lead_info.creator) {
                            leads.push("creator");
                        }

                        if (responseJson.lead_info.opensource) {
                            leads.push("open source");
                        }

                        if (responseJson.lead_info.demo_done) {
                            leads.push("demo done");
                        }

                        if (responseJson.lead_info.pov) {
                            leads.push("pov");
                        }

                        if (responseJson.lead_info.lead) {
                            leads.push("lead");
                        }

                        if (responseJson.lead_info.student) {
                            leads.push("student");
                        }

                        if (responseJson.lead_info.internal) {
                            leads.push("internal");
                        }

                        if (responseJson.lead_info.sub_org) {
                            leads.push("sub_org");
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
            });
    };

    
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
              toast("Successfully changed active organization - refreshing!");
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
        { mfa_required } = {}
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
        const { value } = event.target;
        setSelectedStatus(value);

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
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 29, zoom: 0.9}}>
            <AdminNavBar userdata={userdata} isLoaded={isLoaded} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedTab={selectedTab} orgId={selectedOrganization.id} handleStatusChange={handleStatusChange} handleEditOrg={handleEditOrg} handleGetOrg={handleGetOrg} setSelectedOrganization={setSelectedOrganization} selectedOrganization={selectedOrganization} setNotifications={setNotifications} stripeKey={stripeKey} notifications={notifications} checkLogin={checkLogin} globalUrl={globalUrl} isCloud={isCloud}/>
        </div>
    );
};

export default Admin2;
