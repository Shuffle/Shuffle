import React, { useState, useEffect, useLayoutEffect } from "react";
import * as cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import cystyle from "../defaultCytoscapeStyle";

const surfaceColor = "#27292D";
const CytoscapeWrapper = (props) => {
  const { globalUrl, inworkflow } = props;

  const [elements, setElements] = useState([]);
  const [workflow, setWorkflow] = useState(inworkflow);
  const [cy, setCy] = React.useState();
  const bodyWidth = 200;
  const bodyHeight = 150;

  const setupGraph = () => {
    const actions = workflow.actions.map((action) => {
      const node = {};
      node.position = action.position;
      node.data = action;

      node.data._id = action["id"];
      node.data.type = "ACTION";
      node.isStartNode = action["id"] === workflow.start;

      var example = "";
      if (
        action.example !== undefined &&
        action.example !== null &&
        action.example.length > 0
      ) {
        example = action.example;
      }

      node.data.example = example;
      return node;
    });

    const triggers = workflow.triggers.map((trigger) => {
      const node = {};
      node.position = trigger.position;
      node.data = trigger;

      node.data._id = trigger["id"];
      node.data.type = "TRIGGER";

      return node;
    });

    // FIXME - tmp branch update
    var insertedNodes = [].concat(actions, triggers);
    const edges = workflow.branches.map((branch, index) => {
      //workflow.branches[index].conditions = [{

      const edge = {};
      var conditions = workflow.branches[index].conditions;
      if (conditions === undefined || conditions === null) {
        conditions = [];
      }

      var label = "";
      if (conditions.length === 1) {
        label = conditions.length + " condition";
      } else if (conditions.length > 1) {
        label = conditions.length + " conditions";
      }

      edge.data = {
        id: branch.id,
        _id: branch.id,
        source: branch.source_id,
        target: branch.destination_id,
        label: label,
        conditions: conditions,
        hasErrors: branch.has_errors,
      };

      // This is an attempt at prettier edges. The numbers are weird to work with.
      /*
			//http://manual.graphspace.org/projects/graphspace-python/en/latest/demos/edge-types.html
			const sourcenode = actions.find(node => node.data._id === branch.source_id)
			const destinationnode = actions.find(node => node.data._id === branch.destination_id)
			if (sourcenode !== undefined && destinationnode !== undefined && branch.source_id !== branch.destination_id) { 
				//node.data._id = action["id"]
				console.log("SOURCE: ", sourcenode.position)
				console.log("DESTINATIONNODE: ", destinationnode.position)

				var opposite = true 
				if (sourcenode.position.x > destinationnode.position.x) {
					opposite = false 
				} else {
					opposite = true 
				}

				edge.style = {
					'control-point-distance': opposite ? ["25%", "-75%"] : ["-10%", "90%"],
					'control-point-weight': ['0.3', '0.7'],
				}
			}
			*/

      return edge;
    });

    setWorkflow(workflow);

    // Verifies if a branch is valid and skips others
    var newedges = [];
    for (var key in edges) {
      var item = edges[key];

      const sourcecheck = insertedNodes.find(
        (data) => data.data.id === item.data.source
      );
      const destcheck = insertedNodes.find(
        (data) => data.data.id === item.data.target
      );
      if (sourcecheck === undefined || destcheck === undefined) {
        continue;
      }

      newedges.push(item);
    }

    insertedNodes = insertedNodes.concat(newedges);
    setElements(insertedNodes);
  };

  if (elements.length === 0) {
    setupGraph();
  }

  return (
    <CytoscapeComponent
      elements={elements}
      minZoom={0.35}
      maxZoom={2.0}
      style={{
        width: bodyWidth - 15,
        height: bodyHeight - 5,
        backgroundColor: surfaceColor,
      }}
      stylesheet={cystyle}
      boxSelectionEnabled={true}
      autounselectify={false}
      showGrid={true}
      cy={(incy) => {
        // FIXME: There's something specific loading when
        // you do the first hover of a node. Why is this different?
        //console.log("CY: ", incy)
        setCy(incy);
      }}
    />
  );
};

export default CytoscapeWrapper;
