import React, { memo, useEffect, useState, useContext } from "react";

import { makeStyles } from "@mui/styles";
import { toast } from "react-toastify";
import { getTheme } from "../theme.jsx";
import { Context } from "../context/ContextApi.jsx";
import countries from "./Countries.jsx";

import {
  FormControl,
  InputLabel,
  Paper,
  OutlinedInput,
  Checkbox,
  Card,
  Tooltip,
  FormControlLabel,
  Chip,
  Link,
  Typography,
  Switch,
  Select,
  MenuItem,
  Divider,
  ListItemText,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  Autocomplete,
  Skeleton,
  Box,
} from "@mui/material";
const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const PartnerDetails = (props) => {
  const {
    userdata,
    selectedOrganization,
    setSelectedOrganization,
    globalUrl,
    isCloud,
    adminTab,
    isEditOrgTab,
    partnerData,
    loadingPartnerData,
    setPartnerData,
  } = props;

  const classes = useStyles();
  const defaultBranch = "main";
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 400,
        borderRadius: 10,
        overflowY: "scroll",
      },
    },
    getContentAnchorEl: () => null,
  };

  const expertiseOptions = [
    "Cybersecurity",
    "Cloud Security",
    "Managed Detection and Response (MDR)",
    "Incident Response",
    "Penetration Testing",
    "Compliance and Governance",
    "Network Security",
    "Endpoint Security",
    "Identity and Access Management (IAM)",
    "SIEM",
  ];
  const servicesOptions = [
    "Cybersecurity Consulting",
    "Managed Security",
    "Incident Response",
    "Penetration Testing",
    "Cloud Security",
    "Managed Detection",
    "Endpoint Security",
    "Network Security",
    "Identity Management",
    "Compliance",
    "Security Training",
    "Security Management",
    "Threat Intelligence",
    "Web Security",
    "Database Security",
    "Disaster Recovery",
    "IT Security Audit",
    "Cybersecurity Training",
    "Security Automation",
    "AI Security",
    "IoT Security",
    "Cloud Security Broker",
    "Security Service",
    "Managed Security Provider",
    "Cybersecurity Service",
  ]

  const solutionsOptions = [
    "EDR",
    "MDR",
    "XDR",
    "Case Management",
    "SIEM",
    "Vulnerability Management",
    "IPS",
    "IDS",
    "Threat Intelligence",
    "IAM",
    "Data Security",
    "Incident Response",
    "Cloud Security",
    "Network Security",
  ]
  
  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);
  const [isDisabled, setIsDisabled] = useState(isCloud ? userdata?.active_org?.is_partner ? false : true : true);
  const handleExpertiseChange = (event) => {
    const { value } = event.target;
    setPartnerData({
      ...partnerData,
      expertise: value,
    });
  };

  useEffect(() => {
    setIsDisabled(isCloud ? userdata?.active_org?.is_partner ? false : true : true);
    if(userdata?.support) {
      setIsDisabled(false);
    }
  }, [userdata, isCloud]);

  const handleServicesChange = (event) => {
    const { value } = event.target;
    setPartnerData({
      ...partnerData,
      services: Array.isArray(value) ? value : [],
    });
  };

  const handleSolutionsChange = (event) => {
    const { value } = event.target;
    setPartnerData({
      ...partnerData,
      solutions: Array.isArray(value) ? value : [],
    });
  };

  const setSelectedRegion = (region) => {
    // send a POST request to /api/v1/orgs/{org_id}/region with the region as the body
    const regionMap = {
      US: "us-west2",
      EU: "europe-west2",
      CA: "northamerica-northeast1",
      UK: "europe-west2",
      "EU-2": "europe-west3",
      AUS: "australia-southeast1",
    };

    region = regionMap[region] || region;

    var data = {
      dst_region: region,
    };

    toast.info(
      "Changing region to " + region + "...This may take a few minutes."
    );

    fetch(`${globalUrl}/api/v1/orgs/${selectedOrganization.id}/change/region`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
      timeOut: 1000,
    }).then((response) => {
      if (response.status !== 200) {
        response
          .json()
          .then((reason) => {
            toast.error("Failed to change region: " + reason.reason);
          })
          .catch((err) => {
            toast.error("Failed to change region");
          });
      } else {
        toast("Region changed successfully! Reloading in 5 seconds..");
        // Reload the page in 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }

      // return responseJson
    });
  };

  if (loadingPartnerData) {
    return (
      <div style={{ textAlign: "left", maxWidth: "95%" }}>
        <Grid container spacing={3} style={{ textAlign: "left", marginTop: 5 }}>
          <Grid item xs={12}>
            <span>
              <div>
                <div style={{ flex: "3", color: "white" }}>
                  <div style={{ marginTop: 8, display: "flex" }} />
                  <div style={{ display: "flex" }}>
                    <div style={{ width: "100%", maxWidth: 434, marginRight: 10 }}>
                      <Typography variant="text" style={{ color: theme?.palette?.text?.primary }}>
                        Name
                      </Typography>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width="100%" 
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div>
                    {/* <div style={{ alignItems: "center" }}>
                      <div style={{ marginRight: "12px", color: theme?.palette?.text?.primary }}>
                        Expertise
                      </div>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width={220}
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div>
                    <div style={{ alignItems: "center", marginLeft: 12 }}>
                      <div style={{ marginRight: "12px", color: theme?.palette?.text?.primary }}>
                        Services
                      </div>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width={220}
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div> */}
                    <div style={{ alignItems: "center" }}>
                      <div style={{ marginRight: "12px", color: theme?.palette?.text?.primary }}>
                        Solutions
                      </div>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width={220}
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div>
                    <div style={{ marginLeft: 13, fontSize: 16, color: "#9E9E9E" }}>
                        <Typography variant="text" style={{ color: theme?.palette?.text?.primary }}>
                          Region
                        </Typography>
                        <Skeleton 
                          variant="rounded" 
                          height={35} 
                          width={190}
                          style={{ 
                            marginTop: 5,
                            borderRadius: 4 
                          }}
                          animation="wave"
                        />
                    </div>
                    <div style={{ alignItems: "center", marginLeft: 12 }}>
                      <div style={{ marginRight: "12px", color: theme?.palette?.text?.primary }}>
                        Country
                      </div>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width={220}
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <Typography variant="text" style={{ color: theme?.palette?.text?.primary }}>
                      Description
                    </Typography>
                    <Skeleton 
                      variant="rounded" 
                      height={89} 
                      width="100%"
                      style={{ 
                        marginTop: 5,
                        borderRadius: 4 
                      }}
                      animation="wave"
                    />
                  </div>
                  <div>
                    <div style={{ width: "100%", maxWidth: 500, marginRight: 10, marginTop: 10 }}>
                      <Typography variant="text" style={{ color: theme?.palette?.text?.primary }}>
                        Website URL
                      </Typography>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width="100%"
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div>
                    <div style={{ width: "100%", maxWidth: 500, marginRight: 10, marginTop: 20 }}>
                      <Typography variant="text" style={{ color: theme?.palette?.text?.primary }}>
                        Article URL
                      </Typography>
                      <Skeleton 
                        variant="rounded" 
                        height={35} 
                        width="100%"
                        style={{ 
                          marginTop: 5,
                          borderRadius: 4 
                        }}
                        animation="wave"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </span>
          </Grid>
        </Grid>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "left", maxWidth: "95%" }}>
      <Grid container spacing={3} style={{ textAlign: "left", marginTop: 5 }}>
        <Grid item xs={12} style={{}}>
          <span>
            <div style={{}}>
              <div style={{ flex: "3", color: "white" }}>
                <div style={{ marginTop: 8, display: "flex" }} />
                <div style={{ display: "flex" }}>
                  <div
                    style={{ width: "100%", maxWidth: 434, marginRight: 10 }}
                  >
                    <Typography
                      variant="text"
                      style={{ color: theme.palette.text.primary }}
                    >
                      Name
                    </Typography>
                    <TextField
                      required
                      disabled={isDisabled}
                      style={{
                        flex: "1",
                        display: "flex",
                        height: 35,
                        width: "100%",
                        maxWidth: 434,
                        marginTop: "5px",
                        marginRight: "15px",
                        color: theme.palette.textFieldStyle.color,
                        backgroundColor: isEditOrgTab
                          ? theme.palette.textFieldStyle.backgroundColor
                          : theme.palette.inputColor,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                      fullWidth={true}
                      placeholder="Name"
                      type="name"
                      id="standard-required"
                      margin="normal"
                      variant="outlined"
                      value={partnerData?.name}
                      onBlur={() => {}}
                      onChange={(e) => {
                        if (e.target.value.length > 100) {
                          toast("Choose a shorter name.");
                          return;
                        }

                        setPartnerData({
                          ...partnerData,
                          name: e.target.value,
                        });
                      }}
                      color="primary"
                      InputProps={{
                        style: {
                          color: theme.palette.textFieldStyle.color,
                          height: "35px",
                          fontSize: "1em",
                          borderRadius: 4,
                          backgroundColor:
                            theme.palette.textFieldStyle.backgroundColor,
                        },
                        classes: {
                          notchedOutline: isEditOrgTab
                            ? null
                            : classes.notchedOutline,
                        },
                      }}
                    />
                  </div>
                    {/* <div style={{ alignItems: "center" }}>
                      <div
                        style={{
                          marginRight: "12px",
                          color: theme.palette.text.primary,
                        }}
                      >
                        Expertise
                      </div>
                      <FormControl style={{ width: 220, height: 35 }}>
                        <Select
                          style={{
                            minWidth: 220,
                            marginTop: 5,
                            maxWidth: 220,
                            height: 35,
                            borderRadius: 4,
                            color: theme.palette.textFieldStyle.color,
                            cursor: isDisabled ? "not-allowed" : "pointer",
                          }}
                          disabled={isDisabled}
                          id="multiselect-status"
                          multiple
                          value={partnerData?.expertise}
                          onChange={(event) => {
                            handleExpertiseChange(event);
                          }}
                          input={<OutlinedInput />}
                          renderValue={(selected) => selected.join(", ")}
                          MenuProps={MenuProps}
                        >
                          {expertiseOptions?.map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox
                                checked={partnerData?.expertise?.indexOf(name) > -1}
                              />
                              <ListItemText primary={name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div style={{ alignItems: "center", marginLeft: 12 }}>
                      <div
                        style={{
                          marginRight: "12px",
                          color: theme.palette.text.primary,
                        }}
                      >
                        Services
                      </div>
                      <FormControl style={{ width: 220, height: 35 }}>
                        <Select
                          style={{
                            minWidth: 220,
                            marginTop: 5,
                            maxWidth: 220,
                            height: 35,
                            borderRadius: 4,
                            color: theme.palette.textFieldStyle.color,
                            cursor: isDisabled ? "not-allowed" : "pointer",
                          }}
                          disabled={isDisabled}
                          id="multiselect-status"
                          multiple
                          value={partnerData?.services || []}
                          onChange={(event) => {
                            handleServicesChange(event);
                          }}
                          input={<OutlinedInput />}
                          renderValue={(selected) => selected.join(", ")}
                          MenuProps={MenuProps}
                        >
                          {servicesOptions?.map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox
                                checked={(partnerData?.services || []).indexOf(name) > -1}
                              />
                              <ListItemText primary={name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div> */}
                    <div style={{ alignItems: "center" }}>
                      <div
                        style={{
                          marginRight: "12px",
                          color: theme.palette.text.primary,
                        }}
                      >
                        Solutions
                      </div>
                      <FormControl style={{ width: 190, height: 35 }}>
                        <Select
                          style={{
                            minWidth: 190,
                            marginTop: 5,
                            maxWidth: 190,
                            height: 35,
                            borderRadius: 4,
                            color: theme.palette.textFieldStyle.color,
                            cursor: isDisabled ? "not-allowed" : "pointer",
                          }}
                          disabled={isDisabled}
                          id="multiselect-status"
                          multiple
                          value={partnerData?.solutions || []}
                          onChange={(event) => {
                            handleSolutionsChange(event);
                          }}
                          input={<OutlinedInput />}
                          renderValue={(selected) => selected.join(", ")}
                          MenuProps={MenuProps}
                        >
                          {solutionsOptions?.map((name) => (
                            <MenuItem key={name} value={name}>
                              <Checkbox
                                checked={(partnerData?.solutions || []).indexOf(name) > -1}
                              />
                              <ListItemText primary={name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div
                      style={{ marginLeft: 13, fontSize: 16, color: "#9E9E9E" }}
                    >
                      <Typography
                        variant="text"
                        style={{ color: theme.palette.text.primary }}
                      >
                        Region
                      </Typography>
                      <RegionChangeModal
                        isDisabled={isDisabled}
                        selectedOrganization={selectedOrganization}
                        setSelectedRegion={setSelectedRegion}
						            partnerData={partnerData}
						            setPartnerData={setPartnerData}
                        userdata={userdata}
                      />
                    </div>
                    <div style={{ alignItems: "flex-start", marginLeft: 13, display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="text"
                        style={{ color: theme.palette.text.primary }}
                      >
                        Country
                      </Typography>
                      <FormControl style={{ width: 210, height: 35 }}>
                        <Autocomplete
                          id="country-select"
                          value={countries.find(country => country.label === partnerData?.country)}
                          style={{
                            minWidth: 210,
                            marginTop: 5,
                            maxWidth: 210,
                            height: 35,
                            borderRadius: 4,
                            color: theme.palette.textFieldStyle.color,
                            cursor: isDisabled ? "not-allowed" : "pointer",
                          }}
                          disabled={isDisabled}
                          options={countries}
                          autoHighlight
                          onClear={() => {
                            setPartnerData({
                              ...partnerData,
                              country: "",
                            });
                          }}
                          getOptionLabel={(option) => option?.label || ""}
                          onChange={(event, newValue) => {
                            setPartnerData({
                              ...partnerData,
                              country: newValue?.label,
                            });
                          }}
                          renderOption={(props, option) => (
                            <Box
                              component="li"
                              sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                              {...props}
                            >
                              <img
                                loading="lazy"
                                width="20"
                                src={`https://flagcdn.com/48x36/${option.code.toLowerCase()}.png`}
                                alt=""
                              />
                              {option.label}
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select country"
                              variant="outlined"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: partnerData?.country ? (
                                  <img
                                    loading="lazy"
                                    width="20"
                                    src={`https://flagcdn.com/48x36/${countries.find(country => country.label === partnerData.country)?.code.toLowerCase()}.png`}
                                    alt=""
                                    style={{ marginRight: 8 }}
                                  />
                                ) : null,
                                style: {
                                  color: theme.palette.textFieldStyle.color,
                                  height: "35px",
                                  fontSize: "1em",
                                  borderRadius: 4,
                                  backgroundColor: theme.palette.textFieldStyle.backgroundColor,
                                },
                                classes: {
                                  notchedOutline: isEditOrgTab ? null : classes.notchedOutline,
                                },
                              }}
                            />
                          )}
                        />
                      </FormControl>
                    </div>
                </div>
                <div style={{ marginTop: "10px", }} />
                <Typography
                  variant="text"
                  style={{ color: theme.palette.text.primary }}
                >
                  Description
                </Typography>
                <div style={{ display: "flex" }}>
                  <TextField
                    required
                    disabled={isDisabled}
                    multiline
                    rows={3}
                    style={{
                      flex: "1",
                      marginTop: "5px",
                      color: theme.palette.textFieldStyle.color,
                      backgroundColor: isEditOrgTab
                        ? theme.palette.textFieldStyle.backgroundColor
                        : theme.palette.inputColor,
                      height: 89,
                      borderRadius: 4,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                    fullWidth={true}
                    type="name"
                    id="outlined-with-placeholder"
                    margin="normal"
                    variant="outlined"
                    placeholder="A description for the organization"
                    value={partnerData?.description}
                    onBlur={(e) => {
                      setPartnerData({
                        ...partnerData,
                        description: e.target.value,
                      });
                    }}
                    onChange={(e) => {
                      setPartnerData({
                        ...partnerData,
                        description: e.target.value,
                      });
                    }}
                    InputProps={{
                      classes: {
                        notchedOutline: isEditOrgTab
                          ? null
                          : classes.notchedOutline,
                      },
                      style: {
                        color: theme.palette.textFieldStyle.color,
                        height: 89,
                        borderRadius: 4,
                      },
                    }}
                  />
                </div>
                <div>
                <div
                    style={{ width: "100%", maxWidth: 500, marginRight: 10, marginTop: 10 }}
                  >
                    <Typography
                      variant="text"
                      style={{ color: theme.palette.text.primary }}
                    >
                      Website URL
                    </Typography>
                    <TextField
                      required
                      disabled={isDisabled}
                      style={{
                        flex: "1",
                        display: "flex",
                        height: 35,
                        width: "100%",
                        maxWidth: 500,
                        marginTop: "5px",
                        marginRight: "15px",
                        color: theme.palette.textFieldStyle.color,
                        backgroundColor: isEditOrgTab
                          ? theme.palette.textFieldStyle.backgroundColor
                          : theme.palette.inputColor,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                      fullWidth={true}
                      placeholder="https://www.example.com"
                      type="name"
                      id="standard-required"
                      margin="normal"
                      variant="outlined"
                      value={partnerData?.website_url}
                      onBlur={() => {}}
                      onChange={(e) => {
                        if (e.target.value.length > 100) {
                          toast("Choose a shorter website URL.");
                          return;
                        }

                        setPartnerData({
                          ...partnerData,
                          website_url: e.target.value,
                        });
                      }}
                      color="primary"
                      InputProps={{
                        style: {
                          color: theme.palette.textFieldStyle.color,
                          height: "35px",
                          fontSize: "1em",
                          borderRadius: 4,
                          backgroundColor:
                            theme.palette.textFieldStyle.backgroundColor,
                        },
                        classes: {
                          notchedOutline: isEditOrgTab
                            ? null
                            : classes.notchedOutline,
                        },
                      }}
                    />
                </div>
                <div
                    style={{ width: "100%", maxWidth: 500, marginRight: 10, marginTop: 20 }}
                  >
                    <Typography
                      variant="text"
                      style={{ color: theme.palette.text.primary }}
                    >
                      Article URL
                    </Typography>
                    <TextField
                      required
                      disabled={isDisabled}
                      style={{
                        flex: "1",
                        display: "flex",
                        height: 35,
                        width: "100%",
                        maxWidth: 500,
                        marginTop: "5px",
                        marginRight: "15px",
                        color: theme.palette.textFieldStyle.color,
                        backgroundColor: isEditOrgTab
                          ? theme.palette.textFieldStyle.backgroundColor
                          : theme.palette.inputColor,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                      fullWidth={true}
                      placeholder="https://www.example.com"
                      type="name"
                      id="standard-required"
                      margin="normal"
                      variant="outlined"
                      value={partnerData?.article_url}
                      onBlur={() => {}}
                      onChange={(e) => {
                        if (e.target.value.length > 100) {
                          toast("Choose a shorter article URL.");
                          return;
                        }

                        setPartnerData({
                          ...partnerData,
                          article_url: e.target.value,
                        });
                      }}
                      color="primary"
                      InputProps={{
                        style: {
                          color: theme.palette.textFieldStyle.color,
                          height: "35px",
                          fontSize: "1em",
                          borderRadius: 4,
                          backgroundColor:
                            theme.palette.textFieldStyle.backgroundColor,
                        },
                        classes: {
                          notchedOutline: isEditOrgTab
                            ? null
                            : classes.notchedOutline,
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </span>
        </Grid>
      </Grid>
    </div>
  );
};

export default PartnerDetails;

const RegionChangeModal = memo(
  ({
    isDisabled,
    selectedOrganization,
    setSelectedRegion,
    userdata,
    partnerData,
    setPartnerData,
  }) => {
    // Show from options: "us-west2", "europe-west2", "europe-west3", "northamerica-northeast1"
    // var regions = ["us-west2", "europe-west2", "europe-west3", "northamerica-northeast1"]

    const regionMapping = {
      "Africa": "af",
      "Asia Pacific (APAC)": "",
      "Europe": "eu",
      "Latin America": "la",
      "Middle East": "me",
      "North America": "na",
      "Global": ""
    };

    //let regiontag = "UK";
    let regiontag = partnerData?.region || "UK";
    let regionCode = "gb";

    const regionsplit = selectedOrganization?.region_url?.split(".");

    if (regionsplit?.length > 2 && !regionsplit[0]?.includes("shuffler")) {
      const namesplit = regionsplit[0]?.split("/");
      regiontag = namesplit[namesplit.length - 1];

      if (regiontag === "california") {
        regiontag = "US";
        regionCode = "us";
      } else if (regiontag === "frankfurt") {
        regiontag = "EU-2";
        regionCode = "eu";
      } else if (regiontag === "ca") {
        regiontag = "CA";
        regionCode = "ca";
      } else if (regiontag === "austrailia") {
        regiontag = "AUS";
        regionCode = "au";
      }
    }

    return (
      <FormControl
        disabled={isDisabled}
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 5,
          alignItems: "center",
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {/* <InputLabel id="demo-simple-select-label">Region</InputLabel> */}
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={partnerData?.region || "Europe"}
          style={{ minWidth: 190, height: 35, borderRadius: 4 }}
          onChange={(e) => {
            // if (userdata?.support) {
            // 	setSelectedRegion(e.target.value)
            // } else {
            // 	handleSendChangeRegionMail(e.target.value)
            // }
            setPartnerData({
              ...partnerData,
              region: e.target.value,
            })

            // setSelectedRegion(e.target.value)
          }}
        >
          {Object.keys(regionMapping).map((region, index) => {
            const regionImageCode = regionMapping[region];
            // Set the default region if selectedOrganization.region is not set
            if (selectedOrganization.region === undefined) {
              selectedOrganization.region = "europe-west2";
            }

            if (region === "AUS") {
              region = "AUS (test)";
            }

            // Check if the current region matches the selected region
            if (region === selectedOrganization.region) {
              // If the region matches, set the MenuItem as selected
              return (
                <MenuItem value={region} key={index} disabled>
                  {/* show region image through cdn */}
                  {/* <img
                    src={`https://flagcdn.com/48x36/${regionImageCode}.png`}
                    alt={region}
                    style={{ marginRight: 10 }}
                  /> */}
                  {region}
                </MenuItem>
              );
            } else {
              return (
                <MenuItem sx={{ display: "flex" }} key={index} value={region}>
                  {/* <img
                    src={`https://flagcdn.com/48x36/${regionImageCode}.png`}
                    alt={region}
                    style={{ marginRight: 10, width: 20, height: 18 }}
                  /> */}
                  {region}
                </MenuItem>
              );
            }
          })}
        </Select>
      </FormControl>
    );
  }
);
