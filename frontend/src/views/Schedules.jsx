import React, { useEffect } from "react";

import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import ButtonBase from "@material-ui/core/ButtonBase";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Button from "@material-ui/core/Button";
//import Breadcrumbs from '@material-ui/core/Breadcrumbs';

const Schedules = (props) => {
  const { globalUrl } = props;

  //const [schedules, setSchedules] = React.useState(scheduledata);
  const [schedules, setSchedules] = React.useState({});

  const getAvailableSchedules = () => {
    fetch(globalUrl + "/api/v1/schedules", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setSchedules(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // FIXME - add automated redirection, as empty apps look horrible currently
  const newSchedule = () => {
    fetch(globalUrl + "/api/v1/schedules/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
        setSchedules({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const deleteSchedule = (id) => {
    if (id === undefined) {
      return;
    }

    fetch(globalUrl + "/api/v1/schedules/" + id + "/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setSchedules({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // FIXME - use this?
  //const getNewScheduleInfo = () => {
  //	fetch(globalUrl+"/api/v1/schedules", {
  //	  	method: 'GET',
  //			headers: {
  //				'Content-Type': 'application/json',
  //				'Accept': 'application/json',
  //			},
  //		})
  //	.then((response) => response.json())
  //	.then((responseJson) => {
  //		setSchedules(responseJson)
  //	})
  //	.catch(error => {
  //		console.log(error)
  //	});
  //}

  useEffect(() => {
    if (Object.getOwnPropertyNames(schedules).length <= 0) {
      getAvailableSchedules();
    }
  });

  const bodyDivStyle = {
    marginLeft: "20px",
    marginRight: "20px",
    width: "1350px",
    minWidth: "1350px",
    maxWidth: "1350px",
  };

  const scheduleApp = (app) => {
    console.log(app);
    return (
      <Grid container spacing={2} style={{ margin: "10px 10px 10px 10px" }}>
        <Grid item>
          <ButtonBase>
            <img alt="" style={{ width: "100px", height: "100px" }} />
          </ButtonBase>
        </Grid>
        <Grid item xs={12} sm container>
          <Grid item xs container direction="column" spacing={2}>
            <Grid item xs>
              <div>
                <h2>{app.name}</h2>
              </div>
              <div>{app.description}</div>
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
  const schedulePaper = (schedule) => {
    return (
      <div>
        <Paper
          style={{
            maxWidth: "1000px",
            display: "flex",
            padding: "10px 10px 10px 10px",
          }}
        >
          <div style={{ flex: "5" }}>
            {scheduleApp(schedule.appinfo.sourceapp)}
          </div>
          <div style={{ flex: "1", alignItems: "center" }}>ARROW</div>
          <div style={{ flex: "5" }}>
            {scheduleApp(schedule.appinfo.destinationapp)}
          </div>
          {splitter}
          <div style={{ flex: "1" }}>
            <List style={{ backgroundColor: "#ffffff" }}>
              <ListItem style={{ flex: "1", textAlign: "center" }}>
                <a href={"/schedules/" + schedule.id} style={hrefStyle}>
                  <Button disabled={false} color="primary">
                    Edit
                  </Button>
                </a>
              </ListItem>
              <ListItem style={{ flex: "1", textAlign: "center" }}>
                <Button
                  disabled={false}
                  onClick={() => {
                    deleteSchedule(schedule.id);
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

  console.log(schedules);
  console.log(schedules);
  console.log(schedules.schedules);
  const schedulemap =
    Object.getOwnPropertyNames(schedules).length > 0 &&
    schedules.schedules &&
    schedules.schedules.length > 0 ? (
      <div>{schedules.schedules.map((data) => schedulePaper(data))}</div>
    ) : (
      <div style={{ marginTop: "10%", marginLeft: "50%" }}>
        <Button
          disabled={false}
          onClick={() => {
            newSchedule();
          }}
          variant="outlined"
          color="primary"
        >
          CREATE NEW SCHEDULE
        </Button>
      </div>
    );

  const scheduleView =
    Object.getOwnPropertyNames(schedules).length > 0 ? (
      <div style={bodyDivStyle}>
        <Button
          disabled={false}
          onClick={() => {
            newSchedule();
          }}
          color="primary"
        >
          New
        </Button>
        {schedulemap}
      </div>
    ) : null;

  // Maybe use gridview or something, idk
  return <div>{scheduleView}</div>;
};

export default Schedules;
