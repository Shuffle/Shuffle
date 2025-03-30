import React, { useState, useEffect, useContext, memo } from "react";
import { toast } from 'react-toastify';

import {
    FormControl,
    InputLabel,
    OutlinedInput,
    Checkbox,
    Tooltip,
    Typography,
    Select,
    MenuItem,
    Divider,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    CircularProgress,
    Skeleton,
    Switch,
    Box,
} from "@mui/material";

import {
    Cached as CachedIcon,
    Edit as EditIcon,
    Style,
} from "@mui/icons-material";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

import theme from "../theme.jsx";
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 500,
        },
    },
    getContentAnchorEl: () => null,
};

const logsViewModal = false;
const userdata = "";

const UserManagmentTab = memo((props) => {
    const { userdata, isCloud, globalUrl, selectedOrganization, handleEditOrg} = props;
    const [modalOpen, setModalOpen] = React.useState(false);
    const [loginInfo, setLoginInfo] = React.useState("");
    const [modalUser, setModalUser] = React.useState({});
    const [selectedUser, setSelectedUser] = React.useState({});
    const [matchingOrganizations, setMatchingOrganizations] = React.useState([]);
    const [selectedUserModalOpen, setSelectedUserModalOpen] = React.useState(false);
    const [image2FA, setImage2FA] = React.useState("");
    const [secret2FA, setSecret2FA] = React.useState("");
    const [value2FA, setValue2FA] = React.useState("");
    const [newUsername, setNewUsername] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [show2faSetup, setShow2faSetup] = useState(false);
    const [showDeleteAccountTextbox, setShowDeleteAccountTextbox] = React.useState(false);
    const [MFARequired, setMFARequired] = React.useState(selectedOrganization.mfa_required === undefined ? false : selectedOrganization.mfa_required);
    const [deleteAccountText, setDeleteAccountText] = React.useState("");
    const [users, setUsers] = React.useState([]);
    const [showLoader, setShowLoader] = useState(true);
    const [logsLoading, setLogsLoading] = React.useState(true);
    const [logs, setLogs] = React.useState([]);
    const [logsViewModal, setLogsViewModal] = React.useState(false);
    const [ipSelected, setIpSelected] = React.useState("");
    const [userLogViewing, setUserLogViewing] = React.useState({});

    useEffect(() => {
        if (selectedOrganization?.mfa_required !== MFARequired) {
          setMFARequired(selectedOrganization?.mfa_required);
        }
      }, [selectedOrganization]);
    useEffect(() => { if(users?.length === 0){
        getUsers();
    } }, []);
    
    const changeModalData = (field, value) => {
        modalUser[field] = value;
    };

    const submitUser = (data) => {
        console.log("INPUT: ", data);
        setLoginInfo("");

        // Just use this one?
        var data = { username: data.Username, password: data.Password };
        var baseurl = globalUrl;
        const url = baseurl + "/api/v1/users/register";

        fetch(url, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson["success"] === false) {
                        setLoginInfo("Error: " + responseJson.reason);
                    } else {
                        setLoginInfo("");
                        toast.success("User added successfully. They will show up in the list when they have accepted the invite.");
                        setModalOpen(false);
                        setTimeout(() => {
                            getUsers();
                        }, 1000);
                    }
                })
            )
            .catch((error) => {
                console.log("Error in userdata: ", error);
            });
    };

    const setUser = (userId, field, value) => {
        const data = { user_id: userId };
        data[field] = value;

        fetch(globalUrl + "/api/v1/users/updateuser", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for WORKFLOW EXECUTION :O!");
                } else {
                    getUsers();
                }

                return response.json();
            })
            .then((responseJson) => {
                if (!responseJson.success && responseJson.reason !== undefined) {
                    toast("Failed setting user: " + responseJson.reason);
                } else if (responseJson.success === false) {
                    toast("Failed to update user");
                } else {
                    //toast("Set the user field " + field + " to " + value);
                    toast("Successfully updated user field " + field);

                    if (field !== "suborgs") {
                        setSelectedUserModalOpen(false);
                    }
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const inviteUser = (data) => {
        //console.log("INPUT: ", data);
        setLoginInfo("");

        // Just use this one?
        var data = {
            username: data.Username,
            type: "invite",
            org_id: selectedOrganization.id,
        };
        var baseurl = globalUrl;
        const url = baseurl + "/api/v1/users/register_org";

        fetch(url, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) =>
                response.json().then((responseJson) => {
                    if (responseJson["success"] === false) {
                        setLoginInfo("Error: " + responseJson.reason);
                        toast("Failed to send email (2). Please try again and contact support if this persists.")
                    } else {
                        setLoginInfo("");
                        setModalOpen(false);
                        setTimeout(() => {
                            getUsers();
                        }, 1000);

                        toast("Invite sent! They will show up in the list when they have accepted the invite.")
                    }
                })
            )
            .catch((error) => {
                console.log("Error in userdata: ", error);
                toast("Failed to send email. Please try again and contact support if this persists.")
            });
    };
    const onPasswordChange = () => {
        const data = { username: selectedUser.username, newpassword: newPassword };
        const url = globalUrl + "/api/v1/users/passwordchange";

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
                        if (responseJson.reason !== undefined) {
                            toast(responseJson.reason);
                        } else {
                            toast("Failed setting new password");
                        }
                    } else {
                        toast("Successfully updated password!");
                        setSelectedUserModalOpen(false);
                    }
                }),
            )
            .catch((error) => {
                toast("Err: " + error.toString());
            });
    };

    const handleOrgEditChange = (event) => {
        if (userdata.id === selectedUser.id) {
            toast("Can't remove orgs from yourself");
            return;
        }

		if (event.target.value.includes("ALL")) {
			toast.info("Adding to available all sub-organizations. This may take a minute.")
			event.target.value = selectedOrganization.child_orgs.map((org) => org.id)
		} else if (event.target.value.includes("None")) { 
			toast.info("Removing from all sub-organizations. This may take a minute")
			event.target.value = []
		}

        console.log("event: ", event.target.value);
        setMatchingOrganizations(event.target.value);
        // Workaround for empty orgs
        if (event.target.value.length === 0) {
            event.target.value.push("REMOVE");
        }

        setUser(selectedUser.id, "suborgs", event.target.value);
        //setUser(selectedUser.id, "suborgs", matchingOrganizations)
    };

    const userOrgEdit =
        selectedUser.id !== undefined &&
            selectedUser?.orgs !== undefined &&
            selectedUser?.orgs !== null &&
            selectedOrganization?.child_orgs !== undefined &&
            selectedOrganization?.child_orgs !== null &&
            selectedOrganization?.child_orgs?.length > 0 ? (
            <FormControl fullWidth sx={{ m: 1 }}>
                <InputLabel id="demo-multiple-checkbox-label" style={{ padding: 5 }}>
                    Accessible Sub-Organizations (
                    {selectedUser?.orgs ? selectedUser?.orgs?.length - 1 : 0})
                </InputLabel>
                <Select
                    fullWidth
                    style={{ width: "100%" }}
                    disabled={selectedUser?.id === userdata?.id}
                    labelId="demo-multiple-checkbox-label"
                    id="demo-multiple-checkbox"
                    multiple
                    value={matchingOrganizations}
                    onChange={handleOrgEditChange}
                    input={<OutlinedInput label="Tag" />}
                    renderValue={(selected) => {
                        return selected.join(", ");
                    }}
                    MenuProps={MenuProps}
                >
					<MenuItem key={-2} value={"None"}>
						<Checkbox checked={false} />
						<ListItemText primary={"None"} />
					</MenuItem>
					<MenuItem key={-1} value={"ALL"}>
						<Checkbox checked={false} />
						<ListItemText primary={"ALL"} />
					</MenuItem>
                    {selectedOrganization.child_orgs.map((org, index) => (
                        <MenuItem key={index} value={org.id}>
                            <Checkbox checked={matchingOrganizations.indexOf(org.id) > -1} />
                            <ListItemText primary={org.name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        ) : null;

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
                setShowLoader(false)
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const deleteUser = (data) => {
        // Just use this one?
        const userId = data.id;

        const url = globalUrl + "/api/v1/users/" + userId;
        fetch(url, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (response.status === 200) {
                    getUsers();
                }

                return response.json();
            })
            .then((responseJson) => {
                if (!responseJson.success && responseJson.reason !== undefined) {
                    toast("Failed to deactivate user: " + responseJson.reason);
                } else if (responseJson.success === false) {
                    toast(
                        "Failed to deactivate user. Please contact support@shuffler.io if this persists.",
                    );
                } else {
                    toast("Changed activation for user " + data.id);
                }
            })

            .catch((error) => {
                console.log("Error in userdata: ", error);
            });
    };

    const handleDeleteAccount = (userID) => {
        if (userID === undefined || userID === null || userID === "") {
            return;
        }

        const url = `${globalUrl}/api/v1/users/${userID}/remove`;
        fetch(url, {
            mode: "cors",
            method: "DELETE",
            credentials: "include",
            crossDomain: true,
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    toast.success(
                        "Deleted their account. Would reload users in a few seconds.",
                    );

                    setTimeout(() => {
                        getUsers();
                    });
                } else {
                    toast.error(`${data.reason}`);
                }
            })
            .catch((error) => {
                console.error(
                    "There was a problem with deleting the account. Please try again:",
                    error,
                );
                toast.error(
                    "There was a problem with the delete request. Please try again",
                );
            });
    };

    const handleVerify2FA = (userId, code) => {
        const data = {
            code: code,
            user_id: userId,
        };

        fetch(`${globalUrl}/api/v1/users/${userId}/set2fa`, {
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
            .then((response) => {
                if (response.status === 200) {
                } else {
                    //toast("Wrong code sent.")
                    //toast("Wrong code sent. Please try again.")
                }

                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.success === true) {
                    toast("Successfully enabled 2fa");

                    setTimeout(() => {
                        getUsers();

                        setImage2FA("");
                        setValue2FA("");
                        setSecret2FA("");
                        setShow2faSetup(false);
                        setSelectedUserModalOpen(false);
                    }, 1000);
                } else {
                    toast("Wrong code sent. Please try again.");
                    //toast("Failed setting 2fa: ", responseJson.reason)
                }
            })
            .catch((error) => {
                toast("Wrong code sent. Please try again.");
                //toast("Err: " + error.toString())
            });
    };

    const get2faCode = (userId) => {
        fetch(`${globalUrl}/api/v1/users/${userId}/get2fa`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for apps :O!");
                }

                return response.json();
            })
            .then((responseJson) => {
                //console.log("RESPONSE: ", responseJson)
                if (responseJson.success === true) {
                    //toast(responseJson.reason)
                    setImage2FA(responseJson.reason);
                    setSecret2FA(responseJson.extra);
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    const generateApikey = (user) => {
        const userId = user.id;
        const data = { user_id: userId };

        toast("Generating new API key");

        var fetchdata = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        };

        if (userId === userdata.id) {
            fetchdata.method = "GET";
        } else {
            fetchdata.body = JSON.stringify(data);
        }

        fetch(globalUrl + "/api/v1/generateapikey", fetchdata)
            .then((response) => {
                if (response.status !== 200) {
                    console.log("Status not 200 for WORKFLOW EXECUTION :O!");
                } else {
                    getUsers();
                }

                return response.json();
            })
            .then((responseJson) => {
                console.log("RESP: ", responseJson);
                if (!responseJson.success && responseJson.reason !== undefined) {
                    toast("Failed getting new: " + responseJson.reason);
                } else {
                    toast("Got new API key");
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const UpdateMFAInUserOrg = (org_id) => {
        
        handleEditOrg(
            selectedOrganization?.name,
            selectedOrganization?.description,
            selectedOrganization?.id,
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
				newsletter: selectedOrganization?.defaults?.newsletter,
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
            [],
            {
                mfa_required: !MFARequired
            }
        );
        setMFARequired((prev)=> !prev)
      }

    const modalView = (
        <Dialog
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                PaperProps={{
                    sx: {
                      borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                      border: theme?.palette?.DialogStyle?.border,
                      minWidth: '440px',
                      fontFamily: theme?.typography?.fontFamily,
                      backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                      zIndex: 1000,
                      '& .MuiDialogContent-root': {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                      },
                      '& .MuiDialogTitle-root': {
                        backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                      },
                    }
                  }}
            >
            <DialogTitle>
                <Typography style={{ color: "white", textTransform: 'none', fontSize: 24 }}>
                    Add user
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" style={{ marginBottom: 10 }}>
                    We will send an email to invite them to your organization.
                </Typography>
                <div>
                    Username
                    <TextField
                        color="primary"
                        style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
                        autoFocus
                        InputProps={{
                            style: {
                                height: "50px",
                                color: "white",
                                fontSize: "1em",
                            },
                        }}
                        required
                        fullWidth={true}
                        autoComplete="username"
                        placeholder="username@example.com"
                        id="emailfield"
                        margin="normal"
                        variant="outlined"
                        onKeyUp={(e)=>{
                            if(e.key === "Enter"){
                                if (isCloud) {
                                    inviteUser(modalUser);
                                } else {
                                    submitUser(modalUser);
                                }
                            }
                        }}
                        onChange={(event) =>
                            changeModalData("Username", event.target.value)
                        }
                    />
                    {isCloud ? null : (
                        <span>
                            Password
                            <TextField
                                color="primary"
                                style={{ backgroundColor: theme.palette.textFieldStyle.backgroundColor }}
                                InputProps={{
                                    style: {
                                        height: "50px",
                                        color: "white",
                                        fontSize: "1em",
                                    },
                                }}
                                required
                                fullWidth={true}
                                autoComplete="password"
                                type="password"
                                placeholder="********"
                                id="pwfield"
                                margin="normal"
                                variant="outlined"
                                onKeyUp={(e)=>{
                                    if(e.key === "enter"){
                                        if (isCloud) {
                                            inviteUser(modalUser);
                                        } else {
                                            submitUser(modalUser);
                                        }
                                    }
                                }}
                                onChange={(event) =>
                                    changeModalData("Password", event.target.value)
                                }
                            />
                        </span>
                    )}
                </div>
                {loginInfo}
            </DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, backgroundColor: "#212121" }}>
                <Button
                    style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#ff8544", marginRight: 5 }}
                    onClick={() => setModalOpen(false)}
                    color="primary"
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    style={{ borderRadius: "2px", textTransform: 'none', fontSize:16, color: "#1a1a1a", backgroundColor: "#ff8544" }}
                    onClick={() => {
                        if (isCloud) {
                            inviteUser(modalUser);
                        } else {
                            submitUser(modalUser);
                        }
                    }}
                    color="primary"
                >
                    Submit
                </Button>
            </Box>
        </Dialog>
    );

    const run2FASetup = (data) => {
        if (!show2faSetup) {
            get2faCode(data.id);
        } else {
            // Should remove?
            setImage2FA("");
            setSecret2FA("");
        }

        setShow2faSetup(!show2faSetup);
        //setShow2faSetup(true);
    };
    
    const editUserModal = (
        <Dialog
            open={selectedUserModalOpen}
            onClose={() => {
                setSelectedUserModalOpen(false);
                setImage2FA("");
                setValue2FA("");
                setSecret2FA("");
                setShow2faSetup(false);
            }}
            PaperProps={{
                sx: {
                  borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                  border: theme?.palette?.DialogStyle?.border,
                  fontFamily: theme?.typography?.fontFamily,
                  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  zIndex: 1000,
                  minWidth: "800px",
                  minHeight: "320px",
                  overflow: "hidden",
                  '& .MuiDialogContent-root': {
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  },
                  '& .MuiDialogTitle-root': {
                    backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                  },
                }
              }}
        >
            <DialogTitle style={{ maxWidth: "800px", width: "100%", textAlign: "center", margin: "auto", backgroundColor: theme?.palette?.DialogStyle?.backgroundColor}}>
                <span style={{ color: "white", backgroundColor: theme?.palette?.DialogStyle?.backgroundColor }}>
                    <EditIcon style={{ marginTop: 5 }} /> Editing {selectedUser.username}
                </span>
            </DialogTitle>
            <DialogContent>
                {isCloud ? null : (
                    <div style={{ display: "flex" }}>
                        <TextField
                            style={{
                                marginTop: 0,
                                backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                flex: 3,
                                marginRight: 10,
                            }}
                            InputProps={{
                                style: {
                                    height: 50,
                                    color: "white",
                                },
                            }}
                            color="primary"
                            required
                            fullWidth={true}
                            placeholder="New username"
                            type="text"
                            id="standard-required"
                            autoComplete="username"
                            margin="normal"
                            variant="outlined"
                            defaultValue={selectedUser.username}
                            onChange={(e) => {
                                setNewUsername(e.target.value);
                            }}
                        />
                        <Button
                            style={{ maxHeight: 50, flex: 1 }}
                            variant="outlined"
                            color="primary"
                            disabled={selectedUser.role === "admin"}
                            onClick={() => {
                                setUser(selectedUser.id, "username", newUsername);
                            }}
                        >
                            Submit
                        </Button>
                    </div>
                )}

                {isCloud ? null : (
                    <div style={{ display: "flex" }}>
                        <TextField
                            style={{
                                marginTop: 0,
                                backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                flex: 3,
                                marginRight: 10,
                            }}
                            InputProps={{
                                style: {
                                    height: 50,
                                    color: "white",
                                },
                            }}
                            color="primary"
                            required
                            fullWidth={true}
                            placeholder="New password"
                            type="password"
                            id="standard-required"
                            autoComplete="password"
                            margin="normal"
                            variant="outlined"
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                            style={{ maxHeight: 50, flex: 1 }}
                            variant="outlined"
                            color="primary"
                            disabled={selectedUser.role === "admin"}
                            onClick={() => onPasswordChange()}
                        >
                            Submit
                        </Button>
                    </div>
                )}

                {userOrgEdit}
                <Divider
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        backgroundColor: theme.palette.inputColor,
                    }}
                />
                <div style={{ margin: "auto", maxWidth: 450 }}>
                    <Button
                        style={{textTransform: 'none', fontSize: 16}}
                        variant="outlined"
                        color="primary"
                        disabled={selectedUser.username === userdata.username}
                        onClick={() => {
                            deleteUser(selectedUser);
                            setSelectedUserModalOpen(false);
                        }}
                    >
                        {selectedUser.active ? "Delete from org" : "Delete from org"}
                    </Button>
                    <Button
                        style={{ textTransform: 'none', fontSize: 16 }}
                        variant="outlined"
                        color="primary"
                        disabled={
                            selectedUser.role === "admin" &&
                            selectedUser.username !== userdata.username
                        }
                        onClick={() => generateApikey(selectedUser)}
                    >
                        Renew API-key
                    </Button>
                    <Button
                        onClick={() => {
                            run2FASetup(userdata);
                        }}
                        disabled={
                            selectedUser.role === "admin" &&
                            selectedUser.username !== userdata.username
                        }
                        variant="outlined"
                        color="primary"
                        style={{textTransform: 'none', fontSize: 16}}
                    >
                        {selectedUser.mfa_info !== undefined &&
                            selectedUser.mfa_info !== null &&
                            selectedUser.mfa_info.active === true
                            ? "Disable 2FA"
                            : "Enable 2FA"}
                    </Button>

                    {isCloud && userdata.support && selectedUser.id !== userdata.id ? (
                        <Button
                            style={{
                                width: "100%",
                                height: 60,
                                marginTop: 50,
                                border: "1px solid #d52b2b",
                                textTransform: "none",
                                color:
                                    showDeleteAccountTextbox === true &&
                                        deleteAccountText?.length > 0 &&
                                        deleteAccountText === selectedUser?.username
                                        ? "white"
                                        : "#d52b2b",
                                backgroundColor:
                                    showDeleteAccountTextbox === true &&
                                        deleteAccountText?.length > 0 &&
                                        deleteAccountText === selectedUser.username
                                        ? "#d52b2b"
                                        : "transparent",
                            }}
                            disabled={
                                showDeleteAccountTextbox === false
                                    ? false
                                    : showDeleteAccountTextbox === true &&
                                        deleteAccountText?.length > 0 &&
                                        deleteAccountText === selectedUser.username
                                        ? false
                                        : true
                            }
                            onClick={() => {
                                if (
                                    deleteAccountText?.length > 0 &&
                                    deleteAccountText === selectedUser?.username
                                ) {
                                    console.log("Should delete: ", selectedUser.username);
                                    handleDeleteAccount(selectedUser.id);

                                    setShowDeleteAccountTextbox(false);
                                    setDeleteAccountText("");
                                    setSelectedUserModalOpen(false);
                                } else {
                                    setShowDeleteAccountTextbox(true);
                                }
                            }}
                        >
                            Delete Account Permanently <br />
                            (support users - confirmation needed)
                        </Button>
                    ) : null}

                    {showDeleteAccountTextbox ? (
                        <TextField
                            style={{
                                marginTop: 10,
                            }}
                            InputProps={{
                                style: {
                                    height: 50,
                                    color: "white",
                                },
                            }}
                            color="primary"
                            required
                            fullWidth={true}
                            label="Type the users' username"
                            placeholder="username@example.com"
                            value={deleteAccountText}
                            onChange={(e) => {
                                setDeleteAccountText(e.target.value);
                            }}
                        />
                    ) : null}
                </div>
                {show2faSetup ? (
                    <div
                        style={{
                            margin: "auto",
                            maxWidth: 300,
                            minWidth: 300,
                            marginTop: 25,
                        }}
                    >
                        {/*<Divider style={{marginTop: 20, marginBottom: 20}} />*/}

                        {secret2FA !== undefined &&
                            secret2FA !== null &&
                            secret2FA?.length > 0 ? (
                            <span>
                                <Typography variant="body2" color="textSecondary">
                                    Scan the image below with the two-factor authentication app on
                                    your phone. If you can’t use a QR code, use the code{" "}
                                    {secret2FA} instead.
                                </Typography>
                            </span>
                        ) : null}
                        {image2FA !== undefined &&
                            image2FA !== null &&
                            image2FA?.length > 0 ? (
                            <img
                                alt={"2 factor img"}
                                src={image2FA}
                                style={{
                                    margin: "auto",
                                    marginTop: 25,
                                    maxHeight: 200,
                                    maxWidth: 200,
                                    minWidth: 200,
                                    maxWidth: 200,
                                }}
                            />
                        ) : (
                            <CircularProgress />
                        )}

                        <Typography variant="body2" color="textSecondary">
                            After scanning the QR code image, the app will display a code that
                            you can enter below.
                        </Typography>
                        <div style={{ display: "flex" }}>
                            <TextField
                                color="primary"
                                style={{
                                    flex: 2,
                                    backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                    marginRight: 10,
                                }}
                                InputProps={{
                                    style: {
                                        height: 50,
                                        color: "white",
                                        fontSize: "1em",
                                    },
                                    maxLength: 6,
                                }}
                                required
                                fullWidth={true}
                                id="2fa_key"
                                margin="normal"
                                placeholder="6-digit code"
                                variant="outlined"
                                onChange={(event) => {
                                    if (event.target.value.length > 6) {
                                        return;
                                    }

                                    setValue2FA(event.target.value);
                                }}
                            />
                            <Button
                                disabled={value2FA?.length !== 6}
                                variant="contained"
                                style={{ marginTop: 15, height: 50, flex: 1 }}
                                onClick={() => {
                                    handleVerify2FA(userdata.id, value2FA);
                                }}
                                color="primary"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );

    const getLogs = (ip, userId) => {
        setLogsLoading(true);
        console.log("logs loading: ", logsLoading);
        fetch(`${globalUrl}/api/v1/users/${userId}/audit?user_ip=${ip}`, {
          mode: "cors",
          method: "GET",
          credentials: "include",
          crossDomain: true,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        })
          .then((response) => {
            return response.json();
          })
          .then((responseJson) => {
            console.log("ResponseJSON: ", responseJson);
            if (responseJson.success === true) {
              setLogs(responseJson.logs);
            } else {
              if (
                responseJson.success === false ||
                responseJson.reason !== undefined
              ) {
                console.log("Reason given: ", responseJson.reason);
                toast("Failed getting logs: " + responseJson.reason);
                setLogs([]);
              } else {
                toast("Failed getting logs");
              }
            }
            console.log("logs loading now: ", logsLoading);
            setLogsLoading(false);
          })
          .catch((error) => {
            console.log("Error: ", error);
            toast("Failed getting logs. Please contact: ", error);
            console.log("logs loading now: ", logsLoading);
            setLogsLoading(false);
          });
    };

    const logview = logsViewModal ? (
        <Dialog
          open={logsViewModal}
          onClose={() => {
            setLogsViewModal(false);
          }}
          PaperProps={{
            sx: {
                borderRadius: theme?.palette?.DialogStyle?.borderRadius,
                border: theme?.palette?.DialogStyle?.border,
                minWidth: "1200px",
                minHeight: "320px",
                fontFamily: theme?.typography?.fontFamily,
                backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                zIndex: 1000,
                '& .MuiDialogContent-root': {
                  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                },
                '& .MuiDialogTitle-root': {
                  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                },
                '& .MuiDialogActions-root': {
                  backgroundColor: theme?.palette?.DialogStyle?.backgroundColor,
                },
            },
        }}
        >
          <DialogTitle>
            <span style={{ color: "white" }}>User Logs</span>
          </DialogTitle>
          <DialogContent>
            {/* ask user for which IP they want to see logs for by iterating of user.login_info */}
            <FormControl fullWidth>
              <InputLabel
                style={{ size: 10 }}
                id="user-ip-simple-select-label"
              >
                User IP
              </InputLabel>

              <Select
                labelId="user-ip-simple-select-label"
                id="user-ip-simple-select"
                onChange={(event) => {
                  setIpSelected(event.target.value);
                  getLogs(event.target.value, userLogViewing.id);


                }}
              >
                {(() => {
                  const uniqueIPs = new Set();

                  return userLogViewing.login_info.map((data, index) => {
                    if (
                      data.ip.includes("127.0.0.1") ||
                      uniqueIPs.has(data.ip)
                    ) {
                      return null;
                    }

                    uniqueIPs.add(data.ip);

                    return (
                      <MenuItem key={index} value={data.ip}>
                        {data.ip}
                      </MenuItem>
                    );
                  });
                })()}
              </Select>
            </FormControl>

            {logsLoading && ipSelected.length !== 0 ? (
              <div
                style={{
                  marginTop: 20,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CircularProgress style={{ marginRight: 10 }} />
                <Typography>Loading logs</Typography>
              </div>
            ) : null}

            <List>
                <ListItem>
                  <ListItemText
                    primary={
                      "Timestamp"
                    }
                    style={{
                      minWidth: 200,
                      maxWidth: 200,
                    }}
                  />
                  <ListItemText
                    primary={"Referer"}
                    style={{
                      minWidth: 300,
                      maxWidth: 300,
                      overflow: "hidden",
                    }}
                  />
                  <ListItemText
                    primary={"URL"}
                    style={{
                      minWidth: 700,
                      maxWidth: 700,
                      overflow: "hidden",
                      marginLeft: 10,
                    }}
                  />
                </ListItem>
              {logs.map((data, index) => {
                  //console.log("LOG: ", data)

                  return (
                // redirect user to logs
                // using request id or trace id
                <ListItem
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#1f2023" : "#27292d",
                  }}
                >
                  <ListItemText
                    primary={new Date(
                      data.timestamp * 1000,
                    ).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })}
                    style={{
                      minWidth: 200,
                      maxWidth: 200,
                    }}
                  />
                  <ListItemText
                    primary={data.referer}
                    style={{
                      minWidth: 300,
                      maxWidth: 300,
                      overflow: "hidden",
                    }}
                  />
                  <ListItemText
                    primary={data.url}
                    style={{
                      minWidth: 700,
                      maxWidth: 700,
                      overflow: "hidden",
                      marginLeft: 10,
                    }}
                  />
                </ListItem>
              )})}
            </List>
          </DialogContent>
        </Dialog>
      ) : null

    return (
        <div style={{ width: "100%", minHeight: 1100, boxSizing: 'border-box', padding: "27px 10px 19px 27px", height:"100%", backgroundColor: '#212121',borderTopRightRadius: '8px', borderBottomRightRadius: 8, borderLeft: "1px solid #494949", }}>
            {modalView}
            {editUserModal}
            {logview}
            <div style={{ height: "100%", maxHeight: 1700, overflowY: "auto", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin'}}>
            <div style={{ height: "100%", width: "calc(100% - 20px)", scrollbarColor: '#494949 transparent', scrollbarWidth: 'thin' }}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div>
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ marginBottom: 8, marginTop: 0, color: "#FFFFFF" }}>User Management</h2>
                    <span style={{ color: "#9E9E9E" }}>
                        Add, edit, distribute or remove users from your organization.{" "}
						<a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="/admin?admin_tab=sso"
                            style={{ color: "#FF8444" }}
                        >
							Configure SSO
                        </a> 
						&nbsp;
						or
						&nbsp;
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="/docs/organizations#user_management"
                            style={{ color: "#FF8444" }}
                        >
                            learn more about users 
                        </a> 
                    </span>
                </div>
                <div />
                <Button
                    style={{ color: "#1a1a1a", backgroundColor: "#ff8544",fontSize: 16, textTransform: 'none', borderRadius: 4, width: 162, height: 40, boxShadow: 'none' }}
                    variant="contained"
                    color="primary"
                    onClick={() => setModalOpen(true)}
                >
                    Add user
                </Button>
                <Button
                    style={{ backgroundColor: "#2F2F2F", boxShadow: 'none', borderRadius: 4, width: 81, height: 40, marginLeft: 16, marginRight: 15 }}
                    variant="contained"
                    color="primary"
                    onClick={() => getUsers()}
                >
                    <CachedIcon />
                </Button>
            </div>
            <div>
            <Typography variant="body1">MFA Required</Typography>
                <Switch
                checked={MFARequired}
                onChange={(event) => {
                    UpdateMFAInUserOrg(selectedOrganization.id);
                }}
                />
            </div>
            </div>
            <div
                style={{
                borderRadius: 4,
                marginTop: 24,
                border: "1px solid #494949",
                width: "100%",
                overflowX: "auto", 
                paddingBottom: 0,
                }}
            >
            <List 
                style={{
                    width: '100%', 
                    tableLayout: "auto", 
                    display: "table", 
                    minWidth: 800,
                    overflowX: "auto", 
                    paddingBottom: 0,
                }}
            >
                <ListItem style={{ width: "100%", padding: "10px 10px 10px 0px", verticalAlign: 'middle', borderBottom: "1px solid #494949", display: "table-row" }}>
                    {["Username", /*"API Key",*/ "Role", /*"Active",*/ "Type", "MFA", ...(selectedOrganization?.child_orgs?.length > 0 ? ["Suborgs"]: []), "Actions", "Last Login"].map((header, index) => (
                        <ListItemText
                            key={index}
                            primary={header}
                            style={{
                                display: "table-cell",
                                padding: index === 0 ? "0px 8px 8px 15px": "0px 8px 8px 8px",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                borderBottom: "1px solid #494949",
                                position: "sticky",
                                verticalAlign: "middle",
                             }}
                        />
                    ))}
                </ListItem>
                {showLoader ? (
                    [...Array(6)].map((_, rowIndex) => (
                        <ListItem
                            key={rowIndex}
                            style={{
                                display: "table-row",
                                backgroundColor: "#212121",
                            }}
                        >
                            {Array(9)
                                .fill()
                                .map((_, colIndex) => (
                                    <ListItemText
                                        key={colIndex}
                                        style={{
                                            display: "table-cell",
                                            padding: "8px",
                                        }}
                                    >
                                        <Skeleton
                                            variant="text"
                                            animation="wave"
                                            sx={{
                                                backgroundColor: "#1a1a1a",
                                                height: "20px",
                                                borderRadius: "4px",
                                            }}
                                        />
                                    </ListItemText>
                                ))}
                        </ListItem>
                    ))
                ): users === 0 ? null 
                    : users?.map((data, index) => {
                        var bgColor = "#212121";
                        if (index % 2 === 0) {
                            bgColor = "#1A1A1A";
                        }

                        const timeNow = new Date().getTime();

                        // Get the highest timestamp in data.login_info
                        var lastLogin = "N/A";
                        if (data.login_info !== undefined && data.login_info !== null) {
                            var loginInfo = 0;
                            for (var i = 0; i < data?.login_info?.length; i++) {
                                if (data.login_info[i].timestamp > loginInfo) {
                                    loginInfo = data.login_info[i].timestamp;
                                }
                            }

                            if (loginInfo > 0) {
                                lastLogin =
                                    new Date(loginInfo * 1000).toISOString().slice(0, 10) +
                                    " (" +
                                    data?.login_info?.length +
                                    ")";
                            }
                        }

                        var userData = data.username;
                        if (userdata.support === true) {
                            userData = (
                            <a
                                style={{
                                cursor: "pointer",
                                textDecoration: "underline",
                                textDecorationColor: "#F76742",
                                color: "#F76742",
                                }}
                                onClick={() => {
                                setLogsViewModal(true);
                                setUserLogViewing(data);
        
                                if (userLogViewing.login_info !== undefined && userLogViewing.login_info !== null && userLogViewing.login_info.length > 0) {
                                    getLogs(userLogViewing.login_info[0].ip, userLogViewing.id)
                                    setIpSelected(userLogViewing.login_info[0].ip);
                                }
                                }}
                            >
                                {data.username}
                            </a>
                            );
                        }

                        return (
                            <ListItem key={index} style={{ backgroundColor: bgColor, display: 'table-row', borderBottomLeftRadius: users?.length - 1 === index ? 8 : 0, borderBottomRightRadius: users?.length - 1 === index ? 8 : 0 }}>
                                <ListItemText
                                primary={(
                                    <Tooltip title={data.username || 'No username available'}>
                                    <span>{userData || 'No username'}</span>
                                    </Tooltip>
                                )}
                                primaryTypographyProps={{
                                    style: {
                                    maxWidth: 150,
                                    minWidth: 100,
                                    width: 'auto',
                                    color: "#FF8444",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    padding: "8px 8px 8px 15px",
                                    },
                                }}
                                style={{display:'table-cell', verticalAlign: 'middle' }}
                                />

								{/*
                                <ListItemText
                                    style={{
                                        textAlign: "center", 
                                        display: "flex", 
                                        justifyContent: "center", 
                                        alignItems: "center", 
                                        padding: "8px",
                                    }}
                                    primary={
                                        data.apikey === undefined || data?.apikey?.length === 0 ? (
                                            ""
                                        ) : (
                                            <Tooltip
                                                title={"Copy Api Key"}
                                                aria-label={"Copy APIkey"}
                                            >
                                                <IconButton
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(data.apikey);
                                                        toast.success("Apikey copied to clipboard");
                                                    }}
                                                >
                                                    <ContentCopyOutlinedIcon
                                                        style={{ color: "#D9D9D9" }}
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                        )
                                    }
                                />
								*/}

                                <ListItemText
                                    primary={
                                        <Select
                                            SelectDisplayProps={{
                                                style: {
                                                    //   marginLeft: 10,
                                                },
                                            }}
                                            value={data.role}
                                            onChange={(e) => {
                                                console.log("VALUE: ", e.target.value);
                                                setUser(data.id, "role", e.target.value);
                                            }}
                                            sx={{
                                                backgroundColor: "#1A1A1A",
                                                color: "white",
                                                height: "50px",
                                                borderRadius: "4px",
                                                marginTop: "8px",
                                                marginBottom: "8px",
                                                padding: "8px",
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        "& .MuiList-root": {
                                                            padding: 0,
                                                        },
                                                    },
                                                },
                                            }}
                                        >
                                            <MenuItem
                                                sx={{
                                                    backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                                    color: "white",
                                                    
                                                }}
                                                value={"admin"}
                                            >
                                                Org Admin
                                            </MenuItem>
                                            <MenuItem
                                                style={{
                                                    backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                                    color: "white",
                                                }}
                                                value={"user"}
                                            >
                                                Org User
                                            </MenuItem>
                                            <MenuItem
                                                style={{
                                                    backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                                    color: "white",
                                                }}
                                                value={"org-reader"}
                                            >
                                                Org Reader
                                            </MenuItem>
                                        </Select>
                                    }
                                    style={{ display:'table-cell', verticalAlign: 'middle' }}
                                />

								{/*
                                <ListItemText
                                    primary={data.active ? "True" : "False"}
                                    style={{display:'table-cell',verticalAlign: 'middle' , padding: "8px", textAlign: "center", color: data.active ? "#02CB70" : "#F53434" }}
                                />
								*/}

                                <ListItemText
                                    primary={
                                        data.login_type === undefined ||
                                            data?.login_type === null ||
                                            data?.login_type?.length === 0
                                            ? "Normal"
                                            : data.login_type
                                    }
                                    style={{  display:'table-cell',verticalAlign: 'middle', padding: "8px",  }}
                                />

                                <ListItemText
                                    primary={
                                        data?.mfa_info !== undefined &&
                                            data?.mfa_info !== null &&
                                            data?.mfa_info.active === true
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    style={{ display:'table-cell', verticalAlign: 'middle',padding: "8px", color: data.mfa_info.active ? "#02CB70" : "#F53434" }}
                                />

                                {selectedOrganization?.child_orgs !== undefined &&
                                    selectedOrganization?.child_orgs !== null &&
                                    selectedOrganization?.child_orgs?.length > 0 ? (
                                    <ListItemText
                                        style={{ display: "table-cell", verticalAlign: 'middle', padding: "8px",  }}
                                        primary={
                                        data?.orgs === undefined || data?.orgs === null
                                            ? 0
                                            : data?.orgs?.length - 1
                                        }
                                        primaryTypographyProps={{
                                            style: {
                                                marginLeft: 20
                                            }
                                        }}
                                    />
                                    ) : null}
                                <ListItemText style={{ display:'table-cell',  textAlign: "left", verticalAlign: 'middle', padding: "8px",  }}>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedUserModalOpen(true);
                                            setSelectedUser(data);

                                            // Find matching orgs between current org and current user's access to those orgs
                                            if (
                                                userdata?.orgs !== undefined &&
                                                userdata?.orgs !== null &&
                                                userdata?.orgs?.length > 0 &&
                                                selectedOrganization?.child_orgs !== undefined &&
                                                selectedOrganization?.child_orgs !== null &&
                                                selectedOrganization?.child_orgs?.length > 0
                                            ) {
                                                var active = [];
                                                for (var key in userdata.orgs) {
                                                    const found =
                                                        selectedOrganization.child_orgs.find(
                                                            (item) => item.id === userdata.orgs[key].id
                                                        );
                                                    if (found !== null && found !== undefined) {
                                                        if (
                                                            data.orgs === undefined ||
                                                            data.orgs === null
                                                        ) {
                                                            continue;
                                                        }

                                                        const subfound = data.orgs.find(
                                                            (item) => item === found.id
                                                        );
                                                        if (
                                                            subfound !== null &&
                                                            subfound !== undefined
                                                        ) {
                                                            active.push(subfound);
                                                        }
                                                    }
                                                }

                                                setMatchingOrganizations(active);
                                            }
                                        }}
                                    >
                                        <img src="/icons/editIcon.svg" alt="edit icon" style={{width: 24, height: 24}} />
                                    </IconButton>
                                    {/* <Button
                                        onClick={() => {
                                            generateApikey(data)
                                        }}
                                        disabled={data.role === "admin" && data.username !== userdata.username}
                                        variant="outlined"
                                        color="primary"
                                    >
                                        New apikey
                                    </Button> */}
                                </ListItemText>
                                <ListItemText
                                    style={{ display:'table-cell', verticalAlign: 'middle', padding: "8px", }}
                                    primary={lastLogin}
                                ><span />
                                </ListItemText>
                            </ListItem>
                        );
                    })}
            </List>
            </div>
            </div>
            </div>
        </div>
    );
})

export default UserManagmentTab;
