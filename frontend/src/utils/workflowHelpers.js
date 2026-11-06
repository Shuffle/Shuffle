export const triggers = [
  {
    name: "Webhook",
    type: "TRIGGER",
    parameters : [
      {
          "name": "url",
          "example": "",
          "value": ""
      },
      {
          "name": "tmp",
          "example": "",
          "value": "",
      },
      {
        "name": "auth_headers",
        "example": "",
        "value": "",
      },
      {
        "name": "custom_response_body",
        "example": "",
        "value": "",
      },
      {
        "name": "await_response",
        "example": "",
        "value": "v1",
      },
    ],
    status: "uninitialized",
    trigger_type: "WEBHOOK",
    errors: null,
    large_image:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzIxQTBCRCIvPgo8cGF0aCBkPSJNMjMuOTYxNyAxOC4wOTk0QzI1LjAwMDQgMTguMDY5NiAyNS42ODE3IDE5LjE3NTIgMjUuMTg4MiAyMC4wODk2TDI1LjE3NDYgMjAuMTE1TDI1LjE5MDIgMjAuMTM5NEwyNy45ODMyIDI0LjY4MDRMMjguMDA0NiAyNC43MTU2TDI4LjA0MzcgMjQuN0MyOC41MzgzIDI0LjUwMDcgMjkuMDY3MSAyNC4zOTgyIDI5LjYwMDMgMjQuMzk4MkMzMS4wODE0IDI0LjM5ODkgMzIuNDQ5OSAyNS4xODkyIDMzLjE5MTIgMjYuNDcxNEMzNC43ODk2IDI5LjIzNzMgMzIuNzk0OCAzMi42OTY1IDI5LjYwMDMgMzIuNjk4QzI5LjM2ODEgMzIuNjk4IDI5LjE1MzkgMzIuNTczOSAyOS4wMzc4IDMyLjM3MjhDMjguNzg3NyAzMS45Mzk1IDI5LjEgMzEuMzk4MiAyOS42MDAzIDMxLjM5ODJDMzEuMjA2NyAzMS4zOTg4IDMyLjQ5NjEgMzAuMDcyMyAzMi40NSAyOC40NjY2QzMyLjM4NjcgMjYuMjczNiAyOS45NzM3IDI0Ljk3MTYgMjguMTA2MiAyNi4xMjI4QzI3LjgwMDggMjYuMzEwOCAyNy40MDAxIDI2LjIxNSAyNy4yMTE3IDI1LjkwOTlIMjcuMjEyNkwyNC4wODE4IDIwLjgyMkwyNC4wNjcxIDIwLjc5ODZIMjQuMDAwN0MyMy41MzIzIDIwLjc5ODYgMjMuMDk3MSAyMC41NTU4IDIyLjg1MTMgMjAuMTU3QzIyLjMwNjIgMTkuMjcyMyAyMi45MjMgMTguMTI5MyAyMy45NjE3IDE4LjA5OTRaTTE1LjA4MDggMjYuMDU3NEMxNS4zODE0IDI1LjY1NzIgMTYuMDAyNiAyNS43MzI4IDE2LjE5OSAyNi4xOTMxQzE2LjI3ODcgMjYuMzgwMSAxNi4yNjU3IDI2LjU5MTkgMTYuMTY3NyAyNi43NjY0TDE2LjEyMDggMjYuODM4NkMxNS43NDkxIDI3LjMzMSAxNS41NDg1IDI3LjkzMTYgMTUuNTUwNSAyOC41NDg2QzE1LjU1MDcgMzAuNzQyMyAxNy45MjYxIDMyLjExMzIgMTkuODI1OSAzMS4wMTY0QzIwLjcwNzUgMzAuNTA3MyAyMS4yNTA2IDI5LjU2NjYgMjEuMjUwNyAyOC41NDg2QzIxLjI1MDcgMjguMTg5NyAyMS41NDE0IDI3Ljg5ODQgMjEuOTAwMSAyNy44OTgySDI4LjQxNzdMMjguNDMyNCAyNy44NzM4QzI4Ljk1MiAyNi45NzM4IDMwLjI1MTYgMjYuOTczOCAzMC43NzEyIDI3Ljg3MzhDMzEuMjkwMyAyOC43NzM3IDMwLjY0MDMgMjkuODk4MiAyOS42MDEzIDI5Ljg5ODJDMjkuMTE5MiAyOS44OTgxIDI4LjY3MzUgMjkuNjQwOSAyOC40MzI0IDI5LjIyMzRMMjguNDE3NyAyOS4xOThIMjIuNDk4OEwyMi40OTE5IDI5LjI0QzIxLjk1OTcgMzIuMzg5NyAxOC4yMTc0IDMzLjc4MjIgMTUuNzU1NiAzMS43NDY4QzE0LjA0ODEgMzAuMzM0NyAxMy43NTA4IDI3LjgyOTYgMTUuMDgwOCAyNi4wNTc0Wk0yMC42NjA5IDE2Ljk5QzIyLjU1NTQgMTQuNDE3OSAyNi41MjQxIDE0Ljg2MTIgMjcuODA0NCAxNy43ODc4QzI3Ljg5NzMgMTguMDAwOCAyNy44NjkxIDE4LjI0NzQgMjcuNzMxMiAxOC40MzQzQzI3LjQzNCAxOC44MzY0IDI2LjgxMzQgMTguNzY2NCAyNi42MTMgMTguMzA4M1YxOC4zMDc0QzI1Ljk0NTQgMTYuNzc5MyAyNC4xMTM0IDE2LjE0ODUgMjIuNjQ2MiAxNi45NDEyQzIwLjcxNjIgMTcuOTg0IDIwLjYzODYgMjAuNzI1NiAyMi41MDY2IDIxLjg3NTdDMjIuODEyIDIyLjA2MzkgMjIuOTA3MyAyMi40NjM3IDIyLjcxOTUgMjIuNzY5M0wxOS41ODk2IDI3Ljg1NjJMMTkuNTc1IDI3Ljg4MDZMMTkuNTg4NiAyNy45MDZDMjAuMDc1IDI4LjgwNTUgMTkuNDIzNiAyOS44OTgzIDE4LjQwMTEgMjkuODk4MkMxNy45MTk2IDI5Ljg5NzggMTcuNDc0MyAyOS42NDEyIDE3LjIzMzIgMjkuMjI0NEMxNi43MTI5IDI4LjMyNDggMTcuMzYxOSAyNy4xOTg4IDE4LjQwMTEgMjcuMTk4SDE4LjQ2NzVMMTguNDgyMiAyNy4xNzQ2TDIxLjI3NjEgMjIuNjM1NUwyMS4yOTg2IDIyLjU5OTRMMjEuMjY2NCAyMi41NzFDMTkuNjQ2MSAyMS4xNTAxIDE5LjM4MjkgMTguNzI1MiAyMC42NjA5IDE2Ljk5WiIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzIxQTBCRCIgc3Ryb2tlLXdpZHRoPSIwLjEiLz4KPC9zdmc+Cg==",
    is_valid: true,
    label: "Webhook",
    environment: "onprem",
    description: "Custom HTTP input trigger",
    long_description: "Execute a workflow with an unauthicated POST request",
    id: "",
  },
  {
    name: "Schedule",
    type: "TRIGGER",
    parameters : [
      {
          "name": "cron",
          "example": "",
          "value": "*/25 * * * *"
      },
      {
          "name": "execution_argument",
          "example": "",
          "value": "",
      },
    ],
    status: "uninitialized",
    trigger_type: "SCHEDULE",
    errors: null,
    large_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0UzQTQxQiIvPgo8cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEyIDEyKSIgZmlsbD0iI0UzQTQxQiIvPgo8Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSI4Ljc1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMjguNSAyNEgyNC4yNUMyNC4xMTE5IDI0IDI0IDIzLjg4ODEgMjQgMjMuNzVWMjAuNSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=",
    label: "Schedule",
    is_valid: true,
    environment: "onprem",
    description: "Schedule time trigger",
    long_description: "Create a schedule based on cron",
    id: "",
  },
  {
    name: "Pipelines",
    type: "TRIGGER",
    status: "uninitialized",
    description: "Run a pipeline trigger",
    trigger_type: "PIPELINE",
    errors: null,
    is_valid: true,
    label: "Pipeline",
    environment: "onprem",
    large_image: "/images/workflows/tenzir2.png",
    long_description: "Controls a pipeline to run things",
    id: "",
  },
  {
    name: "Shuffle Workflow",
    type: "TRIGGER",
    status: "uninitialized",
    trigger_type: "SUBFLOW",
    errors: null,
    large_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzMxN181OTcpIi8+CjxwYXRoIGQ9Ik0xNS45OTk4IDE2LjAwMTVMMTUuOTk5OCAyNS43NDA2TDE5LjIwMDEgMjUuNzQwNkwxOS4yMDAxIDE5LjI0ODVMMzEuOTk5OCAxOS4yNDg1TDMxLjk5OTggMTYuMDAxNUwxNS45OTk4IDE2LjAwMTVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjguNzk5NCAyMi4yNjE3TDI4Ljc5OTQgMjguNzUzOEwxNS45OTk4IDI4Ljc1MzhMMTUuOTk5OCAzMi4wMDA4TDMxLjk5OTggMzIuMDAwOEwzMS45OTk4IDIyLjI2MTdMMjguNzk5NCAyMi4yNjE3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI1LjczOSAyMi4yNjE3TDIyLjI2MDcgMjIuMjYxN0wyMi4yNjA3IDI1Ljc0TDI1LjczOSAyNS43NEwyNS43MzkgMjIuMjYxN1oiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMzE3XzU5NyIgeDE9Ii03LjcwNzc2ZS0wOSIgeTE9IjI3LjA3NjkiIHgyPSI0OC4wMDE0IiB5Mj0iMjYuOTM3NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjRkY4NDQ0Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0YyNjQzQiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPgo=",
    is_valid: true,
    label: "Subflow",
    environment: "onprem",
    description: "Run a Subflow trigger",
    long_description: "Execute another workflow from this workflow",
    id: "",
  },
  {
    name: "User Input",
    type: "TRIGGER",
    parameters: [
      {
          "name": "alertinfo",
          "example": "",
          "value": "## Stop or continue?\n\nDetails: $exec",
      },
      {
          "name": "options",
          "example": "",
          "value": "boolean",
      },
      {
          "name": "type",
          "example": "",
          "value": "subflow",
      },
      {
          "name": "email",
          "example": "",
          "value": "test@test.com",
      },
      {
          "name": "sms",
          "example": "",
          "value": "0000000",
      },
      {
          "name": "subflow",
          "example": "",
          "value": "",
      },
      {
          "name": "subflow_failure",
          "example": "",
          "value": "",
      }
    ],
    status: "running",
    large_image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzg2MzZCNCIvPgo8cGF0aCBkPSJNMjEuMjgyMiAxNi43VjE0LjdNMTYuNzgyMiAyMS4ySDE0Ljc4MjJNMTcuOTc5MSAyNC41MDMyTDE2LjU2NDkgMjUuOTE3NE0yNS45OTk3IDE2LjQ4MjRMMjQuNTg1NCAxNy44OTY2TTE2LjU2NDggMTYuNDgyNUwxNy45NzkgMTcuODk2N00yNS4yODk4IDMyLjM1MDRMMjYuNzc3NyAyOC40NTc4QzI2Ljk3OTYgMjcuOTI5NSAyNy40NDggMjcuNTQ5IDI4LjAwNjUgMjcuNDU5N0wzMS42MjY0IDI2Ljg4MDVDMzMuMTkwOSAyNi42MzAyIDMzLjQ1ODUgMjQuNDkxNiAzMi4wMDQgMjMuODYzNEwyMi4zNDUyIDE5LjY5MjdDMjEuMTc1MSAxOS4xODc0IDE5LjkxNzkgMjAuMjAxMyAyMC4xNjQgMjEuNDUxOUwyMi4yNTczIDMyLjA5MDhDMjIuNTY0MyAzMy42NTEgMjQuNzIyMSAzMy44MzU4IDI1LjI4OTggMzIuMzUwNFoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS4yNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=",
    description: "Wait for user input trigger",
    trigger_type: "USERINPUT",
    is_valid: true,
    errors: null,
    label: "User input",
    environment: "cloud",
    long_description: "Take user input to continue execution",
    id: "",
  }
];
// Adds specific text to items

export function sortByKey(array, key) {
  if (array === undefined) {
    return [];
  }

  if (key.startsWith("-") && key.length > 2) {
    key = key.slice(1, key.length);
    return array
      .sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return x < y ? -1 : x > y ? 1 : 0;
      })
      .reverse();
  }

  if (array === undefined || array === null) {
    return [];
  }

  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

// look for keys and set values with shuffle dotnotation 
// used primarily for AI autocompletions
export function SetJsonDotnotation(jsonInput, inputKey) {

  if (jsonInput === undefined || jsonInput === null) {
    return jsonInput;
  }

  // Check for array
  if (Array.isArray(jsonInput)) {
    for (var i = 0; i < jsonInput.length; i++) {
      jsonInput[i] = SetJsonDotnotation(jsonInput[i], inputKey + ".#");
    }

    return jsonInput;
    // Check for dict
  } else if (typeof jsonInput === "object") {
    // Loop keys and values

    for (var key in jsonInput) {
      if (!jsonInput.hasOwnProperty(key)) {
        continue
      }

      const value = jsonInput[key];
      // Check if array
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          jsonInput[key][i] = SetJsonDotnotation(jsonInput[key][i], inputKey + "." + key + ".#");
        }
      } else if (typeof value === "object") {
        jsonInput[key] = SetJsonDotnotation(jsonInput[key], inputKey + "." + key);
      } else {
        jsonInput[key] = inputKey + "." + key
      }
    }
  } else {
    //jsonInput = inputKey

    console.log("SetJsonDotnotation: jsonInput is not an object or array, but key ", jsonInput, typeof jsonInput);
  }

  return jsonInput;
}


//export const green = "#86c142";
export const green = "#2BC07E"
export const yellow = "#FFC633";
export const red = "#F53434";
export const grey = "#b0b0b0";

export function removeParam(key, sourceURL) {
  if (sourceURL === undefined) {
    return;
  }

  var rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    queryString = sourceURL.indexOf("?") !== -1 ? sourceURL.split("?")[1] : "";

  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (let i = params_arr.length - 1; i >= 0; i -= 1) {
      param = params_arr[i].split("=")[0];
      if (param === key) {
        params_arr.splice(i, 1);
      }
    }
    rtn = rtn + "?" + params_arr.join("&");
  }

  if (rtn === "?") {
    return "";
  }

  return rtn;
}

const ACTION_STATES_STORAGE_KEY = "shuffle_action_tab_states";

export function getActionState(actionId, workflowId = null) {
  const defaultState = {
    tab: "setup",
    showOptionalParams: false,
    userSelectedTab: false,
  };

  try {
    const stored = localStorage.getItem(ACTION_STATES_STORAGE_KEY);
    if (!stored) return defaultState;

    const allStates = JSON.parse(stored);
    
    // Handle both old flat structure and new nested structure for backward compatibility
    let actionState = {};
    if (workflowId && allStates[workflowId] && allStates[workflowId][actionId]) {
      // New nested structure: workflowId -> actionId -> state
      actionState = allStates[workflowId][actionId];
    }

    // Validate tab value
    const validTabs = ["setup", "configuration"];
    const tab = validTabs.includes(actionState.tab) ? actionState.tab : defaultState.tab;

    return {
      tab,
      showOptionalParams: actionState.showOptionalParams === true,
      userSelectedTab: actionState.userSelectedTab === true,
    };
  } catch (e) {
    return defaultState;
  }
}

export function setActionState(actionId, updates, workflowId = null) {
  if (!actionId || !updates) return;

  try {
    const stored = localStorage.getItem(ACTION_STATES_STORAGE_KEY);
    const allStates = stored ? JSON.parse(stored) : {};

    if (workflowId) {
      // New nested structure: workflowId -> actionId -> state
      if (!allStates[workflowId]) {
        allStates[workflowId] = {};
      }
      if (!allStates[workflowId][actionId]) {
        allStates[workflowId][actionId] = {};
      }
      Object.assign(allStates[workflowId][actionId], updates);
    }

    localStorage.setItem(ACTION_STATES_STORAGE_KEY, JSON.stringify(allStates));
  } catch (e) {
    console.error("Failed to save action state:", e);
  }
}

// Will use this function to remove the action data when the node will get removed from the cytoscape.
export function removeActionState(actionId, workflowId = null) {
  if (!actionId) return;

  try {
    const stored = localStorage.getItem(ACTION_STATES_STORAGE_KEY);
    if (!stored) return;

    const allStates = JSON.parse(stored);
    
    if (workflowId && allStates[workflowId]) {
      delete allStates[workflowId][actionId];
      
      // Clean up empty workflow objects
      if (Object.keys(allStates[workflowId]).length === 0) {
        delete allStates[workflowId];
      }
    }

    localStorage.setItem(ACTION_STATES_STORAGE_KEY, JSON.stringify(allStates));
  } catch (e) {
    console.error("Failed to remove action state:", e);
  }
}

