import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import theme from "../theme.jsx";

const NotFound = () => {
    const navigate = useNavigate();

    const buttonStyle = {
        borderRadius: 25,
        height: 50,
        fontSize: 18,
        width: "100%",
        marginBottom: "10px",
    };

    const primaryButtonStyle = {
        ...buttonStyle,
        background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)",
        color: "white",
        '&:hover': {
            background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)",
            opacity: 0.9,
        }
    };

    const secondaryButtonStyle = {
        ...buttonStyle,
        background: "#383B40",
        border: "1px solid #494949",
        color: "white",
        '&:hover': {
            background: "#434649",
        }
    };

    return (
        <div style={{paddingTop: 100, }} className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
            <div
                style={{
                    width: "100%",
                    maxWidth: "532px",
                    background: "#212121",
                    borderRadius: "8px",
                    padding: "40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    justifySelf: "center",
                }}
            >
                <img
                    src="/images/logos/orange_logo.svg"
                    alt="Shuffle Logo"
                    style={{
                        height: 44,
                        width: 44,
                        marginBottom: 10,
                    }}
                />

                <Typography
                    variant="h1"
                    style={{
                        fontSize: "72px",
                        fontWeight: 900,
                        background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginBottom: "10px",
                        textAlign: "center",
                    }}
                >
                    404
                </Typography>

                <Typography
                    variant="h4"
                    style={{
                        color: "white",
                        marginBottom: "8px",
                        fontWeight: 600,
                        textAlign: "center",
                    }}
                >
                    Page Not Found
                </Typography>

                <Typography
                    variant="body1"
                    style={{
                        color: "#9E9E9E",
                        marginBottom: "32px",
                        fontSize: "16px",
                        textAlign: "center",
                        maxWidth: "400px",
                    }}
                >
                    Our code doggo couldn't find the page you were looking for.
                </Typography>

                <iframe
                    src="https://giphy.com/embed/FY8c5SKwiNf1EtZKGs"
                    width="125"
                    height="165"
                    frameBorder="0"
                    className="giphy-embed"
                    allowFullScreen
                    style={{ 
						marginBottom: 32,
						borderRadius: theme.palette.borderRadius,
					}}
                />

                <div style={{ width: "100%", maxWidth: "400px" }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/docs')}
                        sx={primaryButtonStyle}
                    >
                        Documentation
                    </Button>

                    <Button
                        variant="contained"
                        onClick={() => navigate('/')}
                        sx={secondaryButtonStyle}
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
