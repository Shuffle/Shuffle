import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Paper,
    Button,
    FormControl,
    TextField,
    DialogActions,
    IconButton,
    CircularProgress
} from '@mui/material'

// Icons
import CloseIcon from '@mui/icons-material/Close'
import PublishIcon from '@mui/icons-material/Publish'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import CreateIcon from '@mui/icons-material/Create'
import { toast } from 'react-toastify'
import YAML from "yaml";

const AppCreationModal = ({ open, onClose, theme, globalUrl, isCloud }) => {
    const [openApiModal, setOpenApiModal] = useState(false)
    const [generateAppModal, setGenerateAppModal] = useState(false)
    const [openApi, setOpenApi] = useState("")
    const [openApiData, setOpenApiData] = useState("")
    const [openApiError, setOpenApiError] = useState("")
    const [validation, setValidation] = useState(false)
    const [appValidation, setAppValidation] = useState("")
    const [isDropzone, setIsDropzone] = useState(false)

    const navigate = useNavigate()
    const upload = useRef()

    // Style for the create options
    const AppCreateButton = ({ text, func, icon }) => {
        const [hover, setHover] = React.useState(false)
        const makeFancy = text?.includes("Generate")

        const parsedStyle = {
            flex: 1,
            padding: 20,
            margin: 12,
            paddingTop: 30,
            backgroundColor: hover && !makeFancy ? theme.palette.surfaceColor : "transparent",
            cursor: hover ? "pointer" : "default",
            textAlign: "center",
            minHeight: 180,
            maxHeight: 180,
            borderRadius: 8,
            border: makeFancy
                ? "1px solid transparent"
                : hover
                    ? ""
                    : "1px solid rgba(255,255,255,0.3)",
            borderImage: makeFancy ? "linear-gradient(to right, #ff8544 0%, #ec517c 50%, #9c5af2 100%) 1" : "none",
            transition: 'all 0.2s ease-in-out',
			paddingBottom: isCloud ? 0 : 175, 
        }

        return (
            <Paper
                elevation={hover ? 4 : 1}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={func}
                style={parsedStyle}
            >
                {icon}
                <Typography sx={{ mt: 2 }}>{text}</Typography>
            </Paper>
        )
    }


    const uploadFile = (e) => {
        const isDropzone =
            e.dataTransfer === undefined ? false : e.dataTransfer.files.length > 0;
        const files = isDropzone ? e.dataTransfer.files : e.target.files;

        const reader = new FileReader();

        try {
            reader.addEventListener("load", (e) => {
                const content = e.target.result;
                setOpenApiData(content);
                setIsDropzone(isDropzone);
                setOpenApiModal(true);
            });
        } catch (e) {
            console.log("Error in dropzone: ", e);
        }

        try {
            reader.readAsText(files[0]);
        } catch (error) {
            toast("Failed to read file");
        }
    };

    useEffect(() => {
        if (openApiData.length > 0) {
            setOpenApiError("");
            validateOpenApi(openApiData);
        }
    }, [openApiData]);


    // useEffect(() => {
    //     console.log("APPVALID: ", appValidation)
    //     redirectOpenApi()
    // }, [appValidation])

    useEffect(() => {
        if (appValidation && isDropzone) {
            redirectOpenApi();
            setIsDropzone(false);
        }
    }, [appValidation, isDropzone]);

    const validateDocumentationUrl = () => {
        setValidation(true);

        // curl https://doc-to-openapi-stbuwivzoq-nw.a.run.app/doc_to_openapi -d '{"url": "https://gitlab.com/rhab/PyOTRS/-/raw/main/pyotrs/lib.py?ref_type=heads"}' -H "Content-Type: application/json"
        const urldata = {
            "url": openApi,
        }

        //fetch("http://localhost:8080/doc_to_openapi", {
        //fetch("https://doc-to-openapi-stbuwivzoq-nw.a.run.app/doc_to_openapi", {
        fetch("https://doc-to-openapi-stbuwivzoq-nw.a.run.app/api/v1/doc_to_openapi", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(urldata),
        })
            .then((response) => {
                setValidation(false);
                if (response.status !== 200) {
                    toast("Error in generation: " + response.status);
                    setOpenApiError("Error in generation - bad status: " + response.status);
                    return response.text();
                }

                return response.json();
            })
            .then((responseJson) => {
                // Check if openapi or swagger in string of the json
                var parsedtext = responseJson
                try {
                    parsedtext = JSON.stringify(responseJson);
                    if (parsedtext.indexOf("openapi") === -1 && parsedtext.indexOf("swagger") === -1) {
                        setValidation(false)
                        setOpenApiError("Error in generation: " + parsedtext)

                        return
                    }
                } catch (e) {
                    setValidation(false);
                    setOpenApiError("Error in generation (2): " + e.toString());
                    return;
                }

                console.log("Validating response!");
                validateOpenApi(parsedtext)
            })
            .catch((error) => {
                setValidation(false);
                toast(error.toString());
                setOpenApiError(error.toString());
            });
    }

    const validateRemote = () => {
        setValidation(true);

        fetch(globalUrl + "/api/v1/get_openapi_uri", {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: JSON.stringify(openApi),
            credentials: "include",
        })
            .then((response) => {
                setValidation(false);
                if (response.status !== 200) {
                    return response.json();
                }

                return response.text();
            })
            .then((responseJson) => {
                if (typeof responseJson !== "string" && !responseJson.success) {
                    console.log(responseJson.reason);
                    if (responseJson.reason !== undefined) {
                        setOpenApiError(responseJson.reason);
                    } else {
                        setOpenApiError("Undefined issue with OpenAPI validation");
                    }
                    return;
                }

                console.log("Validating response!");
                validateOpenApi(responseJson);
            })
            .catch((error) => {
                toast(error.toString());
                setOpenApiError(error.toString());
            });
    };

    const escapeApiData = (apidata) => {
        //console.log(apidata)
        try {
            return JSON.stringify(JSON.parse(apidata));
        } catch (error) {
            console.log("JSON DECODE ERROR - TRY YAML");
        }

        try {
            const parsed = YAML.parse(YAML.stringify(apidata));
            //const parsed = YAML.parse(apidata))
            console.log(YAML.stringify(parsed))
            return YAML.stringify(parsed);
        } catch (error) {
            console.log("YAML DECODE ERROR - TRY SOMETHING ELSE?: " + error);
            setOpenApiError("Local error: " + error.toString());
        }

        return "";
    };


    const validateOpenApi = (openApidata) => {
        var newApidata = escapeApiData(openApidata);
        if (newApidata === "") {
            // Used to return here
            newApidata = openApidata;
            return;
        }

        //console.log(newApidata)

        setValidation(true);
        fetch(globalUrl + "/api/v1/validate_openapi", {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: openApidata,
            credentials: "include",
        })
		.then((response) => {

			setValidation(false);
			return response.json();
		})
		.then((responseJson) => {
			if (responseJson?.success === true) {
				setAppValidation(responseJson?.id)
				navigate(`/apps/new?id=${responseJson?.id}`)
			} else {
				if (responseJson.reason !== undefined) {
					setOpenApiError(responseJson.reason)
				}
				toast("An error occurred in the response");
			}
		})
		.catch((error) => {
			setValidation(false);
			toast(error.toString());
			setOpenApiError(error.toString());
		});
    };

    const redirectOpenApi = () => {
        if (appValidation === undefined || appValidation === null || appValidation.length === 0) {
            return
        }

        toast.success("Successfully validated OpenAPI. Redirecting to app creation. Remember to save the app to be able to use it.", {
            // Disable autoclose
            autoClose: 10000,
        })
        navigate(`/apps/new?id=${appValidation}`)
    }




    // const validateOpenApi = (openApidata) => {

    //     var newApidata = escapeApiData(openApidata);
    //     if (newApidata === "") {
    //         // Used to return here
    //         newApidata = openApidata;
    //         return;
    //     }
    //     setValidation(true)
    //     const url = `${globalUrl}/api/v1/verify_openapi`

    //     fetch(url, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             Accept: "application/json",
    //         },
    //         body: JSON.stringify(openApidata),
    //         credentials: "include",
    //     })
    //         .then((response) => response.json())
    //         .then((responseJson) => {
    //             if (responseJson.success === false) {
    //                 setOpenApiError(responseJson.reason)
    //                 setValidation(false)
    //                 setAppValidation("")
    //             } else {
    //                 setAppValidation(responseJson.id)
    //                 setValidation(false)
    //             }
    //         })
    //         .catch((error) => {
    //             setOpenApiError("Failed loading: " + error.toString())
    //             setValidation(false)
    //             setAppValidation("")
    //         })
    // }





    // Validation and redirect functions



    const circularLoader = validation ? <CircularProgress color="primary" /> : null
    const errorText = openApiError?.length > 0 ? <div style={{ marginTop: 15, color: '#fd4c62' }}>Error: {openApiError}</div> : null

    // Common dialog styles
    const dialogStyle = {
        borderRadius: 2,
        border: "1px solid #494949",
        minWidth: '500px',
        fontFamily: theme?.typography?.fontFamily,
        backgroundColor: "#1A1A1A",
        zIndex: 1000,
        '& .MuiDialogContent-root': {
            backgroundColor: "#1A1A1A",
            padding: '24px',
            fontFamily: theme?.typography?.fontFamily,
        },
        '& .MuiDialogTitle-root': {
            backgroundColor: "#1A1A1A",
            padding: '24px',
            fontFamily: theme?.typography?.fontFamily,
        },
        '& .MuiDialogActions-root': {
            backgroundColor: "#1A1A1A",
            padding: '16px 24px',
            fontFamily: theme?.typography?.fontFamily,
        },
        '& .MuiTypography-root': {
            fontFamily: theme?.typography?.fontFamily,
        },
        '& .MuiButton-root': {
            fontFamily: theme?.typography?.fontFamily,
        },
        transition: 'all 0.2s ease-in-out',
    };

    return (
        <>
            {/* Main App Creation Modal */}
            <Dialog
                TransitionProps={{
                    timeout: 200,
                }}
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: dialogStyle
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 3,
                    pt: 3,
                    pl: 4,
                    pr: 3,
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 500, color: "#F1F1F1" }}>
                        Create New App
                    </Typography>
                    <IconButton
                        onClick={() => {
                            setOpenApi("")
                            setOpenApiError("")
                            setAppValidation("")
                            setValidation(false)
                            onClose()
                        }}
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <div style={{ display: "flex", gap: 16, }}>
                        <AppCreateButton
                            text="Upload OpenAPI or Swagger"
                            func={() => {
                                setOpenApiModal(true)
                                onClose()
                            }}
                            icon={<PublishIcon style={{ minHeight: 50, maxHeight: 50 }} />}
                        />
                        <AppCreateButton
                            text="Generate from Documentation"
                            func={() => {
                                setGenerateAppModal(true)
                                onClose()
                            }}
                            icon={<AutoFixHighIcon style={{ minHeight: 50, maxHeight: 50 }} />}
                        />
                    </div>
                    <Button
                        variant="outlined"
                        component="label"
                        color="secondary"
                        fullWidth
                        onClick={() => {
                            navigate('/apps/new')
                            onClose()
                        }}
                        sx={{ mt: 3, mb: 1 }}
                    >
                        Create from scratch
                    </Button>
                </DialogContent>
            </Dialog>

            {/* OpenAPI Modal */}
            <Dialog
                TransitionProps={{ timeout: 200 }}
                open={openApiModal}
                onClose={() => {
                    setOpenApiModal(false)
                    setGenerateAppModal(false)
                }}
                PaperProps={{
                    sx: {
                        ...dialogStyle,
                        bgcolor: '#1A1A1A',
                        maxWidth: '800px',
                        width: '100%'
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 3,
                    pt: 3,
                    px: 4,
                }}>
                    <Typography variant="h6" sx={{
                        color: '#F1F1F1',
                        fontWeight: 500,
                        fontFamily: theme?.typography?.fontFamily
                    }}>
                        Create New App from Open API or Swagger
                    </Typography>
                    <IconButton
                        onClick={() => {
                            setOpenApiModal(false)
                            setGenerateAppModal(false)
                            setOpenApi("")
                            setOpenApiError("")
                            setAppValidation("")
                            setValidation(false)
                        }}
                        sx={{
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 4, py: 3 }}>
                    <div style={{ display: "flex", fontSize: '14px', gap: '5px', alignItems: 'center', marginBottom: '10px', fontFamily: theme?.typography?.fontFamily, marginTop: '15px' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
                            Paste in the URI for the OpenAPI or find out
                        </Typography>
                        <Link style={{
                            color: '#ff8544',
                            textDecoration: 'none',
                            textDecoration: 'underline',
                            fontSize: '16px',
                            fontFamily: theme?.typography?.fontFamily
                        }}>
                            How to find URI for openAPI?
                        </Link>
                    </div>


                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Open API URI"
                            style={{ fontFamily: theme?.typography?.fontFamily, fontSize: '16px' }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    height: '40px',
                                },
                                '& .MuiOutlinedInput-input::placeholder': {
                                    fontSize: '16px'
                                }
                            }}
                            onChange={(e) => setOpenApi(e.target.value)}
                        />
                        <Button
                            sx={{
                                color: '#2bc07e',
                                border: "1px solid #2bc07e",
                                borderRadius: '4px',
                                width: '200px',
                                py: 1,
                                px: 3,
                                textTransform: 'none',
                                height: '40px',
                                fontSize: '16px',
                                fontFamily: theme?.typography?.fontFamily,
                                cursor: 'pointer'
                            }}
                            disabled={openApi.length === 0 || appValidation.length > 0}
                            onClick={() => {
                                setOpenApiError("");
                                validateRemote();
                            }}
                        >
                            Validate
                        </Button>
                    </div>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255,255,255,0.5)',
                            mb: 3,
                            mt: 1,
                            fontSize: '14px',
                            fontFamily: theme?.typography?.fontFamily
                        }}>
                        Must point to a version 2 or 3 OpenAPI specification.
                    </Typography>

                    <Typography sx={{ mb: 2, color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontFamily: theme?.typography?.fontFamily }}>
                        Or upload a YAML or JSON specification
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() => upload.current.click()}
                        sx={{
                            color: '#FF8544',
                            borderColor: '#FF8544',
                            px: 5,
                            py: 1,
                            '&:hover': {
                                borderColor: '#FF8544',
                                bgcolor: 'rgba(255,133,68,0.1)'
                            },
                            textTransform: 'none',
                            fontSize: '14px',
                            fontFamily: theme?.typography?.fontFamily,
                            height: '40px'
                        }}
                    >
                        Upload
                    </Button>

                    <input
                        hidden
                        type="file"
                        ref={upload}
                        accept="application/JSON,application/YAML,application/yaml,text/yaml,text/x-yaml,application/x-yaml,application/vnd.yaml,.yml,.yaml"
                        multiple={false}
                        onChange={uploadFile}
                    />
                    {errorText}
                </DialogContent>
                <DialogActions sx={{
                    py: 2,
                    px: 3,
                    gap: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {circularLoader}
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: '#FF8544',
                            color: '#000',
                            '&:hover': {
                                bgcolor: '#ff7a33'
                            },
                            textTransform: 'none',
                            py: 1.5,
                            mb: 1.5,
                            fontSize: '16px',
                            fontWeight: 500,
                            width: '100%',
                            maxWidth: '300px',
                            fontFamily: theme?.typography?.fontFamily,
                            cursor: 'pointer',
                            height: '40px'
                        }}
                        disabled={appValidation.length === 0}
                        onClick={redirectOpenApi}
                    >
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Generate App Modal */}
            <Dialog
                TransitionProps={{ timeout: 200 }}
                open={generateAppModal}
                onClose={() => {
                    setGenerateAppModal(false)
                    setOpenApiModal(false)
                }}
                PaperProps={{
                    sx: {
                        ...dialogStyle,
                        bgcolor: '#1A1A1A',
                        maxWidth: '610px',
                        width: '100%',
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 7,
                    px: 4,
                }}>
                    <Typography variant="h6" sx={{
                        color: '#F1F1F1',
                        fontWeight: 500,
                        fontFamily: theme?.typography?.fontFamily,
                    }}>
                        Generate an app based on documentation (beta)
                    </Typography>
                    <IconButton
                        onClick={() => {
                            setGenerateAppModal(false)
                            setOpenApiModal(false)
                            setOpenApi("")
                            setOpenApiError("")
                            setAppValidation("")
                            setValidation(false)
                        }}
                        sx={{
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 4, py: 3, pt: 0 }}>
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.85)',
                        mb: 2,
                        fontSize: '14px',
                        mt: 2,
                        fontFamily: theme?.typography?.fontFamily
                    }}>
                        Paste in a URL, and we will make it into an app for you.
                        <b>{isCloud ? "" : " Uses Shuffle Cloud (https://shuffler.io) for processing (for now)."}</b>
                    </Typography>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="API Documentation URL"
                            sx={{
                                bgcolor: theme.palette.platformColor,
                                '& .MuiOutlinedInput-root': {
                                    height: '40px',
                                    color: 'white',
                                    '& fieldset': {
                                        borderWidth: '1px',
                                        borderImage: "linear-gradient(to right, #ff8544 0%, #ec517c 50%, #9c5af2 100%) 1",
                                    },
                                    '&:hover fieldset': {
                                        borderWidth: '1px',
                                        borderImage: "linear-gradient(to right, #ff8544 0%, #ec517c 50%, #9c5af2 100%) 1",
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderWidth: '2px',
                                        borderImage: "linear-gradient(to right, #ff8544 0%, #ec517c 50%, #9c5af2 100%) 1",
                                    }
                                },
                                '& .MuiOutlinedInput-input::placeholder': {
                                    fontSize: '14px'
                                }
                            }}
                            style={{ fontFamily: theme?.typography?.fontFamily, borderRadius: "4px" }}
                            onChange={(e) => {
                                setOpenApi(e.target.value);
                            }} />
                    </div>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255,255,255,0.5)',
                            mt: 1,
                            fontSize: '14px',
                            fontFamily: theme?.typography?.fontFamily
                        }}>
                        Should be a documentation page containing an API.
                    </Typography>
                    {errorText}
                </DialogContent>
                <DialogActions sx={{
                    py: 2,
                    pt: 1,
                    px: 3,
                    gap: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {circularLoader}
                    {
                        !validation &&
                        <Typography sx={{ color: '#c5c5c5', fontSize: '14px', fontFamily: theme?.typography?.fontFamily, }}>
                            This may take multiple minutes based on the size of the documentation.
                        </Typography>
                    }
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: '#FF8544',
                            color: '#000',
                            '&:hover': {
                                bgcolor: '#ff7a33'
                            },
                            textTransform: 'none',
                            py: 1.5,
                            mb: 1,
                            fontSize: '14px',
                            fontWeight: 500,
                            width: '100%',
                            borderRadius: '4px',
                            maxWidth: '300px',
                            fontFamily: theme?.typography?.fontFamily,
                            cursor: 'pointer',
                            height: '40px'
                        }}
                        disabled={openApi.length === 0 || appValidation.length > 0 || validation}
                        onClick={() => {
                            setOpenApiError("");
                            validateDocumentationUrl();
                        }}
                    >
                        Generate
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default AppCreationModal
