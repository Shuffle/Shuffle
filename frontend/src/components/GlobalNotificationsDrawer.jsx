import React, { useEffect, useState } from "react";
import {
  NotificationsDrawer,
  NOTIFICATIONS_OPEN_EVENT,
} from "@shuffleio/shuffle-core";

const GlobalNotificationsDrawer = ({ themeMode, onNotificationsUpdated }) => {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState({});

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      setContext({
        executionId: detail.executionId ? String(detail.executionId) : undefined,
        workflowId: detail.workflowId ? String(detail.workflowId) : undefined,
      });
      setOpen(true);
    };

    window.addEventListener(NOTIFICATIONS_OPEN_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATIONS_OPEN_EVENT, handler);
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (onNotificationsUpdated) {
      onNotificationsUpdated();
    }
  };

  return (
    <NotificationsDrawer
      open={open}
      onClose={handleClose}
      executionId={context.executionId}
      workflowId={context.workflowId}
      theme={themeMode === "light" ? "light" : "dark"}
    />
  );
};

export default GlobalNotificationsDrawer;
