import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, useTheme } from '@mui/material';
import { Context } from '../context/ContextApi.jsx';
import { getTheme } from '../theme.jsx';

const NotFound = (props) => {
    const { userdata: propsUserdata } = props || {};
    const navigate = useNavigate();
    const muiTheme = useTheme();
    const context = useContext(Context) || {};

    const [cachedUserdata] = useState(() => {
        try {
            const stored = localStorage.getItem('userinfo');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const userdata = (propsUserdata && Object.keys(propsUserdata).length > 0)
        ? propsUserdata
        : cachedUserdata;

    const branding = userdata?.active_org?.branding || {};

    const brandName =
        context?.brandName ||
        branding?.brand_name ||
        localStorage.getItem('brandName') ||
        'Shuffle';

    const brandColor =
        context?.brandColor ||
        branding?.brand_color ||
        localStorage.getItem('brandColor') ||
        muiTheme?.palette?.primary?.main ||
        '#FF8544';

    const supportEmail =
        context?.supportEmail ||
        branding?.support_email ||
        '';

    const themeMode = context?.themeMode || props?.theme || (muiTheme?.palette?.mode === 'light' ? 'light' : 'dark');
    const theme = getTheme(themeMode, brandColor) || muiTheme;
    const isDark = theme?.palette?.mode === 'dark';

    useEffect(() => {
        const titlePrefix = brandName && brandName !== 'Shuffle' ? brandName : 'Shuffle';
        document.title = `404 - ${titlePrefix}`;
    }, [brandName]);

    const isDefaultOrange =
        !brandColor ||
        brandColor.toLowerCase() === '#ff8544' ||
        brandColor.toLowerCase() === '#ff8444';

    const brandGradient = isDefaultOrange
        ? 'linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)'
        : `linear-gradient(89.83deg, ${brandColor} 0.13%, ${brandColor} 99.84%)`;

    const rawLogo =
        userdata?.active_org?.image ||
        userdata?.active_org?.large_image ||
        branding?.image;

    const isCustomLogo = Boolean(rawLogo && typeof rawLogo === 'string' && rawLogo.length > 0);
    const logoSrc = isCustomLogo
        ? (rawLogo.startsWith('data:') || rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('/')
            ? rawLogo
            : `data:image/png;base64,${rawLogo}`)
        : '/images/logos/orange_logo.svg';

    const handleDocumentationClick = () => {
        const docLink = branding?.documentation_link && branding.documentation_link.length > 0
            ? branding.documentation_link
            : '/docs';

        if (docLink.startsWith('http://') || docLink.startsWith('https://')) {
            window.open(docLink, '_blank', 'noopener,noreferrer');
        } else {
            navigate(docLink);
        }
    };

    const handleReturnHome = () => {
        const homeUrl = branding?.home_url && branding.home_url.length > 0
            ? branding.home_url
            : '/';

        if (homeUrl.startsWith('http://') || homeUrl.startsWith('https://')) {
            window.location.href = homeUrl;
        } else {
            navigate(homeUrl);
        }
    };

    const buttonStyle = {
        borderRadius: 25,
        height: 50,
        fontSize: 18,
        width: '100%',
        marginBottom: '10px',
        textTransform: 'none',
        fontWeight: 500,
    };

    const primaryButtonStyle = {
        ...buttonStyle,
        background: brandGradient,
        color: theme?.palette?.primary?.contrastText || '#ffffff',
        border: 'none',
        boxShadow: 'none',
        '&:hover': {
            background: brandGradient,
            opacity: 0.9,
            boxShadow: 'none',
        },
    };

    const secondaryButtonStyle = {
        ...buttonStyle,
        background: isDark ? '#383B40' : '#EEEEEE',
        border: isDark ? '1px solid #494949' : '1px solid #D5D5D5',
        color: theme?.palette?.text?.primary || (isDark ? '#ffffff' : '#1A1A1A'),
        boxShadow: 'none',
        '&:hover': {
            background: isDark ? '#434649' : '#E0E0E0',
            boxShadow: 'none',
        },
    };

    return (
        <div
            style={{
                paddingTop: 100,
                paddingBottom: 60,
                minHeight: '100vh',
                backgroundColor: theme?.palette?.backgroundColor || (isDark ? '#1a1a1a' : '#f1f1f1'),
                color: theme?.palette?.text?.primary || (isDark ? '#ffffff' : '#1a1a1a'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'background-color 0.2s ease, color 0.2s ease',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '532px',
                    backgroundColor: theme?.palette?.platformColor || (isDark ? '#212121' : '#ffffff'),
                    border: theme?.palette?.defaultBorder || `1px solid ${isDark ? '#494949' : '#CCCCCC'}`,
                    borderRadius: theme?.palette?.borderRadius || 8,
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifySelf: 'center',
                    boxShadow: isDark
                        ? '0 4px 24px rgba(0, 0, 0, 0.4)'
                        : '0 4px 24px rgba(0, 0, 0, 0.08)',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                }}
            >
                <img
                    src={logoSrc}
                    alt={`${brandName} Logo`}
                    style={{
                        maxHeight: 48,
                        maxWidth: 180,
                        height: isCustomLogo ? 'auto' : 44,
                        width: isCustomLogo ? 'auto' : 44,
                        marginBottom: 10,
                        objectFit: 'contain',
                        cursor: 'pointer',
                    }}
                    onClick={handleReturnHome}
                    onError={(e) => {
                        if (e.target.src !== '/images/logos/orange_logo.svg') {
                            e.target.src = '/images/logos/orange_logo.svg';
                        }
                    }}
                />

                <Typography
                    variant="h1"
                    style={{
                        fontSize: '72px',
                        fontWeight: 900,
                        background: brandGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '10px',
                        textAlign: 'center',
                    }}
                >
                    404
                </Typography>

                <Typography
                    variant="h4"
                    style={{
                        color: theme?.palette?.text?.primary || (isDark ? '#ffffff' : '#1A1A1A'),
                        marginBottom: '8px',
                        fontWeight: 600,
                        textAlign: 'center',
                    }}
                >
                    Page Not Found
                </Typography>

                <Typography
                    variant="body1"
                    style={{
                        color: theme?.palette?.text?.secondary || (isDark ? '#9E9E9E' : '#616161'),
                        marginBottom: '32px',
                        fontSize: '16px',
                        textAlign: 'center',
                        maxWidth: '400px',
                    }}
                >
                    Our code doggo couldn't find the page you were looking for.
                </Typography>

                <iframe
                    src="https://giphy.com/embed/FY8c5SKwiNf1EtZKGs"
                    title="404 Doggo"
                    width="125"
                    height="165"
                    frameBorder="0"
                    className="giphy-embed"
                    allowFullScreen
                    style={{
                        marginBottom: 32,
                        borderRadius: theme?.palette?.borderRadius || 8,
                    }}
                />

                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <Button
                        variant="contained"
                        onClick={handleDocumentationClick}
                        sx={primaryButtonStyle}
                    >
                        Documentation
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleReturnHome}
                        sx={secondaryButtonStyle}
                    >
                        Return Home
                    </Button>
                </div>

                {supportEmail && (
                    <Typography
                        variant="body2"
                        style={{
                            marginTop: '20px',
                            color: theme?.palette?.text?.secondary || (isDark ? '#9E9E9E' : '#616161'),
                            fontSize: '13px',
                        }}
                    >
                        Need help?{' '}
                        <a
                            href={`mailto:${supportEmail}`}
                            style={{
                                color: brandColor,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            Contact Support
                        </a>
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default NotFound;
