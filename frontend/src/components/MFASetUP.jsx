import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, CircularProgress, TextField, Button } from "@mui/material";
import { toast } from "react-toastify";

const MFASetup = ({ isLoaded, globalUrl, setCookie }) => {
    const [image2FA, setImage2FA] = useState("");
    const [secret2FA, setSecret2FA] = useState("");
    const [mfaCode, setMfaCode] = useState("");
    const [code, setCode] = useState(null);

    useEffect(() => {
        handleGet2FACode();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            const code = window.location.pathname.split("/")[2];
            setMfaCode(code);
        }
    }, [isLoaded]);

    const handleGet2FACode = () => {
        if (mfaCode === "") {
            return;
        }

        fetch(`${globalUrl}/api/v1/users/${mfaCode}/get2fa`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            credentials: "include",
        })
            .then((response) => {
                if (response.status === 404) {
                    toast("User not found. Redirecting to login page in 3 seconds...");
                    setTimeout(() => {
                        window.location.pathname = "/login";
                        return;
                    }, 3000);
                }
                if (response.status !== 200) {
                    console.log("Status not 200 for apps :O!");
                }
                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.success === true) {
                    setImage2FA(responseJson.reason);
                    setSecret2FA(responseJson.extra);
                }
            })
            .catch((error) => {
                toast(error.toString());
            });
    };

    useEffect(() => {
        if (mfaCode) {
            handleGet2FACode();
        }
    }, [mfaCode]);

    const handleVerify2FA = (mfaCode, code, changeMFAActive) => {
        const data = {
            code: code,
            changeMFAActive: changeMFAActive,
        };

        toast("Verifying 2fa code. Please wait...");

        fetch(`${globalUrl}/api/v1/users/${mfaCode}/set2fa`, {
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
                if (response.status === 500) {
                    toast("Wrong code sent. Please try again.");
                    return;
                }
                return response.json();
            })
            .then((responseJson) => {
                if (responseJson.success === true) {
                    toast.success("Successfully setup 2fa. Redirecting in 3 seconds...");
                    for (var key in responseJson["cookies"]) {
                        setCookie(responseJson["cookies"][key].key, responseJson["cookies"][key].value, { path: "/" });
                    }

                    const tmpView = new URLSearchParams(window.location.search).get("view");
                    if (tmpView !== undefined && tmpView !== null) {
                        var newUrl = `/${tmpView}`;
                        if (tmpView.startsWith("/")) {
                            newUrl = `${tmpView}`;
                        }
                        window.location.pathname = newUrl;
                        return;
                    }

                    if (responseJson.tutorials !== undefined && responseJson.tutorials !== null) {
                        const welcome = responseJson.tutorials.find((element) => element.name === "welcome");
                        if (welcome === undefined || welcome === null) {
                            setTimeout(() => {
                                window.location.pathname = "/welcome";
                            }, 3000);
                        }
                    }

                    setTimeout(() => {
                        window.location.pathname = "/workflows";
                    }, 3000);
                } else {
                    toast("Failed to setup 2fa. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    return (
        <div style={{ paddingTop: 50, margin: "0px auto", width: "500px" }}>
            <Paper elevation={3} style={{ padding: "30px", backgroundColor: "#212121" }}>
                <Typography variant="h5" style={{ color: "white", marginBottom: 10, textAlign: "center" }}>
                    Multi-Factor Authentication Setup
                </Typography>
                <div style={{ marginTop: 15 }}>
                    <QRCodeSection secret2FA={secret2FA} image2FA={image2FA} />
                </div>
                <Typography variant="body1" style={{ color: "white", marginTop: 15 }}>
                    Enter the code from your authenticator app below.
                </Typography>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="code"
                    label="Code"
                    name="code"
                    autoComplete="code"
                    autoFocus
                    onChange={(e) => setCode(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === "Enter" && code !== null && code !== "" && code.length === 6) {
                            handleVerify2FA(mfaCode, code, true);
                        }
                    }}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => handleVerify2FA(mfaCode, code, true)}
                    style={{
                        backgroundColor: code === null || code === "" || code.length !== 6 ? "gray" : "#f86743",
                        marginTop: 10,
                        color: "#fff",
                        cursor: code === null || code === "" || code.length !== 6 ? "" : "pointer",
                    }}
                    disabled={code === null || code === "" || code.length !== 6}
                >
                    Submit
                </Button>

            </Paper>
        </div>
    );
};

const QRCodeSection = ({ secret2FA, image2FA }) => {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
            {secret2FA && image2FA ? (
                <div style={{ textAlign: "center" }}>
                    <Typography variant="body2" style={{ color: "white", textAlign: "justify", marginBottom: 10, fontSize: 16 }}>
                        Scan the image below with the two-factor authentication app on your phone. If you can’t use a QR code, use the code {secret2FA} instead.
                    </Typography>
                    <img alt="2FA QR code" src={image2FA} style={{ maxHeight: 200, maxWidth: 200, }} />
                </div>
            ) : (
                <CircularProgress style={{ margin: "15px auto" }} />
            )}
        </div>
    );
};

export default MFASetup;
