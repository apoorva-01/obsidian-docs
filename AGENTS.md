# obsidian-docs Agent Guidance

## Quick Start (OpenCode, Codex, Claude Code)

```bash
npm install
node --test test/cli.test.js   # 34 tests, built-in node:test
npm link                        # link globally to test CLI from any directory
```

**Note:** `npm test` has a bug (passes `test/` instead of `test/cli.test.js`) — use the direct command above.

## Project Structure

```
bin/obsidian-docs     # CLI entry point (commander.js)
commands/             # Command implementations (install, uninstall, hook, status, backfill, demo, relocate, update)
lib/                  # Utilities: detect.js (stack detection), claude-md.js (CLAUDE.md), agents-md.js (AGENTS.md)
templates/            # SKILL.md (Claude Code skill template), hooks/ (PostToolUse nudge script)
test/cli.test.js      # 526 lines, self-contained with temp dirs
```

## Key Patterns

- **ESM module**: `package.json` has `"type": "module"` — all source uses `import`, never `require`
- **No external test deps**: Uses Node's built-in `node:test`, `node:assert/strict`
- **No lint/typecheck**: Not configured in package.json
- **Zero runtime deps except CLI helpers**: chalk, commander, enquirer, ora

## Platform Instruction Files

| Platform | Instruction File | Skills | Status |
|----------|-----------------|--------|--------|
| **Claude Code** | `CLAUDE.md` (patched by install) | `.claude/skills/obsidian-docs/SKILL.md` | Full support |
| **OpenCode** | `AGENTS.md` (patched by install) | `.claude/skills/` (fallback supported) | Full support |
| **Codex** | `AGENTS.md` (patched by install) | No skills system | Full support (reads AGENTS.md) |

**Note:** Install now patches both `CLAUDE.md` and `AGENTS.md` for cross-platform compatibility.

## CLI Commands

| Command | Purpose |
|---------|---------|
| `install` | Scaffold vault + skill, patch both CLAUDE.md and AGENTS.md |
| `uninstall` | Remove vault + skill + marker blocks from both files |
| `status` | Health check, auto-detects vault rename |
| `hook install` | Add PostToolUse hook (Claude Code only) |
| `backfill` | Spawn Claude to populate vault from existing code |
| `demo` | Spin up fake project with populated vault |

## Testing a Change

1. Make your code change
2. Run `node --test test/cli.test.js` — all 34 tests must pass
3. If adding behavior, add a test in `test/cli.test.js` using the existing patterns:
   - `makeProject()` helper creates temp dir with fixture package.json
   - `run(cwd, args)` helper spawns CLI
   - Tests use `node:test` assertion API

## Common Flags

- `install --no-git` — skip auto-commit
- `install --vault-path notes` — custom vault folder
- `uninstall --keep-vault` — keep docs/, remove skill + sections only
- `backfill --dry-run` — preview prompt without spawning Claude