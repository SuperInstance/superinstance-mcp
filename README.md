# SuperInstance MCP Server

> **Turn any MCP-compatible AI assistant into a fleet-aware agent.**
>
> The SuperInstance MCP Server exposes the entire SuperInstance fleet — conservation law governance, semantic search, compute budgeting, agent registry, and ecosystem metadata — through 8 Model Context Protocol tools. Any MCP client (Claude Code, Cursor, Windsurf, custom agents) can query and respect the conservation law: **γ + η ≤ C where C = log₂(3) ≈ 1.585**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org)
[![Conservation Law](https://img.shields.io/badge/Physics-%CE%B3%20%2B%20%CE%B7%20%E2%89%A4%20C-gold.svg)](https://github.com/SuperInstance/superinstance-mcp)

---

## Table of Contents

- [What This Is](#what-this-is)
- [Quick Start](#quick-start)
- [Installation](#installation)
  - [Claude Code (Global)](#claude-code-global)
  - [Claude Code (Per-Project)](#claude-code-per-project)
  - [Cursor](#cursor)
  - [Windsurf](#windsurf)
  - [Custom MCP Client](#custom-mcp-client)
  - [Manual Installation](#manual-installation)
- [Tools Reference](#tools-reference)
  - [1. fleet\_status](#1-fleet_status)
  - [2. fleet\_search](#2-fleet_search)
  - [3. fleet\_budget](#3-fleet_budget)
  - [4. conservation\_check](#4-conservation_check)
  - [5. ternary\_validate](#5-ternary_validate)
  - [6. crate\_info](#6-crate_info)
  - [7. fleet\_agents](#7-fleet_agents)
  - [8. ecosystem\_stats](#8-ecosystem_stats)
- [Conservation Law Primer](#conservation-law-primer)
- [Architecture](#architecture)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Connecting to Live Services](#connecting-to-live-services)
- [Integration Guide](#integration-guide)
  - [Pattern 1: Conservation-Aware Code Review](#pattern-1-conservation-aware-code-review)
  - [Pattern 2: Fleet Budget Enforcement](#pattern-2-fleet-budget-enforcement)
  - [Pattern 3: Semantic Knowledge Retrieval](#pattern-3-semantic-knowledge-retrieval)
  - [Pattern 4: Ternary Signal Validation in CI](#pattern-4-ternary-signal-validation-in-ci)
  - [Pattern 5: Multi-Agent Fleet Coordination](#pattern-5-multi-agent-fleet-coordination)
- [Building Your Own Tools](#building-your-own-tools)
- [Deployment](#deployment)
  - [Local Development](#local-development)
  - [Docker](#docker)
  - [Cloudflare Worker (Remote MCP)](#cloudflare-worker-remote-mcp)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Ecosystem](#ecosystem)
- [Contributing](#contributing)
- [License](#license)

---

## What This Is

The SuperInstance MCP Server is the **integration bridge** between AI coding assistants and the SuperInstance fleet operating system. It speaks the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) — the open standard that lets AI assistants discover and call external tools.

Once installed, your AI assistant can:

- 🔍 **Search the fleet's knowledge base** — 1,200+ indexed crates, patterns, and solutions via SHOAL semantic search
- 📊 **Check fleet health** — live γ/η/C conservation balance, convergence metrics, agent status
- 💰 **Enforce compute budgets** — every task is bounded by the conservation law
- ✅ **Validate code against invariants** — ternary signals, conservation bounds, agent constraints
- 📦 **Look up ecosystem crates** — versions, repos, conservation roles for 25+ published crates
- 🤖 **Inspect the agent registry** — all fleet agents, their phases, budgets, and assignments
- 📈 **Get ecosystem totals** — crates, workers, tests, repos at a glance

**The key insight:** This isn't just a tool server. It's a **governance layer**. Every tool enforces the conservation law γ + η ≤ C, meaning your AI assistant literally cannot propose actions that violate the physics of the system.

---

## Quick Start

```bash
# Clone
git clone https://github.com/SuperInstance/superinstance-mcp.git
cd superinstance-mcp

# Install
npm install

# Test the server starts
npx tsx src/index.ts
# → [SuperInstance MCP] Server started — 8 tools available

# Install globally for Claude Code
./install.sh
```

That's it. Restart Claude Code and the 8 fleet tools are available in every session.

---

## Installation

### Claude Code (Global)

Makes fleet tools available in **every** Claude Code session, regardless of project:

```bash
cd superinstance-mcp
./install.sh
```

This writes to `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"],
      "env": {
        "FLEET_API_URL": "https://fleet-dashboard-api.casey-digennaro.workers.dev",
        "SHOAL_URL": "http://localhost:8787",
        "VECTOR_API_URL": "https://fleet-vector-api.casey-digennaro.workers.dev"
      }
    }
  }
}
```

### Claude Code (Per-Project)

Add fleet tools to a specific project only. Place `.mcp.json` in the project root:

```bash
cp /path/to/superinstance-mcp/.mcp.json /your/project/.mcp.json
```

Claude Code auto-discovers `.mcp.json` in the working directory.

### Cursor

Add to Cursor's MCP settings (`Settings → MCP` or `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"],
      "env": {
        "FLEET_API_URL": "https://fleet-dashboard-api.casey-digennaro.workers.dev",
        "VECTOR_API_URL": "https://fleet-vector-api.casey-digennaro.workers.dev"
      }
    }
  }
}
```

### Windsurf

Add to Windsurf's MCP config (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

### Custom MCP Client

The server uses stdio transport. Any MCP-compatible client can connect:

```python
# Python example using mcp SDK
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="npx",
    args=["tsx", "/path/to/superinstance-mcp/src/index.ts"],
    env={
        "FLEET_API_URL": "https://fleet-dashboard-api.casey-digennaro.workers.dev",
    }
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # List available tools
        tools = await session.list_tools()
        # Call a tool
        result = await session.call_tool("fleet_status", {})
        print(result.content[0].text)
```

```go
// Go example using go-mcp
client, err := mcp.NewClient(mcp.NewStdioTransport(
    "npx", "tsx", "/path/to/superinstance-mcp/src/index.ts",
))
tools, err := client.ListTools(ctx)
result, err := client.CallTool(ctx, "conservation_check", map[string]any{
    "gamma": 0.8,
    "eta":   0.7,
})
```

### Manual Installation

```bash
# 1. Clone and build
git clone https://github.com/SuperInstance/superinstance-mcp.git
cd superinstance-mcp
npm install && npm run build

# 2. Verify
node dist/index.js
# → [SuperInstance MCP] Server started — 8 tools available

# 3. Point any MCP client at:
#    command: node
#    args: /path/to/superinstance-mcp/dist/index.js
```

---

## Tools Reference

### 1. `fleet_status`

Get the current fleet-wide conservation balance and convergence metrics.

**Parameters:** None

**Example Response:**
```json
{
  "source": "static-fallback",
  "conservation": {
    "C": 1.584962500721156,
    "C_approx": 1.585,
    "gamma_total": 1.45,
    "eta_total": 1.44,
    "used": 2.89,
    "remaining": -1.305,
    "utilization": "183%",
    "status": "❌ VIOLATED"
  },
  "agents": {
    "count": 5,
    "active": 4,
    "standby": 1
  },
  "convergence": {
    "delta": 0.3887,
    "delta_approx": 0.3887,
    "formula": "δ(n) = (1/√n)(1 - 3/(2n))",
    "n": 5
  }
}
```

**When to use:**
- At the start of a coding session to check fleet health
- Before spawning sub-agents to verify capacity exists
- After major operations to confirm conservation still holds
- In CI/CD to gate deploys on fleet status

---

### 2. `fleet_search`

Semantic search of the fleet's knowledge base — crates, patterns, prior solutions, architecture docs.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | ✅ | — | Natural language search |
| `topK` | number | ❌ | 5 | Results to return (1-20) |

**Example call:**
```json
{
  "query": "how does the conservation law relate to Shannon entropy",
  "topK": 3
}
```

**Data sources (tried in order):**
1. **SHOAL Oracle** (local, `SHOAL_URL`) — conservation-bounded semantic search
2. **Fleet Vector API** (Cloudflare) — 1,200+ indexed crates with 384-dim BGE embeddings
3. **Local fallback** — crate registry keyword match

**When to use:**
- "Has anyone solved this problem before in the fleet?"
- "What crate handles X?"
- "Show me patterns for Y"
- Before writing new code — check if a solution exists

---

### 3. `fleet_budget`

Check remaining compute budget under the conservation law.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gamma_used` | number | ✅ | Compute invested so far |
| `eta_produced` | number | ✅ | Entropy generated so far |

**Example call:**
```json
{
  "gamma_used": 0.8,
  "eta_produced": 0.6
}
```

**Example response:**
```json
{
  "gamma_used": 0.8,
  "eta_produced": 0.6,
  "c_capacity": 1.584962500721156,
  "total_used": 1.4,
  "remaining": 0.185,
  "utilization_pct": 88.3,
  "status": "✅ BUDGET AVAILABLE",
  "note": "0.185 budget remaining (11.7% headroom)."
}
```

**When to use:**
- Before starting a compute-heavy task
- When deciding whether to spawn another agent
- To track resource consumption across a multi-step workflow

---

### 4. `conservation_check`

Validate that an operation maintains the conservation invariant γ + η ≤ C.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gamma` | number | ✅ | Gamma (compute invested) |
| `eta` | number | ✅ | Eta (entropy produced) |

**Example call:**
```json
{ "gamma": 0.9, "eta": 0.5 }
```

**Possible responses:**

| δ = C − (γ + η) | Status | Meaning |
|------------------|--------|---------|
| δ > 0.5 | ✅ Healthy | Plenty of headroom |
| 0.1 < δ ≤ 0.5 | ✅ Monitor | Approaching limit |
| 0 < δ ≤ 0.1 | ⚠️ Tight | Near capacity |
| δ ≤ 0 | ❌ Violated | Over budget |

**When to use:**
- After any code change that affects fleet coupling
- As a pre-commit check
- When validating agent task assignments
- In CI pipelines as a gate

---

### 5. `ternary_validate`

Check that an array of values are valid ternary signals in {-1, 0, +1}.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `values` | number[] | ✅ | Values to validate |

**Example:**
```json
{ "values": [1, -1, 0, 1, 0, -1, 0.5] }
```

**Response:**
```json
{
  "valid": false,
  "count": 7,
  "invalid_count": 1,
  "invalid_values": [0.5],
  "message": "❌ 1 of 7 values are not in {-1, 0, +1}: [0.5]"
}
```

**When to use:**
- Validating signal processing code inputs
- Checking agent decision outputs
- Testing fleet communication protocols
- Verifying data before writing to ternary storage

---

### 6. `crate_info`

Look up detailed metadata for any SuperInstance crate.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | Crate name |

**Example:**
```json
{ "name": "shoal" }
```

**Response includes:** name, version, description, GitHub repo URL, docs URL, and the crate's specific role in the conservation framework.

**Available crates:** `shoal`, `openagent`, `wavefront`, `fleet-vector-api`, `fleet-dashboard`, `fleet-dashboard-api`, `fleet-auth`, `fleet-metrics-cron`, `superinstance-mcp`, `ternary`

---

### 7. `fleet_agents`

List all registered fleet agents and their current operational status.

**Parameters:** None

**Response per agent:**
```json
{
  "name": "phoenix",
  "role": "builder",
  "phase": "active",
  "gamma": 0.38,
  "eta": 0.44,
  "gamma_eta_sum": 0.82,
  "conservation_remaining": 0.765,
  "status": "✅ CONSERVED",
  "crates": ["wavefront", "fleet-vector-api", "fleet-dashboard-api"],
  "workers": 6
}
```

**Phases:** `active` (running tasks), `standby` (idle but registered), `incubate` (warming up), `sunset` (shutting down)

---

### 8. `ecosystem_stats`

Get aggregate numbers for the entire SuperInstance ecosystem.

**Parameters:** None

**Response:**
```json
{
  "crates": 25,
  "workers": 12,
  "repos": 18,
  "tests": 847,
  "theorems_proven": 1,
  "conservation_law": "γ + η ≤ C where C = log₂(3) ≈ 1.585",
  "conservation_constant": { "symbol": "C", "value": 1.585, "formula": "log₂(3)" },
  "convergence_formula": "δ(n) = (1/√n)(1 - 3/(2n))",
  "fleet_agents": 5,
  "active_agents": 4,
  "total_workers": 16
}
```

---

## Conservation Law Primer

The SuperInstance fleet operates on a principle borrowed from information theory:

### The Law

```
γ + η ≤ C    where C = log₂(3) ≈ 1.585 bits
```

| Symbol | Name | Meaning |
|--------|------|---------|
| γ (gamma) | Coupling cost | Compute invested in coordination — communication, synchronization, protocol overhead |
| η (eta) | Value | Useful entropy produced — actual work output, decisions made, artifacts built |
| C | Capacity | Total information capacity of the fleet, bounded by the ternary alphabet |

### Why log₂(3)?

The fleet uses **balanced ternary** signals {-1, 0, +1}. The information content of one ternary digit is:

```
C = log₂(3) = log(3)/log(2) ≈ 1.585 bits
```

This is **proven optimal** — ternary has 99.54% radix economy, closest possible integer base to *e* ≈ 2.718.

### The Shannon Chain Rule

The conservation law is literally the Shannon chain rule of information theory:

```
H(X) = I(X;G) + H(X|G)
```

Where:
- H(X) = C (total fleet entropy)
- I(X;G) = η (mutual information with goal = value produced)
- H(X|G) = γ (conditional entropy = coupling cost)

This is not a metaphor. The conservation law **is** information theory.

### Convergence Rate

As fleet size *n* grows, coordination overhead shrinks:

```
δ(n) = (1/√n)(1 − 3/(2n))
```

| n | δ(n) | Cancellation |
|---|------|-------------|
| 7 | 0.337 | 66.3% |
| 50 | 0.137 | 86.3% |
| 1,000 | 0.031 | 96.9% |
| 10,000 | 0.010 | 99.0% |

**Bigger fleets are proportionally cheaper to coordinate.** This is the scaling advantage.

### Further Reading

- [Conservation Entropy Theorem (860-line proof)](https://github.com/SuperInstance/superinstance-website/blob/main/papers/conservation-entropy-theorem.md)
- [Noether Derivation](https://github.com/SuperInstance/harness-experiments/blob/main/NOETHER_DERIVATION.md)
- [PID Fleet Governor](https://github.com/SuperInstance/harness-experiments/blob/main/PID_FLEET_GOVERNOR.md)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    MCP Client (AI Assistant)                      │
│         Claude Code · Cursor · Windsurf · Custom                  │
└──────────────────────────┬───────────────────────────────────────┘
                           │  MCP Protocol (JSON-RPC over stdio)
                           │
              ┌────────────▼────────────┐
              │   superinstance-mcp     │
              │   (TypeScript, 683 LOC) │
              │                         │
              │   ┌──────────────────┐  │
              │   │    8 MCP Tools   │  │
              │   │                  │  │
              │   │ • fleet_status   │  │
              │   │ • fleet_search   │  │
              │   │ • fleet_budget   │  │
              │   │ • consv_check    │  │
              │   │ • ternary_valid  │  │
              │   │ • crate_info     │  │
              │   │ • fleet_agents   │  │
              │   │ • ecosystem_stat │  │
              │   └──────────────────┘  │
              │                         │
              │   ┌──────────────────┐  │
              │   │  Static Fallback │  │
              │   │  (always works)  │  │
              │   └──────────────────┘  │
              └───────────┬─────────────┘
                          │  HTTP (5s timeout)
              ┌───────────┼───────────┐
              │           │           │
     ┌────────▼───┐ ┌─────▼────┐ ┌────▼──────────┐
     │  Fleet     │ │  SHOAL   │ │  Fleet Vector │
     │  Dashboard │ │  Oracle  │ │  API          │
     │  API       │ │          │ │               │
     │ (Worker)   │ │ (Worker) │ │  (Worker)     │
     └────────┬───┘ └─────┬────┘ └────┬──────────┘
              │           │           │
     ┌────────▼───────────▼───────────▼──────────┐
     │          Cloudflare Edge                   │
     │   D1 · KV · Vectorize · Workers AI · Q     │
     └────────────────────────────────────────────┘
```

**Key design principles:**

1. **Always works** — every tool has a static fallback if APIs are unreachable
2. **5-second timeout** — never blocks the AI assistant on slow networks
3. **Conservation-first** — every response includes conservation metadata
4. **Zero external runtime deps** — only `@modelcontextprotocol/sdk`
5. **Stdio transport** — works with any MCP-compatible client

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLEET_API_URL` | `https://fleet-dashboard-api.casey-digennaro.workers.dev` | Fleet dashboard API (Worker) |
| `SHOAL_URL` | `http://localhost:8787` | SHOAL semantic oracle (local dev or Worker) |
| `VECTOR_API_URL` | `https://fleet-vector-api.casey-digennaro.workers.dev` | Fleet vector search (Worker) |

### Connecting to Live Services

The MCP server gracefully degrades when services are unavailable:

```
fleet_search tries:
  1. SHOAL (local) → 2. Vector API (Cloudflare) → 3. Local crate registry

fleet_status tries:
  1. Fleet Dashboard API → 2. Static computation from agent registry

All other tools work offline with embedded data.
```

**To run SHOAL locally:**
```bash
cd /path/to/shoal
npx wrangler dev --port 8787
```

**To point at production:**
```json
{
  "env": {
    "SHOAL_URL": "https://shoal.casey-digennaro.workers.dev",
    "FLEET_API_URL": "https://fleet-dashboard-api.casey-digennaro.workers.dev"
  }
}
```

---

## Integration Guide

### Pattern 1: Conservation-Aware Code Review

Use the MCP tools in a Claude Code custom instruction or system prompt:

```markdown
## Fleet Rules
Before approving any PR:
1. Call `conservation_check` with the PR's γ (coupling changes) and η (entropy changes)
2. If conservation is violated (δ < 0), request changes
3. Call `ternary_validate` on any signal-processing code
4. Tag the PR with conservation status: ✅/⚠️/❌
```

### Pattern 2: Fleet Budget Enforcement

In a multi-agent workflow (e.g., openagent):

```python
# Before spawning a sub-agent, check budget
budget = await mcp.call_tool("fleet_budget", {
    "gamma_used": current_gamma,
    "eta_produced": current_eta
})

if budget["status"].startswith("✅"):
    spawn_agent(task)
else:
    queue_task(task)  # Wait for budget
```

### Pattern 3: Semantic Knowledge Retrieval

Before writing new code, search the fleet:

```
User: "I need to implement a rate limiter for the fleet API"

Claude Code (automatically):
  → fleet_search({ query: "rate limiter for fleet API" })
  → Finds: fleet-budget (D1 ledger), fleet-auth (KV rate limiting),
           circuit-breaker pattern from SEED crates
  → Uses found patterns instead of writing from scratch
```

### Pattern 4: Ternary Signal Validation in CI

Add to `.github/workflows/conservation.yml`:

```yaml
- name: Conservation invariant check
  run: |
    npx tsx -e "
    import { Client } from '@modelcontextprotocol/sdk/client/index.js'
    // Connect to MCP, run conservation_check on build artifacts
    // Fail CI if violated
    "
```

### Pattern 5: Multi-Agent Fleet Coordination

When using openagent or any multi-agent framework:

```
1. fleet_status() → check global γ/η balance
2. fleet_budget({ gamma_used, eta_produced }) → check if new agent fits
3. If yes: spawn agent, assign crate from fleet_agents()
4. Agent works, reports γ/η
5. conservation_check() → verify still within bounds
6. Repeat
```

---

## Building Your Own Tools

The MCP server is extensible. To add a new tool:

### Step 1: Define the tool

```typescript
// In src/index.ts, add to TOOL_DEFINITIONS:
{
  name: 'fleet_deploy',
  description: 'Deploy a Cloudflare Worker to the fleet. Returns deployment URL and conservation impact.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Worker name' },
      script: { type: 'string', description: 'Worker script content' },
    },
    required: ['name', 'script'],
  },
}
```

### Step 2: Implement the handler

```typescript
async function handleFleetDeploy(name: string, script: string) {
  // Estimate conservation impact
  const gammaCost = script.length / 10000;  // rough heuristic
  const etaGain = 0.1;  // new worker adds capacity

  const check = handleConservationCheck(gammaCost, etaGain);
  const checkData = JSON.parse(check.content[0].text);

  if (!checkData.valid) {
    return textResult(
      `Deployment rejected: conservation violation. ${checkData.message}`,
      true
    );
  }

  // Deploy via Cloudflare API...
  return jsonResult({ deployed: true, url: `https://${name}.workers.dev` });
}
```

### Step 3: Register in the switch

```typescript
case 'fleet_deploy': {
  const name = args?.name as string;
  const script = args?.script as string;
  return await handleFleetDeploy(name, script);
}
```

### Step 4: Test

```bash
npx tsx src/index.ts
# In another terminal, use mcp-inspector:
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

---

## Deployment

### Local Development

```bash
npm install
npm run dev    # tsx with watch mode
```

### Docker

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build
CMD ["node", "dist/index.js"]
```

```bash
docker build -t superinstance-mcp .
docker run -i superinstance-mcp
```

### Cloudflare Worker (Remote MCP)

For remote MCP (HTTP transport instead of stdio), deploy as a Worker:

```bash
npx wrangler deploy --name superinstance-mcp-remote
```

Then connect from any client:
```
URL: https://superinstance-mcp-remote.casey-digennaro.workers.dev
Transport: HTTP (StreamableHTTP)
```

---

## Testing

```bash
# Unit tests (when added)
npm test

# Integration test — verify server starts and responds
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  npx tsx src/index.ts 2>/dev/null

# MCP Inspector (interactive tool browser)
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

---

## Troubleshooting

### Server won't start

```bash
# Check Node version (need 18+)
node --version

# Check deps installed
ls node_modules/@modelcontextprotocol/sdk

# Try manual start
npx tsx src/index.ts
```

### Claude Code doesn't see tools

1. Check `~/.claude/.mcp.json` exists and has correct paths
2. Use absolute paths (not `~` or relative)
3. Restart Claude Code after config changes
4. In Claude Code, type `/mcp` to see connected servers

### API calls fail (timeouts)

The server has a 5-second timeout and falls back to static data. If you see `source: "static-fallback"` in responses, the live APIs aren't reachable. Check:

- Is SHOAL running locally? (`curl http://localhost:8787/health`)
- Is the Cloudflare Worker up? (`curl https://fleet-vector-api.casey-digennaro.workers.dev/stats`)
- Network connectivity / firewall rules

### "npx tsx" not found

```bash
npm install -g tsx
# or use the built version:
node dist/index.js
```

---

## Ecosystem

The SuperInstance MCP Server is part of the [SuperInstance](https://github.com/SuperInstance) ecosystem:

| Component | Repo | Role |
|-----------|------|------|
| **This Server** | [superinstance-mcp](https://github.com/SuperInstance/superinstance-mcp) | MCP bridge to AI assistants |
| **Conservation Law** | [conservation-law](https://github.com/SuperInstance/conservation-law) | Rust crate: γ + η ≤ C |
| **Ternary PID** | [ternary-pid](https://github.com/SuperInstance/ternary-pid) | Rust crate: PID governor driving γ → C/2 |
| **SHOAL Oracle** | [shoal](https://github.com/SuperInstance/shoal) | Conservation-bounded semantic search |
| **Fleet Dashboard** | [fleet-dashboard](https://github.com/SuperInstance/fleet-dashboard) | 3-panel conservation visualizer |
| **Dashboard API** | [fleet-dashboard-api](https://github.com/SuperInstance/fleet-dashboard-api) | Live telemetry Worker |
| **Fleet Edge Worker** | [fleet-edge-worker](https://github.com/SuperInstance/fleet-edge-worker) | Edge coordination (baton + PID) |
| **Fleet Budget** | [fleet-budget](https://github.com/SuperInstance/fleet-budget) | D1 ledger enforcing γ+η≤C |
| **Baton Router** | [baton-router](https://github.com/SuperInstance/baton-router) | Queues + D1 message routing |
| **OpenAgent** | [openagent](https://github.com/SuperInstance/openagent) | Go runtime: 9 platforms, MCP, RAG |
| **Conservation Theorem** | [Paper (860 lines)](https://github.com/SuperInstance/superinstance-website/blob/main/papers/conservation-entropy-theorem.md) | Full proof: Shannon chain rule |
| **Noether Derivation** | [Paper](https://github.com/SuperInstance/harness-experiments/blob/main/NOETHER_DERIVATION.md) | Symmetry → conservation |
| **PID Governor Theory** | [Paper](https://github.com/SuperInstance/harness-experiments/blob/main/PID_FLEET_GOVERNOR.md) | PID driving γ → C/2 |

---

## Contributing

```bash
git clone https://github.com/SuperInstance/superinstance-mcp.git
cd superinstance-mcp
npm install
npm run dev
```

Guidelines:
- Every new tool must have a static fallback (work offline)
- Every new tool must include conservation metadata in its response
- Test with `npx @modelcontextprotocol/inspector npx tsx src/index.ts`
- Keep `src/index.ts` as a single file — no build step for dev mode
- Update this README when adding tools

---

## License

MIT © SuperInstance

---

*γ + η ≤ C — build within the law.*
