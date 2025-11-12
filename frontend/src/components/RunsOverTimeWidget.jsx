import React, { useEffect, useMemo, useState } from 'react';
import { Typography, ToggleButton, ToggleButtonGroup, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { BarChart, BarSeries, Bar, GridlineSeries, Gridline, TooltipArea, ChartTooltip, LinearYAxis, LinearYAxisTickSeries, LinearYAxisTickLabel } from 'reaviz';
import theme from '../theme.jsx';

// Compact number formatter for axis ticks (e.g. 12,000 -> 12k, 12,000,000 -> 12M)
function formatCompactNumber(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${Math.round((n / 1e9) * 10) / 10}B`;
  if (abs >= 1e6) return `${Math.round((n / 1e6) * 10) / 10}M`;
  if (abs >= 1e3) return `${Math.round((n / 1e3) * 10) / 10}k`;
  return `${n}`;
}

// Helpers to keep date and "today" logic concise and consistent
function toYMD(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function entriesContainDateYMD(entries, date) {
  const target = toYMD(date);
  return Array.isArray(entries) && entries.some((e) => toYMD(e.date) === target);
}

function computeTodayValueForAll(key, data) {
  if (key === 'app_executions') {
    return Number(data?.daily_app_executions ?? 0) + Number(data?.daily_child_app_executions ?? 0);
  }
  if (key === 'workflow_executions') {
    const parent = Number(data?.daily_workflow_executions ?? 0);
    const parentFinished = Number(data?.daily_workflow_executions_finished ?? 0);
    const parentFailed = Number(data?.daily_workflow_executions_failed ?? 0);
    const childFinished = Number(data?.daily_child_workflow_executions_finished ?? 0);
    const childFailed = Number(data?.daily_child_workflow_executions_failed ?? 0);
    const parentVal = parent > 0 ? parent : (parentFinished + parentFailed);
    return parentVal + childFinished + childFailed;
  }
  return 0;
}

function computeTodayValueForOrg(key, orgStats) {
  if (key === 'workflow_executions') {
    const total = orgStats?.daily_workflow_executions;
    const finished = Number(orgStats?.daily_workflow_executions_finished ?? 0);
    const failed = Number(orgStats?.daily_workflow_executions_failed ?? 0);
    return total !== undefined ? Number(total || 0) : (finished + failed);
  }
  if (key === 'app_executions') {
    return Number(orgStats?.daily_app_executions ?? 0);
  }
  return 0;
}

  const RunsOverTimeWidget = (props) => {
    const { globalUrl, onLoadingChange, monthOverride, dummyMode, selectedOrganization, selectedOrgForStats, orgStats, orgForLimit, loadingSelectedOrgStats } = props;
  const [mode, setMode] = useState('workflows'); // 'apps' | 'workflows'
  const [series, setSeries] = useState([]);
  const [days, setDays] = useState(365); // aggregate to last 12 months by default
  const [selectedMonth, setSelectedMonth] = useState(null); // Date representing first day of target month, or null for yearly view
  const [loading, setLoading] = useState(false);

  // Helper: fetch time series for a specific statistics key
  const fetchSeriesForKey = async (key) => {
    try {
      // If specific org is selected and pre-fetched stats are available, use them directly
      if (selectedOrgForStats && selectedOrgForStats !== 'ALL' && orgStats && Array.isArray(orgStats?.daily_statistics)) {
        const dailyStats = orgStats.daily_statistics;
        const processedEntries = [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        for (const day of dailyStats) {
          if (!day?.date) continue;
          const dayDate = new Date(day.date);
          if (dayDate < cutoff) continue;

          let value = 0;
          if (key === 'workflow_executions') {
            const finished = Number(day?.workflow_executions_finished || 0);
            const failed = Number(day?.workflow_executions_failed || 0);
            value = finished + failed;
          } else {
            value = Number(day?.[key] || 0);
          }
          processedEntries.push({ date: day.date, value });
        }

        // Append today's values if not present
        try {
          if (!entriesContainDateYMD(processedEntries, new Date())) {
            const todayVal = computeTodayValueForOrg(key, orgStats);
            if (!Number.isNaN(todayVal)) {
              processedEntries.push({ date: new Date().toISOString(), value: todayVal });
            }
          }
        } catch {}

        return processedEntries;
      }

      // If selectedOrgForStats is 'ALL', use parent org's full stats endpoint and combine app_executions + child_app_executions
      if (selectedOrgForStats === 'ALL' && selectedOrganization?.id) {
        // Use the full stats endpoint to get daily_statistics
        const url = `${globalUrl}/api/v1/orgs/${encodeURIComponent(selectedOrganization.id)}/stats`;
        const r = await fetch(url, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
        if (r.ok) {
          const data = await r.json();
          const dailyStats = Array.isArray(data?.daily_statistics) ? data.daily_statistics : [];
          
          // Process each day's data, combining parent + child org runs
          const processedEntries = [];
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          
          for (const day of dailyStats) {
            if (day?.date) {
              const dayDate = new Date(day.date);
              if (dayDate < cutoff) continue; // Filter by days
              
              let value = day?.[key] || 0;
              // Add child org executions based on the key
              if (key === 'app_executions' && day?.child_app_executions !== undefined) {
                value += (day.child_app_executions || 0);
              } else if (key === 'workflow_executions') {
                // For workflow_executions, sum both child_workflow_executions_finished and child_workflow_executions_failed
                const childFinished = day?.child_workflow_executions_finished || 0;
                const childFailed = day?.child_workflow_executions_failed || 0;
                value += (childFinished + childFailed);
              }
              processedEntries.push({ date: day.date, value });
            }
          }

          // Append today's datapoint for ALL by combining parent + child daily_* counters
          try {
            if (!entriesContainDateYMD(processedEntries, new Date())) {
              const todayVal = computeTodayValueForAll(key, data);
              if (!Number.isNaN(todayVal)) {
                processedEntries.push({ date: new Date().toISOString(), value: todayVal });
              }
            }
          } catch {}
          return processedEntries;
        }
      }
      
      // // If a specific org is selected
      // if (selectedOrgForStats && selectedOrgForStats !== 'ALL') {
      //   const url = `${globalUrl}/api/v1/orgs/${encodeURIComponent(selectedOrgForStats)}/stats/${encodeURIComponent(key)}?days=${encodeURIComponent(days)}`;
      //   const r = await fetch(url, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      //   if (r.ok) {
      //     const j = await r.json();
      //     return Array.isArray(j?.entries) ? j.entries : [];
      //   }
      // }

      // Fallback to global stats
      const urlA = `${globalUrl}/api/v1/stats/${encodeURIComponent(key)}?days=${encodeURIComponent(days)}`;
      const doFetch = async (u) => {
        const r = await fetch(u, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j?.entries) ? j.entries : [];
      };
      const a = await doFetch(urlA);
      if (a.length > 0) return a;

      // // Final fallback: old aggregate endpoint returning daily_statistics
      // const fallback = await fetch(`${globalUrl}/api/v1/stats`, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      // if (fallback.ok) {
      //   const data = await fallback.json();
      //   const daily = Array.isArray(data?.daily_statistics) ? data.daily_statistics : [];
      //   const valField = key;
      //   return daily.map((d) => ({ date: d?.date, value: Number(d?.[valField] || 0) }));
      // }
      // return [];
    } catch (e) {
      return [];
    }
  };

  // Load and transform into monthly aggregation for last 12 months
  const load = async (curMode) => {
    setLoading(true);
    try {
      // Clear current series immediately to avoid any visual overlap while switching views
      setSeries([]);
      if (dummyMode) {
        // Bring back the older dummy series with emphasis on earlier months
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(new Date(dt.getFullYear(), dt.getMonth(), 1));
        }
        const base = [20, 18, 22, 24, 23, 21, 15, 12, 9, 15, 24, 20];
        const dummy = months.map((m, idx) => ({ key: m, id: `${m.getFullYear()}-${m.getMonth()}`, data: base[idx] }));
        setSeries(dummy);
        return;
      }
      const key = curMode === 'apps' ? 'app_executions' : 'workflow_executions';
      const entries = await fetchSeriesForKey(key);
      // Normalize variants: {Date, Value} or {date, value}
      const normalized = (entries || []).map((d) => ({
        date: d?.Date ? new Date(d.Date) : (d?.date ? new Date(d.date) : new Date()),
        value: Number(d?.Value ?? d?.value ?? 0),
      }));

      // If a month is selected, show DAILY bars for that month
      if (selectedMonth instanceof Date) {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        // Build all days for selected month
        const firstDay = new Date(year, month, 1);
        const nextMonthFirst = new Date(year, month + 1, 1);
        const numDays = Math.round((nextMonthFirst - firstDay) / (1000 * 60 * 60 * 24));

        // Sum values per day (normalize time to midnight)
        const byDayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const sumPerDay = new Map();
        normalized.forEach((p) => {
          if (!p?.date || Number.isNaN(p.value)) return;
          const d = p.date;
          if (d.getFullYear() !== year || d.getMonth() !== month) return;
          const dayKey = byDayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          sumPerDay.set(dayKey, (sumPerDay.get(dayKey) || 0) + p.value);
        });

        const dailySeries = Array.from({ length: numDays }, (_, i) => {
          const d = new Date(year, month, i + 1);
          const k = byDayKey(d);
          const v = sumPerDay.get(k) || 0;
          return { key: d, id: k, data: v };
        });

        // Ensure consistent ordering
        setSeries(dailySeries.sort((a, b) => a.key - b.key));
        return;
      }

      // Otherwise, show MONTHLY aggregation for last 12 months including current month
      const now = new Date();
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ y: dt.getFullYear(), m: dt.getMonth(), key: new Date(dt.getFullYear(), dt.getMonth(), 1) });
      }

      const byMonthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
      const sumPerMonth = new Map();
      normalized.forEach((p) => {
        if (!p?.date || Number.isNaN(p.value)) return;
        const k = byMonthKey(new Date(p.date.getFullYear(), p.date.getMonth(), 1));
        sumPerMonth.set(k, (sumPerMonth.get(k) || 0) + p.value);
      });

      const monthlySeries = months.map((mm) => {
        const k = `${mm.y}-${mm.m}`;
        const v = sumPerMonth.get(k) || 0;
        return { key: mm.key, id: k, data: v };
      });

      setSeries(monthlySeries);
    } finally {
      setLoading(false);
    }
  };

  // Apply month override (e.g. onboarding Explore Now) - consolidated with main load effect
  useEffect(() => {
    if (monthOverride instanceof Date) {
      // Clear series immediately to prevent visual overlap
      setSeries([]);
      setSelectedMonth(new Date(monthOverride.getFullYear(), monthOverride.getMonth(), 1));
      setDays(370);
    }
  }, [monthOverride]);

    useEffect(() => {
      if (loadingSelectedOrgStats === true) {
        setSeries([]);
        return;
      }
      load(mode);
    }, [mode, globalUrl, days, selectedMonth, dummyMode, selectedOrgForStats, loadingSelectedOrgStats]);

  // Notify parent on loading changes
  useEffect(() => {
    if (typeof onLoadingChange === 'function') {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  const barData = useMemo(() => (
    (Array.isArray(series) ? series : []).map((d) => {
      const dt = new Date(d.key);
      const label = selectedMonth instanceof Date
        ? `${dt.toLocaleString('default', { month: 'short' })} ${dt.getDate()}` // e.g., 'Oct 1'
        : dt.toLocaleString('default', { month: 'short' });
      return { key: label, data: Number(d?.data || 0) };
    })
  ), [series, mode, selectedMonth]);

  // Build month dropdown options for last 12 months
  const monthOptions = useMemo(() => {
    const now = new Date();
    const opts = [];
    for (let i = 0; i < 12; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push(dt);
    }
    return opts;
  }, []);

  const tooltip = <TooltipArea
					tooltip={
					<ChartTooltip
						placement={"top"}
						followCursor={true}
						content={(data) => (
						<div style={{
							borderRadius: 4,
							backgroundColor: "#1A1A1A",
							border: "1px solid rgba(255,255,255,0.22)",
							color: theme.palette.text.primary,
							padding: 10,
							maxWidth: 240,
							pointerEvents: 'none',
						}}>
							<Typography variant="body2" style={{fontWeight: 600, color: "#ffffff"}}>{data?.x ?? ''}</Typography>
							<Typography variant="body2" style={{color: "#ffffff"}}>{data?.y ?? ''}</Typography>
						</div>
						)}
					/>
					}
				/>;

	
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 18, fontWeight: 500, fontFamily: theme.typography.fontFamily, paddingLeft: 1 }}>Runs over time ({mode === "workflows" ? "Workflows" : "Apps"})</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'center' }}>
        <ToggleButtonGroup
        exclusive
        size="large"
        value={mode}
        onChange={(e, v) => v && setMode(v)}
        sx={{
          height: 37,
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '30px',
          padding: '2px',
          "& .MuiToggleButton-root": {
            border: "none",
            borderRadius: "30px",
            color: "#fff",
            padding: "6px 16px",
            textTransform: "none",
            fontSize: "14px",
            "&.Mui-selected": {
              backgroundColor: "#fff",
              color: "#222",
              fontWeight: "600",
              "&:hover": {
                backgroundColor: "#fff",
              },
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
          },
        }}
      >
        <ToggleButton value="workflows">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Workflows
          </Box>
        </ToggleButton>
        <ToggleButton value="apps">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Apps
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
        <FormControl size="small" variant="outlined" style={{ minWidth: 170 }} sx={{
          '& .MuiInputBase-root': {
            height: 40,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: '20px',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
        }}>
            <InputLabel id="runs-month-select-label">View Month</InputLabel>
            <Select
              labelId="runs-month-select-label"
              label="View Month"
              value={selectedMonth ? selectedMonth.getTime() : 'ALL'}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'ALL') {
                  setSelectedMonth(null);
                  setDays(365);
                } else {
                  const dt = new Date(Number(v));
                  setSelectedMonth(new Date(dt.getFullYear(), dt.getMonth(), 1));
                  setDays(370); // ensure enough historical range; backend param only hints
                }
              }}
              displayEmpty
            >
              <MenuItem value={'ALL'}><em>All months</em></MenuItem>
              {monthOptions.map((dt) => (
                <MenuItem key={dt.getTime()} value={dt.getTime()}>
                  {dt.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ width: '100%', position: 'relative' }}>
          {loadingSelectedOrgStats === true ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="textSecondary">Loading…</Typography>
            </div>
          ) : (
          <BarChart
            key={`${mode}-${selectedMonth ? `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}` : 'yearly'}`}
            height={300}
            data={barData}
            series={<BarSeries tooltip={tooltip} bar={<Bar rounded={true} />} />}
            gridlines={<GridlineSeries line={<Gridline direction="y" />} />}
            yAxis={
              <LinearYAxis
                tickSeries={
                  <LinearYAxisTickSeries
                    label={
                      <LinearYAxisTickLabel format={(d) => formatCompactNumber(d)} />
                    }
                  />
                }
              />
            }
            animated={false}
          />
          )}
          {/* Custom reference line overlays for app execution limits (suborg and parent) */}
          {mode === 'apps' && barData.length > 0 && (() => {
            // Determine limits
            const parentAppExecutionLimit = selectedOrganization?.sync_features?.app_executions?.limit ? Number(selectedOrganization.sync_features.app_executions.limit) : null;
            const suborgAppExecutionLimit = orgForLimit?.sync_features?.app_executions?.limit ? Number(orgForLimit.sync_features.app_executions.limit) : null;

            const maxValue = Math.max(...barData.map(d => Number(d.data) || 0), 0);
            if (maxValue <= 0) return null;

            const chartTopPadding = 1;
            const chartBottomPadding = 8;
            const usableHeight = 100 - chartTopPadding - chartBottomPadding;

            // Helpers to compute Y position in percentage
            const posFor = (limit) => {
              const perc = Math.max(0, Math.min(1, (Number(limit) || 0) / maxValue));
              return chartTopPadding + ((1 - perc) * usableHeight);
            };

            let showParentLimit = false;
            let showSuborgLimit = false;

            // Suborg/current limit: only when viewing a specific org (not ALL)
            if (selectedOrgForStats !== 'ALL' && typeof suborgAppExecutionLimit === 'number' && suborgAppExecutionLimit > 0 && suborgAppExecutionLimit <= maxValue && selectedOrgForStats === orgForLimit?.id) {
              showSuborgLimit = true;
            }

            if (typeof parentAppExecutionLimit === 'number' && parentAppExecutionLimit > 0 && parentAppExecutionLimit <= maxValue) {
              if (selectedOrgForStats === 'ALL') {
                showParentLimit = true;
              } else if (parentAppExecutionLimit !== suborgAppExecutionLimit) {
                showParentLimit = true;
              }
            }

            if (!showParentLimit && !showSuborgLimit) return null;

            const suborgTop = showSuborgLimit ? posFor(suborgAppExecutionLimit) : null;
            const parentTop = showParentLimit ? posFor(parentAppExecutionLimit) : null;

            return (
              <>
                {showSuborgLimit && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: `${suborgTop}%`,
                        left: '2%',
                        right: '0%',
                        height: '2px',
                        backgroundImage: 'repeating-linear-gradient(to right, #ff8544 0px, #ff8544 8px, transparent 8px, transparent 16px)',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: `${suborgTop}%`,
                        right: '-5%',
                        transform: 'translate(0, -50%)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #ff8544',
                      }}
                    >
                      <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#ff8544' }}>
                        {formatCompactNumber(suborgAppExecutionLimit)} limit
                      </Typography>
                    </div>
                  </>
                )}

                {showParentLimit && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: `${parentTop}%`,
                        left: '2%',
                        right: '0%',
                        height: '2px',
                        backgroundImage: 'repeating-linear-gradient(to right, #FD4C62 0px, #FD4C62 12px, transparent 12px, transparent 22px)',
                        pointerEvents: 'none',
                        zIndex: 9,
                        opacity: 0.8,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: `${parentTop}%`,
                        right: '-5%',
                        transform: 'translate(0, -50%)',
                        pointerEvents: 'none',
                        zIndex: 9,
                        backgroundColor: 'rgba(26, 26, 26, 0.93)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #FD4C62',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Typography style={{ fontSize: '12px', fontWeight: 600, color: '#FD4C62' }}>
                        {formatCompactNumber(parentAppExecutionLimit)} limit
                      </Typography>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default RunsOverTimeWidget;


