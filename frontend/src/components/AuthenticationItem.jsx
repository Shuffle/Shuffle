import React, { useState, useEffect } from "react";

import theme from '../theme.jsx';
import { toast } from 'react-toastify';

import {
	Tooltip,
	IconButton,
	ListItem,
	ListItemText,
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
	Zoom,
} from "@mui/material";

import {
  Edit as EditIcon,
	Delete as DeleteIcon,
	SelectAll as SelectAllIcon,
} from "@mui/icons-material";

const AuthenticationItem = (props) => {
		const { data, index, globalUrl, getAppAuthentication } = props

		const [selectedAuthentication, setSelectedAuthentication] = React.useState({})
		const [selectedAuthenticationModalOpen, setSelectedAuthenticationModalOpen] = React.useState(false);
  	const [authenticationFields, setAuthenticationFields] = React.useState([]);

  	//const alert = useAlert();
		var bgColor = "#27292d";
		if (index % 2 === 0) {
			bgColor = "#1f2023";
		}

		//console.log("Auth data: ", data)
		if (data.type === "oauth2") {
			data.fields = [
				{
					key: "url",
					value: "Secret. Replaced during app execution!",
				},
				{
					key: "client_id",
					value: "Secret. Replaced during app execution!",
				},
				{
					key: "client_secret",
					value: "Secret. Replaced during app execution!",
				},
				{
					key: "scope",
					value: "Secret. Replaced during app execution!",
				},
			];
		}

		const deleteAuthentication = (data) => {
			toast("Deleting auth " + data.label);

			// Just use this one?
			const url = globalUrl + "/api/v1/apps/authentication/" + data.id;
			console.log("URL: ", url);
			fetch(url, {
				method: "DELETE",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			})
				.then((response) =>
					response.json().then((responseJson) => {
						console.log("RESP: ", responseJson);
						if (responseJson["success"] === false) {
							toast("Failed deleting auth");
						} else {
							// Need to wait because query in ES is too fast
							setTimeout(() => {
								getAppAuthentication();
							}, 1000);
							//toast("Successfully deleted authentication!")
						}
					})
				)
				.catch((error) => {
					console.log("Error in userdata: ", error);
				});
		}

		const editAuthenticationConfig = (id) => {
  	  const data = {
  	    id: id,
  	    action: "assign_everywhere",
  	  };
  	  const url = globalUrl + "/api/v1/apps/authentication/" + id + "/config";

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
  	          toast("Failed overwriting appauth in workflows");
  	        } else {
  	          toast("Successfully updated auth everywhere!");
  	          //setSelectedUserModalOpen(false);
  	          setTimeout(() => {
  	            getAppAuthentication();
  	          }, 1000);
  	        }
  	      })
  	    )
  	    .catch((error) => {
  	      toast("Err: " + error.toString());
  	    });
  	};

		const updateAppAuthentication = (field) => {
			setSelectedAuthenticationModalOpen(true);
			setSelectedAuthentication(field);
			//{selectedAuthentication.fields.map((data, index) => {
			var newfields = [];
			for (var key in field.fields) {
				newfields.push({
					key: field.fields[key].key,
					value: "",
				});
			}
			setAuthenticationFields(newfields);
		}

		return (
			<ListItem key={index} style={{ backgroundColor: bgColor }}>
				<ListItemText
					primary=<img
						alt=""
						src={data.app.large_image}
						style={{
							maxWidth: 50,
							borderRadius: theme.palette?.borderRadius,
						}}
					/>
					style={{ minWidth: 75, maxWidth: 75 }}
				/>
				<ListItemText
					primary={data.label}
					style={{
						minWidth: 225,
						maxWidth: 225,
						overflow: "hidden",
					}}
				/>
				<ListItemText
					primary={data.app.name}
					style={{ minWidth: 175, maxWidth: 175, marginLeft: 10 }}
				/>
				{/*
				<ListItemText
					primary={data.defined === false ? "No" : "Yes"}
					style={{ minWidth: 100, maxWidth: 100, }}
				/>
				*/}
				<ListItemText
					primary={
						data.workflow_count === null ? 0 : data.workflow_count
					}
					style={{
						minWidth: 100,
						maxWidth: 100,
						textAlign: "center",
						overflow: "hidden",
					}}
				/>
				{/*
				<ListItemText
					primary={data.node_count}
					style={{
						minWidth: 110,
						maxWidth: 110,
						textAlign: "center",
						overflow: "hidden",
					}}
				/>
				*/}
				<ListItemText
					primary={
						data.fields === null || data.fields === undefined
							? ""
							: data.fields
									.map((data) => {
										return data.key;
									})
									.join(", ")
					}
					style={{
						minWidth: 125,
						maxWidth: 125,
						overflow: "hidden",
					}}
				/>
				<ListItemText
					style={{
						maxWidth: 230,
						minWidth: 230,
						overflow: "hidden",
					}}
						primary={new Date(data.created * 1000).toISOString()}
					/>
					<ListItemText>
						<IconButton
							onClick={() => {
								updateAppAuthentication(data);
							}}
						>
							<EditIcon color="primary" />
						</IconButton>
						{data.defined ? (
							<Tooltip
								color="primary"
								title="Set in EVERY workflow"
								placement="top"
							>
								<IconButton
									style={{ marginRight: 10 }}
									disabled={data.defined === false}
									onClick={() => {
										editAuthenticationConfig(data.id);
									}}
								>
									<SelectAllIcon
										color={data.defined ? "primary" : "secondary"}
									/>
								</IconButton>
							</Tooltip>
						) : (
							<Tooltip
								color="primary"
								title="Must edit before you can set in all workflows"
								placement="top"
							>
								<IconButton
									style={{ marginRight: 10 }}
									onClick={() => {}}
								>
									<SelectAllIcon
										color={data.defined ? "primary" : "secondary"}
									/>
								</IconButton>
							</Tooltip>
						)}
						<IconButton
							onClick={() => {
								deleteAuthentication(data);
							}}
						>
							<DeleteIcon color="primary" />
						</IconButton>
					</ListItemText>
				</ListItem>
			)
	}

export default AuthenticationItem 
