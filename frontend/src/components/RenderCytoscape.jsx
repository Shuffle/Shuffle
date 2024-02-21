import React, { useState, useEffect, useLayoutEffect } from "react";
import * as cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import cystyle from "../defaultCytoscapeStyle.jsx";

const surfaceColor = "#27292D";
const CytoscapeWrapper = (props) => {
  const { globalUrl, inworkflow, height, width } = props;

  const [elements, setElements] = useState([]);
  const [workflow, setWorkflow] = useState(inworkflow);
  const [cy, setCy] = React.useState();
  const bodyWidth = height === undefined ? 1000 : width
  const bodyHeight = width === undefined ? 1000 : height 

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
	  zoom={1.0}
      style={{
        width: bodyWidth,
        height: bodyHeight,
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
