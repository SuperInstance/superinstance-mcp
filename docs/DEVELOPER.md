# Developer Guide: SuperInstance MCP Server

> **Complete guide for developers integrating, extending, and building on the SuperInstance MCP Server.**

---

## Table of Contents

1. [MCP Protocol Fundamentals](#1-mcp-protocol-fundamentals)
2. [Server Internals: How It Works](#2-server-internals-how-it-works)
3. [Tool Development Guide](#3-tool-development-guide)
4. [Integration Patterns by Platform](#4-integration-patterns-by-platform)
5. [Connecting Custom Backends](#5-connecting-custom-backends)
6. [Conservation Law API Contract](#6-conservation-law-api-contract)
7. [Testing & Validation](#7-testing--validation)
8. [Performance & Resource Budgeting](#8-performance--resource-budgeting)
9. [Security Model](#9-security-model)
10. [Troubleshooting & Debugging](#10-troubleshooting--debugging)
11. [Migration & Versioning](#11-migration--versioning)
12. [Appendix: Complete Tool Schemas](#12-appendix-complete-tool-schemas)

---

## 1. MCP Protocol Fundamentals

The Model Context Protocol (MCP) is a JSON-RPC 2.0 protocol that lets AI assistants discover and call external tools. Think of it as **USB-C for AI** — a standard plug that any assistant can use to connect to any tool server.

### How MCP Works

```
AI Assistant                 MCP Server                 Your Backend
(Claude Code,                (this repo)                (Cloudflare,
 Cursor, etc)                                           localhost, etc)
     │                           │                           │
     │── tools/list ───────────►│                           │
     │◄── 8 tool definitions ───│                           │
     │                           │                           │
     │── tools/call ───────────►│                           │
     │   {name, arguments}       │── HTTP fetch ───────────►│
     │                           │◄── JSON response ────────│
     │◄── tool result ──────────│                           │
     │   {content, isError}      │                           │
     │                           │                           │
```

### Protocol Details

- **Transport:** stdio (standard input/output) for local; HTTP for remote
- **Message format:** JSON-RPC 2.0
- **Server lifecycle:** launched by the client, runs until stdin closes
- **Discovery:** client calls `tools/list` on connection, caches results
- **Invocation:** client calls `tools/call` with `{ name, arguments }`
- **Responses:** `{ content: [{ type: "text", text: "..." }], isError: false }`

### Why stdio?

stdio transport is the MCP default because:
1. **No port conflicts** — the server uses stdin/stdout, no TCP
2. **Automatic lifecycle** — when the client exits, the server exits
3. **Secure by default** — no network surface
4. **Simple debugging** — pipe JSON in/out on the command line

### MCP SDK

This server uses the official TypeScript SDK:

```bash
npm install @modelcontextprotocol/sdk
```

Key imports:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
```

---

## 2. Server Internals: How It Works

### File Structure

```
superinstance-mcp/
├── src/
│   └── index.ts          # Single-file server (683 lines) — everything in here
├── dist/                  # Built JS output (npm run build)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config (ES2022, NodeNext, strict)
├── .mcp.json              # MCP client config template
├── install.sh             # Global Claude Code installer
├── README.md              # User-facing docs
└── docs/
    └── DEVELOPER.md       # This file
```

### Server Lifecycle

```typescript
// 1. Create server instance
const server = new Server(
  { name: 'superinstance-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

// 2. Register tool list handler (called once on connection)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS,
}));

// 3. Register tool call handler (called for each tool invocation)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // Switch on tool name, dispatch to handler
});

// 4. Connect transport and start
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Response Convention

All tool handlers return the same shape:

```typescript
// Success
{ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }

// Error
{ content: [{ type: "text", text: "Error: ..." }], isError: true }
```

The helper functions `textResult()` and `jsonResult()` handle this:

```typescript
function textResult(text: string, isError = false) {
  return { content: [{ type: 'text' as const, text }], isError };
}

function jsonResult(data: unknown) {
  return textResult(JSON.stringify(data, null, 2));
}
```

### Fallback Chain

Every tool that hits the network has a fallback chain:

```
Live API → Static Data → Error
```

This ensures the server **always returns useful data**, even offline:

```typescript
async function handleFleetStatus() {
  try {
    const response = await fetchWithTimeout(`${FLEET_API_URL}/api/fleet/status`);
    if (response.ok) {
      apiData = await response.json();
    }
  } catch {
    // Silent fallback — don't crash, just use static data
  }
  // Always returns — either live data, static computation, or both
}
```

---

## 3. Tool Development Guide

### Adding a New Tool: Complete Walkthrough

Let's add a `fleet_deploy_status` tool that checks deployment status across the fleet.

#### Step 1: Define the Tool Schema

```typescript
// Add to TOOL_DEFINITIONS array
{
  name: 'fleet_deploy_status',
  description: 'Check the deployment status of all Cloudflare Workers in the fleet. Returns per-worker status, version, and last-deployed timestamp.',
  inputSchema: {
    type: 'object',
    properties: {
      worker_name: {
        type: 'string',
        description: 'Specific worker to check (optional — omit for all)',
      },
    },
    // No required fields — returns all workers by default
  },
},
```

#### Step 2: Define the Data

```typescript
// Add static data for fallback
const WORKER_DEPLOYMENTS: Record<string, {
  name: string;
  url: string;
  status: 'deployed' | 'pending' | 'error';
  version: string;
  last_deploy: string;
}> = {
  'fleet-edge-worker': {
    name: 'fleet-edge-worker',
    url: 'https://fleet-edge-worker.casey-digennaro.workers.dev',
    status: 'deployed',
    version: '0.3.1',
    last_deploy: '2026-06-13T22:00:00Z',
  },
  'fleet-vector-api': {
    name: 'fleet-vector-api',
    url: 'https://fleet-vector-api.casey-digennaro.workers.dev',
    status: 'deployed',
    version: '1.0.0',
    last_deploy: '2026-06-11T14:00:00Z',
  },
  // ... more workers
};
```

#### Step 3: Implement the Handler

```typescript
async function handleFleetDeployStatus(workerName?: string) {
  if (workerName) {
    // Single worker lookup
    const worker = WORKER_DEPLOYMENTS[workerName];
    if (!worker) {
      return textResult(
        `Worker "${workerName}" not found. Available: ${Object.keys(WORKER_DEPLOYMENTS).join(', ')}`,
        true
      );
    }
    return jsonResult(worker);
  }

  // All workers
  const workers = Object.values(WORKER_DEPLOYMENTS);
  const deployed = workers.filter(w => w.status === 'deployed').length;

  return jsonResult({
    total: workers.length,
    deployed,
    pending: workers.filter(w => w.status === 'pending').length,
    error: workers.filter(w => w.status === 'error').length,
    workers,
  });
}
```

#### Step 4: Register in the Switch

```typescript
// In the CallToolRequestSchema handler:
case 'fleet_deploy_status': {
  const workerName = args?.worker_name as string | undefined;
  return await handleFleetDeployStatus(workerName);
}
```

#### Step 5: Test

```bash
# Start server
npx tsx src/index.ts &

# Test with raw JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx tsx src/index.ts 2>/dev/null | python3 -m json.tool

# Or use MCP Inspector for interactive testing:
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### Tool Design Principles

1. **Always return data** — never throw, always have a fallback
2. **Include conservation metadata** — even deployment tools should report γ/η impact
3. **5-second timeout** — respect the AI assistant's time
4. **Clear descriptions** — the AI reads these to decide when to use your tool
5. **Structured responses** — JSON (via `jsonResult`) is machine-parseable
6. **Helpful errors** — when something goes wrong, tell the AI what to do next

### Schema Best Practices

```typescript
// ✅ Good: descriptive, clear when to use
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
    },
    required: ['gamma'],
  },
}

// ❌ Bad: vague, AI won't know when to use it
{
  name: 'check',
  description: 'Check something',
  inputSchema: { type: 'object', properties: {} },
}
```

---

## 4. Integration Patterns by Platform

### Claude Code

#### Global Installation (all projects)

```bash
# Writes to ~/.claude/.mcp.json
./install.sh
```

#### Per-Project Installation

Create `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"],
      "env": {}
    }
  }
}
```

#### Claude Code Custom Instructions

In `.claude/instructions.md` (project-level) or `~/.claude/instructions.md`:

```markdown
## SuperInstance Fleet Rules

This project uses the SuperInstance conservation-law framework. Always:

1. Call `fleet_status` at the start of each session
2. Before suggesting architectural changes, call `fleet_search` to check for existing patterns
3. Before proposing a new service, call `conservation_check` to verify it fits the budget
4. When working with signals, validate with `ternary_validate`
5. Reference crates by calling `crate_info` for accurate metadata
```

#### Claude Code Skills

Create `~/.claude/skills/superinstance-new-crate/SKILL.md`:

```markdown
---
name: superinstance-new-crate
description: Scaffold a new SuperInstance Rust crate with conservation-law dependencies
---

When asked to create a new crate:

1. Call `ecosystem_stats` to get current state
2. Call `crate_info` on related crates to understand patterns
3. Scaffold:
   - Cargo.toml with conservation-law, serde dependencies
   - src/lib.rs with conservation imports
   - tests/ directory
   - README.md with conservation role
   - .gitignore
4. Run `conservation_check` to verify the crate's γ/η budget
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

Cursor Rules (`.cursorrules` in project root):

```
This project uses SuperInstance conservation-law governance.
Before writing code, use the MCP fleet_search tool to find existing patterns.
After writing code, use conservation_check to verify invariants.
All signal-processing code must pass ternary_validate.
```

### Windsurf

Add to Windsurf config (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

### VS Code (with MCP extension)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

### Custom Python Client

```python
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    params = StdioServerParameters(
        command="npx",
        args=["tsx", "/path/to/superinstance-mcp/src/index.ts"],
        env={"FLEET_API_URL": "https://fleet-dashboard-api.casey-digennaro.workers.dev"}
    )

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List tools
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"  {tool.name}: {tool.description[:80]}")

            # Call fleet_status
            result = await session.call_tool("fleet_status", {})
            data = json.loads(result.content[0].text)
            print(f"Fleet: {data['conservation']['status']}")

            # Search for patterns
            results = await session.call_tool("fleet_search", {
                "query": "rate limiter pattern",
                "topK": 3
            })
            print(json.loads(results.content[0].text))

asyncio.run(main())
```

### Custom Go Client

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/ThinkInAIXYZ/go-mcp/client"
    "github.com/ThinkInAIXYZ/go-mcp/protocol"
)

func main() {
    c, err := client.NewStdioClient(
        "npx", "tsx", "/path/to/superinstance-mcp/src/index.ts",
    )
    if err != nil {
        log.Fatal(err)
    }

    ctx := context.Background()

    // List tools
    tools, err := c.ListTools(ctx)
    if err != nil {
        log.Fatal(err)
    }
    for _, tool := range tools {
        fmt.Printf("  %s: %s\n", tool.Name, tool.Description)
    }

    // Call conservation_check
    result, err := c.CallTool(ctx, "conservation_check", map[string]any{
        "gamma": 0.9,
        "eta":   0.5,
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Content[0].Text)
}
```

### Custom Rust Client

```rust
use mcp_client::{Client, StdioTransport};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let transport = StdioTransport::new(
        "npx", &["tsx", "/path/to/superinstance-mcp/src/index.ts"],
    );

    let mut client = Client::new(transport);
    client.initialize().await?;

    // List tools
    let tools = client.list_tools().await?;
    for tool in &tools {
        println!("  {}: {}", tool.name, tool.description);
    }

    // Call fleet_status
    let result = client.call_tool("fleet_status", serde_json::json!({})).await?;
    println!("{}", result.content[0].text);

    Ok(())
}
```

---

## 5. Connecting Custom Backends

The MCP server can connect to any HTTP backend. Here's how to wire up a new data source:

### Adding a Custom API Backend

```typescript
// Add environment variable
const CUSTOM_API_URL = process.env.CUSTOM_API_URL ?? 'http://localhost:3000';

// Add to any handler
async function handleCustomSearch(query: string) {
  try {
    const response = await fetchWithTimeout(`${CUSTOM_API_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (response.ok) {
      const data = await response.json();
      return jsonResult({ source: 'custom-api', ...data });
    }
  } catch {
    // Fallback
  }

  return jsonResult({
    source: 'fallback',
    message: 'Custom API unavailable',
  });
}
```

### Expected API Contracts

#### Fleet Dashboard API

```
GET /api/fleet/status
→ { agents: { count, active }, gamma, eta, c, tick }

GET /api/fleet/agents
→ [{ id, signal, gamma, eta }]

GET /api/fleet/history?ticks=100
→ [{ tick, gamma, eta, timestamp }]

GET /api/benchmark
→ [{ language, build_time, test_time, binary_size }]
```

#### SHOAL Oracle

```
POST /query  { query, topK, agentId }
→ { results: [{ id, text, score, metadata }], gamma, eta }

POST /ingest { items: [{ text, metadata, tags }] }
→ { ingested: count }

GET /stats
→ { documents, dimensions, gamma_used, eta_produced }

GET /health
→ { status, gamma, eta, c }
```

#### Fleet Vector API

```
POST /search  { query, topK }
→ { results: [{ name, score, description }], total }

POST /ingest  { crates: [{ name, description, content }] }
→ { ingested: count }

GET /stats
→ { vectors, dimensions, index_name }
```

---

## 6. Conservation Law API Contract

All tools that return conservation data follow this shape:

```typescript
interface ConservationMetadata {
  /** Total capacity C = log₂(3) */
  C: number;
  /** Gamma used (coupling cost) */
  gamma: number;
  /** Eta produced (value) */
  eta: number;
  /** Remaining budget: C - gamma - eta */
  remaining: number;
  /** Utilization percentage */
  utilization_pct: number;
  /** Status indicator */
  status: '✅ CONSERVED' | '⚠️ TIGHT' | '❌ VIOLATED';
  /** Convergence rate at fleet size n */
  delta: number;
  /** Fleet size */
  n: number;
}
```

### Status Thresholds

| `remaining` | Status | Color | Action |
|-------------|--------|-------|--------|
| > 0.5 | ✅ CONSERVED | Green | Proceed normally |
| 0.1 – 0.5 | ✅ Monitor | Yellow | Proceed, watch budget |
| 0 – 0.1 | ⚠️ TIGHT | Orange | Scale or reduce load |
| < 0 | ❌ VIOLATED | Red | Block operation, reduce γ or η |

### Including Conservation in Custom Tools

```typescript
function withConservation<T extends Record<string, unknown>>(
  data: T,
  gamma: number,
  eta: number
): T & { conservation: ConservationMetadata } {
  const total = gamma + eta;
  const remaining = C - total;
  return {
    ...data,
    conservation: {
      C,
      gamma,
      eta,
      remaining: Math.round(remaining * 10000) / 10000,
      utilization_pct: Math.round((total / C) * 1000) / 10,
      status: remaining >= 0.1 ? '✅ CONSERVED' : remaining >= 0 ? '⚠️ TIGHT' : '❌ VIOLATED',
      delta: convergenceDelta(FLEET_AGENTS.length),
      n: FLEET_AGENTS.length,
    },
  };
}
```

---

## 7. Testing & Validation

### Manual Testing

```bash
# Start server and send raw JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  npx tsx src/index.ts 2>/dev/null | python3 -m json.tool

# Call a specific tool
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"conservation_check","arguments":{"gamma":0.9,"eta":0.5}},"id":2}' | \
  npx tsx src/index.ts 2>/dev/null | python3 -m json.tool
```

### MCP Inspector

The MCP Inspector is an interactive web UI for browsing and testing tools:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

This opens a browser at `http://localhost:5173` where you can:
- View all tool definitions
- Call tools interactively
- See raw JSON-RPC traffic
- Debug response shapes

### Automated Tests

```typescript
// test/tools.test.ts
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

function callTool(name: string, args: object): Promise<any> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', 'src/index.ts']);
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name, arguments: args },
      id: 1,
    });
    proc.stdin.write(request + '\n');
    proc.stdin.end();
    let output = '';
    proc.stdout.on('data', (data) => {
      output += data;
    });
    proc.on('close', () => {
      try { resolve(JSON.parse(output)); } catch { resolve(output); }
    });
  });
}

describe('conservation_check', () => {
  it('should pass for valid values', async () => {
    const result = await callTool('conservation_check', { gamma: 0.5, eta: 0.3 });
    const data = JSON.parse(result.result.content[0].text);
    expect(data.valid).toBe(true);
    expect(data.delta).toBeGreaterThan(0);
  });

  it('should fail for violated values', async () => {
    const result = await callTool('conservation_check', { gamma: 1.0, eta: 1.0 });
    const data = JSON.parse(result.result.content[0].text);
    expect(data.valid).toBe(false);
    expect(data.status).toContain('VIOLATED');
  });
});
```

### TypeScript Type Check

```bash
npx tsc --noEmit  # Should pass with zero errors
```

---

## 8. Performance & Resource Budgeting

### Memory Footprint

The server is lightweight:
- **Runtime:** Node.js ~30MB + SDK ~2MB = ~32MB total
- **Static data:** ~5KB (crate registry, agent registry, stats)
- **Per-tool-call overhead:** <1ms (dispatch) + network latency (if applicable)

### Network Behavior

| Tool | Network Call | Timeout | Fallback |
|------|-------------|---------|----------|
| `fleet_status` | GET FLEET_API_URL | 5s | Static computation |
| `fleet_search` | POST SHOAL_URL, POST VECTOR_API_URL | 5s each | Local crate search |
| `fleet_budget` | None | — | Computation only |
| `conservation_check` | None | — | Computation only |
| `ternary_validate` | None | — | Computation only |
| `crate_info` | None | — | Local registry |
| `fleet_agents` | None | — | Local registry |
| `ecosystem_stats` | None | — | Local registry |

6 of 8 tools work fully offline. The 2 that use the network always have fallbacks.

### When to Care About Performance

The server is called by AI assistants, which have their own latency (1-10s per response). MCP tool calls are typically:
1. AI decides to call a tool (~2s)
2. MCP round-trip (~50ms local, ~5s with network fallback)
3. AI processes response (~2s)

The bottleneck is always the AI, not the server. Don't optimize unless tool calls exceed the 5s timeout.

---

## 9. Security Model

### What the Server Can Do

- **Read-only by default** — 7 of 8 tools only read data
- **Network access** — makes outbound HTTP GET/POST to fleet APIs
- **No filesystem access** — doesn't read or write files
- **No shell execution** — doesn't run commands

### What the Server Cannot Do

- ❌ Write files
- ❌ Execute shell commands
- ❌ Access secrets or environment variables beyond its own config
- ❌ Make inbound network connections (stdio only)
- ❌ Modify Cloudflare resources

### Adding Write Tools Safely

If you add tools that modify state (deploy, publish, etc.):

1. **Require explicit parameters** — never infer destructive actions
2. **Add confirmation in the description** — e.g., "This action deploys to production"
3. **Conservation-gate** — check `conservation_check` before executing
4. **Log everything** — return what was done in the response
5. **Fail closed** — on any error, return without side effects

```typescript
// Example: safe deploy tool
async function handleFleetDeploy(name: string, script: string) {
  // 1. Conservation gate
  const gammaCost = script.length / 10000;
  if (gammaCost + getCurrentEta() > C) {
    return textResult(
      `Deploy blocked: would violate conservation. ` +
      `Cost: γ=${gammaCost}, available: ${C - getCurrentGamma() - getCurrentEta()}`,
      true
    );
  }

  // 2. Execute
  try {
    const result = await deployToCloudflare(name, script);
    return jsonResult({ deployed: true, ...result });
  } catch (e) {
    // 3. Fail closed
    return textResult(`Deploy failed: ${e.message}. No changes made.`, true);
  }
}
```

---

## 10. Troubleshooting & Debugging

### Enable Verbose Logging

The server logs to stderr (stdout is reserved for MCP protocol):

```typescript
// Add to any handler for debugging
console.error(`[debug] fleet_search called with: query="${query}", topK=${topK}`);
```

Check these logs in Claude Code's MCP output panel, or run the server manually:

```bash
# See all stderr output
npx tsx src/index.ts 2>&1 1>/dev/null
```

### Common Issues

#### "Server not found" in Claude Code

```bash
# Check config exists
cat ~/.claude/.mcp.json

# Check path is absolute
# ✅ "args": ["tsx", "/home/user/repos/superinstance-mcp/src/index.ts"]
# ❌ "args": ["tsx", "~/repos/superinstance-mcp/src/index.ts"]

# Restart Claude Code
```

#### Tool calls return "Static fallback"

This is expected when APIs are offline. The server is working correctly — it's gracefully degrading. To fix:

```bash
# Check if SHOAL is running locally
curl http://localhost:8787/health

# Check if Cloudflare Workers are up
curl https://fleet-vector-api.casey-digennaro.workers.dev/stats
```

#### TypeScript compilation errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Need 18+
```

#### npx tsx not found

```bash
npm install -g tsx
# OR use built version:
npm run build
node dist/index.js
```

### Debug Protocol

```bash
# Raw protocol inspection
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.0.0"}},"id":0}' | \
  npx tsx src/index.ts 2>/dev/null

# Full conversation log
# Claude Code: Settings → Developer → Open Logs
# Look for [MCP] entries
```

---

## 11. Migration & Versioning

### Version Policy

- **0.x.x** — Breaking changes possible in any release
- **1.0.0+** — Semantic versioning. Breaking changes bump major version.
- Tool additions are minor versions
- Tool removals are major versions

### Adding Tools (Non-Breaking)

New tools are added to `TOOL_DEFINITIONS` and the switch statement. Existing clients auto-discover them on next `tools/list` call. No migration needed.

### Removing Tools (Breaking)

1. **Deprecate first** — add `"deprecated": true` to the tool definition, update description
2. **Wait one release cycle** — let clients migrate
3. **Remove** — bump major version, update README

### Changing Tool Signatures

Adding optional parameters is non-breaking. Removing or renaming parameters is breaking.

```typescript
// ✅ Non-breaking: adding optional param
{ properties: { new_option: { type: 'boolean' } } }  // optional = OK

// ❌ Breaking: renaming required param
{ properties: { newName: ... } }  // clients passing oldName will break
```

---

## 12. Appendix: Complete Tool Schemas

<details>
<summary>Click to expand all 8 tool JSON schemas</summary>

### fleet_status
```json
{
  "name": "fleet_status",
  "description": "Get the current SuperInstance fleet status...",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### fleet_search
```json
{
  "name": "fleet_search",
  "description": "Semantic search of the SHOAL oracle...",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "..." },
      "topK": { "type": "number", "minimum": 1, "maximum": 20 }
    },
    "required": ["query"]
  }
}
```

### fleet_budget
```json
{
  "name": "fleet_budget",
  "description": "Check the remaining compute budget...",
  "inputSchema": {
    "type": "object",
    "properties": {
      "gamma_used": { "type": "number", "minimum": 0 },
      "eta_produced": { "type": "number", "minimum": 0 }
    },
    "required": ["gamma_used", "eta_produced"]
  }
}
```

### conservation_check
```json
{
  "name": "conservation_check",
  "description": "Verify that a code change or operation maintains...",
  "inputSchema": {
    "type": "object",
    "properties": {
      "gamma": { "type": "number" },
      "eta": { "type": "number" }
    },
    "required": ["gamma", "eta"]
  }
}
```

### ternary_validate
```json
{
  "name": "ternary_validate",
  "description": "Validate that an array of values are valid ternary signals...",
  "inputSchema": {
    "type": "object",
    "properties": {
      "values": { "type": "array", "items": { "type": "number" } }
    },
    "required": ["values"]
  }
}
```

### crate_info
```json
{
  "name": "crate_info",
  "description": "Look up detailed information about a SuperInstance crate...",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" }
    },
    "required": ["name"]
  }
}
```

### fleet_agents
```json
{
  "name": "fleet_agents",
  "description": "List all registered SuperInstance fleet agents...",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### ecosystem_stats
```json
{
  "name": "ecosystem_stats",
  "description": "Get total SuperInstance ecosystem numbers...",
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

</details>

---

## Further Reading

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [SuperInstance Conservation Theorem](https://github.com/SuperInstance/superinstance-website/blob/main/papers/conservation-entropy-theorem.md)
- [SuperInstance Ecosystem](https://github.com/SuperInstance)

---

*Questions? Open an issue at [github.com/SuperInstance/superinstance-mcp/issues](https://github.com/SuperInstance/superinstance-mcp/issues).*
