import React, {useState, useEffect, useLayoutEffect} from 'react';

import Draggable from "react-draggable";
import {
	Paper
} from "@mui/material";

const PaperComponent = (props) => {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper 
	  	{...props} 
	  />
    </Draggable>
  )
}

export default PaperComponent;
