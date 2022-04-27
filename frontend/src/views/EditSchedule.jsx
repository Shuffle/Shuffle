import React, { useState, useEffect } from "react";

/*
 * It works a little something like this:
 * Choose what source and destination action you want
 * Select the source field to be used for a required destination field OR
 * write a static value for the field (FIXME) OR
 * run a generator action for the field (FIXME, these should be e.g. run workflow and get result)
 */

import Grid from "@material-ui/core/Grid";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import ButtonBase from "@material-ui/core/ButtonBase";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import Table from "@material-ui/core/Table";
import InputAdornment from "@material-ui/core/InputAdornment";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";

import SearchIcon from "@material-ui/icons/Search";
import DeleteIcon from "@material-ui/icons/Delete";

import Downshift from "downshift";
import deburr from "lodash/deburr";

const EditSchedule = (props) => {
  const { globalUrl } = props;

  const [tmpSrcApp, setTmpSrcApp] = useState({});
  const [tmpDstApp, setTmpDstApp] = useState({});
  const [srcApp, setSrcApp] = useState({});
  const [srcAppConfig, setSrcAppConfig] = useState([]);
  const [srcAppConfigOpen, setSrcAppConfigOpen] = useState(false);
  const [srcAppAction, setSrcAppAction] = useState("");

  const [dstApp, setDstApp] = useState({});
  const [dstAppAction, setDstAppAction] = useState("");
  const [dstAppConfig, setDstAppConfig] = useState([]);
  const [dstAppConfigOpen, setDstAppConfigOpen] = useState(false);

  // Lets set the real data here
  const [selectedSrc, setSelectedSrc] = React.useState("");
  const [, setSelectedSrcData] = React.useState({});
  const [selectedDst, setSelectedDst] = React.useState([]);

  // FIXME
  const [suggestions, setSuggestions] = React.useState([]);
  const [inputappdata, setInputAppData] = React.useState({});

  const [scheduleConfig, setScheduleConfig] = React.useState({});
  const [selectedSrcParameters, setSelectedSrcParameters] = React.useState([]);

  const getCurrentSchedule = () => {
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const loadAppSuggestions = () => {
    fetch(globalUrl + "/api/v1/schedules/apps", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setSuggestions(responseJson.apps);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // FIXME - this is generated from app selection input with required items
  useEffect(() => {
    if (Object.getOwnPropertyNames(scheduleConfig).length <= 0) {
      getCurrentSchedule();
    }

    // Load apps if destination or source is
    if (suggestions.length === 0) {
      loadAppSuggestions();
    }

    // Load everything else
    if (
      Object.getOwnPropertyNames(scheduleConfig).length > 0 &&
      Object.getOwnPropertyNames(scheduleConfig.appinfo.sourceapp).length > 0 &&
      Object.getOwnPropertyNames(srcApp).length <= 0
    ) {
      if (scheduleConfig.appinfo.sourceapp.name.length > 0) {
        setSrcApp(scheduleConfig.appinfo.sourceapp);
        setSrcAppAction(scheduleConfig.appinfo.sourceapp.action);
      }
    }

    // Use sourceapp.name&version and sourceapp.action and look for name in inputappdata
    // Basically fix everything in this one lol
    if (
      suggestions.length > 0 &&
      srcAppAction.length > 0 &&
      Object.getOwnPropertyNames(scheduleConfig).length > 0 &&
      Object.getOwnPropertyNames(inputappdata).length <= 0
    ) {
      // Loops all apps and finds current
      for (var key in suggestions) {
        var curapp = suggestions[key];
        if (curapp.name === srcApp.name) {
          break;
        }
      }

      setInputAppData(curapp);

      // Loops the apps actions to find current
      for (key in curapp.output) {
        var curappaction = curapp.output[key];
        if (curappaction.name === srcAppAction) {
          break;
        }
      }

      setSelectedSrcParameters(curappaction.outputparameters);
      if (curappaction.config !== null && curappaction.config !== undefined) {
        setSrcAppConfig(curappaction.config);
      }

      // FIXME - set src of all translator nodes to curappaction.outputparameters[0] if not defined
      //value={scheduleConfig.translator[count].src.name}

      //console.log(scheduleConfig)
      var newtranslator = [];
      for (key in scheduleConfig.translator) {
        var curtranslator = scheduleConfig.translator[key];

        // Overwrite issues
        if (curtranslator.src.name === "") {
          curtranslator.src = curappaction.outputparameters[0];
        }

        newtranslator.push(curtranslator);
      }

      scheduleConfig.translator = newtranslator;
      setScheduleConfig(scheduleConfig);
    }

    if (
      suggestions.length > 0 &&
      dstAppAction.length <= 0 &&
      Object.getOwnPropertyNames(scheduleConfig).length > 0
    ) {
      // Loops all apps and finds current
      for (key in suggestions) {
        curapp = suggestions[key];
        if (curapp.name === dstApp.name) {
          break;
        }
      }

      const curAction = scheduleConfig.appinfo.destinationapp.action;

      // Loops the apps actions to find current
      for (key in curapp.output) {
        curappaction = curapp.output[key];
        if (curappaction.name === curAction) {
          break;
        }
      }

      setDstAppAction(curappaction.name);
      if (curappaction.config !== null && curappaction.config !== undefined) {
        setDstAppConfig(curappaction.config);
      }
    }
  });

  const getSuggestions = (value, type, { showEmpty = false } = {}) => {
    const inputValue = deburr(value.trim()).toLowerCase();
    const inputLength = inputValue.length;
    let count = 0;

    return inputLength === 0 && !showEmpty
      ? []
      : suggestions.filter((suggestion) => {
          const keep =
            count < 5 &&
            suggestion.types &&
            suggestion.types.includes(type) &&
            suggestion.name.slice(0, inputLength).toLowerCase() === inputValue;

          if (keep) {
            count += 1;
          }

          return keep;
        });
  };

  const setSrcAppWrapper = (currentapps) => {
    setSrcApp(currentapps[0]);
    if (currentapps[0].output.length > 0) {
      selectSrcAction(currentapps[0].output[0].name);
    }
  };

  const setDstAppWrapper = (currentapps) => {
    setDstApp(currentapps[0]);
    if (currentapps[0].input.length > 0) {
      selectInitialDstAction(currentapps);
    }
  };

  const renderInput = (type, inputProps) => {
    const { InputProps, classes, ref, ...other } = inputProps;

    // Sets the srcapp if string is matching exactly for name
    if (
      InputProps["aria-activedescendant"] === null &&
      InputProps["value"].length > 0
    ) {
      const currentapps = suggestions.filter(
        (data) => data.name === InputProps["value"]
      );
      if (currentapps.length === 1) {
        if (type === "output") {
          if (currentapps[0].name !== srcApp.name) {
            setSrcAppWrapper(currentapps);
          }
        } else if (type === "input") {
          if (currentapps[0].name !== dstApp.name) {
            setDstAppWrapper(currentapps);
          }
        }
      }
    }

    return (
      <div>
        <TextField
          id="standard-search"
          type="search"
          inputStyle={{ fontSize: "10rem" }}
          InputProps={{
            disableUnderline: true,
            inputRef: ref,
            ...InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          {...other}
        />
      </div>
    );
  };

  const renderSuggestion = (suggestionProps) => {
    const { suggestion, index, itemProps, highlightedIndex, selectedItem } =
      suggestionProps;
    const isHighlighted = highlightedIndex === index;
    const isSelected = (selectedItem || "").indexOf(suggestion.name) > -1;

    return (
      <MenuItem
        {...itemProps}
        key={suggestion.name}
        selected={isHighlighted}
        component="div"
        style={{
          fontWeight: isSelected ? 500 : 400,
        }}
      >
        {suggestion.name}
      </MenuItem>
    );
  };

  const bodyDivStyle = {
    marginLeft: "20px",
    marginTop: "50px",
    marginRight: "20px",
    margin: "auto",
    width: "1350px",
    display: "flex",
  };

  const appActionStyle = {
    height: "50px",
    marginTop: "10px",
  };

  // FIXME - set this
  //const setRelationshipsFromSource = () => {

  //}

  //// FIXME - set this
  //const setRelationshipsFromGenerator = () => {

  //}

  const selectDstAppAction = (event) => {
    if (event.target.value === dstAppAction) {
      return;
    }

    setDstAppAction(event.target.value);
    refactorTranslations(event.target.value);
  };

  const refactorTranslations = (action) => {
    // dstapp is chosen
    var found = false;
    for (var key in dstApp.input) {
      var curinput = dstApp.input[key];
      if (curinput.name === action) {
        found = true;
        break;
      }
    }

    // Should never happen..
    if (!found) {
      return;
    }

    var tmprelationships = [];
    for (key in curinput.inputparameters) {
      var curRelation = { dst: curinput.inputparameters[key], src: {} };
      tmprelationships.push(curRelation);
    }

    scheduleConfig["translator"] = tmprelationships;
    setScheduleConfig(scheduleConfig);
  };

  const selectInitialDstAction = (value) => {
    var action = value[0].input[0].name;
    setDstAppAction(action);

    var found = false;
    for (var key in value) {
      var curinput = value[0].input[key];
      if (curinput.name === action) {
        found = true;
        break;
      }
    }

    // Should never happen..
    if (!found) {
      return;
    }

    var tmprelationships = [];
    for (key in curinput.inputparameters) {
      var curRelation = { dst: curinput.inputparameters[key], src: {} };
      tmprelationships.push(curRelation);
    }

    scheduleConfig["translator"] = tmprelationships;
    setScheduleConfig(scheduleConfig);
  };

  const selectSrcAction = (value) => {
    // FIXME - load the config for this action
    var found = false;

    setSrcAppAction(value);

    var curitem = {};
    for (var key in inputappdata.output) {
      curitem = inputappdata.output[key];
      if (curitem.name === value) {
        found = true;
        break;
      }
    }

    if (!found) {
      setSelectedSrcParameters([]);
      return;
    }

    // Generate this for every relation?
    setSelectedSrcParameters(curitem.outputparameters);

    //FIXME - check if source has the right attribute
    var tmprelationships = [];
    key = 0;
    for (key in scheduleConfig.translator) {
      var curRelation = scheduleConfig.translator[key];
      curRelation["src"] = curitem.outputparameters[0];
      tmprelationships.push(curRelation);
    }

    scheduleConfig["translator"] = tmprelationships;
    setScheduleConfig(scheduleConfig);
  };

  // Wrapper to handle event click
  const selectSrcActionWrapper = (event) => {
    return selectSrcAction(event.target.value);
  };

  const srcappaction =
    Object.getOwnPropertyNames(srcApp).length > 0 && srcApp.output ? (
      <div>
        <FormControl variant="outlined" style={{ marginTop: "10px" }}>
          <InputLabel htmlFor="outlined-age-simple">Actions</InputLabel>
          <Select
            value={srcAppAction}
            onChange={selectSrcActionWrapper}
            style={appActionStyle}
          >
            {srcApp.output.map((data) => (
              <MenuItem value={data.name}>{data.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    ) : null;

  const dstappaction =
    Object.getOwnPropertyNames(dstApp).length > 0 ? (
      <div>
        <FormControl
          fullWidth="true"
          variant="outlined"
          style={{ marginTop: "20px" }}
        >
          <InputLabel htmlFor="outlined-age-simple">Actions</InputLabel>
          <Select
            value={dstAppAction}
            onChange={selectDstAppAction}
            style={appActionStyle}
          >
            {dstApp.input.map((data) => (
              <MenuItem value={data.name}>{data.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    ) : null;

  const downshiftStyle = {
    //marginLeft: "20px",
    //marginTop: "20px",
    //marginRight: "20px",
    display: "flex",
    width: "100%",
  };

  const submitDisabled = selectedSrc.length > 0 && selectedDst.length > 0;
  const submitButtonClick = () => {
    var newtranslations = [];
    var tobeadded = [];
    var tobechanged = [];

    // Go find the information again in testdata

    //newrelationship["translator"] = {"src": {}, "dst": {}}
    //newrelationship["static"] = {}

    // Reformat relationships
    // clean up old relationships
    //

    if (Object.getOwnPropertyNames(scheduleConfig.Translator).length <= 0) {
      return;
    }

    // Clean up old translations for specified elements
    // FIXME - maybe just send a request with relationships and fix in backend?
    // FIXME - there is an issue here for some multifield stuff
    // Literally have to verify every single one anyway..
    for (var selected in selectedDst) {
      var found = false;
      var index = 0;
      for (var key in scheduleConfig["translator"]) {
        if (
          scheduleConfig["translator"][key]["dst"]["name"] ===
          selectedDst[selected]
        ) {
          index = key;
          found = true;
          break;
        }
      }

      if (!found) {
        tobeadded.push(selectedDst[selected]);
      } else {
        // Dst can be the
        tobechanged.push(index);
      }
    }

    var tmprelationships = scheduleConfig;

    key = 0;
    for (key in scheduleConfig["translator"]) {
      if (tobechanged.includes(key)) {
        var tmprel = scheduleConfig["translator"][key];
        tmprel["src"] = { name: selectedSrc };
        tmprelationships["translator"].splice(key, 1);
        newtranslations.push(tmprel);
      }
    }

    key = 0;
    for (key in tobeadded) {
      tmprel = { src: { name: selectedSrc }, dst: { name: tobeadded[key] } };
      newtranslations.push(tmprel);
    }

    // delete deletable keys from copy (new)
    //
    key = 0;
    for (key in newtranslations) {
      tmprelationships["translator"].push(newtranslations[key]);
    }

    setSelectedSrc("");
    setSelectedDst([]);
    setSelectedSrcData({});

    // FIXME - does this work?
    scheduleConfig["translator"] = tmprelationships["translator"];
    setScheduleConfig(scheduleConfig);
  };

  // When it's set, need to find the destination in the row and set static
  const setStaticValue = (event, row) => {
    console.log("HI");
    // FIXME - modify the row first
    // FIXME - set generator and source to "nothing"

    console.log(row.dst.name);
    console.log(row);
    console.log(event.target.value);
    var newsrcrow = {
      name: "static",
      description: "Static value set",
      type: "static",
      value: event.target.value,
      schema: { type: "string" },
    };

    var relationshipclone = JSON.parse(JSON.stringify(scheduleConfig));
    for (var key in scheduleConfig["translator"]) {
      var curItem = scheduleConfig["translator"][key];
      if (curItem.dst.name === row.dst.name) {
        break;
      }
    }

    relationshipclone["translator"][key]["src"] = newsrcrow;

    scheduleConfig["translator"] = relationshipclone["translator"];
    console.log(scheduleConfig);

    // Fuck this :(
    // DO DIS IN FRONTEND AND HAVE A SUBMIT BUTTON :(
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Rewrites relationships clientside
  const setCurrentSrcPropRelation = (event, rowkey) => {
    console.log(event, rowkey);
    var found = false;

    for (var key in selectedSrcParameters) {
      var curItem = selectedSrcParameters[key];
      if (curItem.name === event.target.value) {
        found = true;
        break;
      }
    }

    // No idea how this would ever happen, but but (:
    if (!found) {
      return;
    }

    var row = scheduleConfig.translator[rowkey];
    var rowclone = JSON.parse(JSON.stringify(row));
    rowclone.src = curItem;

    var relationshipclone = JSON.parse(JSON.stringify(scheduleConfig));
    for (key in scheduleConfig["translator"]) {
      curItem = scheduleConfig["translator"][key];
      if (curItem.dst.name === row.dst.name) {
        break;
      }
    }

    relationshipclone["translator"][key] = rowclone;

    scheduleConfig["translator"] = relationshipclone["translator"];
    console.log(scheduleConfig);

    // Fuck this :(
    // DO DIS IN FRONTEND AND HAVE A SUBMIT BUTTON :(
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
      })
      .catch((error) => {
        console.log(error);
      });
    return;
  };

  const relationshipBody =
    Object.getOwnPropertyNames(scheduleConfig).length > 0 &&
    scheduleConfig["translator"] !== undefined &&
    scheduleConfig.translator.length > 0 ? (
      <Table style={{ marginBottom: "30px" }}>
        <TableBody>
          <TableRow key="header">
            <TableCell component="th" scope="row">
              Action
            </TableCell>
            <TableCell component="th" scope="row">
              Source Field
            </TableCell>
            <TableCell component="th" scope="row">
              Destination Field
            </TableCell>
            <TableCell component="th" scope="row">
              Field Type
            </TableCell>
            <TableCell component="th" scope="row">
              Required
            </TableCell>
            <TableCell component="th" scope="row">
              Static
            </TableCell>
            <TableCell component="th" scope="row">
              Generator
            </TableCell>
            <TableCell component="th" scope="row">
              Transform
            </TableCell>
          </TableRow>
          {scheduleConfig.translator.map((row, count) => {
            var buttonIcon = <DeleteIcon />;
            if (!row.dst.required) {
              buttonIcon = (
                <Button
                  disabled={!submitDisabled}
                  onClick={submitButtonClick}
                  variant="outlined"
                  color="primary"
                >
                  REMOVEME
                </Button>
              );
            }

            const srcpropsSelector =
              (Object.getOwnPropertyNames(selectedSrcParameters).length > 0 ||
                Object.getOwnPropertyNames(scheduleConfig.translator).length >
                  0) &&
              Object.getOwnPropertyNames(srcApp).length > 0 ? (
                <Select
                  value={scheduleConfig.translator[count].src.name}
                  style={appActionStyle}
                  onChange={(e) => {
                    setCurrentSrcPropRelation(e, count);
                  }}
                >
                  {selectedSrcParameters.map((data) => (
                    <MenuItem value={data.name}>{data.name}</MenuItem>
                  ))}
                </Select>
              ) : (
                <div>No defined fields</div>
              );

            const placeholderValue =
              row.src.type === "static"
                ? row.src.value
                : "... Set a static value";

            return (
              <TableRow>
                <TableCell component="th" scope="row">
                  {buttonIcon}
                </TableCell>
                <TableCell>{srcpropsSelector}</TableCell>
                <TableCell>{row.dst.name}</TableCell>
                <TableCell>{row.dst.schema.type}</TableCell>
                <TableCell>{row.dst.required}</TableCell>
                <TableCell>
                  <TextField
                    color="primary"
                    name="searchtext"
                    placeholder={placeholderValue}
                    InputProps={{
                      disableUnderline: true,
                    }}
                    onKeyPress={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        console.log(`Pressed keyCode ${event.key}`);
                        setStaticValue(event, row);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>INSERT SCRIPT THINGY - Cortex responder?</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    ) : null;

  // FIXME - use this
  //const submitRelationships = () => {
  //	// Make an API-call to the backend for verification
  //	// Return with failures etc, and mark row issues?
  //
  //	var apiUrl = "http://localhost:5000"
  //	fetch(apiUrl+"/api/v1/schedules",
  //			{
  //				method: "POST",
  //				headers: {"content-type": "application/json"},
  //				body: JSON.stringify(scheduleConfig),
  //			}
  //	)
  //	.then((response) => response.json())
  //	.then((responseJson) => {
  //		console.log(responseJson)
  //	})
  //	.catch((error) => {
  //		console.log(error);
  //	});
  //}

  const executeSchedule = () => {
    fetch(
      globalUrl + "/api/v1/schedules/" + props.match.params.key + "/execute",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const submitButton = (
    <div style={{ margin: "auto", marginTop: "20px" }}>
      <Button onClick={executeSchedule} variant="outlined" color="primary">
        Execute
      </Button>
    </div>
  );

  // Requires src or dst as input
  // FIXME - use this shit to edit an app or something
  //const editButtonFix = (app, apptype) => {
  //	if (apptype === "src") {

  //	} else if (apptype === "dst") {

  //	}
  //}

  const editSrcApp = (event) => {
    // if tmpsrcapp, show RESET (can be an X or something too)
    // if reset is clicked, set source app back to the original
    setTmpSrcApp(scheduleConfig.appinfo.sourceapp);

    var tmpscheduleConfig = scheduleConfig;
    tmpscheduleConfig.appinfo.sourceapp = {};

    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tmpscheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
        setSrcApp({});
        setSrcAppAction("");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const editDstApp = (event) => {
    // if tmpsrcapp, show RESET (can be an X or something too)
    // if reset is clicked, set source app back to the original
    setTmpDstApp(scheduleConfig.appinfo.destinationapp);

    var tmpscheduleConfig = scheduleConfig;
    tmpscheduleConfig.appinfo.destinationapp = {};

    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tmpscheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
        setDstApp({});
        setDstAppAction("");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const scheduleApp = (app, actiondata) => {
    const editButton =
      actiondata === "src" ? (
        <Button
          onClick={(event) => {
            editSrcApp(event);
          }}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          variant="outlined"
          color="primary"
        >
          Edit
        </Button>
      ) : (
        <Button
          onClick={(event) => {
            editDstApp(event);
          }}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          variant="outlined"
          color="primary"
        >
          Edit
        </Button>
      );

    const configureButton =
      actiondata === "src" ? (
        <Button
          disabled={srcAppConfig.length === 0}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={() => setSrcAppConfigOpen(true)}
          variant="outlined"
          color="primary"
        >
          Config
        </Button>
      ) : (
        <Button
          disabled={dstAppConfig.length === 0}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={() => setDstAppConfigOpen(true)}
          variant="outlined"
          color="primary"
        >
          Config
        </Button>
      );

    // FIXME - set src vs dst
    return (
      <Grid container spacing={2} style={{ margin: "10px 10px 10px 10px" }}>
        <Grid item>
          <ButtonBase>
            <img alt="" style={{ width: "100px", height: "100px" }} />
          </ButtonBase>
        </Grid>
        {splitter}
        <Grid item xs={12} sm container style={{ marginLeft: "10px" }}>
          <Grid item xs container direction="column" spacing={2}>
            <Grid item xs>
              <div>
                <h2>{app.name}</h2>
              </div>
              <div>{app.description}</div>
            </Grid>
            <Grid item>{app.action}</Grid>
          </Grid>
          {splitter}
          <Grid
            item
            style={{
              marginLeft: "10px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: "1" }}>{editButton}</div>
            <div style={{ flex: "1" }}>{configureButton}</div>
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

  const dstDownshift = (
    <Downshift style={downshiftStyle}>
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        highlightedIndex,
        inputValue,
        isOpen,
        selectedItem,
      }) => (
        <div style={{ flex: "1" }}>
          {renderInput("input", {
            fullWidth: true,
            InputProps: getInputProps({
              placeholder: "Search destination apps",
            }),
          })}

          <div>
            <div {...getMenuProps()}>
              {isOpen ? (
                <Paper square>
                  {getSuggestions(inputValue, "input").map(
                    (suggestion, index) =>
                      renderSuggestion({
                        suggestion,
                        index,
                        itemProps: getItemProps({ item: suggestion.name }),
                        highlightedIndex,
                        selectedItem,
                      })
                  )}
                </Paper>
              ) : null}
            </div>
            {dstappaction}
          </div>
        </div>
      )}
    </Downshift>
  );

  const srcDownshift = (
    <Downshift style={downshiftStyle}>
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        highlightedIndex,
        inputValue,
        isOpen,
        selectedItem,
      }) => (
        <div style={{ flex: "1" }}>
          {renderInput("output", {
            fullWidth: true,
            InputProps: getInputProps({
              placeholder: "Search source apps",
            }),
          })}

          <div>
            <div {...getMenuProps()}>
              {isOpen ? (
                <Paper square>
                  {getSuggestions(inputValue, "output").map(
                    (suggestion, index) =>
                      renderSuggestion({
                        suggestion,
                        index,
                        itemProps: getItemProps({ item: suggestion.name }),
                        highlightedIndex,
                        selectedItem,
                      })
                  )}
                </Paper>
              ) : null}
            </div>
            {srcappaction}
          </div>
        </div>
      )}
    </Downshift>
  );

  const submitDstApp = (event) => {
    var packagedSrc = {
      name: dstApp.name,
      id: dstApp.id,
      description: dstApp.description,
      action: dstAppAction,
    };

    var tmpscheduleConfig = scheduleConfig;

    tmpscheduleConfig.appinfo.destinationapp = packagedSrc;

    // Hmm, do this here? Idk
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tmpscheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const submitSrcApp = (event) => {
    var packagedSrc = {
      name: srcApp.name,
      id: srcApp.id,
      description: srcApp.description,
      action: srcAppAction,
    };

    var tmpscheduleConfig = scheduleConfig;

    // FIXME - future fred
    //
    tmpscheduleConfig.appinfo.sourceapp = packagedSrc;

    // Hmm, do this here? Idk
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tmpscheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const resetDstApp = (event) => {
    var tmpscheduleConfig = scheduleConfig;
    tmpscheduleConfig.appinfo.destinationapp = tmpDstApp;

    // Hmm, do this here? Idk
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tmpscheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
        setDstApp(tmpSrcApp);
        setDstAppAction(tmpDstApp.action);
        setTmpDstApp({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const resetSrcApp = (event) => {
    var tmpscheduleConfig = scheduleConfig;
    tmpscheduleConfig.appinfo.sourceapp = tmpSrcApp;

    // Hmm, do this here? Idk
    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tmpscheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setScheduleConfig({});
        setSrcApp(tmpSrcApp);
        setSrcAppAction(tmpSrcApp.action);
        setTmpSrcApp({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Based on some srcthing
  const searchGridSrc = (
    <Grid container spacing={2} style={{ margin: "10px 10px 10px 10px" }}>
      <Grid item style={{ width: "100px", height: "100px" }}>
        Choose Source app (FIXME) - clickable
      </Grid>
      {splitter}
      <Grid item xs={12} sm container style={{ marginLeft: "10px" }}>
        <Grid item xs container direction="column" spacing={2}>
          <Grid item xs>
            <div>{srcDownshift}</div>
          </Grid>
        </Grid>
        {splitter}
        <Grid
          item
          style={{
            marginLeft: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: "1" }}>
            <Button
              disabled={Object.getOwnPropertyNames(srcApp).length === 0}
              onClick={(event) => {
                submitSrcApp(event);
              }}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              variant="outlined"
              color="primary"
            >
              Submit
            </Button>
          </div>
          <div style={{ flex: "1" }}>
            <Button
              disabled={Object.getOwnPropertyNames(tmpSrcApp).length === 0}
              onClick={resetSrcApp}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              variant="outlined"
              color="primary"
            >
              Reset
            </Button>
          </div>
        </Grid>
      </Grid>
    </Grid>
  );

  const searchGridDst = (
    <Grid container spacing={2} style={{ margin: "10px 10px 10px 10px" }}>
      <Grid item style={{ width: "100px", height: "100px" }}>
        Choose Source app (FIXME) - clickable
      </Grid>
      {splitter}
      <Grid item xs={12} sm container style={{ marginLeft: "10px" }}>
        <Grid item xs container direction="column" spacing={2}>
          <Grid item xs>
            <div>{dstDownshift}</div>
          </Grid>
        </Grid>
        {splitter}
        <Grid
          item
          style={{
            marginLeft: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: "1" }}>
            <Button
              disabled={Object.getOwnPropertyNames(dstApp).length === 0}
              onClick={(event) => {
                submitDstApp(event);
              }}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              variant="outlined"
              color="primary"
            >
              Submit
            </Button>
          </div>
          <div style={{ flex: "1" }}>
            <Button
              disabled={Object.getOwnPropertyNames(tmpDstApp).length === 0}
              onClick={resetDstApp}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
              variant="outlined"
              color="primary"
            >
              Reset
            </Button>
          </div>
        </Grid>
      </Grid>
    </Grid>
  );

  const srcField =
    Object.getOwnPropertyNames(scheduleConfig).length > 0 &&
    Object.getOwnPropertyNames(scheduleConfig.appinfo.sourceapp).length > 0 &&
    scheduleConfig.appinfo.sourceapp.name.length > 0 ? (
      <div
        style={{
          marginLeft: "20px",
          margintop: "20px",
          marginRight: "20px",
          flex: "1",
        }}
      >
        <Paper
          style={{
            maxWidth: "100%",
            display: "flex",
            padding: "10px 10px 10px 10px",
          }}
        >
          {scheduleApp(scheduleConfig.appinfo.sourceapp, "src")}
        </Paper>
      </div>
    ) : (
      <div
        style={{
          marginLeft: "20px",
          margintop: "20px",
          marginRight: "20px",
          flex: "1",
        }}
      >
        <Paper
          style={{
            minHeight: "136px",
            maxHeight: "136px",
            maxWidth: "100%",
            display: "flex",
            padding: "10px 10px 10px 10px",
          }}
        >
          {searchGridSrc}
        </Paper>
      </div>
    );

  const dstField =
    Object.getOwnPropertyNames(scheduleConfig).length > 0 &&
    Object.getOwnPropertyNames(scheduleConfig.appinfo.destinationapp).length >
      0 &&
    scheduleConfig.appinfo.destinationapp.name.length > 0 ? (
      <div
        style={{
          marginLeft: "20px",
          margintop: "20px",
          marginRight: "20px",
          flex: "1",
        }}
      >
        <Paper
          style={{
            maxWidth: "100%",
            display: "flex",
            padding: "10px 10px 10px 10px",
          }}
        >
          {scheduleApp(scheduleConfig.appinfo.destinationapp, "dst")}
        </Paper>
      </div>
    ) : (
      <div
        style={{
          marginLeft: "20px",
          margintop: "20px",
          marginRight: "20px",
          flex: "1",
        }}
      >
        <Paper
          style={{
            minHeight: "136px",
            maxHeight: "136px",
            maxWidth: "100%",
            display: "flex",
            padding: "10px 10px 10px 10px",
          }}
        >
          {searchGridDst}
        </Paper>
      </div>
    );

  // Have to use array cus of datastore lol (no map[string]string)
  const srcModalData = [];
  const buildSrcModal = (event, fieldname) => {
    var fieldfound = false;
    for (var key in srcModalData) {
      if (srcModalData[key]["key"] === fieldname) {
        fieldfound = true;
        srcModalData[key]["value"] = event.target.value;
        break;
      }
    }

    if (!fieldfound) {
      srcModalData.push({ key: fieldname, value: event.target.value });
    }
    console.log(srcModalData);
  };

  // FIXME - verify required fields?
  const submitSrcConfig = () => {
    scheduleConfig.appinfo.sourceapp.config = srcModalData;
    setScheduleConfig(scheduleConfig);
    setSrcAppConfigOpen(false);

    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const dstModalData = [];
  const buildDstModal = (event, fieldname) => {
    var fieldfound = false;
    for (var key in dstModalData) {
      if (dstModalData[key]["key"] === fieldname) {
        fieldfound = true;
        dstModalData[key]["value"] = event.target.value;
        break;
      }
    }

    if (!fieldfound) {
      dstModalData.push({ key: fieldname, value: event.target.value });
    }
    console.log(dstModalData);
  };

  // FIXME - verify required fields
  const submitDstConfig = () => {
    scheduleConfig.appinfo.destinationapp.config = dstModalData;
    setScheduleConfig(scheduleConfig);
    setDstAppConfigOpen(false);

    fetch(globalUrl + "/api/v1/schedules/" + props.match.params.key, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scheduleConfig),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const dstConfigModal = dstAppConfigOpen ? (
    <Dialog
      modal
      open={dstAppConfigOpen}
      onClose={() => {
        setDstAppConfigOpen(false);
      }}
    >
      <DialogTitle>Source configuration</DialogTitle>
      <DialogContent>
        Configure {dstApp.name}'s required fields
        {dstAppConfig.map((data) => (
          <TextField
            onChange={(event) => {
              buildDstModal(event, data.name);
            }}
            autofocus
            color="primary"
            name="searchtext"
            placeholder={data.name}
            margin="dense"
            id={data.name}
            label={data.name}
            fullWidth
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDstAppConfigOpen(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={() => submitDstConfig()} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  // FIXME - load the actual fields!
  const srcConfigModal = srcAppConfigOpen ? (
    <Dialog
      modal
      open={srcAppConfigOpen}
      onClose={() => {
        setSrcAppConfigOpen(false);
      }}
    >
      <DialogTitle>Source configuration</DialogTitle>
      <DialogContent>
        Configure {srcApp.name}'s required fields
        {srcAppConfig.map((data) => (
          <TextField
            onChange={(event) => {
              buildSrcModal(event, data.name);
            }}
            autofocus
            color="primary"
            name="searchtext"
            placeholder={data.name}
            margin="dense"
            id={data.name}
            label={data.name}
            fullWidth
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSrcAppConfigOpen(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={() => submitSrcConfig()} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  return (
    <div>
      {srcConfigModal}
      {dstConfigModal}
      <div style={bodyDivStyle}>
        {srcField}
        {dstField}
      </div>

      <div style={bodyDivStyle}>{submitButton}</div>
      <div style={bodyDivStyle}>{relationshipBody}</div>
    </div>
  );
};

export default EditSchedule;
