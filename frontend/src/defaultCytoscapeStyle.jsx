const data = [
  {
    selector: "node",
    css: {
      label: function(element) {
		  var elementname = element.data("label")
		  if (elementname === null || elementname === undefined) {
			  return ""
		  } 

		  elementname = elementname.replaceAll("_", " ", -1)
		  elementname = elementname.charAt(0).toUpperCase() + elementname.slice(1)
		  return elementname
	  },
      "text-valign": "center",
      "font-family": "Segoe UI, Tahoma, Geneva, Verdana, sans-serif, sans-serif",
      "font-weight": "lighter",
      "font-size": "18px",
      "margin-right": "10px",
      width: "80px",
      height: "80px",
      color: "white",
      padding: "10px",
      margin: "5px",
      "border-width": "1px",
      "text-margin-x": "10px",
      "z-index": 5001,
    },
  },
  {
    selector: "edge",
    css: {
      "target-arrow-shape": "triangle",
      "target-arrow-color": "grey",
      "curve-style": "unbundled-bezier",
      label: "data(label)",
      "text-margin-y": "-15px",
      width: "5px",
      color: "white",
      "line-fill": "linear-gradient",
      "line-gradient-stop-positions": ["0.0", "100"],
      "line-gradient-stop-colors": ["grey", "grey"],
      "z-index": 5001,
    },
  },
  {
    selector: `node[buttonType="ACTIONSUGGESTION"]`,
    css: {
      label: "data(label)",
      shape: "roundrectangle",
	  "height": "18px",
	  "width": "145px",
      "background-color": "#212121",
      "border-color": "#81c784",
      "z-index": 10000,
	  "border-radius": "10px",
	  "text-margin-x": "0px",
    },
  },
  {
    selector: `node[type="ACTION"]`,
    css: {
      shape: "roundrectangle",
      "background-color": "#213243",
      "border-color": "#81c784",
      "background-width": "100%",
      "background-height": "100%",
      "border-radius": "5px",
      "z-index": 5001,
    },
  },
  {
    selector: `node[type="COMMENT"]`,
    css: {
      shape: "roundrectangle",
      color: "data(color)",
      width: "data(width)",
      height: "data(height)",
      padding: "0px",
      margin: "0px",
      "background-color": "data(backgroundcolor)",
      "background-image": "data(backgroundimage)",
      "border-color": "#ffffff",
      "text-margin-x": "0px",
      "z-index": 4999,
      "border-radius": "5px",
      "background-opacity": "0.5",
	  "text-wrap": "wrap",
    },
  },
  {
    selector: `node[app_name="Integration Framework"]`,
    css: {
      width: "60px",
      height: "60px",
      "z-index": 5000,

	  //'border-width': 3,
  	  //'border-color': 'transparent',
	  //'border-style': 'solid',
	  //'border-gradient': 'linear-gradient(to right, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #8A2BE2)' 
    },
  },
  {
    selector: `node[example="noapp"]`,
    css: {
	  // Make background image padding on the left side 20px
      "background-width": "75%",
      "background-height": "75%",
	  "background-position-x": "17px",
	  "background-position-y": "17px",

      "background-color": "data(iconBackground)",
      "background-fill": "data(fillstyle)",
      "background-gradient-direction": "to-bottom-right",
      "background-gradient-stop-colors": "data(fillGradient)",
	  // Change transparency of background
	  "background-opacity": "0.3",
    },
  },
  {
    selector: `node[app_name="Shuffle Tools"]`,
    css: {
      width: "30px",
      height: "30px",
      "z-index": 5000,
      "font-size": "0px",
      "background-width": "75%",
      "background-height": "75%",
      "background-color": "data(iconBackground)",
      "background-fill": "data(fillstyle)",
      "background-gradient-direction": "to-right",
      "background-gradient-stop-colors": "data(fillGradient)",
    },
  },
  {
    selector: `node[?parent_controlled]`,
    css: {
    },
  },
  {
    selector: `node[app_name="Testing"]`,
    css: {
      width: "30px",
      height: "30px",
      "z-index": 5000,
      "font-size": "0px",
    },
  },
  {
    selector: `node[?small_image]`,
    css: {
      "background-image": "data(small_image)",
      "text-halign": "right",
    },
  },
  {
    selector: `node[?large_image]`,
    css: {
      "background-image": "data(large_image)",
      "text-halign": "right",
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
    selector: `node[type="eventAction"]`,
    css: {
      "background-color": "#edbd21",
    },
  },
  {
    selector: `node[type="TRIGGER"]`,
    css: {
      shape: "round-octagon",
      "border-radius": "5px",
      "border-color": "orange",
      "background-color": "#213243",
      "background-width": "100px",
      "background-height": "100px",
    },
  },
  {
    selector: `node[status="running"]`,
    css: {
      "border-color": "#81c784",
    },
  },
  {
    selector: `node[status="stopped"]`,
    css: {
      "border-color": "orange",
    },
  },
  {
    selector: 'node[type="mq"]',
    css: {
      "background-color": "#edbd21",
    },
  },
  {
    selector: "node[?isButton]",
    css: {
      shape: "ellipse",
      width: "15px",
      height: "15px",
      "z-index": "5002",
      "font-size": "0px",
      border: "1px solid rgba(255,255,255,0.9)",
      "background-image": "data(icon)",
      "background-color": "data(iconBackground)",
    },
  },
  {
    selector: "node[?isSuggestion]",
    css: {
      shape: "roundrectangle",
      width: "30px",
      height: "30px",
      "z-index": "5002",
	  filter: "grayscale(100%)",
      border: "1px solid rgba(255,255,255,0.9)",
      "background-image": "data(large_image)",
	  "background-fit": "cover",
      "font-size": "20px",
      label: "data(label_replaced)",
    },
  },
  {
    selector: "node[?canConnect]",
    css: {
      "border-color": "#f86a3e",
      "border-width": "10px",
      "z-index": "5002",
      "background-color": "#f86a3e",
    },
  },
  {
    selector: "node[?isDescriptor]",
    css: {
      shape: "ellipse",
      "border-color": "#80deea",
      width: "5px",
      height: "5px",
      "z-index": "5002",
      "font-size": "10px",
      "text-valign": "center",
      "text-halign": "center",
      border: "1px solid black",
      "margin-right": "0px",
      "text-margin-x": "0px",
      "background-color": "data(imageColor)",
      "background-image": "data(image)",
		label: "data(label)",
    },
  },
  {
    selector: "node[?isStartNode]",
    css: {
      shape: function(element) {
		  return "ellipse" 
	  },
      "border-color": "#80deea",
      width: "80px",
      height: "80px",
      "font-size": "18px",
      "background-width": "100%",
      "background-height": "100%",
    },
  },
  {
    selector: "node[!is_valid]",
    css: {
      "border-color": "red",
      "border-width": "10px",
    },
  },
  {
    selector: ":selected",
    css: {
      "background-color": "#77b0d0",
      "border-color": "#77b0d0",
      "border-width": "20px",
    },
  },
  {
    selector: ".skipped-highlight",
    css: {
      "background-color": "grey",
      "border-color": "grey",
      "border-width": "8px",
      "transition-property": "background-color",
      "transition-duration": "0.5s",
    },
  },
  {
    selector: ".success-highlight",
    css: {
      "background-color": "#41dcab",
      "border-color": "#41dcab",
      "border-width": "5px",
      "transition-property": "background-color",
      "transition-duration": "0.5s",
    },
  },
  {
    selector: ".hover-highlight",
    css: {
      "background-color": "#5f9265",
      "border-color": "#5f9265",
      "border-width": "5px",
      "transition-property": "background-color",
      "transition-duration": "0.5s",
    },
  },
  {
    selector: ".failure-highlight",
    css: {
      "background-color": "#8e3530",
      "border-color": "#8e3530",
      "border-width": "5px",
      "transition-property": "background-color",
      "transition-duration": "0.5s",
    },
  },
  {
    selector: ".not-executing-highlight",
    css: {
      "background-color": "grey",
      "border-color": "grey",
      "border-width": "5px",
      "transition-property": "#ffef47",
      "transition-duration": "0.25s",
    },
  },
  {
    selector: ".executing-highlight",
    css: {
      "background-color": "#ffef47",
      "border-color": "#ffef47",
      "border-width": "8px",
      "transition-property": "border-width",
      "transition-duration": "0.25s",
    },
  },
  {
    selector: ".awaiting-data-highlight",
    css: {
      "background-color": "#f4ad42",
      "border-color": "#f4ad42",
      "border-width": "5px",
      "transition-property": "border-color",
      "transition-duration": "0.5s",
    },
  },
  {
    selector: ".shuffle-hover-highlight",
    css: {
      "background-color": "#f85a3e",
      "border-color": "#f85a3e",
      "border-width": "12px",
      "transition-property": "border-width",
      "transition-duration": "0.25s",
      label: "data(label)",
      "font-size": "18px",
      color: "white",
    },
  },
  {
    selector: "$node > node",
    css: {
      "padding-top": "10px",
      "padding-left": "10px",
      "padding-bottom": "10px",
      "padding-right": "10px",
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
    selector: `edge[?decorator]`,
    css: {
      width: "1px",
      "line-style": "dashed",
      "line-fill": "linear-gradient",
      "target-arrow-color": "#555555",
      "line-gradient-stop-positions": ["0.0", "100"],
      "line-gradient-stop-colors": ["#555555", "#555555"],
    },
  },
  {
    selector: "edge.success-highlight",
    css: {
      width: "5px",
      "target-arrow-color": "#41dcab",
      "line-color": "#41dcab",
      "transition-property": "line-color, width",
      "transition-duration": "0.5s",
      "line-fill": "linear-gradient",
      "line-gradient-stop-positions": ["0.0", "100"],
      "line-gradient-stop-colors": ["#41dcab", "#41dcab"],
    },
  },
  {
    selector: ".eh-handle",
    style: {
      "background-color": "#337ab7",
      width: "1px",
      height: "1px",
      shape: "circle",
      "border-width": "1px",
      "border-color": "black",
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
  {
    selector: "edge:selected",
    css: {
      "target-arrow-color": "#f85a3e",
    },
  },
  {
    selector: `edge[?source_workflow]`,
    css: {
      "background-opacity": "1",
      "font-size": "0px",
    },
  },
  {
    selector: `node[?source_workflow]`,
    css: {
      "background-opacity": "0",
      "font-size": "0px",
    },
  },
  {
  	selector: "node:selected",
  	css: {
  		"border-color": "#f86a3e",
  		"border-width": "7px",
  	},
  },
  {
    selector: `node[buttonType="condition-drag"]`,
    css: {
		"width": "5px",
		"height": "5px",
		"background-color": "#f85a3e",
    },
  },
  {
    selector: `node[name="switch"]`,
    css: {
      label: function(element) {
		  // Load from the actual element
		  var nodeheight = 400 
		  var conditions = [{
			  "name": "Condition 1",
			  "check": "X equals Y",
		  },
		  {
			  "name": "Condition 2",
			  "check": "X2 equals Y2",
		  },
		  {
			  "name": "Condition 3",
			  "check": "X3 equals Y3",
		  }]

		  conditions.push({
			  "name": "Else",
			  "check": "If all else fails",
		  })

		  const newlines = nodeheight / conditions.length
		  console.log("Newlines: ", newlines)

		  const label = conditions.map((condition) => {
			  return `${condition.name}\n\n\n`
		  }).join("\n")

		  return label
	  },
      color: "white",
      "border-color": "#f85a3e",
	  "background-color": "#1f1f1f",
      "font-size": "19px",
      "text-margin-x": "-110px",
	  "text-wrap": "wrap",
      shape: "roundrectangle",
      width: "100",
      height: "300",

    },
  },
];

//{
//	selector: 'edge[?hasErrors]',
//	css: {
//		'target-arrow-color': '#991818',
//		'line-color': '#991818',
//		'line-style': 'dashed',
//		"line-fill": "linear-gradient",
//		"line-gradient-stop-positions": ["0.0", "100"],
//		"line-gradient-stop-colors": ["#991818", "#991818"],
//	},
//},

export default data;
