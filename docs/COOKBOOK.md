# Integration Cookbook: SuperInstance MCP Server

> **Practical recipes for connecting the SuperInstance fleet to any system via MCP.**

---

## Table of Contents

1. [Recipe: GitHub Actions CI Gate](#recipe-github-actions-ci-gate)
2. [Recipe: Pre-Commit Hook](#recipe-pre-commit-hook)
3. [Recipe: Slack/Discord Bot Fleet Status](#recipe-slackdiscord-bot-fleet-status)
4. [Recipe: GitLab CI Integration](#recipe-gitlab-ci-integration)
5. [Recipe: Jenkins Pipeline Gate](#recipe-jenkins-pipeline-gate)
6. [Recipe: Docker Entrypoint Validation](#recipe-docker-entrypoint-validation)
7. [Recipe: Kubernetes Admission Controller](#recipe-kubernetes-admission-controller)
8. [Recipe: Python Async Fleet Manager](#recipe-python-async-fleet-manager)
9. [Recipe: Rust Fleet Client](#recipe-rust-fleet-client)
10. [Recipe: Monitoring Stack (Grafana)](#recipe-monitoring-stack-grafana)
11. [Recipe: Conservation-Aware Claude Code Workflow](#recipe-conservation-aware-claude-code-workflow)
12. [Recipe: Multi-Agent Task Distribution](#recipe-multi-agent-task-distribution)
13. [Recipe: Embedding in a Go Binary](#recipe-embedding-in-a-go-binary)

---

## Recipe: GitHub Actions CI Gate

**Goal:** Block PRs that would violate the conservation law.

```yaml
# .github/workflows/conservation-gate.yml
name: Conservation Law Gate

on:
  pull_request:
    branches: [main, master]

jobs:
  conservation-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install MCP Server
        run: |
          git clone https://github.com/SuperInstance/superinstance-mcp.git
          cd superinstance-mcp && npm install

      - name: Run Conservation Check
        env:
          # Estimate γ from PR diff size, η from test count
          GAMMA: ${{ steps.estimate.outputs.gamma }}
          ETA: ${{ steps.estimate.outputs.eta }}
        run: |
          # Use the MCP server as a CLI tool via JSON-RPC
          RESPONSE=$(echo "{
            \"jsonrpc\": \"2.0\",
            \"method\": \"tools/call\",
            \"params\": {
              \"name\": \"conservation_check\",
              \"arguments\": { \"gamma\": $GAMMA, \"eta\": $ETA }
            },
            \"id\": 1
          }" | node superinstance-mcp/dist/index.js 2>/dev/null)

          VALID=$(echo "$RESPONSE" | jq -r '.result.content[0].text' | jq -r '.valid')

          if [ "$VALID" != "true" ]; then
            echo "❌ Conservation law violated! This PR exceeds fleet capacity."
            echo "$RESPONSE" | jq -r '.result.content[0].text' | jq -r '.message'
            exit 1
          fi

          echo "✅ Conservation law satisfied."
```

---

## Recipe: Pre-Commit Hook

**Goal:** Local conservation check before every commit.

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit (make executable: chmod +x)

# Estimate conservation cost from diff
LINES=$(git diff --cached --numstat | awk '{added+=$1; removed+=$2} END {print added+removed}')
GAMMA=$(echo "scale=4; $LINES / 10000" | bc)
ETA=0.1  # Base entropy for any change

RESULT=$(echo "{
  \"jsonrpc\": \"2.0\",
  \"method\": \"tools/call\",
  \"params\": {
    \"name\": \"conservation_check\",
    \"arguments\": { \"gamma\": $GAMMA, \"eta\": $ETA }
  },
  \"id\": 1
}" | npx tsx /path/to/superinstance-mcp/src/index.ts 2>/dev/null)

VALID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['result']['content'][0]['text'] | json.loads | json['valid'])" 2>/dev/null)

if [ "$VALID" != "True" ]; then
  echo "❌ Conservation law violated by this commit."
  echo "   γ=$GAMMA η=$ETA exceeds C=log₂(3)≈1.585"
  echo "   Reduce the diff or split into smaller commits."
  exit 1
fi

echo "✅ Conservation OK (γ=$GAMMA η=$ETA)"
```

---

## Recipe: Slack/Discord Bot Fleet Status

**Goal:** A bot that reports fleet status on demand.

```python
#!/usr/bin/env python3
"""Slack bot that queries SuperInstance fleet via MCP."""

import asyncio
import json
import os
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MCP_SERVER_PATH = "/path/to/superinstance-mcp/src/index.ts"

async def query_fleet(tool_name: str, args: dict = None) -> dict:
    params = StdioServerParameters(
        command="npx",
        args=["tsx", MCP_SERVER_PATH],
    )
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, args or {})
            return json.loads(result.content[0].text)

async def handle_command(command: str):
    if command == "status":
        data = await query_fleet("fleet_status")
        return (
            f"🦀 *Fleet Status*\n"
            f"Conservation: {data['conservation']['status']}\n"
            f"γ={data['conservation']['gamma_total']} "
            f"η={data['conservation']['eta_total']} "
            f"C={data['conservation']['C_approx']}\n"
            f"Agents: {data['agents']['active']} active, "
            f"{data['agents']['standby']} standby"
        )

    elif command.startswith("search "):
        query = command[7:]
        data = await query_fleet("fleet_search", {"query": query, "topK": 3})
        lines = [f"🔍 *Search: {query}*"]
        for r in data.get("results", []):
            lines.append(f"  • {r.get('name', 'unknown')}: {r.get('description', '')[:80]}")
        return "\n".join(lines)

    elif command == "stats":
        data = await query_fleet("ecosystem_stats")
        return (
            f"📊 *Ecosystem Stats*\n"
            f"Crates: {data['crates']}\n"
            f"Workers: {data['workers']}\n"
            f"Tests: {data['tests']}\n"
            f"Repos: {data['repos']}\n"
            f"Law: {data['conservation_law']}"
        )

    elif command == "agents":
        data = await query_fleet("fleet_agents")
        lines = ["🤖 *Fleet Agents*"]
        for a in data["agents"]:
            lines.append(
                f"  • {a['name']} ({a['role']}) — "
                f"γ={a['gamma']} η={a['eta']} "
                f"[{a['status']}]"
            )
        return "\n".join(lines)

    else:
        return (
            "Commands: `status`, `stats`, `agents`, "
            "`search <query>`, `budget <gamma> <eta>`"
        )

# Wire into Slack/Discord framework of choice
async def main():
    print(await handle_command("status"))
    print()
    print(await handle_command("stats"))
    print()
    print(await handle_command("agents"))

asyncio.run(main())
```

---

## Recipe: GitLab CI Integration

```yaml
# .gitlab-ci.yml
conservation_check:
  stage: test
  image: node:22
  before_script:
    - git clone https://github.com/SuperInstance/superinstance-mcp.git
    - cd superinstance-mcp && npm install && npm run build && cd ..
  script:
    - |
      RESPONSE=$(echo '{
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
          "name": "conservation_check",
          "arguments": { "gamma": 0.8, "eta": 0.5 }
        },
        "id": 1
      }' | node superinstance-mcp/dist/index.js 2>/dev/null)

      echo "$RESPONSE" | jq -r '.result.content[0].text' | jq .
      VALID=$(echo "$RESPONSE" | jq -r '.result.content[0].text' | jq -r '.valid')

      if [ "$VALID" != "true" ]; then
        echo "Conservation law violated"
        exit 1
      fi
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

---

## Recipe: Jenkins Pipeline Gate

```groovy
// Jenkinsfile
pipeline {
    agent any
    stages {
        stage('Conservation Gate') {
            steps {
                script {
                    def response = sh(
                        returnStdout: true,
                        script: """
                            echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"conservation_check","arguments":{"gamma":0.8,"eta":0.6}},"id":1}' | \
                            node /path/to/superinstance-mcp/dist/index.js 2>/dev/null
                        """
                    ).trim()

                    def data = readJSON(text: new groovy.json.JsonSlurper().parseText(response).result.content[0].text)

                    if (!data.valid) {
                        error("Conservation law violated: ${data.message}")
                    }
                    echo "Conservation OK: ${data.message}"
                }
            }
        }
    }
}
```

---

## Recipe: Docker Entrypoint Validation

```dockerfile
# Dockerfile.entrypoint
FROM node:22-slim AS mcp-builder
WORKDIR /build
RUN git clone https://github.com/SuperInstance/superinstance-mcp.git .
RUN npm install && npm run build

FROM node:22-slim
COPY --from=mcp-builder /build/dist/index.js /opt/mcp/index.js
COPY --from=mcp-builder /build/node_modules /opt/mcp/node_modules

# Entrypoint script validates before starting
COPY <<'EOF' /entrypoint.sh
#!/bin/bash
set -e

# Validate conservation before starting the service
RESULT=$(echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"fleet_status","arguments":{}},"id":1}' | \
  node /opt/mcp/index.js 2>/dev/null)

STATUS=$(echo "$RESULT" | jq -r '.result.content[0].text' | jq -r '.conservation.status')

if echo "$STATUS" | grep -q "VIOLATED"; then
  echo "❌ Conservation law violated — refusing to start."
  echo "$RESULT" | jq -r '.result.content[0].text'
  exit 1
fi

echo "✅ Conservation OK — starting service."
exec "$@"
EOF
chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "app.js"]
```

---

## Recipe: Kubernetes Admission Controller

```python
#!/usr/bin/env python3
"""
Kubernetes Mutating Admission Controller that checks conservation law
before allowing pod creation.

Deploy as a Kubernetes webhook service. Every pod creation triggers
a conservation_check via the MCP server.
"""

from flask import Flask, request, jsonify
import json
import subprocess

app = Flask(__name__)

MCP_SERVER = "/path/to/superinstance-mcp/dist/index.js"

def check_conservation(gamma: float, eta: float) -> bool:
    """Query MCP server for conservation status."""
    payload = json.dumps({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "conservation_check",
            "arguments": {"gamma": gamma, "eta": eta}
        },
        "id": 1
    })

    result = subprocess.run(
        ["node", MCP_SERVER],
        input=payload,
        capture_output=True,
        text=True,
        timeout=10
    )

    try:
        response = json.loads(result.stdout)
        data = json.loads(response["result"]["content"][0]["text"])
        return data["valid"]
    except Exception:
        return True  # Fail open if MCP unavailable

@app.route("/validate", methods=["POST"])
def validate():
    request_info = request.get_json()
    pod = request_info["request"]["object"]

    # Estimate conservation cost
    containers = len(pod["spec"]["containers"])
    gamma = containers * 0.1  # each container costs 0.1 γ
    eta = 0.05                # base entropy per pod

    allowed = check_conservation(gamma, eta)

    return jsonify({
        "apiVersion": "admission.k8s.io/v1",
        "kind": "AdmissionReview",
        "response": {
            "allowed": allowed,
            "status": {
                "message": f"Conservation check: γ={gamma} η={eta} → {'PASS' if allowed else 'FAIL'}"
            } if not allowed else {}
        }
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8443, ssl_context=("/certs/tls.crt", "/certs/tls.key"))
```

---

## Recipe: Python Async Fleet Manager

```python
"""
Async fleet manager that uses MCP tools to coordinate agents
under conservation-law governance.
"""

import asyncio
import json
from dataclasses import dataclass
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MCP_PATH = "/path/to/superinstance-mcp/src/index.ts"

@dataclass
class Task:
    name: str
    gamma_cost: float
    eta_expected: float

class FleetManager:
    def __init__(self):
        self.session = None

    async def connect(self):
        params = StdioServerParameters(command="npx", args=["tsx", MCP_PATH])
        self.transport = stdio_client(params)
        read, write = await self.transport.__aenter__()
        self.session = ClientSession(read, write)
        await self.session.__aenter__()
        await self.session.initialize()

    async def close(self):
        await self.session.__aexit__(None, None, None)
        await self.transport.__aexit__(None, None, None)

    async def _call(self, tool: str, args: dict = None) -> dict:
        result = await self.session.call_tool(tool, args or {})
        return json.loads(result.content[0].text)

    async def get_status(self) -> dict:
        return await self._call("fleet_status")

    async def can_spawn(self, task: Task) -> bool:
        """Check if fleet has budget for a new task."""
        budget = await self._call("fleet_budget", {
            "gamma_used": task.gamma_cost,
            "eta_produced": task.eta_expected
        })
        return budget["status"].startswith("✅")

    async def spawn_agent(self, task: Task) -> bool:
        """Spawn an agent if conservation law allows."""
        if not await self.can_spawn(task):
            print(f"❌ Cannot spawn {task.name}: conservation budget exceeded")
            return False

        # Check conservation after estimated costs
        check = await self._call("conservation_check", {
            "gamma": task.gamma_cost,
            "eta": task.eta_expected
        })
        if not check["valid"]:
            print(f"❌ {task.name} violates conservation: {check['message']}")
            return False

        print(f"✅ Spawning {task.name} (γ={task.gamma_cost}, η={task.eta_expected})")
        # ... actual agent spawn logic ...
        return True

    async def batch_spawn(self, tasks: list[Task]) -> list[bool]:
        """Try to spawn multiple tasks within conservation budget."""
        results = []
        for task in tasks:
            success = await self.spawn_agent(task)
            results.append(success)
            if not success:
                print(f"Stopping batch: budget exhausted at {task.name}")
                break
        return results

    async def find_pattern(self, query: str) -> list[dict]:
        """Search fleet knowledge for existing solutions."""
        data = await self._call("fleet_search", {"query": query, "topK": 5})
        return data.get("results", [])

    async def health_report(self) -> str:
        """Generate a human-readable fleet health report."""
        status = await self.get_status()
        cons = status["conservation"]
        agents = status["agents"]
        conv = status["convergence"]

        return (
            f"Fleet Health Report\n"
            f"{'='*40}\n"
            f"Conservation: {cons['status']}\n"
            f"  γ={cons['gamma_total']} η={cons['eta_total']} C={cons['C_approx']}\n"
            f"  Utilization: {cons['utilization']}\n"
            f"Agents: {agents['active']} active, {agents['standby']} standby\n"
            f"Convergence: δ({conv['n']})={conv['delta_approx']}\n"
            f"  Formula: {conv['formula']}"
        )

# Usage
async def main():
    manager = FleetManager()
    await manager.connect()

    print(await manager.health_report())
    print()

    # Try to spawn tasks
    tasks = [
        Task("build-crate", gamma_cost=0.3, eta_expected=0.2),
        Task("run-tests", gamma_cost=0.15, eta_expected=0.1),
        Task("deploy-worker", gamma_cost=0.4, eta_expected=0.3),
        Task("extra-work", gamma_cost=0.5, eta_expected=0.4),  # This one might fail
    ]

    results = await manager.batch_spawn(tasks)
    print(f"Spawned {sum(results)}/{len(tasks)} tasks")

    print()
    patterns = await manager.find_pattern("rate limiter")
    for p in patterns:
        print(f"  Found: {p.get('name', 'unknown')}")

    await manager.close()

asyncio.run(main())
```

---

## Recipe: Rust Fleet Client

```rust
//! Rust client for the SuperInstance MCP Server
//!
//! Add to Cargo.toml:
//! [dependencies]
//! mcp-client = "0.1"
//! serde_json = "1"
//! tokio = { version = "1", features = ["full"] }

use mcp_client::{Client, StdioTransport, CallToolResult};
use serde_json::json;

#[derive(Debug)]
pub struct ConservationStatus {
    pub valid: bool,
    pub gamma: f64,
    pub eta: f64,
    pub c_total: f64,
    pub c_limit: f64,
    pub delta: f64,
    pub message: String,
}

pub struct FleetClient {
    client: Client,
}

impl FleetClient {
    pub async fn new(mcp_path: &str) -> anyhow::Result<Self> {
        let transport = StdioTransport::new("npx", &["tsx", mcp_path]);
        let mut client = Client::new(transport);
        client.initialize().await?;
        Ok(Self { client })
    }

    pub async fn conservation_check(
        &self,
        gamma: f64,
        eta: f64,
    ) -> anyhow::Result<ConservationStatus> {
        let result = self.client
            .call_tool("conservation_check", json!({ "gamma": gamma, "eta": eta }))
            .await?;

        let data: serde_json::Value =
            serde_json::from_str(&result.content[0].text)?;

        Ok(ConservationStatus {
            valid: data["valid"].as_bool().unwrap_or(false),
            gamma: data["gamma"].as_f64().unwrap_or(0.0),
            eta: data["eta"].as_f64().unwrap_or(0.0),
            c_total: data["c_total"].as_f64().unwrap_or(0.0),
            c_limit: data["c_limit"].as_f64().unwrap_or(1.585),
            delta: data["delta"].as_f64().unwrap_or(0.0),
            message: data["message"]
                .as_str()
                .unwrap_or("Unknown")
                .to_string(),
        })
    }

    pub async fn fleet_status(&self) -> anyhow::Result<serde_json::Value> {
        let result = self.client
            .call_tool("fleet_status", json!({}))
            .await?;
        Ok(serde_json::from_str(&result.content[0].text)?)
    }

    pub async fn search(
        &self,
        query: &str,
        top_k: u32,
    ) -> anyhow::Result<serde_json::Value> {
        let result = self.client
            .call_tool("fleet_search", json!({
                "query": query,
                "topK": top_k
            }))
            .await?;
        Ok(serde_json::from_str(&result.content[0].text)?)
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let fleet = FleetClient::new(
        "/path/to/superinstance-mcp/src/index.ts"
    ).await?;

    let status = fleet.conservation_check(0.9, 0.5).await?;
    println!("Conservation: {:?}", status);

    let fleet_data = fleet.fleet_status().await?;
    println!(
        "Active agents: {}",
        fleet_data["agents"]["active"]
    );

    Ok(())
}
```

---

## Recipe: Monitoring Stack (Grafana)

**Goal:** Export fleet metrics to Prometheus/Grafana.

```python
#!/usr/bin/env python3
"""
Prometheus exporter that bridges SuperInstance MCP metrics
to the Prometheus format.
"""

import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from prometheus_client import make_asgi_app, Gauge
import uvicorn

MCP_PATH = "/path/to/superinstance-mcp/src/index.ts"

# Prometheus metrics
GAUGE_GAMMA = Gauge('superinstance_gamma', 'Total fleet gamma (coupling cost)')
GAUGE_ETA = Gauge('superinstance_eta', 'Total fleet eta (value produced)')
GAUGE_C = Gauge('superinstance_c', 'Conservation capacity C = log2(3)')
GAUGE_REMAINING = Gauge('superinstance_remaining', 'Remaining conservation budget')
GAUGE_AGENTS_ACTIVE = Gauge('superinstance_agents_active', 'Active agent count')
GAUGE_AGENTS_STANDBY = Gauge('superinstance_agents_standby', 'Standby agent count')
GAUGE_DELTA = Gauge('superinstance_delta', 'Convergence rate delta(n)')

async def update_metrics():
    """Poll MCP server and update Prometheus gauges."""
    params = StdioServerParameters(command="npx", args=["tsx", MCP_PATH])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("fleet_status", {})
            data = json.loads(result.content[0].text)

            cons = data["conservation"]
            GAUGE_GAMMA.set(cons["gamma_total"])
            GAUGE_ETA.set(cons["eta_total"])
            GAUGE_C.set(cons["C"])
            GAUGE_REMAINING.set(cons["remaining"])
            GAUGE_AGENTS_ACTIVE.set(data["agents"]["active"])
            GAUGE_AGENTS_STANDBY.set(data["agents"]["standby"])
            GAUGE_DELTA.set(data["convergence"]["delta"])

async def metrics_loop():
    while True:
        try:
            await update_metrics()
        except Exception as e:
            print(f"Metrics update failed: {e}")
        await asyncio.sleep(15)  # Update every 15s

app = make_asgi_app()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.create_task(metrics_loop())
    uvicorn.run(app, host="0.0.0.0", port=9090)
```

**Grafana Dashboard JSON (import):**

```json
{
  "title": "SuperInstance Fleet",
  "panels": [
    {
      "title": "Conservation Balance",
      "type": "gauge",
      "targets": [{
        "expr": "superinstance_gamma + superinstance_eta",
        "legendFormat": "γ + η"
      }, {
        "expr": "superinstance_c",
        "legendFormat": "C (limit)"
      }]
    },
    {
      "title": "Remaining Budget",
      "type": "stat",
      "targets": [{
        "expr": "superinstance_remaining"
      }]
    },
    {
      "title": "Active Agents",
      "type": "stat",
      "targets": [{
        "expr": "superinstance_agents_active"
      }]
    },
    {
      "title": "Convergence δ(n)",
      "type": "graph",
      "targets": [{
        "expr": "superinstance_delta"
      }]
    }
  ]
}
```

---

## Recipe: Conservation-Aware Claude Code Workflow

**Goal:** Set up Claude Code to automatically use fleet tools.

```bash
# 1. Install MCP server globally
cd /path/to/superinstance-mcp
./install.sh

# 2. Create project-level instructions
cat > /your/project/.claude/instructions.md << 'EOF'
## SuperInstance Fleet Integration

This project is part of the SuperInstance fleet. Always:

### Session Start
- Call `fleet_status` to check current fleet health
- Call `ecosystem_stats` to understand the project's context

### Before Writing Code
- Call `fleet_search` with your intended feature to find existing patterns
- Call `crate_info` for any SuperInstance crate you're working with

### Before Suggesting Architecture
- Call `conservation_check` with estimated γ/η to verify feasibility
- Call `fleet_budget` to confirm compute budget exists

### When Working with Signals
- Call `ternary_validate` on any {-1,0,+1} data

### Commit Messages
- Include conservation status: `[γ=0.X η=0.X δ=0.X]`
EOF

# 3. Create a Claude Code skill for new crates
mkdir -p ~/.claude/skills/superinstance-new-crate
cat > ~/.claude/skills/superinstance-new-crate/SKILL.md << 'EOF'
---
name: superinstance-new-crate
description: Scaffold a new SuperInstance Rust crate
---

When creating a new crate:
1. Call `ecosystem_stats` for current state
2. Call `crate_info("ternary")` for base dependency pattern
3. Generate:
   - Cargo.toml: name, version 0.1.0, edition 2021, deps on conservation-law + serde
   - src/lib.rs: imports from conservation_law
   - tests/: basic conservation invariant test
   - README.md: conservation role description
4. Call `conservation_check(0.1, 0.05)` to verify the crate fits the budget
5. Show the user the structure and ask for approval before creating
EOF

# 4. Restart Claude Code and verify
# In Claude Code, type:
# /mcp
# Should show "superinstance" server with 8 tools
```

---

## Recipe: Multi-Agent Task Distribution

**Goal:** Use MCP tools to distribute work across agents within conservation bounds.

```python
#!/usr/bin/env python3
"""
Distribute tasks across fleet agents using conservation law.
Each agent gets work proportional to its remaining budget.
"""

import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def distribute_tasks(tasks: list[dict]):
    """Assign tasks to agents based on conservation budget."""
    params = StdioServerParameters(
        command="npx",
        args=["tsx", "/path/to/superinstance-mcp/src/index.ts"],
    )

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Get current agent states
            result = await session.call_tool("fleet_agents", {})
            data = json.loads(result.content[0].text)

            assignments = []

            for task in tasks:
                assigned = False
                for agent in data["agents"]:
                    # Check if agent has budget for this task
                    if agent["conservation_remaining"] >= task["cost"]:
                        assignments.append({
                            "task": task["name"],
                            "agent": agent["name"],
                            "cost": task["cost"],
                            "remaining_after": agent["conservation_remaining"] - task["cost"],
                        })
                        # Update the agent's remaining budget locally
                        agent["conservation_remaining"] -= task["cost"]
                        assigned = True
                        break

                if not assigned:
                    assignments.append({
                        "task": task["name"],
                        "agent": None,
                        "reason": "No agent has sufficient budget",
                    })

            return assignments

# Example
tasks = [
    {"name": "compile-crates", "cost": 0.15},
    {"name": "run-tests", "cost": 0.10},
    {"name": "deploy-workers", "cost": 0.25},
    {"name": "generate-docs", "cost": 0.08},
    {"name": "heavy-compute", "cost": 0.40},  # Might not fit
]

result = asyncio.run(distribute_tasks(tasks))
for a in result:
    if a["agent"]:
        print(f"  ✅ {a['task']} → {a['agent']} (remaining: {a['remaining_after']:.3f})")
    else:
        print(f"  ❌ {a['task']} → UNASSIGNED ({a['reason']})")
```

---

## Recipe: Embedding in a Go Binary

**Goal:** Ship the MCP server embedded in a Go binary (no Node.js dependency).

```go
package main

import (
	"os/exec"
	"encoding/json"
	"fmt"
)

type MCPResponse struct {
	Result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	} `json:"result"`
}

type ConservationData struct {
	Valid   bool    `json:"valid"`
	Gamma   float64 `json:"gamma"`
	Eta     float64 `json:"eta"`
	CTotal  float64 `json:"c_total"`
	CLimit  float64 `json:"c_limit"`
	Delta   float64 `json:"delta"`
	Message string  `json:"message"`
}

func conservationCheck(gamma, eta float64) (*ConservationData, error) {
	payload, _ := json.Marshal(map[string]any{
		"jsonrpc": "2.0",
		"method":  "tools/call",
		"params": map[string]any{
			"name": "conservation_check",
			"arguments": map[string]any{
				"gamma": gamma,
				"eta":   eta,
			},
		},
		"id": 1,
	})

	cmd := exec.Command("node", "/path/to/superinstance-mcp/dist/index.js")
	cmd.Stdin = bytes.NewReader(payload)
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var resp MCPResponse
	if err := json.Unmarshal(output, &resp); err != nil {
		return nil, err
	}

	var data ConservationData
	json.Unmarshal([]byte(resp.Result.Content[0].Text), &data)
	return &data, nil
}

func main() {
	result, err := conservationCheck(0.8, 0.5)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Conservation: valid=%v δ=%.4f\n%s\n",
		result.Valid, result.Delta, result.Message)
}
```

---

*These recipes cover the most common integration patterns. For more, check [Issues](https://github.com/SuperInstance/superinstance-mcp/issues) or contribute your own!*
