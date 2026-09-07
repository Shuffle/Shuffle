import React from "react";
import {
  Button,
  Tooltip,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  OpenInNew as OpenInNewIcon,
  Send as SendIcon,
  Add as AddIcon,
  Stop as StopIcon,
  FormatListBulleted as FormatListBulletedIcon,
} from "@mui/icons-material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-toastify";

const AgentChatWidget = ({ globalUrl, theme, widgetLeft, workflowName, workflowId, workflow, saveWorkflow }) => {
  const [chatInput, setChatInput] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [answerInput, setAnswerInput] = React.useState("")
  const [continuationInput, setContinuationInput] = React.useState("")
  const [agentWidgetExec, setAgentWidgetExec] = React.useState(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyRuns, setHistoryRuns] = React.useState([])
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const agentWidgetPollRef = React.useRef(null)
  // Filters out stale polls that still report a just-answered decision as
  // WAITING (backend hasn't processed the answer yet) — prevents the input
  // UI from flashing back open.
  const answeredDecisionIdsRef = React.useRef(new Set())

  const accentColor = theme?.palette?.main || "#ff8544"
  const bg = theme?.palette?.platformColor || "#1a1a1a"
  const textPrimary = theme?.palette?.text?.primary || "#fff"
  const textSecondary = theme?.palette?.text?.secondary || "#aaa"

  const hasPendingQuestion = !!agentWidgetExec?.waitingDecisionId
  const isWaiting = agentWidgetExec?.status === "WAITING" || hasPendingQuestion
  const isRunning = agentWidgetExec?.status === "EXECUTING" && !hasPendingQuestion
  const isFinished = agentWidgetExec?.status === "FINISHED"
  const isFailed = agentWidgetExec?.status === "ABORTED" || agentWidgetExec?.status === "FAILURE" || agentWidgetExec?.status === "STOPPED"
  const hasExec = !!agentWidgetExec?.execution_id

  const agentsUrl = hasExec
    ? `/agents?execution_id=${agentWidgetExec.execution_id}&authorization=${agentWidgetExec.authorization}`
    : "/agents"

  const stopAgentWidgetPoll = () => {
    if (agentWidgetPollRef.current) {
      clearInterval(agentWidgetPollRef.current)
      agentWidgetPollRef.current = null
    }
  }

  const fetchAgentExecUpdate = (execution_id, authorization) => {
      fetch(`${globalUrl}/api/v1/streams/results`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ execution_id, authorization }),
      })
        .then((r) => r.json())
        .then((resp) => {
          console.log("[stream] agent widget exec update: ", resp)

          if (resp.success === false) return
          const terminal = ["FINISHED", "ABORTED", "FAILURE", "STOPPED", "CANCELLED", "CANCELED"]

          // The AI Agent action's structured decision/output data is nested
          // inside resp.results[].result (a JSON string) — it is NOT a
          // top-level field on the stream response.
          let agentData = {}
          if (Array.isArray(resp.results)) {
            const actionResult = resp.results.find((r) => r?.action?.app_name === "AI Agent") || resp.results[0]
            if (actionResult?.result) {
              try {
                agentData = typeof actionResult.result === "string" ? JSON.parse(actionResult.result) : actionResult.result
              } catch (e) {
                agentData = {}
              }
            }
          }

          const decisions = Array.isArray(agentData.decisions) ? agentData.decisions : (Array.isArray(resp.decisions) ? resp.decisions : [])

          let waitingQuestion = ""
          let waitingDecisionId = ""
          let waitingQuestionFieldIndex = 0
          // The overall execution status stays EXECUTING while a single decision
          // is paused waiting on an answer — the WAITING state lives on the
          // individual decision's run_details, not on `resp.status`.
          const askDecision = decisions.find((d) => d.run_details?.status === "WAITING" && (d.action === "ask" || d.category === "ask") && !answeredDecisionIdsRef.current.has(d.run_details?.id))
          if (askDecision) {
            const qFieldIndex = askDecision.fields?.findIndex((f) => f.key === "question")
            const qField = qFieldIndex >= 0 ? askDecision.fields[qFieldIndex] : undefined
            waitingQuestion = qField?.value || ""
            waitingDecisionId = askDecision.run_details?.id || ""
            // The backend matches answer keys by their field position
            // (e.g. "question_0"), not by name — must use the field's
            // actual index in the decision, not an assumed constant.
            waitingQuestionFieldIndex = qFieldIndex >= 0 ? qFieldIndex : 0
          }

          // Decision id to target when the user wants to continue the task
          // after it finished (a follow-up message on the same execution).
          const finishDecision = decisions.find((d) => d.action === "finish" || d.category === "finish" || d.action === "finalise" || d.category === "finalise")
          const finishDecisionId = finishDecision?.run_details?.id || ""

          const output = agentData.message || resp.output || ""

          setAgentWidgetExec((prev) => ({
            ...prev,
            status: resp.status,
            decisions,
            output,
            waitingQuestion,
            waitingDecisionId,
            waitingQuestionFieldIndex,
            finishDecisionId,
            // The AI Agent execution runs on its own backing workflow, which
            // can differ from the workflow currently open in the editor —
            // answer submission must target that workflow's ID, not workflow.id.
            agentExecWorkflowId: resp.workflow_id || prev?.agentExecWorkflowId,
          }))
          if (terminal.includes(resp.status)) stopAgentWidgetPoll()
        })
        .catch(() => {})
  }

  const pollAgentWidgetExec = (execution_id, authorization, isFreshStart) => {
    if (isFreshStart) {
      answeredDecisionIdsRef.current = new Set()
    }
    stopAgentWidgetPoll()
    fetchAgentExecUpdate(execution_id, authorization)
    agentWidgetPollRef.current = setInterval(() => {
      fetchAgentExecUpdate(execution_id, authorization)
    }, 3000)
  }

  const isAgentAction = (a) => a?.app_id === "shuffle_agent" || (a?.app_name || "").toLowerCase() === "ai agent"
  const trimmedOrNull = (s) => (typeof s === "string" && s.trim()) ? s.trim() : null

  const getRunPrompt = (run) => {
    const agentAction = (run?.workflow?.actions || []).find(isAgentAction)
    const inputParam = agentAction?.parameters?.find((p) => p?.name === "input")
    if (inputParam?.value) return inputParam.value

    const results = Array.isArray(run?.results) ? run.results : []
    const agentResult = results.find((r) => isAgentAction(r?.action)) || results[0]
    try {
      const data = typeof agentResult?.result === "string" ? JSON.parse(agentResult.result) : agentResult?.result
      const userMessage = (data?.input?.messages || []).find((m) => m?.role === "user")
      const prompt = trimmedOrNull(data?.original_input) || trimmedOrNull(userMessage?.content)
      if (prompt) return prompt
    } catch (e) { }

    return run?.workflow?.name || "Agent run"
  }

  const timeAgo = (ts) => {
    const t = Number(ts) || 0
    if (!t) return ""
    const diff = Math.max(0, Date.now() / 1000 - t)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const runStatusColor = (status) =>
    status === "FINISHED" ? "#4caf7d"
    : status === "EXECUTING" || status === "WAITING" ? accentColor
    : "#e57373"

  const loadHistoryRuns = () => {
    setHistoryLoading(true)
    fetch(`${globalUrl}/api/v1/workflows/search`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow_id: "AGENT", limit: 30 }),
    })
      .then((r) => r.json())
      .then((resp) => {
        setHistoryRuns(resp.success !== false && Array.isArray(resp.runs) ? resp.runs : [])
      })
      .catch(() => setHistoryRuns([]))
      .finally(() => setHistoryLoading(false))
  }

  const toggleHistory = () => {
    const opening = !historyOpen
    setHistoryOpen(opening)
    if (opening) loadHistoryRuns()
  }

  const resumeHistoryRun = (run) => {
    if (!run?.execution_id || !run?.authorization) return
    setHistoryOpen(false)
    setChatInput("")
    setAgentWidgetExec({
      execution_id: run.execution_id,
      authorization: run.authorization,
      status: run.status || "EXECUTING",
      decisions: [],
      prompt: getRunPrompt(run),
      node_id: "",
      output: "",
      waitingQuestion: "",
    })
    pollAgentWidgetExec(run.execution_id, run.authorization, true)
  }

  const submitAgentWidgetAnswer = (execution_id, authorization, decisionId, note, execWorkflowId) => {
    const params = new URLSearchParams({
      reference_execution: execution_id,
      authorization,
      answer: "true",
      note: JSON.stringify(note),
      agentic: "true",
      decision_id: decisionId,
    })

    answeredDecisionIdsRef.current.add(decisionId)
    setAgentWidgetExec((prev) => ({ ...prev, status: "EXECUTING", waitingQuestion: "", waitingDecisionId: "" }))

    // Must use the workflow ID the execution actually belongs to (not
    // necessarily the one open in the editor) — the backend rejects the
    // answer with "Bad workflow ID" otherwise.
    fetch(`${globalUrl}/api/v1/workflows/${execWorkflowId || workflow.id}/run?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((resp) => {
        if (resp.success === false) {
          toast.error(resp.reason || "Failed to submit answer.")
          return
        }
        pollAgentWidgetExec(execution_id, authorization)
      })
      .catch((err) => toast.error("Error: " + err))
  }

  const abortAgentWidgetExec = () => {
    if (!agentWidgetExec?.execution_id) return
    stopAgentWidgetPoll()

    fetch(`${globalUrl}/api/v1/workflows/${workflow.id}/executions/${agentWidgetExec.execution_id}/abort`, {
      method: "GET",
      credentials: "include",
    })
      .then(() => toast("Aborting run…"))
      .catch((err) => toast.error("Error: " + err))
      .finally(() => {
        setAgentWidgetExec((prev) => (prev ? { ...prev, status: "ABORTED", waitingQuestion: "", waitingDecisionId: "" } : prev))
      })
  }

  React.useEffect(() => {
    return () => stopAgentWidgetPoll()
  }, [])

  const submitChatInput = () => {
    const text = chatInput.trim()
    if (text.length < 2 || submitting || isRunning || isWaiting) return

    setSubmitting(true)
    setAgentWidgetExec(null)
    setHistoryOpen(false)

    saveWorkflow(workflow, undefined, undefined, undefined, true)

    fetch(`${globalUrl}/api/v1/agents/workflow-edit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
              jsonrpc: "2.0",
              method: "run",
              params: {
                input: {
                  text: text,
                  workflow_id: workflowId,
                }
              }
      }),
    })
      .then((r) => r.json())
      .then((resp) => {
        setSubmitting(false)
        if (resp.success === true && resp.execution_id && resp.authorization) {
          setChatInput("")
          setAgentWidgetExec({
            execution_id: resp.execution_id,
            authorization: resp.authorization,
            status: "EXECUTING",
            decisions: [],
            prompt: text,
            node_id: "",
            output: "",
            waitingQuestion: "",
          })
          pollAgentWidgetExec(resp.execution_id, resp.authorization, true)
        } else {
          toast.warn(resp.reason || "Agent request failed. Try again.")
        }
      })
      .catch((err) => {
        setSubmitting(false)
        toast.error("Error: " + err)
      })
  }

  const submitAnswer = (note, decisionId) => {
    const targetDecisionId = decisionId || agentWidgetExec?.waitingDecisionId
    if (!agentWidgetExec?.execution_id || !agentWidgetExec?.authorization || !targetDecisionId) return
    submitAgentWidgetAnswer(agentWidgetExec.execution_id, agentWidgetExec.authorization, targetDecisionId, note, agentWidgetExec.agentExecWorkflowId)
    setAnswerInput("")
    setContinuationInput("")
  }

  const borderColor = isFailed
    ? "1px solid rgba(255,80,80,0.35)"
    : isWaiting
    ? `1px solid ${accentColor}`
    : isRunning
    ? `1px solid ${accentColor}55`
    : "1px solid rgba(255,255,255,0.1)"

  return (
    <div style={{
      position: "absolute",
      left: `${widgetLeft}px`,
      transform: "translateX(-50%)",
      bottom: 90,
      zIndex: 20,
      width: 550,
      borderRadius: 12,
      border: borderColor,
      backgroundColor: bg,
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 18px 6px 18px", gap: 10 }}>
        {isRunning
          ? <CircularProgress size={18} style={{ color: accentColor, flexShrink: 0 }} />
          : <img src="/icons/workflow-page/shuffle_agent.png" alt="" style={{ width: 18, height: 18, opacity: 0.85, flexShrink: 0 }} onError={(e) => { e.target.style.display = "none" }} />
        }
        <Tooltip title={agentWidgetExec?.prompt || ""} placement="top" disableHoverListener={!agentWidgetExec?.prompt}>
          <Typography variant="body1" style={{ fontWeight: 500, flex: 1, color: textPrimary, fontSize: 15 }} noWrap>
            {agentWidgetExec?.prompt
              ? agentWidgetExec.prompt.substring(0, 70) + (agentWidgetExec.prompt.length > 70 ? "…" : "")
              : workflowName || "Workflow"}
          </Typography>
        </Tooltip>
        {hasExec && (isRunning || isWaiting) && (
          <Tooltip title="Abort run" placement="top">
            <IconButton size="small" style={{ padding: 6 }} onClick={abortAgentWidgetExec}>
              <StopIcon style={{ fontSize: 18, color: textSecondary }} />
            </IconButton>
          </Tooltip>
        )}
        {hasExec && (
          <Tooltip title="New task" placement="top">
            <IconButton size="small" style={{ padding: 6 }} onClick={() => { setAgentWidgetExec(null); setHistoryOpen(false) }}>
              <AddIcon style={{ fontSize: 18, color: textSecondary }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Previous agent chats" placement="top">
          <IconButton size="small" style={{ padding: 6 }} onClick={toggleHistory}>
            <FormatListBulletedIcon style={{ fontSize: 18, color: historyOpen ? accentColor : textSecondary }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open full agent view" placement="top">
          <IconButton size="small" style={{ padding: 6 }} onClick={() => window.open(agentsUrl, "_blank", "noopener,noreferrer")}>
            <OpenInNewIcon style={{ fontSize: 18, color: hasExec ? accentColor : textSecondary }} />
          </IconButton>
        </Tooltip>
      </div>

      <div style={{ padding: "2px 18px 12px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        {isRunning && <Chip label="Running" size="small" style={{ backgroundColor: `${accentColor}33`, color: accentColor, height: 22, fontSize: 11, fontWeight: 600 }} />}
        {isWaiting && <Chip label="Needs input" size="small" style={{ backgroundColor: `${accentColor}22`, color: accentColor, height: 22, fontSize: 11, fontWeight: 600, border: `1px solid ${accentColor}` }} />}
        {isFinished && <Chip label="Done" size="small" style={{ backgroundColor: "rgba(30,180,90,0.25)", color: "#4caf7d", height: 22, fontSize: 11, fontWeight: 600 }} />}
        {isFailed && <Chip label="Fail" size="small" style={{ backgroundColor: "rgba(180,30,30,0.85)", color: "#fff", height: 22, fontSize: 11, fontWeight: 600 }} />}
        <Typography variant="body2" style={{ color: textSecondary, fontSize: 12 }} noWrap>
          {isRunning
            ? `Agent is working… ${agentWidgetExec?.decisions?.length ? `(${agentWidgetExec.decisions.length} steps)` : ""}`
            : isWaiting ? "Agent needs your input"
            : isFinished ? "Completed"
            : isFailed ? "Failed"
            : "Ask me to build, edit, or run anything in this workflow"}
        </Typography>
      </div>

      {historyOpen && (
        <div style={{ margin: "0 14px 14px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)", maxHeight: 260, overflowY: "auto" }}>
          {historyLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
              <CircularProgress size={20} style={{ color: accentColor }} />
            </div>
          ) : historyRuns.length === 0 ? (
            <Typography variant="body2" style={{ color: textSecondary, fontSize: 13, padding: "16px 14px", textAlign: "center" }}>
              No previous agent chats found
            </Typography>
          ) : (
            historyRuns.map((run, index) => {
              const resumable = !!run?.authorization
              return (
                <div
                  key={run.execution_id || index}
                  onClick={() => resumeHistoryRun(run)}
                  onMouseEnter={(e) => { if (resumable) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    cursor: resumable ? "pointer" : "default",
                    opacity: resumable ? 1 : 0.45,
                    borderBottom: index < historyRuns.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: runStatusColor(run.status), flexShrink: 0 }} />
                  <Typography variant="body2" style={{ flex: 1, color: textPrimary, fontSize: 13 }} noWrap>
                    {getRunPrompt(run)}
                  </Typography>
                  <Typography variant="body2" style={{ color: textSecondary, fontSize: 11, flexShrink: 0 }}>
                    {timeAgo(run.started_at)}
                  </Typography>
                </div>
              )
            })
          )}
        </div>
      )}

      {isWaiting && (
        <div style={{ margin: "0 14px 14px 14px" }}>
          {agentWidgetExec?.waitingQuestion && (
            <div style={{ color: textSecondary, fontSize: 13, marginBottom: 10, padding: "10px 12px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, lineHeight: 1.5 }}>
              <Markdown remarkPlugins={[remarkGfm]}>{agentWidgetExec.waitingQuestion}</Markdown>
            </div>
          )}
          {agentWidgetExec?.waitingQuestion ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, borderRadius: 8, border: `1px solid ${accentColor}55`, backgroundColor: "rgba(255,255,255,0.04)", padding: "6px 6px 6px 12px" }}>
              <textarea
                placeholder="Type your answer…"
                value={answerInput}
                onChange={(e) => {
                  setAnswerInput(e.target.value)
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer({ [`question_${agentWidgetExec?.waitingQuestionFieldIndex || 0}`]: answerInput }) } }}
                rows={1}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: textPrimary, fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", padding: "6px 0" }}
              />
              <IconButton size="small" disabled={!answerInput.trim()} onClick={() => submitAnswer({ [`question_${agentWidgetExec?.waitingQuestionFieldIndex || 0}`]: answerInput })}>
                <SendIcon style={{ fontSize: 16, color: answerInput.trim() ? accentColor : "rgba(255,255,255,0.2)" }} />
              </IconButton>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Button fullWidth variant="contained" size="small" onClick={() => submitAnswer({ approve: "true" })} style={{ backgroundColor: accentColor, color: "#fff", fontSize: 13, borderRadius: 8 }}>
                Approve
              </Button>
              <Button fullWidth variant="outlined" size="small" onClick={() => submitAnswer({ approve: "false" })} style={{ color: textSecondary, borderColor: "rgba(255,255,255,0.2)", fontSize: 13, borderRadius: 8 }}>
                Deny
              </Button>
            </div>
          )}
        </div>
      )}

      {isFinished && agentWidgetExec?.output && (
        <div style={{ margin: "0 14px 10px 14px", padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, maxHeight: 110, overflowY: "auto", color: textSecondary, fontSize: 13, lineHeight: 1.6 }}>
          <Markdown remarkPlugins={[remarkGfm]}>{agentWidgetExec.output}</Markdown>
        </div>
      )}

      {isFinished && agentWidgetExec?.finishDecisionId && (
        <div style={{ margin: "0 14px 14px 14px", display: "flex", alignItems: "flex-end", gap: 6, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", padding: "6px 6px 6px 12px" }}>
          <textarea
            placeholder="Add more details to continue this task…"
            value={continuationInput}
            onChange={(e) => {
              setContinuationInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer({ continue: continuationInput }, agentWidgetExec.finishDecisionId) } }}
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: textPrimary, fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", padding: "6px 0" }}
          />
          <IconButton size="small" disabled={!continuationInput.trim()} onClick={() => submitAnswer({ continue: continuationInput }, agentWidgetExec.finishDecisionId)}>
            <SendIcon style={{ fontSize: 16, color: continuationInput.trim() ? accentColor : "rgba(255,255,255,0.2)" }} />
          </IconButton>
        </div>
      )}

      {!isRunning && !isWaiting && (
        <div style={{ margin: "0 14px 14px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", display: "flex", flexDirection: "column" }}>
          <textarea
            placeholder={agentWidgetExec?.finishDecisionId ? "Start a new task…" : "Type here..."}
            value={chatInput}
            disabled={submitting}
            onChange={(e) => {
              setChatInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 240) + "px"
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submitChatInput() }
            }}
            style={{ background: "transparent", border: "none", outline: "none", color: textPrimary, fontSize: 14, resize: "none", minHeight: 44, maxHeight: 240, overflowY: "auto", fontFamily: "inherit", lineHeight: 1.5 }}
            rows={2}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <Tooltip title="Send (Cmd/Ctrl + Enter)" placement="top">
              <span>
                <IconButton size="small" disabled={chatInput.trim().length < 2 || submitting} onClick={submitChatInput}>
                  {submitting
                    ? <CircularProgress size={18} style={{ color: accentColor }} />
                    : <SendIcon style={{ fontSize: 18, color: chatInput.trim().length >= 2 ? accentColor : "rgba(255,255,255,0.2)" }} />
                  }
                </IconButton>
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentChatWidget;
