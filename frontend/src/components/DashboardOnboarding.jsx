import React from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  styled,
} from "@mui/material";

import theme from "../theme.jsx";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';

// Simple icon placeholders; replace with proper assets if desired
const StepIcon = styled("div")(({ completed }) => ({
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 14,
  color: completed ? "#0C111D" : "#ffffff",
  background: completed ? "#43D17C" : "#2F2F2F",
  border: completed ? "1px solid #43D17C" : "1px solid rgba(255,255,255,0.15)",
  flexShrink: 0,
}));

// Single continuous rail will be drawn once for the entire steps list

const StepCard = styled(Box)(({ completed, flash }) => ({
  display: "flex",
  gap: "14px",
  minHeight: 60,
  backgroundColor: "#212121",
  border: `1px solid ${flash ? "#f87171" : completed ? "#43D17C" : "rgba(255, 255, 255, 0.1)"}`,
  borderRadius: "12px",
  padding: "16px",
  width: "100%",
  flex: 1,
  minWidth: 0,
}));

const PrimaryButton = styled(Button)({
  background: "linear-gradient(90deg, #FF8544 0%, #FB47A0 100%)",
  color: "#fff",
  borderRadius: 6,
  textTransform: "none",
  fontWeight: 600,
  fontSize: 14,
  padding: "8px 20px",
  "&:hover": {
    opacity: 0.95,
    background: "linear-gradient(90deg, #FF8544 0%, #FB47A0 100%)",
  },
});

const SecondaryButton = styled(Button)({
  color: "#FF8544",
  borderRadius: 6,
  textTransform: "none",
  fontWeight: 600,
  fontSize: 14,
  padding: "8px 12px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  "&.Mui-disabled": {
    color: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
});


const StepItem = React.forwardRef(({ step, iconRef }, ref) => (
  <Box ref={ref} sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
    <Box ref={iconRef} sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 28, zIndex: 1, mt: 1.5 }}>
      <StepIcon completed={step.completed}>{step.index}</StepIcon>
    </Box>

    <StepCard completed={step.completed} flash={Array.isArray(step.flashKeys) && step.flashKeys.includes(step.key)}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 1, width: "100%" }}>
        <Stack direction="column" spacing={1} sx={{ width: "70%" }}>
        <Typography
          sx={{
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 16,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          {step.title}
        </Typography>
        {step.description && (
          <Typography
            sx={{
              color: "#c5c5c5",
              fontSize: 12,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            {step.description}
          </Typography>
        )}
        </Stack>

        <Stack direction="row" spacing={1}>
          {step.secondaryCta && (
            <SecondaryButton onClick={step.secondaryCta.onClick}>
              {step.secondaryCta.label}
            </SecondaryButton>
          )}
            {step.primaryCta && (
            <PrimaryButton onClick={step.primaryCta.onClick}>
              {step.primaryCta.label}
            </PrimaryButton>
          )}
        </Stack>
      </Box>
    </StepCard>
  </Box>
));

const DashboardOnboarding = ({
  open,
  onClose,
  headerTitle = "Get started with your Dashboard",
  headerSubtitle = "Follow these steps to unlock insights.",
  footer,
  globalUrl,
  onExplore,
  setOnboardingOpen,
  isProdStatusOn,
  isCloud,
}) => {
  // Internal completion state only; handlers are defined separately
  const [completed, setCompleted] = React.useState({
    docs: false,
    apps: false,
    workflow: false,
    wait: false,
    invite: false,
  });
  const [checkingApps, setCheckingApps] = React.useState(false);
  const [checkingWait, setCheckingWait] = React.useState(false);
  const [flashKeys, setFlashKeys] = React.useState([]);
  const [waitProgress, setWaitProgress] = React.useState(0);
  const navigate = useNavigate();

  // Load persisted completion state
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard_onboarding_completed");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        setCompleted((prev) => ({ ...prev, ...data }));
      }
    } catch {}
  }, []);

  // Persist completion state
  React.useEffect(() => {
    try {
      localStorage.setItem("dashboard_onboarding_completed", JSON.stringify(completed));
    } catch {}
  }, [completed]);

  // Handlers
  const handleDocsClick = React.useCallback(() => {
    window.open('/docs', '_blank');
    setCompleted((prev) => ({ ...prev, docs: true }));
  }, []);

  const handleDiscoverApps = React.useCallback(() => {
    window.open('/apps?tab=discover_apps', '_blank');
  }, []);

  const handleCheckAppsStatus = React.useCallback(async () => {
    if (checkingApps) return;
    setCheckingApps(true);
    try {
      const resp = await fetch(`${globalUrl}/api/v1/apps`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
      });

      if (resp.status !== 200) return;

      const data = await resp.json();
      let count = 0;
      if (Array.isArray(data)) {
        count = data.length;
      } else if (data && typeof data === 'object') {
        count = Object.keys(data).length;
      }

      if (count >= 3) {
        setCompleted((prev) => ({ ...prev, apps: true }));
      }
    } catch (_) {
      // ignore
    } finally {
      setCheckingApps(false);
    }
  }, [checkingApps]);

  const handleOpenWorkflow = React.useCallback(() => {
    window.open('/workflows/b658f2a0-7316-40d9-97ed-350a54fe3adc', '_blank');
    setCompleted((prev) => ({ ...prev, workflow: true }));
  }, []);

  const handleWaitCheck = React.useCallback(async () => {
    if (checkingWait) return;
    setCheckingWait(true);

    try {
      const days = 5;
      const url = `${globalUrl}/api/v1/stats/workflow_executions_finished?days=${days}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
      });
      if (resp.status !== 200) return;
      const data = await resp.json();
      const entries = Array.isArray(data?.entries) ? data.entries : [];

      const now = new Date();
      let successDays = 0;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const d = new Date(e?.Date || e?.date || e?.time || e?.timestamp);
        const diffDays = Math.floor((now - d) / (24 * 60 * 60 * 1000));
        const value = Number(e?.Value ?? e?.value ?? 0);
        if (!isNaN(diffDays) && diffDays <= 4 && value > 0) {
          successDays += 1;
        }
      }

        const simulated = Math.min(5, successDays);
        if (simulated < 5) {
          setWaitProgress(simulated);
          setFlashKeys(["wait"]);
          setTimeout(() => setFlashKeys([]), 800);
          setCheckingWait(false);
        } else {
          setCompleted((prev) => ({ ...prev, wait: true }));
          setCheckingWait(false);
        }
    } catch (_) {
      // ignore
    } finally {
      setCheckingWait(false);
    }
    setCheckingWait(false);
    }, [checkingWait, globalUrl]);

  const handleOpenUsers = React.useCallback(() => {
    window.open('/admin?tab=users', '_blank');
    setCompleted((prev) => ({ ...prev, invite: true }));
  }, []);


  const steps = [
    {
      index: 1,
      key: 'docs',
      title: 'Read our docs to understand Shuffle',
      description: 'Explore the basics of Shuffle in our documentation. It will help you understand the platform and how to use it.',
      primaryCta: { label: 'Read docs', onClick: handleDocsClick },
      completed: completed.docs,
    },
    {
      index: 2,
      key: 'apps',
      title: 'Activate at least 3 apps',
      description: 'Go to Discover Apps and enable your first three integrations.',
      primaryCta: { label: 'Discover apps', onClick: handleDiscoverApps },
      secondaryCta: { label: checkingApps ? 'Checking…' : 'Check status', onClick: handleCheckAppsStatus, disabled: checkingApps },
      completed: completed.apps,
    },
    {
      index: 3,
      key: 'workflow',
      title: 'Save a public workflow and start its scheduler',
      description: 'Open the public workflow, save it to your org, and start a daily scheduler.',
      primaryCta: { label: 'Open public workflow', onClick: handleOpenWorkflow },
      completed: completed.workflow,
    },
    {
      index: 4,
      key: 'wait',
      title: `Wait for 5 days of runs${completed.wait ? '' : waitProgress > 0 ? ` (${waitProgress}/5)` : ''}`,
      description: 'We will show daily stats after 5 runs. Come back to check again.',
      primaryCta: { label: checkingWait ? 'Checking…' : 'Check status', onClick: handleWaitCheck, disabled: checkingWait },
      completed: completed.wait,
    },
    {
      index: 5,
      key: 'invite',
      title: 'Invite your team members',
      description: 'Add teammates to collaborate in your org.',
      primaryCta: { label: 'Open users page', onClick: handleOpenUsers },
      completed: completed.invite,
    },
  ];

  const mandatoryKeys = ['docs', 'apps', 'workflow', 'wait'];
  const handleFinalDone = React.useCallback(() => {
    const missing = mandatoryKeys.filter((k) => !completed[k]);
    if (missing.length === 0) {
      try { localStorage.setItem("dashboard_onboarding_complete", "true"); } catch {}
      if (typeof onExplore === 'function') {
        try { onExplore(); } catch {}
      }
      if (onClose) onClose();
      return;
    }

    setFlashKeys(missing);
    setTimeout(() => setFlashKeys([]), 800);
  }, [completed, onClose, onExplore]);

  if (!open) return null;

  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 2000, }}>
      {/* Blur overlay with visible background */}
      <Box
        onClick={onClose}
        sx={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(6px)",
          background: "rgba(0,0,0,0.05)",
        }}
      />

      {/* Modal container */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2001,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 780,
            backgroundColor: "#1A1A1A",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            p: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",

		  	position: "relative", 
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box>
              <Typography
                sx={{
                  color: "#f1f1f1",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "-0.2px",
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {headerTitle}
              </Typography>
              <Typography
                sx={{
                  color: "#c5c5c5",
                  mt: 0.5,
                  fontSize: 14,
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {headerSubtitle}
              </Typography>
            </Box>

			{!isCloud ? (
			  <div
			   	style={{
				  display: "flex",
				  alignItems: "center",
				  gap: 20,
				  padding: "4px 10px",
				  marginLeft: "5px",
				  marginRight: "5px",
				  borderRadius: 20,
				  marginBottom: "14px",
				  background: isProdStatusOn
					? "rgba(43, 192, 126, 0.1)"
					: "rgba(255, 82, 82, 0.1)",
					cursor: "pointer",

				  position: "absolute",
				  top: 20,
				  right: 20, 
				}}
				onClick={() => {
					navigate("/admin?admin_tab=billingstats")
				}}
			  >
				<span
				  style={{
					  width: 8,
					  height: 8,
					  marginLeft: 10,
					  background: isProdStatusOn ? "#2BC07E" : "#FD4C62",
					  borderRadius: 999,
					  display: "inline", 
				  }}
				/>
				  <Typography
					style={{
					  fontFamily: "12px",
					  opacity: 0.9,
					  color: isProdStatusOn ? "#2BC07E" : "#FD4C62",
					 }}
				  >
					{isProdStatusOn ? "Production" : "NOT Production"} 
				  </Typography>
			  </div>
		  ) : null}

          </Box>


          {/* Steps list with a single continuous rail */}
          <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 3, marginLeft: -1.5, marginTop: 4 }}>
            {/* Base grey rail */}
            <Box
              sx={{
                position: "absolute",
                left: 20,
                top: 30,
                bottom: 60,
                width: 2,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2,
              }}
            />

            {/* Green segments between consecutive completed steps */}
            {steps.map((s, i) => ({ s, i }))
              .filter(({ i }) => i < steps.length - 1)
              .filter(({ i }) => steps[i].completed && steps[i + 1].completed)
              .map(({ i }) => (
                <Box
                  key={`seg-${i}`}
                  sx={{
                    position: "absolute",
                    left: 20,
                    top: 30 + i * 110, // approximate segment height per step
                    height: 130, // matches gap+card combined height; tuned visually
                    width: 2,
                    background: "#43D17C",
                    borderRadius: 2,
                  }}
                />
              ))}

            {steps.map((step, idx) => (
              <StepItem key={step.key || idx} step={{...step, flashKeys}} />
            ))}
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 1.5 }}>
            {footer}
            <Button variant="contained" color="primary"  onClick={handleFinalDone}
				sx={{
					fontSize: 14,
					padding: "8px 60px",
				}}
				>
				Explore 
            </Button>

            <Button variant="text" color="secondary"  onClick={() => {
        		setOnboardingOpen(false)

				toast.warn("The dashboard is not fully set up yet. You can complete the steps later from the onboarding section.", { timeout: 10000 })
			}}
				sx={{
					fontSize: 14,
					padding: "8px 60px",
				}}
				>
	  			Skip for now
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardOnboarding;


