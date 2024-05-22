import React, { useState, useEffect } from "react";

import * as cytoscape from "cytoscape";
import * as edgehandles from "cytoscape-edgehandles";
import CytoscapeComponent from "react-cytoscapejs";

const EditWorkflow = (props) => {
  const { inputworkflows, inputtype, inputname } = props;

  const [elements, setElements] = useState([]);
  const [loadedWorkflows] = useState(inputworkflows);

  // Setting cy config
  const [cystyle] = useState([
    {
      selector: "node",
      css: {
        label: "data(label)",
        "text-halign": "right",
        "text-valign": "center",
        "font-family":
          "Segoe UI, Tahoma, Geneva, Verdana, sans-serif, sans-serif",
        "font-weight": "lighter",
        "font-size": "15px",
        width: "60px",
        height: "60px",
        padding: "10px",
        margin: "5px",
        "border-width": "2px",
        "background-image":
          'url("data:image/png;base64,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")',
      },
    },
    {
      selector: `node[type="ACTION"]`,
      css: {
        shape: "square",
        "border-color": "#81c784",
      },
    },
    {
      selector: `node[type="CONDITION"]`,
      css: {
        shape: "diamond",
        "border-color": "##FFEB3B",
        padding: "30px",
      },
    },
    {
      selector: 'node[type="eventAction"]',
      css: {
        "background-color": "#edbd21",
      },
    },
    {
      selector: 'node[type="webhook"]',
      css: {
        "border-color": "#81c784",
        "background-color": "white",
        "background-image":
          'url("data:image/png;base64,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")',
      },
    },
    {
      selector: 'node[type="mq"]',
      css: {
        "background-color": "#edbd21",
      },
    },
    {
      selector: "node[?isStartNode]",
      css: {
        shape: "ellipse",
        "border-width": "2px",
        "border-color": "#80deea",
      },
    },
    {
      selector: "node[?hasErrors]",
      css: {
        color: "#991818",
        "font-style": "italic",
      },
    },
    {
      selector: "node:selected",
      css: {
        "background-color": "#77b0d0",
      },
    },
    {
      selector: ".success-highlight",
      css: {
        "background-color": "#399645",
        "transition-property": "background-color",
        "transition-duration": "0.5s",
      },
    },
    {
      selector: ".failure-highlight",
      css: {
        "background-color": "#8e3530",
        "transition-property": "background-color",
        "transition-duration": "0.5s",
      },
    },
    {
      selector: ".executing-highlight",
      css: {
        "background-color": "#ffef47",
        "transition-property": "background-color",
        "transition-duration": "0.25s",
      },
    },
    {
      selector: ".awaiting-data-highlight",
      css: {
        "background-color": "#f4ad42",
        "transition-property": "background-color",
        "transition-duration": "0.5s",
      },
    },
    {
      selector: "$node > node",
      css: {
        "padding-top": "10px",
        "padding-left": "10px",
        "padding-bottom": "10px",
        "padding-right": "10px",
        "text-valign": "top",
        "text-halign": "center",
      },
    },
    {
      selector: "edge",
      css: {
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
    {
      selector: "edge.executing-highlight",
      css: {
        width: "5px",
        "target-arrow-color": "#ffef47",
        "line-color": "#ffef47",
        "transition-property": "line-color, width",
        "transition-duration": "0.25s",
      },
    },
    {
      selector: "edge.success-highlight",
      css: {
        width: "5px",
        "target-arrow-color": "#399645",
        "line-color": "#399645",
        "transition-property": "line-color, width",
        "transition-duration": "0.5s",
      },
    },
    {
      selector: "edge[?hasErrors]",
      css: {
        "target-arrow-color": "#991818",
        "line-color": "#991818",
        "line-style": "dashed",
      },
    },
    {
      selector: ".eh-handle",
      style: {
        "background-color": "#337ab7",
        width: "1px",
        height: "1px",
        shape: "triangle",
      },
    },
    {
      selector: ".eh-source",
      style: {
        "border-width": "3",
        "border-color": "#337ab7",
      },
    },
    {
      selector: ".eh-target",
      style: {
        "border-width": "3",
        "border-color": "#337ab7",
      },
    },
    {
      selector: ".eh-preview, .eh-ghost-edge",
      style: {
        "background-color": "#337ab7",
        "line-color": "#337ab7",
        "target-arrow-color": "#337ab7",
        "source-arrow-color": "#337ab7",
      },
    },
  ]);

  useEffect(() => {
    if (elements.length === 0) {
      setupGraph();
    }

    const cyDummy = cytoscape();
    if (!cyDummy.edgehandles) {
      //cytoscape.use(edgehandles);
    }
  });

  const setupGraph = () => {
    // Convert our selection arrays to a string
    //if (!this.loadedWorkflow.actions) { this.loadedWorkflow.actions = []; }

    //setTimeout(() => {
    //	if (this.consoleArea && this.consoleArea.codeMirror) this.consoleArea.codeMirror.refresh();
    //});

    // Create the Cytoscape graph
    // http://js.cytoscape.org/#style/labels

    // Breaks stuff
    //container: document.getElementById('cy'),

    // FIXME - needs refresh
    const tmpEdges = loadedWorkflows.map((workflow, count) => {
      return workflow.branches.map((branch) => {
        const edge = {};
        edge.data = {
          id: branch.id,
          _id: branch.id,
          source: branch.source_id,
          target: branch.destination_id,
          hasErrors: branch.has_errors,
        };
        return edge;
      });
    });

    // Make the actual actions
    var edges = [];
    for (var key in tmpEdges) {
      for (var subkey in tmpEdges[key]) {
        edges.push(tmpEdges[key][subkey]);
      }
    }

    const tmpActions = loadedWorkflows.map((workflow, count) => {
      return workflow.actions.map((action) => {
        const node = {
          position: { x: action.position.x, y: action.position.y },
        };
        node.data = {
          id: action["id_"],
          _id: action["id_"],
          label: action.name,
          isStartNode: action["id_"] === loadedWorkflows[count].start,
          hasErrors: action.has_errors,
          type: "ACTION",
        };
        return node;
      });
    });

    // Make the actual actions
    var actions = [];
    for (key in tmpActions) {
      for (subkey in tmpActions[key]) {
        actions.push(tmpActions[key][subkey]);
      }
    }

    const tmpConditionals = loadedWorkflows.map((workflow, count) => {
      return workflow.conditions.map((condition) => {
        const node = {
          position: { x: condition.position.x, y: condition.position.y },
        };
        node.data = {
          id: condition.id_,
          _id: condition.id_,
          label: condition.name,
          isStartNode: condition["id_"] === loadedWorkflows[count].start,
          hasErrors: condition.has_errors,
          type: "CONDITION",
        };
        return node;
      });
    });

    // Make the actual actions
    var conditionals = [];
    for (key in tmpConditionals) {
      for (subkey in tmpConditionals[key]) {
        conditionals.push(tmpConditionals[key][subkey]);
      }
    }

    const tmpelements = [].concat(edges, actions, conditionals);

    if (inputtype !== undefined && inputname !== undefined) {
      // Find startnode, find the movement location and push elements down:
      // FIXME - generate stuff
      const locationvar = 200;
      const baseylocation = 100;
      const hookid = "GENERATEME";
      const hookname = inputname;
      for (key in tmpelements) {
        var item = tmpelements[key];

        if (item.data.isStartNode) {
          // Append a webhook item to the view
          var shiftlength = 0;
          if (item.position.y - locationvar < baseylocation) {
            shiftlength = item.position.y - locationvar + -baseylocation;
            if (shiftlength < 0) {
              shiftlength = -shiftlength;
            }
          }

          const tmpdata = {
            data: { id: hookid, label: hookname, type: inputtype },
            position: { x: item.position.x, y: item.position.y - locationvar },
          };
          const newedge = { data: { source: hookid, target: item.data.id } };
          tmpelements.push(tmpdata);
          tmpelements.push(newedge);

          if (shiftlength !== 0) {
            const newelements = [];
            for (key in tmpelements) {
              // isNaN?
              if (
                tmpelements[key].position === undefined ||
                tmpelements[key].position.isNaN
              ) {
                newelements.push(tmpelements);
                continue;
              }

              var newitem = tmpelements[key];
              newitem.position.y = newitem.position.y + shiftlength;
            }
          }

          break;
        }
      }
    }

    setElements(tmpelements);
  };

  // Set some extra stuff?
  var cy;
  const cytmp = cytoscape();
  cytmp.fit(null, 50);

  return (
    <div>
      <CytoscapeComponent
        cy={(cytmp) => (cy = cytmp)}
        elements={elements}
        style={{ width: "1000px", height: "1000px" }}
        stylesheet={cystyle}
        boxSelectionEnabled={false}
        autounselectify={false}
        wheelSensitivity={0.1}
      />
      ;
    </div>
  );
};

export default EditWorkflow;
