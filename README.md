# SuperInstance MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the SuperInstance fleet as tools to Claude Code.

## What This Does

Any Claude Code session can query and control the SuperInstance fleet through standard MCP tool calls — conservation law checks, fleet status, semantic search, agent registry, and more.

```
Claude Code  ──→  MCP Protocol (stdio)  ──→  SuperInstance MCP Server
                                                        │
                                                        ├──→ Fleet Dashboard API (Cloudflare Worker)
                                                        ├──→ SHOAL Oracle (local dev)
                                                        ├──→ Fleet Vector API (Cloudflare Worker + Vectorize)
                                                        └──→ Local crate registry
```

## Quick Start

### Install

```bash
cd /home/phoenix/repos/superinstance-mcp
npm install
```

### Configure Claude Code

**Option A: Global config (all repos)**

```bash
cp .mcp.json ~/.claude/.mcp.json
```

**Option B: Per-repo**

Copy `.mcp.json` into any repo where you want fleet tools available:

```bash
cp /home/phoenix/repos/superinstance-mcp/.mcp.json /path/to/your-repo/.mcp.json
```

**Option C: Use the installer**

```bash
cd /home/phoenix/repos/superinstance-mcp
chmod +x install.sh
./install.sh
```

### Verify

Launch Claude Code in any repo with the MCP config. You should see 8 tools prefixed with the fleet namespace.

## Tools Reference

### 1. `fleet_status`

Get current fleet γ/η/C balance, agent count, and convergence metrics.

**Parameters:** none

**Example response:**
```json
{
  "conservation": {
    "C": 1.585,
    "gamma_total": 1.45,
    "eta_total": 1.44,
    "remaining": 0.135,
    "utilization": "91%",
    "status": "✅ CONSERVED"
  },
  "agents": { "count": 5, "active": 4, "standby": 1 },
  "convergence": { "delta": 0.2182 }
}
```

### 2. `fleet_search`

Semantic search of SHOAL oracle and fleet vector index.

**Parameters:**
- `query` (required, string) — natural language search
- `topK` (optional, number, default 5) — number of results

**Fallback chain:** SHOAL local → Fleet Vector API → local crate registry

### 3. `fleet_budget`

Check remaining compute budget.

**Parameters:**
- `gamma_used` (required, number) — compute work done
- `eta_produced` (required, number) — entropy generated

Returns remaining = C - γ - η with utilization percentage.

### 4. `conservation_check`

Verify a code change maintains conservation invariants.

**Parameters:**
- `gamma` (required, number) — compute invested
- `eta` (required, number) — entropy produced

Checks γ + η ≤ C where C = log₂(3) ≈ 1.585.

### 5. `ternary_validate`

Validate ternary signal values.

**Parameters:**
- `values` (required, number[]) — values to check

All values must be in {-1, 0, +1}.

### 6. `crate_info`

Look up SuperInstance crate metadata.

**Parameters:**
- `name` (required, string) — crate name

Available crates: shoal, openagent, wavefront, fleet-vector-api, fleet-dashboard, fleet-dashboard-api, fleet-auth, fleet-metrics-cron, superinstance-mcp, ternary

### 7. `fleet_agents`

List all fleet agents with status, γ/η budget, crates, and workers.

**Parameters:** none

### 8. `ecosystem_stats`

Total ecosystem numbers: crates published, workers deployed, tests, repos, theorems.

**Parameters:** none

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code Session                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  fleet_status│  │ fleet_search │  │ consv_check  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └────────────┬────┘─────────────────┘               │
│                      │                                       │
│              ┌───────▼────────┐                              │
│              │  MCP Protocol  │  (stdio)                     │
│              └───────┬────────┘                              │
└──────────────────────┼──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  MCP Server     │
              │  (TypeScript)   │
              │                 │
              │  ┌───────────┐  │
              │  │ 8 Tools   │  │
              │  └───────────┘  │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌────────────┐
   │ Fleet    │ │ SHOAL    │ │ Fleet      │
   │ Dashboard│ │ Oracle   │ │ Vector API │
   │ API      │ │ (local)  │ │ (Cloudflare)│
   │ (Worker) │ │          │ │            │
   └──────────┘ └──────────┘ └────────────┘
          │                         │
          ▼                         ▼
   ┌──────────┐             ┌────────────┐
   │ Cloudflare│             │ Cloudflare │
   │ Workers   │             │ Vectorize  │
   │ + D1      │             │ (384-dim)  │
   └──────────┘             └────────────┘
```

## Development

```bash
# Install deps
npm install

# Run in dev mode (no build needed)
npm run dev

# Or with npx
npx tsx src/index.ts

# Build for production
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLEET_API_URL` | `https://fleet-dashboard-api.casey-digennaro.workers.dev` | Fleet dashboard API URL |
| `SHOAL_URL` | `http://localhost:8787` | SHOAL oracle local dev URL |
| `VECTOR_API_URL` | `https://fleet-vector-api.casey-digennaro.workers.dev` | Fleet vector search API URL |

## Conservation Law

The SuperInstance framework operates on the principle that compute work (γ, gamma) and entropy (η, eta) are conserved:

```
γ + η ≤ C   where C = log₂(3) ≈ 1.585
```

The convergence rate is:

```
δ(n) = (1/√n)(1 - 3/(2n))
```

All fleet tools enforce these invariants.

## License

MIT © SuperInstance
