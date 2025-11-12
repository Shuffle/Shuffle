import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Stack,
  Chip,
  Avatar,
  Divider,
  Select,
  MenuItem,   
  Tooltip, 
  CircularProgress,
  FormControl,
  InputLabel,
} from '@mui/material';
import { toast } from "react-toastify";


import {
	TrendingFlat as TrendingFlatIcon,
	TrendingUp as TrendingUpIcon,
	TrendingDown as TrendingDownIcon,
	TaskAlt as TaskAltIcon,
	SuccessFailed as SuccessFailedIcon,
	RunsOverTime as RunsOverTimeIcon,
	ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';

import SuccessFailedRunsWidget from '../components/SuccessFailedRunsWidget.jsx';
import RunsOverTimeWidget from '../components/RunsOverTimeWidget.jsx';
import DashboardOnboarding from '../components/DashboardOnboarding.jsx';
import { Context } from '../context/ContextApi.jsx';
import { useNavigate } from 'react-router-dom';

const NewDashboard = (props) => {
  const { globalUrl, serverside, userdata } = props;

  const { leftSideBarOpenByClick } = useContext(Context);
  const [sfwControls, setSfwControls] = useState(null);
  const [loadingSfw, setLoadingSfw] = useState(true);
  const [loadingRot, setLoadingRot] = useState(true);
  const [loadingNoti, setLoadingNoti] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [totals, setTotals] = useState({ days: 30, mode: 'workflows', totalRuns: 0, successRuns: 0, failedRuns: 0, activeDays: 0, timeSavedMinutes: 0, moneySavedDollars: 0 });
  const [notifications, setNotifications] = useState([]);
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    try {
      return localStorage.getItem("dashboard_onboarding_complete") === "true" ? false : true;
    } catch {
      return true;
    }

  })
  const [overrideDays, setOverrideDays] = useState(undefined);
  const [rotMonthOverride, setRotMonthOverride] = useState(undefined);
  const [isProdStatusOn, setIsProdStatusOn] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState(null)
  const [selectedOrgForStats, setSelectedOrgForStats] = useState(userdata?.active_org?.id || null)
  const [availableOrgs, setAvailableOrgs] = useState([])
  const [selectedOrgStats, setSelectedOrgStats] = useState(null)
  const [loadingSelectedOrgStats, setLoadingSelectedOrgStats] = useState(false)
  const [selectedOrgDetailsForStats, setSelectedOrgDetailsForStats] = useState(null)
  const [fallbackToParentStats, setFallbackToParentStats] = useState(false);

  document.title = "Shuffle - Dashboard";

  const isCloud =
    serverside === true || typeof window === "undefined"
      ? true
      : window.location.host === "localhost:3002" ||
        window.location.host === "shuffler.io" ||
        window.location.host === "localhost:5002";
  
  const navigate = useNavigate();
  const handleSfwControls = useCallback((node) => {
    setSfwControls(node);
  }, []);

  const formatCurrencyCompact = (value) => {
    const n = Math.max(0, Number(value) || 0);
    const abs = Math.abs(n);
    const fmt = (x, suffix) => `${(Math.round(x * 10) / 10).toString().replace(/\.0$/, '')}${suffix}`;
    if (abs >= 1e9) return `$${fmt(n / 1e9, 'B')}`;
    if (abs >= 1e6) return `$${fmt(n / 1e6, 'M')}`;
    if (abs >= 1e3) return `$${fmt(n / 1e3, 'k')}`;
    return `$${Math.round(n).toLocaleString()}`;
  };

  const formatTimeDisplay = (mins) => {
    const totalMins = Math.max(0, Math.round(mins || 0));
    if (totalMins < 60) return { display: `${totalMins}m`, title: `${totalMins} minutes` };
    const totalHours = Math.floor(totalMins / 60);
    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24);
      return { display: `${days}d`, title: `${totalHours} hours` };
    }
    return { display: `${totalHours}h`, title: `${totalHours} hours` };
  };

  const timeFmt = formatTimeDisplay(totals.timeSavedMinutes);

  const unreadCount = notifications.filter(n => n && n.read === false).length;
  const readCount = notifications.filter(n => n && n.read === true).length;

  // Current values
  // 1 Workflow run = 15 minutes
  // 1 Workflow run = $25

  const STATIC_TIME_PERCENT = 'TBD'
  const STATIC_MONEY_PERCENT = 'TBD'
  const kpis = [
    { value: timeFmt.display, title: timeFmt.title, label: 'Time saved', icon: <TrendingUpIcon sx={{ color: '#5cc879', fontSize: 34 }} />, percentage: STATIC_TIME_PERCENT, color: '#5cc879', disabled: true},
    { value: formatCurrencyCompact(totals.moneySavedDollars), label: 'Money saved', icon: <TrendingUpIcon sx={{ color: '#5cc879', fontSize: 34 }} />, percentage: STATIC_MONEY_PERCENT, color: '#5cc879', disabled: true, },
    { value: String(unreadCount), label: 'Total errors', icon: <ErrorOutlineIcon sx={{ color: '#f87171', fontSize: 34, opacity: 0.9 }} />, percentage: "", color: '#f87171' },
    { value: String(readCount), label: 'Errors resolved', icon: <TaskAltIcon sx={{ color: '#5cc879', fontSize: 34, opacity: 0.9 }} />, percentage: "", color: '#5cc879' },
  ];

  const getGreeting = () => {
    try {
      const hour = new Date().getHours();
      if (hour < 5) return 'Good night';
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    } catch {
      return 'Hey';
    }
  };
  
  const displayName = userdata !== undefined && userdata?.username !== undefined ? userdata?.username?.split('@')[0]?.charAt(0)?.toUpperCase() + userdata?.username?.split('@')[0]?.slice(1) : 'User';

  useEffect(() => {
    const anyLoading =
      loadingSfw ||
      loadingRot ||
      loadingNoti ||
      loadingSelectedOrgStats ||
      !selectedOrganization ||
      !selectedOrgForStats;
    setShowOverlay(anyLoading);
  }, [
    loadingSfw,
    loadingRot,
    loadingNoti,
    loadingSelectedOrgStats,
    selectedOrganization,
    selectedOrgForStats,
  ]);

  // Auto-open onboarding when there aren't enough active days of stats
  useEffect(() => {
    try {
      const alreadyDone = localStorage.getItem("dashboard_onboarding_complete") === "true";
      if (alreadyDone) {
        setOnboardingOpen(false);
        return;
      }
      const active = Number(totals?.activeDays || 0);
      setOnboardingOpen(active < 5);
    } catch {
      setOnboardingOpen(true);
    }
  }, [totals?.activeDays]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const resp = await fetch(`${globalUrl}/api/v1/notifications`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (resp.status !== 200) {
          setNotifications([]);
          return;
        }
        const data = await resp.json();
        const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
        setNotifications(list.filter(Boolean));
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoadingNoti(false);
      }
    };

    loadNotifications();
  }, [globalUrl]);

  // useEffect(() => {
  //   // Lightweight workflows list for selector in success/failed widget
  //   const loadWorkflows = async () => {
  //     try {
  //       const resp = await fetch(`${globalUrl}/api/v1/workflows`, {
  //         method: 'GET',
  //         credentials: 'include',
  //         headers: { 'Content-Type': 'application/json' },
  //       });
  //       if (resp.status !== 200) {
  //         return;
  //       }
  //       const data = await resp.json();
  //       const list = Array.isArray(data?.workflows) ? data.workflows : (Array.isArray(data) ? data : []);
  //       const normalized = list.filter(Boolean).map((w, idx) => ({ id: w?.id || w?.ID || `${idx}`, name: w?.name || w?.Name || `Workflow ${idx+1}` }));
  //       setWorkflows(normalized);
  //     } catch (e) {
  //       // ignore
  //     }
  //   };

  //   loadWorkflows();
  // }, [globalUrl]);
    
  useEffect(() => {
	const orgId = userdata?.active_org?.id;
    if (!orgId) {
      return;
    }

    let fetched = false;
    fetch(`${globalUrl}/api/v1/orgs/${orgId}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((org) => {
        if (!fetched && org) {
          setSelectedOrganization(org);
          if (!isCloud) {
              if (org?.cloud_sync  && org?.subscriptions[0]?.name?.toLowerCase().includes("enterprise") && org?.subscriptions[0]?.active) {
                setIsProdStatusOn(true);
              } else if (org?.subscriptions[0]?.name?.toLowerCase().includes("enterprise") && org?.subscriptions[0]?.active) {
                setIsProdStatusOn(true);
              } else {
                setIsProdStatusOn(false);
              }
            }
        }
      })
      .catch(() => {});

    return () => {
      fetched = true;
    };
  }, [userdata?.active_org?.id, globalUrl]);

  useEffect(() => {
    if (!selectedOrgForStats) {
        return;
      }
      
      let fetched = false;
      fetch(`${globalUrl}/api/v1/orgs/${selectedOrgForStats}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((org) => {
          if (!fetched && org) {
            setSelectedOrgDetailsForStats(org);
          }
        })
        .catch(() => {});
  
      return () => {
        fetched = true;
      };
    }, [selectedOrgForStats, globalUrl]);


  // Build list of available orgs for stats (parent + child orgs)
  useEffect(() => {
    if (!selectedOrganization) return;
    
    const orgs = [{ id: 'ALL', name: 'All Organizations', isAll: true }];
    
    // Add parent org
    if (selectedOrganization?.id) {
      orgs.push({ 
        id: selectedOrganization.id, 
        name: selectedOrganization.name || 'Parent Organization',
        isAll: false 
      });
    }
    
    // Add child orgs if they exist
    if (selectedOrganization?.child_orgs && Array.isArray(selectedOrganization.child_orgs)) {
      selectedOrganization.child_orgs.forEach(child => {
        if (child?.id && child?.name) {
          orgs.push({ 
            id: child.id, 
            name: child.name,
            isAll: false 
          });
        }
      });
    }
    
    setAvailableOrgs(orgs);
    setSelectedOrgForStats(selectedOrganization?.id);
  }, [selectedOrganization]);

  // Fetch statistics for specifically selected org (not for ALL)
  useEffect(() => {

    let aborted = false;
    const load = async () => {
      try {
        if (!selectedOrgForStats || selectedOrgForStats === 'ALL') {
          setSelectedOrgStats(null);
          setFallbackToParentStats(false);
          return;
        }
        setLoadingSelectedOrgStats(true);
        const resp = await fetch(`${globalUrl}/api/v1/orgs/${encodeURIComponent(selectedOrgForStats)}/stats`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        let fallback = false;
        let data = null;
        if (resp.ok) {
          data = await resp.json();
        }
        const isParentContext = selectedOrganization && userdata?.active_org?.id === selectedOrganization.id;
        if (!data || !Array.isArray(data.daily_statistics) || data.daily_statistics.length === 0) {
          fallback = true;
          setSelectedOrgStats(null);
          // Only fallback to parent if on parent org dashboard
          if (isParentContext && selectedOrganization && selectedOrgForStats !== selectedOrganization.id) {
            toast.info('No stats available for selected org. Showing parent org stats.');
            setSelectedOrgForStats(selectedOrganization.id);
          }
        } else {
            // If data exists but has near-zero activity over the last 30 days, fallback to parent
          try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const recent = data.daily_statistics.filter((d) => {
              if (!d?.date) return false;
              const dt = new Date(d.date);
              return dt >= cutoff;
            });
            const sumWork = recent.reduce((s, d) => s + Number(d?.workflow_executions_finished || 0) + Number(d?.workflow_executions_failed || 0), 0);
            const sumApp = recent.reduce((s, d) => s + Number(d?.app_executions || 0), 0);
            const nearZero = (Number(sumWork) + Number(sumApp)) <= 0;
            if (nearZero && isParentContext && selectedOrganization && selectedOrgForStats !== selectedOrganization.id) {
              fallback = true;
              setSelectedOrgStats(null);
              toast.info('Selected org has no activity in the last 30 days. Showing parent org stats.');
              setSelectedOrgForStats(selectedOrganization.id);
            } else {
              setSelectedOrgStats(data || null);
            }
          } catch {
            setSelectedOrgStats(data || null);
          }
        }
        setFallbackToParentStats(fallback && isParentContext);
      } catch {
        if (!aborted) setSelectedOrgStats(null);
        setFallbackToParentStats(false);
      } finally {
        if (!aborted) setLoadingSelectedOrgStats(false);
      }
    };

    // Calling the function.
    load();
    return () => { aborted = true; };
  }, [selectedOrgForStats, selectedOrganization, globalUrl, userdata?.active_org?.id]);

  return (
    <div style={{ maxWidth: 1366, margin: '0 auto', padding: 16, paddingTop: 50, paddingBottom: 30, paddingLeft: leftSideBarOpenByClick ? 270 : 80, transition: 'padding-left 0.3s ease', position: 'relative' }}>
       {(onboardingOpen && !loadingSelectedOrgStats) && (
      <DashboardOnboarding
        open={onboardingOpen}
        globalUrl={globalUrl}
        onClose={() => {
			setOnboardingOpen(false)
		}}
        setOnboardingOpen={setOnboardingOpen}
	  	isProdStatusOn={isProdStatusOn}
	    isCloud={isCloud}
        onExplore={() => {
          // Ensure overrides are set before closing modal
          setOverrideDays(5);
          setRotMonthOverride(new Date(new Date().getFullYear(), new Date().getMonth(), 1));  

          // Close modal immediately to trigger data fetching
          setOnboardingOpen(false);
        }}
        headerTitle="Unlock your Dashboard"
        headerSubtitle="Complete these steps to start seeing insights."
      />
      )}
      {showOverlay && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.6)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CircularProgress size={36} thickness={4} />
            <Typography variant="body2" color="textSecondary">Loading dashboard…</Typography>
          </div>
        </div>
      )}
      {/* Header / Greeting */}
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 16px 0' }}>
        <Typography variant="h5">{`${getGreeting()}, ${displayName ?? 'User'}!`}</Typography>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {availableOrgs.length > 2 && (
            <FormControl size="small" variant="outlined" style={{ minWidth: 200, marginTop: -8 }} sx={{
              '& .MuiInputBase-root': {
                height: 40,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: '20px',
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
            }}>
              <InputLabel id="stats-org-select-label">View Stats For</InputLabel>
              <Select
                labelId="stats-org-select-label"
                label="View Stats"
                value={selectedOrgForStats || ''}
                onChange={(e) => setSelectedOrgForStats(e.target.value)}
              >
                {availableOrgs.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {sfwControls}
        </Box>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
			<Tooltip title={kpi.disabled ? "This metric is coming soon!" : ""} arrow>
				<Paper style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12
				  , cursor: kpi.label.toLowerCase().includes('total errors') ? 'pointer' : 'default',
					transparency: kpi.disabled ? 0.5 : 1
				 }}
				 onClick={() => {
				  if (kpi.label.toLowerCase().includes('total errors')) {
					// navigate to notifications page
					navigate('/admin?admin_tab=notifications');
				  }
				 }}
				 
				 >
				  <Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack sx={{py:2, paddingLeft: 1}}>
					  <Typography variant="h4" title={kpi.title || ''}>{kpi.value}</Typography>
					  <Typography sx={{fontSize: 13}} color="textSecondary">{kpi.label}</Typography>
					</Stack>
					<Stack sx={{py: 2, paddingRight: 1, marginTop: kpi.label.toLowerCase().includes('errors') ? -1 : 0}}>
					  {kpi.icon}
					  <Typography variant="body2" color={kpi.color}>{kpi.percentage}</Typography>
					</Stack>
				  </Stack>
				</Paper>
			</Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Success/Failed widget uses its own internal sub-cards; make wrapper transparent */}
      <Paper elevation={0} style={{ padding: 0, marginTop: 5, background: 'transparent', boxShadow: 'none', border: 'none' }}>
        <SuccessFailedRunsWidget
          globalUrl={globalUrl}
          overrideDays={overrideDays}
          dummyMode={onboardingOpen}
          onControlsChange={handleSfwControls}
          onLoadingChange={setLoadingSfw}
          onTotalsChange={setTotals}
          loadingSelectedOrgStats={loadingSelectedOrgStats}
          selectedOrganization={selectedOrganization}
          selectedOrgForStats={selectedOrgForStats}
          orgStats={selectedOrgStats}
          orgForLimit={selectedOrgDetailsForStats || selectedOrganization}
        />
      </Paper>

      {/* Runs over time section */}
      <Paper style={{ padding: 16, marginTop: 19, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        <RunsOverTimeWidget 
          globalUrl={globalUrl} 
          onLoadingChange={setLoadingRot} 
          loadingSelectedOrgStats={loadingSelectedOrgStats}
          monthOverride={rotMonthOverride} 
          dummyMode={onboardingOpen}
          selectedOrganization={selectedOrganization}
          selectedOrgForStats={selectedOrgForStats}
          orgStats={selectedOrgStats}
          orgForLimit={selectedOrgDetailsForStats || selectedOrganization}
        />
      </Paper>
    </div>
  );
};

export default NewDashboard;


