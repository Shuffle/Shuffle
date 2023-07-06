import React from "react";
import { Grid, Container, Divider, CardMedia, List, ListItem, ListItemText } from "@mui/material";

import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import { LineChart, LineSeries, BarChart } from "reaviz";
import { Gridline, GridStripe } from "reaviz";
import { GridlineSeries } from "reaviz";

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import SearchField from "../components/Searchfield";
import { SpaRounded } from "@material-ui/icons";
import { isMobile } from "react-device-detect"

const data = [
  {
    key: new Date("11/29/2019"),
    data: 10,
  },
  {
    key: new Date("11/30/2019"),
    data: 14,
  },
  {
    key: new Date("12/01/2019"),
    data: 5,
  },
  {
    key: new Date("12/02/2019"),
    data: 18,
  },
];

const useStyles1 = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));


const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  root: {
    minWidth: 275,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
  createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
  createData("Eclair", 262, 16.0, 24, 6.0),
  createData("Cupcake", 305, 3.7, 67, 4.3),
  createData("Gingerbread", 356, 16.0, 49, 3.9),
];

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

function PrimarySearchAppBar() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
      <MenuItem onClick={handleMenuClose}>My account</MenuItem>
    </Menu>
  );

  const mobileMenuId = 'primary-search-account-menu-mobile';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton size="large" aria-label="show 4 new mails" color="inherit">
          <Badge badgeContent={4} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem>
        <IconButton
          size="large"
          aria-label="show 17 new notifications"
          color="inherit"
        >
          <Badge badgeContent={17} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" style={{ backgroundColor: "black", boxShadow: "unset" }}>
        <Toolbar>
          <img src="/images/Shuffle_logo.png" style={{ height: "3rem", width: "3rem" }} alt="shuffle img" />
          <SearchField />
          {/* <Box sx={{ flexGrow: 1 }} /> */}

        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
    </Box>
  );
}

const AppHub = () => {
  const classes = useStyles();
  const classes1 = useStyles1();

  const [usecases, setUsecases] = React.useState([
    {
      "name": "1. Collect",
      "color": "#c51152",
      "list": [
        {
          "name": "Email management",
          "priority": 100,
          "type": "communication",
          "items": {
            "name": "Release a quarantined message",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "EDR to ticket",
          "priority": 100,
          "type": "edr",
          "items": {
            "name": "Get host information",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "SIEM to ticket",
          "priority": 100,
          "type": "siem",
          "description": "Ensure tickets are forwarded to the correct destination. Alternatively add enrichment on it's way there.",
          "video": "https://www.youtube.com/watch?v=FBISHA7V15c&t=197s&ab_channel=OpenSecure",
          "blogpost": "https://medium.com/shuffle-automation/introducing-shuffle-an-open-source-soar-platform-part-1-58a529de7d12",
          "reference_image": "/images/detectionframework.png",
          "items": {},
          "matches": []
        },
        {
          "name": "2-way Ticket synchronization",
          "priority": 90,
          "items": {},
          "matches": []
        },
        {
          "name": "ChatOps",
          "priority": 70,
          "items": {},
          "matches": []
        },
        {
          "name": "Threat Intel received",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Assign tickets",
          "priority": 30,
          "items": {},
          "matches": []
        },
        {
          "name": "Firewall alerts",
          "priority": 90,
          "items": {
            "name": "URL filtering",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "IDS/IPS alerts",
          "priority": 90,
          "items": {
            "name": "Manage policies",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "Deduplicate information",
          "priority": 70,
          "items": {},
          "matches": []
        }
      ],
      "matches": []
    },
    {
      "name": "2. Enrich",
      "color": "#f4c20d",
      "list": [
        {
          "name": "Internal Enrichment",
          "priority": 100,
          "items": {
            "name": "...",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "External historical Enrichment",
          "priority": 90,
          "items": {
            "name": "...",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "Realtime",
          "priority": 50,
          "items": {
            "name": "Analyze screenshots",
            "items": {}
          },
          "matches": []
        }
      ],
      "matches": []
    },
    {
      "name": "3. Detect",
      "color": "#3cba54",
      "list": [
        {
          "name": "Search SIEM (Sigma)",
          "priority": 90,
          "items": {
            "name": "Endpoint",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "Search EDR (OSQuery)",
          "priority": 90,
          "items": {},
          "matches": []
        },
        {
          "name": "Search emails (Sublime)",
          "priority": 90,
          "items": {
            "name": "Check headers and IOCs",
            "items": {}
          },
          "matches": []
        },
        {
          "name": "Search IOCs (ioc-finder)",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Search files (Yara)",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Memory Analysis (Volatility)",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "IDS & IPS (Snort/Surricata)",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Validate old tickets",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Honeypot access",
          "priority": 50,
          "items": {
            "name": "...",
            "items": {}
          },
          "matches": []
        }
      ],
      "matches": []
    },
    {
      "name": "4. Respond",
      "color": "#4885ed",
      "list": [
        {
          "name": "Eradicate malware",
          "priority": 90,
          "items": {},
          "matches": []
        },
        {
          "name": "Quarantine host(s)",
          "priority": 90,
          "items": {},
          "matches": []
        },
        {
          "name": "Block IPs, URLs, Domains and Hashes",
          "priority": 90,
          "items": {},
          "matches": []
        },
        {
          "name": "Trigger scans",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Update indicators (FW, EDR, SIEM...)",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Autoblock activity when threat intel is received",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Lock/Delete/Reset account",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Lock vault",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Increase authentication",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Get policies from assets",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Run ansible scripts",
          "priority": 50,
          "items": {},
          "matches": []
        }
      ],
      "matches": []
    },
    {
      "name": "5. Verify",
      "color": "#7f00ff",
      "list": [
        {
          "name": "Discover vulnerabilities",
          "priority": 80,
          "items": {},
          "matches": []
        },
        {
          "name": "Discover assets",
          "priority": 80,
          "items": {},
          "matches": []
        },
        {
          "name": "Ensure policies are followed",
          "priority": 80,
          "items": {},
          "matches": []
        },
        {
          "name": "Find Inactive users",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Botnet tracker",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Ensure access rights match HR systems",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Ensure onboarding is followed",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Third party apps in SaaS",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Devices used for your cloud account",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Too much access in GCP/Azure/AWS/ other clouds",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Certificate validation",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Domain investigation with LetsEncrypt",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Monitor new DNS entries for domain with passive DNS",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Monitor and track password dumps",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Monitor for mentions of domain on darknet sites",
          "priority": 50,
          "items": {},
          "matches": []
        },
        {
          "name": "Reporting",
          "priority": 50,
          "items": {
            "name": "Monthly reports",
            "items": {
              "name": "...",
              "items": {}
            }
          },
          "matches": []
        }
      ],
      "matches": []
    }
  ]);

  const SideBar = {
    minWidth: 250,
    maxWidth: 300,
    borderRight: "1px solid rgba(255,255,255,0.3)",
    left: 0,
    position: "sticky",
    minHeight: "90vh",
    maxHeight: "90vh",
    overflowX: "hidden",
    overflowY: "auto",
    zIndex: 1000,
    color: "black"
  };

  const [age, setAge] = React.useState(0);

  const handleChange = (event) => {
    setAge(event.target.value);

  };

  return (
    <div>
      <Card>
        <CardContent style={{ padding: 0 }}>
          <div style={{
            background: "url('/images/home-header-bg.png')", height: "450px", backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            position: "relative"
          }}>
            <div style={{ width: "95%", margin: "auto", position: "relative", height: "450px" }}>
              <div>
                <PrimarySearchAppBar />
              </div>
              <div style={{
                position: "absolute",
                bottom: "10%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                width: "100%"
              }}>
                <div>
                  <img src="/images/Shuffle_logo.png" style={{ height: "4rem", width: "4rem" }} alt="shuffle img" />
                  <Typography type="title" variant="h1" color="#ef5d29">
                    SHUFFLE
                  </Typography>
                </div>
                <div>
                  <SearchField />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div style={{ display: "flex" }}>
        <div style={SideBar}>
          <List>
            <ListItem >
              <ListItemText>
                <span style={{ fontSize: "25px", fontFamily: "revert", fontWeight: "bold" }}>Categories</span>
              </ListItemText>
            </ListItem>
            <span></span>
            <Divider />
            <ListItem>
              <ListItemText>
                <span style={{ fontSize: "25px", fontFamily: "revert" }}>Workflows</span>
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <span style={{ fontSize: "25px", fontFamily: "revert" }}>Apps</span>
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                <span style={{ fontSize: "25px", fontFamily: "revert" }}>Docs</span>
              </ListItemText>
            </ListItem>
          </List>
        </div>
        <div style={{ padding: "20px", width: "100%" }}>
          <Typography type="title" variant="h2" color="black">
            Workflow
          </Typography>
          <div style={{ width: "100%", minHeight: isMobile ? 0 : 71, maxHeight: isMobile ? 0 : 71, }}>
            {!isMobile && usecases !== null && usecases !== undefined && usecases.length > 0 ?
              <div style={{ display: "flex", }}>
                <Grid container spacing={2}>
                  {usecases.map((usecase, index) => {
                    //console.log(usecase)
                    return (
                      <Grid item xs={4}>
                        <Paper
                          key={usecase.name}
                          style={{
                            flex: 1,
                            backgroundColor: "transparent",
                            marginRight: index === usecases.length - 1 ? 0 : 10,
                            cursor: "pointer",
                            overflow: "hidden",
                            padding: 10,
                            border: "0.0625rem solid #b2b2b2",
                            borderRadius: "1.5625rem",
                            boxSizing: "content-box",
                            cursor: "pointer",
                            height: "70px",
                          }}
                          onClick={() => {
                            console.log("clicked...")
                          }}
                        >
                          <a href={`/usecases?selected=${usecase.name}`} rel="noopener noreferrer" target="_blank" style={{ textDecoration: "none", }}>
                            <Typography variant="body1" color="textPrimary">
                              {usecase.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              In use: {usecase.matches.length}/{usecase.list.length}
                            </Typography>
                          </a>
                        </Paper>
                      </Grid>
                    )
                  })}
                </Grid>
              </div>
              : null}

          </div>
        </div>
      </div>
      <Card>
        <CardContent style={{ padding: 0 }}>
          <Typography type="title" variant="h3" color="#ffffff" style={{
            backgroundColor: "black", padding: "10px", height: "200px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            footer
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppHub;