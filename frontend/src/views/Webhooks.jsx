import React, { useEffect } from "react";

import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import ButtonBase from "@material-ui/core/ButtonBase";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import WebhookImage from "../assets/img/webhook.png";
import KafkaImage from "../assets/img/kafka.png";

const Webhooks = (props) => {
  const { globalUrl, isLoaded } = props;
  const validtypes = ["webhook"];

  //const [hooks, setSchedules] = React.useState(hookdata);
  const [hooks, setHooks] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newHookName, setNewHookName] = React.useState("");
  const [newHookDescription, setNewHookDescription] = React.useState("");
  const [newHookType, setNewHookType] = React.useState("");
  const [firstrequest, setFirstrequest] = React.useState(true);
  const [, setModalError] = React.useState("");

  useEffect(() => {
    if (firstrequest) {
      setFirstrequest(false);
      getAvailableHooks();
    }
  });

  const newHook = () => {
    if (newHookName.length === 0) {
      setModalError("Missing name in modal");
      return;
    }

    if (!validtypes.includes(newHookType)) {
      setModalError(
        newHookType + " is not a valid type. Try this: " + validtypes
      );
    }

    fetch(globalUrl + "/api/v1/hooks/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: newHookName,
        description: newHookDescription,
        type: newHookType,
      }),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
        setHooks([]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getAvailableHooks = () => {
    fetch(globalUrl + "/api/v1/hooks", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setHooks(responseJson);
      })
      .catch((error) => {
        console.log(error);
        // window.location.pathname = "/"
      });
  };

  const deleteHook = (id) => {
    if (id === undefined) {
      return;
    }

    fetch(globalUrl + "/api/v1/hooks/" + id + "/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setHooks([]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const bodyDivStyle = {
    marginLeft: "20px",
    marginRight: "20px",
    width: "1350px",
    minWidth: "1350px",
    maxWidth: "1350px",
  };

  const hookApp = (app) => {
    // Might be more options, but should be webhook or MQ
    const appPicture =
      app.type === "webhook" ? (
        <img src={WebhookImage} alt="webhook" width="100px" height="100px" />
      ) : (
        <img src={KafkaImage} alt="MQ" width="100px" height="100px" />
      );

    return (
      <Grid container spacing={2} style={{ margin: "10px 10px 10px 10px" }}>
        <Grid item style={{ marginRight: "10px" }}>
          <ButtonBase>{appPicture}</ButtonBase>
        </Grid>
        {splitter}
        <Grid item xs={12} sm container style={{ marginLeft: "10px" }}>
          <Grid item xs container direction="column" spacing={2}>
            <Grid item xs>
              <div>
                <h2>{app.info.name}</h2>
              </div>
              <div>Desc: {app.info.description}</div>
              <div>Status: {app.status}</div>
            </Grid>
            <Grid item>{app.action}</Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const splitter = (
    <div
      style={{
        width: "1px",
        backgroundColor: "grey",
        margin: "5px 5px 5px 5px",
      }}
    />
  );

  const hrefStyle = {
    color: "#385f71",
    textDecoration: "none",
  };

  // FIXME - add Schedule modal
  const hookPaper = (hook) => {
    return (
      <div>
        <Paper
          style={{
            maxWidth: "500px",
            display: "flex",
            padding: "10px 10px 10px 10px",
            marginTop: "10px",
          }}
        >
          <div style={{ flex: "5" }}>{hookApp(hook)}</div>
          {splitter}
          <div style={{ flex: "1" }}>
            <List style={{ backgroundColor: "#ffffff" }}>
              <ListItem style={{ flex: "1", textAlign: "center" }}>
                <a href={"/webhooks/" + hook.id} style={hrefStyle}>
                  <Button disabled={false} color="primary">
                    Edit
                  </Button>
                </a>
              </ListItem>
              <ListItem style={{ flex: "1", textAlign: "center" }}>
                <Button
                  disabled={false}
                  onClick={() => {
                    deleteHook(hook.id);
                  }}
                  color="primary"
                >
                  Delete
                </Button>
              </ListItem>
            </List>
          </div>
        </Paper>
      </div>
    );
  };

  const modalView = modalOpen ? (
    <Dialog
      modal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <DialogTitle>Hook configuration</DialogTitle>
      <DialogContent>
        <TextField
          onChange={(event) => {
            setNewHookName(event.target.value);
          }}
          color="primary"
          placeholder="Name"
          margin="dense"
          fullWidth
        />
        <TextField
          onChange={(event) => {
            setNewHookDescription(event.target.value);
          }}
          color="primary"
          placeholder="Description"
          margin="dense"
          fullWidth
        />

        <Select
          value={newHookType}
          onChange={(event) => {
            setNewHookType(event.target.value);
          }}
          fullWidth="true"
        >
          {validtypes.map((data) => (
            <MenuItem value={data}>{data}</MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModalOpen(false)} color="primary">
          Cancel
        </Button>
        <Button
          disabled={
            newHookName.length === 0 || !validtypes.includes(newHookType)
          }
          onClick={() => {
            newHook();
            setModalOpen(false);
          }}
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  const hookmap =
    hooks.length > 0 ? (
      <div>{hooks.map((data) => hookPaper(data))}</div>
    ) : (
      <div style={{ marginTop: "10%", marginLeft: "50%" }}>
        <Button
          disabled={false}
          onClick={() => {
            setModalOpen(true);
          }}
          variant="outlined"
          color="primary"
        >
          CREATE NEW HOOK
        </Button>
      </div>
    );

  const hookView = (
    <div style={bodyDivStyle}>
      <Button
        disabled={false}
        onClick={() => {
          setModalOpen(true);
        }}
        color="primary"
      >
        New
      </Button>
      {hookmap}
    </div>
  );

  const loadedCheck = isLoaded ? (
    <div>
      {modalView}
      {hookView}
    </div>
  ) : (
    <div></div>
  );

  // Maybe use gridview or something, idk
  return <div>{loadedCheck}</div>;
};

export default Webhooks;
