import React, { useMemo, useState, useEffect, useContext, memo } from "react";
import { toast } from 'react-toastify';
import { getTheme } from "../theme.jsx";
import { Context } from "../context/ContextApi.jsx";
import ReactJson from "react-json-view-ssr";
import { GetIconInfo, collapseField, } from "../views/Workflows2.jsx";
import defaultCytoscapeStyle from "../defaultCytoscapeStyle.jsx";
import { v4 as uuidv4, } from "uuid";

import {
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";

import {
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";

//import spread from "cytoscape-spread";
import BubbleSets from 'cytoscape-bubblesets';
import coseBilkent from 'cytoscape-cose-bilkent';

cytoscape.use(coseBilkent)
cytoscape.use(BubbleSets)
const svgSize = 24;


// Uses correlations between locations to build a graph around relationships
// In the background, this is stored in the datastore_ngram index
const CorrelationGraph = (props) => {
	const { globalUrl, userdata, datastoreData, } = props;

    const {themeMode, supportEmail, brandColor} = useContext(Context)
    const theme = getTheme(themeMode, brandColor)

	const [relations, setRelations] = useState(null);
    const [cy, setCy] = React.useState();
	const [correlations, setCorrelations] = useState([])
	const [visualisedData, setVisualisedData] = useState(undefined)
	const [selectedData, setselectedData] = useState(undefined)
	const [startNode, setStartNode] = useState(undefined)
	const [bb, setBb] = useState(undefined)
	const [handledKeys, setHandledKeys] = useState([])

  	const cystyle = useMemo(() => defaultCytoscapeStyle(theme), [themeMode]);
	const spreadLayout = {
		name: 'cose-bilkent',
		nodeRepulsion: 12500,
		idealEdgeLength: 200,
		gravity: 0.40,
		numIter: 10000,      
		animationDuration: 500,
		fit: true,

		animate: true,
	}

	const loadCorrelations = (datastoreData) => {
		const searchData = {
			"type": "datastore",
			"key": datastoreData?.key,

			"category": datastoreData?.category,
		}

		if (datastoreData?.category === undefined || datastoreData?.category === null || datastoreData?.category.length < 1) {
			console.log("No category for datastore item, cannot load correlations.")
			return
		}

		const checkKey = `${datastoreData?.category}|${datastoreData?.key}`
		if (handledKeys.includes(checkKey) === true) {
			//toast.warn("Correlations for this datastore item have already been loaded.")
			return
		}
		setHandledKeys([...handledKeys, checkKey])

		const url = `${globalUrl}/api/v2/correlations`
		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			credentials: "include",
			body: JSON.stringify(searchData),
		})
		.then((response) => {
			if (response.status !== 200) {
				console.log("Status not 200 for workflows :O!");
				return;
			}

			return response.json();
		})
		.then((responseJson) => {
			if (responseJson?.success === false) {
				toast.warn("Failed to load correlations. Please try again or contact support@shuffler if this persists.")
			} else {
				if (responseJson.length === 0) {
					toast.warn("No correlations found for this datastore item.")
					return
				}

				const parsedInfo = {
					parentKey: datastoreData?.key,
					parentId: datastoreData?.id,
					relations: responseJson,
				}

				setCorrelations(parsedInfo)
			}
		})
		.catch((error) => {
			toast(error.toString());
		});
	}

	useEffect(() => {
		if (cy === undefined) {
			return
		}

		if (correlations === undefined || correlations === null || correlations?.relations === undefined) {
			console.log("No correlations to load into graph: ", correlations)
			return
		}

		var startX = 250 
		var startY = 400 
		var added = false
		//var xyIncrement = 125 
		for (var key in correlations?.relations) {
			var parentValue = correlations?.relations[key]

			if (parentValue?.ref === undefined || parentValue?.ref === null || parentValue?.ref?.length < 2) {
				console.log("Skipping correlation with no ref: ", value)
				continue
			}

			parentValue.id = `node_${parentValue.key}`
			const foundnode = cy.getElementById(parentValue.id)
			if (foundnode !== undefined && foundnode !== null && foundnode.length > 0) {
				console.log("Parent node already exists, skipping: ", parentValue)
				continue
			}

			parentValue.type = "COMMENT"
			parentValue.height = 40 

			//parentValue.width = 200 
			parentValue.width = Math.max(125, Math.min(300, parentValue.key.length * 10))

			parentValue.is_valid = true
			parentValue.color = "white"
			parentValue.label = parentValue.key
			parentValue.clusters = [parentValue.id, correlations.parentId]

			const parentNodeData = {
			  group: "nodes",
			  data: parentValue,
			  position: {
				x: startX,
				y: startY,
			  },
			}

			cy.add(parentNodeData)

		    const newRootId = uuidv4()
			cy.add({
				group: "edges",
				data: {
					id: newRootId,
					source: correlations?.parentId,
					target: parentValue.id,
					correlation: true,
				},
			})

			added = true 
			for (var relKey in parentValue?.ref) {
				var refKey = parentValue?.ref[relKey]


				//const foundnode = cy.getElementById(`node_${key}`)
				//if (foundnode !== undefined && foundnode !== null && foundnode.length > 0) {
				//	continue
				//}
				const original = refKey
				var category = ""
				if (refKey.includes("|")) {
					const splitRef = refKey.split("|")
					category = splitRef[0]

					// Add the rest of them to key
					refKey = splitRef.slice(1).join("|")
				}

				var value = {
					"key": refKey,
					"category": category,
					"relation": parentValue?.key,

					"ref": original,
				}

				value.id = `node_${value.ref}`
				const foundnode = cy.getElementById(value.id)
				if (foundnode !== undefined && foundnode !== null && foundnode.length > 0) {
					// Check if the node points to this one?
					console.log("Child node already exists, skipping: ", value.id, value)

					// Verify if an edge exists
					const sourceExistingEdgeId = `edge_${parentValue.id}_${value.id}`
					const sourceCheck = cy.getElementById(sourceExistingEdgeId)
					if (sourceCheck === undefined || sourceCheck === null || sourceCheck.length < 1) {
						const destinationExistingEdgeId = `edge_${value.id}_${parentValue.id}`
						const destCheck = cy.getElementById(destinationExistingEdgeId)
						if (destCheck === undefined || destCheck === null || destCheck.length < 1) {
							// Get source and child - make sure their clusters align
							const sourceNode = cy.getElementById(parentValue.id)
							if (sourceNode === undefined || sourceNode === null || sourceNode.length < 1) {
							}

							cy.add({
								group: "edges",
								data: {
									id: sourceExistingEdgeId,
									source: parentValue.id,
									target: value.id,

									correlation: true,
								},
							})
						}
					} else {
						//console.log("Edge already exists between parent and child: ", existingEdgeId)
					}

					continue
				}

				value.height = 40 
				value.width = 40 
				value.clusters = [value.id, parentValue.id]

              	const iconInfo = GetIconInfo({
					"app_name": category,
					"name": category,
				})

				//console.log("Iconinfo: ", category, iconInfo)
				if (iconInfo?.originalIcon === undefined || iconInfo?.originalIcon === null || iconInfo?.originalIcon.length < 2) {
					value.type = "CORRELATION"

					// Get text length from value.key
					//value.width = Math.max(125, Math.min(300, value.key.length * 10))
					value.backgroundcolor = randomColor()
				} else {
					
					value.type = "CORRELATION"
					const svg_pin = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="${iconInfo.icon}" fill="${iconInfo.iconColor}"></path></svg>`;
					const svgpin_Url = encodeURI("data:image/svg+xml;utf-8," + svg_pin);
					value.large_image = svgpin_Url
					if (iconInfo.icon === undefined || iconInfo.icon === null || iconInfo.icon.length < 1) {
						console.log("Handle iconInfo.originalIcon instead")
					}

					value.fillGradient = iconInfo.fillGradient
					value.fillstyle = "solid"
					value.app_name = "Shuffle Tools"

					if (
					  value.fillGradient !== undefined &&
					  value.fillGradient !== null &&
					  value.fillGradient.length > 0
					) {
					  value.fillstyle = "linear-gradient";
					} else {
					  value.iconBackground = iconInfo.iconBackgroundColor;
					}
					
				}

				value.is_valid = true
				value.color = "white"
				//value.backgroundcolor = "blue" 
				value.label = value.key
				if (value.category !== undefined && value.category !== null && value.category.length > 0) {
					value.label = `${value.category}: ${value.key}`
				}

				const nodeData = {
				  group: "nodes",
				  data: value,
				  position: {
					x: startX,
					y: startY,
				  },
				}

				cy.add(nodeData)

				const newChildRootId = `edge_${parentValue.id}_${value.id}`
				cy.add({
					group: "edges",
					data: {
						id: newChildRootId,
						source: parentValue.id,
						target: value.id,

						correlation: true,
					},
				})
			
				added = true 
			}
		}

		setTimeout(() => {
			if (added === false) {
				return
			}

			cy.ready(() => {
				/*
				var layout = cy.makeLayout({
					name: 'circle',
					radius: 300,
					avoidOverlap: false,
					startAngle: 3.14,
					sweep: undefined,
					clockwise: true,

					animate: true,
				})
				*/

				var layout = cy.makeLayout(spreadLayout)
				layout.run()
			})
		}, 500)

	}, [correlations])

	useEffect(() => {
		var removeFields = ["type", "height", "width", "is_valid", "color", "label", "backgroundcolor", "success", "encrypted", "public_authorization", "suborg_distribution", "revision_id", "large_image", "fillstyle", "app_name", "fillGradient", ]
		if (visualisedData !== undefined) {
			var cleanedData = JSON.parse(JSON.stringify(visualisedData))
			for (var i = 0; i < removeFields.length; i++) {
				delete cleanedData[removeFields[i]]
			}

			setVisualisedData(cleanedData)
		}

		if (selectedData !== undefined) {
			var cleanedData2 = JSON.parse(JSON.stringify(selectedData))
			for (var j = 0; j < removeFields.length; j++) {
				delete cleanedData2[removeFields[j]]
			}

			setselectedData(cleanedData2)
		}

	}, [visualisedData, selectedData])

	const onNodeHover = (event) => {
		const nodedata = JSON.parse(JSON.stringify(event.target.data()))
		if (nodedata === undefined || nodedata === null) {
			console.log("No node data on hover")
			return
		}

		const cytoscapeElement = document.getElementById("cytoscape_view")
		if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
			if (nodedata?.category === undefined || nodedata?.category === null || nodedata?.category.length < 1) {
				// Means it is a value
			} else {
		  		cytoscapeElement.style.cursor = "pointer"
			}
		}

		// Only do it 1/20 times as it's super fast anyway
		// This is due to state management within events being weird 
		if (Math.random() < 0.95) {
			setVisualisedData(nodedata)
		}

		if (bb === undefined || bb === null) {
			console.log("BB undefined (2)")
			return
		}

		if (nodedata?.clusters === undefined || nodedata?.clusters === null) {
			toast.warn("No cluster data for this node.")
			return
		}

		for (var clusterKey in nodedata?.clusters) {
			const cluster = nodedata?.clusters[clusterKey]

			var nodesInCluster = cy.nodes().filter((node) => {
				const nodeData = node.data()

				// Check if it is an incoming or outgoing one
				if (nodeData?.clusters === undefined || nodeData?.clusters === null) {
					return false
				}

				return nodeData?.clusters.includes(cluster)
			})

			const edgesInCluster = cy.edges().filter((edge) => {
				const sourceNode = edge.source()
				const targetNode = edge.target()

				const sourceData = sourceNode.data()
				const targetData = targetNode.data()
				if (sourceData?.clusters === undefined || sourceData?.clusters === null) {
					return false
				}

				if (targetData?.clusters === undefined || targetData?.clusters === null) {
					return false
				}

				return sourceData?.clusters.includes(cluster) && targetData?.clusters.includes(cluster)
			})

			bb.addPath(nodesInCluster, edgesInCluster, null)
		}

		const incomingNodes = event.target.incomers('node')
		bb.addPath(incomingNodes)
		const outgoingNodes = event.target.outgoers('node')
		bb.addPath(outgoingNodes)
	}

    const onNodeHoverOut = (event) => {
		const nodedata = event.target.data();

		const cytoscapeElement = document.getElementById("cytoscape_view")
		if (cytoscapeElement !== undefined && cytoscapeElement !== null) {
		  cytoscapeElement.style.cursor = "default"
		}

		setVisualisedData(undefined)

		if (bb === undefined || bb === null) {
			console.log("BB undefined")
			return
		}

		const activePaths = bb.getPaths()
		for (var pathKey in activePaths) {
			bb.removePath(activePaths[pathKey])
		}
	}

	const onNodeSelect = (event) => {
		const nodedata = event.target.data();
		if (nodedata === undefined || nodedata === null) {
			return
		}

		setselectedData(nodedata)
	
		loadCorrelations(nodedata) 
	}

	const onUnselect = (event) => {
		const nodedata = event.target.data();
		if (nodedata === undefined || nodedata === null) {
			return
		}

		setselectedData(undefined)
	}

	const randomColor = () => {
	  // Generate RGB values in a pleasant range (not too dark or oversaturated)
	  const r = 80 + Math.floor(Math.random() * 150);  // 80–230
	  const g = 80 + Math.floor(Math.random() * 150);
	  const b = 80 + Math.floor(Math.random() * 150);

	  // Slightly mix towards neutral gray to make tones modern and less primary
	  const mix = 0.3;
	  const gray = (r + g + b) / 3;
	  const rr = Math.floor(r * (1 - mix) + gray * mix);
	  const gg = Math.floor(g * (1 - mix) + gray * mix);
	  const bb = Math.floor(b * (1 - mix) + gray * mix);

	  return `rgb(${rr}, ${gg}, ${bb})`;
	}

	useEffect(() => {
		if (cy === undefined) {
			console.log("No cy instance (yet)")
			return
		}

		// If cytoscape has nodes, skip
		const existingNodes = cy.nodes()
		if (existingNodes !== undefined && existingNodes !== null && existingNodes.length > 0) {
			return
		}

		if (datastoreData === undefined || datastoreData === null) {
			console.log("No data for correlation graph (2): ", datastoreData)
			return 
		}

		var parsedData = JSON.parse(JSON.stringify(datastoreData))

		parsedData.id = `node_${datastoreData?.category}|${datastoreData?.key}`
		parsedData.large_image = "/images/singul_green.png"
	    parsedData.type = "ACTION"
	    parsedData.height = 125 
	    parsedData.width = 125 
	    parsedData.color = "white"
	    parsedData.label = `start - ${parsedData?.category}: ${parsedData?.key}`
		parsedData.clusters = [parsedData.id]
		parsedData.is_valid = true

		// Default node
		cy.add({
		  group: "nodes",
		  data: parsedData,
		  position: {
			x: 500,
			y: 500,
		  },
		})

		loadCorrelations(parsedData)
		setStartNode(parsedData)

		const bubbleSets = cy.bubbleSets({
			zIndex: 4,
			throttle: 10,
			interactive: true,

			style: {
				"fill": randomColor(), 
			},
		})

		setBb(bubbleSets)
	}, [cy])

	useEffect(() => {
		if (bb === undefined || bb === null) {
			return
		}

		cy.on("mouseover", "node", (e) => onNodeHover(e))
		cy.on("mouseout", "node", (e) => onNodeHoverOut(e))
		cy.on("select", "node", (e) => onNodeSelect(e))
		cy.on("unselect", "node", (e) => onUnselect(e))
	}, [bb])

	if (datastoreData === undefined || datastoreData === null) {
		console.log("No data for correlation graph: ", datastoreData)
		return null
	}

	const getRelation = (startNode, targetNode) => {
		if (startNode?.id === targetNode?.id) {
			return 0
		}

		const foundStartnode = cy.getElementById(startNode?.id)
		if (foundStartnode === undefined || foundStartnode === null || foundStartnode.length < 1) {
			return 0
		}

		const foundTargetnode = cy.getElementById(targetNode?.id)
		if (foundTargetnode === undefined || foundTargetnode === null || foundTargetnode.length < 1) {
			return 0
		} 

		// Check range between them
		const dijkstra = cy.elements().dijkstra(foundStartnode, (edge) => 1, false);
		const distance = dijkstra.distanceTo(foundTargetnode);
		if (distance === Infinity) {
			return -1
		}

		if (distance <= 0) {
			return 0
		}

		// Divide by 2 due to skipping "values" -> focus on keys containing them 
		return distance/2
	}

	const foundValue = visualisedData !== undefined ? visualisedData : selectedData !== undefined ? selectedData : undefined
	const hoverName = foundValue !== undefined && foundValue?.key !== undefined ? foundValue?.key : ""
	const hoverCategory = foundValue !== undefined && foundValue?.category !== undefined ? foundValue?.category : ""
	const jumpsFromStart = hoverCategory === "" ? 0 : getRelation(startNode, foundValue) 

	return (
		<div style={{position: "relative", width: "95%", height: "95%", margin: "16px 16px 32px 32px", }}>
			<Tooltip title="Re-shuffle graph" placement="top">
				<IconButton
					variant="outlined"
					color="secondary"
					style={{position: "absolute", top: 8, left: 8, zIndex: 1000, backgroundColor: theme.palette.surfaceColor, }}
					onClick={() => {
						if (cy === undefined || cy === null) {
							return
						}

						cy.ready(() => {
							var layout = cy.makeLayout(spreadLayout)
							layout.run()
						})
					}}
				>
					<RefreshIcon />
				</IconButton>
			</Tooltip>

			{visualisedData === undefined && selectedData === undefined ? null :
				<div style={{position: "fixed", top: 100, right: 100, zIndex: 1000, maxWidth: 400, minWidth: 400, backgroundColor: theme.palette.surfaceColor, padding: "16px 16px 16px 16px", borderRadius: theme.palette.borderRadius, boxShadow: theme.palette.boxShadow, }}>
				  <Typography variant="h6" style={{}}>
					{hoverCategory}{hoverCategory === "" ? "" : ":"} {hoverName}
				  </Typography>
				  {hoverCategory !== "" ?
					  <Typography variant="body1" color="textSecondary" style={{marginBottom: 8, }}>
						Degrees from start: {jumpsFromStart}
					  </Typography>
				  : null}
				  <div style={{marginTop: 8, }} />
				  <ReactJson
					src={visualisedData !== undefined ? visualisedData : selectedData}
					theme={theme.palette.jsonTheme}
					style={theme.palette.reactJsonStyle}
					//shouldCollapse={(jsonField) => {
					//  return collapseField(jsonField)
					//}}
					iconStyle={theme.palette.jsonIconStyle}
					collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
					displayArrayKey={false}
					displayDataTypes={false}
					name={false}
				  />
				</div>
			}

            <CytoscapeComponent
			  elements={[]}
              minZoom={0.1}
              maxZoom={2.0}
              wheelSensitivity={0.25}
              id="cytoscape_view"
              style={{
                width: 900,
                height: 700,
                backgroundColor: theme.palette.surfaceColor,

				borderRadius: theme.palette.borderRadius,
				border: "1px solid rgba(255,255,255,0.1)", 
              }}
              stylesheet={cystyle}
              cy={(incy) => {
                setCy(incy)
			  }}
            />
		</div>
	)
}

export default CorrelationGraph
