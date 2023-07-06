import React, { useState, useEffect, useLayoutEffect } from "react";


const KeepAlive = (defaultprops) => {
  const { globalUrl, isLoggedIn, isLoaded, userdata } = defaultprops;

  const [data, setData] = React.useState([]);
  const [update, setUpdate] = React.useState(0);

	const onChunkedResponseComplete = (result) => {
		  console.log('all done!', result)
	}

	const onChunkedResponseError = (err) => {
		  console.error(err)
	}

	const processChunkedResponse = async (response) => {
		var text = '';
		var reader = response.body.getReader()
		var decoder = new TextDecoder();
		
		const appendChunks = (result) => {
			var chunk = decoder.decode(result.value || new Uint8Array, {stream: !result.done});
			data.push(chunk)
			setData(data)
    	setUpdate(Math.random());

			console.log('got chunk of', chunk.length, 'bytes. Value: ', chunk)
			text += chunk;
			//console.log('text so far is', text.length, 'bytes\n');
			if (result.done) {
				console.log('returning')
				return text;
			} else {
				return readChunk()
			}
		}

		const readChunk = () => {
			return reader.read().then(appendChunks);
		}

		return readChunk();
	}



	const getWorkflowStream = async () => {
    await fetch(globalUrl + "/api/v1/workflows/a843fe90-585a-4693-8b7c-0b4dbce3347d/stream", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
		.then(processChunkedResponse)
		.then(onChunkedResponseComplete)
		.catch(onChunkedResponseError)
  }

  useEffect(() => {
		console.log("FIRST REQUEST")
		getWorkflowStream()
	}, [])

	return (
		<div>
			DONE
			{data.map((innerdata, index) => { 
				return (
					<div key={index}>
						{innerdata}
					</div>
				)
			})}
		</div>
	)
}

export default KeepAlive;
