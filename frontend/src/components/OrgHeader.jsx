import React, { useEffect } from "react";
import theme from "../theme.jsx";
import { makeStyles } from "@mui/styles";
import { toast } from 'react-toastify';

import {
	Tooltip,
	Grid,
	Button,
	TextField,
	Typography,
	IconButton,
} from "@mui/material";

import {
	ExpandLess as ExpandLessIcon,
	ExpandMore as ExpandMoreIcon,
	Save as SaveIcon,
} from "@mui/icons-material";

const useStyles = makeStyles({
  notchedOutline: {
    borderColor: "#f85a3e !important",
  },
});

const defaultImage = theme.palette.defaultImage
const OrgHeader = (props) => {
  const {
    userdata,
    selectedOrganization,
    setSelectedOrganization,
    globalUrl,
    isCloud,
		adminTab,
  	handleEditOrg, 
  } = props;

  const classes = useStyles();

  var upload = "";
  const defaultBranch = "master";
  const [orgName, setOrgName] = React.useState(selectedOrganization.name);
  const [orgDescription, setOrgDescription] = React.useState(
    selectedOrganization.description
  );


  const [file, setFile] = React.useState("");
  const [fileBase64, setFileBase64] = React.useState(
    selectedOrganization.image
  );
  const [expanded, setExpanded] = React.useState(false);

  if (file !== "") {
    const img = document.getElementById("logo");
    var canvas = document.createElement("canvas");
    canvas.width = 174;
    canvas.height = 174;
    var ctx = canvas.getContext("2d");

    img.onload = function () {
      // img, x, y, width, height
      //ctx.drawImage(img, 174, 174)
      //console.log("IMG natural: ", img.naturalWidth, img.naturalHeight)
      //ctx.drawImage(img, 0, 0, 174, 174)
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const canvasUrl = canvas.toDataURL();
      if (canvasUrl !== fileBase64) {
        setFileBase64(canvasUrl);
        selectedOrganization.image = canvasUrl;
        setSelectedOrganization(selectedOrganization);
      }
    };
  }


  var image = "";
  const editHeaderImage = (event) => {
    const file = event.target.value;
    const actualFile = event.target.files[0];
    const fileObject = URL.createObjectURL(actualFile);
    setFile(fileObject);
  };

  //console.log("USER: ", userdata)
  const orgSaveButton = (
    <Tooltip title="Save any unsaved data" placement="bottom">
      <Button
        style={{ width: 150, height: 55, flex: 1 }}
        variant="outlined"
        color="primary"
        disabled={
          userdata === undefined || userdata === null || userdata.admin !== "true"
        }
        onClick={() =>
          handleEditOrg(
            orgName,
            orgDescription,
            selectedOrganization.id,
            selectedOrganization.image,
            {},
            {},
						[],
          )
        }
      >
        <SaveIcon />
      </Button>
    </Tooltip>
  );

  var imageData = file.length > 0 ? file : fileBase64;
  imageData = imageData === undefined || imageData.length === 0 ? defaultImage : imageData
      

  const imageInfo = (
    <img
      src={imageData}
      alt="Click to upload an image (174x174)"
      id="logo"
      style={{
        maxWidth: 174,
        maxHeight: 174,
        minWidth: 174,
        minHeight: 174,
        objectFit: "contain",
	    borderRadius: theme.shape.borderRadius,
      }}
    />
  );

  return (
    <div>
      <div
        style={{
          color: "white",
          flex: "1",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Tooltip
          title="Click to edit the organizations's image (174x174)"
          placement="bottom"
        >
          <div
            style={{
              flex: "1",
              margin: "10px 25px 10px 0px",
              border:
                imageData !== undefined && imageData.length > 0
                  ? null
                  : "1px solid #f85a3e",
              cursor: "pointer",
              maxWidth: 174,
              maxHeight: 174,
			  borderRadius: theme.shape.borderRadius,
            }}
            onClick={() => {
              upload.click();
            }}
          >
            <input
              hidden
              type="file"
              ref={(ref) => (upload = ref)}
              onChange={editHeaderImage}
            />
            {imageInfo}
          </div>
        </Tooltip>
        <div style={{ flex: "3", color: "white" }}>
          <div style={{ marginTop: 8 }} />
          Name
          <TextField
            required
            style={{
              flex: "1",
              marginTop: "5px",
              marginRight: "15px",
              backgroundColor: theme.palette.inputColor,
            }}
            fullWidth={true}
            placeholder="Name"
            type="name"
            id="standard-required"
            margin="normal"
            variant="outlined"
            value={orgName}
            onChange={(e) => {
              const invalid = ["#", ":", "."];
              for (var key in invalid) {
                if (e.target.value.includes(invalid[key])) {
                  toast("Can't use " + invalid[key] + " in name");
                  return;
                }
              }

              if (e.target.value.length > 100) {
                toast("Choose a shorter name.");
                return;
              }

              setOrgName(e.target.value);
            }}
            color="primary"
            InputProps={{
              style: {
                color: "white",
                height: "50px",
                fontSize: "1em",
              },
              classes: {
                notchedOutline: classes.notchedOutline,
              },
            }}
          />
          <div style={{ marginTop: "10px" }} />
          Description
          <div style={{ display: "flex" }}>
            <TextField
              required
              style={{
                flex: "1",
                marginTop: "5px",
                marginRight: "15px",
                backgroundColor: theme.palette.inputColor,
              }}
              fullWidth={true}
              type="name"
              id="outlined-with-placeholder"
              margin="normal"
              variant="outlined"
              placeholder="A description for the organization"
              value={orgDescription}
              onChange={(e) => {
                setOrgDescription(e.target.value);
              }}
              InputProps={{
                classes: {
                  notchedOutline: classes.notchedOutline,
                },
                style: {
                  color: "white",
                },
              }}
            />
            <div style={{ margin: "auto", textalign: "center" }}>
              {orgSaveButton}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgHeader;
