import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { Context } from '../context/ContextApi';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    AccountTree as WorkflowIcon,
    Apps as AppsIcon,
    Storage as StorageIcon,
    FolderOpen as FileIcon,
    FindInPage as SearchIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';

import {
    Button,
    ButtonGroup,
    Typography,
    LinearProgress,
    Chip,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    TextField,
    Popover,
} from "@mui/material";

import { CalendarMonth as CalendarIcon } from '@mui/icons-material';

import HealthBarChart from '../components/HealthBarChart.jsx';
import LiveExecutionsChart from './LiveExecutionsGraph.jsx';


const STATUS_STYLE = {
    operational: { color: '#00F670', label: 'Operational', bg: 'rgba(0, 246, 112, 0.07)' },
    degraded: { color: '#FFD700', label: 'Degraded', bg: 'rgba(255, 215, 0, 0.07)' },
    outage: { color: '#FF354C', label: 'Outage', bg: 'rgba(255, 53, 76, 0.07)' },
};

const REGION_DOMAIN = {
    'london': 'https://shuffler.io',
    'california': 'https://california.shuffler.io',
    'EU': 'https://frankfurt.shuffler.io',
    'canada': 'https://ca.shuffler.io',
    'australia': 'https://au.shuffler.io',
};

const RANGE_MILLIS = {
    '24hr': 24 * 60 * 60 * 1000,
    '7day': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '180d': 180 * 24 * 60 * 60 * 1000,
    '365d': 365 * 24 * 60 * 60 * 1000,
};

const SERVICE_CONFIG = [
    {
        key: 'workflows',
        label: 'Workflows',
        Icon: WorkflowIcon,
        sloTarget: 99.95,
        isHealthy: (item) => item.workflows?.run_finished === true,
        getOperations: (item) => [
            { key: 'create', label: 'Create', value: item.workflows?.create },
            { key: 'run', label: 'Execute', value: item.workflows?.run },
            { key: 'run_finished', label: 'Completed', value: item.workflows?.run_finished },
            { key: 'delete', label: 'Delete', value: item.workflows?.delete },
        ],
        getExtra: (item) => {
            const took = item.workflows?.execution_took;
            return (took != null && took > 0) ? `Exec time: ${Number(took).toFixed(2)}s` : null;
        },
        getIds: (item) => [
            { label: 'Execution ID', value: item.workflows?.execution_id },
            { label: 'Workflow ID',  value: item.workflows?.workflow_id },
        ].filter(id => !!id.value),
        getErrors: (item) => {
            const e = item.workflows?.error;
            if (!e) return [];
            return [
                { key: 'create',              label: 'Create',     msg: e.create },
                { key: 'run',                 label: 'Execute',    msg: e.run },
                { key: 'run_finished',        label: 'Completed',  msg: e.run_finished },
                { key: 'workflow_validation', label: 'Validation', msg: e.workflow_validation },
                { key: 'delete',              label: 'Delete',     msg: e.delete },
            ].filter(err => !!err.msg);
        },
    },
    {
        key: 'apps',
        label: 'Apps',
        Icon: AppsIcon,
        sloTarget: 99.95,
        isHealthy: (item) => { const a = item.apps; return !!(a && a.create && a.run && a.delete); },
        getOperations: (item) => [
            { key: 'create', label: 'Create', value: item.apps?.create },
            { key: 'validate', label: 'Validate', value: item.apps?.validate },
            { key: 'run', label: 'Execute', value: item.apps?.run },
            { key: 'read', label: 'Read', value: item.apps?.read },
            { key: 'delete', label: 'Delete', value: item.apps?.delete },
        ],
        getExtra: () => null,
        getIds: (item) => [
            { label: 'App ID',       value: item.apps?.app_id },
            { label: 'Execution ID', value: item.apps?.execution_id },
        ].filter(id => !!id.value),
        getErrors: (item) => {
            const e = item.apps?.error;
            if (!e) return [];
            return [
                { key: 'create',   label: 'Create',       msg: e.create },
                { key: 'validate', label: 'Validate',     msg: e.validate },
                { key: 'run',      label: 'Execute',      msg: e.run },
                { key: 'read',     label: 'Read',         msg: e.read },
                { key: 'delete',   label: 'Delete',       msg: e.delete },
            ].filter(err => !!err.msg);
        },
    },
    {
        key: 'datastore',
        label: 'Datastore',
        Icon: StorageIcon,
        sloTarget: 99.95,
        isHealthy: (item) => { const d = item.datastore; return !!(d && d.create && d.read && d.delete); },
        getOperations: (item) => [
            { key: 'create', label: 'Create', value: item.datastore?.create },
            { key: 'read', label: 'Read', value: item.datastore?.read },
            { key: 'delete', label: 'Delete', value: item.datastore?.delete },
        ],
        getExtra: () => null,
        getIds: () => [],
        getErrors: (item) => {
            const e = item.datastore?.error;
            if (!e) return [];
            return [
                { key: 'create', label: 'Create', msg: e.create },
                { key: 'read',   label: 'Read',   msg: e.read },
                { key: 'delete', label: 'Delete', msg: e.delete },
            ].filter(err => !!err.msg);
        },
    },
    {
        key: 'fileops',
        label: 'File Storage',
        Icon: FileIcon,
        sloTarget: 99.95,
        isHealthy: (item) => { const f = item.fileops; return !!(f && f.create && f.get_file && f.delete); },
        getOperations: (item) => [
            { key: 'create', label: 'Create', value: item.fileops?.create },
            { key: 'get_file', label: 'Upload/Fetch', value: item.fileops?.get_file },
            { key: 'delete', label: 'Delete', value: item.fileops?.delete },
        ],
        getExtra: () => null,
        getIds: (item) => [
            { label: 'File ID', value: item.fileops?.fileId },
        ].filter(id => !!id.value),
        getErrors: (item) => {
            const e = item.fileops?.error;
            if (!e) return [];
            return [
                { key: 'create', label: 'Create',       msg: e.create },
                { key: 'upload', label: 'Upload/Fetch', msg: e.upload },
                { key: 'delete', label: 'Delete',       msg: e.delete },
            ].filter(err => !!err.msg);
        },
    },
];

const OPENSEARCH_CONFIG = {
    key: 'opensearch',
    label: 'OpenSearch',
    Icon: SearchIcon,
    sloTarget: 99.95,
    isHealthy: (item) => item.opnsearch?.status === 'green',
    getOperations: (item) => {
        const s = item.opnsearch?.status;
        return [{ key: 'cluster', label: 'Cluster', value: s === 'green' ? true : s === 'yellow' ? 'warn' : false }];
    },
    getExtra: (item) => item.opnsearch?.status ? `Cluster: ${item.opnsearch.status}` : null,
    getIds: () => [],
    getErrors: () => [],
};

const computeAvgUptime = (chartData) => {
    if (!chartData || chartData.length === 0) return 100;
    const withData = chartData.filter(d => d.avgRunFinished !== null);
    if (withData.length === 0) return 100;
    return parseFloat((withData.reduce((acc, d) => acc + d.avgRunFinished, 0) / withData.length).toFixed(2));
};

const getStatusKey = (uptime, sloTarget) => {
    if (uptime >= sloTarget) return 'operational';
    if (uptime >= 95) return 'degraded';
    return 'outage';
};

// ---

const HealthPage = (props) => {
    const { userdata, isLoaded } = props;
    const navigate = useNavigate();
    const { leftSideBarOpenByClick } = useContext(Context);
    const [healthData, setHealthData] = useState(null);
    const [selectedRange, setSelectedRange] = useState('24hr');
    const [selectedRegion, setSelectedRegion] = useState('london');
    const [liveExecutionsData, setLiveExecutionsData] = useState([]);
    const [liveExecutionsRange, setLiveExecutionsRange] = useState('1h');
    const [isHealthLoading, setIsHealthLoading] = useState(false);
    const [isLiveExecutionsLoading, setIsLiveExecutionsLoading] = useState(false);
    const [isFixingOpensearchPrefix, setIsFixingOpensearchPrefix] = useState(false);
    const [selectedFailureDetails, setSelectedFailureDetails] = useState(null);
    const [calendarAnchor, setCalendarAnchor] = useState(null);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [customRange, setCustomRange] = useState(null); // { after: unix, before: unix } or null

    const isCloud = window.location.host === "localhost:3002" || window.location.host === "shuffler.io";

    const fetchHealthStats = useCallback(async () => {
        setIsHealthLoading(true);
        try {
            const activeDomain = isCloud ? REGION_DOMAIN[selectedRegion] : window.location.origin;
            const nowMs = Date.now();
            const CHUNK_MS = 90 * 24 * 60 * 60 * 1000; // 90-day chunks

            let rangeStartSec, rangeEndSec;
            if (customRange) {
                rangeStartSec = customRange.after;
                rangeEndSec = customRange.before;
            } else {
                const rangeMs = RANGE_MILLIS[selectedRange] || RANGE_MILLIS['30d'];
                rangeStartSec = Math.floor((nowMs - rangeMs) / 1000);
                rangeEndSec = Math.floor(nowMs / 1000);
            }

            // Split large ranges into 90-day chunks to avoid oversized responses
            const chunks = [];
            let chunkEndSec = rangeEndSec;
            const CHUNK_SEC = Math.floor(CHUNK_MS / 1000);
            while (chunkEndSec > rangeStartSec) {
                const chunkStartSec = Math.max(chunkEndSec - CHUNK_SEC, rangeStartSec);
                chunks.push({ after: chunkStartSec, before: chunkEndSec });
                chunkEndSec = chunkStartSec;
            }

            const fetchChunk = async (after, before) => {
                const resp = await fetch(`${activeDomain}/api/v1/health/stats?after=${after}&before=${before}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    credentials: "include",
                });
                if (!resp.ok) throw new Error("Failed to fetch health stats");
                return resp.json();
            };

            let allData = [];
            // Fetch chunks sequentially to avoid overwhelming the server
            for (const chunk of chunks) {
                const chunkData = await fetchChunk(chunk.after, chunk.before);
                if (Array.isArray(chunkData)) {
                    // Filter to only items within this chunk's window to avoid duplicates
                    const filtered = chunkData.filter(
                        item => item.updated >= chunk.after && item.updated < chunk.before
                    );
                    allData = allData.concat(filtered);
                }
            }

            setHealthData(allData);
        } catch (error) {
            console.error("Error fetching health stats:", error);
            toast.error("Failed loading health stats");
        } finally {
            setIsHealthLoading(false);
        }
    }, [selectedRegion, selectedRange, customRange]);

    const fetchLiveExecutions = useCallback(async (range = '1h') => {
        if (!userdata.support_access) return;
        setIsLiveExecutionsLoading(true);
        try {
            const activeDomain = isCloud ? REGION_DOMAIN[selectedRegion] : window.location.origin;
            const fetchOptions = {
                method: "GET",
                credentials: "include",
            };

            if (window.location.host !== "localhost:3002") {
                fetchOptions.headers = {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                };
            }

            const response = await fetch(
                `${activeDomain}/api/v1/health/executions/live?mode=${range}`,
                fetchOptions
            );

            if (!response.ok) throw new Error("Failed to fetch live executions");

            const data = await response.json();
            if (Array.isArray(data)) {
                const formattedData = data
                    .map(item => ({
                        ...item,
                        executing: Number(item.executing) || 0,
                        finished: Number(item.finished) || 0,
                        aborted: Number(item.aborted) || 0,
                        created_at: Number(item.created_at) || 0,
                    }))
                    .sort((a, b) => a.created_at - b.created_at);
                setLiveExecutionsData(formattedData);
            } else {
                setLiveExecutionsData([]);
            }
        } catch (error) {
            console.error("Error fetching live executions:", error);
            toast.error("Failed loading live executions data");
        } finally {
            setIsLiveExecutionsLoading(false);
        }
    }, [userdata.support_access, selectedRegion]);

    useEffect(() => {
        fetchHealthStats();
        fetchLiveExecutions(liveExecutionsRange);
        const interval = setInterval(() => fetchLiveExecutions(liveExecutionsRange), 60000);
        return () => clearInterval(interval);
    }, [fetchHealthStats, fetchLiveExecutions, liveExecutionsRange]);

    // --- Derived data (memoized) ---

    const filteredHealthData = useMemo(() => {
        if (!healthData || !Array.isArray(healthData)) return [];
        if (customRange) {
            return healthData.filter(item => item.updated >= customRange.after && item.updated <= customRange.before);
        }
        const now = Date.now();
        const ms = RANGE_MILLIS[selectedRange] || RANGE_MILLIS['30d'];
        return healthData.filter(item => now - item.updated * 1000 <= ms);
    }, [healthData, selectedRange, customRange]);

    const hasOpensearch = useMemo(() =>
        Array.isArray(healthData) && healthData.some(item => item.opnsearch && item.opnsearch.status),
        [healthData]);

    const latestEntry = useMemo(() => {
        if (!filteredHealthData.length) return null;
        return filteredHealthData.reduce((best, item) => item.updated > (best?.updated || 0) ? item : best, null);
    }, [filteredHealthData]);

    const extractServiceChartData = useCallback((config, data, range) => {
        if (!data || !Array.isArray(data)) return [];
        const agg = new Map();

        // Anchor pre-fill to the most recent data point so the newest bar always
        // reflects actual data instead of an empty "today/current-hour" slot.
        const mostRecentMs = data.length > 0
            ? Math.max(...data.map(item => item.updated)) * 1000
            : Date.now();
        // Custom range uses UTC keys; all preset ranges use local timezone keys
        const isCustom = range === 'custom';
        const getKey = (timestamp) => {
            const d = new Date(timestamp);
            if (isCustom) {
                // UTC bucketing for custom date range (user picks UTC dates)
                if (range === '24hr') {
                    return `${d.toISOString().split('T')[0]} ${String(d.getUTCHours()).padStart(2, '0')}:00`;
                }
                return d.toISOString().split('T')[0];
            }
            // Local timezone bucketing for preset ranges
            if (range === '24hr') {
                return `${d.toLocaleDateString()} ${String(d.getHours()).padStart(2, '0')}:00`;
            }
            return d.toLocaleDateString();
        };

        // Pre-fill all slots anchored to the most recent data point (newest -> oldest)
        if (range === '24hr') {
            for (let h = 0; h <= 23; h++) {
                const d = new Date(mostRecentMs - h * 60 * 60 * 1000);
                d.setMinutes(0, 0, 0);
                agg.set(getKey(d.getTime()), { total: 0, healthyCount: 0, failures: [] });
            }
        } else if (range === '7day') {
            for (let day = 0; day <= 6; day++) {
                const d = new Date(mostRecentMs - day * 86400000);
                agg.set(d.toLocaleDateString(), { total: 0, healthyCount: 0, failures: [] });
            }
        } else if (range === '30d') {
            for (let day = 0; day <= 29; day++) {
                const d = new Date(mostRecentMs - day * 86400000);
                agg.set(d.toLocaleDateString(), { total: 0, healthyCount: 0, failures: [] });
            }
        } else if (range === '90d') {
            for (let day = 0; day <= 89; day++) {
                const d = new Date(mostRecentMs - day * 86400000);
                agg.set(d.toLocaleDateString(), { total: 0, healthyCount: 0, failures: [] });
            }
        } else if (range === '180d') {
            for (let day = 0; day <= 179; day++) {
                const d = new Date(mostRecentMs - day * 86400000);
                agg.set(d.toLocaleDateString(), { total: 0, healthyCount: 0, failures: [] });
            }
        } else if (range === '365d') {
            for (let day = 0; day <= 364; day++) {
                const d = new Date(mostRecentMs - day * 86400000);
                agg.set(d.toLocaleDateString(), { total: 0, healthyCount: 0, failures: [] });
            }
        } else if (range === 'custom' && customRange) {
            // Pre-fill using original UTC date strings to avoid local TZ rollover
            const startDay = new Date(customRange.startLabel + 'T00:00:00Z');
            const endDay = new Date(customRange.endLabel + 'T00:00:00Z');
            const totalDays = Math.round((endDay - startDay) / 86400000) + 1;
            for (let day = 0; day < totalDays; day++) {
                agg.set(new Date(startDay.getTime() + day * 86400000).toISOString().split('T')[0], { total: 0, healthyCount: 0, failures: [] });
            }
        }

        data.forEach(item => {
            const key = getKey(item.updated * 1000);
            const healthy = config.isHealthy(item);
            if (agg.has(key)) {
                const ex = agg.get(key);
                ex.total++;
                if (healthy) ex.healthyCount++;
                else ex.failures.push(item);
            }
            // skip items that fall outside the pre-filled window
        });

        return Array.from(agg.entries())
            .map(([date, { total, healthyCount, failures }]) => {
            const pct = total === 0 ? null : (healthyCount / total) * 100;
            const color = pct === null ? '#2a2a2a' : pct >= 99.5 ? '#00F670' : pct >= 95 ? '#FFD700' : '#FF354C';
            return {
                date,
                avgRunFinished: pct === null ? null : parseFloat(pct.toFixed(2)),
                total,
                color,
                executionIds: failures.map(f => f.workflows?.execution_id || f.id),
                failures,
            };
        });
    }, [customRange]);

    const serviceCharts = useMemo(() => {
        const configs = hasOpensearch ? [...SERVICE_CONFIG, OPENSEARCH_CONFIG] : SERVICE_CONFIG;
        const result = {};
        const activeRange = customRange ? 'custom' : selectedRange;
        for (const cfg of configs) {
            result[cfg.key] = extractServiceChartData(cfg, filteredHealthData, activeRange);
        }
        return result;
    }, [filteredHealthData, hasOpensearch, extractServiceChartData, selectedRange, customRange]);

    const systemStatus = useMemo(() => {
        const configs = hasOpensearch ? [...SERVICE_CONFIG, OPENSEARCH_CONFIG] : SERVICE_CONFIG;
        const statuses = configs.map(cfg => getStatusKey(computeAvgUptime(serviceCharts[cfg.key]), cfg.sloTarget));
        if (statuses.every(s => s === 'operational')) return 'operational';
        if (statuses.some(s => s === 'outage')) return 'outage';
        return 'degraded';
    }, [serviceCharts, hasOpensearch]);

    // Access guard — only redirect after auth state is confirmed loaded

    useEffect(() => {
        if (!isLoaded) return;
        if (!userdata || !userdata.id) {
            navigate('/login?view=health&message=You must be logged in to view this page', { replace: true });
        } else if (userdata.support_access === false) {
            navigate('/', { replace: true });
        }
    }, [userdata, isLoaded, navigate]);

    // Render nothing only when definitively not authenticated/authorized
    if (!isLoaded || !userdata?.id || userdata?.support_access === false) return null;

    const activeServices = hasOpensearch ? [...SERVICE_CONFIG, OPENSEARCH_CONFIG] : SERVICE_CONFIG;
    const lastUpdated = latestEntry ? new Date(latestEntry.updated * 1000).toLocaleString() : null;
    const backendVersion = latestEntry?.workflows?.backend_version || null;

    // --- Handlers ---

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success('Copied to clipboard'))
            .catch(() => toast.error('Failed to copy'));
    };

    const handleFixOpensearchPrefix = async () => {
        if (isFixingOpensearchPrefix) return;
        setIsFixingOpensearchPrefix(true);
        try {
            const response = await fetch(`${window.location.origin}/api/v1/health/opensearch-prefix`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                credentials: "include",
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.reason || "Failed to fix opensearch prefix");
            }
            const reindexed = data.reindexed ? data.reindexed.length : 0;
            const aliasUpdates = data.alias_updates ? data.alias_updates.length : 0;
            const deleted = data.deleted_indices ? data.deleted_indices.length : 0;
            toast.success(`Fixed opensearch prefix (reindexed ${reindexed}, aliases ${aliasUpdates}, deleted ${deleted})`);
        } catch (error) {
            console.error("Error fixing opensearch prefix:", error);
            toast.error(error.message || "Failed to fix opensearch prefix");
        } finally {
            setIsFixingOpensearchPrefix(false);
        }
    };

    const handleBarClick = (serviceKey, barData) => {
        if (!barData.failures || barData.failures.length === 0) {
            toast.success('All checks passed in this period');
            setSelectedFailureDetails(null);
            return;
        }
        setSelectedFailureDetails({ serviceKey, barData });
    };

    // --- Render helpers ---

    const renderOpBadge = (op) => {
        const ok = op.value === true;
        const warn = op.value === 'warn';
        const dotColor = ok ? '#00F670' : warn ? '#FFD700' : '#FF354C';
        const bg = ok ? 'rgba(0,246,112,0.07)' : warn ? 'rgba(255,215,0,0.07)' : 'rgba(255,53,76,0.07)';
        const border = ok ? 'rgba(0,246,112,0.18)' : warn ? 'rgba(255,215,0,0.18)' : 'rgba(255,53,76,0.18)';
        return (
            <div key={op.key} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 5, padding: '4px 9px', border: `1px solid ${border}` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                <Typography style={{ color: ok ? '#ccc' : warn ? '#FFD700' : '#FF8080', fontSize: 11 }}>{op.label}</Typography>
            </div>
        );
    };

    const renderServiceCard = (cfg) => {
        const chartData = serviceCharts[cfg.key] || [];
        const avgUptime = computeAvgUptime(chartData);
        const statusKey = getStatusKey(avgUptime, cfg.sloTarget);
        const status = STATUS_STYLE[statusKey];
        const sloMet = statusKey === 'operational';
        const latestOps = latestEntry ? cfg.getOperations(latestEntry) : [];
        const extra = latestEntry ? cfg.getExtra(latestEntry) : null;
        const totalFails = chartData.reduce((acc, d) => acc + (d.failures?.length || 0), 0);
        const IconComp = cfg.Icon;

        return (
            <div key={cfg.key} style={{
                backgroundColor: '#0e0e0e',
                borderRadius: 14,
                padding: '22px 28px',
                border: `1px solid ${status.color}1a`,
                display: 'flex',
                alignItems: 'center',
                gap: 36,
                width: '100%',
                boxSizing: 'border-box',
            }}>
                {/* LEFT — identity + uptime number */}
                <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: `${status.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconComp style={{ fontSize: 15, color: status.color }} />
                        </div>
                        <Typography style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>{cfg.label}</Typography>
                        <Chip label={status.label} size="small" style={{ backgroundColor: status.bg, color: status.color, fontSize: 9, height: 19, fontWeight: 700, letterSpacing: '0.04em', marginLeft: 2 }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                        <Typography style={{ color: status.color, fontSize: 36, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.5px' }}>
                            {avgUptime.toFixed(2)}
                        </Typography>
                        <Typography style={{ color: '#555', fontSize: 16, fontWeight: 400 }}>%</Typography>
                        <Typography style={{ color: '#888', fontSize: 12 }}>uptime</Typography>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <Typography style={{ color: '#888', fontSize: 11 }}>SLO {cfg.sloTarget}%</Typography>
                        <Chip
                            label={sloMet ? '✓ Met' : '✗ Below Target'}
                            size="small"
                            style={{ backgroundColor: sloMet ? 'rgba(0,246,112,0.10)' : 'rgba(255,53,76,0.10)', color: sloMet ? '#00F670' : '#FF354C', fontSize: 9, height: 17, fontWeight: 700 }}
                        />
                        {totalFails > 0 && (
                            <Typography style={{ color: '#FF354C', fontSize: 11 }}>{totalFails} incident{totalFails !== 1 ? 's' : ''}</Typography>
                        )}
                    </div>
                </div>

                {/* CENTRE — full-width bar chart + SLO rail */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* SLO progress rail */}
                    <div style={{ position: 'relative', height: 4, backgroundColor: '#1c1c1c', borderRadius: 3 }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(avgUptime, 100)}%`, backgroundColor: status.color, borderRadius: 3, opacity: 0.85 }} />
                        <Tooltip title={`SLO target: ${cfg.sloTarget}%`} placement="top">
                            <div style={{ position: 'absolute', top: -5, bottom: -5, left: `${cfg.sloTarget}%`, width: 2, backgroundColor: '#ffffff', borderRadius: 2, opacity: 0.3, cursor: 'help' }} />
                        </Tooltip>
                    </div>

                    {/* History spark bars */}
                    <HealthBarChart
                        filteredData={chartData}
                        onBarClick={(barData) => handleBarClick(cfg.key, barData)}
                    />

                    <Typography style={{ color: '#555', fontSize: 9, textAlign: 'right' }}>
                        ← newest · oldest → · click bar for details
                    </Typography>
                </div>

                {/* RIGHT — last check operations */}
                <div style={{ width: 220, flexShrink: 0 }}>
                    <Typography style={{ color: '#777', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Last Check</Typography>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {latestOps.map(renderOpBadge)}
                    </div>
                    {extra && (
                        <Typography style={{ color: '#aaa', fontSize: 11, marginTop: 10 }}>{extra}</Typography>
                    )}
                </div>
            </div>
        );
    };

    const renderFailureDetails = () => {
        if (!selectedFailureDetails) return null;
        const { serviceKey, barData } = selectedFailureDetails;
        const cfg = activeServices.find(s => s.key === serviceKey);
        if (!cfg) return null;

        console.log("bar is: ", barData)

        return (
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: 14, border: '1px solid rgba(255,53,76,0.2)', overflow: 'hidden' }}>
                {/* Panel header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF354C' }} />
                        <Typography style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600 }}>
                            {cfg.label} — {barData.date}
                        </Typography>
                        <Chip label={`${barData.failures.length} incident${barData.failures.length !== 1 ? 's' : ''}`} size="small" style={{ backgroundColor: 'rgba(255,53,76,0.1)', color: '#FF354C', fontSize: 10, height: 19 }} />
                        <Typography style={{ color: '#aaa', fontSize: 11 }}>{barData.value != null ? barData.value.toFixed(2) : '—'}% uptime in this period</Typography>
                    </div>
                    <Button size="small" onClick={() => setSelectedFailureDetails(null)}
                        style={{ color: '#555', fontSize: 11, textTransform: 'none', minWidth: 0, padding: '3px 10px', border: '1px solid #2a2a2a', borderRadius: 6 }}>
                        Dismiss
                    </Button>
                </div>

                {/* Failure rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 500, overflowY: 'auto' }}>
                    {barData.failures.slice(0, 20).map((item, idx) => {
                        const ops    = cfg.getOperations(item);
                        const extra  = cfg.getExtra(item);
                        const ids    = cfg.getIds    ? cfg.getIds(item)    : [];
                        const errors = cfg.getErrors ? cfg.getErrors(item) : [];
                        return (
                            <div key={idx} style={{ padding: '14px 24px', borderBottom: '1px solid #111', display: 'flex', flexDirection: 'column', gap: 10 }}>

                                {/* Row header: index + timestamp + op-status badges */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                    <Typography style={{ color: '#aaa', fontSize: 11, width: 22, flexShrink: 0 }}>#{idx + 1}</Typography>
                                    <Typography style={{ color: '#888', fontSize: 10, fontFamily: 'monospace', flexShrink: 0 }}>
                                        {new Date(item.updated * 1000).toLocaleString()}
                                    </Typography>
                                    <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                                        {ops.map(op => {
                                            const ok   = op.value === true;
                                            const warn = op.value === 'warn';
                                            return (
                                                <Chip key={op.key}
                                                    label={`${op.label}: ${ok ? 'OK' : warn ? 'Degraded' : 'Issue'}`}
                                                    size="small"
                                                    style={{ backgroundColor: ok ? 'rgba(0,246,112,0.07)' : warn ? 'rgba(255,215,0,0.07)' : 'rgba(255,53,76,0.1)', color: ok ? '#00F670' : warn ? '#FFD700' : '#FF354C', fontSize: 10, height: 20 }}
                                                />
                                            );
                                        })}
                                    </div>
                                    {extra && <Typography style={{ color: '#aaa', fontSize: 10, flexShrink: 0 }}>{extra}</Typography>}
                                </div>

                                {/* Error reasons */}
                                {errors.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 38, borderLeft: '2px solid rgba(255,53,76,0.25)', marginLeft: 22 }}>
                                        <Typography style={{ color: '#FF354C', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Details</Typography>
                                        {errors.map(err => (
                                            <div key={err.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                <Typography style={{ color: '#FF8080', fontSize: 10, fontWeight: 600, flexShrink: 0, minWidth: 80 }}>{err.label}:</Typography>
                                                <Typography style={{ color: '#cc8888', fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{err.msg}</Typography>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* IDs with copy buttons */}
                                {ids.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 22 }}>
                                        {ids.map(id => (
                                            <div key={id.label} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#111', borderRadius: 6, padding: '4px 8px 4px 10px', border: '1px solid #222' }}>
                                                <Typography style={{ color: '#666', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{id.label}</Typography>
                                                <Typography style={{ color: '#999', fontSize: 10, fontFamily: 'monospace' }}>
                                                    {id.value.length > 20 ? id.value.substring(0, 20) + '…' : id.value}
                                                </Typography>
                                                <Tooltip title={`Copy full ${id.label}: ${id.value}`} placement="top">
                                                    <button
                                                        onClick={() => copyToClipboard(id.value)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '1px 2px', display: 'flex', alignItems: 'center', borderRadius: 3 }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#FF8444'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#555'}
                                                    >
                                                        <CopyIcon style={{ fontSize: 12 }} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        );
                    })}
                    {barData.failures.length > 20 && (
                        <div style={{ padding: '12px 24px', borderTop: '1px solid #111' }}>
                            <Typography style={{ color: '#888', fontSize: 11 }}>
                                +{barData.failures.length - 20} more records not shown
                            </Typography>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Render ---

    const rangeLabel = { '24hr': 'last 24h', '7day': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', '180d': 'last 180 days', '365d': 'last 365 days' };
    const activRangeLabel = customRange
        ? `${customRange.startLabel} – ${customRange.endLabel}`
        : (rangeLabel[selectedRange] || selectedRange);

    return (
        <div style={{ paddingTop: 32, paddingBottom: 60, paddingRight: 32, paddingLeft: leftSideBarOpenByClick ? 272 : 92, width: '100%', transition: 'padding-left 0.3s ease', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* === Page header === */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <Typography style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Platform Health</Typography>
                        {isCloud && (
                        <FormControl size="small" variant="outlined">
                            <Select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                style={{ color: '#fff', backgroundColor: '#1a1a1a', height: 32, fontSize: 13, minWidth: 140 }}
                                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
                            >
                                <MenuItem value="london">London</MenuItem>
                                <MenuItem value="california">California</MenuItem>
                                <MenuItem value="EU">EU (Frankfurt)</MenuItem>
                                <MenuItem value="canada">Canada</MenuItem>
                                <MenuItem value="australia">Australia</MenuItem>
                            </Select>
                        </FormControl>
                        )}
                        {!isCloud && (
                            <Button
                                variant="contained"
                                onClick={handleFixOpensearchPrefix}
                                disabled={isFixingOpensearchPrefix}
                                style={{ background: '#1a1a1a', color: '#FF8444', border: '1px solid #333', textTransform: 'none', fontSize: 12, height: 32, boxShadow: 'none', borderRadius: 6 }}
                            >
                                {isFixingOpensearchPrefix ? 'Fixing…' : 'Fix OpenSearch Prefix'}
                            </Button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                        {backendVersion && <Typography style={{ color: '#999', fontSize: 12 }}>Backend v{backendVersion}</Typography>}
                        {lastUpdated && <Typography style={{ color: '#888', fontSize: 12 }}>Last check: {lastUpdated}</Typography>}
                        <Typography style={{ color: '#666', fontSize: 12 }}>{isCloud ? 'Cloud' : 'On-Premises'}</Typography>
                    </div>

                    {/* === Legend (Moved to top) === */}
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                        {[{ color: '#00F670', label: '≥ SLO  Healthy' }, { color: '#FFD700', label: '95–SLO  Degraded' }, { color: '#FF354C', label: '< 95%  Outage' }].map(({ color, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, opacity: 0.7 }} />
                                <Typography style={{ color: '#999', fontSize: 10 }}>{label}</Typography>
                            </div>
                        ))}
                        <Typography style={{ color: '#666', fontSize: 10, marginLeft: 10 }}>Click any bar to view failure details · White marker = SLO target</Typography>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <ButtonGroup style={{ border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
                            {[['24hr', '24h'], ['7day', '7d'], ['30d', '30d'], ['90d', '90d'], ['180d', '180d'], ['365d', '365d']].map(([key, label]) => {
                                const isDisabled = isHealthLoading || ['90d', '180d', '365d'].includes(key);
                                const isActive = !customRange && selectedRange === key;
                                return (
                                <Button key={key} variant="contained" onClick={() => { setCustomRange(null); setCustomStart(''); setCustomEnd(''); setSelectedRange(key); }} disabled={isDisabled}
                                    style={{ background: isActive ? '#1a1a1a' : '#0a0a0a', color: isActive ? '#FF8444' : '#3a3a3a', borderBottom: isActive ? '2px solid #FF8444' : '2px solid transparent', textTransform: 'none', fontSize: 12, minWidth: 54, padding: '6px 16px', boxShadow: 'none' }}>
                                    {label}
                                </Button>
                                );
                            })}
                        </ButtonGroup>

                        {/* Calendar range picker button */}
                        <Tooltip title="Custom date range">
                            <Button
                                variant="contained"
                                onClick={(e) => setCalendarAnchor(e.currentTarget)}
                                style={{ background: customRange ? '#1a1a1a' : '#0a0a0a', color: customRange ? '#FF8444' : '#555', border: `1px solid ${customRange ? '#FF844466' : '#222'}`, borderBottom: customRange ? '2px solid #FF8444' : '2px solid transparent', minWidth: 36, padding: '6px 10px', boxShadow: 'none', borderRadius: 8 }}
                            >
                                <CalendarIcon style={{ fontSize: 16 }} />
                            </Button>
                        </Tooltip>
                    </div>

                    {/* Show active custom range label */}
                    {customRange && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Typography style={{ color: '#FF8444', fontSize: 11 }}>
                                {customRange.startLabel} – {customRange.endLabel}
                            </Typography>
                            <Button onClick={() => { setCustomRange(null); setCustomStart(''); setCustomEnd(''); }} style={{ color: '#555', fontSize: 10, padding: '2px 6px', minWidth: 0, textTransform: 'none' }}>
                                Clear
                            </Button>
                        </div>
                    )}
                </div>

                {/* Calendar popover */}
                <Popover
                    open={Boolean(calendarAnchor)}
                    anchorEl={calendarAnchor}
                    onClose={() => setCalendarAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ style: { backgroundColor: '#111', border: '1px solid #252525', borderRadius: 12, minWidth: 310, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' } }}
                >
                    {/* Header */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#0d0d0d' }}>
                        <CalendarIcon style={{ color: '#FF8444', fontSize: 17 }} />
                        <Typography style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>Custom Date Range</Typography>
                        <Typography style={{ color: '#444', fontSize: 10, marginLeft: 'auto' }}>Max 60 days</Typography>
                    </div>

                    {/* Fields */}
                    <div style={{ padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#0d0d0d' }}>
                        <TextField
                            label="Start date"
                            type="date"
                            size="small"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            InputLabelProps={{ shrink: true, style: { color: '#777', fontSize: 12 } }}
                            inputProps={{ max: customEnd || undefined, style: { color: '#e0e0e0', fontSize: 13, backgroundColor: '#1a1a1a', borderRadius: 6 } }}
                            sx={{
                                '& .MuiOutlinedInput-root': { backgroundColor: '#1a1a1a', borderRadius: '8px' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e2e2e' },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FF844466' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF8444', borderWidth: 1 },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#FF8444' },
                                '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.4)' },
                            }}
                        />
                        <TextField
                            label="End date"
                            type="date"
                            size="small"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            InputLabelProps={{ shrink: true, style: { color: '#777', fontSize: 12 } }}
                            inputProps={{ min: customStart || undefined, style: { color: '#e0e0e0', fontSize: 13, backgroundColor: '#1a1a1a', borderRadius: 6 } }}
                            sx={{
                                '& .MuiOutlinedInput-root': { backgroundColor: '#1a1a1a', borderRadius: '8px' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2e2e2e' },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FF844466' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF8444', borderWidth: 1 },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#FF8444' },
                                '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.4)' },
                            }}
                        />

                        {/* Live duration indicator */}
                        {customStart && customEnd && (() => {
                            const days = Math.round((new Date(customEnd) - new Date(customStart)) / (1000 * 60 * 60 * 24)) + 1;
                            const tooLong = days > 60;
                            const invalid = days <= 0;
                            const color = invalid ? '#666' : tooLong ? '#FF354C' : '#FF8444';
                            const bg = invalid ? 'rgba(255,255,255,0.03)' : tooLong ? 'rgba(255,53,76,0.08)' : 'rgba(255,132,68,0.08)';
                            const border = invalid ? '#2a2a2a' : tooLong ? 'rgba(255,53,76,0.25)' : 'rgba(255,132,68,0.25)';
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 7, backgroundColor: bg, border: `1px solid ${border}` }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                                    <Typography style={{ color, fontSize: 11, fontWeight: 500 }}>
                                        {invalid ? 'End date must be after start date' : tooLong ? `${days} days — exceeds 60-day limit` : `${days} day${days !== 1 ? 's' : ''} selected`}
                                    </Typography>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '10px 18px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #1c1c1c', backgroundColor: '#0d0d0d' }}>
                        <Button
                            size="small"
                            onClick={() => setCalendarAnchor(null)}
                            style={{ color: '#555', textTransform: 'none', fontSize: 12, borderRadius: 7, padding: '5px 14px' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            disabled={!customStart || !customEnd}
                            onClick={() => {
                                const after = Math.floor(new Date(customStart + 'T00:00:00Z').getTime() / 1000);
                                const before = Math.floor(new Date(customEnd + 'T23:59:59Z').getTime() / 1000);
                                if (after >= before) {
                                    toast.error('Start date must be before end date');
                                    return;
                                }
                                const sixtyDaysInSeconds = 60 * 24 * 60 * 60;
                                if (before - after > sixtyDaysInSeconds) {
                                    toast.error('Date range cannot exceed 60 days');
                                    return;
                                }
                                setCustomRange({ after, before, startLabel: customStart, endLabel   : customEnd });
                                setCalendarAnchor(null);
                            }}
                            style={{ backgroundColor: '#FF8444', color: '#fff', textTransform: 'none', fontSize: 12, boxShadow: 'none', borderRadius: 7, padding: '5px 16px', fontWeight: 600 }}
                        >
                            Apply
                        </Button>
                    </div>
                </Popover>
            </div>

            {/* Loading */}
            {isHealthLoading && <LinearProgress style={{ width: '100%', borderRadius: 2 }} />}

            {/* === System status banner === */}
            {!isHealthLoading && filteredHealthData.length > 0 && (
                <div style={{ padding: '14px 22px', borderRadius: 12, backgroundColor: STATUS_STYLE[systemStatus].bg, border: `1px solid ${STATUS_STYLE[systemStatus].color}22`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {systemStatus === 'operational'
                        ? <CheckCircleIcon style={{ color: '#00F670', fontSize: 20, flexShrink: 0 }} />
                        : systemStatus === 'degraded'
                            ? <WarningIcon style={{ color: '#FFD700', fontSize: 20, flexShrink: 0 }} />
                            : <ErrorIcon style={{ color: '#FF354C', fontSize: 20, flexShrink: 0 }} />}
                    <div>
                        <Typography style={{ color: STATUS_STYLE[systemStatus].color, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                            {systemStatus === 'operational' ? 'All Systems Operational' : systemStatus === 'degraded' ? 'Degraded Performance Detected' : 'Some Services Affected'}
                        </Typography>
                        <Typography style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
                            {filteredHealthData.length} health check{filteredHealthData.length !== 1 ? 's' : ''} · {activRangeLabel}
                        </Typography>
                    </div>

                    {/* SLO summary dots */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                        {activeServices.map(cfg => {
                            const uptime = computeAvgUptime(serviceCharts[cfg.key]);
                            const dotColor = uptime >= cfg.sloTarget ? '#00F670' : uptime >= 95 ? '#FFD700' : '#FF354C';
                            return (
                                <Tooltip key={cfg.key} title={`${cfg.label}: ${uptime.toFixed(2)}% / ${cfg.sloTarget}% SLO`} placement="top">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dotColor }} />
                                        <Typography style={{ color: '#ccc', fontSize: 12 }}>{cfg.label}</Typography>
                                        <Typography style={{ color: dotColor, fontSize: 11, fontWeight: 600 }}>{uptime.toFixed(2)}%</Typography>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* === Service health rows (vertical) === */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeServices.map(cfg => renderServiceCard(cfg))}
            </div>

            {/* === Failure details panel === */}
            {renderFailureDetails()}

            {/* Legend removed and moved to the top */}

            {/* === Live Executions === */}
            {userdata.support_access && (
                <>
                    <div style={{ height: 1, backgroundColor: '#141414' }} />
                    <div style={{ padding: '22px 28px', backgroundColor: '#0e0e0e', borderRadius: 14, border: '1px solid #1c1c1c' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
                            <Typography style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>Live Executions</Typography>
                            <ButtonGroup style={{ marginLeft: 'auto', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
                                {[['1h', '1h'], ['7h', '7h'], ['1d', '1d'], ['7d', '7d']].map(([key, label]) => (
                                    <Button key={key} variant="contained" onClick={() => setLiveExecutionsRange(key)} disabled={isLiveExecutionsLoading}
                                        style={{ background: liveExecutionsRange === key ? '#1a1a1a' : '#0a0a0a', color: liveExecutionsRange === key ? '#FF8444' : '#3a3a3a', borderBottom: liveExecutionsRange === key ? '2px solid #FF8444' : '2px solid transparent', textTransform: 'none', fontSize: 12, minWidth: 44, padding: '5px 12px', boxShadow: 'none' }}>
                                        {label}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </div>
                        {isLiveExecutionsLoading && <LinearProgress style={{ marginBottom: 12 }} />}
                        <LiveExecutionsChart data={liveExecutionsData} />
                    </div>
                </>
            )}
        </div>
        </div>
    );
};

export default HealthPage;