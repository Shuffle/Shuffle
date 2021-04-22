import React, {useState} from 'react';

import {Typography, } from '@material-ui/core';

const Workflow = (props) => {
	const { workflow, appAuthentication, apps } = props
	const [requiredActions, setRequiredActions] = React.useState([])
	const [firstLoad, setFirstLoad] = React.useState("")
	
	// Rofl
	if (workflow === undefined || workflow === null) {
		return null
	}

	if (apps === undefined || apps === null) {
		return null
	}

	if (appAuthentication === undefined || appAuthentication === null) {
		return null
	}

	if (firstLoad.length === 0 || firstLoad !== workflow.id) {
		setFirstLoad(workflow.id)
		const newactions = []
		for (var key in workflow.actions) {
			var newaction = {
				"large_image": "",
				"app_name": "",
				"app_version": "",
				"must_activate": false,
				"must_authenticate": false,
				"action_ids": [],
			}

			const action = workflow.actions[key]
			console.log(action)
				const app = apps.find(app => app.name === action.app_name && app.app_version === action.app_version)
			if (app === undefined || app === null) {
				console.log("COULDNT FIND APP - SEARCH BACKEND")

				newaction.app_name = action.app_name
				newaction.app_version = action.app_version
			} else {
				newaction.app_name = app.name
				newaction.app_version = app.app_version

				console.log("APP: ", app)
				if (action.authentication_id === "" && app.authentication.required === true) {
					console.log("Requires auth!")
					newaction.must_authenticate = true
					newaction.action_ids.push(action.id)
				}

				//newaction.app_name = action.app_name
				//newaction.app_name = action.app_version
			}

			if (action.errors !== undefined && action.errors !== null && action.errors.length > 0) {
				console.log("Has errors!")
			}

			console.log("NEWACTION: ", newaction)
			if (newaction.must_authenticate || newaction.must_activate) {
				newactions.push(newaction)
			}
		}

		console.log("ACTIONS: ", newactions)
		setRequiredActions(newactions)
	}

	const AppSection = (props) => {
		const {action} = props

		return (
			<div>
				<Typography variant="body2">Name: {action.app_name}:{action.app_version}. </Typography>
			</div>
		)
	}

	console.log(requiredActions)

	return (
		<div>
			<Typography variant="h6">Workflow: {workflow.id}</Typography>
			{requiredActions.map((data, index) => {
				return (
					<AppSection key={index} action={data} />
				)
			})}
		</div>
	)
}

export default Workflow 
