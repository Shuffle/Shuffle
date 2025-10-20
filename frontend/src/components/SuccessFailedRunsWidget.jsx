import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import {
  AreaChart,
  AreaSeries,
  Area,
  GridlineSeries,
  Gridline,
  ChartTooltip,
  TooltipArea,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  LinearYAxis,
  LinearYAxisTickSeries,
  LinearYAxisTickLabel,
} from "reaviz";
import theme from "../theme";

// KPI configuration constants
const RUN_MINUTES_SAVED_PER_WORKFLOW = 15; // minutes saved per workflow run
const RUN_DOLLARS_SAVED_PER_WORKFLOW = 25; // dollars saved per workflow run

// Filters for status selection
const statusOptions = [
  { key: "ALL", label: "All" },
  { key: "FINISHED", label: "Success" },
  { key: "FAILED", label: "Failed" },
];

// Response Object (Coming from backend)
// {
//   "key": "app_executions",
//   "value": 70,
//   "date": "2025-10-15T19:36:03.928872+05:30"
// }

// Date formatting helpers
// This is used to format the date in the format of YYYY-MM-DD
function formatDay(dateInput) {
  try {
    return new Date(dateInput).toISOString().slice(0, 10);
  } catch {
    return String(dateInput);
  }
}

// This is used to format the date in the format of YYYY-MM
function formatMonth(dateInput) {
  const dt = new Date(dateInput);
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dt.getFullYear()}-${month}`;
}

// Aggregate values by day or by month 
// This is used for area chart toggle button (Daily / Monthly)
function bucketSeries(items, resolution) {
  const map = new Map();
  for (const item of items) {
    const key =
      resolution === "monthly" ? formatMonth(item.key) : formatDay(item.key);
    const value = Number(item.data || 0);
    map.set(key, (map.get(key) || 0) + value);
  }
  return map;
}

// Normalize API entries to a consistent structure
// for e.g, {date: "2025-10-15T19:36:03.928872+05:30", value: 70}
// will be normalized to {key: "2025-10-15", id: "2025-10-15", data: 70}
function normalizeEntries(arr) {
  return (arr || []).map((d) => ({
    key: d?.date ? new Date(d.date) : new Date(),
    id: d?.date || Math.random().toString(36).slice(2),
    data: Number(d?.value ?? 0),
  }));
}

// Build continuous key sequence from start to end, aligned by resolution (Daily / Monthly) 
function buildBackfilledKeys(allKeys, resolution) {
  if (allKeys.length === 0) return allKeys;

  const start = new Date(allKeys[0]);
  let end = new Date(allKeys[allKeys.length - 1]);
  const today = new Date();

  if (resolution === "monthly") {
    const monthToday = new Date(today.getFullYear(), today.getMonth(), 1);
    if (monthToday > end) end = monthToday;
  } else {
    // To ensure that the last day is included in the series
    const dayToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    if (dayToday > end) end = dayToday;
  }

  const addKey = (dt) =>
    resolution === "monthly" ? formatMonth(dt) : formatDay(dt);
  const step = (dt) => {
    if (resolution === "monthly") {
      dt.setMonth(dt.getMonth() + 1);
      dt.setDate(1);
    } else {
      dt.setDate(dt.getDate() + 1);
    }
  };

  const sequence = [];
  const cursor = new Date(start);
  if (resolution === "monthly") cursor.setDate(1);
  while (cursor <= end) {
    sequence.push(addKey(cursor));
    step(cursor);
  }
  return sequence;
}

// Ensure area series has at least two points
function ensureMinTwoPoints(arr) {
  if (arr.length === 1) {
    return [
      { key: 0, data: arr[0].data },
      { key: 1, data: arr[0].data },
    ];
  }
  return arr;
}

// Compact number formatter for axis ticks (e.g. 12,000 -> 12k, 12000000 -> 12M, 12000000000 -> 12B)
function formatCompactNumber(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${Math.round((n / 1e9) * 10) / 10}B`;
  if (abs >= 1e6) return `${Math.round((n / 1e6) * 10) / 10}M`;
  if (abs >= 1e3) return `${Math.round((n / 1e3) * 10) / 10}k`;
  return `${n}`;
}

// Compute X axis ticks and label formatter
function computeTicks(allKeys, days, resolution) {
  const maxTicks = 12;
  const xInterval = Math.max(1, Math.floor(allKeys.length / maxTicks));
  let tickValues = Array.from(
    { length: Math.ceil(allKeys.length / xInterval) },
    (_, i) => i * xInterval
  );
  const lastIdx = allKeys.length - 1;
  if (lastIdx >= 0 && tickValues[tickValues.length - 1] !== lastIdx) {
    tickValues = [...tickValues, lastIdx];
  }

  // Format the label for the x axis
  // if resolution is monthly, it will return the date in the format of YYYY-MM
  // if resolution is daily, it will return the date in the format of YYYY-MM-DD
  // if days is greater than 90, it will return the date in the format of YYYY-MM-DD
  // else it will return the date in the format of MM-DD
  const formatLabel = (idx) => {
    const key = allKeys[idx];
    if (!key) return "";
    if (resolution === "monthly") return key;
    if (days > 90) return key;
    const parts = key.split("-");
    if (parts.length >= 3) return `${parts[1]}-${parts[2]}`;
    return key;
  };

  return { tickValues, formatLabel };
}

// Compute upper bound for Y axis with padding
// Just to ensure that the area chart is not touching the top of the chart
function computePaddedMax(okArr, failArr) {
  const rawMaxOk = okArr.reduce((m, p) => Math.max(m, Number(p?.data || 0)), 0);
  const rawMaxFail = failArr.reduce(
    (m, p) => Math.max(m, Number(p?.data || 0)),
    0
  );
  return Math.max(1, Math.ceil(Math.max(rawMaxOk, rawMaxFail) * 1.1 + 1));
}

// Build grouped series and matching color scheme based on filter selection
// This is used to build the grouped series and matching color scheme based on filter selection (Success / Failed / All)
function buildGroupedSeries(selectedStatus, okArr, failArr) {
  let grouped = [];
  let scheme = [];

  if (selectedStatus === "ALL") {
    if (failArr.length > okArr.length) {
      grouped = [
        { key: "Successful Runs", data: okArr },
        { key: "Failed Runs", data: failArr },
      ];
      scheme = ["#ef4444", "#22c55e"];
    } else {
      grouped = [
        { key: "Failed Runs", data: failArr },
        { key: "Successful Runs", data: okArr },
      ];
      scheme = ["#22c55e", "#ef4444"];
    }
  } else if (selectedStatus === "FAILED") {
    grouped = [{ key: "Failed Runs", data: failArr }];
    scheme = ["#ef4444"];
  } else {
    grouped = [{ key: "Successful Runs", data: okArr }];
    scheme = ["#22c55e"];
  }

  return { grouped, scheme };
}

const SuccessFailedRunsWidget = (props) => {
  const { globalUrl, workflows, onControlsChange, onLoadingChange, onTotalsChange, overrideDays, dummyMode } = props;

  const [mode, setMode] = useState("workflows"); // 'workflows' | 'apps'
  const [days, setDays] = useState(30);
  const daysOptions = [5, 10, 15, 30, 60, 90, 180, 230, 365];

  const [resolution, setResolution] = useState("daily"); // 'daily' | 'monthly'
  const [selectedWorkflow, setSelectedWorkflow] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [seriesOk, setSeriesOk] = useState([]);
  const [seriesFail, setSeriesFail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wfTotals, setWfTotals] = useState({ ok: 0, fail: 0, activeDays: 0 });

  useEffect(() => {
    try {
      if (typeof onTotalsChange !== "function") return;
      const totalOk = Math.max(0, Number(wfTotals.ok) || 0);
      const totalFail = Math.max(0, Number(wfTotals.fail) || 0);
      const totalRuns = totalOk + totalFail;
      const activeDays = Math.max(0, Number(wfTotals.activeDays) || 0);
      const timeSavedMinutes = totalRuns * RUN_MINUTES_SAVED_PER_WORKFLOW;
      const moneySavedDollars = totalRuns * RUN_DOLLARS_SAVED_PER_WORKFLOW;
      // Do not trigger parent updates when switching mode to avoid page blink
      onTotalsChange({ days, totalRuns, successRuns: totalOk, failedRuns: totalFail, activeDays, timeSavedMinutes, moneySavedDollars });
    } catch {
      onTotalsChange({ days, totalRuns: 0, successRuns: 0, failedRuns: 0, activeDays: 0, timeSavedMinutes: 0, moneySavedDollars: 0 });
    }
  }, [wfTotals, days, onTotalsChange]);

  const workflowItems = useMemo(() => {
    const base = [{ id: "ALL", name: "All Workflows" }];
    if (!Array.isArray(workflows)) return base;
    return base.concat(
      workflows
        .filter((w) => w?.id && w?.name)
        .map((w) => ({ id: w.id, name: w.name }))
    );
  }, [workflows]);

  const fetchSeriesForKey = async (key) => {
    try {

      const urlA = `${globalUrl}/api/v1/stats/${encodeURIComponent(key)}?days=${encodeURIComponent(days)}`;
      const doFetch = async (u) => {
        const r = await fetch(u, { method: "GET", credentials: "include" });
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j?.entries) ? j.entries : [];
      };
      const a = await doFetch(urlA);
      if (a.length > 0) return a;

      // Optional orgId fallback if exposed globally in app
      // const orgId = (window && window.selectedOrganization && window.selectedOrganization.id) || null;
      // if (orgId) {
      //   const urlB = `${globalUrl}/api/v1/orgs/${encodeURIComponent(orgId)}/stats/${encodeURIComponent(key)}?days=${encodeURIComponent(days)}`;
      //   const b = await doFetch(urlB);
      //   if (b.length > 0) return b;
      // }
      // return [];
    } catch (e) {
      return [];
    }
  };

  const fetchSeries = async () => {
    setLoading(true);
    try {
      if (dummyMode) {
        // 10-day wave with a couple of bumps for a more dynamic preview
        const today = new Date();
        const mk = (n, v) => ({ key: new Date(today.getFullYear(), today.getMonth(), today.getDate() - n), id: `${n}`, data: v });

        // Success shows two bumps (days -8..-6 and -2..0)
        const okVals = [7, 4, 9, 4, 6, 9, 7, 5, 8, 6]; // oldest -> newest
        const failVals = [1, 0, 1, 2, 1, 1, 0, 1, 2, 1]; // small, non-zero noise

        const okSeries = okVals.map((v, idx) => mk(okVals.length - 1 - idx, v));
        const failSeries = failVals.map((v, idx) => mk(failVals.length - 1 - idx, v));

        setSeriesOk(okSeries);
        setSeriesFail(failSeries);
        return;
      }
      const successKey =
        mode === "workflows"
          ? "workflow_executions_finished"
          : "app_executions";
      const failedKey =
        mode === "workflows"
          ? "workflow_executions_failed"
          : "app_executions_failed";
      const [succ, fail] = await Promise.all([
        fetchSeriesForKey(successKey),
        fetchSeriesForKey(failedKey),
      ]);

      let okSeries = normalizeEntries(succ);
      let failSeries = normalizeEntries(fail);

      // Fallback: if empty, derive from /api/v1/stats daily_statistics
      if (okSeries.length === 0 && failSeries.length === 0) {
        const resp = await fetch(`${globalUrl}/api/v1/stats`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (resp.ok) {
          const data = await resp.json();
          const fieldOk =
            mode === "workflows"
              ? "workflow_executions_finished"
              : "app_executions";
          const fieldFail =
            mode === "workflows"
              ? "workflow_executions_failed"
              : "app_executions_failed";
          const list = Array.isArray(data?.daily_statistics)
            ? data.daily_statistics
            : [];
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          okSeries = list
            .filter(Boolean)
            .map((d) => ({
              key: new Date(d?.date || Date.now()),
              id: d?.date || Math.random().toString(36).slice(2),
              data: Number(d?.[fieldOk] || 0),
            }))
            .filter((p) => p.key >= cutoff);
          failSeries = list
            .filter(Boolean)
            .map((d) => ({
              key: new Date(d?.date || Date.now()),
              id: `f-${d?.date || Math.random().toString(36).slice(2)}`,
              data: Number(d?.[fieldFail] || 0),
            }))
            .filter((p) => p.key >= cutoff);
        }
      }

      setSeriesOk(okSeries);
      setSeriesFail(failSeries);
    } catch (e) {
      setSeriesOk([]);
      setSeriesFail([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch on first render and when days window or mode changes
  const firstLoadRef = React.useRef(true);
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      fetchSeries();
      return;
    }
    fetchSeries();
  }, [days, globalUrl, mode]);

  // Apply external days override (e.g. after onboarding completes)
  useEffect(() => {
    if (typeof overrideDays === 'number' && overrideDays > 0 && overrideDays !== days) {
      setDays(overrideDays);
    }
  }, [overrideDays]);

// For the KPIs : Time saved and Money saved
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      // Skip fetching/storing real stats while onboarding preview is shown
      // if (dummyMode) {
      //   if (!aborted) setWfTotals({ ok: 0, fail: 0, activeDays: 0 });
      //   return;
      // }
      try {
        const totalEntries = await fetchSeriesForKey("workflow_executions");
        const series = normalizeEntries(totalEntries);
        const dayKey = (d) => {
          try { return new Date(d?.date || d?.key).toISOString().slice(0,10); } catch { return null; }
        };
        const dayTotals = new Map();
        for (const it of series) {
          const k = dayKey(it); if (!k) continue; dayTotals.set(k, (dayTotals.get(k) || 0) + (Number(it?.data)||0));
        }
        const activeDays = Array.from(dayTotals.values()).filter(v => v > 0).length;
        const ok = series.reduce((s, p) => s + (Number(p?.data)||0), 0);
        if (!aborted) setWfTotals({ ok, fail: 0, activeDays });
      } catch {
        if (!aborted) setWfTotals({ ok: 0, fail: 0, activeDays: 0 });
      }
    };
    run();
    return () => { aborted = true; };
  }, [globalUrl, days, dummyMode, overrideDays]);

  // Notify parent about loading state changes
  useEffect(() => {
    if (typeof onLoadingChange === "function") {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  // Build filters UI once here; optionally render externally via onControlsChange
  const controlsNode = React.useMemo(() => (
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* <FormControl size="small" style={{ minWidth: 160 }}>
            <InputLabel id="wf-select-label">Workflow</InputLabel>
            <Select
              labelId="wf-select-label"
              value={selectedWorkflow}
              label="Workflow"
              onChange={(e) => setSelectedWorkflow(e.target.value)}
            >
              {workflowItems.filter(Boolean).map((w) => (
                <MenuItem key={w?.id} value={w?.id}>{w?.name}</MenuItem>
              ))}
            </Select>
          </FormControl> */}
        <FormControl size="small" variant="outlined" style={{ minWidth: 150 }} sx={{
          '& .MuiInputBase-root': {
            height: 40,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: '20px',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
        }}>
          <InputLabel id="status-select-label">Filter</InputLabel>
          <Select
            labelId="status-select-label"
            value={selectedStatus}
            label="Filter"
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map((s) => (
              <MenuItem key={s.key} value={s.key}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" variant="outlined" style={{ minWidth: 150 }} sx={{
          '& .MuiInputBase-root': {
            height: 40,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: '20px',
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.22)' },
        }}>
          <InputLabel id="days-select-label">Last</InputLabel>
          <Select
            labelId="days-select-label"
            value={days}
            label="Last"
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {daysOptions.map((d) => (
              <MenuItem key={d} value={d}>
                {d} days
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Workflows
            </Box>
          </ToggleButton>

          <ToggleButton value="apps">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Apps
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          exclusive
          size="large"
          value={resolution}
          onChange={(e, v) => {
            if (!v) return;
            setResolution(v);
            if (v === 'monthly' && days !== 180) {
              setDays(180);
            } else if (v === 'daily' && days !== 30) {
              setDays(30);
            }
          }}
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
          <ToggleButton value="daily">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Daily
            </Box>
          </ToggleButton>

          <ToggleButton value="monthly">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Monthly
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    ),
    [selectedStatus, mode, days, resolution, workflowItems]
  );

  useEffect(() => {
    if (typeof onControlsChange === "function") {
      onControlsChange(controlsNode);
      return () => {
        onControlsChange(null);
      };
    }
  }, [onControlsChange, controlsNode]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top controls row: title left, all filters on the right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {/* Title moved inside the area chart card */}
        <span />
        {!onControlsChange && (
          <>
            {controlsNode}
          </>
        )}
      </div>

      {/* Content row: area chart (left) + ring gauges (right) in separate sub-cards */}
      <div
        style={{ display: "flex", width: "100%" }}
      >
        <div
          style={{
            marginTop: 12,
            width: "65%",
            marginRight: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 20,
            paddingRight: 24,
          }}
        >
          <Typography style={{ fontWeight: 500, marginBottom: 22, fontSize: 18 }}>Successful vs Failed Runs ({mode === "workflows" ? "Workflows" : "Apps"})</Typography>
          {(() => {
            // Build unified timeline by day or by month
            const useOk = Array.isArray(seriesOk) ? seriesOk : [];
            const useFail = Array.isArray(seriesFail) ? seriesFail : [];

            const okMap = bucketSeries(useOk, resolution);
            const failMap = bucketSeries(useFail, resolution);
            let allKeys = Array.from(
              new Set([...okMap.keys(), ...failMap.keys()])
            );
            allKeys.sort((a, b) => new Date(a) - new Date(b));
            allKeys = buildBackfilledKeys(allKeys, resolution);

            if (allKeys.length === 0) {
              return (
                <div
                  style={{
                    height: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    No data available
                  </Typography>
                </div>
              );
            }

            let okArr = allKeys.map((k, i) => ({
              key: i,
              data: okMap.get(k) || 0,
            }));
            let failArr = allKeys.map((k, i) => ({
              key: i,
              data: failMap.get(k) || 0,
            }));
            okArr = ensureMinTwoPoints(okArr);
            failArr = ensureMinTwoPoints(failArr);

            const { grouped, scheme } = buildGroupedSeries(
              selectedStatus,
              okArr,
              failArr
            );
            const { tickValues, formatLabel } = computeTicks(
              allKeys,
              days,
              resolution
            );
            const paddedMax = computePaddedMax(okArr, failArr);

            return (
              <AreaChart
                height={300}
                width={"100%"}
                data={grouped}
                yAxis={
                  <LinearYAxis
                    domain={[0, paddedMax]}
                    tickSeries={
                      <LinearYAxisTickSeries
                        label={<LinearYAxisTickLabel format={(d) => formatCompactNumber(d)} />}
                      />
                    }
                  />
                }
                xAxis={
                  <LinearXAxis
                    tickSeries={
                      <LinearXAxisTickSeries
                        tickSize={0}
                        label={
                          <LinearXAxisTickLabel
                            padding={8}
                            format={(d) => formatLabel(Number(d))}
                          />
                        }
                        tickValues={tickValues}
                      />
                    }
                  />
                }
                gridlines={<GridlineSeries line={<Gridline direction="y" />} />}
                series={
                  <AreaSeries
                    type="grouped"
                    interpolation={"smooth"}
                    area={
                      <Area
                        animated={false}
                        interpolation={"smooth"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke={
                          selectedStatus === "ALL" ? undefined : "transparent"
                        }
                        style={{
                          fillOpacity: selectedStatus === "ALL" ? 0.45 : 0.6,
                        }}
                      />
                    }
                    colorScheme={scheme}
                    tooltip={
                      <TooltipArea
                        tooltip={
                          <ChartTooltip
                            placement={"top"}
                            followCursor={true}
                            modifiers={{ offset: "6, 6" }}
                            content={(d) => {
                              const idx = Math.max(0, Number(d?.x ?? 0));
                              const rows = (grouped || []).map(
                                (seriesItem, i) => {
                                  const point = Array.isArray(seriesItem?.data)
                                    ? seriesItem.data[
                                        Math.min(
                                          idx,
                                          seriesItem.data.length - 1
                                        )
                                      ]
                                    : null;
                                  const value = Number(point?.data || 0);
                                  return {
                                    label: seriesItem?.key,
                                    value,
                                    color: scheme[scheme.length - 1 - i],
                                  };
                                }
                              );
                              return (
                                <div
                                  style={{
                                    background: "#1A1A1A",
                                    color: "#ffffff",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 8,
                                    padding: 10,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                                  }}
                                >
                                  <div
                                    style={{ fontWeight: 700, marginBottom: 6 }}
                                  >
                                    {formatLabel(idx)}
                                  </div>
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {rows.reverse().map((r) => (
                                      <div
                                        key={r.label}
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns: "10px 1fr auto",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: 10,
                                            height: 10,
                                            background: r.color,
                                            borderRadius: 2,
                                          }}
                                        />
                                        <span style={{ opacity: 0.9 }}>
                                          {r.label}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                          {r.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                    }
                  />
                }
              />
            );
          })()}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 24,
                paddingTop: 20,
                fontSize: 12,
                color: "#a3a3a3",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LegendDot color="#22c55e" /> Successful Runs
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LegendDot color="#ef4444" /> Failed Runs
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                fontSize: 12,
                color: "#a3a3a3",
                paddingTop: 20,
              }}
            >
              <span>
                X: {resolution === "monthly" ? "Date (month)" : "Date (MM-DD)"}
              </span>
              |<span>Y: Runs</span>
            </div>
          </div>
        </div>

        {/* Ring gauges */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "35%",
            paddingLeft: 0,
            marginTop: 12,
            alignItems: "stretch",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              height: "100%",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
            }}
          >
          <Typography sx={{ fontSize: 18, fontWeight: 500, fontFamily: theme.typography.fontFamily}}>
            {mode === "workflows" ? "Workflows" : "Apps"} Success Rates
          </Typography>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", height: "100%", gap: 15, marginTop: -5, marginLeft: -2 }}>
            {(() => {
              const totalOk = (seriesOk || []).reduce(
                (s, p) => s + (p?.data || 0),
                0
              );
              const totalFail = (seriesFail || []).reduce(
                (s, p) => s + (p?.data || 0),
                0
              );
              const total = totalOk + totalFail;
              const okPct = total > 0 ? Math.round((totalOk / total) * 100) : 0;
              const failPct =
                total > 0 ? Math.round((totalFail / total) * 100) : 0;
              return (
                <>
                  <Ring
                    title="Successful runs"
                    color="#34d399"
                    bg="#1f2937"
                    percent={okPct}
                  />
                  <Ring
                    title="Failed runs"
                    color="#f87171"
                    bg="#1f2937"
                    percent={failPct}
                  />
                </>
              );
            })()}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessFailedRunsWidget;

// Lightweight SVG ring to avoid RadialGauge runtime issues
function Ring({ title, color, bg, percent }) {
  const stroke = 9;
  const r = 60;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, Number(percent) || 0)) / 100) * c;

  return (
    <div style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", width: "100%", borderRadius: 12}}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="160" height="160" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={r}
            stroke={bg}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx="90"
            cy="90"
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${filled} ${c - filled}`}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
          <text
            x="50%"
            y="52%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#e5e7eb"
            fontSize="23"
            fontWeight="600"
          >
            {Math.round(Math.max(0, Math.min(100, Number(percent) || 0)))}%
          </text>
        </svg>
        <Box sx={{ fontSize: 16, color: "#ffffff", fontFamily: theme.typography.fontFamily }}>{title}</Box>
      </div>
    </div>
  );
}

// (Old) custom area/line removed in favor of Reaviz AreaChart grouped

function LegendDot({ color }) {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        background: color,
        display: "inline-block",
      }}
    />
  );
}
