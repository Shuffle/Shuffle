import React, { useState, useEffect } from 'react';

import theme from '../theme.jsx';
import CytoscapeComponent from 'react-cytoscapejs';
import frameworkStyle from '../frameworkStyle.jsx';
import { v4 as uuidv4 } from "uuid";

import AppSearch from '../components/Appsearch.jsx';
import PaperComponent from "../components/PaperComponent.jsx"
import { usecaseTypes } from "../components/UsecaseSearch.jsx"
import SuggestedWorkflows from "../components/SuggestedWorkflows.jsx"
import { securityFramework} from "../components/LandingpageUsecases.jsx";

import {
  Paper,
	Typography,
	Divider,
	IconButton, 
	Badge,
  	CircularProgress,
	Tooltip,
	Dialog,
	Chip,
	Avatar,
	Button,
} from "@mui/material";


import {
	Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";


import edgehandles from "cytoscape-edgehandles";

import cytoscape from "cytoscape";
import { toast } from 'react-toastify';
import { isMobile } from 'react-device-detect';

cytoscape.use(edgehandles)

export const findSpecificApp = (framework, inputcategory) => {
  // Get the frameworkinfo for the org and fill in
  if (framework === undefined || framework === null) {
	  //console.log("findSpecificApp: framework is null")
	  return null 
  }

  if (inputcategory === undefined || inputcategory === null) {
	  //console.log("findSpecificApp: category is null")
	  return null 
  }

  const category = inputcategory.toLowerCase().split(":")[0].trim()
  if (category === "edr" || category === "eradication" || category === "edr & av") {
	  if (framework["EDR & AV"] !== undefined && framework["EDR & AV"].name !== undefined && framework["EDR & AV"].name !== "") {
		  return framework["EDR & AV"]	
	  }

	  if (framework["edr"] !== undefined && framework["edr"].name !== undefined && framework["edr"].name !== "") {
		  return framework["edr"]
	  }

	  return {
		  name: "EDR :default",
		  large_image: parsedDatatypeImages()["EDR & AV"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "communication" || category === "comms") {
	  if (framework["Comms"] !== undefined && framework["Comms"].name !== undefined && framework["Comms"].name !== "") {
		  return framework["Comms"]	
	  }

	  if (framework["communication"] !== undefined && framework["communication"].name !== undefined && framework["communication"].name !== "") {
		  return framework["communication"]	
	  }

	  return {
		  name: "COMMS :default",
		  large_image: parsedDatatypeImages()["COMMS"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "email") {
	  if (framework["Email"] !== undefined && framework["Email"].name !== undefined && framework["Email"].name !== "") {
		  return framework["Email"]	
	  }

	  if (framework["email"] !== undefined && framework["email"].name !== undefined && framework["email"].name !== "") {
		  return framework["email"]	
	  }

	  return {
		  name: "COMMS :default",
		  large_image: parsedDatatypeImages()["COMMS"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "assets") {
	  if (framework["Assets"] !== undefined && framework["Assets"].name !== undefined && framework["Assets"].name !== "") {
		  return framework["Assets"]	
	  }

	  if (framework["assets"] !== undefined && framework["assets"].name !== undefined && framework["assets"].name !== "") {
		  return framework["assets"]	
	  }

	  return {
		  name: "ASSETS :default",
		  large_image: parsedDatatypeImages()["ASSETS"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "cases") {
	  if (framework["Cases"] !== undefined && framework["Cases"].name !== undefined && framework["Cases"].name !== "") {
		  return framework["Cases"]
	  }

	  if (framework["cases"] !== undefined && framework["cases"].name !== undefined && framework["cases"].name !== "") {
		  return framework["cases"]
	  }

	  return {
		  name: "CASES :default",
		  large_image: parsedDatatypeImages()["CASES"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "iam") {
	  if (framework["IAM"] !== undefined &&	framework["IAM"].name !== undefined && framework["IAM"].name !== "") {
		  return framework["IAM"]
	  }

	  if (framework["iam"] !== undefined &&	framework["iam"].name !== undefined && framework["iam"].name !== "") {
		  return framework["iam"]
	  }

	  return {
		  name: "IAM :default",
		  large_image: parsedDatatypeImages()["IAM"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "network") {
	  if (framework["Network"] !== undefined && framework["Network"].name !== undefined && framework["Network"].name !== "") {
		  return framework["Network"]
	  }

	  if (framework["network"] !== undefined && framework["network"].name !== undefined && framework["network"].name !== "") {
		  return framework["network"]
	  }

	  return {
		  name: "Network :default",
		  large_image: parsedDatatypeImages()["NETWORK"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "intel") {
	  if (framework["Intel"] !== undefined && framework["Intel"].name !== undefined && framework["Intel"].name !== "") {
		  return framework["Intel"]
	  }

	  if (framework["intel"] !== undefined && framework["intel"].name !== undefined && framework["intel"].name !== "") {
		  return framework["intel"]
	  }

	  return {
		  name: "INTEL :default",
		  large_image: parsedDatatypeImages()["INTEL"],
		  count: 0,
		  description: "",
		  id: "",
	  }
  } else if (category === "siem") {
	  if (framework["SIEM"] !== undefined && framework["SIEM"].name !== undefined && framework["SIEM"].name !== "") {
		  return framework["SIEM"]
	  }
	  
	  if (framework["siem"] !== undefined && framework["siem"].name !== undefined && framework["siem"].name !== "") {
		  return framework["siem"]
	  }

	  return {
		  name: "SIEM :default",
		  large_image: parsedDatatypeImages()["SIEM"],
		  count: 0,
		  description: "",
		  id: "",
	  } 
  } else {
	  console.log("findSpecificApp: unknown category: ", category)
  }

  return null
} 

const svgSize = "40px" 
export const parsedDatatypeImages = () => {
	const isWorkflow = window.location.pathname.includes("/workflows/") 
	const svgSize = isWorkflow  ? "24px" : "40px" 
	const colorfill = isWorkflow ? "rgb(240,240,240)" : "rgb(248,90,62)"

	return {
	"SIEM": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M6.93767 0C8.71083 0 10.4114 0.704386 11.6652 1.9582C12.919 3.21202 13.6234 4.91255 13.6234 6.68571C13.6234 8.34171 13.0165 9.864 12.0188 11.0366L12.2965 11.3143H13.1091L18.252 16.4571L16.7091 18L11.5662 12.8571V12.0446L11.2885 11.7669C10.116 12.7646 8.59367 13.3714 6.93767 13.3714C5.16451 13.3714 3.46397 12.667 2.21015 11.4132C0.956339 10.1594 0.251953 8.45888 0.251953 6.68571C0.251953 4.91255 0.956339 3.21202 2.21015 1.9582C3.46397 0.704386 5.16451 0 6.93767 0ZM6.93767 2.05714C4.36624 2.05714 2.3091 4.11429 2.3091 6.68571C2.3091 9.25714 4.36624 11.3143 6.93767 11.3143C9.5091 11.3143 11.5662 9.25714 11.5662 6.68571C11.5662 4.11429 9.5091 2.05714 6.93767 2.05714Z" /></svg>`), 

	"CASES": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M15.6408 8.39233H18.0922V10.0287H15.6408V8.39233ZM0.115234 8.39233H2.56663V10.0287H0.115234V8.39233ZM9.92083 0.21051V2.66506H8.28656V0.21051H9.92083ZM3.31839 2.25596L5.05889 4.00687L3.89856 5.16051L2.15807 3.42596L3.31839 2.25596ZM13.1485 3.99869L14.8808 2.25596L16.0493 3.42596L14.3088 5.16051L13.1485 3.99869ZM9.10369 4.30142C10.404 4.30142 11.651 4.81863 12.5705 5.73926C13.4899 6.65989 14.0065 7.90854 14.0065 9.21051C14.0065 11.0269 13.0178 12.6141 11.5551 13.4651V14.9378C11.5551 15.1548 11.469 15.3629 11.3158 15.5163C11.1625 15.6698 10.9547 15.756 10.738 15.756H7.46943C7.25271 15.756 7.04487 15.6698 6.89163 15.5163C6.73839 15.3629 6.6523 15.1548 6.6523 14.9378V13.4651C5.18963 12.6141 4.2009 11.0269 4.2009 9.21051C4.2009 7.90854 4.71744 6.65989 5.63689 5.73926C6.55635 4.81863 7.80339 4.30142 9.10369 4.30142ZM10.738 16.5741V17.3923C10.738 17.6093 10.6519 17.8174 10.4986 17.9709C10.3454 18.1243 10.1375 18.2105 9.92083 18.2105H8.28656C8.06984 18.2105 7.862 18.1243 7.70876 17.9709C7.55552 17.8174 7.46943 17.6093 7.46943 17.3923V16.5741H10.738ZM8.28656 14.1196H9.92083V12.3769C11.3345 12.0169 12.3722 10.7323 12.3722 9.21051C12.3722 8.34253 12.0279 7.5101 11.4149 6.89634C10.8019 6.28259 9.97056 5.93778 9.10369 5.93778C8.23683 5.93778 7.40546 6.28259 6.79249 6.89634C6.17953 7.5101 5.83516 8.34253 5.83516 9.21051C5.83516 10.7323 6.87292 12.0169 8.28656 12.3769V14.1196Z"  /></svg>`),

	"EDR & AV": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M19.1722 8.9957L17.0737 6.60487L17.3661 3.44004L14.2615 2.73483L12.6361 -3.28068e-08L9.71206 1.25561L6.78803 -3.28068e-08L5.16261 2.73483L2.05797 3.43144L2.35038 6.59627L0.251953 8.9957L2.35038 11.3865L2.05797 14.56L5.16261 15.2652L6.78803 18L9.71206 16.7358L12.6361 17.9914L14.2615 15.2566L17.3661 14.5514L17.0737 11.3865L19.1722 8.9957ZM10.5721 13.2957H8.85205V11.5757H10.5721V13.2957ZM10.5721 9.85571H8.85205V4.69565H10.5721V9.85571Z" /></svg>`),

	"INTEL": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M16.1091 8.57143H14.8234V5.14286C14.8234 4.19143 14.052 3.42857 13.1091 3.42857H9.68052V2.14286C9.68052 1.57454 9.45476 1.02949 9.0529 0.627628C8.65103 0.225765 8.10599 0 7.53767 0C6.96935 0 6.4243 0.225765 6.02244 0.627628C5.62057 1.02949 5.39481 1.57454 5.39481 2.14286V3.42857H1.96624C1.51158 3.42857 1.07555 3.60918 0.754056 3.93067C0.432565 4.25216 0.251953 4.6882 0.251953 5.14286V8.4H1.53767C2.82338 8.4 3.85195 9.42857 3.85195 10.7143C3.85195 12 2.82338 13.0286 1.53767 13.0286H0.251953V16.2857C0.251953 16.7404 0.432565 17.1764 0.754056 17.4979C1.07555 17.8194 1.51158 18 1.96624 18H5.22338V16.7143C5.22338 15.4286 6.25195 14.4 7.53767 14.4C8.82338 14.4 9.85195 15.4286 9.85195 16.7143V18H13.1091C13.5638 18 13.9998 17.8194 14.3213 17.4979C14.6428 17.1764 14.8234 16.7404 14.8234 16.2857V12.8571H16.1091C16.6774 12.8571 17.2225 12.6314 17.6243 12.2295C18.0262 11.8277 18.252 11.2826 18.252 10.7143C18.252 10.146 18.0262 9.60092 17.6243 9.19906C17.2225 8.79719 16.6774 8.57143 16.1091 8.57143Z" /></svg>`),

	"COMMS": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M9.89516 7.71433H8.60945V5.1429H9.89516V7.71433ZM9.89516 10.2858H8.60945V9.00004H9.89516V10.2858ZM14.3952 2.57147H4.10944C3.76845 2.57147 3.44143 2.70693 3.20031 2.94805C2.95919 3.18917 2.82373 3.51619 2.82373 3.85719V15.4286L5.39516 12.8572H14.3952C14.7362 12.8572 15.0632 12.7217 15.3043 12.4806C15.5454 12.2395 15.6809 11.9125 15.6809 11.5715V3.85719C15.6809 3.14361 15.1023 2.57147 14.3952 2.57147Z" /></svg>`), 

	"NETWORK": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M0.251953 10.6011H3.8391L9.38052 -4.92572e-08L10.8977 11.5696L15.0377 6.28838L19.3191 10.6011H23.3948V13.1836H18.252L15.2562 10.175L9.1491 18L7.88909 8.41894L5.39481 13.1836H0.251953V10.6011Z" /></svg>`), 
						
	"INTEL": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M16.1091 8.57143H14.8234V5.14286C14.8234 4.19143 14.052 3.42857 13.1091 3.42857H9.68052V2.14286C9.68052 1.57454 9.45476 1.02949 9.0529 0.627628C8.65103 0.225765 8.10599 0 7.53767 0C6.96935 0 6.4243 0.225765 6.02244 0.627628C5.62057 1.02949 5.39481 1.57454 5.39481 2.14286V3.42857H1.96624C1.51158 3.42857 1.07555 3.60918 0.754056 3.93067C0.432565 4.25216 0.251953 4.6882 0.251953 5.14286V8.4H1.53767C2.82338 8.4 3.85195 9.42857 3.85195 10.7143C3.85195 12 2.82338 13.0286 1.53767 13.0286H0.251953V16.2857C0.251953 16.7404 0.432565 17.1764 0.754056 17.4979C1.07555 17.8194 1.51158 18 1.96624 18H5.22338V16.7143C5.22338 15.4286 6.25195 14.4 7.53767 14.4C8.82338 14.4 9.85195 15.4286 9.85195 16.7143V18H13.1091C13.5638 18 13.9998 17.8194 14.3213 17.4979C14.6428 17.1764 14.8234 16.7404 14.8234 16.2857V12.8571H16.1091C16.6774 12.8571 17.2225 12.6314 17.6243 12.2295C18.0262 11.8277 18.252 11.2826 18.252 10.7143C18.252 10.146 18.0262 9.60092 17.6243 9.19906C17.2225 8.79719 16.6774 8.57143 16.1091 8.57143Z" /></svg>`),

	"ASSETS": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M11.223 10.971L3.85195 14.4L7.28095 7.029L14.652 3.6L11.223 10.971ZM9.25195 0C8.07006 0 6.89973 0.232792 5.8078 0.685084C4.71587 1.13738 3.72372 1.80031 2.88799 2.63604C1.20016 4.32387 0.251953 6.61305 0.251953 9C0.251953 11.3869 1.20016 13.6761 2.88799 15.364C3.72372 16.1997 4.71587 16.8626 5.8078 17.3149C6.89973 17.7672 8.07006 18 9.25195 18C11.6389 18 13.9281 17.0518 15.6159 15.364C17.3037 13.6761 18.252 11.3869 18.252 9C18.252 7.8181 18.0192 6.64778 17.5669 5.55585C17.1146 4.46392 16.4516 3.47177 15.6159 2.63604C14.7802 1.80031 13.788 1.13738 12.6961 0.685084C11.6042 0.232792 10.4338 0 9.25195 0ZM9.25195 8.01C8.98939 8.01 8.73758 8.1143 8.55192 8.29996C8.36626 8.48563 8.26195 8.73744 8.26195 9C8.26195 9.26256 8.36626 9.51437 8.55192 9.70004C8.73758 9.8857 8.98939 9.99 9.25195 9.99C9.51452 9.99 9.76633 9.8857 9.95199 9.70004C10.1376 9.51437 10.242 9.26256 10.242 9C10.242 8.73744 10.1376 8.48563 9.95199 8.29996C9.76633 8.1143 9.51452 8.01 9.25195 8.01Z" /></svg>`), 

	"IAM": encodeURI(`data:image/svg+xml;utf-8,<svg fill="${colorfill}" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M13.3318 2.223C13.2598 2.223 13.1878 2.205 13.1248 2.169C11.3968 1.278 9.90284 0.9 8.11184 0.9C6.32984 0.9 4.63784 1.323 3.09884 2.169C2.88284 2.286 2.61284 2.205 2.48684 1.989C2.36984 1.773 2.45084 1.494 2.66684 1.377C4.34084 0.468 6.17684 0 8.11184 0C10.0288 0 11.7028 0.423 13.5388 1.368C13.7638 1.485 13.8448 1.755 13.7278 1.971C13.6468 2.133 13.4938 2.223 13.3318 2.223ZM0.452843 6.948C0.362843 6.948 0.272843 6.921 0.191843 6.867C-0.015157 6.723 -0.0601571 6.444 0.0838429 6.237C0.974843 4.977 2.10884 3.987 3.45884 3.294C6.28484 1.836 9.90284 1.827 12.7378 3.285C14.0878 3.978 15.2218 4.959 16.1128 6.21C16.2568 6.408 16.2118 6.696 16.0048 6.84C15.7978 6.984 15.5188 6.939 15.3748 6.732C14.5648 5.598 13.5388 4.707 12.3238 4.086C9.74084 2.763 6.43784 2.763 3.86384 4.095C2.63984 4.725 1.61384 5.625 0.803843 6.759C0.731843 6.885 0.596843 6.948 0.452843 6.948ZM6.07784 17.811C5.96084 17.811 5.84384 17.766 5.76284 17.676C4.97984 16.893 4.55684 16.389 3.95384 15.3C3.33284 14.193 3.00884 12.843 3.00884 11.394C3.00884 8.721 5.29484 6.543 8.10284 6.543C10.9108 6.543 13.1968 8.721 13.1968 11.394C13.1968 11.646 12.9988 11.844 12.7468 11.844C12.4948 11.844 12.2968 11.646 12.2968 11.394C12.2968 9.216 10.4158 7.443 8.10284 7.443C5.78984 7.443 3.90884 9.216 3.90884 11.394C3.90884 12.69 4.19684 13.887 4.74584 14.859C5.32184 15.894 5.71784 16.335 6.41084 17.037C6.58184 17.217 6.58184 17.496 6.41084 17.676C6.31184 17.766 6.19484 17.811 6.07784 17.811ZM12.5308 16.146C11.4598 16.146 10.5148 15.876 9.74084 15.345C8.39984 14.436 7.59884 12.96 7.59884 11.394C7.59884 11.142 7.79684 10.944 8.04884 10.944C8.30084 10.944 8.49884 11.142 8.49884 11.394C8.49884 12.663 9.14684 13.86 10.2448 14.598C10.8838 15.03 11.6308 15.237 12.5308 15.237C12.7468 15.237 13.1068 15.21 13.4668 15.147C13.7098 15.102 13.9438 15.264 13.9888 15.516C14.0338 15.759 13.8718 15.993 13.6198 16.038C13.1068 16.137 12.6568 16.146 12.5308 16.146ZM10.7218 18C10.6858 18 10.6408 17.991 10.6048 17.982C9.17384 17.586 8.23784 17.055 7.25684 16.092C5.99684 14.841 5.30384 13.176 5.30384 11.394C5.30384 9.936 6.54584 8.748 8.07584 8.748C9.60584 8.748 10.8478 9.936 10.8478 11.394C10.8478 12.357 11.6848 13.14 12.7198 13.14C13.7548 13.14 14.5918 12.357 14.5918 11.394C14.5918 8.001 11.6668 5.247 8.06684 5.247C5.51084 5.247 3.17084 6.669 2.11784 8.874C1.76684 9.603 1.58684 10.458 1.58684 11.394C1.58684 12.096 1.64984 13.203 2.18984 14.643C2.27984 14.877 2.16284 15.138 1.92884 15.219C1.69484 15.309 1.43384 15.183 1.35284 14.958C0.911843 13.779 0.695843 12.609 0.695843 11.394C0.695843 10.314 0.902843 9.333 1.30784 8.478C2.50484 5.967 5.15984 4.338 8.06684 4.338C12.1618 4.338 15.4918 7.497 15.4918 11.385C15.4918 12.843 14.2498 14.031 12.7198 14.031C11.1898 14.031 9.94784 12.843 9.94784 11.385C9.94784 10.422 9.11084 9.639 8.07584 9.639C7.04084 9.639 6.20384 10.422 6.20384 11.385C6.20384 12.924 6.79784 14.364 7.88684 15.444C8.74184 16.29 9.56084 16.758 10.8298 17.109C11.0728 17.172 11.2078 17.424 11.1448 17.658C11.0998 17.865 10.9108 18 10.7218 18Z" /></svg>`),
	}
}

export const usecases = {
	"None": {
		"manual": [],
		"automated": [],
	},
	"Phishing": {
		"manual": [],
		"automated": [
			{
				"source":	"BOTTOM_LEFT",
				"target":	"COMMS",
				"description": "Email received",
				"human": false,
			},
			{
				"source":	"COMMS",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"human": false,
			},
			{
				"source":	"INTEL",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"ASSETS",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"SIEM",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"INTEL",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"COMMS",
				"human": false,
			},
			{
				"source":	"CASES",
				"target":	"EDR & AV",
				"human": true,
			},
	]},
	
	"Exploits": {
		"manual": [],
		"automated": [
			{
				"source":	"TOP_LEFT",
				"target":	"NETWORK",
				"description": "Exploit",
				"human": false,
			},
			{
				"source":	"NETWORK",
				"target":	"SIEM",
				"description": "WAF alert",
				"human": false,
			},
			{
				"source":	"SIEM",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"COMMS",
				"human": false,
			},
			{
				"source":	"INTEL",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"ASSETS",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"IAM",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"CASES",
				"target":	"EDR & AV",
				"human": true,
			},
		]
	},	
	"SIEM alerts": {
		"manual": [],
		"automated": [
			{
				"source":	"TOP_LEFT",
				"target":	"SIEM",
				"description": "Syslog",
				"human": false,
			},
			{
				"source":	"SIEM",
				"target":	"SHUFFLE",
				"description": "Alerts",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"INTEL",
				"description": "Enrich",
				"human": false,
			},
			{
				"source":	"INTEL",
				"target":	"SHUFFLE",
				"human": false,
			},
			{
				"source":	"IAM",
				"target":	"SHUFFLE",
				"human": false,
				"description": "enrich",
			},
			{
				"source":	"SHUFFLE",
				"target":	"IAM",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"COMMS",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"EDR & AV",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"EDR & AV",
				"human": true,
			},
		]
	},
	"New Detections": {
		"manual": [],
		"automated": [
			{
				"source":	"TOP_LEFT",
				"target":	"SIEM",
				"description": "Hypothesis",
				"human": true,
			},
			{
				"source":	"SIEM",
				"target":	"SIEM",
				"description": "Create rule",
				"human": true,
			},
			{
				"source":	"SIEM",
				"target":	"NETWORK",
				"description": "Create rule",
				"human": true,
			},
			{
				"source":	"NETWORK",
				"target":	"EDR & AV",
				"description": "Create rule",
				"human": true,
			},
			{
				"source":	"SIEM",
				"target":	"SHUFFLE",
				"description": "Send alert",
				"human": false,
			},
			{
				"source":	"NETWORK",
				"target":	"SHUFFLE",
				"description": "Send alert",
				"human": false,
			},
			{
				"source":	"EDR & AV",
				"target":	"SHUFFLE",
				"description": "Send alert",
				"human": false,
			},
			{
				"source":	"INTEL",
				"target":	"SHUFFLE",
				"description": "Enrich IOCs",
				"human": false,
			},
			{
				"source":	"ASSETS",
				"target":	"SHUFFLE",
				"description": "Enrich hostnames etc.",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"description": "Create enriched alert",
				"human": false,
			},
		]
	},
	"Vulnerabilities": {
		"manual": [],
		"automated": [
			{
				"source":	"TOP_RIGHT",
				"target":	"ASSETS",
				"description": "New vuln",
				"human": false,
			},
			{
				"source":	"ASSETS",
				"target":	"SHUFFLE",
				"description": "Get vuln",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"description": "Raise ticket",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"COMMS",
				"description": "Notify owner",
				"human": false,
			},
			{
				"source":	"COMMS",
				"target":	"SHUFFLE",
				"description": "",
				"human": true,
			},
			{
				"source":	"SHUFFLE",
				"target":	"ASSETS",
				"description": "Auto-patch",
				"human": false,
			},
		]
	},
	"Approvals": {
		"manual": [],
		"automated": [
			{
				"source":	"TOP_LEFT",
				"target":	"CASES",
				"description": "New inquiry",
				"human": false,
			},
			{
				"source":	"CASES",
				"target":	"SHUFFLE",
				"description": "Get tickets",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"COMMS",
				"description": "Ask for approval",
				"human": false,
			},
			{
				"source":	"COMMS",
				"target":	"SHUFFLE",
				"human": true,
			},
			{
				"source":	"SHUFFLE",
				"target":	"ASSETS",
				"description": "Add to user",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"IAM",
				"description": "Approve access",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"human": false,
			},
		]
	},
	"Enrichment": {
		"manual": [],
		"automated": [
			{
				"source":	"TOP_LEFT",
				"target":	"CASES",
				"description": "Case updated",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"description": "Get and enrich ticket",
				"human": false,
			},
			{
				"source":	"IAM",
				"target":	"SHUFFLE",
				"description": "Get access rights",
				"human": false,
			},
			{
				"source":	"ASSETS",
				"target":	"SHUFFLE",
				"description": "Get relevant assets",
				"human": false,
			},
			{
				"source":	"INTEL",
				"target":	"SHUFFLE",
				"description": "Get relevant IPs",
				"human": false,
			},
			{
				"source":	"COMMS",
				"target":	"SHUFFLE",
				"description": "Find relevant mails & chats",
				"human": false,
			},
			{
				"source":	"EDR & AV",
				"target":	"SHUFFLE",
				"description": "Find incidents for host",
				"human": false,
			},
			{
				"source":	"SIEM",
				"target":	"SHUFFLE",
				"description": "Find info about hostname and user",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"SHUFFLE",
				"description": "Format info",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"description": "",
				"human": false,
			},
		]
	},
	"Ransomware": {
		"manual": [],
		"automated": [
			{
				"source":	"BOTTOM_LEFT",
				"target":	"EDR & AV",
				"description": "EDR & AV alert",
				"human": false,
			},
			{
				"source":	"EDR & AV",
				"target":	"SHUFFLE",
				"description": "",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"EDR & AV",
				"human": false,
				"description": "isolate",
			},
			{
				"source":	"SHUFFLE",
				"target":	"IAM",
				"human": false,
				"description": "Block access",
			},
			{
				"source":	"SHUFFLE",
				"target":	"COMMS",
				"description": "Notify oncall and affected user",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"description": "Create enriched alert",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"human": false,
			},
			{
				"source":	"CASES",
				"target":	"EDR & AV",
				"description": "Validate alert",
				"human": true,
			},
		]
	},
	"Draw": {
	}
}

const AppFramework = (props) => {
  const { globalUrl, isLoaded, showOptions, selectedOption, rolling, frameworkData, setFrameworkData, size, inputUsecase, isLoggedIn, color, discoveryWrapper, setDiscoveryWrapper, userdata, apps, inputUsecases, setInputUsecases } = props;
	const [cy, setCy] = React.useState()
	const [edgesStarted, setEdgesStarted] = React.useState(false)
	const [graphDone, setGraphDone] = React.useState(false)
	const [cyDone, setCyDone] = React.useState(false)
	const [discoveryData, setDiscoveryData] = React.useState({})
	const [selectionOpen, setSelectionOpen] = React.useState(true)
	const [frameworkSuggestions, setFrameworkSuggestions] = React.useState([])
	const [newSelectedApp, setNewSelectedApp] = React.useState({})
	const [defaultSearch, setDefaultSearch] = React.useState("")
	const [animationStarted, setAnimationStarted] = React.useState(false)
	const [paperTitle, setPaperTitle] = React.useState("")
	const [changedApp, setChangedApp] = React.useState("")


	const [usecaseType, setUsecaseType] = React.useState(0)
	const [selectedUsecase, setSelectedUsecase] = React.useState(selectedOption !== undefined ? selectedOption : "Phishing")

	const [injectedApps, setInjectedApps] = React.useState([])

	const scale = size === undefined ? 1 : size > 5 ? 3 : size

  //const alert = useAlert()


	const handleLoadNextSuggestion = (frameworkData) => {
		//console.log("Should check for next apps to load from App suggestion model")
		//fetch(globalUrl + "/api/v1/workflows/usecases", {
      //credentials: "include",
			//cors: "no-cors",
		
		const max_suggestions = 5
		const max_per_category = 2
		const priorities = {
			"edr": 1,
			"siem": 2,
			"cases": 3,
			"intel": 4,
			"comms": 5, 
		}
		
		// Based on apps recommended from repo https://github.com/Shuffle/app-recommender
		//fetch("http://localhost:8080/app_recommendations", {
		fetch("https://europe-west2-shuffler.cloudfunctions.net/app_recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(frameworkData),
    })
		.then((response) => {
			//if (response.status !== 200) {
			//	console.log("Status not 200 for framework!");
			//}

			return response.json();
		})
		.then((responseJson) => {
			// Loop the response dict
			var suggestions = []
			var suggestion_cnt = 0
			var category_count = {}
			for (const [key, value] of Object.entries(responseJson)) {
				if (suggestion_cnt >= max_suggestions) {
					break
				}

				if (category_count[key] === undefined) {
					category_count[key] = 1
				} else {
					category_count[key] += 1
				}

				if (category_count[key] > max_per_category) {
					continue
				}

				//console.log("Found: " + key + " with value of len: " + value.length)

				//suggestion_cnt += value.slice(0,1).length
				suggestions.push(value.slice(0,1))
			}

			setInjectedApps(suggestions)
		})
		.catch((error) => {
			console.log("Recommendation error: ", error);
		})
	}

	const showRecommendations = (changed, frameworkData) => {
		//console.log("Inside recommendation loader")
		setChangedApp(changed)
		handleLoadNextSuggestion(frameworkData)

		// Alternative changed
		// This is for secondary values like email = comms
		var alternativeChanged = changed
		if (changed == "COMMS") {
			alternativeChanged = "email"
		}
		
		// FIX: 
		// 0. Get workflows loaded in from usecasesearch
		// 1. Search through workflow templates for matching app types
		// 2. Validate if template is already in use~ (workflows with same tools)
		// 3. Generate the workflow(s) - PS: Fix new workflow templates
		// 4. Moving on!
	
		// How can we load templates? UsecaseSearch?
		var showusecases = []
		//const foundusecase = usecaseTypes.find(data => data.name.toLowerCase() === defaultSearch.toLowerCase())
		for (var key in usecaseTypes) {
			for (var subkey in usecaseTypes[key].value) {
				const usecase = usecaseTypes[key].value[subkey]

				if (usecase.active === false) {
					continue
				}

				var potential = false
				var matches = []
				for (var itemtype in usecase.items) {
					var apptype = usecase.items[itemtype].app_type.toLowerCase()
					if (apptype.toLowerCase() === "email" || apptype.toLowerCase() === "comms" || apptype === "communication") {
						apptype = "Comms"
					}
					//console.log("OLD: ", changed, "USECASE: ", apptype)

					//console.log("APptype, changed, framework: ", apptype.toLowerCase(), alternativeChanged.toLowerCase(), changed.toLowerCase(), frameworkData)
					if (changed.toLowerCase() === apptype.toLowerCase() || changed.toLowerCase().includes(apptype.toLowerCase()) || alternativeChanged.toLowerCase() === apptype.toLowerCase() || alternativeChanged.toLowerCase().includes(apptype.toLowerCase())) {
						potential = true 
						//console.log("Potential: !", apptype)

						if (frameworkData[apptype] !== undefined && frameworkData[apptype].name !== undefined && frameworkData[apptype].name !== null && frameworkData[apptype].name.length > 0) {
							usecase.items[itemtype].app = frameworkData[apptype]
						}

						matches.push(usecase.items[itemtype])
					} else {
						// Check if the type is done in frameworkData
						if (frameworkData[apptype] !== undefined) {
							//console.log("NOT UNDEFINED: ", frameworkData[apptype])
							if (frameworkData[apptype].name !== undefined && frameworkData[apptype].name !== null && frameworkData[apptype].name.length > 0) {
								//console.log("FOUND: ", frameworkData[apptype])
								usecase.items[itemtype].app = frameworkData[apptype]

								//console.log("Real app!")
								matches.push(usecase.items[itemtype])
							}

							//if (frameworkData[apptype] !== undefined) {
						} else {
							console.log("UNDEFINED APP (bad name?): ", apptype)
						}
					}
				}

				// Adds to list if it's all matching and unhandled
				if (potential) {
					// Check finished usecases.
					if (inputUsecases !== undefined && setInputUsecases !== undefined && usecase.usecase_references !== undefined && usecase.usecase_references.length > 0) {
						var foundUsecase = false
						for (var usecaseKey in inputUsecases) {
							const usecaseCategory = inputUsecases[usecaseKey]
							for (var subUsecaseKey in usecaseCategory.list) {
								const loopUsecase = usecaseCategory.list[subUsecaseKey]
								if (loopUsecase.matches === undefined || loopUsecase.matches === null || loopUsecase.matches.length === 0) {
									//console.log("No matches - continuing")
									continue
								}

								if (usecase.usecase_references.includes(loopUsecase.name)) {
									foundUsecase = true
									break
								}
							}

							if (foundUsecase) {
								break
							}
						}

						if (!foundUsecase) {
							console.log("Usecase NOT found!")
						} else {
							console.log("FOUND usecase existing in ", usecase.usecase_references)
							continue
						}
					} else {
						//console.log("No usecase to try to match it to (usecase.usecase_references in UsecaseSearch)")
					}

					//console.log("Usecase: ", usecase)
					if (matches.length === usecase.items.length) {
						usecase.color = "#c51152"
						usecase.type = usecaseTypes[key].name
						showusecases.push(usecase)
					}
				}
			}
		}

		// FIXME: Check if a usecase has already been handled
		//console.log("")
		//console.log("GOT USECASES: ", showusecases)

		// FIXME: Just showing one usecase at a time for now
		if (showusecases.length > 0) {
			setFrameworkSuggestions(showusecases.slice(0,1))
		}
	}

	useEffect(() => {
		//console.log("DISCWRAP CHANG: ", discoveryWrapper)
		if (discoveryWrapper === undefined || discoveryWrapper.id === "SHUFFLE" || discoveryWrapper.id === undefined || cy === undefined) {
			setDiscoveryData({})

			if (cy !== undefined) {
				cy.nodes().unselect()
			}

			return
		}
			

		// Find the node and click it?
		//setTimeout(() => {
		const nodes = cy.nodes().jsons()
		for (var key in nodes) {
			const node = nodes[key]
			var newSearchName = discoveryWrapper.id.valueOf()
			if (newSearchName === "EMAIL") {
				newSearchName = "COMMS"
			}

			if (newSearchName === "ERADICATION" || newSearchName === "ENDPOINT") {
				newSearchName = "EDR & AV"
			}

			if (node.data.id === newSearchName) {
				const tmpnode = cy.getElementById(node.data.id)
				if (tmpnode !== undefined) {
					tmpnode.select()
				}

				setDefaultSearch(discoveryWrapper.id)
				setPaperTitle(discoveryWrapper.id)
			}
		}
		//}, 50,)
		//setDiscoveryData(discoveryWrapper)
	}, [discoveryWrapper])

	const setUsecaseItem = (inputUsecase) => {
		var parsedUsecase = inputUsecase
		const edges = cy.edges().jsons()

		parsedUsecase.process = []
		for (var key in edges) {
			const edge = edges[key]
			console.log("Edge: ", edge)
			parsedUsecase.process.push(edge.data)
		}

		fetch(globalUrl + "/api/v1/workflows/usecases", {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  body: JSON.stringify(parsedUsecase),
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
				if (responseJson.reason !== undefined) {
					toast("Failed updating: " + responseJson.reason)
				} else {
					toast("Failed to update framework for your org.")
				}
			} else {
				toast("Updated usecase.")
			}
		  })
		  .catch((error) => {
			toast(error.toString());
		  })
	}

		const activateApp = (appid) => {
			fetch(globalUrl+"/api/v1/apps/"+appid+"/activate", {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					credentials: "include",
			})
			.then((response) => {
				if (response.status !== 200 || response.status !== 202) {
					console.log("Failed to activate")
				}

				return response.json()
			})
			.then((responseJson) => {
				if (responseJson.success === false) {
					var msgString = "Failed to activate the app"
					if (responseJson.reason !== undefined) {
						msgString += ": " + responseJson.reason
					}
					toast(msgString)
				} else {
					//toast("App activated for your organization! Refresh the page to use the app.")
				}
			})
			.catch(error => {
				//toast(error.toString())
				console.log("Activate app error: ", error.toString())
			});
		}

	const setFrameworkItem = (data) => {
		if (!isCloud) {
			activateApp(data.id)
		}

		fetch(globalUrl + "/api/v1/apps/frameworkConfiguration", {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		  },
		  body: JSON.stringify(data),
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
	      	if (responseJson.reason !== undefined) {
	      		toast("Failed getting appframework: " + responseJson.reason)
	      	} else {
	      		toast("Failed to update framework for your org.")

	      	}
	      } else {
			if (data.id === "remove") {
				frameworkData[data.type] = {}
				frameworkData[data.type.toLowerCase()] = {}
			} else {
				frameworkData[data.type] = data
				frameworkData[data.type.toLowerCase()] = data
			}

			setDiscoveryData({})
			if (setFrameworkData !== undefined) {
				setFrameworkData(frameworkData)
			}
		  }
		})
	    .catch((error) => {
	      toast(error.toString());
			//setFrameworkLoaded(true)
	    })
	  }

	useEffect(() => {
		if (!window.location.pathname.includes("usecases")) {
			handleLoadNextSuggestion(frameworkData) 
		}
	}, [])

	useEffect(() => {
		//console.log("New selected app: ", newSelectedApp, discoveryData)
		if (newSelectedApp.objectID === undefined || newSelectedApp.objectID === undefined  || newSelectedApp.objectID.length === 0) {
			return
		}

		//if (paperTitle.length > 0) {
		//	console.log("No papertitle (parent button)")

		//	cy.elements().unselect()
		//	return
		//}

		if (discoveryData.id === undefined) {
			console.log("No discoverydata (parent button)")

			cy.elements().unselect()
			return
		}

		const submitValue = {
			"type": discoveryData.id,
			"name": newSelectedApp.name,
			"id": newSelectedApp.objectID,
			"large_image": newSelectedApp.image_url,
			"description": newSelectedApp.description === undefined ? "" : newSelectedApp.description,
		}


		const foundelement = cy.getElementById(discoveryData.id)
		if (foundelement !== undefined && foundelement !== null) {
			foundelement.data("large_image", newSelectedApp.image_url)
			foundelement.data("margin_x", "0px")
			foundelement.data("margin_y", "0px")
			foundelement.data("text_margin_y", `${60*scale}px`)
			foundelement.data("width", `${85*scale}px`)
			foundelement.data("height", `${85*scale}px`)
		}

		if (setFrameworkData !== undefined) {
			// Find discoveryData.id
			var keys = []
			for (const [key, value] of Object.entries(frameworkData)) {
				if (key.toLowerCase() === discoveryData.id.toLowerCase()) {
					keys.push(key)
				}
			}

			if (keys.length === 0) {
				console.log("Failed to find: ", discoveryData.id, " IN ", frameworkData)
			} else {
				for (var key in keys) {
					frameworkData[keys[key]] = submitValue
				}

				setFrameworkData(frameworkData)

				if (discoveryData.large_image !== undefined && discoveryData.large_image !== null && discoveryData.large_image.includes("storage.googleapis.com")) {
					showRecommendations(discoveryData.id, frameworkData)
				} else {
					console.log("Skipping recommendations during unselect")
				}
			}
		}

		setFrameworkItem(submitValue) 
		cy.elements().unselect()

	}, [newSelectedApp])


  const isCloud = (window.location.host === "localhost:3002" || window.location.host === "shuffler.io") ? true : (process.env.IS_SSR === "true");
  const imgSize = 50;
	var parsedFrameworkData = frameworkData === undefined ? {} : frameworkData 

	// Awful mapping to make sure all access is always there
	if (frameworkData !== undefined) {
		if (frameworkData.cases !== undefined) {
			if (frameworkData.cases.large_image === undefined && frameworkData.cases.large_image === null || frameworkData.cases.large_image === "") {
				frameworkData.cases = {}
			}

			parsedFrameworkData.Cases = frameworkData.cases
		} else {
			parsedFrameworkData.Cases = {}
		}

		if (frameworkData.siem !== undefined) {
			if (frameworkData.siem.large_image === undefined && frameworkData.siem.large_image === null || frameworkData.siem.large_image === "") {
				frameworkData.siem = {}
			}

			parsedFrameworkData.SIEM = frameworkData.siem
		} else {
			parsedFrameworkData.SIEM = {}
		}

		if (frameworkData.assets !== undefined) {
			if (frameworkData.assets.large_image === undefined && frameworkData.assets.large_image === null || frameworkData.assets.large_image === "") {
				frameworkData.assets = {}
			}

			parsedFrameworkData.Assets = frameworkData.assets
		} else {
			parsedFrameworkData.Assets = {}
		}

		if (frameworkData.intel !== undefined) {
			if (frameworkData.intel.large_image === undefined && frameworkData.intel.large_image === null || frameworkData.intel.large_image === "") {
				frameworkData.intel = {}
			}

			parsedFrameworkData.Intel = frameworkData.intel
		} else {
			parsedFrameworkData.Intel= {}
		}

		if (frameworkData.communication !== undefined) {
			if (frameworkData.communication.large_image === undefined && frameworkData.communication.large_image === null || frameworkData.communication.large_image === "") {
				frameworkData.communication = {}
			}

			parsedFrameworkData.Comms = frameworkData.communication
		} else {
			parsedFrameworkData.Comms = {}
		}

		if (frameworkData.network !== undefined) {
			if (frameworkData.network.large_image === undefined && frameworkData.network.large_image === null || frameworkData.network.large_image === "") {
				frameworkData.network = {}
			}

			parsedFrameworkData.Network = frameworkData.network
		} else {
			parsedFrameworkData.Network = {}
		}

		if (frameworkData.iam !== undefined) {
			if (frameworkData.iam.large_image === undefined && frameworkData.iam.large_image === null || frameworkData.iam.large_image === "") {
				frameworkData.iam = {}
			}

			parsedFrameworkData.IAM = frameworkData.iam
		} else {
			parsedFrameworkData.IAM = {}
		}

		if (frameworkData.edr !== undefined) {
			if (frameworkData.edr.large_image === undefined && frameworkData.edr.large_image === null || frameworkData.edr.large_image === "") {
				frameworkData.edr = {}
			}

			parsedFrameworkData["EDR & AV"] = frameworkData.edr
		} else {
			parsedFrameworkData["EDR & AV"] = {}
		}

	} else { 
		//console.log("No frameworkdata for org! Setting default")
		parsedFrameworkData["Cases"] = {}
		parsedFrameworkData["SIEM"] = {}
		parsedFrameworkData["Assets"] = {}
		parsedFrameworkData["IAM"] = {}
		parsedFrameworkData["Intel"] = {}
		parsedFrameworkData["Comms"] = {}
		parsedFrameworkData["Network"] = {}
		parsedFrameworkData["EDR & AV"] = {}
	}

	//console.log("Framework - update? ", parsedFrameworkData)

	// 0 = automated, 1 = manual

	const elements = []
	const surfaceColor = "#27292D"


	const changeUsecase = (value, type) => {
		//console.log("Value: ", value)	
		if (value === "Draw" && !edgesStarted) {
			setEdgesStarted(true)
			cy.edgehandles({
				handleNodes: (el) => {
					if (el.isNode() &&
					!el.data("isButton") &&
					!el.data("isDescriptor") &&
					el.data("type") !== "COMMENT") {
							return true 
					}

					return false
				},
				preview: true,
				toggleOffOnLeave: true,
				loopAllowed: function (node) {
					return false;
				},
			})

		}

		setSelectedUsecase(value)

		const edges = cy.edges()
		if (edges !== undefined) {
			const allEdges = edges.jsons()
			for (var key in allEdges) {
				const newedge = allEdges[key]
				const foundelement = cy.getElementById(newedge.data.id)
				if (foundelement !== undefined && foundelement !== null) {
					foundelement.remove()
				}
			}
		}

		var found = false

		var parsedType = type === 1 ? "manual" : "automated"
		if (usecases === undefined || usecases === null) {
			return
		}

		const newedges = usecases[value][parsedType]
		for (var key in newedges) {
			newedges[key].label = parseInt(key)+1

			if (newedges[key].description !== undefined && newedges[key].description !== null && newedges[key].description.length > 0) {
				newedges[key].label = (parseInt(key)+1)+" "+newedges[key].description
			}

			cy.add({
				group: "edges", 
				data: newedges[key],
			})
		}

		setGraphDone(true)
	}

	const animationDuration = 150;
	const nodeAddDuration = 2500;

	if (cy !== undefined && cyDone && !animationStarted) {
		const foundelement = cy.getElementById("CASES")

		if (foundelement !== undefined && foundelement !== null) {
			setAnimationStarted(true)

			var parsedStyle = {
				"ghost": "yes",
				"border-color": "#f86a3e",
				"border-width": "10px",
				"border-opacity": ".7",
			}

			var parsedStyle2 = {
				"ghost": "yes",
      			"border-width": "7px",
			}

			/*
			// Animation
			for (var i = 0; i < 10; i++) {
				foundelement.animate(
					{
						style: parsedStyle,
					},
					{
						duration: nodeAddDuration,
					}
				).delay(1000)

				foundelement.animate(
					{
						style: parsedStyle2,
					},
					{
						duration: nodeAddDuration,
					}
				)
			}
			*/
		}
	}

	const onNodeAdded = (event) => {
		//if (event.target.data("animate") === true) {
		//}
	}

	const onNodeHover = (event) => {
    const nodedata = event.target.data();
    	

		const cytoscapeElement = document.getElementById("cytoscape_view")
		if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
			cytoscapeElement.style.cursor = "pointer"
		}

		var parsedStyle = {
      "border-width": "7px",
      "border-opacity": ".7",
    }

    //if (nodedata.type !== "COMMENT") {
    //  parsedStyle.color = "white";
    //}

		if (event.target !== undefined && event.target !== null) {
			event.target.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			);
		}
	}

	const onNodeHoverOut = (event) => {
    const nodedata = event.target.data();
		//console.log("Node OUT: ", nodedata)
		
		const cytoscapeElement = document.getElementById("cytoscape_view")
		if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
			cytoscapeElement.style.cursor = "default"
		}

		var parsedStyle = {
      "border-width": "3px",
			//"cursor": "default",
    }

    event.target.animate(
      {
        style: parsedStyle,
      },
      {
        duration: animationDuration,
      }
    )
	}

	const onNodeUnselect = (event) => {
    var data = event.target.data();
		console.log("UNSELECT: ", data)
			
		var parsedStyle = {
      "border-width": "10px",
      "border-opacity": ".7",
			"border-color": "#7fe57f",
    }

		// Some error here?
		if (event.target !== undefined && event.target !== null) {
			event.target.animate(
				{
					style: parsedStyle,
				},
				{
					duration: animationDuration,
				}
			)

			setTimeout(() => {
				event.target.animate(
					{
						style: {
							"border-width": "3px",
						},
					},
					{
						duration: animationDuration,
					}
				)
			}, 2500)
		}

		//setDiscoveryData({})
		if (setDiscoveryWrapper !== undefined) { 
			setDiscoveryWrapper({})
		}

		setSelectionOpen(false)
		setDefaultSearch("")
		setPaperTitle("")

		//setDiscoveryData({})
	}

	const onNodeSelect = (event) => {
    var data = event.target.data();
		if (data.id === "SHUFFLE") {
			event.target.unselect()
			return
		}

		if (data.label === "EDR & AV") {
			data.label = "ERADICATION"
		}
	
		setDiscoveryData(data)
		setSelectionOpen(true)
		setNewSelectedApp({})

		setDefaultSearch(data.label.charAt(0).toUpperCase()+(data.label.substring(1)).toLowerCase())
	}

  const onEdgeAdded = (event) => {
		//event.target.data("human", false)
	}

  const onEdgeSelect = (event) => {
		console.log(event)

		if (event.target.data("human") === undefined || event.target.data("human") === false) {
			event.target.data("human", true)
		} else if (event.target.data("human") === true) {
      event.target.remove()
			return
			//event.target.data("human", false)
		}

		console.log("Edge selected!", event.target.data())
		event.target.unselect()
	}

	if (graphDone && cyDone === false) {
    cy.fit(null, 200);
    cy.on("select", "edge", (e) => onEdgeSelect(e));
    cy.on("add", "edge", (e) => onEdgeAdded(e));

		cy.on("select", "node", (e) => {
			onNodeSelect(e)
		})
    cy.on("unselect", "node", (e) => {
			onNodeUnselect(e)
		})

		cy.on("mouseover", "node", (e) => {onNodeHover(e)})
    cy.on("mouseout", "node", (e) => onNodeHoverOut(e));
    cy.on("add", "node", (e) => onNodeAdded(e));

		setCyDone(true)
	}

	if (cy !== undefined && cy.elements().length === 0 && parsedFrameworkData !== undefined) {
		//'background-image': 'data(small_image)',
		const shiftradius = 115*scale
		const baselocationX = 285*scale
		const baselocationY = 50*scale
		const shiftmodifier = 3*scale
		//const svgSize = `${40*scale}px`
		//const svgSize = `${40}px`
	
		const foundMiddleImage = userdata !== undefined && userdata !== null && userdata.active_org !== undefined && userdata.active_org.image !== undefined && userdata.active_org.image !== null && userdata.active_org.image !== "" ? userdata.active_org.image : '/images/Shuffle_logo.png'
		
		const siemcheck = parsedFrameworkData.SIEM.large_image === undefined || (parsedFrameworkData.SIEM.name !== undefined && parsedFrameworkData.SIEM.name !== null && parsedFrameworkData.SIEM.name.includes(":default"))
		const iamcheck = parsedFrameworkData.IAM.large_image === undefined || (parsedFrameworkData.IAM.name !== undefined && parsedFrameworkData.IAM.name !== null && parsedFrameworkData.IAM.name.includes(":default")) 
		const casescheck = parsedFrameworkData.Cases.large_image === undefined || (parsedFrameworkData.Cases.name !== undefined && parsedFrameworkData.Cases.name !== null && parsedFrameworkData.Cases.name.includes(":default"))
		const assetscheck = parsedFrameworkData.Assets.large_image === undefined || (parsedFrameworkData.Assets.name !== undefined && parsedFrameworkData.Assets.name !== null && parsedFrameworkData.Assets.name.includes(":default"))
		const intelcheck = parsedFrameworkData.Intel.large_image === undefined || (parsedFrameworkData.Intel.name !== undefined && parsedFrameworkData.Intel.name !== null && parsedFrameworkData.Intel.name.includes(":default"))
		const commscheck = parsedFrameworkData.Comms.large_image === undefined || (parsedFrameworkData.Comms.name !== undefined && parsedFrameworkData.Comms.name !== null && parsedFrameworkData.Comms.name.includes(":default"))
		const edrcheck = parsedFrameworkData["EDR & AV"].large_image === undefined || (parsedFrameworkData["EDR & AV"].name !== undefined && parsedFrameworkData["EDR & AV"].name !== null && parsedFrameworkData["EDR & AV"].name.includes(":default"))
		const networkcheck = parsedFrameworkData.Network.large_image === undefined || (parsedFrameworkData.Network.name !== undefined && parsedFrameworkData.Network.name !== null && parsedFrameworkData.Network.name.includes(":default"))


		const fontSize = `${12*scale}px`
		const defaultSize = `${85*scale}px`
		const iconSize = `${45*scale}px`
		const textMarginDefault = `${14*scale}px`
		const textMarginImage = `${60*scale}px`
		const nodes = [
			{
					group: "nodes",
					data: {
						boxwidth: defaultSize,
						boxheight: defaultSize,
						font_size: fontSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.Cases.name === undefined ? "" : parsedFrameworkData.Cases.name,
						description: parsedFrameworkData.Cases.description === undefined ? "" : parsedFrameworkData.Cases.description,
						app_id: parsedFrameworkData.Cases.id === undefined ? "" : parsedFrameworkData.Cases.id,
						text_margin_y: casescheck ? textMarginDefault : textMarginImage,
						margin_x: casescheck ? `${32*scale}px` : "0px",
						margin_y: casescheck ? `${19*scale}px` : `0px`,
						width: casescheck ? iconSize : defaultSize,
						height: casescheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData.Cases.large_image === undefined ? parsedDatatypeImages()["CASES"] : parsedFrameworkData.Cases.large_image,
							
						label: securityFramework[0].text.toUpperCase(),
						id: securityFramework[0].text.toUpperCase(),
						animate: true,
					},
					renderedPosition: {
						x: baselocationX,
						y: baselocationY,
					}
			},
			{

					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.IAM.name === undefined ? "" : parsedFrameworkData.IAM.name,
						description: parsedFrameworkData.IAM.description === undefined ? "" : parsedFrameworkData.IAM.description,
						app_id: parsedFrameworkData.IAM.id === undefined ? "" : parsedFrameworkData.IAM.id,
						text_margin_y: iamcheck ? textMarginDefault : textMarginImage,
						margin_x: iamcheck ? `${32*scale}px` : "0px",
						margin_y: iamcheck ? `${19*scale}px` : `0px`,
						width: iamcheck ? iconSize : defaultSize,
						height: iamcheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData.IAM.large_image === undefined ? parsedDatatypeImages()["IAM"] : parsedFrameworkData.IAM.large_image,
							
						label: securityFramework[3].text.toUpperCase(),
						id: securityFramework[3].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX+shiftradius+(shiftradius/shiftmodifier),
						y: baselocationY+shiftradius-(shiftradius/shiftmodifier),
					}
			},
			{
					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.Assets.name === undefined ? "" : parsedFrameworkData.Assets.name,
						description: parsedFrameworkData.Assets.description === undefined ? "" : parsedFrameworkData.Assets.description,
						app_id: parsedFrameworkData.Assets.id === undefined ? "" : parsedFrameworkData.Assets.id,
						text_margin_y: assetscheck ? textMarginDefault : textMarginImage,
						margin_x: assetscheck ? `${32*scale}px` : "0px",
						margin_y: assetscheck ? `${19*scale}px` : `0px`,
						width: assetscheck ? iconSize : defaultSize,
						height: assetscheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData.Assets.large_image === undefined ? parsedDatatypeImages()["ASSETS"] : parsedFrameworkData.Assets.large_image,
							
						label: securityFramework[2].text.toUpperCase(), 
						id: securityFramework[2].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX+shiftradius*2,
						y: baselocationY+shiftradius*2,
					}
			},
			{
					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.Intel.name === undefined ? "" : parsedFrameworkData.Intel.name,
						description: parsedFrameworkData.Intel.description === undefined ? "" : parsedFrameworkData.Intel.description,
						app_id: parsedFrameworkData.Intel.id === undefined ? "" : parsedFrameworkData.Intel.id,
						text_margin_y: intelcheck ? textMarginDefault : textMarginImage,
						margin_x: intelcheck ? `${32*scale}px` : "0px",
						margin_y: intelcheck ? `${19*scale}px` : `0px`,
						width: intelcheck ? iconSize : defaultSize,
						height: intelcheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData.Intel.large_image === undefined ? parsedDatatypeImages()["INTEL"] : parsedFrameworkData.Intel.large_image,
							
						label: securityFramework[4].text.toUpperCase(),
						id: securityFramework[4].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX+shiftradius+(shiftradius/shiftmodifier),
						y: baselocationY+shiftradius*3+(shiftradius/shiftmodifier),
					}
			},
			{
					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.Comms.name === undefined ? "" : parsedFrameworkData.Comms.name,
						description: parsedFrameworkData.Comms.description === undefined ? "" : parsedFrameworkData.Comms.description,
						app_id: parsedFrameworkData.Comms.id === undefined ? "" : parsedFrameworkData.Comms.id,
						text_margin_y: commscheck ? textMarginDefault : textMarginImage,
						margin_x: commscheck ? `${32*scale}px` : "0px",
						margin_y: commscheck ? `${19*scale}px` : `0px`,
						width: commscheck ? iconSize : defaultSize,
						height: commscheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData.Comms.large_image === undefined ? parsedDatatypeImages()["COMMS"] : parsedFrameworkData.Comms.large_image,
							
						label: securityFramework[5].text.toUpperCase(), 
						id: securityFramework[5].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX,
						y: baselocationY+shiftradius*4,
					}
			},
			{
					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData["EDR & AV"].name === undefined ? "" : parsedFrameworkData["EDR & AV"].name,
						description: parsedFrameworkData["EDR & AV"].description === undefined ? "" : parsedFrameworkData["EDR & AV"].description,
						app_id: parsedFrameworkData["EDR & AV"].id === undefined ? "" : parsedFrameworkData["EDR & AV"].id,
						text_margin_y: edrcheck ? textMarginDefault : textMarginImage,
						margin_x: edrcheck ? `${32*scale}px` : "0px",
						margin_y: edrcheck ? `${19*scale}px` : `0px`,
						width: edrcheck ? iconSize : defaultSize,
						height: edrcheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData["EDR & AV"].large_image === undefined ? parsedDatatypeImages()["EDR & AV"] : parsedFrameworkData["EDR & AV"].large_image,
							
						label: securityFramework[7].text.toUpperCase(), 
						id: securityFramework[7].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX-shiftradius-(shiftradius/shiftmodifier),
						y: baselocationY+shiftradius*3+(shiftradius/shiftmodifier),
					}
			},
			{
					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.Network.name === undefined ? "" : parsedFrameworkData.Network.name,
						description: parsedFrameworkData.Network.description === undefined ? "" : parsedFrameworkData.Network.description,
						app_id: parsedFrameworkData.Network.id === undefined ? "" : parsedFrameworkData.Network.id,
						text_margin_y: networkcheck  ? textMarginDefault : textMarginImage,
						margin_x: 	  networkcheck ? `${32*scale}px` : "0px",
						margin_y: 	  networkcheck ? `${19*scale}px` : `0px`,
						width: 		  networkcheck ? iconSize : defaultSize,
						height: 	  networkcheck ? iconSize : defaultSize,
						large_image:  parsedFrameworkData.Network.large_image === undefined ? parsedDatatypeImages()["NETWORK"] :  parsedFrameworkData.Network.large_image,
						label:  securityFramework[6].text.toUpperCase(),
						id: securityFramework[6].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX-shiftradius*2,
						y: baselocationY+shiftradius*2,
					}
			},
			{
					group: "nodes",
					data: {
						font_size: fontSize,
						boxwidth: defaultSize,
						boxheight: defaultSize,
						is_valid: true,
						isValid: true,
						errors: [],
						name: parsedFrameworkData.SIEM.name === undefined ? "" : parsedFrameworkData.SIEM.name,
						description: parsedFrameworkData.SIEM.description === undefined ? "" : parsedFrameworkData.SIEM.description,
						app_id: parsedFrameworkData.SIEM.id === undefined ? "" : parsedFrameworkData.SIEM.id,
						text_margin_y: siemcheck ? textMarginDefault : textMarginImage,
						margin_x: siemcheck ? `${32*scale}px` : "0px",
						margin_y: siemcheck ? `${19*scale}px` : `0px`,
						width: siemcheck ? iconSize : defaultSize,
						height: siemcheck ? iconSize : defaultSize,
						large_image: parsedFrameworkData.SIEM.large_image === undefined ? parsedDatatypeImages()["SIEM"] : parsedFrameworkData.SIEM.large_image,
						label: securityFramework[1].text.toUpperCase(),
						id: securityFramework[1].text.toUpperCase(),
						animate: false,
					},
					renderedPosition: {
						x: baselocationX-shiftradius-(shiftradius/shiftmodifier),
						y: baselocationY+shiftradius-(shiftradius/shiftmodifier),
					}
			},
		]

		// Middlenode
		nodes.push({
				group: "nodes",
				data: {
					font_size: fontSize,
					width: defaultSize,
					height: defaultSize,
					id: "SHUFFLE",
					is_valid: true,
					isValid: true,
					errors: [],
					middle_node: true,
					large_image: foundMiddleImage,
				},
				renderedPosition: {
					x: baselocationX,
					y: baselocationY+shiftradius*2,
				}
		})

		// Extra nodes
		nodes.push({
				group: "nodes",
				data: {
					is_valid: true,
					isValid: true,
					errors: [],
					large_image: encodeURI(`data:image/svg+xml;utf-8,<svg fill="rgb(248,90,62)" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M6.93767 0C8.71083 0 10.4114 0.704386 11.6652 1.9582C12.919 3.21202 13.6234 4.91255 13.6234 6.68571C13.6234 8.34171 13.0165 9.864 12.0188 11.0366L12.2965 11.3143H13.1091L18.252 16.4571L16.7091 18L11.5662 12.8571V12.0446L11.2885 11.7669C10.116 12.7646 8.59367 13.3714 6.93767 13.3714C5.16451 13.3714 3.46397 12.667 2.21015 11.4132C0.956339 10.1594 0.251953 8.45888 0.251953 6.68571C0.251953 4.91255 0.956339 3.21202 2.21015 1.9582C3.46397 0.704386 5.16451 0 6.93767 0ZM6.93767 2.05714C4.36624 2.05714 2.3091 4.11429 2.3091 6.68571C2.3091 9.25714 4.36624 11.3143 6.93767 11.3143C9.5091 11.3143 11.5662 9.25714 11.5662 6.68571C11.5662 4.11429 9.5091 2.05714 6.93767 2.05714Z" />,
					</svg>`),
					id: "TOP_LEFT",
					invisible: true,
				},
				renderedPosition: {
					x: baselocationX-shiftradius*2.5,
					y: baselocationY-50,
				}
		})
		nodes.push({
				group: "nodes",
				data: {
					is_valid: true,
					isValid: true,
					errors: [],
					large_image: encodeURI(`data:image/svg+xml;utf-8,<svg fill="rgb(248,90,62)" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M6.93767 0C8.71083 0 10.4114 0.704386 11.6652 1.9582C12.919 3.21202 13.6234 4.91255 13.6234 6.68571C13.6234 8.34171 13.0165 9.864 12.0188 11.0366L12.2965 11.3143H13.1091L18.252 16.4571L16.7091 18L11.5662 12.8571V12.0446L11.2885 11.7669C10.116 12.7646 8.59367 13.3714 6.93767 13.3714C5.16451 13.3714 3.46397 12.667 2.21015 11.4132C0.956339 10.1594 0.251953 8.45888 0.251953 6.68571C0.251953 4.91255 0.956339 3.21202 2.21015 1.9582C3.46397 0.704386 5.16451 0 6.93767 0ZM6.93767 2.05714C4.36624 2.05714 2.3091 4.11429 2.3091 6.68571C2.3091 9.25714 4.36624 11.3143 6.93767 11.3143C9.5091 11.3143 11.5662 9.25714 11.5662 6.68571C11.5662 4.11429 9.5091 2.05714 6.93767 2.05714Z" />,
					</svg>`),
					id: "BOTTOM_LEFT",
					invisible: true,
				},
				renderedPosition: {
					x: baselocationX-shiftradius*2.5-10,
					y: baselocationY+shiftradius*4-10,
				}
		})
		nodes.push({
				group: "nodes",
				data: {
					is_valid: true,
					isValid: true,
					errors: [],
					large_image: encodeURI(`data:image/svg+xml;utf-8,<svg fill="rgb(248,90,62)" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M6.93767 0C8.71083 0 10.4114 0.704386 11.6652 1.9582C12.919 3.21202 13.6234 4.91255 13.6234 6.68571C13.6234 8.34171 13.0165 9.864 12.0188 11.0366L12.2965 11.3143H13.1091L18.252 16.4571L16.7091 18L11.5662 12.8571V12.0446L11.2885 11.7669C10.116 12.7646 8.59367 13.3714 6.93767 13.3714C5.16451 13.3714 3.46397 12.667 2.21015 11.4132C0.956339 10.1594 0.251953 8.45888 0.251953 6.68571C0.251953 4.91255 0.956339 3.21202 2.21015 1.9582C3.46397 0.704386 5.16451 0 6.93767 0ZM6.93767 2.05714C4.36624 2.05714 2.3091 4.11429 2.3091 6.68571C2.3091 9.25714 4.36624 11.3143 6.93767 11.3143C9.5091 11.3143 11.5662 9.25714 11.5662 6.68571C11.5662 4.11429 9.5091 2.05714 6.93767 2.05714Z" />,
					</svg>`),
					id: "BOTTOM_RIGHT",
					invisible: true,
				},
				renderedPosition: {
					x: baselocationX+shiftradius*2+50,
					y: baselocationY+shiftradius*4+50,
				}
		})
		nodes.push({
				group: "nodes",
				data: {
					is_valid: true,
					isValid: true,
					errors: [],
					large_image: encodeURI(`data:image/svg+xml;utf-8,<svg fill="rgb(248,90,62)" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<path d="M6.93767 0C8.71083 0 10.4114 0.704386 11.6652 1.9582C12.919 3.21202 13.6234 4.91255 13.6234 6.68571C13.6234 8.34171 13.0165 9.864 12.0188 11.0366L12.2965 11.3143H13.1091L18.252 16.4571L16.7091 18L11.5662 12.8571V12.0446L11.2885 11.7669C10.116 12.7646 8.59367 13.3714 6.93767 13.3714C5.16451 13.3714 3.46397 12.667 2.21015 11.4132C0.956339 10.1594 0.251953 8.45888 0.251953 6.68571C0.251953 4.91255 0.956339 3.21202 2.21015 1.9582C3.46397 0.704386 5.16451 0 6.93767 0ZM6.93767 2.05714C4.36624 2.05714 2.3091 4.11429 2.3091 6.68571C2.3091 9.25714 4.36624 11.3143 6.93767 11.3143C9.5091 11.3143 11.5662 9.25714 11.5662 6.68571C11.5662 4.11429 9.5091 2.05714 6.93767 2.05714Z" />,
					</svg>`),
					id: "TOP_RIGHT",
					invisible: true,
				},
				renderedPosition: {
					x: baselocationX+shiftradius*2,
					y: baselocationY-150,
				}
		})

		//console.log("NODES: " , nodes)
		for (var key in nodes) {
			cy.add(nodes[key]).lock()
		}

		changeUsecase(selectedUsecase, usecaseType)

		if (inputUsecase !== undefined && inputUsecase !== null) {
			for (var key in inputUsecase.process) {
				if (inputUsecase.process[key].source === "" || inputUsecase.process[key].target === "") {
					continue
				}

				inputUsecase.process[key].label = parseInt(key)+1
				inputUsecase.process[key].id = uuidv4();

				cy.add({
					group: "edges", 
					data: inputUsecase.process[key],
				})
			}
			//changeUsecase(inputUsecase, 0)
			//setSelectedUsecase(value)
		}
	}

	if (selectedOption !== undefined && selectedUsecase !== selectedOption) {
		setSelectedUsecase(selectedOption)
		changeUsecase(selectedOption, usecaseType) 
	}

	const UsecaseHandler = (props) => {
		const { data, index, diff } = props

		const leftImage = data.left_image !== undefined ? parsedDatatypeImages()[data.left_image.toUpperCase()] : undefined
		const rightImage = data.right_image !== undefined ? parsedDatatypeImages()[data.right_image.toUpperCase()] : undefined

		if (leftImage === undefined) {
			console.log("LEFT MISSING: ", leftImage)
		}

		if (rightImage === undefined) {
			console.log("Right MISSING: ", rightImage)
		}

		const parsedRightImage = <img src={rightImage} style={{position: "absolute", top: 15, left: 22,}} alt="" />
		const parsedRightText = <div style={{position: "absolute", top: 40, textAlign: "center", width: 65, margin: "auto",}}><Typography color="textSecondary" style={{textAlign: "center", fontSize: 12, }}>{data.right_text}</Typography></div>

		const parsedLeftImage = <img src={leftImage} style={{position: "absolute", top: 15, left: 22,}} alt="" />
		const parsedLeftText = <div style={{position: "absolute", top: 40, textAlign: "center", width: 65, margin: "auto",}}><Typography color="textSecondary" style={{textAlign: "center", fontSize: 12,}}>{data.left_text}</Typography></div>

		var svgIcon = <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1 4H15.2772" stroke="#AFAFAF" stroke-linecap="round"/>
			<path d="M13 1L16 4" stroke="#AFAFAF" stroke-linecap="round"/>
			<path d="M12.7856 7L15.9999 4" stroke="#AFAFAF" stroke-linecap="round"/>
			<path d="M16 13L1.72276 13" stroke="#AFAFAF" stroke-linecap="round"/>
			<path d="M4.21436 16L1.00007 13" stroke="#AFAFAF" stroke-linecap="round"/>
			<path d="M4.21436 10L1.00007 13" stroke="#AFAFAF" stroke-linecap="round"/>
		</svg>

		if (data.direction === "right") {
			svgIcon = <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M0.847656 4.16553H14.1479" stroke="#AFAFAF" stroke-linecap="round"/>
				<path d="M11.8268 1.37085L14.8211 4.16556" stroke="#AFAFAF" stroke-linecap="round"/>
				<path d="M11.8268 6.96024L14.8211 4.16553" stroke="#AFAFAF" stroke-linecap="round"/>
			</svg>
		} else if (data.direction === "left") {
			svgIcon = <svg width="16" height="8" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M14.5031 4.16577L1.20278 4.16577" stroke="#AFAFAF" stroke-linecap="round"/>
				<path d="M3.52393 6.96045L0.529589 4.16573" stroke="#AFAFAF" stroke-linecap="round"/>
				<path d="M3.52393 1.37106L0.529589 4.16577" stroke="#AFAFAF" stroke-linecap="round"/>
			</svg>

		}

		//<img alt={"usecase_directional_arrow_"+index} style={{height: 30, width: 30}} src={parsedDirectionImage} />
		//
		const handleHover = () => {
			//console.log("Hover IN: ", data.automated)

			const allEdges = cy.edges().jsons()
			for (var key in allEdges) {
				const newedge = allEdges[key]
				const foundelement = cy.getElementById(newedge.data.id)
				if (foundelement !== undefined && foundelement !== null) {
					foundelement.remove()
				}
			}

			//const newedges = usecases[value][parsedType]
			for (var key in data.automated) {
				data.automated[key].label = parseInt(key)+1

				if (data.automated[key].description !== undefined && data.automated[key].description !== null && data.automated[key].description.length > 0) {
					data.automated[key].label = (parseInt(key)+1)+" "+data.automated[key].description
				}

				cy.add({
					group: "edges", 
					data: data.automated[key],
				})
			}
		}

		const handleHoverOut = () => {
			//console.log("Hover out: ", data.automated)
			//const allEdges = cy.edges().jsons()
			//for (var key in allEdges) {
			//	const newedge = allEdges[key]
			//	const foundelement = cy.getElementById(newedge.data.id)
			//	if (foundelement !== undefined && foundelement !== null) {
			//		foundelement.remove()
			//	}
			//}
		}

		const bgColor = color === undefined || color === null || color.length === 0 ? theme.palette.surfaceColor : color
		console.log("BGCOLOR: ", bgColor)

		return (
				<Paper style={{marginBottom: 15, width: 250, maxHeight: 400, overflow: "hidden", zIndex: 12500, padding: 15, backgroundColor: bgColor, border: "1px solid rgba(255,255,255,0.2)", }} onMouseOver={handleHover} onMouseOut={handleHoverOut}>
					<Typography style={{textAlign: "center"}}>
						{data.name}
					</Typography>
					<div style={{display: "flex", width: 200, margin: "auto", marginTop: 15, }}>
						<div style={{backgroundColor: theme.palette.inputColor, height: 75, width: 75, borderRadius: theme.palette?.borderRadius, border: "1px solid rgba(255,255,255,0.7)", marginRight: 15, position: "relative",}}>
							{parsedLeftImage}
							{parsedLeftText}
						</div>
						<div style={{backgroundColor: theme.palette.inputColor, maxHeight: 30, maxWidth: 30, height: 30, width: 30, borderRadius: theme.palette?.borderRadius, border: "1px solid rgba(255,255,255,0.7)", marginTop: 22, padding: "10px 0px 0px 9px",}}>
							{svgIcon}
						</div>
						<div style={{backgroundColor: theme.palette.inputColor, height: 75, width: 75, borderRadius: theme.palette?.borderRadius, border: "1px solid rgba(255,255,255,0.7)", marginLeft: 15, position: "relative",}}>
							{parsedRightImage}
							{parsedRightText}
						</div>
					</div>
				</Paper>

		)
	}

	const selectedUsecases = [
	{
		"name": "Sync tickets",
		"description": "Do cool shit weeeee - this just ensure they are syncing",
		"left_text": "Cases",
		"right_text": "Cases",
		"left_image": "Cases",
		"right_image": "Cases",
		"direction": "both",
		"manual": [],
		"automated": [
			{
				"source":	"CASES",
				"target":	"SHUFFLE",
				"description": "Get cases",
				"human": false,
			},
			{
				"source":	"SHUFFLE",
				"target":	"CASES",
				"description": "Update cases",
				"human": false,
			},
		]
	},
	{
		"name": "Forward alerts with enrichment",
		"description": "Do cool shit weeeee - this just ensure they are syncing",
		"left_text": "EDR & AV",
		"right_text": "Cases",
		"left_image": "EDR & AV",
		"right_image": "Cases",
		"direction": "right",
		"manual": [],
		"automated": [
			{
				"source":	"BOTTOM_LEFT",
				"target":	"COMMS",
				"description": "Email received",
				"human": false,
			},
		]
	}
	]

	const getNodeName = (category) => {
		if (category === "email") {
			category = "COMMS"
		} else if (category === "edr") {
			category = "EDR & AV"
		} 

		return category.toUpperCase() 
	}

	//autounselectify={true}
	var usecasediff = -100
	const bgColor = color === undefined || color === null || color.length === 0 ? theme.palette.surfaceColor : color
	return (	
		<div style={{margin: "auto", backgroundColor: bgColor, position: "relative", }}>
			{/*
			<div style={{position: "absolute"}}>

				<SuggestedWorkflows 
					globalUrl={globalUrl}
					userdata={userdata}
					frameworkData={frameworkData}
					usecaseSuggestions={frameworkSuggestions}
					setUsecaseSuggestions={setFrameworkSuggestions}
					inputSearch={changedApp}
					apps={apps}
				/>

			</div>
			*/}

			{/*injectedApps.map((apps, appindex) => {
				var categoryTop = 100
				var categoryLeft = 100

				const category = apps[0].category
				if (category === "edr") {
					categoryTop = 355 
					categoryLeft = 50 
				} else if (category === "siem") {
					categoryTop = 95
					categoryLeft = 50 
				} else if (category === "cases") {
					categoryTop = 65 
					categoryLeft = 175 
				} else if (category === "intel") {
					categoryTop = 355
					categoryLeft = 315
				} else if (category === "comms") {
					categoryTop = 415 
					categoryLeft = 175 
				} else if (category === "iam") {
					categoryTop = 95
					categoryLeft = 315
				} else {
					return null
				}

				const scale = 0.9
				const offsetTop = -70
				const offsetLeft = 0 
				return (
					<div key={appindex} style={{display: "flex", position: "absolute", top: categoryTop+offsetTop, left: categoryLeft+offsetLeft,  zIndex: 10010, }}>
						{apps.map((app, appIndex) => {
							return (
								<Chip
									avatar={<Avatar alt={app.name} src={app.image_url} style={{backgroundColor: "white", }} />}
									key={app.id}
									label={""}
									variant="contained"
									style={{}}
									onClick={() => {
										console.log("Add app to framework and remove category: ", app)
										app.objectID = app.id
										app.type = app.category
										app.large_image = app.image_url

										const nodename = getNodeName(app.category)


										const foundelement = cy.getElementById(nodename)
										console.log("FOUND: ", foundelement)
										if (foundelement !== undefined && foundelement !== null) {
											foundelement.data("large_image", app.image_url)
											foundelement.data("margin_x", "0px")
											foundelement.data("margin_y", "0px")
											foundelement.data("text_margin_y", `${60*scale}px`)
											foundelement.data("width", `${85*scale}px`)
											foundelement.data("height", `${85*scale}px`)
										}
										
										if (setFrameworkData !== undefined) {
											// Find discoveryData.id
											var keys = []
											for (const [key, value] of Object.entries(frameworkData)) {
												if (key.toLowerCase() === app.category.toLowerCase()) {
													keys.push(key)
												}
											}

											if (keys.length === 0) {
												console.log("Failed to find: ", app.category, " IN ", frameworkData)
											} else {
												console.log("In else for keys: ", frameworkData, keys)
												for (var key in keys) {
													frameworkData[keys[key]] = app 
												}

												setFrameworkData(frameworkData)
												showRecommendations(app.category, frameworkData)
											}
										}

										setFrameworkItem(app) 
									}}
								/>
							)
						})}
					</div>
				)
			})*/}

			{showOptions === false ? null : 
				<div style={{textAlign: "center",}}>
					{Object.keys(usecases).map((data, index) => {
						return(
							<Button key={index} color="primary" variant={selectedUsecase === data ? "contained" : "outlined"} style={{margin: 5, }} onClick={() => {
								changeUsecase(data, usecaseType)
							}}>
								{data}
							</Button>
						)
					})}
				</div>
			}
  		{/*
				Object.getOwnPropertyNames(discoveryData).length > 0 ? 
					<div style={{position: "absolute", top: 20, right: 50, }}>
						<Typography variant="h6" color="textPrimary" style={{marginBottom: 10, textAlign: "center",}}>
							Use-cases
						</Typography>
						{selectedUsecases.map((data, index) => {
							usecasediff += 175

							return (
								<UsecaseHandler data={data} index={index} key={index} diff={usecasediff} />
							)
						})}
					</div>
				: null*/}

  		{
				Object.getOwnPropertyNames(discoveryData).length > 0 ? 
					<Paper style={{width: 300, maxHeight: 400, overflow: "hidden", zIndex: 12500, padding: 25, paddingRight: 25, backgroundColor: theme.palette.surfaceColor, border: "1px solid rgba(255,255,255,0.2)", position: "absolute", top: -50, left: isMobile?-50: 50, }}>
						{paperTitle.length > 0 ? 
							<span>
								<Typography variant="h6" style={{textAlign: "center"}}>
									{paperTitle.replace("_", " ", -1)}
								</Typography>
								<Divider style={{marginTop: 5, marginBottom: 5 }} />
							</span>
						: null}
						<Tooltip
							title="Close window"
							placement="top"
							style={{ zIndex: 10011 }}
						>
							<IconButton
								style={{ zIndex: 12501, position: "absolute", top: 10, right: 10}}
								onClick={(e) => {
									//cy.elements().unselectify();
									cy.elements().unselect()

									e.preventDefault();
									setDiscoveryData({})
									setDefaultSearch("")
									setPaperTitle("")
								}}
							>
								<CloseIcon style={{ color: "white", height: 15, width: 15, }} />
							</IconButton>
						</Tooltip>
						<Tooltip
							title="Unselect app"
							placement="top"
							style={{ zIndex: 10011 }}
						>
							<IconButton
								style={{ zIndex: 12501, position: "absolute", top: 32, right: 10}}
								onClick={(e) => {
									e.preventDefault();
									setDiscoveryData({
										"id": discoveryData.id,
										"label": discoveryData.label,
										"name": ""
									})

									setNewSelectedApp({
										"animate": false,
										"app_id": "",
										"boxheight": "66.3px",
										"boxwidth": "66.3px",
										"description": "",
										"errors": [],
										"font_size": "9.36px",
										"height": "66.3px",
										"id": "",
										"isValid": true,
										"is_valid": true,
										"label": "SIEM",
										"large_image": "asd",
										"margin_x": "0px",
										"margin_y": "0px",
										"name": "",
										"text_margin_y": "46.800000000000004px",
										"width": "66.3px",
										"objectID": "remove",
									})

									setSelectionOpen(true)
									setDefaultSearch("")
		
									//handleLoadNextSuggestion(frameworkData) 
									setInjectedApps([])

									const foundelement = cy.getElementById(discoveryData.id)
									if (foundelement !== undefined && foundelement !== null) {
										//console.log("element: ", foundelement)
										//console.log("DISC: ", discoveryData)
										foundelement.data("large_image", parsedDatatypeImages()[discoveryData.id.toUpperCase()])
										foundelement.data("text_margin_y", "14px")
										foundelement.data("margin_x", "32px")
										foundelement.data("margin_y", "19x")
										foundelement.data("width", "45px")
										foundelement.data("height", "45px")
									}

									setTimeout(() => {
										setDiscoveryData({})
										setNewSelectedApp({})
									}, 1000)
								}}
							>
								<DeleteIcon style={{ color: "white", height: 15, width: 15, }} />
							</IconButton>
						</Tooltip>
						<div style={{display: "flex"}}>
							{discoveryData.name !== undefined && discoveryData.name !== null && discoveryData.name.length > 0 ? 
								<div style={{border: "1px solid rgba(255,255,255,0.2)", borderRadius: 25, height: 40, width: 40, textAlign: "center", overflow: "hidden",}}>

									<img alt={discoveryData.id} src={newSelectedApp.image_url !== undefined && newSelectedApp.image_url !== null && newSelectedApp.image_url.length > 0 ? newSelectedApp.image_url : discoveryData.large_image} style={{height: 40, width: 40, margin: "auto",}}/>
								</div>
							: 
								<img alt={discoveryData.id} src={discoveryData.large_image} style={{height: 40,}}/>
							}
							<Typography variant="body1" style={{marginLeft: 10, marginTop: 6}}>
								{discoveryData.name !== undefined && discoveryData.name !== null && discoveryData.name.length > 0 ? 
									discoveryData.name
									: 
									newSelectedApp.name !== undefined && newSelectedApp.name !== null && newSelectedApp.name.length > 0 ?
										newSelectedApp.name
										: 
										`Find your ${discoveryData.label} app!`
								}
							</Typography>
						</div>
						<div>
							{discoveryData !== undefined && discoveryData.name !== undefined && discoveryData.name !== null && discoveryData.name.length > 0 ? 
								<span>
									<Typography variant="body2" color="textSecondary" style={{marginTop: 10, marginBottom: 10, maxHeight: 75, overflowY: "auto", overflowX: "hidden", }}>
										{discoveryData.description}
									</Typography>
									{/*isCloud && defaultSearch !== undefined && defaultSearch.length > 0 ? 
										{<
											newSelectedApp={newSelectedApp}
											setNewSelectedApp={setNewSelectedApp}
											defaultSearch={defaultSearch}
										/>}
										: 
										null
									*/}
								</span>
							: 
								selectionOpen 
									? 
									<span>
										<Typography variant="body2" color="textSecondary" style={{marginTop: 10}}>
											Search to find your app 
										</Typography>
									</span>
									:
									<Button
										variant="contained"
										color="primary"
										style={{marginTop: 10, }}
										onClick={() => {
											setSelectionOpen(true)
											setDefaultSearch(discoveryData.label)
										}}
									>
										Choose {discoveryData.label} app
									</Button>
							}
						</div>
						<div style={{marginTop: 10}}>
							{selectionOpen ? 
								<AppSearch
									defaultSearch={defaultSearch}
									newSelectedApp={newSelectedApp}
									setNewSelectedApp={setNewSelectedApp}
									userdata={userdata}
									cy={cy}
								/>
							: null}
						</div>
					</Paper>
					: null
			}
			<CytoscapeComponent 
				elements={elements} 
				minZoom={0.35}
				maxZoom={2.00}
				style={{width: isMobile?null:560*scale, height: 560*scale, backgroundColor: theme.palette.backgroundColor, margin: isMobile?null:"auto",}} 
				stylesheet={frameworkStyle}
				boxSelectionEnabled={false}
				panningEnabled={false}
				userPanningEnabled={false}
				showGrid={false}
				id="cytoscape_view"
				cy={(incy) => {
					// FIXME: There's something specific loading when
					// you do the first hover of a node. Why is this different?
					//console.log("CY: ", incy)
					setCy(incy)
				}}
			/>
			{isCloud && inputUsecase !== undefined && inputUsecase !== null && isLoggedIn === true && Object.keys(inputUsecase).length > 0 ? 
				<Button  color="secondary" variant={"outlined"} style={{position: "absolute", bottom: -10, right: 0,}} onClick={() => {
					setUsecaseItem(inputUsecase) 
				}}>
					Save
				</Button>
			: null}
		</div>
	)
}

export default AppFramework;
