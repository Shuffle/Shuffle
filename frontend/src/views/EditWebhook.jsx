import React, { useState, useEffect } from "react";

import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Divider from "@material-ui/core/Divider";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import WebhookImage from "../assets/img/webhook.png";
import KafkaImage from "../assets/img/kafka.png";

import EditWorkflow from "./EditWorkflow";

const EditWebhook = (props) => {
  const { globalUrl, isLoaded } = props;

  // FIXME
  //const [webhookData, setWebhookData] = useState(webhooktest)
  const [webhookData, setWebhookData] = useState({});
  const [workflows, setWorkflows] = useState([]);
  const [firstrequest, setFirstrequest] = React.useState(true);

  const [selectedWorkflows, setSelectedWorkflows] = useState([]);

  const getWorkflows = () => {
    fetch(globalUrl + "/api/v1/workflows", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200 for workflows :O!");
        }
        return response.json();
      })
      .then((responseJson) => {
        setWorkflows(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const setWebhook = (inputdata) => {
    console.log(inputdata);

    fetch(globalUrl + "/api/v1/hooks/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(inputdata),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getCurrentWebhook = () => {
    fetch(globalUrl + "/api/v1/hooks/" + props.match.params.key, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Status not 200!");
          window.location.pathname = "webhooks";
        }
        return response.json();
      })
      .then((responseJson) => {
        if (responseJson.actions === null) {
          responseJson.actions = [];
        }

        if (responseJson.transforms === null) {
          responseJson.transforms = [];
        }

        setWebhookData(responseJson);
      })
      .catch((error) => {
        console.log(error);
        //window.location.pathname = "webhooks"
      });
  };

  useEffect(() => {
    if (firstrequest) {
      setFirstrequest(false);
      getCurrentWebhook();
      if (workflows.length <= 0) {
        getWorkflows();
      }
    }

    // After everything is loaded
    if (
      Object.getOwnPropertyNames(webhookData).length > 0 &&
      webhookData.actions.length > 0 &&
      workflows.length > 0 &&
      selectedWorkflows.length === 0
    ) {
      // Setting startup actions. making like this in case we want other actions
      var tmpActionWorkflows = [];
      for (var key in webhookData.actions) {
        if (webhookData.actions[key].type === "workflow") {
          tmpActionWorkflows.push(webhookData.actions[key]);
        }
      }

      // Fix duplicates... Meh
      var foundWorkflowIds = [];
      var tmpWorkflows = [];
      for (key in tmpActionWorkflows) {
        if (foundWorkflowIds.includes(tmpActionWorkflows[key].id)) {
          continue;
        }

        for (var subkey in workflows) {
          if (tmpActionWorkflows[key].id === workflows[subkey]["id_"]) {
            console.log(tmpActionWorkflows[key].id, workflows[subkey]["id_"]);
            foundWorkflowIds.push(tmpActionWorkflows[key].id);
            tmpWorkflows.push(workflows[subkey]);
            break;
          }
        }
      }

      if (tmpWorkflows.length > 0) {
        setSelectedWorkflows(tmpWorkflows);
      }
    }
  });

  const hookPicture =
    Object.getOwnPropertyNames(webhookData).length > 0 &&
    webhookData.type === "webhook" ? (
      <img src={WebhookImage} alt="webhook" width="100px" height="100px" />
    ) : (
      <img src={KafkaImage} alt="MQ" width="100px" height="100px" />
    );

  const executeHook = (action) => {
    fetch(
      globalUrl + "/api/v1/hooks/" + props.match.params.key + "/" + action,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => response.json())
      .then((responseJson) => {
        setWebhookData({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const headerPaperStyle = {
    display: "flex",
    maxHeight: "800px",
    minHeight: "800px",
    margin: "10px 30px 10px 10px",
    padding: "10px 5px 5px 5px",
    flexDirection: "column",
  };

  // FIXME - add with counter to change the correct one (not just edit)
  const addNewWorkflow = (event) => {
    // Verify if it already exists in the array. Returns if it exists
    for (var key in selectedWorkflows) {
      var item = selectedWorkflows[key];
      if (item["id_"] === event.target.value["id_"]) {
        return;
      }
    }

    // FIXME - make this possible for all accounts
    if (selectedWorkflows.length === 0) {
      console.log("ADD FIRST ITEM FOR SELECTEDWORKFLOWS");
      console.log(event.target.value);

      // Cleanup previous actions
      var newActions = [];
      if (webhookData.actions.length > 0) {
        for (key in webhookData.actions) {
          if (
            webhookData.actions[key].type === "" ||
            webhookData.actions[key].type === undefined
          ) {
            continue;
          }

          newActions.push(webhookData.actions[key]);
        }
      }

      // FIXME - how to stringify this better hurr
      var formattedWorkflow = {
        type: "workflow",
        name: event.target.value.name,
        id: event.target.value.id_,
        field: "",
      };

      // FIXME: patch this n
      newActions.push(formattedWorkflow);
      console.log(newActions);

      webhookData.actions = newActions;
      setWebhook(webhookData);
    }

    var tmpSelectedWorkflows = [].concat(selectedWorkflows, [
      event.target.value,
    ]);
    setSelectedWorkflows(tmpSelectedWorkflows);
  };

  // FIXME
  // Create a list with + button
  // For each, choose the new workflow I wanna add
  // Current: JUST ONE
  const selectedWorkflowIds = selectedWorkflows.map((data) => {
    return data["id_"];
  });
  const availableWorkflows = workflows.filter(
    (data) => !selectedWorkflowIds.includes(data["id_"])
  );

  const WorkflowSelect = (counter) => {
    if (selectedWorkflows[counter.counter] === undefined) {
      return null;
    }

    console.log(selectedWorkflows[0]);
    console.log(selectedWorkflows[0]);
    console.log(selectedWorkflows[0]);
    console.log(selectedWorkflows[counter.counter]);
    console.log(selectedWorkflows[counter.counter].name);
    return (
      <div>
        Workflow select:
        <Select
          value={selectedWorkflows[counter.counter].name}
          onChange={(event) => {
            addNewWorkflow(event, counter.counter);
          }}
          displayEmpty
          name="workflow"
        >
          {availableWorkflows.map((data) => (
            <MenuItem key={data.name} value={data} name={data.name}>
              {data.name}
            </MenuItem>
          ))}
        </Select>
      </div>
    );
  };

  const extraWorkflow =
    workflows.length > 0 && availableWorkflows.length > 0 ? (
      <WorkflowSelect counter={selectedWorkflows.length} />
    ) : null;

  const multiWorkflowSelect =
    workflows.length > 0 && selectedWorkflows.length > 0 ? (
      <div>
        {selectedWorkflows.map((data, count) => (
          <WorkflowSelect key={count} counter={count} />
        ))}
        {extraWorkflow}
      </div>
    ) : (
      <WorkflowSelect counter={0} />
    );

  const headerInfo =
    Object.getOwnPropertyNames(webhookData).length > 0 ? (
      <div>
        <Paper style={headerPaperStyle}>
          <div style={{ display: "flex", flex: "1" }}>
            <div style={{ flex: "1" }}>{hookPicture}</div>
            <div
              style={{ display: "flex", flexDirection: "column", flex: "5" }}
            >
              <div style={{ flex: "1" }}>
                <h1>Name: {webhookData.info.name}</h1>
              </div>
            </div>
          </div>
          <div style={{ flex: "4" }}>
            Description: {webhookData.info.description}
            <div>Id: {webhookData.id}</div>
            <div>Url: {webhookData.info.url}</div>
            <div>Type: {webhookData.type}</div>
            <div>Status: {webhookData.status}</div>
            <div>
              CHOOSE ACTIONS:
              {multiWorkflowSelect}
            </div>
          </div>
          <Divider />
          <div style={{ flex: "1", display: "flex", flexDirection: "row" }}>
            <div style={{ flex: "1" }}>
              <Button
                disabled={
                  webhookData.running === true && webhookData.name !== ""
                }
                onClick={() => {
                  executeHook("start");
                }}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                variant="outlined"
                color="primary"
              >
                Start {webhookData.type}
              </Button>
            </div>
            <div style={{ flex: "1" }}>
              <Button
                disabled={webhookData.running === false}
                onClick={() => {
                  executeHook("stop");
                }}
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                variant="outlined"
                color="primary"
              >
                Stop {webhookData.type}
              </Button>
            </div>
          </div>
        </Paper>
      </div>
    ) : null;

  // FIXME - needs refresh every time you add a new workflow
  const workflowdata =
    Object.getOwnPropertyNames(webhookData).length > 0 &&
    selectedWorkflows.length > 0 ? (
      <EditWorkflow
        globalUrl={globalUrl}
        inputworkflows={selectedWorkflows}
        inputname={webhookData.info.name}
        inputtype={webhookData.type}
      />
    ) : null;

  const loadedCheck = isLoaded ? (
    <div style={{ display: "flex", backgroundColor: "#f7f7f7" }}>
      <div style={{ flex: 1 }}>{workflowdata}</div>
      <div style={{ flex: 1 }}>{headerInfo}</div>
    </div>
  ) : (
    <div></div>
  );

  // FIXME: Use this for testing
  // <EditWorkflow globalUrl={globalUrl} inputname={"Helo?"} inputtype={"webhook"} /> : null
  return <div>{loadedCheck}</div>;
};

export default EditWebhook;
