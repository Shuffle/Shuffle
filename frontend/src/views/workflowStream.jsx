// This file owns: connection lifecycle, sending ops, receiving/parsing ops.
// It does NOT own: Cytoscape mutations, React state, or access control gates.
// Those stay in AngularWorkflow.jsx.

// Stream operation vocab 
// These match the exact strings the backend uses. One source of truth.

export const ITEMS = {
  NODE: "node",
  EDGE: "edge",
  WORKFLOW: "workflow",
  SYSTEM: "system",
  PRESENCE: "presence",
};

export const TYPES = {
  ADD: "add",
  REMOVE: "remove",
  MOVE: "move",
  CONFIGURE: "configure",
  SELECT: "select",
  UNSELECT: "unselect",
  SAVE: "save",
};


function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).then((response) => {
    clearTimeout(id);
    return response;
  });
}

function buildStreamUrl(baseUrl, workflowId) {
  return `${baseUrl}/api/v1/workflows/${workflowId}/stream`;
}

function buildHeaders(orgId) {
  var headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (orgId !== undefined && orgId !== null && orgId.length > 0) {
    headers["Org-Id"] = orgId;
  }

  return headers;
}

// createStreamSender
//
// Pass the connection params + two callbacks once. Get back an object with
// all the send helpers pre-bound. No need to repeat baseUrl/orgId/userId
// or pass callbacks at every call site.
//
// Usage in AngularWorkflow.jsx:
//   const stream = createStreamSender(streamUrl, workflowId, orgId, userId, onSent, onDenied, canStream)
//   stream.sendNodeMove(id, x, y)
//   stream.sendEdgeAdd(id, source, target)

export function createStreamSender(
  baseUrl,
  workflowId,
  orgId,
  userId,
  onSent,
  onDenied,
  canSend,
) {
  const sendOp = (op) => {
    if (canSend && !canSend()) {
      return Promise.resolve(null);
    }
    if (!baseUrl || !workflowId) {
      return Promise.resolve(null);
    }

    op.user_id = userId;

    const url = buildStreamUrl(baseUrl, workflowId);

    var body = op;
    try {
      body = JSON.stringify(op);
    } catch (e) {
      console.log("Error parsing body for stream: ", e);
      return Promise.resolve(null);
    }

    return fetch(url, {
      method: "POST",
      headers: buildHeaders(orgId),
      body: body,
      credentials: "include",
    })
      .then((response) => {
        if (onSent) {
          onSent();
        }
        if (response.status === 401 || response.status === 403) {
          if (onDenied) {
            onDenied();
          }
        }
        return response.json();
      })
      .then((responseJson) => {
        //console.log("Stream resp: ", responseJson)
      })
      .catch((error) => {
        console.log("Stream send error: ", error.toString());
      });
  };

  return {
    sendNodeMove: (id, x, y) => {
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.MOVE,
        id: id,
        location: { x: x, y: y },
      });
    },

    sendNodeSelect: (id, x, y) => {
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.SELECT,
        id: id,
        location: { x: x, y: y },
      });
    },

    sendNodeUnselect: (id) => {
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.UNSELECT,
        id: id,
      });
    },

    sendNodeAdd: (id, data, location) => {
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.ADD,
        id: id,
        data: data,
        location: location,
      });
    },

    sendNodeRemove: (id) => {
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.REMOVE,
        id: id,
      });
    },

    sendNodeConfigure: (id, data) => {
      const { large_image, small_image, ...cleanData } = data || {};
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.CONFIGURE,
        id: id,
        data: cleanData,
      });
    },

    sendSetStartNode: (id) => {
      return sendOp({
        item: ITEMS.NODE,
        type: TYPES.CONFIGURE,
        id: id,
        data: { isStartNode: true },
      });
    },

    sendEdgeAdd: (id, source, target) => {
      return sendOp({
        item: ITEMS.EDGE,
        type: TYPES.ADD,
        id: id,
        data: { source: source, target: target, id: id },
      });
    },

    sendEdgeRemove: (id) => {
      return sendOp({
        item: ITEMS.EDGE,
        type: TYPES.REMOVE,
        id: id,
      });
    },

    sendEdgeConfigure: (id, data) => {
      const { large_image, small_image, ...cleanData } = data || {};
      return sendOp({
        item: ITEMS.EDGE,
        type: TYPES.CONFIGURE,
        id: id,
        data: cleanData,
      });
    },

    sendWorkflowSave: (saveId) => {
      return sendOp({
        item: ITEMS.WORKFLOW,
        type: TYPES.SAVE,
        id: saveId,
      });
    },
  };
}

// Receiver: long-poll stream consumer

// startStream connects to the stream endpoint, handles reconnect/backoff,
// parses NDJSON lines (with partial-line buffering), and calls onOp for each
// parsed operation. Returns a stop() function.

// options:
//   onOp(op)               — called for each parsed StreamWorkflowOperation
//   onSeqUpdate(seq)       — called when a new sequence number is seen
//   onStatusChange(status) — called with "active", "denied", "disconnected"
//   onError(err)           — called on fetch errors (after backoff)

export function startStream(baseUrl, workflowId, orgId, options) {
  const { onOp, onSeqUpdate, onStatusChange, onError } = options || {};

  let stopped = false;
  let lastSeq = 0;
  const timeout = 60000;
  const maxFailures = 20;
  const retryDelay = 3000;
  const presenceIntervalMs = 5000;

  const url = buildStreamUrl(baseUrl, workflowId);

  // Solo mode: poll presence cheaply instead of holding a long-poll open. Resolves true
  // when it's time to go live — someone else (or an agent) is now on the workflow.
  const waitUntilLive = async () => {
    while (!stopped) {
      try {
        const headers = { "Content-Type": "application/json", Accept: "application/json" };
        if (orgId !== undefined && orgId !== null && orgId.length > 0) {
          headers["Org-Id"] = orgId;
        }

        const response = await fetchWithTimeout(`${url}?presence_only=1`, {
          method: "GET",
          headers: headers,
          credentials: "include",
          timeout: 8000,
        });

        if (response.status === 401 || response.status === 403) {
          if (onStatusChange) {
            onStatusChange("denied");
          }
          return false;
        }

        const data = await response.json();
        if (data && data.seq > lastSeq) {
          lastSeq = data.seq;
        }
        if (data && data.count > 1) {
          return true;
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
      // Add jitter to prevent thundering herd when many users poll simultaneously
      const jitter = Math.random() * 2000; // 0-2 seconds
      await new Promise((r) => setTimeout(r, presenceIntervalMs + jitter));
    }
    return false;
  };

  // Live mode: the long-poll loop. Reconnects every ~55s while others are present.
  // Returns true when a cycle ends with nobody else around, so the caller can fall back
  // to cheap presence polling; returns false when the stream should stop for good.
  const runLive = async () => {
    if (onStatusChange) {
      onStatusChange("active");
    }

    let consecutiveFailures = 0;

    while (!stopped) {
      if (consecutiveFailures >= maxFailures) {
        if (onStatusChange) {
          onStatusChange("disconnected");
        }
        return false;
      }

      const getHeaders = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      };
      if (orgId !== undefined && orgId !== null && orgId.length > 0) {
        getHeaders["Org-Id"] = orgId;
      }

      // Track how many users are present. Start at 2 (assume we're not alone) so we don't
      // immediately drop back to solo mode if presence update hasn't arrived yet. Gets updated
      // when we receive a presence operation from the server.
      let lastPresenceCount = 2;

      try {
        const response = await fetchWithTimeout(`${url}?since=${lastSeq}`, {
          method: "GET",
          headers: getHeaders,
          credentials: "include",
          timeout: timeout,
        });

        if (response.status === 401 || response.status === 403) {
          if (onStatusChange) {
            onStatusChange("denied");
          }
          return false;
        }

        if (!response.ok) {
          throw new Error(`stream ${response.status}`);
        }

        await processChunkedResponse(response, (op) => {
          // Track sequence
          if (op.sequence && op.sequence > lastSeq) {
            lastSeq = op.sequence;
            if (onSeqUpdate) {
              onSeqUpdate(lastSeq);
            }
          }

          // Track how many are here so we know when to drop back to solo.
          if (op.item === "presence") {
            lastPresenceCount = Array.isArray(op.users) ? op.users.length : 0;
          }

          // Forward to caller
          if (onOp) {
            onOp(op);
          }
        });

        consecutiveFailures = 0;

        // Server self-closed after ~55s. If we're the only one here now, stop holding
        // the connection open and drop back to polling.
        if (lastPresenceCount <= 1) {
          return true;
        }
      } catch (error) {
        consecutiveFailures++;
        if (onError) {
          onError(error);
        }
        if (!stopped) {
          await new Promise((r) => setTimeout(r, retryDelay));
        }
      }
    }
    return false;
  };

  // First connection is always live so the initial since=0 catch-up replays any unsaved
  // ops (unchanged behavior). After that, alternate: poll cheaply when solo, hold the
  // live loop open when others are present.
  const loop = async () => {
    let firstCycle = true;
    while (!stopped) {
      if (!firstCycle) {
        const goLive = await waitUntilLive();
        if (!goLive) {
          return;
        }
      }
      firstCycle = false;

      const backToSolo = await runLive();
      if (!backToSolo) {
        return;
      }
    }
  };

  loop();

  return function stop() {
    stopped = true;
  };
}

// NDJSON parser with partial-line buffering
// Handles TCP splits — holds back incomplete trailing lines and flushes on stream end.
// Do NOT simplify this: it prevents dropped ops when a JSON line spans two TCP reads.

async function processChunkedResponse(response, onParsedOp) {
  var lineBuffer = "";
  var reader = response.body.getReader();
  var decoder = new TextDecoder();

  while (true) {
    const result = await reader.read();
    const chunk = decoder.decode(result.value || new Uint8Array(), {
      stream: !result.done,
    });

    if (chunk === undefined || chunk === null) {
      if (result.done) {
        break;
      }
      continue;
    }

    lineBuffer += chunk;
    const parts = lineBuffer.split("\n");
    lineBuffer = result.done ? "" : parts.pop();
    const lines = parts.filter((l) => l.trim().length > 0);

    for (const line of lines) {
      try {
        const op = JSON.parse(line);
        if (op.success === false) {
          console.log("Stream chunk failed: ", op);
          continue;
        }
        onParsedOp(op);
      } catch (e) {
        continue;
      }
    }

    if (result.done) {
      break;
    }
  }
}
