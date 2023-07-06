const data = [{
			selector: 'node',
			css: {
				'label': 'data(label)',
				'text-valign': 'center',
				'font-family': 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif, sans-serif',
				'font-weight': 'lighter',
				'font-size': 'data(font_size)',
				'text-algin': 'center',
				'border-width': '3px',
				'border-color': '#8a8a8a',
				'color': '#f85a3e',
				'text-margin-x': '0px',
				'text-margin-y': 'data(text_margin_y)',
				'background-color': '#27292d',
				'background-image': 'data(large_image)',
				'background-position-x': 'data(margin_x)',
				'background-position-y': 'data(margin_y)',
				'background-clip': "node",
				'background-width': 'data(width)',
				'background-height': 'data(width)',
				'width': 'data(boxwidth)',
				'height': 'data(boxheight)',
			}
		},
		{
			selector: 'edge',
			css: {
				'target-arrow-shape': 'triangle',
				'target-arrow-color': '#8a8a8a',
				'curve-style': 'bezier',
				'label': 'data(label)',
				'text-wrap': 'wrap',
				'text-max-width': '120px',
				"color": "rgba(255,255,255,0.7)",
				'line-style': 'dashed',
				"line-fill": "linear-gradient",
				"line-gradient-stop-positions": ["0.0", "100"],
				"line-gradient-stop-colors": ["#8a8a8a", "#8a8a8a"],
				'width': '1px',
				'z-compound-depth': 'top',
				'font-size': '13px',
			},
		},
		{
			selector: `node[!is_valid]`,
			css: {
				'height': '20px',
				'width': '20px',
				'background-color': '#6d9eeb',
				'border-color': '#4c6ea4',
				'border-width': '1px',
			},
		},
		{
			selector: `edge[?human]`,
			css: {
				'target-arrow-color': '#6d9eeb',
				'line-style': 'solid',
				"line-gradient-stop-positions": ["0.0", "100"],
				"line-gradient-stop-colors": ["#6d9eeb", "#6d9eeb"],
			}
		},
		{
			selector: `node[?middle_node]`,
			css: {
				'background-image': 'data(large_image)',
				'height': 'data(width)',
				'width': 'data(height)',
				'background-width': 'data(width)',
				'background-height': 'data(height)',
				'background-position-x': '0px',
				'background-position-y': '0px',
				'border-width': '2px',
			},
		},
		{
			selector: `node[?invisible]`,
			css: {
				'height': '10x',
				'width': '10px',
				'background-position-x': '0px',
				'background-position-y': '0px',
				'border-width': '0px',
				'font-size': '0px',
			},
		},
		{
			selector: `node[?font_size]`,
			css: {
				'font-size': 'data(font_size)',
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
			selector: "node:selected",
			css: {
				"border-color": "#f86a3e",
				"border-width": "3px",
			},
		},
	]

export default data 
