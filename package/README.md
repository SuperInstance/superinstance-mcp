# SuperInstance MCP Server

> **Conservation-law-governed fleet intelligence for any AI agent, coding assistant, or autonomous system.**
>
> The SuperInstance MCP Server exposes fleet governance, semantic knowledge, compute budgeting, and ternary validation through the open [Model Context Protocol](https://modelcontextprotocol.io). Any MCP-compatible agent — Claude Code, Cursor, Cline, Windsurf, Goose, Amazon Q, custom Python/Go/Rust agents — can query and respect the conservation law: **γ + η ≤ C where C = log₂(3) ≈ 1.585**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org)
[![Conservation Law](https://img.shields.io/badge/Physics-%CE%B3%20%2B%20%CE%B7%20%E2%89%A4%20C-gold.svg)](https://github.com/SuperInstance/superinstance-mcp)

---

## Table of Contents

- [What This Is](#what-this-is)
- [Why MCP?](#why-mcp)
- [Supported Agents & Clients](#supported-agents--clients)
- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Installation by Platform](#installation-by-platform)
  - [Claude Code](#claude-code)
  - [Cursor](#cursor)
  - [Cline (VS Code)](#cline-vs-code)
  - [Windsurf](#windsurf)
  - [Goose (Block)](#goose-block)
  - [Amazon Q Developer](#amazon-q-developer)
  - [Zed Editor](#zed-editor)
  - [Continue (VS Code / JetBrains)](#continue-vs-code--jetbrains)
  - [Aider](#aider)
  - [Custom Python Agent](#custom-python-agent)
  - [Custom Go Agent](#custom-go-agent)
  - [Custom Rust Agent](#custom-rust-agent)
  - [Custom TypeScript/Node Agent](#custom-typescriptnode-agent)
  - [Docker / Containerized](#docker--containerized)
  - [Remote (HTTP MCP)](#remote-http-mcp)
- [Tools Reference](#tools-reference)
- [Conservation Law Primer](#conservation-law-primer)
- [Architecture](#architecture)
- [Integration Patterns](#integration-patterns)
- [Configuration](#configuration)
- [Building Custom Tools](#building-custom-tools)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Ecosystem](#ecosystem)
- [Documentation Index](#documentation-index)
- [Contributing](#contributing)
- [License](#license)

---

## What This Is

The SuperInstance MCP Server is a **general-purpose governance and intelligence layer** for AI agents. It provides any agentic system with:

- 🔍 **Semantic fleet knowledge** — Search 1,200+ indexed crates, patterns, and solutions
- 📊 **Live fleet telemetry** — γ/η/C conservation balance, convergence metrics, agent status
- 💰 **Compute budget enforcement** — Every task bounded by the conservation law
- ✅ **Invariant validation** — Ternary signals {-1,0,+1}, conservation bounds
- 📦 **Ecosystem registry** — 25+ published crates with metadata and conservation roles
- 🤖 **Agent roster** — Fleet agents, their phases, budgets, and assignments
- 📈 **Aggregate metrics** — Crates, workers, tests, repos at a glance
- 🛡️ **Governance-as-code** — Physics-grounded constraints that agents cannot violate

**The core insight:** This is not a Claude Code plugin or a Cursor extension. It is **protocol-native infrastructure** that speaks MCP — the emerging open standard for agent-tool communication. Any system that implements the MCP client spec gets full fleet awareness for free.

---

## Why MCP?

The Model Context Protocol (MCP) is an open standard released by Anthropic in 2024 and rapidly adopted across the AI tooling ecosystem. It defines a standard way for AI agents to discover and call external tools — think of it as **USB-C for AI agents**.

### The Problem MCP Solves

Before MCP, every AI tool had its own integration format:

```
Claude Code ← custom plugin API
Cursor     ← different extension API
Aider      ← different command format
Custom Go agent ← different RPC protocol
```

MCP replaces this with a single standard:

```
Every agent → MCP protocol → Every tool server
```

### What This Means for You

Write your fleet integration **once** against the MCP server, and it works with:

| Category | Tools |
|----------|-------|
| **AI Coding Assistants** | Claude Code, Cursor, Cline, Windsurf, Continue, Zed, Amazon Q |
| **Autonomous Agents** | OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, custom agents |
| **CI/CD Systems** | GitHub Actions, GitLab CI, Jenkins, Docker, Kubernetes |
| **Monitoring** | Prometheus, Grafana, Datadog, custom dashboards |
| **Your Custom Agent** | Any system that can speak JSON-RPC over stdio or HTTP |

---

## Supported Agents & Clients

Every MCP-compatible client works out of the box. Here's the current landscape:

### Tier 1: Native MCP Support (zero configuration)

These agents have built-in MCP client support — just point them at the server:

| Agent | MCP Transport | Config Location | Notes |
|-------|--------------|-----------------|-------|
| **Claude Code** | stdio | `~/.claude/.mcp.json` or `.mcp.json` in project | Full tool discovery, auto-call |
| **Cursor** | stdio | `~/.cursor/mcp.json` | Tools appear in chat |
| **Cline** | stdio | VS Code settings | Tools in Cline panel |
| **Windsurf** | stdio | `~/.codeium/windsurf/mcp_config.json` | Cascade integration |
| **Goose** | stdio | Goose config | Session-based tools |
| **Amazon Q Developer** | stdio | Q config | AWS-native |
| **Zed** | stdio | `.zed/settings.json` | Editor-integrated |

### Tier 2: SDK Clients (small wrapper needed)

These frameworks have MCP client SDKs but need a thin wrapper to connect:

| Framework | Language | SDK |
|-----------|----------|-----|
| **OpenAI Agents SDK** | Python | `mcp` Python SDK |
| **LangGraph / LangChain** | Python | `langchain-mcp-adapters` |
| **CrewAI** | Python | MCP tool integration |
| **AutoGen** | Python | MCP via function calling |
| **Custom Python** | Python | `mcp` (official) |
| **Custom Go** | Go | `ThinkInAIXYZ/go-mcp` |
| **Custom Rust** | Rust | `mcp-rust` / custom |
| **Custom TypeScript** | TypeScript | `@modelcontextprotocol/sdk` |

### Tier 3: Indirect Integration (API calls)

Any system can use the server via raw JSON-RPC or by calling the underlying fleet APIs directly:

| Pattern | How |
|---------|-----|
| **Shell scripts** | Pipe JSON-RPC to stdin, parse stdout |
| **CI/CD pipelines** | Run server as subprocess, capture output |
| **Monitoring systems** | Cron-triggered status checks |
| **Web dashboards** | Call fleet APIs directly (bypass MCP) |

---

## Quick Start (5 Minutes)

### Option A: npx (no install)
```bash
# Run directly — no clone needed
npx superinstance-mcp
# Output: [SuperInstance MCP] Server started — 8 tools available
```

### Option B: Clone and build
```bash
# 1. Clone and install
git clone https://github.com/SuperInstance/superinstance-mcp.git
cd superinstance-mcp
npm install

# 2. Verify the server works
npm run dev
# Output: [SuperInstance MCP] Server started — 8 tools available

# 3. Test a tool call (raw JSON-RPC)
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"conservation_check","arguments":{"gamma":0.8,"eta":0.5}},"id":1}' | \
  npm run dev 2>/dev/null | python3 -m json.tool

# 4. Install for your agent (pick one):
./install.sh                    # Claude Code (global)
cp .mcp.json ~/.cursor/mcp.json # Cursor
# See platform-specific instructions below
```

---

## Installation by Platform

### Claude Code

**Global (all projects):**
```bash
./install.sh
# Writes to ~/.claude/.mcp.json
```

**Using npx (no clone needed):**
```json
// ~/.claude/.mcp.json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["-y", "superinstance-mcp"]
    }
  }
}
```
That's it — `npx superinstance-mcp` downloads and runs the published npm package.

**Per-project:**
```bash
cp .mcp.json /your/project/.mcp.json
```

Claude Code auto-discovers `.mcp.json` in the working directory and `~/.claude/.mcp.json` globally. Tools appear automatically — no restart needed in recent versions.

<details>
<summary>Manual config</summary>

```json
// ~/.claude/.mcp.json
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
</details>

---

### Cursor

```json
// ~/.cursor/mcp.json
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

After saving, Cursor's chat will show fleet tools. Use `Cmd+L` to open chat and the tools are auto-discovered.

**Cursor Rules (`.cursorrules` in project root):**
```
This project uses SuperInstance conservation-law governance.
Before writing code, use fleet_search to find existing patterns.
After writing code, use conservation_check to verify invariants.
All signal-processing code must pass ternary_validate.
```

---

### Cline (VS Code)

```json
// VS Code settings.json or Cline's MCP settings
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"],
      "disabled": false,
      "autoApprove": [
        "fleet_status",
        "fleet_search",
        "fleet_budget",
        "conservation_check",
        "ternary_validate",
        "crate_info",
        "fleet_agents",
        "ecosystem_stats"
      ]
    }
  }
}
```

The `autoApprove` array lets Cline call these tools without asking for confirmation each time.

---

### Windsurf

```json
// ~/.codeium/windsurf/mcp_config.json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

Windsurf's Cascade assistant will discover the tools on next session. Tools appear in the Cascade tool picker.

---

### Goose (Block)

```json
// Goose session config
{
  "tools": {
    "mcpServers": {
      "superinstance": {
        "command": "npx",
        "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"]
      }
    }
  }
}
```

Or via Goose CLI:
```bash
gooose mcp add superinstance -- npx tsx /absolute/path/to/superinstance-mcp/src/index.ts
```

---

### Amazon Q Developer

```json
// Q Developer MCP config
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

In AWS CodeWhisperer / Q Developer, MCP tools appear as available actions in the chat panel.

---

### Zed Editor

```json
// .zed/settings.json (project-level) or ~/.zed/settings.json (global)
{
  "mcp": {
    "servers": {
      "superinstance": {
        "command": "npx",
        "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"]
      }
    }
  }
}
```

Zed's assistant panel will list fleet tools in the `/tools` command.

---

### Continue (VS Code / JetBrains)

```json
// ~/.continue/config.json
{
  "mcpServers": {
    "superinstance": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/superinstance-mcp/src/index.ts"]
    }
  }
}
```

Continue's chat will auto-discover tools. You can reference them: "Use fleet_search to find rate limiter patterns."

---

### Aider

Aider doesn't natively support MCP yet, but you can use the server as a command-line tool:

```bash
# Wrapper script: ~/bin/fleet
#!/bin/bash
echo "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"$1\",\"arguments\":$2}},\"id\":1}" | \
  npx tsx /path/to/superinstance-mcp/src/index.ts 2>/dev/null | \
  jq -r '.result.content[0].text'
```

```bash
# In aider session:
!/bin/fleet conservation_check '{"gamma":0.8,"eta":0.5}'
!/bin/fleet fleet_status '{}'
!/bin/fleet fleet_search '{"query":"rate limiter","topK":3}'
```

Or configure as an aider command:
```bash
# .aider.conf.yml
commands:
  fleet-status: "!/bin/fleet fleet_status '{}'"
  fleet-search: "!/bin/fleet fleet_search '{\"query\":\"$ARGS\"}'"
```

---

### Custom Python Agent

Using the official MCP Python SDK:

```bash
pip install mcp
```

```python
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MCP_PATH = "/path/to/superinstance-mcp/src/index.ts"

async def main():
    params = StdioServerParameters(
        command="npx",
        args=["tsx", MCP_PATH],
        env={
            "FLEET_API_URL": "https://fleet-dashboard-api.casey-digennaro.workers.dev",
        }
    )

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Discover available tools
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"  {tool.name}: {tool.description[:80]}...")

            # Check fleet status
            result = await session.call_tool("fleet_status", {})
            status = json.loads(result.content[0].text)
            print(f"\nFleet: {status['conservation']['status']}")
            print(f"Agents: {status['agents']['active']} active")

            # Semantic search
            result = await session.call_tool("fleet_search", {
                "query": "ternary PID controller",
                "topK": 3
            })
            data = json.loads(result.content[0].text)
            for r in data.get("results", []):
                print(f"  - {r.get('name')}: {r.get('description', '')[:60]}")

            # Conservation check
            result = await session.call_tool("conservation_check", {
                "gamma": 0.9,
                "eta": 0.5
            })
            check = json.loads(result.content[0].text)
            print(f"\nConservation: {check['valid']} — {check['message']}")

asyncio.run(main())
```

---

### Custom Go Agent

Using `ThinkInAIXYZ/go-mcp`:

```bash
go get github.com/ThinkInAIXYZ/go-mcp
```

```go
package main

import (
    "context"
    "encoding/json"
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
    tools, _ := c.ListTools(ctx)
    for _, tool := range tools {
        fmt.Printf("  %s\n", tool.Name)
    }

    // Check conservation
    raw, _ := c.CallTool(ctx, "conservation_check", map[string]any{
        "gamma": 0.8,
        "eta":   0.5,
    })

    var result struct {
        Valid   bool    `json:"valid"`
        Message string  `json:"message"`
        Delta   float64 `json:"delta"`
    }
    json.Unmarshal([]byte(raw.Content[0].Text), &result)
    fmt.Printf("Valid: %v, δ=%.4f\n%s\n", result.Valid, result.Delta, result.Message)
}
```

---

### Custom Rust Agent

```toml
# Cargo.toml
[dependencies]
mcp-client = "0.1"
tokio = { version = "1", features = ["full"] }
serde_json = "1"
```

```rust
use mcp_client::{Client, StdioTransport};
use serde_json::json;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let transport = StdioTransport::new(
        "npx", &["tsx", "/path/to/superinstance-mcp/src/index.ts"],
    );

    let mut client = Client::new(transport);
    client.initialize().await?;

    // List all 8 tools
    let tools = client.list_tools().await?;
    for tool in &tools {
        println!("  {}: {}", tool.name, tool.description);
    }

    // Check fleet status
    let result = client
        .call_tool("fleet_status", json!({}))
        .await?;
    println!("{}", result.content[0].text);

    Ok(())
}
```

---

### Custom TypeScript/Node Agent

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['tsx', '/path/to/superinstance-mcp/src/index.ts'],
});

const client = new Client(
  { name: 'my-agent', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(`${tools.tools.length} tools available`);

// Call conservation_check
const result = await client.callTool({
  name: 'conservation_check',
  arguments: { gamma: 0.9, eta: 0.5 },
});
console.log(JSON.parse((result.content as any)[0].text));

await client.close();
```

---

### OpenAI Agents SDK Integration

```python
"""
Use SuperInstance fleet tools within an OpenAI Agents SDK workflow.
"""
from agents import Agent, Runner
from agents.mcp import MCPServerStdio

async def main():
    # Create MCP server connection
    fleet_server = MCPServerStdio(
        command="npx",
        args=["tsx", "/path/to/superinstance-mcp/src/index.ts"],
    )
    await fleet_server.connect()

    # Agent with fleet tools
    fleet_agent = Agent(
        name="Fleet Coordinator",
        instructions="""You manage a SuperInstance fleet. Before any task:
        1. Call fleet_status to check fleet health
        2. Call fleet_search to find existing solutions
        3. Call conservation_check before proposing changes
        """,
        mcp_servers=[fleet_server],
    )

    result = await Runner.run(fleet_agent, "Check fleet status and find rate limiter patterns")
    print(result.final_output)

    await fleet_server.cleanup()
```

---

### LangGraph Integration

```python
"""
Use SuperInstance MCP tools as LangGraph nodes.
"""
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.client import MultiServerMCPClient

async def create_fleet_agent():
    client = MultiServerMCPClient({
        "superinstance": {
            "command": "npx",
            "args": ["tsx", "/path/to/superinstance-mcp/src/index.ts"],
            "transport": "stdio",
        }
    })

    tools = await client.get_tools()

    agent = create_react_agent(
        tools=tools,
        model="gpt-4o",
        prompt="""You are a fleet-aware agent. Use conservation_check before
        proposing architectural changes. Use fleet_search to find existing patterns.""",
    )

    return agent
```

---

### CrewAI Integration

```python
"""
SuperInstance tools as CrewAI agent tools.
"""
from crewai import Agent, Task, Crew
from crewai.tools import MCPServerAdapter

# Connect to MCP server
with MCPServerAdapter(
    command="npx",
    args=["tsx", "/path/to/superinstance-mcp/src/index.ts"],
) as tools:

    fleet_agent = Agent(
        role="Fleet Governor",
        goal="Ensure all tasks comply with the conservation law γ + η ≤ C",
        backstory="An AI agent that enforces physics-grounded governance.",
        tools=tools,
        verbose=True,
    )

    status_task = Task(
        description="Check fleet status and find patterns for implementing a rate limiter",
        agent=fleet_agent,
        expected_output="Fleet status summary and relevant crate recommendations",
    )

    crew = Crew(agents=[fleet_agent], tasks=[status_task])
    result = crew.kickoff()
    print(result)
```

---

### Docker / Containerized

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build
# Server reads JSON-RPC from stdin, writes to stdout
CMD ["node", "dist/index.js"]
```

```bash
docker build -t superinstance-mcp .
# The container reads JSON-RPC from stdin
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | docker run -i superinstance-mcp 2>/dev/null
```

For Docker Compose with your agent:
```yaml
services:
  agent:
    build: .
    environment:
      - MCP_SERVER_COMMAND=docker
      - MCP_SERVER_ARGS=run -i superinstance-mcp
```

---

### Remote (HTTP MCP)

For agents that need HTTP transport (remote servers, browser-based agents):

Deploy as a Cloudflare Worker (see [Deployment](#deployment)), then connect:

```typescript
// Any MCP client can connect via HTTP
const transport = new StreamableHTTPClientTransport(
  new URL('https://superinstance-mcp-remote.your-account.workers.dev')
);
const client = new Client({ name: 'remote-agent', version: '1.0' }, { capabilities: {} });
await client.connect(transport);
```

---

## Tools Reference

### Overview

| # | Tool | Parameters | Network | Description |
|---|------|-----------|---------|-------------|
| 1 | `fleet_status` | none | optional | Live γ/η/C balance, agent count, convergence |
| 2 | `fleet_search` | query, topK? | optional | Semantic search of fleet knowledge |
| 3 | `fleet_budget` | gamma_used, eta_produced | none | Compute budget check |
| 4 | `conservation_check` | gamma, eta | none | Verify γ + η ≤ C |
| 5 | `ternary_validate` | values[] | none | Check {-1,0,+1} signals |
| 6 | `crate_info` | name | none | Crate metadata lookup |
| 7 | `fleet_agents` | none | none | Agent roster with budgets |
| 8 | `ecosystem_stats` | none | none | Ecosystem aggregate numbers |

**6 of 8 tools work fully offline.** Network tools gracefully degrade to static fallbacks.

### Detailed Examples

<details>
<summary><b>1. fleet_status</b></summary>

**Parameters:** None

```json
// Response
{
  "source": "live-api",  // or "static-fallback"
  "conservation": {
    "C": 1.584962500721156,
    "C_approx": 1.585,
    "gamma_total": 1.45,
    "eta_total": 1.44,
    "remaining": -1.305,
    "utilization": "183%",
    "status": "❌ VIOLATED"
  },
  "agents": { "count": 5, "active": 4, "standby": 1 },
  "convergence": {
    "delta": 0.3887,
    "formula": "δ(n) = (1/√n)(1 - 3/(2n))",
    "n": 5
  }
}
```
</details>

<details>
<summary><b>2. fleet_search</b></summary>

```json
// Call
{ "query": "how does the conservation law relate to Shannon entropy", "topK": 3 }

// Response (tries SHOAL → Vector API → local fallback)
{
  "source": "shoal-local",  // or "fleet-vector-api" or "local-fallback"
  "query": "how does the conservation law relate to Shannon entropy",
  "results": [
    { "rank": 1, "name": "conservation-law", "score": 0.95, "description": "..." },
    { "rank": 2, "name": "noether-bridge", "score": 0.82, "description": "..." }
  ]
}
```
</details>

<details>
<summary><b>3. fleet_budget</b></summary>

```json
// Call
{ "gamma_used": 0.8, "eta_produced": 0.6 }

// Response
{
  "gamma_used": 0.8,
  "eta_produced": 0.6,
  "c_capacity": 1.585,
  "total_used": 1.4,
  "remaining": 0.185,
  "utilization_pct": 88.3,
  "status": "✅ BUDGET AVAILABLE"
}
```
</details>

<details>
<summary><b>4. conservation_check</b></summary>

```json
// Call
{ "gamma": 0.9, "eta": 0.5 }

// Response (δ > 0.5)
{ "valid": true, "delta": 0.185, "message": "✅ CONSERVED. Healthy headroom." }

// Response (δ < 0)
{ "valid": false, "delta": -0.315, "message": "❌ VIOLATED. Over by 0.315." }
```
</details>

<details>
<summary><b>5. ternary_validate</b></summary>

```json
// Call
{ "values": [1, -1, 0, 1, 0, -1, 0.5] }

// Response
{
  "valid": false,
  "count": 7,
  "invalid_count": 1,
  "invalid_values": [0.5],
  "message": "❌ 1 of 7 values not in {-1, 0, +1}: [0.5]"
}
```
</details>

<details>
<summary><b>6. crate_info</b></summary>

```json
// Call
{ "name": "shoal" }

// Response
{
  "name": "shoal",
  "version": "0.3.2",
  "description": "Ternary oracle runtime...",
  "repo": "https://github.com/SuperInstance/shoal",
  "conservation_role": "Oracle: converts ternary signals to bounded predictions via γ + η ≤ C"
}
```
</details>

<details>
<summary><b>7. fleet_agents</b></summary>

```json
// Response
{
  "count": 5,
  "active": 4,
  "agents": [
    {
      "name": "phoenix",
      "role": "builder",
      "phase": "active",
      "gamma": 0.38,
      "eta": 0.44,
      "status": "✅ CONSERVED",
      "crates": ["wavefront", "fleet-vector-api"],
      "workers": 6
    }
  ]
}
```
</details>

<details>
<summary><b>8. ecosystem_stats</b></summary>

```json
{
  "crates": 25,
  "workers": 12,
  "repos": 18,
  "tests": 847,
  "theorems_proven": 1,
  "conservation_law": "γ + η ≤ C where C = log₂(3) ≈ 1.585",
  "conservation_constant": { "symbol": "C", "value": 1.585, "formula": "log₂(3)" }
}
```
</details>

---

## Conservation Law Primer

The SuperInstance fleet operates on a principle from information theory:

```
γ + η ≤ C    where C = log₂(3) ≈ 1.585 bits
```

| Symbol | Name | Meaning |
|--------|------|---------|
| γ (gamma) | Coupling cost | Resources invested in coordination |
| η (eta) | Value | Useful output — decisions, artifacts, computation |
| C | Capacity | Total fleet capacity, bounded by the ternary alphabet |

**This is the Shannon chain rule:** H(X) = I(X;G) + H(X|G). Not a metaphor — the conservation law *is* information theory.

The ternary substrate {-1, 0, +1} is provably optimal: 99.54% radix economy, zero-mean (enabling CLT cancellation), and C = log₂(3) bits per signal.

**Scaling:** As fleet size n grows, coordination overhead shrinks: δ(n) = (1/√n)(1 − 3/(2n)). At n=10,000, 99% of coupling cancels. Bigger fleets are proportionally cheaper to coordinate.

**Further reading:** [Full proof (860 lines)](https://github.com/SuperInstance/superinstance-website/blob/main/papers/conservation-entropy-theorem.md) · [Noether derivation](https://github.com/SuperInstance/harness-experiments/blob/main/NOETHER_DERIVATION.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Any MCP Client                                  │
│                                                                     │
│  Claude Code · Cursor · Cline · Windsurf · Goose · Amazon Q · Zed  │
│  OpenAI Agents · LangGraph · CrewAI · AutoGen · Custom Agents       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    MCP Protocol (JSON-RPC 2.0)
                    stdio (local) or HTTP (remote)
                                 │
              ┌──────────────────▼──────────────────┐
              │     superinstance-mcp Server        │
              │     (TypeScript, 683 LOC)           │
              │                                    │
              │   ┌─────────────────────────────┐   │
              │   │       8 MCP Tools           │   │
              │   │  • Always returns data      │   │
              │   │  • 5s timeout on network    │   │
              │   │  • Static fallbacks         │   │
              │   │  • Conservation-gated       │   │
              │   └─────────────────────────────┘   │
              └──────────────┬──────────────────────┘
                             │ HTTP (optional)
           ┌─────────────────┼─────────────────┐
           │                 │                 │
  ┌────────▼───────┐ ┌──────▼───────┐ ┌───────▼────────┐
  │  Fleet         │ │  SHOAL       │ │  Fleet Vector  │
  │  Dashboard API │ │  Oracle      │ │  API           │
  │ (CF Worker)    │ │ (CF Worker)  │ │ (CF Worker)    │
  └────────┬───────┘ └──────┬───────┘ └───────┬────────┘
           │                 │                 │
  ┌────────▼─────────────────▼─────────────────▼──────┐
  │              Cloudflare Edge                       │
  │     D1 · KV · Vectorize · Workers AI · Queues     │
  └───────────────────────────────────────────────────┘
```

**Design principles:**
1. **Protocol-native** — speaks MCP, not a proprietary API
2. **Always works** — every tool has a static fallback
3. **5-second timeout** — never blocks the agent
4. **Conservation-first** — every response includes governance metadata
5. **Zero runtime deps** — only `@modelcontextprotocol/sdk`

---

## Integration Patterns

### Pattern 1: Conservation-Aware Code Generation

Any coding agent that supports MCP can be made conservation-aware:

```
Agent instructions:
"Before proposing any architecture, call conservation_check with estimated
γ (coordination cost) and η (entropy produced). Only propose solutions
where δ = C − γ − η > 0.1."
```

### Pattern 2: Knowledge-Grounded Development

```
Agent instructions:
"Before writing new code, call fleet_search with your intended feature.
If results exist, use them as reference. Only write new code if no
existing pattern matches (similarity score < 0.5)."
```

### Pattern 3: Multi-Agent Task Distribution

```python
# Assign tasks to agents based on remaining conservation budget
agents = call("fleet_agents")
for task in tasks:
    for agent in agents:
        if agent.remaining_budget >= task.cost:
            assign(task, agent)
            break
```

### Pattern 4: CI/CD Conservation Gate

```bash
# Block deploys that violate conservation
RESULT=$(echo '{"jsonrpc":"2.0",...}' | npx tsx mcp/index.ts)
VALID=$(echo "$RESULT" | jq '.valid')
[ "$VALID" = "true" ] || exit 1
```

### Pattern 5: Autonomous Agent Governance

```python
# An autonomous agent that checks budget before every action
async def act(agent, action):
    budget = await mcp.call("fleet_budget", {
        "gamma_used": agent.gamma_total + action.gamma_cost,
        "eta_produced": agent.eta_total + action.eta_expected
    })
    if "✅" in budget["status"]:
        await execute(action)
    else:
        await queue(action)  # Wait for budget
```

---

## Configuration

### Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `FLEET_API_URL` | `https://fleet-dashboard-api.casey-digennaro.workers.dev` | ❌ | Fleet dashboard API |
| `SHOAL_URL` | `http://localhost:8787` | ❌ | SHOAL semantic oracle |
| `VECTOR_API_URL` | `https://fleet-vector-api.casey-digennaro.workers.dev` | ❌ | Fleet vector search |

All variables are optional — the server uses sensible defaults and falls back to static data when APIs are unreachable.

### Connecting to Your Own Backends

The MCP server can connect to any HTTP API that returns JSON. See [`docs/DEVELOPER.md`](docs/DEVELOPER.md#connecting-custom-backends) for the full API contract specification.

---

## Building Custom Tools

The server is a single TypeScript file (`src/index.ts`). Adding a tool takes 4 steps:

1. **Define** — add to `TOOL_DEFINITIONS` array
2. **Implement** — write handler function with fallback
3. **Register** — add to the `switch` statement
4. **Test** — use MCP Inspector or raw JSON-RPC

See [`docs/DEVELOPER.md`](docs/DEVELOPER.md#tool-development-guide) for a complete walkthrough with examples.

---

## Deployment

### Local Development
```bash
npm install
npm run dev  # tsx with watch mode
```

### Production (Built)
```bash
npm run build
node dist/index.js
```

### Docker
```bash
docker build -t superinstance-mcp .
echo '{...}' | docker run -i superinstance-mcp
```

### Cloudflare Worker (Remote HTTP MCP)
```bash
npx wrangler deploy --name superinstance-mcp-remote
# Connect from anywhere: https://superinstance-mcp-remote.your-account.workers.dev
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Server won't start | Check Node 18+: `node --version` |
| Agent doesn't see tools | Use absolute paths in config, restart agent |
| Tools return "static-fallback" | Expected when APIs offline — server is working correctly |
| `npx tsx` not found | `npm install -g tsx` or use `node dist/index.js` |
| Timeout errors | Check if fleet APIs are reachable: `curl $FLEET_API_URL/api/fleet/status` |

See [`docs/DEVELOPER.md`](docs/DEVELOPER.md#troubleshooting--debugging) for detailed debugging.

---

## Ecosystem

| Component | Role |
|-----------|------|
| [conservation-law](https://github.com/SuperInstance/conservation-law) | Rust: γ + η ≤ C framework |
| [ternary-pid](https://github.com/SuperInstance/ternary-pid) | Rust: PID governor driving γ → C/2 |
| [shoal](https://github.com/SuperInstance/shoal) | Conservation-bounded semantic oracle |
| [fleet-dashboard](https://github.com/SuperInstance/fleet-dashboard) | 3-panel visualizer |
| [fleet-dashboard-api](https://github.com/SuperInstance/fleet-dashboard-api) | Live telemetry Worker |
| [fleet-edge-worker](https://github.com/SuperInstance/fleet-edge-worker) | Edge coordination (baton + PID) |
| [fleet-budget](https://github.com/SuperInstance/fleet-budget) | D1 ledger enforcing γ+η≤C |
| [baton-router](https://github.com/SuperInstance/baton-router) | Queues + D1 message routing |
| [openagent](https://github.com/SuperInstance/openagent) | Go runtime: 9 platforms, MCP, RAG |
| [Conservation Theorem](https://github.com/SuperInstance/superinstance-website/blob/main/papers/conservation-entropy-theorem.md) | Full proof (860 lines) |

---

## Documentation Index

| Document | Audience | Content |
|----------|----------|---------|
| **README.md** (this file) | Everyone | Overview, install, tool reference |
| [docs/DEVELOPER.md](docs/DEVELOPER.md) | Developers extending the server | MCP internals, tool building, API contracts, security, testing |
| [docs/COOKBOOK.md](docs/COOKBOOK.md) | Integrators | 13 copy-paste recipes: CI/CD, K8s, Prometheus, Slack bots, multi-agent patterns |

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
- Every new tool must include conservation metadata in responses
- Test with `npx @modelcontextprotocol/inspector npx tsx src/index.ts`
- Keep `src/index.ts` as a single file — no build step for dev
- Update docs when adding tools

---

## License

MIT © SuperInstance

---

*γ + η ≤ C — build within the law.*
