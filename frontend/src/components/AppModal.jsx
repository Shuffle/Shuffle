import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Stack,
  Avatar,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import Search from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CloudDownloadOutlined } from '@mui/icons-material';
import { findSpecificApp } from './AppFramework';

const AppModal = ({ open, onClose, app, userdata, globalUrl }) => {

  const [frameworkData, setFrameworkData] = useState({})
  const [usecases, setUsecases] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [prevSubcase, setPrevSubcase] = useState({})
  const [inputUsecase, setInputUsecase] = useState({})
  const [latestUsecase, setLatestUsecase] = useState([])
  const [foundAppUsecase, setFoundAppUsecase] = useState({})

  const parseUsecase = (subcase) => {
    const srcdata = findSpecificApp(frameworkData, subcase.type)
    const dstdata = findSpecificApp(frameworkData, subcase.last)

    if (srcdata !== undefined && srcdata !== null) {
      subcase.srcimg = srcdata.large_image
      subcase.srcapp = srcdata.name
    }

    if (dstdata !== undefined && dstdata !== null) {
      subcase.dstimg = dstdata.large_image
      subcase.dstapp = dstdata.name
    }
    return subcase
  }


  const getFramework = () => {
    fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for framework!");
        }

        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.success === false) {
          const preparedData = {
            "siem": findSpecificApp({}, "SIEM"),
            "communication": findSpecificApp({}, "COMMUNICATION"),
            "assets": findSpecificApp({}, "ASSETS"),
            "cases": findSpecificApp({}, "CASES"),
            "network": findSpecificApp({}, "NETWORK"),
            "intel": findSpecificApp({}, "INTEL"),
            "edr": findSpecificApp({}, "EDR"),
            "iam": findSpecificApp({}, "IAM"),
            "email": findSpecificApp({}, "EMAIL"),
          }

          setFrameworkData(preparedData)
        } else {
          setFrameworkData(responseJson)
        }
      })
      .catch((error) => {
        console.log("Error getting framework: ", error)
      })
  }

  const fetchUsecases = (workflows) => {
    fetch(globalUrl + "/api/v1/workflows/usecases", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for usecases");
        }

        return response.json();
      })
      .then((responseJson) => {


        const newUsecases = [...usecases]
        newUsecases.forEach((category, index) => {
          category.list.forEach((subcase, subindex) => {
            getUsecase(subcase, index, subindex)
          })
        })

        setLatestUsecase(newUsecases)
        // Matching workflows with usecases
        if (responseJson.success !== false) {
          if (workflows !== undefined && workflows !== null && workflows.length > 0) {
            var categorydata = responseJson

            var newcategories = []
            for (var key in categorydata) {
              var category = categorydata[key]
              category.matches = []

              for (var subcategorykey in category.list) {
                var subcategory = category.list[subcategorykey]
                subcategory.matches = []

                for (var workflowkey in workflows) {
                  const workflow = workflows[workflowkey]

                  if (workflow.usecase_ids !== undefined && workflow.usecase_ids !== null) {
                    for (var usecasekey in workflow.usecase_ids) {
                      if (workflow.usecase_ids[usecasekey].toLowerCase() === subcategory?.name?.toLowerCase()) {

                        category.matches.push({
                          "workflow": workflow.id,
                          "category": subcategory?.name,
                        })

                        subcategory.matches.push(workflow)
                        break
                      }
                    }
                  }

                  if (subcategory.matches.length > 0) {
                    break
                  }
                }
              }

              newcategories.push(category)
            }

            if (newcategories !== undefined && newcategories !== null && newcategories.length > 0) {
              setUsecases(newcategories)
            } else {
              setUsecases(responseJson)
            }
          } else {
            setUsecases(responseJson)
          }
        }
      })
      .catch((error) => {
        //toast("ERROR: " + error.toString());
        console.log("ERROR: " + error.toString());
      });
  };

  const getAvailableWorkflows = () => {
    fetch(globalUrl + "/api/v1/workflows", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          fetchUsecases()
          console.log("Status not 200 for workflows :O!: ", response.status);
          return;
        }

        return response.json();
      })
      .then((responseJson) => {
        fetchUsecases(responseJson)

        if (responseJson !== undefined) {
          setWorkflows(responseJson);
        }
      })
      .catch((error) => {
        fetchUsecases()
        //toast(error.toString());
      });
  }

  const getUsecase = (subcase, index, subindex) => {
    subcase = parseUsecase(subcase)
    setPrevSubcase(subcase)

    fetch(`${globalUrl}/api/v1/workflows/usecases/${escape(subcase?.name?.replaceAll(" ", "_"))}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for framework!");
        }

        return response.json();
      })
      .then((responseJson) => {
        var parsedUsecase = responseJson

        if (responseJson.success === false) {
          parsedUsecase = subcase
        } else {
          parsedUsecase = responseJson

          parsedUsecase.srcimg = subcase.srcimg
          parsedUsecase.srcapp = subcase.srcapp
          parsedUsecase.dstimg = subcase.dstimg
          parsedUsecase.dstapp = subcase.dstapp
        }
        // Look for the type of app and fill in img1, srcapp...
        setInputUsecase(parsedUsecase)
      })
      .catch((error) => {
        //toast(error.toString());
        setInputUsecase(subcase)
        console.log("Error getting usecase: ", error)
      })
  }



  useEffect(() => {
    getAvailableWorkflows()
    getFramework()
  }, [app])


  useEffect(() => {
    const foundCategory = latestUsecase?.find((category) =>
      category?.list?.some((subcase) => subcase?.srcapp === app?.name || subcase?.dstapp === app?.name)
    );

    const foundSubcase = foundCategory?.list?.find(
      (subcase) => subcase?.srcapp === app?.name || subcase?.dstapp === app?.name
    );

    setFoundAppUsecase(foundSubcase);
  }, [latestUsecase])

  const isCloud =
    window.location.host === "localhost:3002" ||
      window.location.host === "shuffler.io" || window.location.host === "localhost:3000"
      ? true
      : false;

  var newAppname = app?.name;
  if (newAppname === undefined) {
    newAppname = "Undefined";
  } else {
    newAppname = newAppname.charAt(0).toUpperCase() + newAppname.substring(1);
    newAppname = newAppname?.replaceAll("_", " ");
  }

  var canEditApp = userdata.admin === "true" || userdata.id === app?.owner || app?.owner === "" || (userdata.admin === "true" && userdata.active_org.id === app?.reference_org) || !app?.generated


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: "1px solid var(--Container-Stroke, #494949)",
          minWidth: '440px',
          fontFamily: "Inter"
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          pt: 2,
          px: 3
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 500 }}>
          About {app?.name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'space-between', justifyContent: 'space-between', pt: 2 }}>

          <div style={{ display: "flex", flexDirection: "row", gap: 10, fontFamily: "Inter" }}>
            <img
              alt={app?.name}
              src={app?.large_image || app?.image_url}
              style={{
                borderRadius: 4,
                maxWidth: 100,
                minWidth: 100,
                maxHeight: "100%",
                display: "block",
                margin: "0 auto",
                boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.2)"
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{
                display: "flex",
                flexDirection: "row",
              }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {newAppname}
                </Typography>
                {
                  isCloud && (
                    <a
                      rel="noopener noreferrer"
                      href={"https://shuffler.io/apps/" + app?.id}
                      style={{ textDecoration: "none", color: "#f85a3e", marginTop: "-2px" }}
                      target="_blank"
                    >
                      <IconButton
                        style={{
                          color: "#f85a3e",
                          fontSize: 20,
                        }}
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </a>
                  )
                }
              </div>
              <Typography
                variant="body2"
                color="textSecondary"
              >
                {app?.categories ? app.categories.join(", ") : "Communication"}
              </Typography>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#ff7043',
                '&:hover': { bgcolor: '#f4511e' },
                textTransform: 'none',
                borderRadius: 1,
                py: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CloudDownloadOutlined />
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#ff7043',
                '&:hover': { bgcolor: '#f4511e' },
                textTransform: 'none',
                borderRadius: 1,
                py: 1,
                display: 'flex',
                alignItems: 'center'
              }}
              startIcon={
                canEditApp ? <EditIcon /> : <ForkRightIcon />
              }
            >
              {canEditApp ? "Edit" : "Fork"}
            </Button>
          </div>
        </Box>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "Inter",
          padding: "26px 0px"
        }}>
          <div style={{
            textAlign: "start",
            flex: 1,
          }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              mb: 0.3,
              color: '#fff'
            }}>
              20
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Public Workflow
            </Typography>
          </div>
          <div style={{
            flex: 1,
            textAlign: "start",
            borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
            paddingLeft: "10px",
            height: "100%",
          }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              mb: 0.3,
              color: '#fff'
            }}>
              {Array.isArray(app?.actions) ? app.actions.length : app?.actions}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Actions
            </Typography>
          </div>
          <div style={{
            borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
            flex: 1,
            paddingLeft: "10px",
            paddingTop: "5px"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: "5px" }}>
              {
                app?.collection ? (
                  <>
                    <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                    <Typography variant="body1" sx={{
                      fontWeight: 500,
                      color: '#fff',
                      marginTop: "1px"
                    }}>
                      app.collection

                    </Typography>
                  </>
                ) : "No collection yet"
              }

            </div>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', marginLeft: "1px" }}>
              Part of a collection
            </Typography>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          width: "100%"
        }}>
          <div style={{
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: 500,
            color: "#fff",
            marginBottom: "5px"
          }}>
            {
              (foundAppUsecase?.srcapp !== undefined && foundAppUsecase?.dstapp !== undefined) ? (
                "Connect " + foundAppUsecase?.srcapp?.replaceAll("_", " ") + " to " + foundAppUsecase?.dstapp?.replaceAll("_", " ")
              ) : (
                "Connect " + app?.name + " to any tool"
              )
            }
          </div>

          <Box sx={{
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            mb: 3
          }}>
            <Stack direction="row" spacing={-1}>
              {
                foundAppUsecase === undefined ? (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <Search sx={{ color: 'text.primary', zIndex: 10, fontSize: 18}} />
                  </Avatar>
                ) : (
                  <Avatar
                    src={foundAppUsecase?.srcimg}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      zIndex: 10
                    }}
                  />
                )
              }
             {
                foundAppUsecase === undefined ? (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                    <AddIcon sx={{ color: 'text.primary', zIndex: 10, fontSize: 18}} />
                  </Avatar>
                ) : (
                  <Avatar
                    src={foundAppUsecase?.dstimg}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      zIndex: 10
                    }}
                  />
                )
              }
            </Stack>
            <Typography sx={{ ml: 2, fontSize: "14px", letterSpacing: "0.5px" }}>
              {foundAppUsecase?.name || "Search for a Usecase"}
            </Typography>
          </Box>
        </div>

        <div style={{ display: "flex", justifyContent: "center", fontFamily: "Inter" }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#ff7043',
              '&:hover': {
                bgcolor: '#f4511e'
              },
              textTransform: 'none',
              borderRadius: 1,
              py: 1,
              px: 5,
              fontSize: "16px",
              tracking: "0.5px",
              color: "black"
            }}
          >
            Create a Usecase
          </Button>
        </div>
      </DialogContent>
    </Dialog >
  );
};

export default AppModal;