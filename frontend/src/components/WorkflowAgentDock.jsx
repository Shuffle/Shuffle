import React from "react"
import { Box, IconButton, Tooltip } from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
  Close as CloseIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
} from "@mui/icons-material"
import { toast } from "react-toastify"
import { AskAiWidget, AGENT_WORKFLOW_CHANGED_EVENT, AGENT_FOCUS_NODE_EVENT, AGENT_OPEN_EXECUTION_EVENT } from "@shuffleio/shuffle-mcps"
import { AppSearchDrawer, AppDetailDrawer } from "@shuffleio/shuffle-core"
import { red } from "../utils/workflowHelpers.js"

// Right dock of the workflow editor: agent chat, node config and run panels as tabs. Mobile keeps overlays.

const dockTabHeight = 40

export const useWorkflowDock = ({ isMobile, agentOpen, configOpen, configKey, runOpen, onCloseRunPanel, cy }) => {
  const docked = !isMobile && agentOpen

  // Agent sidebar width on mobile, published as --ask-ai-panel-width; read once a drag settles
  const [agentSidebarWidth, setAgentSidebarWidth] = React.useState(0)
  React.useEffect(() => {
    const readWidth = () => setAgentSidebarWidth(parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ask-ai-panel-width")) || 0)
    let timer
    const observer = new MutationObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(readWidth, 100)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] })
    readWidth()
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  // Keys typed after clicking chat text target <body>, so remember if the last click was in the chat
  const lastPointerInAgentPanelRef = React.useRef(false)
  React.useEffect(() => {
    const onPointerDown = (event) => {
      lastPointerInAgentPanelRef.current = !!event.target?.closest?.("[data-ask-ai-panel]")
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [])
  const isAgentPanelKey = (event) => {
    const target = event.target
    if (target?.closest?.("[data-ask-ai-panel]")) return true
    return lastPointerInAgentPanelRef.current && (!target || target === document.body || target === document.documentElement)
  }

  // Tabs in the order they were opened
  const [openOrder, setOpenOrder] = React.useState([])
  const openNow = { agent: agentOpen, config: configOpen, run: runOpen }
  const dockTabs = [...openOrder, ...Object.keys(openNow)].filter((tab, index, all) => openNow[tab] && all.indexOf(tab) === index)
  const [dockTabChoice, setDockTab] = React.useState("")
  const dockTab = dockTabs.includes(dockTabChoice) ? dockTabChoice : dockTabs[dockTabs.length - 1]
  const [dockHidden, setDockHidden] = React.useState(false)
  const shownTab = docked && dockHidden ? "" : dockTab
  const configHidden = docked && shownTab !== "config"

  // One width for all tabs, shared with the agent sidebar's stored width
  const [dockWidth, setDockWidth] = React.useState(() => {
    try {
      const stored = parseInt(localStorage.getItem("shuffle:ask_ai_panel_width"))
      if (stored >= 340 && stored <= 960) return stored
    } catch (e) {}
    return 420
  })
  // Drag moves an outline; the width is set on release to avoid re-rendering the editor per mouse move
  const dockResizeOutlineRef = React.useRef(null)
  const startDockResize = (event) => {
    event.preventDefault()
    const outline = dockResizeOutlineRef.current
    if (!outline) return
    const max = Math.min(960, window.innerWidth - 40)
    const widthAt = (x) => Math.round(Math.max(340, Math.min(max, window.innerWidth - x)))
    outline.style.width = `${dockWidth}px`
    outline.style.display = "block"
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    const onMove = (moveEvent) => {
      outline.style.width = `${widthAt(moveEvent.clientX)}px`
    }
    const onUp = (upEvent) => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      outline.style.display = "none"
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      const width = widthAt(upEvent.clientX)
      setDockWidth(width)
      try {
        localStorage.setItem("shuffle:ask_ai_panel_width", String(width))
      } catch (e) {}
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }
  const rightPanelsWidth = docked ? (shownTab ? dockWidth : 0) : agentSidebarWidth

  // Newly opened panels come to the front, except nodes the agent focuses from its chat
  const keepDockTabRef = React.useRef(false)
  const keepDockTab = () => {
    keepDockTabRef.current = true
    setTimeout(() => { keepDockTabRef.current = false }, 500)
  }
  const dockOpenedRef = React.useRef({})
  React.useEffect(() => {
    const now = { agent: agentOpen, config: configKey, run: runOpen }
    const before = dockOpenedRef.current
    setOpenOrder((order) => [...order.filter((tab) => now[tab]), ...Object.keys(now).filter((tab) => now[tab] && !before[tab])])
    const opened = Object.keys(now).find((tab) => now[tab] && now[tab] !== before[tab])
    dockOpenedRef.current = now
    if (!opened || (opened === "config" && keepDockTabRef.current)) return
    setDockTab(opened)
    setDockHidden(false)
  }, [agentOpen, configKey, runOpen])

  React.useEffect(() => {
    if (!cy) return
    const timer = setTimeout(() => cy.resize(), 350)
    return () => clearTimeout(timer)
  }, [rightPanelsWidth, cy])

  // Esc closes the docked run panel, which has no backdrop
  const closeRunPanelRef = React.useRef(onCloseRunPanel)
  closeRunPanelRef.current = onCloseRunPanel
  React.useEffect(() => {
    if (!docked || !runOpen || shownTab !== "run") return
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isAgentPanelKey(event)) closeRunPanelRef.current()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [docked, runOpen, shownTab])

  return {
    docked, dockTabHeight, dockTabs, dockTab, setDockTab, dockHidden, setDockHidden, shownTab, configHidden,
    dockWidth, rightPanelsWidth, startDockResize, dockResizeOutlineRef, keepDockTab, isAgentPanelKey,
  }
}

// Tab bar over the dock. labels and onClose are keyed by tab: agent, config, run.
export const WorkflowDockTabs = ({ dock, theme, labels, onClose }) => {
  const { docked, dockTabs, dockTab, setDockTab, dockHidden, setDockHidden, dockWidth, startDockResize, dockResizeOutlineRef } = dock
  if (!docked || dockTabs.length === 0) return null

  // Background of the panel that's shown, so the tabs and toggle blend into it
  const panelColor = dockTab === "run" ? theme.palette.drawer.backgroundColor : theme.palette.platformColor
  const toggleColor = dockHidden ? theme.palette.surfaceColor : panelColor

  const dockToggle = (
    <Tooltip title={dockHidden ? "Show side panel" : "Hide side panel"} placement="left">
      <Box
        role="button"
        tabIndex={0}
        aria-label={dockHidden ? "Show side panel" : "Hide side panel"}
        aria-expanded={!dockHidden}
        onClick={() => setDockHidden(!dockHidden)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setDockHidden(!dockHidden)
          }
        }}
        sx={{
          position: "fixed", top: "50%", transform: "translateY(-50%)", right: dockHidden ? 0 : dockWidth, zIndex: 1303,
          width: dockHidden ? 32 : 24, height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          backgroundColor: toggleColor,
          border: theme.palette.defaultBorder,
          borderRight: "none",
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          transition: "background-color 0.15s ease",
          "&:hover": { backgroundColor: theme.palette.inputColor },
        }}
      >
        {dockHidden ?
          <ArrowLeftIcon fontSize="small" style={{ color: theme.palette.text.primary }} /> :
          <ArrowRightIcon fontSize="small" style={{ color: theme.palette.text.primary }} />
        }
      </Box>
    </Tooltip>
  )
  if (dockHidden) return dockToggle

  return (
    <>
    {dockToggle}
    <Box
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize side panel"
        onMouseDown={startDockResize}
        sx={{
          position: "fixed", top: 0, bottom: 0, right: dockWidth - 7, width: 14, zIndex: 1302, cursor: "col-resize",
          "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
        }}
      />
    <Box
      ref={dockResizeOutlineRef}
      sx={{
        display: "none", position: "fixed", top: 0, bottom: 0, right: 0, zIndex: 1302, pointerEvents: "none",
        borderLeft: `2px solid ${theme.palette.primary.main}`, backgroundColor: alpha(theme.palette.primary.main, 0.08),
      }}
    />
    <Box
      role="tablist"
      aria-label="Side panels"
      sx={{
        position: "fixed", top: 0, right: 0, width: dockWidth, height: dockTabHeight, zIndex: 1301,
        display: "flex", alignItems: "stretch", boxSizing: "border-box", overflowX: "auto", scrollbarWidth: "none",
        backgroundColor: panelColor,
        borderLeft: theme.palette.defaultBorder,
        borderBottom: theme.palette.defaultBorder,
      }}
    >
      {dockTabs.map((tab) => {
        const active = tab === dockTab
        return (
          <Box
            key={tab}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            title={labels[tab]}
            onClick={() => setDockTab(tab)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setDockTab(tab)
              }
            }}
            sx={{
              position: "relative", display: "flex", alignItems: "center", gap: 0.5, minWidth: 0, maxWidth: 200,
              pl: 1.75, pr: 0.75, mb: "-1px", cursor: "pointer", userSelect: "none", fontSize: 13,
              borderRight: theme.palette.defaultBorder,
              color: active ? theme.palette.text.primary : theme.palette.text.secondary,
              backgroundColor: active ? panelColor : "transparent",
              borderBottom: active ? `1px solid ${panelColor}` : "none",
              boxShadow: active ? `inset 0 2px 0 ${theme.palette.primary.main}` : "none",
              transition: "background-color 0.15s ease, color 0.15s ease",
              "&:hover": { color: theme.palette.text.primary, backgroundColor: active ? panelColor : theme.palette.inputColor },
              "&:hover .dock-tab-close, &:focus-within .dock-tab-close": { opacity: 1 },
              "&:focus-visible": { outline: `1px solid ${theme.palette.primary.main}`, outlineOffset: -1 },
            }}
          >
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: active ? 500 : 400 }}>
              {labels[tab]}
            </Box>
            <IconButton
              className="dock-tab-close"
              size="small"
              aria-label={`Close ${labels[tab]}`}
              onClick={(event) => {
                event.stopPropagation()
                onClose[tab]()
              }}
              sx={{ p: 0.25, ml: 0.25, color: "inherit", opacity: active ? 0.8 : 0, transition: "opacity 0.15s ease" }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )
      })}
    </Box>
    </>
  )
}

const agentTerminalStatuses = ["FINISHED", "FAILURE", "ABORTED", "CANCELLED"]

// Agent chat for the open workflow. Stays mounted for the visit so a run is followed after the chat closes.
export const WorkflowAgentSidebar = ({
  workflow, cy, dock, theme, open, onOpenChange, hidden,
  globalUrl, themeMode, isLoggedIn, userdata,
  markSaved, isStreamLive, reloadWorkflow, saveWorkflow, onReverted, onOpenExecution,
  onPresenceRefresh, onStopped, track,
}) => {
  const flashAgentNodes = (nodeIds) => {
    if (!cy || !nodeIds || nodeIds.length === 0) return
    for (const nodeId of nodeIds) {
      const node = cy.getElementById(nodeId)
      if (!node || node.length === 0) continue
      node.style({ "border-width": "6px", "border-color": "#9c5af2", "border-opacity": "1" })
      setTimeout(() => {
        if (node.removed()) return
        node.removeStyle("border-width border-color border-opacity")
        // Restore the red border of invalid nodes, which removeStyle drops
        if (node.data("is_valid") === false) {
          node.style({ "border-width": "2px", "border-opacity": ".9", "border-color": red })
        }
      }, 2500)
    }
  }

  // Agent edits not on the canvas yet. They're a draft until the agent saves, so only redraw once
  // the saved workflow is newer than the canvas. A finished run clears them either way.
  const agentPendingNodeIdsRef = React.useRef([])
  const reloadAgentChanges = (finished) => {
    reloadWorkflow((saved) => {
      const newer = saved.edited > (workflow?.edited || 0)
      if (newer || finished) {
        const nodeIds = agentPendingNodeIdsRef.current
        agentPendingNodeIdsRef.current = []
        if (newer) {
          markSaved()
          setTimeout(() => flashAgentNodes(nodeIds), 1500)
        }
      }
      return newer
    })
  }

  const handleAgentWorkflowChanged = (nodeIds, reverted) => {
    if (reverted) {
      agentPendingNodeIdsRef.current = []
      reloadWorkflow()
      onReverted()
      return
    }

    if (isStreamLive()) {
      flashAgentNodes(nodeIds)
      return
    }

    agentPendingNodeIdsRef.current = [...agentPendingNodeIdsRef.current, ...nodeIds]
  }

  const [agentRunning, setAgentRunning] = React.useState(false)
  const agentWaitingRef = React.useRef(false)
  const agentNoticeRef = React.useRef("")
  const handleAgentRunStatus = ({ executionId, status, previousStatus, running, waiting }) => {
    setAgentRunning(running)
    if (running && executionId && executionId !== agentNoticeRef.current && !isStreamLive()) {
      agentNoticeRef.current = executionId
      toast.info("The agent is working on this workflow. Please don't edit until it's done.")
    }
    const startedWaiting = waiting && !agentWaitingRef.current
    agentWaitingRef.current = waiting

    // Ignore old runs being opened; only live changes count
    const wasActive = !!previousStatus && !agentTerminalStatuses.includes(previousStatus)
    if (!wasActive) return

    const finished = agentTerminalStatuses.includes(status)
    if (finished) agentNoticeRef.current = ""
    if ((finished || startedWaiting) && agentPendingNodeIdsRef.current.length > 0) {
      reloadAgentChanges(finished)
    }

    if (status === "FINISHED") {
      track("agent_finished", executionId)
    } else if (status === "ABORTED") {
      track("agent_aborted", executionId)
    } else if (finished) {
      track("agent_failed", executionId, { status })
    }
  }

  const focusAgentNode = (nodeId) => {
    const node = cy ? cy.getElementById(nodeId) : null
    if (!node || node.length === 0) {
      toast("That node isn't in the workflow anymore")
      return
    }
    dock.keepDockTab()
    cy.elements().unselect()
    node.select()
    cy.animate({ center: { eles: node }, duration: 300 })
  }

  // Stable props so editor re-renders don't re-render the agent tree. Unsaved edits are saved before a run.
  const agentCallbacksRef = React.useRef({})
  agentCallbacksRef.current = { track, beforeRun: saveWorkflow, runStatus: handleAgentRunStatus }
  const agentUIProps = React.useMemo(() => ({
    workflowId: workflow?.id,
    initialView: "chat",
    // ?execution_id in the editor URL is for workflow runs, not agent runs
    readUrlParams: false,
    apiBaseUrl: globalUrl,
    onRun: ({ success, executionId, error }) => agentCallbacksRef.current.track(success ? "agent_started" : "agent_start_failed", executionId || "", error ? { reason: error } : {}),
    onBeforeRun: () => agentCallbacksRef.current.beforeRun(),
    onRunStatusChange: (info) => agentCallbacksRef.current.runStatus(info),
    renderToolDrawer: (p) => <AppSearchDrawer {...p} />,
    renderAppDetailDrawer: (p) => <AppDetailDrawer {...p} />,
  }), [workflow?.id, globalUrl])

  // Latest handlers via ref, so listeners subscribe once per workflow
  const agentEventHandlersRef = React.useRef({})
  agentEventHandlersRef.current = { changed: handleAgentWorkflowChanged, focus: focusAgentNode, openExecution: onOpenExecution }
  React.useEffect(() => {
    if (!workflow?.id) return
    const onChanged = (event) => {
      if (event.detail?.workflowId !== workflow.id) return
      agentEventHandlersRef.current.changed(event.detail.nodeIds || [], event.detail.reverted)
    }
    const onFocus = (event) => {
      if (event.detail?.workflowId === workflow.id) agentEventHandlersRef.current.focus(event.detail.nodeId)
    }
    const onOpenExecution = (event) => {
      if (event.detail?.workflowId === workflow.id && event.detail.executionId) agentEventHandlersRef.current.openExecution(event.detail.executionId, event.detail.authorization)
    }
    window.addEventListener(AGENT_WORKFLOW_CHANGED_EVENT, onChanged)
    window.addEventListener(AGENT_FOCUS_NODE_EVENT, onFocus)
    window.addEventListener(AGENT_OPEN_EXECUTION_EVENT, onOpenExecution)
    return () => {
      window.removeEventListener(AGENT_WORKFLOW_CHANGED_EVENT, onChanged)
      window.removeEventListener(AGENT_FOCUS_NODE_EVENT, onFocus)
      window.removeEventListener(AGENT_OPEN_EXECUTION_EVENT, onOpenExecution)
    }
  }, [workflow?.id])

  // Show the agent as present to other editors while it runs
  const agentPresenceRef = React.useRef({})
  agentPresenceRef.current = { refresh: onPresenceRefresh, stop: onStopped }
  React.useEffect(() => {
    if (!agentRunning) return
    agentPresenceRef.current.refresh()
    const timer = setInterval(() => agentPresenceRef.current.refresh(), 25000)
    return () => {
      clearInterval(timer)
      agentPresenceRef.current.stop()
    }
  }, [agentRunning])

  // Mount the chat on first open, then keep it
  const [agentSidebarOpened, setAgentSidebarOpened] = React.useState(false)
  React.useEffect(() => {
    if (open) setAgentSidebarOpened(true)
  }, [open])

  if (hidden || !agentSidebarOpened || !workflow?.id || workflow.public === true) return null

  const { docked, shownTab, dockWidth } = dock
  return (
    <AskAiWidget
      open={open && (!docked || shownTab === "agent")}
      onOpenChange={onOpenChange}
      // Stay mounted while a run is followed or behind another tab
      keepMounted={agentRunning || open}
      width={dockWidth}
      docked={docked}
      sx={docked ? { top: dockTabHeight, height: "auto", borderLeft: theme.palette.defaultBorder, '& [aria-label="Resize Ask Shuffle panel"]': { display: "none" } } : undefined}
      hideButton
      requireSupport={false}
      globalUrl={globalUrl}
      theme={themeMode}
      isLoggedIn={isLoggedIn}
      userdata={userdata}
      isSupport={userdata?.support === true}
      agentUIProps={agentUIProps}
    />
  )
}
