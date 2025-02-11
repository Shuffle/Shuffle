import React from "react";
import AvatarEditor from "react-avatar-editor";
import { toast } from "react-toastify";
import theme from "../theme.jsx";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  Divider,
  Button,
  Tooltip,
} from "@mui/material";

import {
  AddAPhotoOutlined as AddAPhotoOutlinedIcon,
  ZoomInOutlined as ZoomInOutlinedIcon,
  ZoomOutOutlined as ZoomOutOutlinedIcon,
  Loop as LoopIcon,
} from "@mui/icons-material";

const ImageUploadModal = ({
  open,
  onClose,
  file,
  fileBase64,
  onSave,
  title = "Upload Image",
  upload,
}) => {
  const [scale, setScale] = React.useState(1);
  const [rotate, setRotatation] = React.useState(0);
  const [disableImageUpload, setDisableImageUpload] = React.useState(true);
  const [imageUploadError, setImageUploadError] = React.useState("");

  let editor;
  const setEditorRef = (imgEditor) => {
    editor = imgEditor;
  };

  const zoomIn = () => {
    setScale(scale + 0.1);
  };

  const zoomOut = () => {
    setScale(scale - 0.1);
  };

  const rotatation = () => {
    setRotatation(rotate + 10);
  };

  const onPositionChange = () => {
    setDisableImageUpload(false);
  };

  const handleSave = () => {
    if (editor) {
      try {
        const canvas = editor.getImageScaledToCanvas();
        onSave(canvas.toDataURL());
      } catch (e) {
        toast("Failed to set image. Replace it if this persists.");
      }
    }
  };

  const dividerStyle = { marginTop: 15, marginBottom: 15 };
  const iconStyle = { margin: 5, width: 50, height: 50 };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          backgroundColor: theme.palette.inputColor,
          color: "white",
          minWidth: "300px",
          minHeight: "300px",
        },
      }}
    >
      <FormControl>
        <DialogTitle>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>{title}</div>
        </DialogTitle>
        {imageUploadError.length > 0 ? (
          <div style={{ marginTop: 10 }}>Error: {imageUploadError}</div>
        ) : null}
        <DialogContent style={{ color: "rgba(255,255,255,0.65)" }}>
          <AvatarEditor
            ref={setEditorRef}
            image={file.length > 0 ? file : fileBase64}
            width={174}
            height={174}
            border={50}
            color={[0, 0, 0, 0.6]}
            scale={scale}
            rotate={rotate}
            onImageChange={onPositionChange}
            onLoadSuccess={() => setRotatation(0)}
          />
          <Divider style={dividerStyle} />
          <Tooltip title="New Icon">
            <Button
              variant="outlined"
              component="label"
              color="primary"
              style={iconStyle}
              onClick={() => {
                if (upload && upload.current) {
                  upload.current.click();
                }
              }}
            >
              <AddAPhotoOutlinedIcon
                color="primary"
              />
            </Button>
          </Tooltip>
          <Tooltip title="Zoom In">
            <Button variant="outlined" component="label" color="primary" style={iconStyle}>
              <ZoomInOutlinedIcon onClick={zoomIn} color="primary" />
            </Button>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <Button variant="outlined" component="label" color="primary" style={iconStyle}>
              <ZoomOutOutlinedIcon onClick={zoomOut} color="primary" />
            </Button>
          </Tooltip>
          <Tooltip title="Rotate">
            <Button variant="outlined" component="label" color="primary" style={iconStyle}>
              <LoopIcon onClick={rotatation} color="primary" />
            </Button>
          </Tooltip>
          <Divider style={dividerStyle} />
          <div style={{ marginTop: 15 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={disableImageUpload}
              onClick={handleSave}
              style={{ marginRight: 10 }}
            >
              Save
            </Button>
            <Button variant="contained" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </FormControl>
    </Dialog>
  );
};

export default ImageUploadModal; 