import React, { useState, useEffect } from "react"
import {
  Drawer,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material"
import {
  History as HistoryIcon,
  Close as CloseIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  OpenWith as OpenWithIcon,
  Tune as TuneIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Save as SaveIcon,
} from "@mui/icons-material"

const opIcon = (item, type) => {
  if (item === "node") {
    if (type === "add") return <AddCircleOutlineIcon style={{ fontSize: 16, color: "#0ACF83" }} />
    if (type === "remove") return <RemoveCircleOutlineIcon style={{ fontSize: 16, color: "#FF7262" }} />
    if (type === "move") return <OpenWithIcon style={{ fontSize: 16, color: "#1ABCFE" }} />
    if (type === "configure") return <TuneIcon style={{ fontSize: 16, color: "#A259FF" }} />
  }
  if (item === "edge") {
    if (type === "add") return <LinkIcon style={{ fontSize: 16, color: "#0ACF83" }} />
    if (type === "remove") return <LinkOffIcon style={{ fontSize: 16, color: "#FF7262" }} />
  }
  if (item === "workflow" && type === "save") return <SaveIcon style={{ fontSize: 16, color: "#FFD700" }} />
  return null
}

const opLabel = (op) => {
  const actor = op.username || op.user_id || "Unknown"

  let nodeLabel = ""
  if (op.data) {
    try {
      const d = typeof op.data === "string" ? JSON.parse(op.data) : op.data
      nodeLabel = d.label || d.app_name || d.name || ""
    } catch {}
  }

  if (op.item === "node") {
    if (op.type === "add") return `${actor} added ${nodeLabel ? `"${nodeLabel}"` : "a node"}`
    if (op.type === "remove") return `${actor} removed ${nodeLabel ? `"${nodeLabel}"` : "a node"}`
    if (op.type === "move") return `${actor} moved ${nodeLabel ? `"${nodeLabel}"` : "a node"}`
    if (op.type === "configure") return `${actor} configured ${nodeLabel ? `"${nodeLabel}"` : "a node"}`
  }
  if (op.item === "edge") {
    if (op.type === "add") return `${actor} connected two nodes`
    if (op.type === "remove") return `${actor} removed a connection`
  }
  if (op.item === "workflow" && op.type === "save") return `${actor} saved the workflow`
  return `${actor} made a change`
}

const timeAgo = (timestampMs) => {
  if (!timestampMs) return ""
  const diff = Date.now() - timestampMs
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const WorkflowHistory = ({ workflowId, globalUrl, theme }) => {
  const [open, setOpen] = useState(false)
  const [ops, setOps] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${globalUrl}/api/v1/workflows/${workflowId}/stream/history`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson?.success && Array.isArray(responseJson.operations)) {
          setOps([...responseJson.operations].reverse())
        }
      })
      .catch((error) => {
        console.log("Failed to load workflow history:", error)
      })
      .finally(() => setLoading(false))
  }, [open, workflowId, globalUrl])

  const bg = theme?.palette?.backgroundColor || "#1a1a1a"
  const surface = theme?.palette?.surfaceColor || "#242424"
  const textPrimary = theme?.palette?.text?.primary || "#ffffff"
  const textSecondary = theme?.palette?.text?.secondary || "#9e9e9e"
  const border = theme?.palette?.DialogStyle?.border || "1px solid rgba(255,255,255,0.1)"

  return (
    <>
      <Tooltip title="Workflow history" placement="bottom">
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          style={{ color: "#ffffff", padding: 0, width: 30, height: 30 }}
        >
          <HistoryIcon style={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          style: {
            width: 340,
            backgroundColor: bg,
            borderLeft: border,
            padding: 0,
          },
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: border }}>
          <Typography style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>
            Workflow Activity
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)} style={{ color: textSecondary }}>
            <CloseIcon style={{ fontSize: 18 }} />
          </IconButton>
        </div>

        <div style={{ overflowY: "auto", height: "calc(100% - 53px)", padding: "12px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
              <CircularProgress size={24} style={{ color: textSecondary }} />
            </div>
          ) : ops.length === 0 ? (
            <Typography style={{ color: textSecondary, fontSize: 13, marginTop: 20, textAlign: "center" }}>
              No activity yet
            </Typography>
          ) : (
            ops.map((op, i) => (
              <div
                key={op.sequence || i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  marginBottom: 8,
                  borderRadius: 8,
                  backgroundColor: surface,
                  border: border,
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {opIcon(op.item, op.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography style={{ fontSize: 13, color: textPrimary, lineHeight: 1.4, wordBreak: "break-word" }}>
                    {opLabel(op)}
                  </Typography>
                  <Typography style={{ fontSize: 11, color: textSecondary, marginTop: 3 }}>
                    {timeAgo(op.timestamp)}
                    {op.sequence ? (
                      <span style={{ marginLeft: 8, opacity: 0.5 }}>#{op.sequence}</span>
                    ) : null}
                  </Typography>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </>
  )
}

export default WorkflowHistory
