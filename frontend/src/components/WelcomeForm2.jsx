import React, { useState, useEffect, useRef } from "react";
import ReactGA from "react-ga4";
import Checkbox from "@mui/material/Checkbox";

import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";
import {isMobile} from "react-device-detect";
import SearchIcon from "@mui/icons-material/Search";
import EmailIcon from "@mui/icons-material/Email";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import ExtensionIcon from "@mui/icons-material/Extension";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import theme from "../theme.jsx";
import CheckBoxSharpIcon from "@mui/icons-material/CheckBoxSharp";
import {
  Button,
  Collapse,
  IconButton,
  FormGroup,
  FormControl,
  InputLabel,
  FormLabel,
  FormControlLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  TextField,
  Zoom,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Chip,
  ButtonGroup,
} from "@mui/material";
//import { useAlert

import { useNavigate, Link } from "react-router-dom";
import WorkflowSearch from "../components/Workflowsearch.jsx";
import AuthenticationItem from "../components/AuthenticationItem.jsx";
import WorkflowPaper from "../components/WorkflowPaper.jsx";
import UsecaseSearch from "../components/UsecaseSearch.jsx";
import ExploreWorkflow from "../components/ExploreWorkflow.jsx";
import AppSelection from "../components/AppSelection.jsx";

const responsive = {
  0: { items: 1 },
};

const imagestyle = {
  height: 40,
  borderRadius: 40,
  //border: "2px solid rgba(255,255,255,0.3)",
};

const WelcomeForm = (props) => {
  const {
    userdata,
    globalUrl,
    discoveryWrapper,
    setDiscoveryWrapper,
    appFramework,
	setAppFramework,
    getFramework,
    activeStep,
    setActiveStep,
    steps,
    skipped,
    setSkipped,
    getApps,
    apps,
    handleSetSearch,
    usecaseButtons,
    defaultSearch,
    setDefaultSearch,
    selectionOpen,
    setSelectionOpen,
    checkLogin,
    isLoggedIn,
  } = props;
  const [moreButton, setMoreButton] = useState(false);
  const ref = useRef()
  const [usecaseItems, setUsecaseItems] = useState([
    {
      search: "Phishing",
      usecase_search: undefined,
    },
    {
      search: "Enrichment",
      usecase_search: undefined,
    },
    {
      search: "Enrichment",
      usecase_search: "SIEM alert enrichment",
    },
    {
      search: "Build your own",
      usecase_search: undefined,
    },
  ]);
  /*
      <div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
        <UsecaseSearch
          globalUrl={globalUrl}
          defaultSearch={"Phishing"}
          appFramework={appFramework}
          apps={apps}
          getFramework={getFramework}
          userdata={userdata}
        />
      </div>
      ,
      <div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
        <UsecaseSearch
          globalUrl={globalUrl}
          defaultSearch={"Enrichment"}
          appFramework={appFramework}
          apps={apps}
          getFramework={getFramework}
          userdata={userdata}
        />
      </div>
      ,
      <div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
        <UsecaseSearch
          globalUrl={globalUrl}
          defaultSearch={"Enrichment"}
          usecaseSearch={"SIEM alert enrichment"}
          appFramework={appFramework}
          apps={apps}
          getFramework={getFramework}
          userdata={userdata}
        />
      </div>
      ,
      <div style={{minWidth: "95%", maxWidth: "95%", marginLeft: 5, marginRight: 5, }}>
        <UsecaseSearch
          globalUrl={globalUrl}
          defaultSearch={"Build your own"}
          appFramework={appFramework}
          apps={apps}
          getFramework={getFramework}
          userdata={userdata}
        />
      </div>
    ])
    */
  const [name, setName] = React.useState("")
  const [orgName, setOrgName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [orgType, setOrgType] = React.useState("")
  const [finishedApps, setFinishedApps] = React.useState([])
  const [authentication, setAuthentication] = React.useState([]);

  const [thumbIndex, setThumbIndex] = useState(0);
  const [thumbAnimation, setThumbAnimation] = useState(false);
  const [clickdiff, setclickdiff] = useState(0);
  const [mouseHoverIndex, setMouseHoverIndex] = useState(-1)

  const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
  //const alert = useAlert();
  let navigate = useNavigate();

  const iconStyles = {
    color: "rgba(255, 255, 255, 1)",
  };

  useEffect(() => {
    if (userdata.id === undefined) {
      return;
    }

    if (
      userdata.name !== undefined &&
      userdata.name !== null &&
      userdata.name.length > 0
    ) {
      setName(userdata.name);
    }

    if (
      userdata.active_org !== undefined &&
      userdata.active_org.name !== undefined &&
      userdata.active_org.name !== null &&
      userdata.active_org.name.length > 0
    ) {
      setOrgName(userdata.active_org.name);
    }
  }, [userdata]);

  useEffect(() => {
    if (discoveryWrapper === undefined || discoveryWrapper.id === undefined) {
      setDefaultSearch("");
      var newfinishedApps = finishedApps;
      newfinishedApps.push(defaultSearch);
      setFinishedApps(finishedApps);
    }
  }, [discoveryWrapper]);

  useEffect(() => {
    if (window.location.search !== undefined && window.location.search !== null) {
    
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());

      const foundTemplate = params["workflow_template"];
      if (foundTemplate !== null && foundTemplate !== undefined) {
        console.log("Found workflow template: ", foundTemplate);

        var sourceapp = undefined;
        var destinationapp = undefined;
        var action = undefined;
        const srcapp = params["source_app"];
        if (srcapp !== null && srcapp !== undefined) {
          sourceapp = srcapp;
        }

        const dstapp = params["dest_app"];
        if (dstapp !== null && dstapp !== undefined) {
          destinationapp = dstapp;
        }

        const act = params["action"];
        if (act !== null && act !== undefined) {
          action = act;
        }

        //defaultSearch={foundTemplate}
        //
        usecaseItems[0] = {
          search: "enrichment",
          usecase_search: foundTemplate,
          sourceapp: sourceapp,
          destinationapp: destinationapp,
          autotry: action === "try",
        };

        console.log("Adding: ", usecaseItems[0]);

        setUsecaseItems(usecaseItems);
      }
    }
  }, []);

  const isStepOptional = (step) => {
    return step === 1;
  };

  const sendUserUpdate = (name, role, userId) => {
    const data = {
      tutorial: "welcome",
      firstname: name,
      company_role: role,
      user_id: userId,
    };

    const url = `${globalUrl}/api/v1/users/updateuser`;
    fetch(url, {
      mode: "cors",
      method: "PUT",
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
            console.log("Update user success");
            //toast("Failed updating org: ", responseJson.reason);
          } else {
            console.log("Update success!");
            //toast("Successfully edited org!");
          }
        })
      )
      .catch((error) => {
        console.log("Update err: ", error.toString());
        //toast("Err: " + error.toString());
      });
  };

  const sendOrgUpdate = (orgname, company_type, orgId, priority) => {
    var data = {
      org_id: orgId,
    };

    if (orgname.length > 0) {
      data.name = orgname;
    }

    if (company_type.length > 0) {
      data.company_type = company_type;
    }

    if (priority.length > 0) {
      data.priority = priority;
    }

    const url = globalUrl + `/api/v1/orgs/${orgId}`;
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
            console.log("Update of org failed");
            //toast("Failed updating org: ", responseJson.reason);
          } else {
            //toast("Successfully edited org!");
          }
        })
      )
      .catch((error) => {
        console.log("Update err: ", error.toString());
        //toast("Err: " + error.toString());
      });
  };

  var workflowDelay = -50;
  const NewHits = ({ hits }) => {
    const [mouseHoverIndex, setMouseHoverIndex] = useState(-1);
    var counted = 0;

    const paperAppContainer = {
      display: "flex",
      flexWrap: "wrap",
      alignContent: "space-between",
      marginTop: 5,
    };

    return (
      <Grid container spacing={4} style={paperAppContainer}>
        {hits.map((data, index) => {
          workflowDelay += 50;

          if (index > 3) {
            return null;
          }

          return (
            <Zoom
              key={index}
              in={true}
              style={{ transitionDelay: `${workflowDelay}ms` }}
            >
              <Grid item xs={6} style={{ padding: "12px 10px 12px 10px" }}>
                <WorkflowPaper key={index} data={data} />
              </Grid>
            </Zoom>
          );
        })}
      </Grid>
    );
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    setDefaultSearch("");

    if (activeStep === 0) {
      console.log("Should send basic information about org (fetch)");
      setclickdiff(240);
      navigate(`/welcome?tab=2`);
	  setActiveStep(1);

      if (isCloud) {
        ReactGA.event({
          category: "welcome",
          action: "click_page_one_next",
          label: "",
        });
      }

      if (
        userdata.active_org !== undefined &&
        userdata.active_org.id !== undefined &&
        userdata.active_org.id !== null &&
        userdata.active_org.id.length > 0
      ) {
        sendOrgUpdate(orgName, orgType, userdata.active_org.id, "");
      }

      if (
        userdata.id !== undefined &&
        userdata.id !== null &&
        userdata.id.length > 0
      ) {
        sendUserUpdate(name, role, userdata.id);
      }
    } else if (activeStep === 1) {
      console.log("Should send secondary info about apps and other things");
      setDiscoveryWrapper({});

      navigate(`/welcome?tab=3`);
      //handleSetSearch("Enrichment", "2. Enrich")
      handleSetSearch(usecaseButtons[0].name, usecaseButtons[0].usecase);
      getApps();
	  setActiveStep(2);

      // Make sure it's up to date
      if (getFramework !== undefined) {
        getFramework();
      }
    } else if (activeStep === 2) {
      console.log(
        "Should send third page with workflows activated and the like"
      );
    }

    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };


  const handleReset = () => {
    setActiveStep(0);
  };

  //const buttonWidth = 145
  const buttonWidth = 450;
  const buttonMargin = 10;
  const sizing = 510;
  const bottomButtonStyle = {
    borderRadius: 200,
    marginTop: moreButton ? 44 : "",
    height: 51,
    width: 464,
    fontSize: 16,
    // background: "linear-gradient(89.83deg, #FF8444 0.13%, #F2643B 99.84%)",
    background: "linear-gradient(90deg, #F86744 0%, #F34475 100%)",
    padding: "16px 24px",
    // top: 20,
    // margin: "auto",
    itemAlign: "center",
    // marginLeft: "65px",
  };

  const slideNext = () => {
    if (!thumbAnimation && thumbIndex < usecaseItems.length - 1) {
      //handleSetSearch(usecaseButtons[0].name, usecaseButtons[0].usecase)
      setThumbIndex(thumbIndex + 1);
    } else if (!thumbAnimation && thumbIndex === usecaseItems.length - 1) {
      setThumbIndex(0);
    }
  };

  const slidePrev = () => {
    if (!thumbAnimation && thumbIndex > 0) {
      setThumbIndex(thumbIndex - 1);
    } else if (!thumbAnimation && thumbIndex === 0) {
      setThumbIndex(usecaseItems.length - 1);
    }
  };

  const newButtonStyle = {
    padding: 22,
    flex: 1,
    margin: buttonMargin,
    minWidth: buttonWidth,
    maxWidth: buttonWidth,
  };

  const formattedCarousel =
    appFramework === undefined || appFramework === null
      ? []
      : usecaseItems.map((item, index) => {
        return (
          <div
            style={{
              minWidth: "95%",
              maxWidth: "95%",
              marginLeft: 5,
              marginRight: 5,
            }}
          >
            <UsecaseSearch
              globalUrl={globalUrl}
              defaultSearch={item.search}
              usecaseSearch={item.usecase_search}
              appFramework={appFramework}
              apps={apps}
              getFramework={getFramework}
              userdata={userdata}
              autotry={item.autotry}
              sourceapp={item.sourceapp}
              destinationapp={item.destinationapp}
            />
          </div>
        );
      });

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Collapse in={true}>
            <Grid
              container
              spacing={1}
              style={{
                margin: "auto",
                maxWidth: 500,
                minWidth: 500,
                minHeight: sizing,
                maxHeight: sizing,
              }}
            >
              {/*isCloud ? null :
												<Typography variant="body1" style={{marginLeft: 8, marginTop: 10, marginRight: 30, }} color="textSecondary">
														This data will be used within the product and NOT be shared unless <a href="https://shuffler.io/docs/organizations#cloud_synchronization" target="_blank" rel="norefferer" style={{color: "#f86a3e", textDecoration: "none"}}>cloud synchronization</a> is configured.
													</Typography>
											*/}
              <Typography
                variant="body1"
                style={{ marginLeft: 8, marginTop: 10, marginRight: 30 }}
                color="textSecondary"
              >
                In order to understand how we best can help you find relevant
                Usecases, please provide the information below. This is
                optional, but highly encouraged.
              </Typography>
              <Grid item xs={11} style={{ marginTop: 16, padding: 0 }}>
                <TextField
                  required
                  style={{ width: "100%", marginTop: 0 }}
                  placeholder="Name"
                  autoFocus
                  label="Name"
                  type="name"
                  id="standard-required"
                  autoComplete="name"
                  margin="normal"
                  variant="outlined"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                />
              </Grid>
              <Grid item xs={11} style={{ marginTop: 10, padding: 0 }}>
                <TextField
                  required
                  style={{ width: "100%", marginTop: 0 }}
                  placeholder="Company / Institution"
                  label="Company Name"
                  type="companyname"
                  id="standard-required"
                  autoComplete="CompanyName"
                  margin="normal"
                  variant="outlined"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                  }}
                />
              </Grid>
              <Grid item xs={11} style={{ marginTop: 10 }}>
                <FormControl fullWidth={true}>
                  <InputLabel style={{ marginLeft: 10, color: "#B9B9BA" }}>
                    Your Role
                  </InputLabel>
                  <Select
                    variant="outlined"
                    required
                    onChange={(e) => {
                      setRole(e.target.value);
                    }}
                  >
                    <MenuItem value={"Student"}>Student</MenuItem>
                    <MenuItem value={"Security Analyst/Engineer"}>
                      Security Analyst/Engineer
                    </MenuItem>
                    <MenuItem value={"SOC Manager"}>SOC Manager</MenuItem>
                    <MenuItem value={"C-Level"}>C-Level</MenuItem>
                    <MenuItem value={"Other"}>Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={11} style={{ marginTop: 16 }}>
                <FormControl fullWidth={true}>
                  <InputLabel style={{ marginLeft: 10, color: "#B9B9BA" }}>
                    Company Type
                  </InputLabel>
                  <Select
                    required
                    variant="outlined"
                    onChange={(e) => {
                      setOrgType(e.target.value);
                    }}
                  >
                    <MenuItem value={"Education"}>Education</MenuItem>
                    <MenuItem value={"MSSP"}>MSSP</MenuItem>
                    <MenuItem value={"Security Product Company"}>
                      Security Product Company
                    </MenuItem>
                    <MenuItem value={"Other"}>Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        );
      case 1:
        return (
		  appFramework === undefined || appFramework === null ? null :
          <AppSelection
            globalUrl={globalUrl}
            userdata={userdata}
            appFramework={appFramework}
			setAppFramework={setAppFramework}
            setActiveStep={setActiveStep}
            defaultSearch={defaultSearch}
            setDefaultSearch={setDefaultSearch}
			selectionOpen={selectionOpen}
			setSelectionOpen={setSelectionOpen}
    		checkLogin={checkLogin}
          />
        )
      case 2:
        return (
          <Collapse in={true}>
            <div style={{ marginTop: 0, maxWidth: isMobile ? 300 : 700, minWidth: isMobile ? 300 : 700, textAlign: isMobile ? "center" : null, margin: "auto", minHeight: sizing, maxHeight: sizing, }}>

              <div style={{ marginTop: 0, }}>
                <div className="thumbs" style={{ display: "flex" }}>
                  <div style={{ minWidth: isMobile ? 300 :  554, maxWidth: isMobile ? 300 : 554, borderRadius: theme.palette?.borderRadius, }}>
                    <ExploreWorkflow
                      globalUrl={globalUrl}
					  isLoggedIn={isLoggedIn}
                      userdata={userdata}
					  appFramework={appFramework}	
                    />
                  </div>
                </div>
              </div>
            </div>
          </Collapse>
        )
      default:
        return "unknown step"
    }
  }


  const extraHeight = isCloud ? -7 : 0;
  return (
    <div style={{}}>
      <div>
        {activeStep === steps.length ? (
          <div paddingTop="20px">
            You Will be Redirected to getting Start Page Wait for 5-sec.
            <Button onClick={handleReset}>Reset</Button>
            <script>
              setTimeout(function() {navigate("/workflows")}, 5000);
            </script>
            <Button>
              <Link
                style={{ color: "#f86a3e" }}
                to="/workflows"
                className="btn btn-primary"
              >
                Getting Started
              </Link>
            </Button>
          </div>
        ) : (
          <div>
            {getStepContent(activeStep)}
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeForm;
