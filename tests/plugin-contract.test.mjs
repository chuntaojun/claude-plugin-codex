import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

test("plugin manifest declares the claude MCP server config", () => {
  const manifest = readJson(".codex-plugin/plugin.json");

  assert.equal(manifest.name, "claude");
  assert.equal(manifest.mcpServers, "./.mcp.json");
  assert.equal(manifest.interface.displayName, "Claude");
});

test("mcp config starts the local claude server through node", () => {
  const config = readJson(".mcp.json");
  const server = config.mcpServers.claude;

  assert.equal(server.command, "node");
  assert.deepEqual(server.args, ["./scripts/claude-mcp-server.mjs"]);
  assert.equal(server.cwd, ".");
});

test("commands route through MCP tools instead of plugin-root shell paths", () => {
  const taskCommand = readText("commands/task.md");
  const setupCommand = readText("commands/setup.md");
  const reviewCommand = readText("commands/review.md");

  assert.match(taskCommand, /claude_task/);
  assert.match(taskCommand, /claude_setup/);
  assert.doesNotMatch(taskCommand, /CODEX_PLUGIN_ROOT/);
  assert.match(setupCommand, /claude_setup/);
  assert.doesNotMatch(setupCommand, /CODEX_PLUGIN_ROOT/);
  assert.match(reviewCommand, /claude_task/);
  assert.match(reviewCommand, /git diff/);
  assert.match(reviewCommand, /permissionMode.*default/s);
  assert.doesNotMatch(reviewCommand, /CODEX_PLUGIN_ROOT/);
});

test("README documents the review quick command", () => {
  const readme = readText("README.md");

  assert.match(readme, /\/claude:review/);
  assert.match(readme, /uncommitted/i);
});
