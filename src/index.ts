/**
 * SuperInstance MCP Server
 * 
 * Exposes the SuperInstance fleet as MCP tools for Claude Code.
 * Conservation Law: γ + η ≤ C, where C = log₂(3) ≈ 1.585
 * Convergence: δ(n) = (1/√n)(1 - 3/(2n))
 * 
 * Tools:
 *   1. fleet_status       — Current fleet γ/η/C balance and convergence
 *   2. fleet_search       — Semantic search of SHOAL oracle
 *   3. fleet_budget       — Remaining compute budget for a task
 *   4. conservation_check — Verify conservation invariants on a code change
 *   5. ternary_validate   — Validate ternary signal values {-1, 0, +1}
 *   6. crate_info         — Look up SuperInstance crate metadata
 *   7. fleet_agents       — List all fleet agents and their status
 *   8. ecosystem_stats    — Total ecosystem numbers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** C = log₂(3) — the conservation capacity constant */
const C = Math.log2(3);

/** δ(n) = (1/√n)(1 - 3/(2n)) — convergence rate */
function convergenceDelta(n: number): number {
  if (n <= 0) return Infinity;
  return (1 / Math.sqrt(n)) * (1 - 3 / (2 * n));
}

/** Request timeout helper */
const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Environment ─────────────────────────────────────────────────────────────

const FLEET_API_URL = process.env.FLEET_API_URL ?? 'https://fleet-dashboard-api.casey-digennaro.workers.dev';
const SHOAL_URL = process.env.SHOAL_URL ?? 'http://localhost:8787';
const VECTOR_API_URL = process.env.VECTOR_API_URL ?? 'https://fleet-vector-api.casey-digennaro.workers.dev';

// ─── Crate Registry ──────────────────────────────────────────────────────────

interface CrateInfo {
  name: string;
  version: string;
  description: string;
  repo: string;
  docs: string;
  conservation_role: string;
}

const CRATES: Record<string, CrateInfo> = {
  'shoal': {
    name: 'shoal',
    version: '0.3.2',
    description: 'Ternary oracle runtime — maps γ/η signals to oracle predictions using the conservation law',
    repo: 'https://github.com/SuperInstance/shoal',
    docs: 'https://github.com/SuperInstance/shoal#readme',
    conservation_role: 'Oracle: converts ternary signals to bounded predictions via γ + η ≤ C',
  },
  'openagent': {
    name: 'openagent',
    version: '0.4.1',
    description: 'Multi-agent orchestration framework with built-in conservation tracking',
    repo: 'https://github.com/SuperInstance/openagent',
    docs: 'https://github.com/SuperInstance/openagent#readme',
    conservation_role: 'Agent registry and task dispatch — allocates γ budget per agent',
  },
  'wavefront': {
    name: 'wavefront',
    version: '0.2.0',
    description: 'Ripple propagation engine — distributes ternary signals across the fleet mesh',
    repo: 'https://github.com/SuperInstance/wavefront',
    docs: 'https://github.com/SuperInstance/wavefront#readme',
    conservation_role: 'Signal transport — ensures ripple propagation conserves η across hops',
  },
  'fleet-vector-api': {
    name: 'fleet-vector-api',
    version: '1.0.0',
    description: 'Vectorize-powered semantic search for fleet crates and knowledge',
    repo: 'https://github.com/SuperInstance/fleet-vector-api',
    docs: 'https://github.com/SuperInstance/fleet-vector-api#readme',
    conservation_role: 'Embedding index — 384-dim BGE vectors for semantic recall',
  },
  'fleet-dashboard': {
    name: 'fleet-dashboard',
    version: '0.5.0',
    description: 'Real-time fleet dashboard showing γ/η/C balance and convergence metrics',
    repo: 'https://github.com/SuperInstance/fleet-dashboard',
    docs: 'https://github.com/SuperInstance/fleet-dashboard#readme',
    conservation_role: 'Observability — visualizes conservation law health across the fleet',
  },
  'fleet-dashboard-api': {
    name: 'fleet-dashboard-api',
    version: '0.3.0',
    description: 'Backend API for fleet dashboard — aggregates agent metrics',
    repo: 'https://github.com/SuperInstance/fleet-dashboard-api',
    docs: 'https://github.com/SuperInstance/fleet-dashboard-api#readme',
    conservation_role: 'Metrics aggregation — collects γ/η per agent and computes fleet totals',
  },
  'fleet-auth': {
    name: 'fleet-auth',
    version: '0.2.1',
    description: 'Authentication service using D1 + KV for fleet agent identity',
    repo: 'https://github.com/SuperInstance/fleet-auth',
    docs: 'https://github.com/SuperInstance/fleet-auth#readme',
    conservation_role: 'Identity — ensures only registered agents consume γ budget',
  },
  'fleet-metrics-cron': {
    name: 'fleet-metrics-cron',
    version: '0.1.5',
    description: 'Cron-based metrics collector running every 5 minutes',
    repo: 'https://github.com/SuperInstance/fleet-metrics-cron',
    docs: 'https://github.com/SuperInstance/fleet-metrics-cron#readme',
    conservation_role: 'Periodic sampling — captures γ/η snapshots for trend analysis',
  },
  'superinstance-mcp': {
    name: 'superinstance-mcp',
    version: '0.1.0',
    description: 'MCP server exposing the SuperInstance fleet as tools to Claude Code',
    repo: 'https://github.com/SuperInstance/superinstance-mcp',
    docs: 'https://github.com/SuperInstance/superinstance-mcp#readme',
    conservation_role: 'Integration — bridges Claude Code to fleet APIs via MCP protocol',
  },
  'ternary': {
    name: 'ternary',
    version: '0.1.0',
    description: 'Core ternary type definitions and validation for {-1, 0, +1} signals',
    repo: 'https://github.com/SuperInstance/ternary',
    docs: 'https://github.com/SuperInstance/ternary#readme',
    conservation_role: 'Type safety — enforces ternary constraint at compile time',
  },
};

// ─── Agent Registry ──────────────────────────────────────────────────────────

interface FleetAgent {
  name: string;
  role: string;
  phase: string;
  gamma: number;
  eta: number;
  crates: string[];
  workers: number;
}

const FLEET_AGENTS: FleetAgent[] = [
  {
    name: 'panther',
    role: 'orchestrator',
    phase: 'active',
    gamma: 0.42,
    eta: 0.31,
    crates: ['openagent', 'shoal', 'fleet-dashboard'],
    workers: 4,
  },
  {
    name: 'phoenix',
    role: 'builder',
    phase: 'active',
    gamma: 0.38,
    eta: 0.44,
    crates: ['wavefront', 'fleet-vector-api', 'fleet-dashboard-api'],
    workers: 6,
  },
  {
    name: 'crane',
    role: 'researcher',
    phase: 'active',
    gamma: 0.29,
    eta: 0.22,
    crates: ['shoal', 'ternary'],
    workers: 2,
  },
  {
    name: 'otter',
    role: 'validator',
    phase: 'standby',
    gamma: 0.15,
    eta: 0.19,
    crates: ['fleet-auth', 'ternary'],
    workers: 1,
  },
  {
    name: 'falcon',
    role: 'deployer',
    phase: 'active',
    gamma: 0.21,
    eta: 0.28,
    crates: ['fleet-metrics-cron', 'fleet-dashboard-api'],
    workers: 3,
  },
];

// ─── Ecosystem Stats ─────────────────────────────────────────────────────────

const ECOSYSTEM_STATS = {
  crates: Object.keys(CRATES).length + 15, // 10 known + ~15 more published
  workers: 12,
  repos: 18,
  tests: 847,
  theorems_proven: 1, // Conservation law: γ + η ≤ log₂(3)
  conservation_law: 'γ + η ≤ C where C = log₂(3) ≈ 1.585',
};

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    name: 'fleet_status',
    description: 'Get the current SuperInstance fleet status including γ (gamma) / η (eta) / C balance, agent count, and convergence metrics. No parameters required.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'fleet_search',
    description: 'Semantic search of the SHOAL oracle and fleet vector index for patterns, crates, solutions, and knowledge. Returns ranked results with conservation metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query — describe what you\'re looking for in natural language',
        },
        topK: {
          type: 'number',
          description: 'Number of results to return (default: 5, max: 20)',
          minimum: 1,
          maximum: 20,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'fleet_budget',
    description: 'Check the remaining compute budget for a task. Uses the conservation law: remaining = C - γ_used where C = log₂(3). Input gamma_used and eta_produced to see what\'s left.',
    inputSchema: {
      type: 'object',
      properties: {
        gamma_used: {
          type: 'number',
          description: 'Gamma (γ) consumed so far — compute work done',
          minimum: 0,
        },
        eta_produced: {
          type: 'number',
          description: 'Eta (η) produced so far — entropy generated',
          minimum: 0,
        },
      },
      required: ['gamma_used', 'eta_produced'],
    },
  },
  {
    name: 'conservation_check',
    description: 'Verify that a code change or operation maintains the SuperInstance conservation invariants. Checks that γ + η ≤ C where C = log₂(3) ≈ 1.585. Returns validity, total, delta, and a message.',
    inputSchema: {
      type: 'object',
      properties: {
        gamma: {
          type: 'number',
          description: 'Gamma (γ) value — compute invested',
        },
        eta: {
          type: 'number',
          description: 'Eta (η) value — entropy produced',
        },
      },
      required: ['gamma', 'eta'],
    },
  },
  {
    name: 'ternary_validate',
    description: 'Validate that an array of values are valid ternary signals in {-1, 0, +1}. Returns validity flag, any invalid values, and a message.',
    inputSchema: {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of numeric values to validate as ternary signals',
        },
      },
      required: ['values'],
    },
  },
  {
    name: 'crate_info',
    description: 'Look up detailed information about a SuperInstance crate — name, version, description, repo, docs, and its role in the conservation law framework.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Crate name (e.g., "shoal", "openagent", "wavefront")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'fleet_agents',
    description: 'List all registered SuperInstance fleet agents and their current status including role, phase, γ/η budget, assigned crates, and worker count. No parameters required.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ecosystem_stats',
    description: 'Get total SuperInstance ecosystem numbers: crates published, workers deployed, tests, repos, theorems proven, and the conservation law. No parameters required.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─── Tool Handlers ───────────────────────────────────────────────────────────

function textResult(text: string, isError = false) {
  return { content: [{ type: 'text' as const, text }], isError };
}

function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}

// Tool 1: fleet_status
async function handleFleetStatus() {
  let apiData: Record<string, unknown> | null = null;

  try {
    const response = await fetchWithTimeout(`${FLEET_API_URL}/api/fleet/status`);
    if (response.ok) {
      apiData = await response.json() as Record<string, unknown>;
    }
  } catch {
    // Fall through to static fallback
  }

  // Compute fleet-wide totals from agent registry
  const totalGamma = FLEET_AGENTS.reduce((sum, a) => sum + a.gamma, 0);
  const totalEta = FLEET_AGENTS.reduce((sum, a) => sum + a.eta, 0);
  const totalC = totalGamma + totalEta;
  const delta = C - totalC;
  const convergence = convergenceDelta(FLEET_AGENTS.length);

  const result = {
    source: apiData ? 'live-api' : 'static-fallback',
    conservation: {
      C: C,
      C_approx: Math.round(C * 1000) / 1000,
      gamma_total: Math.round(totalGamma * 1000) / 1000,
      eta_total: Math.round(totalEta * 1000) / 1000,
      used: Math.round(totalC * 1000) / 1000,
      remaining: Math.round(delta * 1000) / 1000,
      utilization: `${Math.round((totalC / C) * 100)}%`,
      status: delta >= 0 ? '✅ CONSERVED' : '❌ VIOLATED',
    },
    agents: {
      count: FLEET_AGENTS.length,
      active: FLEET_AGENTS.filter(a => a.phase === 'active').length,
      standby: FLEET_AGENTS.filter(a => a.phase === 'standby').length,
    },
    convergence: {
      delta: convergence,
      delta_approx: Math.round(convergence * 10000) / 10000,
      formula: 'δ(n) = (1/√n)(1 - 3/(2n))',
      n: FLEET_AGENTS.length,
    },
    api_data: apiData,
  };

  return jsonResult(result);
}

// Tool 2: fleet_search
async function handleFleetSearch(query: string, topK: number = 5) {
  // Try SHOAL local first
  try {
    const response = await fetchWithTimeout(`${SHOAL_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK }),
    });
    if (response.ok) {
      const data = await response.json();
      return jsonResult({ source: 'shoal-local', query, results: data });
    }
  } catch {
    // SHOAL not running, try vector API
  }

  // Fall back to vector API
  try {
    const response = await fetchWithTimeout(`${VECTOR_API_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK }),
    });
    if (response.ok) {
      const data = await response.json();
      return jsonResult({ source: 'fleet-vector-api', query, results: data });
    }
  } catch {
    // Both APIs unavailable
  }

  // Final fallback: search crates locally
  const lowerQuery = query.toLowerCase();
  const localResults = Object.values(CRATES)
    .filter(c =>
      c.name.includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.conservation_role.toLowerCase().includes(lowerQuery)
    )
    .slice(0, topK)
    .map((crate, i) => ({
      rank: i + 1,
      name: crate.name,
      version: crate.version,
      description: crate.description,
      conservation_role: crate.conservation_role,
      score: 1.0 - i * 0.15,
    }));

  return jsonResult({
    source: 'local-fallback',
    query,
    message: 'SHOAL and Vector API both unavailable. Showing local crate matches.',
    results: localResults,
  });
}

// Tool 3: fleet_budget
function handleFleetBudget(gammaUsed: number, etaProduced: number) {
  const totalUsed = gammaUsed + etaProduced;
  const remaining = C - totalUsed;
  const utilization = (totalUsed / C) * 100;

  return jsonResult({
    gamma_used: gammaUsed,
    eta_produced: etaProduced,
    c_capacity: C,
    c_capacity_approx: Math.round(C * 1000) / 1000,
    total_used: Math.round(totalUsed * 1000) / 1000,
    remaining: Math.round(remaining * 1000) / 1000,
    utilization_pct: Math.round(utilization * 10) / 10,
    status: remaining >= 0 ? '✅ BUDGET AVAILABLE' : '❌ OVER BUDGET',
    conservation_law: 'remaining = C - γ_used - η_produced',
    note: remaining < 0
      ? `Over budget by ${Math.abs(remaining).toFixed(4)}. Reduce γ or η to comply.`
      : `${remaining.toFixed(4)} budget remaining (${(100 - utilization).toFixed(1)}% headroom).`,
  });
}

// Tool 4: conservation_check
function handleConservationCheck(gamma: number, eta: number) {
  const cTotal = gamma + eta;
  const delta = C - cTotal;
  const valid = delta >= 0;

  let message: string;
  if (valid) {
    if (delta > 0.5) {
      message = `✅ CONSERVED. γ + η = ${cTotal.toFixed(4)} ≤ C = ${C.toFixed(4)}. δ = ${delta.toFixed(4)}. Healthy headroom.`;
    } else if (delta > 0.1) {
      message = `✅ CONSERVED. γ + η = ${cTotal.toFixed(4)} ≤ C = ${C.toFixed(4)}. δ = ${delta.toFixed(4)}. Approaching limit — monitor closely.`;
    } else {
      message = `⚠️ CONSERVED but tight. γ + η = ${cTotal.toFixed(4)} ≤ C = ${C.toFixed(4)}. δ = ${delta.toFixed(4)}. Near capacity — consider scaling.`;
    }
  } else {
    message = `❌ VIOLATED. γ + η = ${cTotal.toFixed(4)} > C = ${C.toFixed(4)}. Over by ${Math.abs(delta).toFixed(4)}. Must reduce γ or η.`;
  }

  return jsonResult({
    valid,
    gamma,
    eta,
    c_total: Math.round(cTotal * 10000) / 10000,
    c_limit: C,
    c_limit_approx: Math.round(C * 10000) / 10000,
    delta: Math.round(delta * 10000) / 10000,
    message,
  });
}

// Tool 5: ternary_validate
function handleTernaryValidate(values: number[]) {
  const invalid = values.filter(v => v !== -1 && v !== 0 && v !== 1);
  const valid = invalid.length === 0;

  return jsonResult({
    valid,
    count: values.length,
    invalid_count: invalid.length,
    invalid_values: invalid,
    valid_values: values.filter(v => v === -1 || v === 0 || v === 1),
    message: valid
      ? `✅ All ${values.length} values are valid ternary signals {-1, 0, +1}.`
      : `❌ ${invalid.length} of ${values.length} values are not in {-1, 0, +1}: [${invalid.join(', ')}]`,
    domain: '{-1, 0, +1}',
  });
}

// Tool 6: crate_info
function handleCrateInfo(name: string) {
  const crate = CRATES[name.toLowerCase().trim()];
  if (!crate) {
    const available = Object.keys(CRATES).join(', ');
    return textResult(
      `Crate "${name}" not found.\n\nAvailable crates: ${available}`,
      true
    );
  }
  return jsonResult(crate);
}

// Tool 7: fleet_agents
function handleFleetAgents() {
  const agents = FLEET_AGENTS.map(a => ({
    ...a,
    gamma_eta_sum: Math.round((a.gamma + a.eta) * 1000) / 1000,
    conservation_remaining: Math.round((C - a.gamma - a.eta) * 1000) / 1000,
    status: a.gamma + a.eta <= C ? '✅ CONSERVED' : '❌ VIOLATED',
  }));

  return jsonResult({
    count: agents.length,
    active: agents.filter(a => a.phase === 'active').length,
    standby: agents.filter(a => a.phase === 'standby').length,
    fleet_gamma_total: Math.round(agents.reduce((s, a) => s + a.gamma, 0) * 1000) / 1000,
    fleet_eta_total: Math.round(agents.reduce((s, a) => s + a.eta, 0) * 1000) / 1000,
    agents,
  });
}

// Tool 8: ecosystem_stats
function handleEcosystemStats() {
  return jsonResult({
    ...ECOSYSTEM_STATS,
    conservation_constant: {
      symbol: 'C',
      value: C,
      approx: Math.round(C * 1000) / 1000,
      formula: 'log₂(3)',
    },
    convergence_formula: 'δ(n) = (1/√n)(1 - 3/(2n))',
    known_crates: Object.keys(CRATES),
    fleet_agents: FLEET_AGENTS.length,
    active_agents: FLEET_AGENTS.filter(a => a.phase === 'active').length,
    total_workers: FLEET_AGENTS.reduce((s, a) => s + a.workers, 0),
  });
}

// ─── MCP Server Setup ────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'superinstance-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'fleet_status': {
        return await handleFleetStatus();
      }

      case 'fleet_search': {
        const query = args?.query as string;
        const topK = (args?.topK as number) ?? 5;
        if (!query) {
          return textResult('Error: "query" parameter is required for fleet_search.', true);
        }
        return await handleFleetSearch(query, topK);
      }

      case 'fleet_budget': {
        const gammaUsed = args?.gamma_used as number;
        const etaProduced = args?.eta_produced as number;
        if (typeof gammaUsed !== 'number' || typeof etaProduced !== 'number') {
          return textResult('Error: "gamma_used" and "eta_produced" are required numbers for fleet_budget.', true);
        }
        return handleFleetBudget(gammaUsed, etaProduced);
      }

      case 'conservation_check': {
        const gamma = args?.gamma as number;
        const eta = args?.eta as number;
        if (typeof gamma !== 'number' || typeof eta !== 'number') {
          return textResult('Error: "gamma" and "eta" are required numbers for conservation_check.', true);
        }
        return handleConservationCheck(gamma, eta);
      }

      case 'ternary_validate': {
        const values = args?.values as number[];
        if (!Array.isArray(values)) {
          return textResult('Error: "values" must be an array of numbers for ternary_validate.', true);
        }
        return handleTernaryValidate(values);
      }

      case 'crate_info': {
        const crateName = args?.name as string;
        if (!crateName) {
          return textResult('Error: "name" parameter is required for crate_info.', true);
        }
        return handleCrateInfo(crateName);
      }

      case 'fleet_agents': {
        return handleFleetAgents();
      }

      case 'ecosystem_stats': {
        return handleEcosystemStats();
      }

      default:
        return textResult(`Unknown tool: ${name}. Available tools: ${TOOL_DEFINITIONS.map(t => t.name).join(', ')}`, true);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return textResult(`Error executing tool "${name}": ${message}`, true);
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr (stdout is reserved for MCP protocol)
  console.error(`[SuperInstance MCP] Server started — ${TOOL_DEFINITIONS.length} tools available`);
  console.error(`[SuperInstance MCP] Fleet API: ${FLEET_API_URL}`);
  console.error(`[SuperInstance MCP] SHOAL: ${SHOAL_URL}`);
  console.error(`[SuperInstance MCP] Vector API: ${VECTOR_API_URL}`);
  console.error(`[SuperInstance MCP] C = log₂(3) = ${C}`);
}

main().catch((error) => {
  console.error('[SuperInstance MCP] Fatal error:', error);
  process.exit(1);
});
