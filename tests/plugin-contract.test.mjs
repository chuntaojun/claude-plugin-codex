import fs from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
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

test("quick install script registers the local plugin marketplace entry", () => {
  const script = readText("install.sh");

  assert.match(script, /git@github\.com:chuntaojun\/claude-plugin-codex\.git/);
  assert.match(script, /MARKETPLACE_PATH/);
  assert.match(script, /claude-plugin-codex/);
  assert.match(script, /\/claude:setup/);
});

test("quick install script writes marketplace entry for configured install dir", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "claude-plugin-install-test-"));
  const sourceRepo = path.join(tmp, "source.git");
  const installDir = path.join(tmp, "home", "plugins", "claude");
  const marketplacePath = path.join(tmp, "home", ".agents", "plugins", "marketplace.json");

  let result = spawnSync("git", ["clone", "--bare", ROOT, sourceRepo], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);

  result = spawnSync("bash", [path.join(ROOT, "install.sh")], {
    cwd: tmp,
    env: {
      ...process.env,
      CLAUDE_PLUGIN_CODEX_REPO: sourceRepo,
      CLAUDE_PLUGIN_CODEX_INSTALL_DIR: installDir,
      CLAUDE_PLUGIN_CODEX_MARKETPLACE: marketplacePath
    },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const marketplace = JSON.parse(fs.readFileSync(marketplacePath, "utf8"));
  const entry = marketplace.plugins.find((plugin) => plugin.name === "claude");
  assert.equal(entry.source.source, "local");
  assert.equal(entry.source.path, "./plugins/claude");
  assert.equal(entry.policy.installation, "AVAILABLE");
  assert.equal(entry.policy.authentication, "ON_INSTALL");
});

test("README documents curl quick install", () => {
  const readme = readText("README.md");

  assert.match(readme, /curl -fsSL/);
  assert.match(readme, /install\.sh/);
  assert.match(readme, /Restart Codex/i);
});

test("Chinese README mirrors install and command usage", () => {
  const english = readText("README.md");
  const chinese = readText("README.zh-CN.md");

  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /README\.md/);
  assert.match(chinese, /快速安装/);
  assert.match(chinese, /\/claude:setup/);
  assert.match(chinese, /\/claude:task/);
  assert.match(chinese, /\/claude:review/);
  assert.match(chinese, /bypassPermissions/);
});
