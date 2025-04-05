import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Divider,
  alpha,
  Avatar,
  Select,
  Tooltip,
  DialogTitle,
  DialogContent,
  Dialog,
  Slide,
  Collapse
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Close as CloseIcon, Folder as FolderIcon, Code as CodeIcon, LibraryBooks as LibraryBooksIcon } from '@mui/icons-material'
import SearchBox from "../components/SearchData.jsx";
import ReactGA from "react-ga4";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardCommandKeyIcon from '@mui/icons-material/KeyboardCommandKey';
import SearchIcon from "@mui/icons-material/Search";
// import SearchField from "../components/Searchfield.jsx";
import { toast } from "react-toastify";
import AddIcon from '@mui/icons-material/Add';
import Mousetrap from "mousetrap";
import LicencePopup from "../components/LicencePopup.jsx";
import { Context } from "../context/ContextApi.jsx";

const curpath = (typeof window !== "undefined" && window.location && typeof window.location.pathname === "string")
? window.location.pathname
: "";

// Menu Data Structure
const menuData = {
  Products: [
    {
      title: "Shuffle",
      description:
        "The most versatile automation engine with focus on security.",
      icon: "/images/icons/shuffleLogo.svg",
      path: "/docs/about",
      gaData: {
        category: "navbar",
        action: "products_click",
        label: "shuffle_logo_click"
      }
    },
    {
      title: "Singul",
      description:
        "Connect and run actions seamlessly between different platforms.",
      icon: "/images/logos/singul.svg",
      path: "https://singul-docs.gitbook.io/singul/getting-started",
      gaData: {
        category: "navbar",
        action: "products_click",
        label: "singul_click"
      }
    },
    {
      title: "API Explorer",
      description:
        "Explore, run and automate APIs from over 2500 platforms.",
      icon: "/images/icons/API.svg",
      path: "/apis",
      gaData: {
        category: "navbar",
        action: "products_click",
        label: "api_explorer_click"
      }
    },
  ],
  Services: [
    {
      title: "Professional Services",
      description:
        "Professional Services help you solve problems at your convenience.",
      icon: "/images/ProfessionalServices.svg",
      path: "/professional-services",
      gaData: {
        category: "navbar",
        action: "services_click",
        label: "professional_services_click"
      }
    },
    {
      title: "Support",
      description:
        "Support to help you build automations with confidence.",
      icon: "/images/Support.svg",
      path: "/contact?category=support",
      gaData: {
        category: "navbar",
        action: "services_click",
        label: "support_click"
      }
    },
    {
      title: "Training",
      description:
        "Tailored to provide hands-on learning of Shuffle for automation mastery.",
      icon: "/images/Training.svg",
      path: "/training",
      gaData: {
        category: "navbar",
        action: "services_click",
        label: "training_click"
      }
    },
    {
      title: "Security Consultation",
      description:
        "Automate your infrastructure with expert guidance and tailored solutions.",
      icon: "/images/SecurityConsultation.svg",
      path: "/contact?category=security_consultation",
      gaData: {
        category: "navbar",
        action: "services_click",
        label: "security_consultation_click"
      }
    },
  ],
  Resources: {
    columns: [
      {
        title: "Platform",
        items: [
          {
            title: "Usecases",
            icon: "/images/icons/usecases.svg",
            hoverIcon: "/images/icons/usecases_hover.svg",
            link: "/usecases",
            gaData: {
              category: "navbar",
              action: "resources_click",
              label: "usecases_click"
            }
          },
          {
            title: "Documentation",
            icon: "/images/icons/docs.svg",
            hoverIcon: "/images/icons/docs_hover.svg",
            link: "/docs/about",
            gaData: {
              category: "navbar",
              action: "resources_click",
              label: "documentation_click"
            }
          },
          { title: "FAQ", icon: "/images/icons/faq.svg", hoverIcon: "/images/icons/faq_hover.svg", link: "/faq", gaData: { category: "navbar", action: "resources_click", label: "faq" } },
        ],
      },
      {
        title: "Company",
        items: [
          {
            title: "About us",
            icon: "/images/icons/about_us.svg",
            hoverIcon: "/images/icons/about_us_hover.svg",
            link: "/docs/about",
            gaData: {
              category: "navbar",
              action: "resources_click",
              label: "about_us_click"
            }
          },
          {
            title: "Articles",
            icon: "/images/icons/articles.svg",
            hoverIcon: "/images/icons/articles_hover.svg",
            link: "/articles/2.0_release",
            gaData: {
              category: "navbar",
              action: "resources_click",
              label: "articles_click"
            }
          },
          {
            title: "Contact Us",
            icon: "/images/icons/contact_us.svg",
            hoverIcon: "/images/icons/contact_us_hover.svg",
            link: "/contact?category=contact",
            gaData: {
              category: "navbar",
              action: "resources_click",
              label: "contact_us_click"
            }
          },
        ],
      },
      {
        title: "Join the community",
        social: true,
        platforms: [
          { name: "Discord", icon: "/images/icons/discord.svg", link: "https://discord.gg/B2CBzUm", gaData: { category: "navbar", action: "social_click", label: "discord_icon_click" } },
          { name: "GitHub", icon: "/images/icons/github.svg", link: "https://github.com/shuffle/shuffle/blob/main/.github/install-guide.md", gaData: { category: "navbar", action: "social_click", label: "github_icon_click" } },
        ],
        followUs: [
          { name: "LinkedIn", icon: "/images/icons/linkedIn.svg", link: "https://www.linkedin.com/company/shuffleio", gaData: { category: "navbar", action: "social_click", label: "linkedin_icon_click" } },
          { name: "Twitter", icon: "/images/icons/x.svg", link: "https://twitter.com/shuffleio", gaData: { category: "navbar", action: "social_click", label: "twitter_icon_click" } },
        ],
      },
    ],
  },
};

// Add this new component at the top level of the file, right after the imports
const LoadingSkeleton = () => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Box 
        sx={{
          width: 42,
          height: 42,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '8px',
          "@keyframes pulse": {
            "0%": { opacity: 1 },
            "50%": { opacity: 0.5 },
            "100%": { opacity: 1 },
          },
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <Box 
        sx={{
          width: 120,
          height: 42,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '8px',
          "@keyframes pulse": {
            "0%": { opacity: 1 },
            "50%": { opacity: 0.5 },
            "100%": { opacity: 1 },
          },
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <Box 
        sx={{
          width: 90,
          height: 42,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '8px',
          "@keyframes pulse": {
            "0%": { opacity: 1 },
            "50%": { opacity: 0.5 },
            "100%": { opacity: 1 },
          },
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <Box 
        sx={{
          width: 42,
          height: 42,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: '50%',
          "@keyframes pulse": {
            "0%": { opacity: 1 },
            "50%": { opacity: 0.5 },
            "100%": { opacity: 1 },
          },
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </Box>
  );
};

// Add this new component for mobile menu
const MobileMenu = ({ anchorEl, handleClose, isLoggedIn, navigate, isCloud }) => {
  const [openSection, setOpenSection] = useState(null);
  const theme = useTheme();

  // Add useEffect to handle body scroll
  useEffect(() => {
    if (Boolean(anchorEl)) {
      // Disable scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scroll
      document.body.style.overflow = 'auto';
    }

    // Cleanup function to ensure scroll is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [anchorEl]);

  const handleSectionClick = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleItemClick = (path) => {
    handleClose();
    navigate(path);
  };

  const showDesktopToast = () => {
    toast.info("Please open on desktop for the full experience");
    handleClose();
  };

  return (
    <Dialog
      open={Boolean(anchorEl)}
      onClose={handleClose}
      fullScreen
      TransitionComponent={Slide}
      TransitionProps={{ direction: "left" }}
      disableScrollLock
      PaperProps={{
        sx: {
          backgroundColor: "#1A1A1A",
          color: "white",
          marginTop: "64px",
          height: 'calc(100% - 64px)',
          fontFamily: theme.typography.fontFamily,
          zIndex: 60000,
          boxShadow: 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 100%)',
            pointerEvents: 'none',
          },
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'transparent',
        }
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', backgroundColor: "#1A1A1A" }}>
        {Object.keys(menuData).map((section) => (
          <Box key={section}>
            <Button
              fullWidth
              onClick={() => handleSectionClick(section)}
              sx={{
                color: 'white',
                justifyContent: 'space-between',
                textTransform: 'none',
                py: 2,
                fontSize: '16px',
                px: 3,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                fontFamily: theme.typography.fontFamily,
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }
              }}
              endIcon={
                <KeyboardArrowDownIcon 
                  sx={{ 
                    transform: openSection === section ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s'
                  }} 
                />
              }
            >
              {section}
            </Button>

            <Collapse in={openSection === section}>
              {section === 'Resources' ? (
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {menuData.Resources.columns.map((column, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 3,
                        borderBottom: index !== menuData.Resources.columns.length - 1 ? 
                          '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        pb: index !== menuData.Resources.columns.length - 1 ? 3 : 0,
                      }}
                    >
                      <Typography sx={{ 
                        color: 'white', 
                        mb: 1,
                        pl: 1,
                        fontSize: '14px',
                        fontFamily: theme.typography.fontFamily,
                      }}>
                        {column.title} 
                      </Typography>
                      
                      {column.social ? (
                        <>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2, pl: 1 }}>
                            {column.platforms.map((platform) => (
                              <IconButton
                                key={platform.name}
                                sx={{ 
                                  padding: 0,
                                  width: 40,
                                  height: 40,
                                  "&:hover": {
                                    backgroundColor: "transparent",
                                    opacity: 0.8,
                                  },
                                }}
                                onClick={() => {
                                  if (isCloud) {
                                    ReactGA.event(platform.gaData);
                                  }
                                  window.open(platform.link, '_blank')
                                  return;
                                }}
                                // onClick={() => showDesktopToast()}
                              >
                                <img 
                                  src={platform.icon} 
                                  alt={platform.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                  }}
                                />
                              </IconButton>
                            ))}
                          </Box>
                          <Typography sx={{ 
                            color: 'white', 
                            mb: 1,
                            pl: 1,
                            fontSize: '14px',
                            fontFamily: theme.typography.fontFamily,
                          }}>
                            Follow Us
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, pl: 1 }}>
                            {column.followUs.map((platform) => (
                              <IconButton
                                key={platform.name}
                                sx={{ 
                                  padding: 0,
                                  width: 40,
                                  height: 40,
                                  "&:hover": {
                                    backgroundColor: "transparent",
                                    opacity: 0.8,
                                  },
                                }}
                                onClick={() => {
                                  if (isCloud) {
                                    ReactGA.event(platform.gaData);
                                  }
                                  window.open(platform.link, '_blank')
                                  return;
                                }}
                              >
                                <img 
                                  src={platform.icon} 
                                  alt={platform.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                  }}
                                />
                              </IconButton>
                            ))}
                          </Box>
                        </>
                      ) : (
                        column.items.map((item) => (
                          <Button
                            key={item.title}
                            fullWidth
                            startIcon={
                              <img 
                                src={item.icon} 
                                alt={item.title}
                                style={{ width: 20, height: 20 }}
                              />
                            }
                            onClick={() => {
                                if (isCloud) {
                                    ReactGA.event(item.gaData);
                                    handleItemClick(item.link)
                                }else{
                                    if(item.link.includes("usecases") || item.link.includes("docs")){
                                        handleItemClick(item.link)
                                    }else{
                                       window.open("https://shuffler.io" + item.link, '_blank');
                                      return;
                                    }
                                }
                            }}
                            sx={{
                              color: 'white',
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              py: 1.5,
                              fontFamily: theme.typography.fontFamily,
                              borderRadius: 0,
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.05)'
                              }
                            }}
                          >
                            {item.title}
                          </Button>
                        ))
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box>
                  {menuData[section].map((item) => (
                    <Button
                      key={item.title}
                      fullWidth
                      onClick={() => {
                        if (item.title === "Singul") {
                          window.open(item.path, '_blank');
                          return;
                        } else {
                          handleItemClick(item.path);
                        }
                      }}
                      sx={{
                        color: 'white',
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        py: 2,
                        px: 3,
                        gap: 2,
                        fontFamily: theme.typography.fontFamily,
                        borderBottom: '1px solid #494949',
                        borderRadius: 0,
                        position: 'relative',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.05)'
                        }
                      }}
                    >
                      <img 
                        src={item.icon} 
                        alt={item.title}
                        style={{ 
                          width: 40, 
                          height: 40,
                          padding: 8,
                          borderRadius: 4,
                          backgroundColor: '#2F2F2F',
                          minWidth: 40,
                          minHeight: 40,
                        }}
                      />
                      <Box sx={{ textAlign: 'left' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ 
                            fontWeight: 600, 
                            mb: 0.5,
                            color: 'white',
                            fontSize: '15px',
                            fontFamily: theme.typography.fontFamily,
                          }}>
                            {item.title}
                          </Typography>
                          {item.title === "Singul" && (
                            <Typography
                              sx={{
                                fontSize: '10px',
                                color: '#FF8544',
                                border: '1px solid #FF8544',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                lineHeight: 1,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              Coming Soon
                            </Typography>
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'white',
                            fontSize: '12px',
                            fontFamily: theme.typography.fontFamily,
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Box>
              )}
            </Collapse>
          </Box>
        ))}

        {/* Static menu items */}
        <Button
          fullWidth
          onClick={() => {
            if (isCloud) {
              ReactGA.event({
                category: "navbar",
                action: "pricing_click",
                label: "go_to_pricing",
              })
              handleItemClick('/pricing')
            }else{
              window.open("https://shuffler.io/pricing", '_blank');
              return;
            }
          }}
          sx={{
            color: 'white',
            justifyContent: 'flex-start',
            textTransform: 'none',
            py: 2,
            px: 3,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontFamily: theme.typography.fontFamily,
            borderRadius: 0,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          Pricing
        </Button>
        <Button
          fullWidth
          onClick={() => {
            if (isCloud) {
              ReactGA.event({
                category: "navbar",
                action: "partners_click",
                label: "go_to_partners",
              })
              handleItemClick('/partners')
            }else{
              window.open("https://shuffler.io/partners", '_blank');
              return;
            }
          }}
          sx={{
            color: 'white',
            justifyContent: 'flex-start',
            textTransform: 'none',
            py: 2,
            px: 3,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontFamily: theme.typography.fontFamily,
            borderRadius: 0,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          Partners
        </Button>

        {/* Action buttons */}
        <Box sx={{ p: 2, mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
                window.open("https://shuffler.io/contact?category=book_a_demo", '_blank');
                return;
            }}
            sx={{
              backgroundColor: '#FF8544',
              color: '#1A1A1A',
              textTransform: 'none',
              py: 1.5,
              mb: 2,
              fontFamily: theme.typography.fontFamily,
              borderRadius: 0,
              '&:hover': {
                
                backgroundColor: '#FF8544',
              }
            }}
          >
            Book a Demo
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => showDesktopToast()}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              textTransform: 'none',
              py: 1.5,
              fontFamily: theme.typography.fontFamily,
              borderRadius: 0,
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'transparent'
              }
            }}
          >
            Login
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

const Navbar = (props) => {
  const {
    globalUrl,
    isLoaded,
    isLoggedIn,
    removeCookie,
    homePage,
    userdata,
    // isMobile,
    serverside,
    billingInfo,

    notifications,
  } = props;

  const topbar_var = "topbar_closed10"

  const theme = useTheme();
  const {searchBarModalOpen, setSearchBarModalOpen, isDocSearchModalOpen} = useContext(Context)
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState({});
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElOrg, setAnchorElOrg] = useState(null);
  const [isOrgChanging, setIsOrgChanging] = useState(false);
  const [isHovered, setIsHovered] = useState("");
  const [orgSelectOpen, setOrgSelectOpen] = useState(false);
  const [showTopbar, setShowTopbar] = useState(true) // Set to true to show top bar
  const isCloud =
  serverside === true || typeof window === "undefined"
    ? true
    : window.location.host === "localhost:3002" ||
    window.location.host === "shuffler.io" ||
    window.location.host === "localhost:5002";

  
  const stripeKey = typeof window === 'undefined' || window.location === undefined ? "" : window.location.origin === "https://shuffler.io" ? "pk_live_51PXYYMEJjT17t98N20qEqItyt1fLQjrnn41lPeG2PjnSlZHTDNKHuisAbW00s4KAn86nGuqB9uSVU4ds8MutbnMU00DPXpZ8ZD" : "pk_test_51PXYYMEJjT17t98NbDkojZ3DRvsFUQBs35LGMx3i436BXwEBVFKB9nCvHt0Q3M4MG3dz4mHheuWvfoYvpaL3GmsG00k1Rb2ksO"

  useEffect(() => {
	// Manually setShowTopbar(true) to show topbar by default
    const topbar = localStorage.getItem(topbar_var)
    if (topbar === "true") {
      setShowTopbar(false)
	}
  }, [])

  const pricingModal =
  <Dialog
    open={pricingModalOpen}
    onClose={() => {
      setPricingModalOpen(false);
    }}
    PaperProps={{
      style: {
        color: "white",
        minWidth: 850,
        minHeight: 370,
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderRadius: theme.palette?.borderRadius,
      },
    }}
  >
    <DialogTitle style={{ display: "flex" }}>
      <span style={{ color: "white", fontSize: 24 }}>
        Upgrade your plan
      </span>
      <IconButton
        onClick={() => {
          if (isCloud) {
            ReactGA.event({
              category: "navbar",
              action: "close_upgrade_modal",
              label: "navbar_upgrade_modal",
            })
          };
          setPricingModalOpen(false);
        }}
        style={{
          marginLeft: "auto",
          position: "absolute",
          top: 20,
          right: 20,
        }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
      <LicencePopup
        serverside={serverside}
        removeCookie={removeCookie}
        isLoaded={isLoaded}
        isLoggedIn={isLoggedIn}
        globalUrl={globalUrl}
        selectedOrganization={selectedOrganization}
        billingInfo={billingInfo}
        features={selectedOrganization?.sync_features}
        isCloud={isCloud}
        userdata={userdata}
        stripeKey={stripeKey}
        setModalOpen={setPricingModalOpen}
        licensePopup={true}
        {...props}
      />
    </div>
  </Dialog>


  const modalView = (
    <Dialog
      open={searchBarModalOpen && !isDocSearchModalOpen}
      onClose={() => {
        setSearchBarModalOpen(false);
      }}
      PaperProps={{
        style: {
          color: "white",
          minWidth: 750,
          height: 785,
          borderRadius: 16,
          border: "1px solid var(--Container-Stroke, #494949)",
          background: "var(--Container, #000000)",
          boxShadow: "0px 16px 24px 8px rgba(0, 0, 0, 0.25)",
        },
      }}
      sx={{
        zIndex: 50005,
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, pt: 2 }}>
        <DialogTitle 
          sx={{ 
            color: "var(--Paragraph-text, #C8C8C8)",
            p: 0,
            m: 0,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Search for Docs, Apps, Workflows and more
        </DialogTitle>
        <IconButton 
          onClick={() => setSearchBarModalOpen(false)}
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent >
        <Box sx={{ pt: 3 }}>
          <SearchBox globalUrl={globalUrl} serverside={serverside} userdata={userdata} />
        </Box>
      </DialogContent>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}/>
    </Dialog>
  );

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleMenuOpen = (menu) => {
    setOpenMenu(menu);
  };

  const handleMenuClose = () => {
    setOpenMenu(null);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenOrgMenu = (event) => {
    setAnchorElOrg(event.currentTarget);
  };

  const handleCloseOrgMenu = () => {
    setAnchorElOrg(null);
  };

  const menuStyles = {
    "& .MuiPaper-root": {
      backgroundColor: "#212121",
      marginTop: 1,
      backdropFilter: "blur(10px)",
      fontFamily: theme.typography.fontFamily,
    },
  };

  const menuItemBox = {
    display: "flex",
    alignItems: "flex-start",
    padding: 2,
    paddingTop: "20px",
    paddingBottom: "20px",
    paddingLeft: "20px",
    gap: 2,
    width: "100%",
    backgroundColor: "#212121",
    transition: "all 0.2s ease-in-out",
    borderBottom: "1px solid #494949",
  };

  const buttonStyles = {
    fontFamily: theme.typography.fontFamily,
    color: "white",
    textTransform: "none",
    fontSize: "16px",
    fontWeight: 400,
    padding: "6px 12px",
    "& .MuiSvgIcon-root": {
      transition: "transform 0.2s ease-in-out",
    },
    "&:hover": {
      backgroundColor: "transparent",
      color: theme.palette.primary.main,
      "& .MuiSvgIcon-root": {
        transform: "rotate(180deg)",
      },
    },
  };

  // Render menu content based on type
  const renderMenuContent = (item, isCloud) => {
    if (item === "Resources") {
      return (
        <Box sx={{ display: "flex", gap: 8, p: 1.5 }}>
          {menuData.Resources.columns.map((column, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                borderRight:
                  index !== menuData.Resources.columns.length - 1
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "none",
                pr: index !== menuData.Resources.columns.length - 1 ? 4 : 0,
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 600,
                  mb: 2.5,
                  pl:
                    index !== menuData.Resources.columns.length - 1
                      ? "12px"
                      : 0,
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {column.title}
              </Typography>

              {column.social ? (
                <>
                  <Box sx={{ display: "flex", gap: 1.5, mb: 4 }}>
                    {column.platforms.map((platform) => (
                      <IconButton
                        key={platform.name}
                        component="a"
                        href={platform.link}
                        target="_blank"
                        onClick={() => {
                          if (isCloud) {
                            ReactGA.event(platform.gaData);
                          }
                          handleMenuClose();
                        }}
                        sx={{
                          padding: 0,
                          width: 48,
                          height: 48,
                          "&:hover": {
                            backgroundColor: "transparent",
                            opacity: 0.8,
                          },
                        }}
                      >
                        <img
                          src={platform.icon}
                          alt={platform.name}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </IconButton>
                    ))}
                  </Box>
                  <Typography
                    sx={{
                      color: "white",
                      fontSize: "20px",
                      fontWeight: 500,
                      mb: 2,
                      fontFamily: theme.typography.fontFamily,
                    }}
                  >
                    Follow Us
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    {column.followUs.map((platform) => (
                      <IconButton
                        key={platform.name}
                        component="a"
                        href={platform.link}
                        target="_blank"
                        onClick={() => {
                          if (isCloud) {
                            ReactGA.event(platform.gaData);
                          }
                          handleMenuClose();
                        }}
                        sx={{
                          padding: 0,
                          width: 48,
                          height: 48,
                          "&:hover": {
                            backgroundColor: "transparent",
                            opacity: 0.8,
                          },
                        }}
                      >
                        <img
                          src={platform.icon}
                          alt={platform.name}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </IconButton>
                    ))}
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {column.items.map((item) => (
                    <Button
                      key={item.title}
                      component={Link}
                      to={item.link}
                      onClick={() => {
                        if (isCloud) {
                          ReactGA.event(item.gaData);
                          handleMenuClose();
                        } else if (item.link.includes("docs") || item.link.includes("usecases")) {
                          handleMenuClose();
                        } else {
                          window.open("https://shuffler.io" + item.link, '_blank');
                          return;
                        }
                      }}
                      startIcon={
                        <img
                          width={22}
                          height={22}
                          src={isHovered === item.title.toLowerCase() ? item.hoverIcon : item.icon}
                          alt={item.title}
                          style={{ width: 22, height: 22, paddingLeft: "5px"}}
                        />
                      }
                      onMouseEnter={() => setIsHovered(item.title.toLowerCase())}
                      onMouseLeave={() => setIsHovered("")}
                      sx={{
                        color: "white",
                        justifyContent: "flex-start",
                        textTransform: "none",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: 500,
                        fontFamily: theme.typography.fontFamily,
                        "&:hover": {
                          backgroundColor: "#292929",
                          color: theme.palette.primary.main,
                        },
                        "& .MuiButton-startIcon": {
                          marginRight: "12px",
                        },
                      }}
                    >
                      {item.title}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      );
    }

    return menuData[item].map((menuItem, index) => (
      <MenuItem
        key={menuItem.title}
        onClick={() => {
          if (menuItem.title === "Singul") {
            window.open(menuItem.path, '_blank');
            return;
          }
          if(isCloud) {
            ReactGA.event(menuItem.gaData);
          }
          handleCloseNavMenu();
          handleMenuClose();
          if(isCloud) {
            navigate(menuItem.path);
          } else {
            if(menuItem.path.includes("docs")){
              navigate(menuItem.path);
              handleMenuClose();
            }else{
              window.open("https://shuffler.io" + menuItem.path, '_blank'); 
              return;
            }
          }
        }}
        sx={{
          padding: 0,
          backgroundColor: "#212121",
          "&:hover": {
            backgroundColor: "#212121",
          },
          "&:last-child": {
            borderBottomLeftRadius: "4px",
            borderBottomRightRadius: "4px",
          },
          "&:first-of-type": {
            paddingTop: "4px",
          },
        }}
      >
        <Box
          sx={{
            ...menuItemBox,
            borderBottom:
              index === menuData[item].length - 1
                ? "none"
                : "1px solid rgba(255, 255, 255, 0.1)",
            borderBottomLeftRadius:
              index === menuData[item].length - 1 ? "4px" : 0,
            borderBottomRightRadius:
              index === menuData[item].length - 1 ? "4px" : 0,
            "&:hover": {
              backgroundColor: "#292929",
            },
          }}
        >
          <Box
            component="img"
            src={menuItem.icon}
            sx={{
              width: isCloud ? 44 : 75,
              height: isCloud ? 44 : 75,
              padding: "20px",
              borderRadius: 1.5,
              backgroundColor: "#2F2F2F",
            }}
          />
          <Box sx={{ paddingTop: "5px"}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: "white",
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: "16px",
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {menuItem.title}
              </Typography>
              {menuItem.title === "Singul" && (
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: '#FF8544',
                    border: '1px solid #FF8544',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    lineHeight: 1,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Beta: Coming Soon
                </Typography>
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "#C8C8C8",
                fontSize: "14px",
                paddingRight: "12px",
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {menuItem.description}
            </Typography>
          </Box>
        </Box>
      </MenuItem>
    ));
  };

  const renderDesktopMenu = () => (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        gap: isTabletOrMobile ? 0 : 1,
        marginLeft: isTabletOrMobile ? 2 : 4,
        alignItems: "center",
      }}
    >
      {Object.keys(menuData).map((item) => (
        <Box
          key={item}
          sx={{
            position: "relative",
          }}
        >
          <Button
            onMouseEnter={() => handleMenuOpen(item)}
            onMouseLeave={(e) => {
              
              const dropdown = document.querySelector('.dropdown-content'); // Adjust the selector as needed
              const rect = e.currentTarget.getBoundingClientRect();
              const dropdownRect = dropdown ? dropdown.getBoundingClientRect() : null;

              // Check if the cursor is moving down
              const isMovingDown = e.clientY > rect.bottom;

              // Check if the cursor is within the dropdown area or a buffer zone
              const isOverDropdown = dropdownRect && (
                (e.clientY >= dropdownRect.top - 20 && e.clientY <= dropdownRect.bottom + 20) && // Buffer zone
                (e.clientX >= dropdownRect.left && e.clientX <= dropdownRect.right)
              );

              if (!isMovingDown && !isOverDropdown) {
                handleMenuClose();
              }
            }}
            sx={{
              ...buttonStyles,
              color: openMenu === item ? theme.palette.primary.main : "white",
              "& .MuiSvgIcon-root": {
                transform: openMenu === item ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              },
            }}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 20 }} />}
          >
            {item}
          </Button>

          {/* Custom Dropdown */}
          <Box
            className="dropdown-content"
            onMouseEnter={() => handleMenuOpen(item)}
            onMouseLeave={handleMenuClose}
            sx={{
              position: "absolute",
              top: "130%",
              left:
                item === "Products"
                  ? 0
                  : item === "Services"
                  ? -50
                  : item === "Resources"
                  ? isTabletOrMobile ? -330 : -250
                  : 0,
              backgroundColor: "#212121",
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: "4px",
              borderBottomRightRadius: "4px",
              boxShadow:
                "0 8px 16px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(10px)",
              zIndex: -20, 
              opacity: openMenu === item ? 1 : 0,
              visibility: openMenu === item ? "visible" : "hidden",
              transform: openMenu === item ? "translateY(0)" : "translateY(-8px)", 
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease", 
              pointerEvents: openMenu === item ? "auto" : "none",
              ...(item === "Resources" && {
                width: "900px",
                padding: 3,
              }),
            }}
          >
            {renderMenuContent(item, isCloud)}
          </Box>
        </Box>
      ))}
      <Button
        sx={buttonStyles}
        onClick={() => {
          if(isCloud) {
            navigate("/pricing");
            ReactGA.event({
              category: "navbar",
              action: "pricing_click",
              label: "go_to_pricing",
            })
          } else {
            window.open("https://shuffler.io/pricing?env=Self-Hosted", '_blank');
            return;
          }
        }}
      >
        Pricing
      </Button>
      <Button
        sx={buttonStyles}
        onClick={() => {
          if(isCloud) {
            navigate("/partners");
            ReactGA.event({
              category: "navbar",
              action: "partners_click",
              label: "go_to_partners",
            })
          } else {
            window.open("https://shuffler.io/partners", '_blank');
            return;
          }
        }}
      >
        Partners
      </Button>
    </Box>
  );

  const menuItemStyles = {
    fontFamily: theme.typography.fontFamily,
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 133, 68, 0.1)",
    },
  };

  const searchButtonStyles = {
    fontFamily: theme.typography.fontFamily,
    color: "rgba(255, 255, 255, 0.7)",
    border: "1px solid rgba(26, 26, 26, 0.8)",
    backgroundColor: "#2F2F2F",
    textTransform: "none",
    borderRadius: "8px",
    fontSize: "14px",
    padding: "6px 12px",
    display: "flex",
    alignItems: "center",
    height: "42px",
    gap: 1,
    minWidth: "110px",
    justifyContent: "space-between",
    "&:hover": {
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
  };

  const searchIconButtonStyles = {
    color: "rgba(255, 255, 255, 0.7)",
    padding: "8px",
    minWidth: "unset",
    height: "42px",
    "&:hover": {
      backgroundColor: "#3F3F3F",
    },
  };

  // Add this shared button style
  const sharedButtonStyles = {
    fontFamily: theme.typography.fontFamily,
    textTransform: "none",
    fontSize: "16px",
    fontWeight: 600,
    padding: "6px 24px",
  };


  useEffect(() => {
		Mousetrap.bind(['command+k', 'ctrl+k'], () => {
			setSearchBarModalOpen(true);
			return false; // Prevent the default action
		});
		Mousetrap.bind(['esc'], () => {
			setSearchBarModalOpen(false);
			return false; // Prevent the default action
		});

		return () => {
			Mousetrap.unbind(['command+k', 'ctrl+k']);
		};
	}, []);

  useEffect(() => {
    if (isLoggedIn && userdata?.active_org?.id?.length > 0) {
      handleGetOrg(userdata.active_org.id);
    }
  }, [isLoggedIn]);

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
          console.log("Error getting org: ", responseJson);
        } else {
          setSelectedOrganization(responseJson);
        }
      })
      .catch((error) => {
        console.log("Error getting org: ", error);
      });
  };

  const handleClickLogout = () => {
    console.log("SHOULD LOG OUT");

    toast.info("Logging out...");
    // Don't really care about the logout
    fetch(globalUrl + "/api/v1/logout", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        // Log out anyway
        removeCookie("session_token", { path: "/" });
        removeCookie("session_token", { path: "/" });
        removeCookie("session_token", { path: "/" });

        removeCookie("__session", { path: "/" });
        removeCookie("__session", { path: "/" });
        removeCookie("__session", { path: "/" });

        removeCookie("__session", { path: "/" });
       
        window.location.pathname = "/";

        localStorage.setItem("globalUrl", "")

        // Delete userinfo from localstorage
        localStorage.removeItem("apps")
        localStorage.removeItem("workflows")
        localStorage.removeItem("userinfo")
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const topbarHeight = showTopbar ? 40 : 0
  const topbar = !isCloud || !showTopbar ? null :
    curpath === "/" || curpath.includes("/docs") || curpath === "/pricing" || curpath === "/contact" || curpath === "/search" || curpath === "/usecases" || curpath === "/training" || curpath === "/professional-services" ?
      <span style={{ zIndex: 50001, marginTop: -4}}>
        <div style={{ position: "relative", height: topbarHeight, backgroundImage: "linear-gradient(to right, #f86a3e, #f34079)", overflow: "hidden", }}>
          <Typography style={{ paddingTop: 7, fontSize:16, margin: "auto", textAlign: "center", color: "white", }}>
            {/* Shuffle 1.4.0 is out! Read more about&nbsp; */}
            Shuffle 2.0.0 is out now!&nbsp;
            <u>
              <span onClick={() => {
                ReactGA.event({
                  category: "landingpage",
                  action: "click_header_training",
                  label: "",
                })

                navigate("/articles/2.0_release")

              }} style={{ cursor: "pointer", textDecoration: "none", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
				Read about it here.
             </span>
            </u>
          </Typography>
          <IconButton color="secondary" style={{ position: "absolute", top: 0, right: 20, }} onClick={(event) => {
            setShowTopbar(false)

            // Set storage that it's clicked
            localStorage.setItem(topbar_var, "true")
          }}>
            <CloseIcon />
          </IconButton>
        </div>
      </span>
      :
      null

  const handleClickChangeOrg = (orgId) => {
    setIsOrgChanging(true);
    const data = { org_id: orgId };

    localStorage.setItem("globalUrl", "");
    localStorage.setItem("getting_started_sidebar", "open");
    toast.info("Changing organization...");
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
          localStorage.removeItem("apps");
          localStorage.removeItem("workflows");
          localStorage.removeItem("userinfo");
        }

        return response.json();
      })
      .then(function (responseJson) {
        if (responseJson.success === true) {
          if (
            responseJson.region_url !== undefined &&
            responseJson.region_url !== null &&
            responseJson.region_url.length > 0
          ) {
            console.log("Region Change: ", responseJson.region_url);
            localStorage.setItem("globalUrl", responseJson.region_url);
            //globalUrl = responseJson.region_url
          }

          if (responseJson["reason"] === "SSO_REDIRECT") {
            toast.info("Redirecting to SSO login page as SSO is required for this organization.");
            setTimeout(() => {
              window.location.href = responseJson["url"];
            }, 2000);
          } else {
            toast("Successfully changed active organization - refreshing!");
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } else {
          setIsOrgChanging(false);
          if (
            responseJson.reason !== undefined &&
            responseJson.reason !== null &&
            responseJson.reason.length > 0
          ) {
            toast(responseJson.reason);
          } else {
            toast("Failed changing org. Try again or contact support@shuffler.io if this persists.");
          }
        }
      })
      .catch((error) => {
        console.log("error changing: ", error);
        setIsOrgChanging(false);
      });
  };

  // Add these helper functions from LeftSideBar
  const getRegionTag = (region_url) => {
    let regiontag = "EU";
    if (region_url !== undefined && region_url !== null && region_url.length > 0) {
      const regionsplit = region_url.split(".");
      if (regionsplit.length > 2 && !regionsplit[0].includes("shuffler")) {
        const namesplit = regionsplit[0].split("/");
        regiontag = namesplit[namesplit.length - 1];

        if (regiontag === "california") {
          regiontag = "US";
        } else if (regiontag === "frankfurt") {
          regiontag = "EU-2";
        } else if (regiontag === "ca") {
          regiontag = "CA";
        }
      }
    }
    return regiontag;
  };

  const getRegionFlag = (region_url) => {
    const regionTag = getRegionTag(region_url);
    const regionMapping = {
      "US": "us",
      "EU": "eu",
      "EU-2": "de",
      "CA": "ca",
      "UK": "gb"
    };

    const region = regionMapping[regionTag] || "eu";
    return `https://flagcdn.com/48x36/${region}.png`;
  };

  // Add this useEffect to prevent scroll locking
  useEffect(() => {
    // Remove modal classes that cause scroll locking
    const removeModalClasses = () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    };

    // Create observer to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (document.body.classList.contains('MuiModal-open')) {
            removeModalClasses();
          }
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Cleanup
    return () => {
      observer.disconnect();
      removeModalClasses();
    };
  }, []);

  const handleOrgSelectClick = (event) => {
    // Prevent the default Select behavior
    event.preventDefault();
    if(isCloud){
      ReactGA.event({
        category: "navbar",
        action: "org_dropdown_click",
        label: "org_dropdown_click",
      })
    }
    // Toggle the select open state
    setOrgSelectOpen(!orgSelectOpen);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
		transition: serverside === true ? "none": undefined,
        backgroundColor: "transparent",
        boxShadow: "none",
        backgroundImage: "none",
        fontFamily: theme.typography.fontFamily,
        padding: "5px 0",
        zIndex: 12000,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(26, 26, 26, 0.75)",
          backdropFilter: "blur(10px)",
          zIndex: -1,
        },
      }}
    >
      {topbar}
      <Container maxWidth="xl" sx={{ zoom: {
        md: "0.7",
        lg: "0.8",
        xl: "1",
      } }}>
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                paddingLeft: "10px",
              }}
              onClick={() => {
                if (isCloud) {
                  ReactGA.event({
                    category: "navbar",
                    action: "home_click",
                    label: "shuffle_logo",
                  });
                }
              }}
            >
              <img
                src={"/images/logos/topleft_logo.svg"}
                alt="shuffle logo"
                style={{ height: 25 }}
              />
            </Link>
          </Box>

          {isMobile ? (
            /* Mobile Navigation Icons */
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton 
                sx={{ color: "white" }}
                onClick={() => setSearchBarModalOpen(true)}
              >
                <SearchIcon sx={{ fontSize: 22 }} />
              </IconButton>
              <IconButton 
                onClick={
                  (e) => {
                    if(Boolean(anchorElNav)) {
                      handleCloseNavMenu();
                    }else{
                      handleOpenNavMenu(e);
                    }
                  }
                } 
                sx={{ color: "white" }}
              >
                {Boolean(anchorElNav) ? (
                  <CloseIcon sx={{ fontSize: 24 }} />
                ) : (
                  <MenuIcon sx={{ fontSize: 24 }} />
                )}
              </IconButton>
              <MobileMenu 
                anchorEl={anchorElNav}
                handleClose={handleCloseNavMenu}
                isLoggedIn={isLoggedIn}
                navigate={navigate}
                isCloud={isCloud}
              />
            </Box>
          ) : (
            <>
              {modalView}
              {pricingModal}
              {renderDesktopMenu()}
              {/* Right Side Buttons */}
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                {!isLoaded ? (
                  <LoadingSkeleton />
                ) : isLoggedIn ? (
                  <>
                    {isOrgChanging ? (
                      <LoadingSkeleton />
                    ) : (
                      <>
                         <Tooltip 
                           title={
                             <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, color : "#FF8544" }}>
                                 <KeyboardCommandKeyIcon style={{ width: 15 }} />
                                 + K
                             </div>
                           } 
                           placement="bottom"
                           arrow  
                           componentsProps={{
                             tooltip: {
                               sx: {
                                 backgroundColor: "rgba(33, 33, 33, 1)",
                                 color: "rgba(241, 241, 241, 1)",
                                 fontSize: 12,
                                 border: "1px solid rgba(73, 73, 73, 1)",
                                 fontFamily: theme?.typography?.fontFamily,
                               }
                             },
                             popper: {
                               sx: {
                                 zIndex: 1000019,
                               }
                             }
                           }}
                         >
                           <IconButton
                           sx={searchIconButtonStyles}
                           onClick={() => {
                             if (isCloud) {
                               ReactGA.event({
                                 category: "navbar",
                                 action: "search_icon_click",
                                 label: "search_icon_click",
                               })
                             }
                             setSearchBarModalOpen(true);
                           }}
                         >
                           <SearchIcon sx={{ fontSize: 24 }} />
                         </IconButton>
                         </Tooltip>
                        {isCloud && (userdata.org_status === undefined || userdata.org_status === null || userdata.org_status.length === 0) ? 
                         <Button
                          variant="contained"
                          sx={{
                            ...sharedButtonStyles,
                            backgroundColor: "#FF8544",
                            border: "1px solid #FF8544",
                            color: "#1A1A1A",
                            borderRadius: "8px",
                            padding: "8px 24px",
                            "&:hover": {
                              backgroundColor: "#FF955C",
                            },
                          }}
                          onClick={() => {
                            if (isCloud) {
                              ReactGA.event({
                                category: "navbar",
                                action: "upgrade_click",
                                label: "upgrade_button_click",
                              })
                            }
                            setPricingModalOpen(true)
                          }}
                        >
                          Upgrade
                        </Button>
                        : null}
                        <Button
                          variant="contained"
                          sx={{
                            ...sharedButtonStyles,
                            backgroundColor: "#2F2F2F",
                            border: "1px solid #2F2F2F",
                            color: "white",
                            borderRadius: "8px",
                            padding: "8px 20px",
                            "&:hover": {
                              backgroundColor: "#494949",
                              border: "1px solid white",
                            },
                          }}
                          onClick={() => {
                            if (isCloud) {
                              ReactGA.event({
                                category: "navbar",
                                action: "go_to_product",
                                label: "go_to_product_click",
                              })
                            }
                            navigate("/workflows");
                          }}
                        >
                          {isTabletOrMobile ? "Product" : "Go to Product"}
                        </Button>

                        {/* Organization Dropdown */}
                        {/* <Select
                          open={orgSelectOpen}
                          value={userdata?.active_org?.id || ''}
                          onClick={handleOrgSelectClick}
                          onChange={(e) => {
                            if (e.target.value === "create_new_suborgs") {
                              return;
                            }
                            handleClickChangeOrg(e.target.value);
                            setOrgSelectOpen(false);
                          }}
                          onClose={() => setOrgSelectOpen(false)}
                          renderValue={(selected) => {
                            const selectedOrg = userdata?.orgs?.find(org => org.id === selected);
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <img
                                  src={selectedOrg?.image || theme.palette.defaultImage}
                                  alt={selectedOrg?.name}
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '4px',
                                  }}
                                />
                                <span>{selectedOrg?.name?.slice(0, 3) + '...'}</span>
                              </Box>
                            );
                          }}
                          sx={{
                            display: {
                              xs:"none",
                              xl: "flex",
                            },
                            height: 45,
                            backgroundColor: "#212121",
                            borderRadius: "8px",
                            color: "white",
                            '.MuiSelect-select': {
                              padding: "9px 14px",
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: '#212121',
                              gap: 1,
                            },
                            '.MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                            '&:hover': {
                              backgroundColor: "rgba(47, 47, 47, 0.5)",
                            },
                            '& .MuiPaper-root': {
                              backgroundColor: '#212121',
                            },
                            '& .MuiMenu-paper': {
                              backgroundColor: '#212121',
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                backgroundColor: "#212121 !important",
                                color: "white",
                                marginTop: 1,
                                maxHeight: '400px',
                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.25)",
                                '& .MuiMenu-list': {
                                  backgroundColor: "#212121",
                                },
                                '& .MuiMenuItem-root': {
                                  backgroundColor: "#212121",
                                },
                                zIndex: 50004,
                              }
                            },
                            disableScrollLock: true,
                            BackdropProps: {
                              invisible: true,
                              sx: { 
                                backgroundColor: 'transparent',
                              }
                            },
                            anchorOrigin: {
                              vertical: 'bottom',
                              horizontal: 'right',
                            },
                            transformOrigin: {
                              vertical: 'top',
                              horizontal: 'right',
                            },
                          }}
                        >
                          {userdata?.orgs?.map((data, index) => {
                            if (!data.name) return null;

                            const imagesize = 22;
                            const skipOrg = data.creator_org && userdata.child_orgs?.some(
                              childOrg => childOrg.id === data.creator_org
                            );

                            if (skipOrg) return null;

                            const regiontag = getRegionTag(data.region_url);
                            const flagUrl = getRegionFlag(data.region_url);

                            return (
                              <MenuItem
                                key={index}
                                value={data.id}
                                disabled={data.id === userdata?.active_org?.id}
                                sx={{
                                  height: 40,
                                  backgroundColor: data.id === userdata?.active_org?.id ? 
                                    'rgba(255, 133, 68, 0.1) !important' : 
                                    '#212121 !important',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                                  },
                                }}
                              >
                                <Tooltip 
                                  title={data.creator_org ? `Suborg of ${data.creator_org}` : ''}
                                  placement="left"
                                  disableInteractive
                                  enterTouchDelay={0}
                                  leaveTouchDelay={0}
                                  componentsProps={{
                                    tooltip: {
                                      sx: {
                                        backgroundColor: '#2F2F2F',
                                        fontSize: '12px',
                                        padding: '8px 12px',
                                        borderRadius: '4px'
                                      }
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isCloud && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, flexShrink: 0 }}>
                                        <img
                                          src={flagUrl}
                                          alt={regiontag}
                                          style={{
                                            width: 20,
                                            height: 15,
                                            borderRadius: '2px',
                                          }}
                                        />
                                      </Box>
                                    )}
                                    <img
                                      src={data.image || theme.palette.defaultImage}
                                      alt={data.name}
                                      style={{
                                        width: imagesize,
                                        height: imagesize,
                                        marginLeft: data.creator_org ? 20 : 0,
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Typography 
                                      sx={{ 
                                        fontSize: '16px',
                                        maxWidth: '200px',
                                        overflow: 'auto',
                                        whiteSpace: 'nowrap',
                                        scrollbarWidth: 'thin',
                                        '&::-webkit-scrollbar': {
                                          height: '4px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                          background: 'transparent',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                          background: 'rgba(255, 255, 255, 0.1)',
                                          borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                          background: 'rgba(255, 255, 255, 0.2)',
                                        },
                                      }}
                                    >
                                      {data.name}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </MenuItem>
                            );
                          })}
                          <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                          <MenuItem
                            value="create_new_suborgs"
                            component={Link}
                            to="/admin?tab=tenants"
                            sx={{
                              height: 40,
                              justifyContent: 'center',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                          >
                            <AddIcon sx={{ mr: 1 }} />
                            Add suborgs
                          </MenuItem>
                        </Select> */}

                        {/* User Avatar Menu */}
                        <IconButton
                          onClick={(e) => {
                            if (isCloud) {
                              ReactGA.event({
                                category: "navbar",
                                action: "click_user_menu",
                                label: "open_user_dropdown"
                              });
                            }
                            handleOpenUserMenu(e);
                          }}
                          sx={{
                            padding: 0,
                            "&:hover": {
                              backgroundColor: "rgba(47, 47, 47, 0.5)",
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={userdata?.avatar}
                              alt="avatar"
                              sx={{ width: 32, height: 32 }}
                            />
                          </Box>
                        </IconButton>

                        <Menu
						  disabledPortal={serverside === true ? true : false}
                          anchorEl={anchorElUser}
                          open={Boolean(anchorElUser)}
                          onClose={handleCloseUserMenu}
                          disableScrollLock
                          sx={{ zIndex: 50004 }}
                          MenuListProps={{
                            sx: {
                              py: 0,
                              fontFamily: theme.typography.fontFamily,
                              backgroundColor: "#212121 !important",
                            }
                          }}
                          PaperProps={{
                            sx: {
                              backgroundColor: "#212121 !important", 
                              color: "white",
                              marginTop: "16px",
                              minWidth: 200,
                              maxWidth: 200,
                              boxShadow: "0 8px 16px rgba(0, 0, 0, 0.25)",
                              fontFamily: theme.typography.fontFamily,
                            }
                          }}
                          BackdropProps={{
                            invisible: true,
                            sx: { 
                              backgroundColor: 'transparent',
                            }
                          }}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                          }}
                        >
                          {/* User Info Section */}
                          <Box sx={{ px: 2, py: 1, fontFamily: theme.typography.fontFamily }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                              <Avatar
                                src={userdata?.avatar}
                                alt="avatar"
                                sx={{ width: 40, height: 40 }}
                              />
                              <Box sx={{ width: '100%', minWidth: 0 }}>
                                <Typography sx={{ 
                                  fontWeight: 500, 
                                  fontSize: '14px',
                                  fontFamily: theme.typography.fontFamily,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {userdata?.username}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Divider sx={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

                          {/* Menu Items */}
                          <MenuItem
                            onClick={() => {
                              if (isCloud) {
                                ReactGA.event({
                                  category: "navbar",
                                  action: "user_dropdown_click", 
                                  label: "go_to_admin"
                                });
                              }
                              handleCloseUserMenu();
                              navigate("/admin");
                            }}
                            onMouseEnter={() => setIsHovered("organization")}
                            onMouseLeave={() => setIsHovered("")}
                            sx={{
                              py: 1.5,
                              px: 2,
                              fontFamily: theme.typography.fontFamily,
                              transition: "color 0.1s ease",
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: isHovered === "organization" ? "#FF8544" : "white",
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box 
                                component="img"
                                src={isHovered === "organization" ? "/images/icons/Org_hover.svg" : "/images/icons/Org.svg"}
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography sx={{ 
                                fontSize: '14px',
                                fontFamily: theme.typography.fontFamily 
                              }}>
                                Organization
                              </Typography>
                            </Box>
                          </MenuItem>

                          <MenuItem
                            onClick={() => {
                              if (isCloud) {
                                ReactGA.event({
                                  category: "navbar",
                                  action: "user_dropdown_click",
                                  label: "go_to_settings",
                                })
                              }
                              handleCloseUserMenu();
                              navigate("/settings");
                            }}
                            onMouseEnter={() => setIsHovered("settings")}
                            onMouseLeave={() => setIsHovered("")}
                            sx={{
                              py: 1.5,
                              px: 2,
                              fontFamily: theme.typography.fontFamily,
                              transition: "color 0.1s ease",
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: isHovered === "settings" ? "#FF8544" : "white",
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box 
                                component="img"
                                src={isHovered === "settings" ? "/images/icons/settings_hover.svg" : "/images/icons/settings.svg"}
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography sx={{ 
                                fontSize: '14px',
                                fontFamily: theme.typography.fontFamily 
                              }}>
                                Settings
                              </Typography>
                            </Box>
                          </MenuItem>

                          <MenuItem
                            onClick={() => {
                              if (isCloud) {
                                ReactGA.event({
                                  category: "navbar",
                                  action: "user_dropdown_click",
                                  label: "go_to_notifications",
                                })
                              }
                              handleCloseUserMenu();
                              navigate("/admin?admin_tab=notifications");
                            }}
                            onMouseEnter={() => setIsHovered("notifications")}
                            onMouseLeave={() => setIsHovered("")}
                            sx={{
                              py: 1.5,
                              px: 2,
                              fontFamily: theme.typography.fontFamily,
                              transition: "color 0.1s ease",
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: isHovered === "notifications" ? "#FF8544" : "white",
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box 
                                component="img"
                                src={isHovered === "notifications" ? "/images/icons/notifications_hover.svg" : "/images/icons/notifications.svg"}
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography sx={{ 
                                fontSize: '14px',
                                fontFamily: theme.typography.fontFamily 
                              }}>
                                Notifications ({notifications === undefined || notifications === null ? 0 : 
                                notifications?.filter((notification) => notification.read === false).length})
                              </Typography>
                            </Box>
                          </MenuItem>


                          <Divider sx={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

                          <MenuItem
                            onClick={() => {
                              if (isCloud) {
                                ReactGA.event({
                                  category: "navbar",
                                  action: "user_dropdown_click",
                                  label: "go_to_about",
                                })
                              }
                              handleCloseUserMenu();
                              navigate("/docs/about");
                            }}
                            onMouseEnter={() => setIsHovered("about")}
                            onMouseLeave={() => setIsHovered("")}
                            sx={{
                              py: 1.5,
                              px: 2,
                              fontFamily: theme.typography.fontFamily,
                              transition: "color 0.1s ease",
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: isHovered === "about" ? "#FF8544" : "white",
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box 
                                component="img"
                                src={isHovered === "about" ? "/images/icons/about_hover.svg" : "/images/icons/about.svg"}
                                sx={{ width: 20, height: 20, marginLeft: -0.2 }}
                              />
                              <Typography sx={{ 
                                fontSize: '14px',
                                fontFamily: theme.typography.fontFamily 
                              }}>
                                About
                              </Typography>
                            </Box>
                          </MenuItem>

                          <MenuItem
                            onClick={() => {
                              if (isCloud) {
                                ReactGA.event({
                                  category: "navbar",
                                  action: "user_dropdown_click",
                                  label: "logout_click",
                                })
                              }
                              handleCloseUserMenu();
                              handleClickLogout();
                            }}
                            onMouseEnter={() => setIsHovered("logout")}
                            onMouseLeave={() => setIsHovered("")}
                            sx={{
                              py: 1.5,
                              px: 2,
                              fontFamily: theme.typography.fontFamily,
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: isHovered === "logout" ? "#FD4C62" : "white",
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box 
                                component="img"
                                src={isHovered === "logout" ? "/images/icons/logout_hover.svg" : "/images/icons/logout.svg"}
                                sx={{ width: 20, height: 20 }}
                              />
                              <Typography sx={{ 
                                fontSize: '14px',
                                fontFamily: theme.typography.fontFamily 
                              }}>
                                Logout
                              </Typography>
                            </Box>
                          </MenuItem>

                          <Divider sx={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                          
                          <Box 
                            sx={{ 
                              py: 1.5,
                              px: 2,
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mt: -1
                            }}
                          >
                            <Typography 
                              variant="caption"
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '12px',
                                fontFamily: theme.typography.fontFamily,
                                letterSpacing: '0.2px',
                                margin: 0
                              }}
                            >
                              Version 1.4.5
                            </Typography>
                          </Box>
                        </Menu>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Tooltip 
                     title={
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, color : "#FF8544" }}>
                            <KeyboardCommandKeyIcon style={{ width: 15 }} />
                              + K
                       </div>
                          } 
                      placement="bottom"
                      arrow  
                      componentsProps={{
                        tooltip: {
                            sx: {
                              backgroundColor: "rgba(33, 33, 33, 1)",
                              color: "rgba(241, 241, 241, 1)",
                              fontSize: 12,
                              border: "1px solid rgba(73, 73, 73, 1)",
                              fontFamily: theme?.typography?.fontFamily,
                              }
                            },
                        popper: {
                            sx: {
                              zIndex: 1000019,
                              }
                            }
                        }}
                        >
                        <IconButton
                           sx={searchIconButtonStyles}
                           onClick={() => {
                             if (isCloud) {
                               ReactGA.event({
                                 category: "navbar",
                                 action: "search_icon_click",
                                 label: "search_icon_click",
                               })
                             }
                             setSearchBarModalOpen(true);
                           }}
                         >
                           <SearchIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                    </Tooltip>
                    <Divider orientation="vertical" sx={{ height: 24, bgcolor: '#494949'}} />
                    <Button
                      variant="outlined"
                      disableRipple
                      sx={{
                        ...sharedButtonStyles,
                        px: 0,
                        color: "white",
                        backgroundColor: "transparent",
                        border: "none",
                        "&:hover": {
                          border: "none",
                          backgroundColor: "transparent",
                          color: "#FF8544",
                        },
                        "&:active": {
                          backgroundColor: "transparent",
                        },
                      }}
                      onClick={() => {
                        if (isCloud) {
                          ReactGA.event({
                            category: "navbar",
                            action: "signin_click",
                            label: "signin_click",
                          });
                        }
                        navigate("/login");
                      }}
                    >
                      Login
                    </Button>

					{isCloud && 
						<Button
						  variant="outlined"
						  sx={{
							...sharedButtonStyles,
							display: {
							  xs: "none",
							  lg: "block"
							},
							color: "white",
							backgroundColor: "#2F2F2F",
							border: "1px solid #2F2F2F",
							borderRadius: "8px",
							"&:hover": {
							  border: "1px solid white",
							  backgroundColor: "#2F2F2F",
							},
						  }}
						  onClick={() => {
							if (isCloud) {
							  ReactGA.event({
								category: "navbar",
								action: "signup_click",
								label: "signup_click",
							  });
							}
							navigate("/register");
						  }}
						>
						  Sign Up
						</Button>
					}

                    <Button
                      variant="contained"
                      sx={{
                        ...sharedButtonStyles,
                        backgroundColor: "#FF8544",
                        borderRadius: "6px",
                        color: "#1A1A1A",
                        "&:hover": {
                          backgroundColor: "#FF955C",
                        },
                      }}
                      onClick={() => {
                        if (isCloud) {
                          ReactGA.event({
                            category: "navbar",
                            action: "Book a Demo",
                            label: "Book a Demo",
                          });
                          navigate("/contact?category=book_a_demo");
                        }else{
                          window.open("https://shuffler.io/contact?category=book_a_demo", '_blank');
                          return;
                        }
                      }}
                    >
                     {isTabletOrMobile ? "Demo" : "Book a Demo"}
                    </Button>
                  </>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
