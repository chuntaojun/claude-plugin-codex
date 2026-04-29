# Claude Plugin For Codex Task Plan

## Plan

- [x] Inspect current repository state and confirm it is an empty plugin workspace.
- [x] Inspect `../codex-plugin-cc` for plugin layout, CLI bridge design, commands, and tests.
- [x] Write failing tests for the Claude companion CLI behavior.
- [x] Implement a Codex plugin skeleton and Claude companion script.
- [x] Add Codex slash commands that invoke the companion script and return Claude output.
- [x] Add user-facing README and setup guidance.
- [x] Run verification: targeted tests, full test suite, and metadata smoke checks.
- [x] Address code review feedback: strict MCP argument validation, safer permissions, protocol fixes, cwd normalization, and spawn-error reporting.
- [x] Add `/claude:review` quick command for implementation review of current uncommitted git changes.
- [x] Polish README with install, usage, runtime, MCP, and development instructions before publishing.
- [x] Add quick install script for local Codex plugin marketplace registration.

## Review

- Implemented root-level Codex plugin metadata in `.codex-plugin/plugin.json`.
- Added `.mcp.json` and `scripts/claude-mcp-server.mjs` so Codex can call Claude through MCP tools without relying on an unproven plugin-root environment variable.
- Added `scripts/claude-companion.mjs` for direct CLI usage and MCP reuse.
- Added `/claude:setup` and `/claude:task` command documents that route through `claude_setup` and `claude_task`.
- Added README usage guidance and tests with a fake Claude CLI fixture.
- Verification passed:
  - `npm test` => 14/14 passing
  - `node --check scripts/claude-companion.mjs` => exit 0
  - `node --check scripts/claude-mcp-server.mjs` => exit 0
  - `node scripts/claude-companion.mjs setup --json` => ready with Claude Code 2.1.122
- Code review follow-up:
  - Strictly validates MCP argument types, including `dangerous`.
  - Defaults Claude permission mode to highest permissions: `bypassPermissions` plus `--dangerously-skip-permissions`; lower permission modes must be explicit.
  - Normalizes `cwd` once and requires it to be an existing directory.
  - Restricts `addDir` to paths inside `cwd`.
  - Implements MCP `ping`, protocol-version echo for supported versions, one-way notification handling, and clearer spawn-error reporting.
- User correction follow-up:
  - Updated default Claude task execution to highest permission mode in both direct companion and MCP tool paths.
  - Added regression coverage for the highest-permission default.
- Quick command follow-up:
  - Added `/claude:review [focus]` to review current staged and unstaged git changes for implementation reasonableness.
  - The review shortcut explicitly uses `permissionMode: default` so review does not edit files.
- Publishing follow-up:
  - Added `.gitignore` and MIT `LICENSE`.
  - Expanded README with requirements, install notes, command examples, MCP tool arguments, and development checks.
- Installer follow-up:
  - Added `install.sh` for `curl | bash` quick install.
  - The installer clones or updates the plugin, writes a plugin-creator-compatible local marketplace entry, and prints restart plus `/claude:setup` instructions.
  - Added tests that execute the installer against a temporary bare repo and verify the generated marketplace entry.
