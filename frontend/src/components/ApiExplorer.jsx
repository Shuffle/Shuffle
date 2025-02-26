import ReactJson from "react-json-view-ssr";
import React, { useState, useEffect, useRef, useCallback, memo, useContext} from "react";
import { toast } from "react-toastify";
import { 
  Search as SearchIcon,
} from "@mui/icons-material";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-gruvbox";
import {
  Paper,
  Button,
  Box,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Select,
  Typography,
  TableRow,
  InputAdornment,
  Divider,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import throttle from "lodash/throttle";
import theme from "../theme.jsx";
import { validateJson, collapseField, } from "../views/Workflows.jsx";

import DeleteIcon from "@mui/icons-material/Delete";
import { Context } from "../context/ContextApi.jsx";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, padding: 0, backgroundColor: "#1a1a1a" }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const RequestMethods = [
  {
    value: "GET",
    color: "#61afee",
  },
  {
    value: "POST",
    color: "#49cc90",
  },
  {
    value: "DELETE",
    color: "#f93e3e",
  },
  {
    value: "PUT",
    color: "#fca130",
  },
  {
    value: "PATCH",
    color: "#50e3c2",
  },
  {
    value: "CONNECT",
    color: "#ff69b4",
  },
  {
    value: "HEAD",
    color: "#9012fe",
  },
];

const ApiExplorer = memo(({ openapi, globalUrl, userdata, HandleApiExecution, selectedAppData, ConfigurationTab, isLoggedIn, isLoaded }) => {
  const [actions, setActions] = useState([]);
  const [info, setInfo] = useState({});
  const [serverurl, setServerUrl] = useState("");
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [ExampleBody, setExampleBody] = useState({});
  const [filteredActions, setFilteredActions] = useState([]);

  const [firstSendDone, setFirstSendDone] = useState(false)

  const getJsonObject = (properties) => {

    let jsonObject = {};
    for (let key in properties) {
      const property = properties[key];

      let subloop = false;
      if (property.hasOwnProperty("type")) {
        if (property.type === "object" || property.type === "array") {
          subloop = true;
        }
      }

      if (subloop) {
        if (
          property.hasOwnProperty("items") &&
          property.items.hasOwnProperty("properties")
        ) {
          const jsonret = getJsonObject(property.items.properties);
          if (property.type === "array") {
            jsonObject[key] = [jsonret];
          } else {
            jsonObject[key] = jsonret;
          }
        } else {
          if (property.hasOwnProperty("properties")) {
            const jsonret = getJsonObject(property.properties);
            if (property.type === "array") {
              jsonObject[key] = [jsonret];
            } else {
              jsonObject[key] = jsonret;
            }
          } else {
          }
        }
      } else {
        if (property.hasOwnProperty("example")) {
          jsonObject[key] = property.example;
        } else if (
          property.hasOwnProperty("enum") &&
          property.enum.length > 0
        ) {
          jsonObject[key] = property.enum[0];
        } else if (property.hasOwnProperty("default")) {
          jsonObject[key] = property.default;
        } else if (property.hasOwnProperty("maximum")) {
          jsonObject[key] = property.maximum;
        } else if (property.hasOwnProperty("minimum")) {
          jsonObject[key] = property.minimum;
        } else if (property.hasOwnProperty("type")) {
          if (property.type === "integer" || property.type === "number") {
            jsonObject[key] = 0;
          } else if (property.type === "boolean") {
            jsonObject[key] = false;
          } else if (property.type === "string") {
            jsonObject[key] = "";
          } else {
          }
        } else {
        }
      }
    }

    return jsonObject;
  };

  const handleGetRef = (parameter, data) => {
    try {
      if (parameter === null || parameter["$ref"] === undefined) {
        return parameter;
      }
    } catch (e) {
      return parameter;
    }

    const paramsplit = parameter["$ref"].split("/");
    if (paramsplit[0] !== "#") {
      return parameter;
    }

    var newitem = data;
    for (let paramkey in paramsplit) {
      var tmpparam = paramsplit[paramkey];
      if (tmpparam === "#") {
        continue;
      }

      if (newitem[tmpparam] === undefined) {
        return parameter;
      }

      newitem = newitem[tmpparam];
    }
    return newitem;
  };

  useEffect(() => {
    if (openapi !== undefined && openapi !== null) {
      parseIncomingOpenapiData(openapi);
    }
  }, [openapi]);

  const parseIncomingOpenapiData = useCallback((data) => {
    if (data.info !== null && data.info !== undefined) {
      setInfo(data.info);
    }

    try {
      if (data.info !== null && data.info !== undefined) {
        if (data.info.title !== undefined && data.info.title !== null) {
          if (data.info.title.endsWith(" API")) {
            data.info.title = data.info.title.substring(
              0,
              data.info.title.length - 4
            );
          } else if (data.info.title.endsWith("API")) {
            data.info.title = data.info.title.substring(
              0,
              data.info.title.length - 3
            );
          }
        }

        document.title = data.info.title + " Rest API"

        if (
          data.info["x-catefies"] !== undefined &&
          data.info["x-categories"].length > 0
        ) {
          if (Array.isArray(data.info["x-categories"])) {
          } else {
          }
        }
      }
    } catch (e) {}

    try {
      if (data.tags !== undefined && data.tags.length > 0) {
        var newtags = [];
        for (let tagkey in data.tags) {
          if (data.tags[tagkey]?.name.length > 50) {
            continue;
          }

          newtags.push(data.tags[tagkey]?.name);
        }

        if (newtags.length > 10) {
          newtags = newtags.slice(0, 9);
        }
      }
    } catch (e) {}

    // This is annoying (:
    // Weird generator problems to be handle
    var securitySchemes = undefined;
    try {
      if (data.securitySchemes !== undefined) {
        securitySchemes = data.securitySchemes;
        if (securitySchemes === undefined) {
          securitySchemes = data.securityDefinitions;
        }
      }

      if (securitySchemes === undefined && data.components !== undefined) {
        securitySchemes = data.components.securitySchemes;
        if (securitySchemes === undefined) {
          securitySchemes = data.components.securityDefinitions;
        }
      }
    } catch (e) {}

    const allowedfunctions = [
      "GET",
      "CONNECT",
      "HEAD",
      "DELETE",
      "POST",
      "PATCH",
      "PUT",
    ];

    var newActions = [];
    var wordlist = {};
    var all_categories = [];
    var parentUrl = "";

    if (data.paths !== null && data.paths !== undefined) {
      for (let [path, pathvalue] of Object.entries(data.paths)) {
        for (let [method, methodvalue] of Object.entries(pathvalue)) {
          if (methodvalue === null) {
            continue;
          }

          if (!allowedfunctions.includes(method.toUpperCase())) {
            // Typical YAML issue
            if (method !== "parameters") {
              //toast("Skipped method (not allowed): " + method);
            }
            continue;
          }

          var tmpname = methodvalue.summary;
          if (
            methodvalue.operationId !== undefined &&
            methodvalue.operationId !== null &&
            methodvalue.operationId.length > 0 &&
            (tmpname === undefined || tmpname.length === 0)
          ) {
            tmpname = methodvalue.operationId;
          }

          if (tmpname !== undefined && tmpname !== null) {
            tmpname = tmpname.replaceAll(".", " ");
          }

          if (
            (tmpname === undefined || tmpname === null) &&
            methodvalue.description !== undefined &&
            methodvalue.description !== null &&
            methodvalue.description.length > 0
          ) {
            tmpname = methodvalue.description
              .replaceAll(".", " ")
              .replaceAll("_", " ");
          }

          var newaction = {
            name: tmpname,
            description: methodvalue.description,
            url: path,
            file_field: "",
            method: method.toUpperCase(),
            headers: "",
            queries: [],
            paths: [],
            body: "",
            errors: [],
            example_response: "",
            action_label: "No Label",
            required_bodyfields: [],
          };

          if (
            methodvalue["x-label"] !== undefined &&
            methodvalue["x-label"] !== null
          ) {
            // FIX: Map labels only if they're actually in the category list
            newaction.action_label = methodvalue["x-label"];
          }

          if (
            methodvalue["x-required-fields"] !== undefined &&
            methodvalue["x-required-fields"] !== null
          ) {
            newaction.required_bodyfields = methodvalue["x-required-fields"];
          }

          if (
            newaction.url !== undefined &&
            newaction.url !== null &&
            newaction.url.includes("_shuffle_replace_")
          ) {
            //const regex = /_shuffle_replace_\d/i;
            const regex = /_shuffle_replace_\d+/i;

            newaction.url = newaction.url.replaceAll(
              new RegExp(regex, "g"),
              ""
            );
          }

          // Finding category
          if (path.includes("/")) {
            const pathsplit = path.split("/");
            // Stupid way of finding a category/grouping
            for (let splitkey in pathsplit) {
              if (pathsplit[splitkey].includes("_shuffle_replace_")) {
                //const regex = /_shuffle_replace_\d/i;
                const regex = /_shuffle_replace_\d+/i;
                pathsplit[splitkey] = pathsplit[splitkey].replaceAll(
                  new RegExp(regex, "g"),
                  ""
                );
              }

              if (
                pathsplit[splitkey].length > 0 &&
                pathsplit[splitkey] !== "v1" &&
                pathsplit[splitkey] !== "v2" &&
                pathsplit[splitkey] !== "api" &&
                pathsplit[splitkey] !== "1.0" &&
                pathsplit[splitkey] !== "apis"
              ) {
                newaction["category"] = pathsplit[splitkey];
                if (!all_categories.includes(pathsplit[splitkey])) {
                  all_categories.push(pathsplit[splitkey]);
                }
                break;
              }
            }
          }

          if (path === "/files/{file_id}/content") {
          }

          // Typescript? I think not ;)
          if (methodvalue["requestBody"] !== undefined) {
            if (
              methodvalue["requestBody"]["$ref"] !== undefined &&
              methodvalue["requestBody"]["$ref"] !== null
            ) {
              // Handle ref
              const parameter = handleGetRef(
                { $ref: methodvalue["requestBody"]["$ref"] },
                data
              );
              if (
                parameter.content !== undefined &&
                parameter.content !== null
              ) {
                methodvalue["requestBody"]["content"] = parameter.content;
              }
            }

            if (methodvalue["requestBody"]["content"] !== undefined) {
              // Handle content - XML or JSON
              //
              if (
                methodvalue["requestBody"]["content"]["application/json"] !==
                undefined
              ) {
                if (
                  methodvalue["requestBody"]["content"]["application/json"][
                    "schema"
                  ] !== undefined &&
                  methodvalue["requestBody"]["content"]["application/json"][
                    "schema"
                  ] !== null
                ) {
                  try {
                    if (
                      methodvalue["requestBody"]["content"]["application/json"][
                        "schema"
                      ]["properties"] !== undefined
                    ) {
                      // Read out properties from a JSON object
                      const jsonObject = getJsonObject(
                        methodvalue["requestBody"]["content"][
                          "application/json"
                        ]["schema"]["properties"]
                      );
                      if (jsonObject !== undefined && jsonObject !== null) {
                        try {
                          newaction["body"] = JSON.stringify(
                            jsonObject,
                            null,
                            2
                          );
                        } catch (e) {}
                      }

                      //newaction["body"] = JSON.stringify(jsonObject, null, 2);

                      var tmpobject = {};
                      for (let prop of methodvalue["requestBody"]["content"][
                        "application/json"
                      ]["schema"]["properties"]) {
                        tmpobject[prop] = `\$\{${prop}\}`;
                      }
                      for (let subkey in methodvalue["requestBody"]["content"][
                        "application/json"
                      ]["schema"]["required"]) {
                        const tmpitem =
                          methodvalue["requestBody"]["content"][
                            "application/json"
                          ]["schema"]["required"][subkey];
                        tmpobject[tmpitem] = `\$\{${tmpitem}\}`;
                      }

                      newaction["body"] = JSON.stringify(tmpobject, null, 2);
                    } else if (
                      methodvalue["requestBody"]["content"]["application/json"][
                        "schema"
                      ]["$ref"] !== undefined &&
                      methodvalue["requestBody"]["content"]["application/json"][
                        "schema"
                      ]["$ref"] !== null
                    ) {
                      const retRef = handleGetRef(
                        methodvalue["requestBody"]["content"][
                          "application/json"
                        ]["schema"],
                        data
                      );
                      var newbody = {};
                      for (let propkey in retRef.properties) {
                        const parsedkey = propkey
                          .replaceAll(" ", "_")
                          .toLowerCase();
                        newbody[parsedkey] = "${" + parsedkey + "}";
                      }

                      newaction["body"] = JSON.stringify(newbody, null, 2);
                    }
                  } catch (e) {}
                }
              } else if (
                methodvalue["requestBody"]["content"]["application/xml"] !==
                undefined
              ) {
                //newaction["headers"] = ""
                //"Content-Type=application/xml\nAccept=application/xml";
                if (
                  methodvalue["requestBody"]["content"]["application/xml"][
                    "schema"
                  ] !== undefined &&
                  methodvalue["requestBody"]["content"]["application/xml"][
                    "schema"
                  ] !== null
                ) {
                  try {
                    if (
                      methodvalue["requestBody"]["content"]["application/xml"][
                        "schema"
                      ]["properties"] !== undefined
                    ) {
                      for (let [prop, propvalue] of Object.entries(
                        methodvalue["requestBody"]["content"][
                          "application/xml"
                        ]["schema"]["properties"]
                      )) {
                        tmpobject[prop] = `\$\{${prop}\}`;
                      }

                      for (let [subkey, subkeyval] in Object.entries(
                        methodvalue["requestBody"]["content"][
                          "application/xml"
                        ]["schema"]["required"]
                      )) {
                        const tmpitem =
                          methodvalue["requestBody"]["content"][
                            "application/xml"
                          ]["schema"]["required"][subkey];
                        tmpobject[tmpitem] = `\$\{${tmpitem}\}`;
                      }

                      //newaction["body"] = XML.stringify(tmpobject, null, 2)
                    }
                  } catch (e) {}
                }
              } else {
                if (
                  methodvalue["requestBody"]["content"]["example"] !== undefined
                ) {
                  if (
                    methodvalue["requestBody"]["content"]["example"][
                      "example"
                    ] !== undefined
                  ) {
                    newaction["body"] =
                      methodvalue["requestBody"]["content"]["example"][
                        "example"
                      ];
                  }
                }

                if (
                  methodvalue["requestBody"]["content"][
                    "multipart/form-data"
                  ] !== undefined
                ) {
                  if (
                    methodvalue["requestBody"]["content"][
                      "multipart/form-data"
                    ]["schema"] !== undefined &&
                    methodvalue["requestBody"]["content"][
                      "multipart/form-data"
                    ]["schema"] !== null
                  ) {
                    try {
                      if (
                        methodvalue["requestBody"]["content"][
                          "multipart/form-data"
                        ]["schema"]["type"] === "object"
                      ) {
                        const fieldname =
                          methodvalue["requestBody"]["content"][
                            "multipart/form-data"
                          ]["schema"]["properties"]["fieldname"];

                        if (fieldname !== undefined) {
                          newaction.file_field = fieldname["value"];
                        } else {
                          for (const [subkey, subvalue] of Object.entries(
                            methodvalue["requestBody"]["content"][
                              "multipart/form-data"
                            ]["schema"]["properties"]
                          )) {
                            if (subkey.includes("file")) {
                              newaction.file_field = subkey;
                              break;
                            }
                          }

                          if (
                            newaction.file_field === undefined ||
                            newaction.file_field === null ||
                            newaction.file_field.length === 0
                          ) {
                          }
                        }
                      } else {
                      }
                    } catch (e) {}
                  }
                } else {
                  var schemas = [];
                  const content = methodvalue["requestBody"]["content"];
                  if (content !== undefined && content !== null) {
                    for (const [subkey, subvalue] of Object.entries(content)) {
                      if (
                        subvalue["schema"] !== undefined &&
                        subvalue["schema"] !== null
                      ) {
                        if (
                          subvalue["schema"]["$ref"] !== undefined &&
                          subvalue["schema"]["$ref"] !== null
                        ) {
                          if (!schemas.includes(subvalue["schema"]["$ref"])) {
                            schemas.push(subvalue["schema"]["$ref"]);
                          }
                        }
                      } else {
                        if (
                          subvalue["example"] !== undefined &&
                          subvalue["example"] !== null
                        ) {
                          newaction["body"] = subvalue["example"];
                        } else {
                        }
                      }
                    }
                  }

                  try {
                    if (schemas.length === 1) {
                      const parameter = handleGetRef(
                        { $ref: schemas[0] },
                        data
                      );
                      if (
                        parameter.properties !== undefined &&
                        parameter["type"] === "object"
                      ) {
                        var newbody = {};
                        for (let propkey in parameter.properties) {
                          const parsedkey = propkey
                            .replaceAll(" ", "_")
                            .toLowerCase();
                          if (
                            parameter.properties[propkey].type === undefined
                          ) {
                            continue;
                          }

                          if (parameter.properties[propkey].type === "string") {
                            if (
                              parameter.properties[propkey].description !==
                              undefined
                            ) {
                              newbody[parsedkey] =
                                parameter.properties[propkey].description;
                            } else {
                              newbody[parsedkey] = "";
                            }
                          } else if (
                            parameter.properties[propkey].type.includes(
                              "int"
                            ) ||
                            parameter.properties[propkey].type.includes(
                              "uint64"
                            )
                          ) {
                            newbody[parsedkey] = 0;
                          } else if (
                            parameter.properties[propkey].type.includes(
                              "boolean"
                            )
                          ) {
                            newbody[parsedkey] = false;
                          } else if (
                            parameter.properties[propkey].type.includes("array")
                          ) {
                            newbody[parsedkey] = [];
                          } else {
                            newbody[parsedkey] = [];
                          }
                        }

                        newaction["body"] = JSON.stringify(newbody, null, 2);
                      } else {
                      }
                    }
                  } catch (e) {}
                }
              }
            }
          }

          if (
            methodvalue.responses !== undefined &&
            methodvalue.responses !== null
          ) {
            if (methodvalue.responses.default !== undefined) {
              if (methodvalue.responses.default.content !== undefined) {
                if (
                  methodvalue.responses.default.content["text/plain"] !==
                  undefined
                ) {
                  if (
                    methodvalue.responses.default.content["text/plain"][
                      "schema"
                    ] !== undefined
                  ) {
                    if (
                      methodvalue.responses.default.content["text/plain"][
                        "schema"
                      ]["example"] !== undefined
                    ) {
                      newaction.example_response =
                        methodvalue.responses.default.content["text/plain"][
                          "schema"
                        ]["example"];
                    }

                    if (
                      methodvalue.responses.default.content["text/plain"][
                        "schema"
                      ]["format"] === "binary" &&
                      methodvalue.responses.default.content["text/plain"][
                        "schema"
                      ]["type"] === "string"
                    ) {
                      newaction.example_response = "shuffle_file_download";
                    }
                  }
                }
              }
            } else {
              var selectedReturn = "";
              if (methodvalue.responses["200"] !== undefined) {
                selectedReturn = "200";
              } else if (methodvalue.responses["201"] !== undefined) {
                selectedReturn = "201";
              }

              // Parsing examples. This should be standardized lol
              if (methodvalue.responses[selectedReturn] !== undefined) {
                const selectedExample = methodvalue.responses[selectedReturn];
                if (selectedExample["content"] !== undefined) {
                  if (
                    selectedExample["content"]["application/json"] !== undefined
                  ) {
                    if (
                      selectedExample["content"]["application/json"][
                        "schema"
                      ] !== undefined &&
                      selectedExample["content"]["application/json"][
                        "schema"
                      ] !== null
                    ) {
                      if (
                        selectedExample["content"]["application/json"][
                          "schema"
                        ]["properties"] !== undefined &&
                        selectedExample["content"]["application/json"][
                          "schema"
                        ]["properties"] !== null
                      ) {
                        const jsonObject = getJsonObject(
                          selectedExample["content"]["application/json"][
                            "schema"
                          ]["properties"]
                        );
                        if (jsonObject !== undefined && jsonObject !== null) {
                          try {
                            newaction.example_response = JSON.stringify(
                              jsonObject,
                              null,
                              2
                            );
                          } catch (e) {}
                        }
                      }

                      if (
                        selectedExample["content"]["application/json"][
                          "schema"
                        ]["$ref"] !== undefined
                      ) {
                        const parameter = handleGetRef(
                          selectedExample["content"]["application/json"][
                            "schema"
                          ],
                          data
                        );
                        if (
                          parameter.properties !== undefined &&
                          parameter["type"] === "object"
                        ) {
                          var newbody = {};
                          for (let propkey in parameter.properties) {
                            const parsedkey = propkey
                              .replaceAll(" ", "_")
                              .toLowerCase();
                            if (
                              parameter.properties[propkey].type === undefined
                            ) {
                              continue;
                            }

                            if (
                              parameter.properties[propkey].type === "string"
                            ) {
                              if (
                                parameter.properties[propkey].description !==
                                undefined
                              ) {
                                newbody[parsedkey] =
                                  parameter.properties[propkey].description;
                              } else {
                                newbody[parsedkey] = "";
                              }
                            } else if (
                              parameter.properties[propkey].type.includes("int")
                            ) {
                              newbody[parsedkey] = 0;
                            } else if (
                              parameter.properties[propkey].type.includes(
                                "boolean"
                              )
                            ) {
                              newbody[parsedkey] = false;
                            } else if (
                              parameter.properties[propkey].type.includes(
                                "array"
                              )
                            ) {
                              //const parameter = handleGetRef(selectedExample["content"]["application/json"]["schema"], data)
                              newbody[parsedkey] = [];
                            } else {
                              newbody[parsedkey] = [];
                            }
                          }
                          newaction.example_response = JSON.stringify(
                            newbody,
                            null,
                            2
                          );
                        } else {
                        }
                      } else {
                        // Just selecting the first one. bleh.
                        if (
                          selectedExample["content"]["application/json"][
                            "schema"
                          ]["allOf"] !== undefined
                        ) {
                          var selectedComponent =
                            selectedExample["content"]["application/json"][
                              "schema"
                            ]["allOf"];
                          if (selectedComponent.length >= 1) {
                            selectedComponent = selectedComponent[0];

                            const parameter = handleGetRef(
                              selectedComponent,
                              data
                            );
                            if (
                              parameter.properties !== undefined &&
                              parameter["type"] === "object"
                            ) {
                              var newbody = {};
                              for (let propkey in parameter.properties) {
                                const parsedkey = propkey
                                  .replaceAll(" ", "_")
                                  .toLowerCase();
                                if (
                                  parameter.properties[propkey].type ===
                                  undefined
                                ) {
                                  continue;
                                }

                                if (
                                  parameter.properties[propkey].type ===
                                  "string"
                                ) {
                                  if (
                                    parameter.properties[propkey]
                                      .description !== undefined
                                  ) {
                                    newbody[parsedkey] =
                                      parameter.properties[propkey].description;
                                  } else {
                                    newbody[parsedkey] = "";
                                  }
                                } else if (
                                  parameter.properties[propkey].type.includes(
                                    "int"
                                  )
                                ) {
                                  newbody[parsedkey] = 0;
                                } else if (
                                  parameter.properties[propkey].type.includes(
                                    "boolean"
                                  )
                                ) {
                                  newbody[parsedkey] = false;
                                } else {
                                  newbody[parsedkey] = [];
                                }
                              }

                              newaction.example_response = JSON.stringify(
                                newbody,
                                null,
                                2
                              );
                              //newaction.example_response = JSON.stringify(parameter.properties, null, 2)
                            } else {
                              //newaction.example_response = parameter.properties
                            }
                          } else {
                          }
                        } else if (
                          selectedExample["content"]["application/json"][
                            "schema"
                          ]["properties"] !== undefined
                        ) {
                          if (
                            selectedExample["content"]["application/json"][
                              "schema"
                            ]["properties"]["data"] !== undefined
                          ) {
                            const parameter = handleGetRef(
                              selectedExample["content"]["application/json"][
                                "schema"
                              ]["properties"]["data"],
                              data
                            );
                            if (
                              parameter.properties !== undefined &&
                              parameter["type"] === "object"
                            ) {
                              var newbody = {};
                              for (let propkey in parameter.properties) {
                                const parsedkey = propkey
                                  .replaceAll(" ", "_")
                                  .toLowerCase();
                                if (
                                  parameter.properties[propkey].type ===
                                  undefined
                                ) {
                                  continue;
                                }

                                if (
                                  parameter.properties[propkey].type ===
                                  "string"
                                ) {
                                  if (
                                    parameter.properties[propkey]
                                      .description !== undefined
                                  ) {
                                    newbody[parsedkey] =
                                      parameter.properties[propkey].description;
                                  } else {
                                    newbody[parsedkey] = "";
                                  }
                                } else if (
                                  parameter.properties[propkey].type.includes(
                                    "int"
                                  )
                                ) {
                                  newbody[parsedkey] = 0;
                                } else {
                                  newbody[parsedkey] = [];
                                }
                              }

                              newaction.example_response = JSON.stringify(
                                newbody,
                                null,
                                2
                              );
                              //newaction.example_response = JSON.stringify(parameter.properties, null, 2)
                            } else {
                              //newaction.example_response = parameter.properties
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          for (let paramkey in methodvalue.parameters) {
            const parameter = handleGetRef(
              methodvalue.parameters[paramkey],
              data
            );

            if (parameter.in === "query") {
              var tmpaction = {
                description: parameter.description,
                name: parameter?.name,
                required: parameter.required,
                in: "query",
              };

              if (
                parameter.example !== undefined &&
                parameter.example !== null
              ) {
                tmpaction.example = parameter.example;
              }

              if (parameter.required === undefined) {
                tmpaction.required = false;
              }

              newaction.queries.push(tmpaction);
            } else if (parameter.in === "path") {
              // FIXME - parse this to the URL too
              newaction.paths.push(parameter?.name);

              // FIXME: This doesn't follow OpenAPI3 exactly.
              // https://swagger.io/docs/specification/describing-request-body/
              // https://swagger.io/docs/specification/describing-parameters/
              // Need to split the data.
            } else if (parameter.in === "body") {
              // FIXME: Add tracking for components
              // E.G: https://raw.githubusercontent.com/owentl/Shuffle/master/gosecure.yaml
              if (
                parameter.example !== undefined &&
                parameter.example !== null
              ) {
                if (
                  newaction.body === undefined ||
                  newaction.body === null ||
                  newaction.body.length < 5
                ) {
                  newaction.body = parameter.example;
                }
              }
            } else if (parameter.in === "header") {
              newaction.headers += `${parameter?.name}=${parameter.example}\n`;
            } else {
            }
          }

          // Check if body is valid JSON.
          if (
            newaction.body !== undefined &&
            newaction.body !== null &&
            newaction.body.length > 0
          ) {
            // Trim starting / ending newlines, spaces and tabs
            newaction.body = newaction.body.trim();
          }

          if (newaction?.name === "" || newaction?.name === undefined) {
            // Find a unique part of the string
            // FIXME: Looks for length between /, find the one where they differ
            // Should find others with the same START to their path
            // Make a list of reserved names? Aka things that show up only once
            if (Object.getOwnPropertyNames(wordlist).length === 0) {
              for (let [newpath, pathvalue] of Object.entries(data.paths)) {
                const newpathsplit = newpath.split("/");

                for (let splitkey in newpathsplit) {
                  const pathitem = newpathsplit[splitkey].toLowerCase();
                  if (wordlist[pathitem] === undefined) {
                    wordlist[pathitem] = 1;
                  } else {
                    wordlist[pathitem] += 1;
                  }
                }
              }
            }

            // Remove underscores and make it normal with upper case etc
            const urlsplit = path.split("/");
            if (urlsplit.length > 0) {
              var curname = "";
              for (let urlkey in urlsplit) {
                var subpath = urlsplit[urlkey];
                if (wordlist[subpath] > 2 || subpath.length < 1) {
                  continue;
                }

                curname = subpath;
                break;
              }

              // FIXME: If name exists,
              // FIXME: Check if first part of parsedname is verb, otherwise use method
              const parsedname = curname
                .split("_")
                .join(" ")
                .split("-")
                .join(" ")
                .split("{")
                .join(" ")
                .split("}")
                .join(" ")
                .trim();
              if (parsedname.length === 0) {
                newaction.errors.push("Missing name");
              } else {
                const newname =
                  method.charAt(0).toUpperCase() +
                  method.slice(1) +
                  " " +
                  parsedname;
                const searchactions = newActions.find(
                  (data) => data?.name === newname
                );

                if (searchactions !== undefined) {
                  newaction.errors.push("Missing name");
                } else {
                  newaction.name = newname;
                }
              }
            } else {
              newaction.errors.push("Missing name");
            }
          }

          //newaction.action_label = "No Label"
          newActions.push(newaction);
        }
      }

      if (data.servers !== undefined && data.servers.length > 0) {
        var firstUrl = data.servers[0].url;
        if (
          firstUrl.includes("{") &&
          firstUrl.includes("}") &&
          data.servers[0].variables !== undefined
        ) {
          const regex = /{\w+}/g;
          const found = firstUrl.match(regex);
          if (found !== null) {
            for (let foundkey in found) {
              const item = found[foundkey].slice(1, found[foundkey].length - 1);
              const foundVar = data.servers[0].variables[item];
              if (foundVar["default"] !== undefined) {
                firstUrl = firstUrl.replace(
                  found[foundkey],
                  foundVar["default"]
                );
              }
            }
          }
        }

        if (firstUrl.endsWith("/")) {
          parentUrl = firstUrl.slice(0, firstUrl.length - 1);
        } else {
          parentUrl = firstUrl;
        }
      }
    }

    var prefixCheck = "/v1";
    if (parentUrl.includes("/")) {
      const urlsplit = parentUrl.split("/");
      if (urlsplit.length > 2) {
        // Skip if http:// in it too
        prefixCheck = "/" + urlsplit.slice(3).join("/");
      }

      if (
        prefixCheck.length > 0 &&
        prefixCheck !== "/" &&
        prefixCheck.startsWith("/")
      ) {
        for (var actionKey in newActions) {
          const action = newActions[actionKey];

          if (
            action.url !== undefined &&
            action.url !== null &&
            action.url.startsWith(prefixCheck)
          ) {
            newActions[actionKey].url = action.url.slice(
              prefixCheck.length,
              action.url.length
            );
          }
        }
      }
    }

    setServerUrl(parentUrl);
    var newActions2 = [];
    // Remove with duplicate action URLs
    for (var actionKey in newActions) {
      const action = newActions[actionKey];
      if (action.url === undefined || action.url === null) {
        continue;
      }

      var found = false;
      for (var actionKey2 in newActions2) {
        const action2 = newActions2[actionKey2];
        if (action2.url === undefined || action2.url === null) {
          continue;
        }

        if (action.url === action2.url) {
          found = true;
          break;
        }
      }

      if (!found) {
        newActions2.push(action);
      } else {
        newActions2.push(action);
      }
    }

    newActions = newActions2

    // Rearrange them by which has action_label
    const firstActions = newActions.filter(
      (data) =>
        data.action_label !== undefined &&
        data.action_label !== null &&
        data.action_label !== "No Label"
    );
    const secondActions = newActions.filter(
      (data) =>
        data.action_label === undefined ||
        data.action_label === null ||
        data.action_label === "No Label"
    );
    newActions = firstActions.concat(secondActions)
    setActions(newActions)
    setExampleBody(newActions[0]?.body)
  }, [openapi]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: 'row',
        height: (isLoggedIn && isLoaded) ? "auto" : "calc(100vh - 80px)",
      }}
    >
        <ActionsList info={info} openapi={openapi} isLoggedIn={isLoggedIn} isLoaded={isLoaded} userdata={userdata} actions={actions} filteredActions={filteredActions} setFilteredActions={setFilteredActions} selectedActionIndex={selectedActionIndex} setSelectedActionIndex={setSelectedActionIndex} setExampleBody={setExampleBody }/>

        <ActionResponseAndRequest isLoaded={isLoaded} isLoggedIn={isLoggedIn} ConfigurationTab={ConfigurationTab} selectedAppData={selectedAppData} HandleApiExecution={HandleApiExecution} userdata={userdata} info={info} filteredActions={filteredActions} setFilteredActions={setFilteredActions} actions={actions} selectedActionIndex={selectedActionIndex} ExampleBody={ExampleBody} setExampleBody={setExampleBody} openapi={openapi} serverurl={serverurl} globalUrl={globalUrl} setSelectedActionIndex={setSelectedActionIndex}/>

    </div>
  );
});

export default ApiExplorer;


const ActionResponseAndRequest = memo(({ isLoggedIn, isLoaded, ConfigurationTab, selectedAppData,actions, info, HandleApiExecution, userdata, filteredActions, setFilteredActions, serverurl, globalUrl, setSelectedActionIndex, ExampleBody, setExampleBody, selectedActionIndex}) => {
  const [apiResponse, setApiResponse] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const loadAction = 10;
  const loadedAction = useRef(null);

  const loadMoreActions = useCallback(() => {
    if (isLoading || filteredActions.length >= actions.length) return;
  
    setIsLoading(true);
  
    setFilteredActions((prevActions) => {
      const newActions = actions.slice(prevActions.length, prevActions.length + loadAction);
      setIsLoading(false);
      return [...prevActions, ...newActions];
    });
  }, [isLoading, actions.length, filteredActions.length, loadAction]);
  
  // Scroll position reference
  const scrollPosition = useRef(0);
  
  // Handle scroll event with debounce
  const handleScroll = useCallback(() => {
    const actionContainer = loadedAction.current;
    if (
      actionContainer &&
      actionContainer.scrollTop + actionContainer.clientHeight >= actionContainer.scrollHeight - 10
    ) {
      loadMoreActions();
    }
    scrollPosition.current = actionContainer?.scrollTop || 0;
  }, [loadMoreActions]);
  
  // Add scroll event listener on mount and remove on unmount
  useEffect(() => {
    const actionContainer = loadedAction.current;
    if (actionContainer) {
      actionContainer.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (actionContainer) {
        actionContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  
  // Restore scroll position when the component rerenders or new items are added
  useEffect(() => {
    const actionContainer = loadedAction.current;
    if (actionContainer) {
      actionContainer.scrollTop = scrollPosition.current;
    }
  }, [actions, filteredActions]);

  useEffect(() => {
    if (actions?.length > 0 && filteredActions?.length === 0) {
      setFilteredActions(actions.slice(0, loadAction));
    }
  }, [actions?.length]);

  return (

    <div ref={loadedAction} style={{ width: "100%",   overflowY:'auto', justifyContent: 'center', alignItems: "center", paddingTop: 20}}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px",  paddingTop: 40, height: "calc(100vh - 80px)"}}> 
                {filteredActions.map((action, index) => (
                    <div key={index} style={{ width: "100%", boxSizing: "border-box", borderBottom: index === filteredActions.length - 1 ? "none" : "1px solid #494949",  paddingBottom: index === filteredActions.length - 1 ? 250 : 30 , paddingTop: index !== 0 ? 30 : 0 }}>
                        <Action
                            id={action.name.replace(/ /g, "-").replace(/_/g, "-")}
                            action={action}
                            index={index}
                            serverurl={serverurl}
                            setApiResponse={setApiResponse}
                            setExampleBody={setExampleBody}
                            globalUrl={globalUrl}
                            setSelectedActionIndex={setSelectedActionIndex}
                            selectedActionIndex={selectedActionIndex}
                            info={info}
                            HandleApiExecution={HandleApiExecution}
                            selectedAppData={selectedAppData}
                            userdata={userdata}
                            ConfigurationTab={ConfigurationTab}
                        />
                    </div>
                ))}
        </div>

        <ActionResponse isLoaded={isLoaded} isLoggedIn={isLoggedIn} apiResponse={apiResponse} ExampleBody={ExampleBody}/>
    </div>
  )})


const ActionsList = memo(({
  actions,
  selectedActionIndex,
  setSelectedActionIndex,
  setExampleBody,
  setFilteredActions,
  filteredActions,
  userdata,
  info,
  openapi,
  isLoggedIn,
  isLoaded
}) => {

  const [searchQuery, setSearchQuery] = useState("");
  const [visibleActions, setVisibleActions] = useState([]);
  

  useEffect(() => {
    if (visibleActions?.length === 0 && actions?.length > 0) {
      setVisibleActions(actions)
    }
  }, [actions?.length])

  const handleActionClick = (index, action) => {
    const actionId = action.name.replace(/ /g, "-").replace(/_/g, "-");
    setSelectedActionIndex(index);
    setExampleBody(action.example_response);

    const actionIndex = actions.findIndex((act) => {
      const id = act.name.replace(/ /g, "-").replace(/_/g, "-");
      return id === actionId;
    });

    if (actionIndex !== -1 && !filteredActions.some((act) => {
        const id = act.name.replace(/ /g, "-").replace(/_/g, "-");
        return id === actionId;
    })) {
      const newActionToLoad = [
        ...filteredActions,
        ...actions.slice(filteredActions.length, actionIndex + 1)
      ];
      setFilteredActions(newActionToLoad);
    }

    // Update URL hash and scroll to action
    window.history.pushState(null, "", `#${actionId}`);
    const actionElement = document.getElementById(actionId);
    if (actionElement) {
      actionElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

  const handleSearch = (e) => {
    const query = e?.target?.value?.toLowerCase().replaceAll("_", " ");

    setSearchQuery(query)
    if (query.length === 0) {
      setVisibleActions(actions)
    } else {
      setVisibleActions(
        actions?.filter((action) =>
          action?.name?.toLowerCase()?.replaceAll("_", " ")?.includes(searchQuery)
        )
      )
    }
  }

  return (
    <div style={{ maxWidth: '350px', width: "25%", overflow: 'hidden', marginLeft: !(isLoggedIn || isLoaded) ? 5 : 0}}>
    <div style={{ borderBottom: '1px solid #494949', paddingTop: 10, paddingBottom: 10}}>
            <div>
                {info?.title ? (
					<a 
						href={`/apps/${openapi?.id}`}
						style={{ textDecoration: 'none', }} 
						target="_blank" 
						rel="noreferrer"
					>
						<Tooltip title="Go to app" placement="right">
							<div style={{ display: "flex", alignItems: "center" }}>
								<img
									src={openapi?.info["x-logo"]}
									width={48}
									height={48}
									alt="app logo"
									style={{ marginLeft: 20, borderRadius: 8 }}
								/>
								<Typography style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 20, overflow: 'hidden', color: '#F1F1F1'
								}}> 
									{info.title}
								</Typography>
                    		</div>
						</Tooltip>
					</a>
                ) : (
                  <Typography style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 20, overflow: 'hidden', color: '#F1F1F1'
                  }}> 
                      Api Explorer
                  </Typography>
                )}
            </div>
     </div>

      <TextField
        value={searchQuery}
        placeholder="Search endpoints"
        onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          style: { height: "100%", marginTop: 10, width: '90%', },
        }}
        sx={{
          marginLeft: 2,
          width:'100%',
          "& .MuiOutlinedInput-root fieldset": {
            border: "1px solid rgba(73, 73, 73, 1)",
          },
        }}
      />

      <div
        style={{
          marginLeft: 20,
          marginTop: 15,
          backgroundColor: "#1a1a1a",
          overflowY: "auto",
          height: (isLoaded && isLoggedIn) ? "calc(100vh - 190px)" : "calc(100vh - 260px)",
          paddingRight: 5,
        }}
      >
        {visibleActions.length > 0 ? (
          visibleActions.map((action, actionIndex) => (
            <Button
              id={`action-list-${actionIndex}`}
              key={`action-list-${actionIndex}`}
              sx={{
                padding: "15px 5px",
                color: "none",
                fontWeight: "normal",
                textTransform: "none",
                backgroundColor:
                  selectedActionIndex === actionIndex
                    ? "#3f3f3f"
                    : "transparent",
                border: "none",
                justifyContent: "flex-start",
                boxShadow: "none",
                pointerEvents: "auto",
                marginBottom: 0.625,
                width: "100%",
                display: "flex",
                alignItems: "center",
                textWrap: "nowrap",
                textOverflow: "ellipsis",
                "&:hover": {
                  backgroundColor: "#2f2f2f",
                },
              }}
              onClick={() => handleActionClick(actionIndex, action)}
            >
              <span
                style={{
                  color: RequestMethods.find(
                    (method) => method.value === action.method
                  )?.color,
                  fontWeight: "bold",
                  minWidth: 70,
                  textAlign: "start",
                }}
              >
                {action.method}
              </span>
              <span
                style={{
                  color: "white",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {action?.name?.replaceAll("_", " ")}
              </span>
            </Button>
          ))
        ) : (
          <div style={{ padding: "15px", color: "white", textAlign: "center" }}>
            No actions found
          </div>
        )}
      </div>
    </div>
  );
});



const Action = memo((
    { 
      action, 
      index, 
      serverurl, 
      setApiResponse,
      setExampleBody,
      globalUrl,
      info,
      setSelectedActionIndex,
      selectedActionIndex,
      HandleApiExecution,
      ConfigurationTab,
    }, 
  ) =>
      {
        const [RequestHeader, setRequestHeader] = useState([{ key: "Content-Type", value: "application/json" }]);
        const [RequestBody, setRequestBody] = useState(action?.body);
        const editorRef = useRef(null);
        const [AceEditorHeight, setAceEditorHeight] = useState(275)
        const [baseUrl, setBaseUrl] = useState(serverurl)
        const [path, setPath] = useState(action?.url)
        const inputRef = useRef(null);
        const [shouldChageInputFocus, setShouldChangeInputFocus] = useState(true);
        const [disableExecuteButton, setDisableExecuteButton] = useState(false);
        const [showResponseLoader, setShowResponseLoader] = useState(false);
        const [appAuthentication, setAppAuthentication] = useState([])
        const parseHeaders = (headersString) => {
          if (headersString?.length > 0) {
            const headersArray = headersString.split("\n");
            const parsedHeaders = headersArray
              .map((header) => {
                const [key, value] = header.split("="); // Split by '=' to get key-value pairs
          
                // Only proceed if both key and value exist, and neither is undefined
                if (key && value) {
                  return { key: key.trim(), value: value.trim() };
                }
                return null; // Return null if the header is invalid
              })
              .filter(Boolean); // Filter out any null values
            
            setRequestHeader(parsedHeaders);
          }
        };        

        useEffect(() => {
          if (action?.headers) {
            parseHeaders(action.headers);
          }
        }, []);

        const [RequestParams, setRequestParams] = useState([
          {
            key: "",
            value: "",
          },
        ]);

        const [curTab, setCurTab] = useState(0)
        const [actionUrl, setActionUrl] = useState(action?.url)

        const [selectedMethod, setSelectedMethod] = useState(action?.method)
        
        const fix_url = (newUrl) => {
          if (newUrl.includes("hhttp")) {
            newUrl = newUrl.replace("hhttp", "http");
          }
      
          if (newUrl.includes("http:/") && !newUrl.includes("http://")) {
            newUrl = newUrl.replace("http:/", "http://");
          }
          if (newUrl.includes("https:/") && !newUrl.includes("https://")) {
            newUrl = newUrl.replace("https:/", "https://");
          }
          if (newUrl.includes("http:///")) {
            newUrl = newUrl.replace("http:///", "http://");
          }
          if (newUrl.includes("https:///")) {
            newUrl = newUrl.replace("https:///", "https://");
          }
          if (!newUrl.includes("http://") && !newUrl.includes("https://")) {
            newUrl = `http://${newUrl}`;
          }
          return newUrl;
        };  

        function isValidMethod(method) {
          const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
          method = method.toUpperCase();
      
          if (validMethods.includes(method)) {
              return method;
          } else {
              throw new Error(`Invalid HTTP method: ${method}`);
          }
        }      
        
        function fixHeader(headers) {
          if (Array.isArray(headers)) {
              return headers.reduce((acc, header) => {
                  if (header.key.trim() !== "" || header.value.trim() !== "") {
                      acc[header.key.trim()] = header.value.trim();
                  }
                  return acc;
              }, {});
          }
      
          const parsedHeaders = {};
          
          if (typeof headers === 'string' && headers) {
              const splitHeaders = headers.split("\n");
              
              splitHeaders.forEach(header => {
                  let splitItem;
                  if (header.includes(":")) {
                      splitItem = ":";
                  } else if (header.includes("=")) {
                      splitItem = "=";
                  } else {
                      return;
                  }
      
                  const splitHeader = header.split(splitItem);
                  if (splitHeader.length >= 2) {
                      const key = splitHeader[0].trim();
                      const value = splitHeader.slice(1).join(splitItem).trim();
                      parsedHeaders[key] = value;
                  }
              });
          }
      
          return parsedHeaders;
        }

        function fixParams(queries) {
          if (Array.isArray(queries)) {
            return queries
              .filter(query => query.key.trim() !== "" || query.value.trim() !== "")
              .map(query => ({ key: query.key.trim(), value: query.value.trim() }));
          }
          
          const parsedQueries = [];
          if (typeof queries === 'string') {
            if (!queries.trim()) return parsedQueries;
            const cleanedQueries = queries.trim().replace(/\s+/g, " ");
            const splittedQueries = cleanedQueries.split("&");
            splittedQueries.forEach(query => {
              if (!query.includes("=")) {
                console.info("Skipping as there is no '=' in the query");
                return;
              }
              const [key, value] = query.split("=");
              if (!key.trim() || !value.trim()) {
                console.info("Skipping because either key or value is not present in query");
                return;
              }
              parsedQueries.push({ key: key.trim(), value: value.trim() });
            });
          }
          
          return parsedQueries;
        }
        
        async function prepareResponse(response) {
          try {
              const parsedHeaders = {};
              response.headers.forEach((value, key) => {
                  parsedHeaders[key] = value;
              });
      
              const cookies = {};
              if (response.headers.has("set-cookie")) {
                  const cookieHeader = response.headers.get("set-cookie").split(";");
                  cookieHeader.forEach(cookie => {
                      const [key, value] = cookie.split("=");
                      if (key && value) {
                          cookies[key.trim()] = value.trim();
                      }
                  });
              }
      
              const textData = await response.text();
             
              let parsedBody;
              try {
                  parsedBody = JSON.parse(textData);
              } catch (error) {
                  console.error("Error parsing JSON response:", error);
                  parsedBody = textData;
              }
      
              return {
                  success: true,
                  status: response.status,
                  url: response.url,
                  body: parsedBody,
                  headers: parsedHeaders,
                  cookies: cookies,
              };
          } catch (error) {
                  console.error("Error preparing response:", error);
                  return {
                      success: false,
                      status: response?.status,
                      error: error.message,
                  };
          }
        }
            
        const handleRequestWithCustomAction = async (selectedMethod, baseUrl, path, RequestHeader, RequestBody, RequestParams, info, action) => {
          
          if((HandleApiExecution !== undefined || HandleApiExecution !== null) && typeof HandleApiExecution === 'function'){  

            try {
              if (baseUrl.length === 0) {
                setBaseUrl(serverurl)
              }
              if (path.length === 0) {
                setPath(action.url)
              }
            
              const apiResponse = await HandleApiExecution(
                selectedMethod, baseUrl, path, RequestHeader, RequestBody, RequestParams, info, action, setCurTab,
              )
            
              const response = {
                "action name" : action.name.replaceAll("_", " "),
                 ...apiResponse 
                };
              
              if (typeof response.result === "string") {
                try {
                  response.result = JSON.parse(response.result);
                } catch (parseError) {
                  console.error("Error parsing result:", parseError);
                  //toast.error("Error parsing response result.");
                }
              }
            
              setDisableExecuteButton(false);
              setApiResponse(response);  // Set the response with the action name added
              setShowResponseLoader(false);
              
              return apiResponse;
            
            } catch (error) {
              console.error("Error during HandleApiExecution:", error);
              toast.error(`Error: ${error.message}`);
              return { error: error.message };
            }            
          } else{

            const newUrl = fix_url(baseUrl);
            let validMethod;
            try {
                validMethod = isValidMethod(selectedMethod);
            } catch (error) {
                console.error(error);
                toast.error(error.message);
                return { error: error.message };
            }
              try {
        
                if (path && !path.startsWith('/')) {
                    path = '/' + path;
                }
        
                const finalUrl = newUrl + path;
                const newHeader = fixHeader(RequestHeader);
                const newParams = fixParams(RequestParams);

                if (typeof RequestBody === 'object') {
                    try {
                        RequestBody = JSON.stringify(RequestBody);
                    } catch (error) {
                        console.error(`Error: ${error}`);
                        toast.error("Invalid JSON format for request body: ", error);
                        return { error: "Invalid JSON format for request body" };
                    }
                }
                const queryString = new URLSearchParams(newParams.map(param => [param.key, param.value])).toString();
                const fullUrl = queryString ? `${finalUrl}?${queryString}` : finalUrl;
                const response = await fetch(fullUrl, {
                    method: validMethod,
                    headers: newHeader,
                    body: validMethod !== 'GET' ? RequestBody : undefined,
                });
        
                const preparedResponse = await prepareResponse(response);

                setApiResponse(preparedResponse);
                
                return preparedResponse;
        
            } catch (error) {
                console.error("Error:", error);
                toast.error(`${error.message} Please ensure all fields are filled out correctly and try again.`);
                return { error: error.message };
            }
          }
        };

        const addRequestParamsRow = () => {
          setRequestParams((prevRows) => {
            const updatedRows = [...RequestParams, { key: "", value: "" }];
            return updatedRows;
          });
        };

        const handleRequestParamsChange = (rowIndex, field, value) => {
          setRequestParams(
            RequestParams.map((row, index) => {
              return {
                ...row,
                [field]: index === rowIndex ? value : row[field],
              };
            })
          );
        };

        const addRow = () => {
          setRequestHeader((prevRows) => {
            const updatedRows = [...RequestHeader, { key: "", value: "" }];
            return updatedRows;
          });
        };

        const handleInputChange = (rowIndex, field, value) => {
          setRequestHeader(
            RequestHeader.map((row, i) => {
              return {
                ...row,
                [field]: i === rowIndex ? value : row[field],
              };
            })
          );
        };
        const handleChangeTab = (actionIndex, newValue) => {
          setCurTab(newValue);
        };

        const shouldShowBodyTab = ![
          "GET",
          "CONNECT",
          "OPTIONS",
          "TRACE",
          "HEAD",
        ].includes(selectedMethod);

        const extractParamsFromText = (text) => {
          const params = [];
          const queryString = text.split("?")[1];

          if (queryString) {
            const pairs = queryString.split("&");
            pairs.forEach((pair) => {
              const [key, value] = pair.split("=");
              if (key && value) {
                params.push({ key, value });
              }
            });
          }

          return params.length > 0 ? params : [{ key: "", value: "" }];
        };
        
        const actionRef = useRef(null);
        const scrollTimeoutRef = useRef(null);
        const [isUserInteracting, setIsUserInteracting] = useState(false);

          useEffect(() => {
              const observer = new IntersectionObserver(
                  throttle((entries) => {
                    if (!isUserInteracting) return;
                      let nextSelectedActionIndex = null;

                      entries.forEach((entry) => {
                          if (entry.isIntersecting && selectedActionIndex !== index) {
                              nextSelectedActionIndex = index;
                          }
                      });

                      if (scrollTimeoutRef.current) {
                          clearTimeout(scrollTimeoutRef.current);
                      }

                      if (nextSelectedActionIndex !== null) {
                          scrollTimeoutRef.current = setTimeout(() => {
                              if (selectedActionIndex !== nextSelectedActionIndex) {
                                  setSelectedActionIndex(nextSelectedActionIndex);
                                  const actionId = action.name.replace(/ /g, "-").replace(/_/g, "-");
                                  window.history.pushState(null, "", `#${actionId}`);
                                  setExampleBody(action?.example_response);
                                  document.getElementById(`action-list-${nextSelectedActionIndex}`).scrollIntoView({ behavior: "smooth", block: "center" });
                              }
                          }, 300);
                      }
                  }, 200),
                  { threshold: 0.5 }
              );

              if (actionRef.current) {
                  observer.observe(actionRef.current);
              }

              return () => {
                  if (actionRef.current) {
                      observer.unobserve(actionRef.current);
                  }
                  if (scrollTimeoutRef.current) {
                      clearTimeout(scrollTimeoutRef.current);
                  }
              };
          }, [isUserInteracting]);

          const handleAceEditorChange = (value) => {
            setRequestBody(value);
            if (editorRef.current) {
              const editor = editorRef.current.editor;
              const lineHeight = editor.renderer.lineHeight;
              const minHeight = 100;
              const maxHeight = 300;
              const session = editor.getSession();
              const screenLength = session.getScreenLength();
              const contentHeight = screenLength * lineHeight;
              const padding = 20; 
              
              // Calculate new height
              let newHeight = Math.min(
                Math.max(
                  minHeight,
                  contentHeight + padding
                ),
                maxHeight
              );
          
              if (newHeight !== AceEditorHeight) {
                if (value.length < (editorRef.current._lastValue || '').length) {
                  if (contentHeight + padding < AceEditorHeight) {
                    setAceEditorHeight(newHeight);
                  }
                } else {
                  if (contentHeight + padding > AceEditorHeight) {
                    setAceEditorHeight(newHeight);
                  }
                }
              }
              editorRef.current._lastValue = value;
            }
          };

          useEffect(() => {
            if (editorRef.current) {
              const editor = editorRef.current.editor;
              editor.commands.addCommand({
                name: "executeOnCtrlEnter",
                bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
                exec: () => {
                  setShowResponseLoader(true);
                  setDisableExecuteButton(true);
                  handleRequestWithCustomAction(
                    selectedMethod,
                    baseUrl,
                    path,
                    RequestHeader,
                    RequestBody,
                    RequestParams,
                    info,
                    action
                  );
                },
              });
            }
          }, [editorRef.current]);
          
          
		const actionname = action?.name.charAt(0).toUpperCase() + action?.name.slice(1).replaceAll("_", " ")
        return (
          <div
            ref={actionRef}
            id={action.name.replace(/ /g, "-").replace(/_/g, "-")}
            data-index={index}
            key={action.name.replace(/ /g, "-").replace(/_/g, "-")}
            style={{ 
			  marginTop: 50, 
              display: "flex", 
              flexDirection: "row", 
              minHeight: 400,
              justifyContent: 'center'
            }}
            onClick={() => setIsUserInteracting(true)}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: 1024,
                width: "100%",
              }}
            >
                  <Typography
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      marginLeft: 40,
                      marginBottom: 5,
                      color: "rgba(241, 241, 241, 1)",
                    }}
                  >
                    {actionname}
              </Typography>
              <div
                style={{
                  border: "1px solid rgba(73, 73, 73, 1)",
                  display: "flex",
                  minWidth: 694,
                  borderRadius: 6,
                  marginLeft: "40px",
                  marginTop: 2,
                  backgroundColor: "#212121",
                  height: 51,
                  alignItems: 'center',
                }}
              >
                <Select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  sx={{
                    minWidth: 130,
                    height: "100%",
                    backgroundColor: "transparent",
                    "& .MuiSelect-select": {
                      color: RequestMethods.find((method) => method.value === selectedMethod)
                        ?.color || "#212121",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        padding: 0,
                        margin: 0,
                        backgroundColor: "#212121",
                      },
                    },
                    MenuListProps: {
                      sx: {
                        padding: 0,
                        margin: 0,
                        backgroundColor: "#212121",
                      },
                    },
                  }}
                >
                  {RequestMethods.map((method, methodIndex) => (
                    <MenuItem
                      key={`${method.value}-${methodIndex}`}
                      value={method.value}
                      sx={{
                        color: method.color,
                        backgroundColor: "#212121",
                        border: "none",
                        marginBottom: 0.25,
                        "&:hover": {
                          backgroundColor: method.color,
                          color: "#f9fcf5", 
                        },
                        "&.Mui-selected": {
                          backgroundColor: method.color,
                          color: "#f9fcf5",
                          border: "none",
                          "&:hover": {
                            backgroundColor: method.color,
                            color: "#f9fcf5",
                          },
                        },
                        "&.Mui-focusVisible": {
                          outline: "none",
                        },
                      }}
                    >
                      {method.value}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  fullWidth
                  ref={inputRef}
                  value={actionUrl}
                  inputProps={{
                    style: {
                      margin: "auto",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "rgba(241, 241, 241, 1)",
                      display: 'flex',
                      height: '100%',
                      alignItems: 'center',

                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        border: "none",
                      },
                      "&:hover fieldset": {
                        border: "none",
                      },
                      "&.Mui-focused fieldset": {
                        border: "none",
                      },
                      margin: "auto",
                    },
                    margin: "auto",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (actionUrl.length === 0) {
                        toast.error("URL cannot be empty");
                        return;
                      }else{
                        setShowResponseLoader(true);
                        setDisableExecuteButton(true)
                        handleRequestWithCustomAction(selectedMethod, baseUrl, path, RequestHeader, RequestBody, RequestParams, info, action);
                      }
                    }}
                  }
                  onClick={(e) => {
                    const clickPosition = e.target.selectionStart;
                    const baseUrlLength = baseUrl.length;
                    if (shouldChageInputFocus) {
                        e.target.setSelectionRange(baseUrlLength + clickPosition, baseUrlLength + clickPosition);
                        setShouldChangeInputFocus(false);
                    }
                  }}
                  onFocus={(e) => {
                    const validParams = RequestParams.filter(param => param.key.trim().length > 0 && param.value.trim().length > 0);
                    const fullUrl = validParams.length > 0 ? `${baseUrl}${path}?${validParams.map(param => `${param.key}=${param.value}`).join("&")}` : `${baseUrl}${path}`;
                    if (fullUrl.length === 0) {
                      setActionUrl(serverurl + action?.url);
                    }else{
                      setActionUrl(fullUrl);
                    }
                    if(!shouldChageInputFocus){
                      setShouldChangeInputFocus(true);
                    }
                  }}

                  onBlur={(e) => {
                    if(e.target.value.trim().length === 0) {
                      setActionUrl(path);
                    }else if(path.length === 0){
                      setActionUrl(action?.url);
                    }else if(baseUrl.length === 0){
                      setBaseUrl(serverurl)
                      setActionUrl(path)
                    }else{
                      const validParams = RequestParams.filter(param => param.key.trim().length > 0 && param.value.trim().length > 0);
                     const validPath = validParams?.length > 0 ? `${path}?${validParams.map(param => `${param.key}=${param.value}`).join("&")}` : path;
                     setActionUrl(validPath)
                    }
                    setShouldChangeInputFocus(false);
                  }}

                  onChange={(e) => {
                    const newUrl = e.target.value
                    setActionUrl(newUrl);
                    const params = extractParamsFromText(newUrl);
                    setRequestParams(params);


                    if (newUrl.startsWith("http://") || newUrl.startsWith("https://")) {
                      try {
                        const url = new URL(newUrl);
                        setBaseUrl(url.origin);
                        const newPath = decodeURIComponent(url.pathname);;
                  
                        setPath(newPath);
                      } catch (error) {
                        console.error("Invalid URL:", newUrl, error);
						toast("The URL is not a valid one. Please check and try again.")
                      }
                    } else {
						//toast("The URL needs to start with http:// or https://")
					}
                  }}
                />
                
                <Button
                  variant="contained"
                  sx={{
                    width: "107px",
                    height: 35,
                    borderRadius: 200,
                    padding: "16px 24px 16px 24px",
                    backgroundColor: "rgba(2, 203, 112, 0.2)",
                    color: "rgba(2, 203, 112, 1)",
                    cursor:  "pointer",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "rgba(2, 203, 112, 0.1)",
                    },
                    marginRight: "5px"
                  }}
                  disabled={disableExecuteButton}
                  onClick={() => {
					/*
					if (!firstSendDone) {
						setFirstSendDone(true)
        				setCurTab(2)
					}
					*/

                    if (actionUrl.length === 0) {
                      toast.error("URL cannot be empty");
                      return;
                    }else{
                      setShowResponseLoader(true);
                      setDisableExecuteButton(true)
                      handleRequestWithCustomAction(selectedMethod, baseUrl, path, RequestHeader, RequestBody, RequestParams, info, action)
                    }
                  }}
                >
                  Send
                </Button>
              </div>
              {showResponseLoader? (
                <LinearProgress
                variant="indeterminate"
                sx={{
                  backgroundColor: "#252525",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#ff4500",
                  },
                  minWidth: "694px",
                  maxWidth: "1024px",
                  marginLeft: "40px",
                  height: '1px',
                  borderRadius: '8px',
                }}
              />
              ) : null}              
              <Paper
                style={{
                  minWidth: 696,
                  marginTop: 16,
                  marginLeft: "40px",
                  position: "sticky",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    background: "rgba(26, 26, 26, 1)",
                  }}
                >
                  <Tabs
                    value={curTab}
                    onChange={(event, newValue) =>
                      handleChangeTab(index, newValue)
                    }
                    aria-label="basic tabs example"
                  >
                    <Tab
                      label=<span
                        style={{ textTransform: "none", fontSize: 16 }}
                      >
                        Headers
                      </span>
                      {...a11yProps(0)}
                    />
                    {shouldShowBodyTab && (
                      <Tab
                        label=<span
                          style={{ textTransform: "none", fontSize: 16 }}
                        >
                          Body
                        </span>
                        {...a11yProps(1)}
                      />
                    )}
                    <Tab
                      label=<span
                        style={{ textTransform: "none", fontSize: 16 }}
                      >
                        Params
                      </span>
                      {...a11yProps(shouldShowBodyTab ? 2 : 1)}
                    />
                    {ConfigurationTab ? (
                      <Tab
                      label=<span
                        style={{ textTransform: "none", fontSize: 16 }}
                      >
                        Configuration
                      </span>
                      {...a11yProps(shouldShowBodyTab ? 3 : 2)}
                    />
                    ) : null}
                  </Tabs>
                </div>
                <CustomTabPanel
                  value={curTab}
                  index={0}
                >
                  <TableContainer
                    style={{
                      minWidth: 696,
                      backgroundColor: "#212121",
                      borderRadius: 6,
                      border: "1px solid rgba(73, 73, 73, 1)",
                    }}
                  >
                    <Table aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            style={{
                              border: "1px solid rgba(73, 73, 73, 1)",
                              fontSize: 16
                            }}
                          >
                            Key
                          </TableCell>
                          <TableCell
                            style={{
                              border: "1px solid rgba(73, 73, 73, 1)",
                              fontSize: 16
                            }}
                          >
                            Value
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {RequestHeader.map((row, rowIndex) => (
                          <TableRow key={rowIndex} sx={{ height: 60 }}>
                            <TableCell
                              style={{
                                border: "1px solid rgba(73, 73, 73, 1)",
                                padding: "0px 4px",
                              }}
                            >
                              <TextField
                                fullWidth
                                variant="outlined"
                                type="text"
                                id={`header-key-${index}-${rowIndex}`}
                                value={row.key}
                                onChange={(e) =>
                                  handleInputChange(
                                    rowIndex,
                                    "key",
                                    e.target.value
                                  )
                                }
                                inputProps={{
                                  style: {
                                    backgroundColor: "rgba(33, 33, 33, 1)",
                                    padding: "4px 8px",
                                  },
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      border: "none",
                                    },
                                    "&:hover fieldset": {
                                      border: "none",
                                    },
                                    "&.Mui-focused fieldset": {
                                      border: "none",
                                    },
                                  },
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    document.getElementById(
                                      `header-value-${index}-${rowIndex}`
                                    ).focus();
                                  }
                                  if (e.key === "Backspace" && row.key.length === 0 && rowIndex !== 0) {
                                    setRequestHeader(RequestHeader.filter((header, i) => i !== rowIndex));
                                    document.getElementById(
                                      `header-value-${index}-${rowIndex - 1}`
                                    ).focus();
                                    e.preventDefault()
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell
                              style={{
                                border: "1px solid rgba(73, 73, 73, 1)",
                                padding: "0px 4px",
                              }}
                            >
                              <TextField
                                fullWidth
                                type="text"
                                value={row.value}
                                id={`header-value-${index}-${rowIndex}`}
                                onChange={(e) =>
                                  handleInputChange(
                                    rowIndex,
                                    "value",
                                    e.target.value
                                  )
                                }
                                inputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <DeleteIcon sx={{ color: "red" }} />
                                    </InputAdornment>
                                  ),
                                  style: {
                                    backgroundColor: "rgba(33, 33, 33, 1)",
                                    padding: "4px 8px",
                                  },
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      border: "none",
                                    },
                                    "&:hover fieldset": {
                                      border: "none",
                                    },
                                    "&.Mui-focused fieldset": {
                                      border: "none",
                                    },
                                  },
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.ctrlKey) {
                                    addRow();
                                    setTimeout(() => {
                                      document.getElementById(
                                        `header-key-${index}-${rowIndex + 1}`
                                      ).focus();
                                    }, 0);
                                  }
                                  if (e.ctrlKey && e.key === "Enter") {
                                    setShowResponseLoader(true);
                                    setDisableExecuteButton(true)
                                    handleRequestWithCustomAction(selectedMethod, baseUrl, path, RequestHeader, RequestBody, RequestParams, info, action);
                                  }
                                  if (e.key === "Backspace" && row.value.length === 0 && rowIndex !== 0) {
                                    setRequestHeader(RequestHeader.filter((header, i) => i !== rowIndex));
                                    document.getElementById(
                                      `header-value-${index}-${rowIndex - 1}`
                                    ).focus();
                                    e.preventDefault()
                                  }}
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Button
                    onClick={() => addRow()}
                    variant="contained"
                    color="primary"
                    style={{
                      width: 127,
                      height: 35,
                      borderRadius: 200,
                      padding: "16px 24px",
                      marginTop: 26,
                      textTransform: "none",
                      backgroundColor: "rgba(255, 132, 68, 0.2)",
                      color: "rgba(255, 132, 68, 1)",
                    }}
                  >
                    Add Row
                  </Button>
                </CustomTabPanel>
                {shouldShowBodyTab && (
                  <CustomTabPanel
                    value={curTab}
                    index={1}
                  >
                    <AceEditor
                      id="shuffle-codeeditor-api-Explorer"
                      name="shuffle-codeeditor-api-Explorer"
                      mode="json"
                      ref={editorRef}
                      value={RequestBody}
                      theme="gruvbox"
                      width="100%"
                      fontSize={16}
                      setOptions={{ useWorker: false }}   
                      onChange={handleAceEditorChange}
                      highlightActiveLine={false}
                      style={{
                          wordBreak: "break-word",
                          marginTop: 0,
                          paddingBottom: 10,
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                          backgroundColor: "#212121",
                          color: "white",
                          justifyContent: "center",
                          minHeight: `${AceEditorHeight}px`,
                          maxHeight: `${AceEditorHeight}px`,
                          border: "1px solid rgb(73, 73, 73)",
                          borderRadius: 6,
                      }}
                  />
                  </CustomTabPanel>
                )}
                <CustomTabPanel
                  value={curTab}
                  index={shouldShowBodyTab ? 2 : 1}
                >
                  <TableContainer
                    style={{
                      minWidth: 696,
                      backgroundColor: "#212121",
                      borderRadius: 6,
                      border: "1px solid rgba(73, 73, 73, 1)",
                    }}
                  >
                    <Table aria-label="simple table">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            style={{
                              border: "1px solid rgba(73, 73, 73, 1)",
                              fontSize: 16
                            }}
                          >
                            Key
                          </TableCell>
                          <TableCell
                            style={{
                              border: "1px solid rgba(73, 73, 73, 1)",
                              fontSize: 16
                            }}
                          >
                            Value
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {RequestParams.map((row, rowIndex) => (
                          <TableRow key={rowIndex} sx={{ height: 60 }}>
                            <TableCell
                              style={{
                                border: "1px solid rgba(73, 73, 73, 1)",
                                padding: "0px 4px",
                              }}
                            >
                              <TextField
                                fullWidth
                                type="text"
                                inputProps={{
                                  style: {
                                    backgroundColor: "rgba(33, 33, 33, 1)",
                                    padding: "4px 8px",
                                  },
                                }}
                                id={`param-key-${index}-${rowIndex}`}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      border: "none",
                                    },
                                    "&:hover fieldset": {
                                      border: "none",
                                    },
                                    "&.Mui-focused fieldset": {
                                      border: "none",
                                    },
                                  },
                                }}
                                value={row.key}
                                onChange={(e) =>
                                  handleRequestParamsChange(
                                    rowIndex,
                                    "key",
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    document.getElementById(
                                      `param-value-${index}-${rowIndex}`
                                    ).focus();
                                  }
                                  if (e.key === "Backspace" && row.value.length === 0 && rowIndex !== 0) {
                                    setRequestParams(RequestParams.filter((param, i) => i !== rowIndex));
                                    document.getElementById(
                                      `param-value-${index}-${rowIndex - 1}`
                                    ).focus();
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell
                              style={{
                                border: "1px solid rgba(73, 73, 73, 1)",
                                padding: "0px 4px",
                              }}
                            >
                              <TextField
                                fullWidth
                                type="text"
                                id={`param-value-${index}-${rowIndex}`}
                                value={row.value}
                                inputProps={{
                                  style: {
                                    backgroundColor: "rgba(33, 33, 33, 1)",
                                    padding: "4px 8px",
                                  },
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      border: "none",
                                    },
                                    "&:hover fieldset": {
                                      border: "none",
                                    },
                                    "&.Mui-focused fieldset": {
                                      border: "none",
                                    },
                                  },
                                }}
                                onChange={(e) =>
                                  handleRequestParamsChange(
                                    rowIndex,
                                    "value",
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.ctrlKey) {
                                    addRequestParamsRow();
                                    setTimeout(() => {
                                      document.getElementById(
                                        `param-key-${index}-${rowIndex + 1}`
                                      ).focus();
                                    }, 0);
                                  }
                                  if (e.ctrlKey && e.key === "Enter") {
                                    setShowResponseLoader(true);
                                    setDisableExecuteButton(true)
                                    handleRequestWithCustomAction(selectedMethod, baseUrl, path, RequestHeader, RequestBody, RequestParams, info, action);
                                  }

                                  if (e.key === "Backspace" && row.value.length === 0 && rowIndex !== 0) {
                                    setRequestParams(RequestParams.filter((param, i) => i !== rowIndex));
                                    document.getElementById(
                                      `param-value-${index}-${rowIndex - 1}`
                                    ).focus();
                                    e.preventDefault()
                                  }
                                }
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Button
                    onClick={addRequestParamsRow}
                    variant="contained"
                    color="primary"
                    style={{
                      width: 127,
                      height: 35,
                      borderRadius: 200,
                      padding: "16px 24px 16px 24px",
                      marginTop: 26,
                      textTransform: "none",
                      backgroundColor: "rgba(255, 132, 68, 0.2)",
                      color: "rgba(255, 132, 68, 1)",
                    }}
                  >
                    Add Row
                  </Button>
                </CustomTabPanel>
                {(ConfigurationTab && ((shouldShowBodyTab && curTab === 3 ) || (!shouldShowBodyTab && curTab === 2)))? (
                  <ConfigurationTab
					setCurTab={setCurTab}
					shouldShowBodyTab={shouldShowBodyTab}
				  />
                ) : null}
              </Paper>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 354,
                marginLeft: 10,
                marginRight: 5,
              }}
            >
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingTop: index === 0 ? "20px" : "40px",
                  minWidth: 200,
                  marginLeft: 10
                }}
              >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>
                    {action.name.replaceAll("_", " ")}
                  </span>
                  <p >
                    {action.description
                      ? action.description
                      : ""}
                  </p>
              </div>
            </div>
          </div>
        );
})

const ActionResponse = memo(({ apiResponse, ExampleBody, isLoggedIn, isLoaded }) => {
  const [height, setHeight] = useState("14vh")
  const [responseTabIndex, setResponseTabIndex] = useState(0)
  const [oldResponse, setOldResponse] = useState(apiResponse)
  const [highlight, setHighlight] = useState(false)

  const MIN_HEIGHT = 50

  useEffect(() => {
	  var apiResp = apiResponse
	  var oldResp = oldResponse
	  try {
		  apiResp = JSON.stringify(apiResponse)
	  } catch (error) {
		  //console.error("Error parsing JSON response:", error);
	  }

	  try {
		  oldResp = JSON.stringify(oldResponse)
	  } catch (error) {
		  //console.error("Error parsing JSON response:", error);
	  }

	  if (apiResp === oldResp) {
		  return
	  }

	  setOldResponse(apiResponse)

	  //console.log("CHANGES MADE: ", apiResponse, oldResponse)
	  //toast("CHANGES!")
	  //console.log("HEIGHT: ", height)
	  
	  if (height === "14vh") {
		  setHeight("30vh")
	  } else {
		  // Check if height is less than 250px
		  var heightNum = 0
		  try {
		  	heightNum = parseInt(height.slice(0, -2))
		  } catch (error) {
		  }

		  if (heightNum < 350) {
			  setHeight("350px")
		  } 
	  }

	  setHighlight(true)
	  setTimeout(() => {
	      setHighlight(false)
	  }, 2000)
  }, [apiResponse, ExampleBody])

  const handleReactJsonClipboard = (copy) => {
    const elementName = "copy_element_shuffle";
    let copyText = document.getElementById(elementName);

    if (copyText) {
      if (copy.namespace && copy.name && copy.src) {
        copy = copy.src;
      }

      const clipboard = navigator.clipboard;
      if (!clipboard) {
        toast("Can only copy over HTTPS (port 3443)");
        return;
      }

      let stringified = JSON.stringify(copy);
      if (stringified.startsWith('"') && stringified.endsWith('"')) {
        stringified = stringified.slice(1, -1);
      }

      navigator.clipboard.writeText(stringified);
      toast("Copied value to clipboard, NOT json path.");
    } else {
      console.log("Failed to copy from " + elementName + ": ", copyText);
    }
  };

  const stopResizing = () => {
    window.removeEventListener("mousemove", startResizing);
    window.removeEventListener("mouseup", stopResizing);
  };

  const initResize = (e) => {
    e.preventDefault();
    window.addEventListener("mousemove", startResizing);
    window.addEventListener("mouseup", stopResizing);
  };

  const startResizing = useCallback((e) => {
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= MIN_HEIGHT) { 
      setHeight(`${newHeight}px`);
    }
  }, []);

  const formData = (exampleBody) => {
    try {
      return exampleBody ? JSON.parse(exampleBody) : {};
    } catch (error) {
      console.error("Error parsing the example string:", error);
      return {};
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerHeight * 0.1;
      setHeight(`${newHeight}px`);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <ApiResponseWrapper isLoggedIn={isLoggedIn} isLoaded={isLoaded}>
      <div
        style={{
          width: '100%',
          height: height,
          backgroundColor: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          maxHeight: "80vh",
		  transition: "height 0.3s ease",
        }}
      >
	  	{highlight === true ? 
			<LinearProgress fullWidth color="secondary" style={{height: 1, }}/>
			: null
		}
        <div
          style={{
            overflow: 'auto',
            cursor: 'row-resize',
          }}
          onMouseDown={initResize}
        >
          <Tabs
            value={responseTabIndex}
            onChange={(e, newValue) => setResponseTabIndex(newValue)}
          >
            <Tab
              label={<span style={{ textTransform: 'none', fontSize: 16 }}>Response</span>}
              {...a11yProps(0)}
            />
            <Tab
              label={<span style={{ textTransform: 'none', fontSize: 16 }}>Example Response</span>}
	  		  disabled={ExampleBody === undefined || ExampleBody === null || ExampleBody === ""}
              {...a11yProps(1)}
            />
            <Tab
              label={<span style={{ textTransform: 'none', fontSize: 16 }}>History</span>}
	  		  disabled={true}
              {...a11yProps(2)}
            />
          </Tabs>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <CustomTabPanel
            value={responseTabIndex}
            index={0}
          >
            <ResponseTabWrapper apiResponse={apiResponse} />
          </CustomTabPanel>

          <CustomTabPanel
            value={responseTabIndex}
            index={1}
          >
            <ReactJson
              src={formData(ExampleBody)}
              theme={theme.palette.jsonTheme}
              style={{ backgroundColor: '#1a1a1a', padding: 5 }}
              collapsed={false}
              iconStyle={theme.palette.jsonIconStyle}
              collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
              enableClipboard={handleReactJsonClipboard}
              displayDataTypes={false}
              name={false}
            />
          </CustomTabPanel>

        </div>
      </div>
    </ApiResponseWrapper>
  );
});

const ResponseTabWrapper = memo(({ apiResponse }) => {
  const handleReactJsonClipboard = (copy) => {
    const elementName = "copy_element_shuffle";
    let copyText = document.getElementById(elementName);

    if (copyText) {
      if (copy.namespace && copy.name && copy.src) {
        copy = copy.src;
      }

      const clipboard = navigator.clipboard;
      if (!clipboard) {
        toast("Can only copy over HTTPS (port 3443)");
        return;
      }

      let stringified = JSON.stringify(copy);
      if (stringified.startsWith('"') && stringified.endsWith('"')) {
        stringified = stringified.slice(1, -1);
      }

      navigator.clipboard.writeText(stringified);
      toast("Copied value to clipboard, NOT json path.");
    } else {
      console.log("Failed to copy from " + elementName + ": ", copyText);
    }
  };

  return(
    <ReactJson
          src={apiResponse}
          theme={theme.palette.jsonTheme}
          style={{ backgroundColor: "#1a1a1a", padding: 5 }}
		  shouldCollapse={(jsonField) => {
			return collapseField(jsonField)
		  }}
          iconStyle={theme.palette.jsonIconStyle}
          collapseStringsAfterLength={theme.palette.jsonCollapseStringsAfterLength}
          enableClipboard={handleReactJsonClipboard}
          displayDataTypes={false}
          name={false}
        />
  )})

const PaddingWrapper = memo(({ isLoggedIn, isLoaded, children }) => {
  const { leftSideBarOpenByClick, windowWidth } = useContext(Context);
  return (
    <div
      style={{
        width: (isLoggedIn && isLoaded)
          ? leftSideBarOpenByClick
            ? windowWidth >= 1920  ? "calc(100% - 630px)" : "calc(100% - 570px)"
            : windowWidth >= 1920 ? "calc(100vw - 460px)": "calc(100% - 410px)"
          : windowWidth >= 1920 ? "calc(100% - 370px)" : "calc(100% - 320px)",
        backgroundColor: "#1a1a1a",
        position: "fixed",
        bottom: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid #212121",
        transition: "width 0.3s ease",
        minHeight: "10%",
      }}
    >
      {children}
    </div>
  );
});

const ApiResponseWrapper = memo(({ children, isLoaded, isLoggedIn }) => {
  return (
    <PaddingWrapper isLoggedIn={isLoggedIn} isLoaded={isLoaded}>
      {children}
    </PaddingWrapper>
  );
});
