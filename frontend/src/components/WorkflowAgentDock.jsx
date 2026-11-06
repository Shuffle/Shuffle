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

// The workflow editor's right dock: the agent chat, node config and run panels share one area at the right edge
// as tabs, one shown at a time, and the editor gives up that room instead of being covered.
// Mobile keeps the full-screen overlays.

const dockTabHeight = 40

// Dock layout state for the editor. The editor places its config and run panels with what this returns.
export const useWorkflowDock = ({ isMobile, agentOpen, configOpen, configKey, runOpen, onCloseRunPanel, cy }) => {
  const docked = !isMobile

  // On mobile the agent sidebar is an overlay, not a dock tab; it publishes its width as --ask-ai-panel-width
  const [agentSidebarWidth, setAgentSidebarWidth] = React.useState(0)
  React.useEffect(() => {
    const readWidth = () => setAgentSidebarWidth(parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ask-ai-panel-width")) || 0)
    // Dragging the sidebar changes its width every frame; re-render the editor once it settles
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

  // Clicking text in the agent sidebar doesn't move focus, so the keys typed after it target <body>,
  // not the sidebar. Remember where the last click was to tell those keys apart from canvas ones.
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

  // Tabs in the order they were opened, like editor tabs (kept up to date by the effect further down)
  const [openOrder, setOpenOrder] = React.useState([])
  const openNow = { agent: agentOpen, config: configOpen, run: runOpen }
  const dockTabs = [...openOrder, ...Object.keys(openNow)].filter((tab, index, all) => openNow[tab] && all.indexOf(tab) === index)
  const [dockTabChoice, setDockTab] = React.useState("")
  const dockTab = dockTabs.includes(dockTabChoice) ? dockTabChoice : dockTabs[dockTabs.length - 1]
  // The whole dock can be hidden like the left sidebar; its panels stay open (and mounted) behind it
  const [dockHidden, setDockHidden] = React.useState(false)
  const shownTab = docked && dockHidden ? "" : dockTab
  const configHidden = docked && shownTab !== "config"

  // One width for every tab, resized from the dock's own handle. Stored where the agent sidebar keeps its width,
  // so the sidebar opens at the same size on other pages.
  const [dockWidth, setDockWidth] = React.useState(() => {
    try {
      const stored = parseInt(localStorage.getItem("shuffle:ask_ai_panel_width"))
      if (stored >= 340 && stored <= 960) return stored
    } catch (e) {}
    return 440
  })
  // Re-rendering the editor on every mouse move is too slow, so a drag moves an outline and the width is set on release
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

  // A panel that opens, or a node selected while the config tab is behind another, comes to the front.
  // Nodes the agent shows from its chat don't, so the chat stays in view.
  const keepDockTabRef = React.useRef(false)
  const keepDockTab = () => {
    keepDockTabRef.current = true
    setTimeout(() => { keepDockTabRef.current = false }, 500)
  }
  const dockOpenedRef = React.useRef({})
  React.useEffect(() => {
    const now = { agent: agentOpen, config: configKey, run: runOpen }
    const before = dockOpenedRef.current
    // A newly opened tab goes last; selecting another node keeps the config tab where it is
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

  // The docked run panel has no backdrop to click away, so it gets Esc as well as its close button
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

// Tabs over the right dock: one per open panel, like editor tabs. Clicking shows it, the cross closes it.
// labels and onClose are keyed by tab: agent, config, run.
export const WorkflowDockTabs = ({ dock, theme, themeMode, labels, onClose }) => {
  const { docked, dockTabs, dockTab, setDockTab, dockHidden, setDockHidden, dockWidth, startDockResize, dockResizeOutlineRef } = dock
  if (!docked || dockTabs.length === 0) return null

  // The colour of the panel the toggle sits on: the agent chat's card, the run panel's background, else the editor surface
  const toggleColor = dockHidden ? theme.palette.surfaceColor
    : dockTab === "agent" ? theme.palette.platformColor
    : dockTab === "run" ? (themeMode === "dark" ? "black" : theme.palette.drawer.backgroundColor)
    : theme.palette.surfaceColor

  // Hide/show tab on the dock's left edge (the screen's edge while hidden), like the left sidebar's
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
          display: "flex", alignItems: "center", justifyContent: "center",
          "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
          "&:hover .dock-resize-grip": { opacity: 1, backgroundColor: theme.palette.primary.main },
        }}
      >
        <Box className="dock-resize-grip" sx={{ width: 3, height: 36, borderRadius: 1.5, backgroundColor: theme.palette.text.secondary, opacity: 0.35, transition: "opacity 0.15s ease" }} />
      </Box>
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
        backgroundColor: theme.palette.platformColor,
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
              backgroundColor: active ? theme.palette.surfaceColor : "transparent",
              // The active tab sits on the panel: an accent line on top, no line underneath
              borderBottom: active ? `1px solid ${theme.palette.surfaceColor}` : "none",
              boxShadow: active ? `inset 0 2px 0 ${theme.palette.primary.main}` : "none",
              transition: "background-color 0.15s ease, color 0.15s ease",
              "&:hover": { color: theme.palette.text.primary, backgroundColor: active ? theme.palette.surfaceColor : theme.palette.inputColor },
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

// The agent chat for the workflow open in the editor. Mounted for the whole visit, so a run is still followed
// (its edits shown, its presence kept) after the chat is closed. The chat itself mounts the first time it's opened.
export const WorkflowAgentSidebar = ({
  workflow, cy, dock, theme, open, onOpenChange, hidden,
  globalUrl, themeMode, isLoggedIn, userdata,
  isSaved, reloadWorkflow, saveWorkflow, onReverted, onOpenExecution,
  onPresenceRefresh, onStopped, track,
}) => {
  // Agent panel: show the agent's edits on the canvas
  const flashAgentNodes = (nodeIds) => {
    if (!cy || !nodeIds || nodeIds.length === 0) return
    for (const nodeId of nodeIds) {
      const node = cy.getElementById(nodeId)
      if (!node || node.length === 0) continue
      node.style({ "border-width": "6px", "border-color": "#9c5af2", "border-opacity": "1" })
      setTimeout(() => {
        if (node.removed()) return
        node.removeStyle("border-width border-color border-opacity")
        // removeStyle also drops the red border of a node with validation errors, so put it back
        if (node.data("is_valid") === false) {
          node.style({ "border-width": "2px", "border-opacity": ".9", "border-color": red })
        }
      }, 2500)
    }
  }

  // Nodes the agent changed that the canvas hasn't shown yet
  const agentPendingNodeIdsRef = React.useRef([])
  const reloadAgentChanges = () => {
    const nodeIds = agentPendingNodeIdsRef.current
    agentPendingNodeIdsRef.current = []
    reloadWorkflow()
    setTimeout(() => flashAgentNodes(nodeIds), 1500)
  }

  const handleAgentWorkflowChanged = (nodeIds, reverted) => {
    if (reverted) {
      agentPendingNodeIdsRef.current = []
      reloadWorkflow()
      onReverted()
      return
    }

    // Each edit shows as it lands, from the saved workflow. The multiplayer stream can't be relied on for
    // this: while nobody else is on the workflow it only connects after its next presence check.
    // Unsaved edits of the user's own are never drawn over; those wait for the run to settle.
    agentPendingNodeIdsRef.current = [...agentPendingNodeIdsRef.current, ...nodeIds]
    if (isSaved()) {
      reloadAgentChanges()
    }
  }

  const [agentRunning, setAgentRunning] = React.useState(false)
  const agentWaitingRef = React.useRef(false)
  const handleAgentRunStatus = ({ executionId, status, previousStatus, running, waiting }) => {
    setAgentRunning(running)
    const startedWaiting = waiting && !agentWaitingRef.current
    agentWaitingRef.current = waiting

    // Only a change seen live counts. Opening an old run must not report it again.
    const wasActive = !!previousStatus && !agentTerminalStatuses.includes(previousStatus)
    if (!wasActive) return

    // Settled: finished, or paused on a question the user may want to answer looking at the canvas
    if ((agentTerminalStatuses.includes(status) || startedWaiting) && agentPendingNodeIdsRef.current.length > 0) {
      if (isSaved()) {
        reloadAgentChanges()
      } else {
        agentPendingNodeIdsRef.current = []
        toast("The agent changed this workflow. Save or discard your own changes, then reload to see its changes.")
      }
    }

    // Same events and fields as the old agent widget, so the funnel data stays comparable
    if (status === "FINISHED") {
      track("agent_finished", executionId)
    } else if (status === "ABORTED") {
      track("agent_aborted", executionId)
    } else if (agentTerminalStatuses.includes(status)) {
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

  // Stable props for the memoized agent sidebar, so editor re-renders don't re-render the whole agent tree.
  // The agent works on the saved workflow, so unsaved edits are saved before it starts.
  const agentCallbacksRef = React.useRef({})
  agentCallbacksRef.current = { track, beforeRun: saveWorkflow, runStatus: handleAgentRunStatus }
  const agentUIProps = React.useMemo(() => ({
    workflowId: workflow?.id,
    initialView: "chat",
    // The editor's own ?execution_id belongs to workflow runs, not agent runs
    readUrlParams: false,
    apiBaseUrl: globalUrl,
    // A run that never started is its own event: agent_failed stays "a started run failed"
    onRun: ({ success, executionId, error }) => agentCallbacksRef.current.track(success ? "agent_started" : "agent_start_failed", executionId || "", error ? { reason: error } : {}),
    onBeforeRun: () => agentCallbacksRef.current.beforeRun(),
    onRunStatusChange: (info) => agentCallbacksRef.current.runStatus(info),
    renderToolDrawer: (p) => <AppSearchDrawer {...p} />,
    renderAppDetailDrawer: (p) => <AppDetailDrawer {...p} />,
  }), [workflow?.id, globalUrl])

  // Latest handlers, so the listeners below subscribe once per workflow
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

  // The agent shows as present to other editors while it runs (or waits for an answer),
  // whether or not its sidebar is open
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

  // The chat mounts the first time it's opened, then stays for the rest of the visit
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
      // A run keeps being followed after the sidebar is closed, so its presence and reload still happen.
      // Behind another dock tab the chat stays mounted too, so switching back keeps it as it was.
      keepMounted={agentRunning || open}
      width={dockWidth}
      // A dock tab: the dock sizes it, draws its edge and switches tabs without animating
      docked={docked}
      sx={docked ? { top: dockTabHeight, height: "auto", borderLeft: theme.palette.defaultBorder } : undefined}
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
