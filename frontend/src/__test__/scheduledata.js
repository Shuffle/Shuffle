const Data = {
  src: {
    name: "Get Tickets",
    description: "Get tickets",
    outputparameters: [
      {
        name: "SymptomDescription",
        schema: { type: "string" },
      },
      { name: "DetailedDescription", schema: { type: "string" } },
      { name: "EventSource", schema: { type: "string" } },
    ],
  },
  dst: {
    name: "Create alert",
    description: "Create alert in TheHive",
    inputparameters: [
      {
        name: "title",
        required: true,
        schema: { type: "string" },
      },
      { name: "description", required: true, schema: { type: "string" } },
      { name: "source", required: true, schema: { type: "string" } },
    ],
  },
};

export default Data;
