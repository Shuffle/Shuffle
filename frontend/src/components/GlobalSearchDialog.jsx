/**
 * GlobalSearchDialog — Unified Command Palette search component for Shaffuru.
 *
 * Matches the Shuffle-Core SearchDialog standard across both
 * Shuffle Automation (shuffler.io) and Shuffle Security (shuffle.security).
 *
 * Features:
 * - Non-blocking asynchronous searches (Algolia docs/apps/workflows + local workflows cache + correlations).
 * - Domain synonym engine (apps <-> integrations, workflows <-> playbooks, cases <-> alerts/incidents).
 * - Clear badging: Organization private workflows vs Community public templates.
 * - Symmetrical cross-platform routing with graceful auth handoff fallbacks.
 * - Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape) and global Ctrl+K / SEARCH_OPEN_EVENT.
 * - Strict Shuffle branding: No emojis, clean engineering typography.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import algoliasearch from 'algoliasearch/lite';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  InputBase,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Folder as FolderIcon,
  Code as CodeIcon,
  MenuBook as BookIcon,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  BugReport as BugIcon,
  MonitorHeart as MonitorIcon,
  Tune as TuneIcon,
  Description as FileIcon,
  SmartToy as BotIcon,
  Timeline as ActivityIcon,
  Warning as AlertIcon,
  ArrowForward as ArrowRightIcon,
  Explore as CompassIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';
import { Context } from '../context/ContextApi.jsx';
import { getTheme } from '../theme.jsx';
import {
  navigateToShuffleSecurity,
} from '@shuffleio/shuffle-core';

export const SEARCH_OPEN_EVENT = 'search:open';

const ALGOLIA_APP_ID = 'JNSS5CFDZZ';
const ALGOLIA_API_KEY = '33e4e3564f4f060e96e0531957bed552';

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

// Domain synonym dictionary for SecOps and Automation queries
export const SYNONYM_MAP = {
  // Workflows / Automations
  workflow: ['workflow', 'workflows', 'playbook', 'playbooks', 'runbook', 'runbooks', 'flow', 'flows', 'automation', 'automations', 'pipeline'],
  playbook: ['workflow', 'workflows', 'playbook', 'playbooks', 'runbook', 'runbooks', 'flow', 'flows', 'automation', 'automations'],
  runbook: ['workflow', 'workflows', 'playbook', 'playbooks', 'runbook', 'runbooks', 'flow', 'flows', 'automation', 'automations'],
  automation: ['workflow', 'workflows', 'playbook', 'playbooks', 'runbook', 'runbooks', 'flow', 'flows', 'automation', 'automations'],

  // Apps / Integrations
  app: ['app', 'apps', 'integration', 'integrations', 'connector', 'connectors', 'plugin', 'plugins', 'tool', 'tools', 'module'],
  integration: ['app', 'apps', 'integration', 'integrations', 'connector', 'connectors', 'plugin', 'plugins', 'tool', 'tools'],
  connector: ['app', 'apps', 'integration', 'integrations', 'connector', 'connectors', 'plugin', 'plugins', 'tool', 'tools'],
  plugin: ['app', 'apps', 'integration', 'integrations', 'connector', 'connectors', 'plugin', 'plugins', 'tool', 'tools'],

  // Incidents / Alerts / Cases
  incident: ['incident', 'incidents', 'case', 'cases', 'alert', 'alerts', 'ticket', 'tickets', 'issue', 'issues', 'event', 'soar'],
  case: ['incident', 'incidents', 'case', 'cases', 'alert', 'alerts', 'ticket', 'tickets', 'issue', 'issues'],
  alert: ['incident', 'incidents', 'case', 'cases', 'alert', 'alerts', 'ticket', 'tickets', 'issue', 'issues'],
  ticket: ['incident', 'incidents', 'case', 'cases', 'alert', 'alerts', 'ticket', 'tickets', 'issue', 'issues'],

  // Vulnerabilities / CVE
  vulnerability: ['vulnerability', 'vulnerabilities', 'vuln', 'vulns', 'cve', 'cves', 'patch', 'patches', 'advisory'],
  cve: ['vulnerability', 'vulnerabilities', 'vuln', 'vulns', 'cve', 'cves', 'patch', 'patches'],
  patch: ['vulnerability', 'vulnerabilities', 'vuln', 'vulns', 'cve', 'cves', 'patch', 'patches'],

  // Monitors / Sensors / Hosts
  monitor: ['monitor', 'monitors', 'host', 'hosts', 'sensor', 'sensors', 'endpoint', 'endpoints', 'agent', 'device'],
  host: ['monitor', 'monitors', 'host', 'hosts', 'sensor', 'sensors', 'endpoint', 'endpoints'],
  sensor: ['monitor', 'monitors', 'host', 'hosts', 'sensor', 'sensors', 'endpoint', 'endpoints'],
  endpoint: ['monitor', 'monitors', 'host', 'hosts', 'sensor', 'sensors', 'endpoint', 'endpoints'],

  // Agents / AI
  agent: ['agent', 'agents', 'ai', 'subagent', 'subagents', 'bot', 'bots', 'assistant', 'prompt', 'llm'],
  ai: ['agent', 'agents', 'ai', 'subagent', 'subagents', 'bot', 'bots', 'assistant', 'prompt'],
  bot: ['agent', 'agents', 'ai', 'subagent', 'subagents', 'bot', 'bots', 'assistant'],

  // Executions / Audit / Runs
  run: ['run', 'runs', 'execution', 'executions', 'log', 'logs', 'audit', 'history', 'schedule'],
  execution: ['run', 'runs', 'execution', 'executions', 'log', 'logs', 'audit', 'history'],
  audit: ['run', 'runs', 'execution', 'executions', 'log', 'logs', 'audit', 'history'],
  log: ['run', 'runs', 'execution', 'executions', 'log', 'logs', 'audit', 'history'],

  // Storage / Datastore
  storage: ['storage', 'datastore', 'data', 'db', 'database', 'variables', 'vars'],
  datastore: ['storage', 'datastore', 'data', 'db', 'database', 'variables', 'vars'],

  // Docs
  doc: ['doc', 'docs', 'documentation', 'help', 'guide', 'guides', 'manual', 'reference', 'api'],
  documentation: ['doc', 'docs', 'documentation', 'help', 'guide', 'guides', 'manual', 'reference', 'api'],
};

export function getSynonymsForQuery(query) {
  const words = (query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const synonyms = new Set();
  for (const word of words) {
    synonyms.add(word);
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach((syn) => synonyms.add(syn));
    }
  }
  return Array.from(synonyms);
}

const NOISE_KEYS = new Set([
  'new', 'in_progress', 'resolved', 'escalated', 'closed', 'open', 'pending',
  'critical', 'high', 'medium', 'low', 'informational', 'info', 'warning', 'error',
  'unknown', 'none', 'null', 'undefined', 'true', 'false',
]);

const docLabel = (name) =>
  name.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const algoliaDocToItem = (hit) => {
  const rawPath = typeof hit.urlpath === 'string' ? hit.urlpath.trim() : '';
  const pathWithoutHash = rawPath.split('#')[0];
  const filename = typeof hit.filename === 'string' ? hit.filename.trim() : '';
  const fallbackName = filename.replace(/\.md$/i, '');
  const slug = pathWithoutHash.startsWith('/docs/')
    ? pathWithoutHash.slice('/docs/'.length).replace(/^\/+|\/+$/g, '')
    : pathWithoutHash.startsWith('/articles/')
    ? pathWithoutHash.slice('/articles/'.length).replace(/^\/+|\/+$/g, '')
    : pathWithoutHash.startsWith('/legal/')
    ? pathWithoutHash.slice('/legal/'.length).replace(/^\/+|\/+$/g, '')
    : fallbackName.replace(/[_\s]+/g, '-').toLowerCase();
  if (!slug) return null;

  const highlighted = hit._highlightResult?.data?.value;
  const rawSnippet = typeof highlighted === 'string' && highlighted.trim()
    ? highlighted.replace(/<[^>]+>/g, '')
    : typeof hit.data === 'string' ? hit.data : '';

  const isKnownDocRoute =
    rawPath.startsWith('/docs/') ||
    rawPath.startsWith('/articles/') ||
    rawPath.startsWith('/legal/');

  return {
    name: filename || slug,
    slug,
    label: hit.title?.trim() || docLabel(fallbackName || slug),
    path: isKnownDocRoute ? rawPath : rawPath.startsWith('/') ? rawPath : `/docs/${slug}`,
    snippet: rawSnippet.replace(/\s+/g, ' ').trim().slice(0, 140),
  };
};

const BASE_NAV_ITEMS = [
  // Top Pages
  {
    type: 'nav',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon sx={{ fontSize: 16 }} />,
    group: 'Pages',
    platform: 'both',
    keywords: ['home', 'overview', 'stats', 'analytics'],
  },
  {
    type: 'nav',
    label: 'Agents',
    path: '/agents',
    icon: <BotIcon sx={{ fontSize: 16 }} />,
    group: 'Pages',
    platform: 'both',
    keywords: ['ai', 'subagents', 'bots', 'assistant', 'prompt'],
  },
  {
    type: 'nav',
    label: 'Usecases',
    path: '/usecases',
    icon: <ActivityIcon sx={{ fontSize: 16 }} />,
    group: 'Pages',
    platform: 'both',
    keywords: ['templates', 'solutions', 'blueprints', 'catalog'],
  },
  {
    type: 'nav',
    label: 'Documentation',
    path: '/docs',
    icon: <BookIcon sx={{ fontSize: 16 }} />,
    group: 'Pages',
    platform: 'both',
    keywords: ['guide', 'help', 'api', 'manual', 'docs'],
  },
  {
    type: 'nav',
    label: 'UI Preferences',
    path: '/admin/preferences',
    icon: <TuneIcon sx={{ fontSize: 16 }} />,
    group: 'Pages',
    platform: 'both',
    hiddenUnlessSearched: true,
    keywords: ['settings', 'config', 'theme', 'dark', 'light'],
  },

  // Security Specific (redirects to shuffle.security)
  {
    type: 'nav',
    label: 'Incidents',
    path: '/incidents',
    icon: <AlertIcon sx={{ fontSize: 16 }} />,
    group: 'Security',
    platform: 'security',
    keywords: ['cases', 'alerts', 'tickets', 'issues', 'investigation', 'soar'],
  },
  {
    type: 'nav',
    label: 'Vulnerabilities',
    path: '/vulnerabilities',
    icon: <BugIcon sx={{ fontSize: 16 }} />,
    group: 'Security',
    platform: 'security',
    keywords: ['cve', 'cves', 'patches', 'advisories', 'findings'],
  },
  {
    type: 'nav',
    label: 'Host Monitors',
    path: '/monitors',
    icon: <MonitorIcon sx={{ fontSize: 16 }} />,
    group: 'Security',
    platform: 'security',
    keywords: ['sensors', 'hosts', 'endpoints', 'agents', 'devices'],
  },

  // Automation Specific
  {
    type: 'nav',
    label: 'Workflows',
    path: '/workflows',
    icon: <FolderIcon sx={{ fontSize: 16 }} />,
    group: 'Automation',
    platform: 'automation',
    keywords: ['playbook', 'playbooks', 'runbook', 'runbooks', 'flows', 'automations', 'pipeline'],
  },
  {
    type: 'nav',
    label: 'Apps',
    path: '/apps',
    icon: <CodeIcon sx={{ fontSize: 16 }} />,
    group: 'Automation',
    platform: 'automation',
    keywords: ['integrations', 'connectors', 'plugins', 'tools', 'modules'],
  },
  {
    type: 'nav',
    label: 'Storage & Datastore',
    path: '/admin?tab=datastore',
    icon: <StorageIcon sx={{ fontSize: 16 }} />,
    group: 'Automation',
    platform: 'automation',
    keywords: ['database', 'variables', 'vars', 'data', 'store'],
  },
  {
    type: 'nav',
    label: 'Files & Assets',
    path: '/admin?tab=files',
    icon: <FileIcon sx={{ fontSize: 16 }} />,
    group: 'Automation',
    platform: 'automation',
    keywords: ['upload', 'attachments', 'assets'],
  },
];

export const GlobalSearchDialog = ({
  open: controlledOpen,
  onOpenChange,
  userdata,
}) => {
  const navigate = useNavigate();
  const context = useContext(Context) || {};
  const {
    searchBarModalOpen,
    setSearchBarModalOpen,
    isDocSearchModalOpen,
    themeMode = 'dark',
  } = context;

  const currentTheme = getTheme(themeMode);

  // Sync open state between controlled prop, ContextApi, and global event
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === 'boolean';
  const open = isControlled
    ? controlledOpen
    : typeof searchBarModalOpen === 'boolean'
    ? searchBarModalOpen && !isDocSearchModalOpen
    : internalOpen;

  const handleOpenChange = useCallback(
    (newOpen) => {
      if (onOpenChange) {
        onOpenChange(newOpen);
      }
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      if (setSearchBarModalOpen) {
        setSearchBarModalOpen(newOpen);
      }
    },
    [onOpenChange, isControlled, setSearchBarModalOpen],
  );

  // Global event listener for search:open and Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalOpen = () => handleOpenChange(true);
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenChange(!open);
      }
    };

    window.addEventListener(SEARCH_OPEN_EVENT, handleGlobalOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener(SEARCH_OPEN_EVENT, handleGlobalOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleOpenChange]);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Asynchronous result states
  const [appResults, setAppResults] = useState([]);
  const [docResults, setDocResults] = useState([]);
  const [publicWorkflowResults, setPublicWorkflowResults] = useState([]);
  const [correlationResults, setCorrelationResults] = useState([]);

  // Local tenant workflows cache
  const [allWorkflows, setAllWorkflows] = useState([]);

  // Loading indicators
  const [algoliaLoading, setAlgoliaLoading] = useState(false);
  const [correlationsLoading, setCorrelationsLoading] = useState(false);

  const inputRef = useRef(null);
  const algoliaDebounceRef = useRef(null);
  const corrDebounceRef = useRef(null);

  // Fetch local workflows once and cache in-memory for 0ms non-blocking instant filtering
  useEffect(() => {
    let isCancelled = false;
    const fetchLocalWorkflows = async () => {
      try {
        const response = await fetch('/api/v1/workflows', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok && !isCancelled) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : data?.workflows || [];
          setAllWorkflows(
            list.map((w) => ({
              id: w.id || w.workflow_id,
              name: w.name || '',
              description: w.description || '',
            })),
          );
        }
      } catch {
        // Silently ignore workflow caching failures
      }
    };
    fetchLocalWorkflows();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setAppResults([]);
      setDocResults([]);
      setPublicWorkflowResults([]);
      setCorrelationResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Synchronous filter for local tenant workflows (0ms latency, never blocks UI)
  const matchedOrgWorkflows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const synonyms = getSynonymsForQuery(q);
    const filtered = allWorkflows
      .filter((w) => {
        const name = (w.name || '').toLowerCase();
        const desc = (w.description || '').toLowerCase();
        if (name.includes(q) || desc.includes(q)) return true;
        return synonyms.some((syn) => name.includes(syn) || desc.includes(syn));
      })
      .slice(0, 5);

    return filtered.map((w) => ({ type: 'org_workflow', workflow: w }));
  }, [query, allWorkflows]);

  // Synchronous filter for Navigation items with synonyms
  const filteredNavItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return BASE_NAV_ITEMS.filter((n) => !n.hiddenUnlessSearched);
    }

    const synonyms = getSynonymsForQuery(q);

    return BASE_NAV_ITEMS.filter((n) => {
      const label = n.label.toLowerCase();
      const path = n.path.toLowerCase();
      if (label.includes(q) || path.includes(q)) return true;
      if (n.keywords?.some((k) => k.includes(q) || q.includes(k))) return true;
      for (const syn of synonyms) {
        if (label.includes(syn) || n.keywords?.some((k) => k.includes(syn) || syn.includes(k))) {
          return true;
        }
      }
      return false;
    });
  }, [query]);

  // Algolia multi-index query (apps, documentation, community workflows)
  const searchAlgolia = useCallback(async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q) {
      setAppResults([]);
      setDocResults([]);
      setPublicWorkflowResults([]);
      setAlgoliaLoading(false);
      return;
    }

    setAlgoliaLoading(true);
    try {
      // Handle both Algolia v4 (initIndex) and Algolia v5 (searchSingleIndex)
      let appsHits = [];
      let docsHits = [];
      let workflowsHits = [];

      if (typeof algoliaClient.initIndex === 'function') {
        const [appsRes, docsRes, workflowsRes] = await Promise.allSettled([
          algoliaClient.initIndex('appsearch').search(q, { hitsPerPage: 6 }),
          algoliaClient.initIndex('documentation').search(q, {
            hitsPerPage: 6,
            attributesToRetrieve: ['title', 'filename', 'data', 'urlpath'],
            attributesToHighlight: ['data'],
            highlightPreTag: '',
            highlightPostTag: '',
          }),
          algoliaClient.initIndex('workflows').search(q, { hitsPerPage: 5 }),
        ]);

        if (appsRes.status === 'fulfilled') appsHits = appsRes.value?.hits || [];
        if (docsRes.status === 'fulfilled') docsHits = docsRes.value?.hits || [];
        if (workflowsRes.status === 'fulfilled') workflowsHits = workflowsRes.value?.hits || [];
      } else if (typeof algoliaClient.searchSingleIndex === 'function') {
        const [appsRes, docsRes, workflowsRes] = await Promise.allSettled([
          algoliaClient.searchSingleIndex({
            indexName: 'appsearch',
            searchParams: { query: q, hitsPerPage: 6 },
          }),
          algoliaClient.searchSingleIndex({
            indexName: 'documentation',
            searchParams: {
              query: q,
              hitsPerPage: 6,
              attributesToRetrieve: ['title', 'filename', 'data', 'urlpath'],
              attributesToHighlight: ['data'],
              highlightPreTag: '',
              highlightPostTag: '',
            },
          }),
          algoliaClient.searchSingleIndex({
            indexName: 'workflows',
            searchParams: { query: q, hitsPerPage: 5 },
          }),
        ]);

        if (appsRes.status === 'fulfilled') appsHits = appsRes.value?.hits || [];
        if (docsRes.status === 'fulfilled') docsHits = docsRes.value?.hits || [];
        if (workflowsRes.status === 'fulfilled') workflowsHits = workflowsRes.value?.hits || [];
      }

      // 1. Process Apps
      setAppResults(appsHits);

      // 2. Process Docs
      const seenDocs = new Set();
      const docs = docsHits
        .map(algoliaDocToItem)
        .filter((doc) => {
          if (!doc) return false;
          const key = doc.name.toLowerCase();
          if (seenDocs.has(key)) return false;
          seenDocs.add(key);
          return true;
        })
        .slice(0, 5);
      setDocResults(docs);

      // 3. Process Public Workflows
      const publicList = workflowsHits.map((hit) => {
        const rawName = hit.name || hit.title || hit.filename || 'Community Workflow';
        const name = rawName.replace(/_/g, ' ');
        return {
          id: hit.objectID,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          description: hit.description || '',
        };
      });
      setPublicWorkflowResults(publicList);
    } catch {
      setAppResults([]);
      setDocResults([]);
      setPublicWorkflowResults([]);
    } finally {
      setAlgoliaLoading(false);
    }
  }, []);

  // Correlations query (background streaming, non-blocking)
  const searchCorrelations = useCallback(async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setCorrelationResults([]);
      setCorrelationsLoading(false);
      return;
    }

    setCorrelationsLoading(true);
    try {
      const response = await fetch('/api/v2/correlations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'datastore',
          key: q,
          category: 'shuffle-security_incidents',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawCorrelationData = Array.isArray(data)
          ? data
          : data.correlations || data.data || [];
        const correlationData = Array.isArray(rawCorrelationData) ? rawCorrelationData : [];
        const filtered = correlationData.filter((candidate) => {
          if (!candidate || typeof candidate !== 'object') return false;
          if (typeof candidate.key !== 'string' || !candidate.key.trim()) return false;
          if (!Array.isArray(candidate.ref) || candidate.ref.length === 0) return false;
          return (
            candidate.ref.some(
              (ref) => typeof ref === 'string' && ref.includes('shuffle-security_incidents'),
            ) && !NOISE_KEYS.has(candidate.key.toLowerCase())
          );
        });
        setCorrelationResults(filtered.slice(0, 6));
      } else {
        setCorrelationResults([]);
      }
    } catch {
      setCorrelationResults([]);
    } finally {
      setCorrelationsLoading(false);
    }
  }, []);

  // Debounced execution for network searches
  useEffect(() => {
    if (algoliaDebounceRef.current) clearTimeout(algoliaDebounceRef.current);
    if (corrDebounceRef.current) clearTimeout(corrDebounceRef.current);

    if (!query.trim()) {
      setAppResults([]);
      setDocResults([]);
      setPublicWorkflowResults([]);
      setCorrelationResults([]);
      setAlgoliaLoading(false);
      setCorrelationsLoading(false);
      return;
    }

    algoliaDebounceRef.current = setTimeout(() => searchAlgolia(query), 150);
    corrDebounceRef.current = setTimeout(() => searchCorrelations(query), 300);

    return () => {
      if (algoliaDebounceRef.current) clearTimeout(algoliaDebounceRef.current);
      if (corrDebounceRef.current) clearTimeout(corrDebounceRef.current);
    };
  }, [query, searchAlgolia, searchCorrelations]);

  // Flattened results for keyboard navigation
  const results = useMemo(() => {
    const list = [
      ...filteredNavItems,
      ...matchedOrgWorkflows,
      ...publicWorkflowResults.map((w) => ({ type: 'public_workflow', workflow: w })),
      ...appResults.map((app) => ({ type: 'app', app })),
      ...docResults.map((d) => ({ type: 'doc', doc: d })),
      ...correlationResults.map((c) => ({ type: 'correlation', correlation: c })),
    ];

    if (query.trim()) {
      list.push({ type: 'see_all', query: query.trim() });
    }

    return list;
  }, [
    filteredNavItems,
    matchedOrgWorkflows,
    publicWorkflowResults,
    appResults,
    docResults,
    correlationResults,
    query,
  ]);

  // Dispatch item selection with symmetrical cross-platform handoff
  const handleSelect = useCallback(
    (result) => {
      handleOpenChange(false);

      if (result.type === 'nav') {
        const targetPlatform = result.platform;
        if (targetPlatform === 'security') {
          navigateToShuffleSecurity(result.path, { newTab: true });
        } else {
          navigate(result.path);
        }
      } else if (result.type === 'app') {
        navigate(`/apps?app=${encodeURIComponent(result.app.name)}`);
      } else if (result.type === 'org_workflow') {
        navigate(`/workflows/${result.workflow.id}`);
      } else if (result.type === 'public_workflow') {
        navigate(`/workflows/${result.workflow.id}`);
      } else if (result.type === 'doc') {
        navigate(result.doc.path || `/docs/${result.doc.slug}`);
      } else if (result.type === 'correlation') {
        const incidentRef = result.correlation.ref?.find((r) =>
          r.includes('shuffle-security_incidents'),
        );
        const key = incidentRef
          ? incidentRef.includes('|')
            ? incidentRef.split('|').pop()
            : incidentRef.split('/').pop()
          : result.correlation.key;
        if (key) {
          navigateToShuffleSecurity(`/incidents/${key}`, { newTab: true });
        }
      } else if (result.type === 'see_all') {
        navigate(`/search?q=${encodeURIComponent(result.query)}`);
      }
    },
    [handleOpenChange, navigate],
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (query.trim()) {
        handleSelect({ type: 'see_all', query: query.trim() });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleOpenChange(false);
    }
  };

  const isAnyLoading = algoliaLoading || correlationsLoading;

  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#1a1b1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#2e3035' : '#e5e7eb';
  const itemHoverBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const primaryColor = '#f86a3e';

  return (
    <Dialog
      open={Boolean(open)}
      onClose={() => handleOpenChange(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          width: 520,
          maxWidth: 'calc(100vw - 32px)',
          minHeight: 380,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 20px 40px rgba(0, 0, 0, 0.6)'
            : '0 20px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 13500,
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Search Input Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${borderColor}`,
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <SearchIcon sx={{ color: mutedColor, fontSize: 18, flexShrink: 0 }} />
          <InputBase
            inputRef={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search workflows, apps, docs, incidents, or jump to page..."
            fullWidth
            autoFocus
            sx={{
              color: textColor,
              fontSize: '14px',
              fontFamily: 'inherit',
              '& input::placeholder': {
                color: mutedColor,
                opacity: 0.8,
              },
            }}
          />
          {isAnyLoading && (
            <CircularProgress size={16} sx={{ color: primaryColor, flexShrink: 0 }} />
          )}
          <Box
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: '4px',
              border: `1px solid ${borderColor}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              color: mutedColor,
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ESC
          </Box>
        </Box>

        {/* Results Container */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
          {results.length === 0 && !isAnyLoading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: mutedColor }}>
                No results found for &ldquo;{query}&rdquo;
              </Typography>
              <Typography variant="caption" sx={{ color: mutedColor, opacity: 0.7, mt: 0.5, display: 'block' }}>
                Try searching for playbooks, integrations, CVEs, or documentation.
              </Typography>
            </Box>
          )}

          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;

            // Render Nav Result
            if (item.type === 'nav') {
              const isCrossPlatform = item.platform === 'security';
              return (
                <Box
                  key={`nav-${item.path}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? itemHoverBg : 'transparent',
                    border: isSelected ? `1px solid ${primaryColor}66` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box sx={{ color: mutedColor, display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: textColor }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isCrossPlatform && (
                      <Box
                        sx={{
                          px: 0.75,
                          py: 0.1,
                          borderRadius: '4px',
                          fontSize: 10,
                          fontWeight: 600,
                          border: `1px solid ${borderColor}`,
                          color: mutedColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        Security
                        <ExternalLinkIcon sx={{ fontSize: 10 }} />
                      </Box>
                    )}
                    <Typography variant="caption" sx={{ fontSize: 11, color: mutedColor }}>
                      {item.group}
                    </Typography>
                  </Box>
                </Box>
              );
            }

            // Render Org Workflow
            if (item.type === 'org_workflow') {
              return (
                <Box
                  key={`org-wf-${item.workflow.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? itemHoverBg : 'transparent',
                    border: isSelected ? `1px solid ${primaryColor}66` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <FolderIcon sx={{ fontSize: 16, color: primaryColor, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.workflow.name}
                      </Typography>
                      {item.workflow.description && (
                        <Typography variant="caption" sx={{ color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {item.workflow.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontWeight: 700,
                      border: `1px solid ${borderColor}`,
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      color: textColor,
                      flexShrink: 0,
                      ml: 1,
                    }}
                  >
                    Org
                  </Box>
                </Box>
              );
            }

            // Render Public Workflow Template
            if (item.type === 'public_workflow') {
              return (
                <Box
                  key={`pub-wf-${item.workflow.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? itemHoverBg : 'transparent',
                    border: isSelected ? `1px solid ${primaryColor}66` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <CompassIcon sx={{ fontSize: 16, color: mutedColor, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.workflow.name}
                      </Typography>
                      {item.workflow.description && (
                        <Typography variant="caption" sx={{ color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {item.workflow.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontWeight: 700,
                      border: `1px solid ${primaryColor}4d`,
                      background: `${primaryColor}1a`,
                      color: primaryColor,
                      flexShrink: 0,
                      ml: 1,
                    }}
                  >
                    Community
                  </Box>
                </Box>
              );
            }

            // Render App / Integration
            if (item.type === 'app') {
              return (
                <Box
                  key={`app-${item.app.objectID}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? itemHoverBg : 'transparent',
                    border: isSelected ? `1px solid ${primaryColor}66` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    {item.app.image_url ? (
                      <Box
                        component="img"
                        src={item.app.image_url}
                        alt=""
                        sx={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }}
                      />
                    ) : (
                      <CodeIcon sx={{ fontSize: 16, color: mutedColor, flexShrink: 0 }} />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.app.name}
                      </Typography>
                      {item.app.description && (
                        <Typography variant="caption" sx={{ color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {item.app.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1px solid ${borderColor}`,
                      color: mutedColor,
                      flexShrink: 0,
                      ml: 1,
                    }}
                  >
                    App
                  </Box>
                </Box>
              );
            }

            // Render Doc Result
            if (item.type === 'doc') {
              return (
                <Box
                  key={`doc-${item.doc.slug}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? itemHoverBg : 'transparent',
                    border: isSelected ? `1px solid ${primaryColor}66` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <BookIcon sx={{ fontSize: 16, color: mutedColor, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.doc.label}
                      </Typography>
                      {item.doc.snippet && (
                        <Typography variant="caption" sx={{ color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {item.doc.snippet}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1px solid ${borderColor}`,
                      color: mutedColor,
                      flexShrink: 0,
                      ml: 1,
                    }}
                  >
                    Doc
                  </Box>
                </Box>
              );
            }

            // Render Correlation Result
            if (item.type === 'correlation') {
              return (
                <Box
                  key={`corr-${item.correlation.key}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? itemHoverBg : 'transparent',
                    border: isSelected ? `1px solid ${primaryColor}66` : '1px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <SecurityIcon sx={{ fontSize: 16, color: primaryColor, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {item.correlation.key}
                      </Typography>
                      <Typography variant="caption" sx={{ color: mutedColor }}>
                        Matches {item.correlation.amount} incident{item.correlation.amount === 1 ? '' : 's'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontWeight: 700,
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      flexShrink: 0,
                      ml: 1,
                    }}
                  >
                    Incident
                  </Box>
                </Box>
              );
            }

            // Render See All Results
            if (item.type === 'see_all') {
              return (
                <Box
                  key={`see-all-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5,
                    py: 1.25,
                    mt: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    borderTop: `1px solid ${borderColor}`,
                    background: isSelected ? itemHoverBg : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SearchIcon sx={{ fontSize: 14, color: primaryColor }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: primaryColor }}>
                      Search all results for &ldquo;{item.query}&rdquo;
                    </Typography>
                  </Box>
                  <ArrowRightIcon sx={{ fontSize: 14, color: primaryColor }} />
                </Box>
              );
            }

            return null;
          })}
        </Box>

        {/* Footer shortcuts */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderTop: `1px solid ${borderColor}`,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ px: 0.5, py: 0.1, borderRadius: '3px', border: `1px solid ${borderColor}`, fontSize: 10, fontFamily: 'monospace' }}>↑</Box>
              <Box sx={{ px: 0.5, py: 0.1, borderRadius: '3px', border: `1px solid ${borderColor}`, fontSize: 10, fontFamily: 'monospace' }}>↓</Box>
              <Typography variant="caption" sx={{ fontSize: 11, color: mutedColor }}>Navigate</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ px: 0.5, py: 0.1, borderRadius: '3px', border: `1px solid ${borderColor}`, fontSize: 10, fontFamily: 'monospace' }}>↵</Box>
              <Typography variant="caption" sx={{ fontSize: 11, color: mutedColor }}>Select</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ fontSize: 11, color: mutedColor }}>
            Shuffle Unified Search
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchDialog;
