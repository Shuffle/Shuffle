import React from 'react';
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
import ForkRightIcon from '@mui/icons-material/ForkRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CloudDownloadOutlined } from '@mui/icons-material';

const AppModal = ({ open, onClose, data, userdata }) => {

  console.log("App data: ", data)
  console.log("userdata: ", userdata)

  const isCloud =
    window.location.host === "localhost:3002" ||
      window.location.host === "shuffler.io" || window.location.host === "localhost:3000"
      ? true
      : false;

  var newAppname = data?.name;
  if (newAppname === undefined) {
    newAppname = "Undefined";
  } else {
    newAppname = newAppname.charAt(0).toUpperCase() + newAppname.substring(1);
    newAppname = newAppname.replaceAll("_", " ");
  }

  var canEditApp = userdata.admin === "true" || userdata.id === data?.owner || data?.owner === "" || (userdata.admin === "true" && userdata.active_org.id === data?.reference_org) || !data?.generated


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
          backgroundColor: "var(--Container, #212121)",
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
          About Gmail
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
              alt={data?.name}
              src={data?.large_image}
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
                      href={"https://shuffler.io/apps/" + data?.id}
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
                {data?.categories ? data.categories.join(", ") : "Communication"}
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
              {data?.actions?.length}
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
              <CheckCircleIcon sx={{ color: '#4CAF50' }} />
              <Typography variant="body1" sx={{
                fontWeight: 500,
                color: '#fff',
                marginTop: "1px"
              }}>
                Google Collection
              </Typography>
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
            Connect Gmail to Jira
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
              <Avatar
                src={data?.large_image}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  zIndex: 10
                }}
              />
              <Avatar
                src={data?.large_image}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider'
                }}
              />
            </Stack>
            <Typography sx={{ ml: 2, fontSize: "12px" }}>
              Email management
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