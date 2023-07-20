import React, { useRef, useState } from "react";
import { useEffect } from "react";
import {
	Backup as BackupIcon 
} from "@mui/icons-material";

const dragOverStyle = {
  backgroundColor: "rgba(0,0,0,0.8)",
  border: "5px dashed white",
  borderRadius: "8px",
  width: "100%",
  height: "100%",
  position: "absolute",
  overflow: "hidden",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const Dropzone = ({ children, style, onDrop }) => {
  const dropzoneRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  let dragCounter = 0;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0)
      setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e);
      e.dataTransfer.clearData();
      dragCounter = 0;
    }
  };

  useEffect(() => {
    if (dropzoneRef === null || dropzoneRef === undefined || dropzoneRef.current === null || dropzoneRef.current === undefined) {
	  	return
	}

	// Check if event listene exists for dropzoneRef.current

    dropzoneRef.current.addEventListener("dragover", handleDragOver);
    dropzoneRef.current.addEventListener("dragenter", handleDragEnter);
    dropzoneRef.current.addEventListener("dragleave", handleDragLeave);
    dropzoneRef.current.addEventListener("drop", handleDrop);

    return () => {
		if (dropzoneRef.current === null || dropzoneRef.current === undefined) {
			return
		}

      dropzoneRef.current.removeEventListener("dragover", handleDragOver);
      dropzoneRef.current.removeEventListener("dragenter", handleDragEnter);
      dropzoneRef.current.removeEventListener("dragleave", handleDragLeave);
      dropzoneRef.current.removeEventListener("drop", handleDrop);
    };
  }, [dropzoneRef]);

  return (
    <div ref={dropzoneRef} style={{ position: "relative", ...style }}>
      {dragging && (
        <div style={dragOverStyle}>
          <BackupIcon fontSize="large" />
        </div>
      )}
      {children}
    </div>
  );
};

export default Dropzone;
