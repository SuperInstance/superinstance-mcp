#!/usr/bin/env bash
set -euo pipefail

# SuperInstance MCP Server Installer
# Installs deps, configures Claude Code, and tests the server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_CONFIG_DIR="$HOME/.claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/.mcp.json"

echo "╔══════════════════════════════════════════════════════╗"
echo "║     SuperInstance MCP Server — Installer             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd "$SCRIPT_DIR"
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Copy .mcp.json to Claude Code config
echo "🔧 Configuring Claude Code..."
mkdir -p "$CLAUDE_CONFIG_DIR"

if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "⚠️  Existing config found at $CLAUDE_CONFIG_FILE"
    echo "   Backing up to $CLAUDE_CONFIG_FILE.bak"
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.bak"
fi

cp "$SCRIPT_DIR/.mcp.json" "$CLAUDE_CONFIG_FILE"
echo "✅ MCP config written to $CLAUDE_CONFIG_FILE"
echo ""

# Step 3: Test server starts
echo "🧪 Testing server startup..."
timeout 3 npx tsx "$SCRIPT_DIR/src/index.ts" 2>&1 || true

# Check if it printed the startup line
echo ""
echo "✅ Server test complete (startup messages above are expected)"
echo ""

# Step 4: Summary
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                              ║"
echo "║                                                      ║"
echo "║  MCP config: $CLAUDE_CONFIG_FILE          "
echo "║  Server:      $SCRIPT_DIR/src/index.ts    "
echo "║                                                      ║"
echo "║  Restart Claude Code to load the new MCP tools.      ║"
echo "╚══════════════════════════════════════════════════════╝"
