# obsidian-docs

### AI memory for your codebase.

> One command gives [Claude Code](https://claude.com/claude-code) a persistent, structured memory of your repo — the *why* behind every module, every architectural decision, every gotcha — and keeps it fresh as you code.

[![npm version](https://img.shields.io/npm/v/obsidian-docs.svg)](https://www.npmjs.com/package/obsidian-docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-23%20passing-brightgreen.svg)](test/cli.test.js)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

```bash
npx obsidian-docs install
```

> [!NOTE]
> **In a real codebase:** `<X>×` faster onboarding · `<Y>%` fewer "where is X defined?" lookups by Claude · `<Z>` of architectural decisions captured that would otherwise have been lost.
> *(Numbers from <project> after Z weeks. Run it on yours and tell me — open an [issue](https://github.com/apoorva-01/obsidian-docs/issues) with your before/after.)*

---

## Try it without touching your repo

```bash
npx obsidian-docs demo
```

Spins up a fake project in a temp directory, fully populated with sample modules, ADRs, and a runbook. Open the resulting `docs/` folder in [Obsidian](https://obsidian.md) and switch to graph view — that's what a healthy `obsidian-docs`-managed repo looks like.

---

## What it does

Two parties, one source of truth:

| Audience | What they see | How they use it |
|---|---|---|
| 👩‍💻 **Humans** | An Obsidian vault at `docs/` — browsable graph, wikilinks between notes, search | Onboarding, design rationale, "why did we do it this way?" |
| 🤖 **Claude Code** | A skill at `.claude/skills/obsidian-docs/SKILL.md` + a section in `CLAUDE.md` | Claude reads the vault for context, writes new notes when you change code, updates the index, never duplicates |

Run `install` once and your repo gets:

- 📁 An **Obsidian vault** at `docs/` (modules, ADRs, runbooks, architecture)
- 🎯 A **Claude Code skill** that enforces strict templates and `[[wikilinks]]`
- 📝 A **documentation policy** injected into `CLAUDE.md`
- 🪝 An optional **PostToolUse hook** that nudges Claude after every Write/Edit

From then on, when you ask Claude *"add a NotificationService that calls SendGrid"* — Claude writes the code AND creates the module note, links its dependencies, and updates `_INDEX.md`. In the same commit.

---

## Why?

Code answers **what**. Memory answers **why**.

Today, every Claude session starts cold. It re-reads files, re-derives architecture, re-discovers gotchas you've explained ten times. That's wasted context window, wasted latency, wasted attention.

Most repos try to solve this two ways, and both fail:

| Failure | What it looks like |
|---|---|
| **No docs** | New devs and AI agents both read code blind. Decisions are lost. Onboarding takes weeks. Claude makes the same mistake twice. |
| **Stale docs** | A `README.md` graveyard. A Notion page nobody updates. AI agents get told the wrong thing about your system. |

`obsidian-docs` is the third path: **structured templates so docs are cheap to write, plus a skill + hook so Claude maintains them in the same commit as the code.** Humans browse it as a graph; AI reads it as structured context. It doesn't drift because it's not a side project — it's part of how Claude works in your repo.

---

## Install

```bash
# One-off (recommended)
npx obsidian-docs install

# Or install globally
npm install -g obsidian-docs
obsidian-docs install
```

Requires Node ≥ 18.

---

## What gets created

```
your-repo/
├── CLAUDE.md                                    ← obsidian-docs section appended
│                                                  (existing content preserved)
├── .claude/
│   ├── skills/obsidian-docs/SKILL.md           ← templates + rules Claude follows
│   └── hooks/obsidian-docs-nudge.sh            ← optional PostToolUse hook
└── docs/                                        ← Obsidian vault
    ├── _INDEX.md                                ← master index
    ├── modules/                                 ← one note per module/service
    ├── decisions/                               ← Architecture Decision Records
    ├── runbooks/                                ← operational procedures
    ├── architecture/                            ← system overviews
    └── .obsidian/                               ← Obsidian app config
```

Open `docs/` in Obsidian to browse it as a linked graph.

---

## Commands

| Command | What it does |
|---|---|
| `obsidian-docs demo` | Spin up a fully-populated demo project so you can see it before installing |
| `obsidian-docs install` | Scaffold the vault, install the skill, patch `CLAUDE.md`, commit. Safe on existing repos. |
| `obsidian-docs status` | Health check — are all the pieces in place? |
| `obsidian-docs update` | Refresh `SKILL.md` to the latest version |
| `obsidian-docs hook install` | Install a PostToolUse hook that nudges Claude after Write/Edit |
| `obsidian-docs hook uninstall` | Remove the hook |
| `obsidian-docs backfill [path]` | Spawn Claude Code to populate `docs/modules/` from existing source |
| `obsidian-docs uninstall` | Surgical removal — vault, skill, and the marker block from `CLAUDE.md` |

### Common flags

```bash
obsidian-docs install --global       # share one skill across all repos (~/.claude/skills/)
obsidian-docs install --no-git       # skip the auto-commit
obsidian-docs hook install --local   # personal-only (settings.local.json, gitignored)
obsidian-docs uninstall --keep-vault # remove skill + section, keep your notes
obsidian-docs uninstall --yes        # skip confirmation
obsidian-docs backfill --dry-run     # show the prompt without spawning Claude
obsidian-docs backfill src/auth      # scope to a subdirectory
```

---

## Two scenarios

### 🆕 New repo

```bash
mkdir my-app && cd my-app
git init && npm init -y
obsidian-docs install
# done in 30 seconds
```

### 🏚 Existing codebase

The install command is **safe to run on any existing repo** — it never overwrites your content. It detects what's there and only fills gaps.

| Existing state | What happens |
|---|---|
| No `CLAUDE.md`, no `docs/` | Creates both from scratch |
| `CLAUDE.md` exists | Appends section between `<!-- obsidian-docs:start/end -->` markers — original content untouched |
| `docs/` exists with content | Only creates missing folders/files. Existing notes left alone. |
| Re-running | Replaces just the marker block in `CLAUDE.md`; leaves vault notes alone; refreshes `SKILL.md` |

After install, ask Claude to backfill what's already there:

```bash
obsidian-docs backfill            # auto-targets src/ (or lib/, app/, packages/)
obsidian-docs backfill src/auth   # or batch by area for review
```

---

## How Claude actually uses it

Once installed, you talk to Claude naturally:

```
> Add a NotificationService that sends emails via SendGrid.
```

Claude writes the code AND:
- Creates `docs/modules/NotificationService.md` from the template
- Updates `docs/modules/SendGridClient.md` (if it exists) under "Consumed by"
- Updates `docs/_INDEX.md`

```
> We're switching from REST to gRPC for internal services.
```

Claude:
- Finds the next ADR number (e.g. `ADR-007`)
- Creates `docs/decisions/ADR-007-grpc-internal-services.md` with context, decision, alternatives
- Links it from affected module notes

```
> Heads up — calling PaymentService.charge() before .authenticate() silently fails.
```

Claude:
- Appends a single bullet to `docs/modules/PaymentService.md` under "Known gotchas"
- Touches nothing else

---

## Templates Claude follows

### Module note
```markdown
# <ModuleName>

## Purpose
What problem does this solve? One paragraph max.

## Owns
- src/path/to/file.ts

## Dependencies
- [[ModuleA]] — reason why

## Consumed by
- [[ModuleC]]

## Key decisions
- [[ADR-001 Title]]

## Known gotchas
- Edge cases that bit us

## Last reviewed
YYYY-MM-DD
```

### ADR
```markdown
# ADR-<NNN>: <Title>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by [[ADR-NNN]]

## Context / Decision / Consequences / Alternatives / Links
```

Full templates live in [`templates/SKILL.md`](templates/SKILL.md).

---

## The PostToolUse hook (optional)

```bash
obsidian-docs hook install
```

After every `Write` / `Edit` / `MultiEdit`, Claude gets a JSON-injected reminder:

> obsidian-docs reminder: you just modified `src/auth/index.ts`. If this changed a module's purpose, dependencies, public interface, or introduced a non-obvious gotcha, update the corresponding note in `docs/modules/`. Skip this if the change was purely cosmetic.

The hook is **smart** — it skips:
- Edits inside `docs/` itself (no feedback loop)
- `*.md`, `*.json`, `*.yml`, `*.yaml`, `*.toml`, `*.lock`, `.env*`
- `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`
- Test/spec files (`*.test.*`, `*.spec.*`, `__tests__/`)

Zero dependencies — uses `python3` for JSON parsing (ships with macOS/Linux).

---

## Auto-detection

`install` reads your repo and adapts. Detected automatically:

| Layer | Detected from |
|---|---|
| **Language** | `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile`, `composer.json` |
| **Framework** | Next.js, Remix, React, Vue, Svelte, Express, Fastify, NestJS, Hono, Django, Flask |
| **Database** | PostgreSQL, MySQL, MongoDB, Redis, SQLite, Prisma, Drizzle |
| **Package manager** | pnpm, yarn, npm, bun |

The detected stack is written into your `CLAUDE.md` so Claude has it as context.

---

## How is this different from…

| Tool | What it does | Comparison |
|---|---|---|
| **Vanilla Obsidian** | PKM for humans | You write every note manually, no AI integration |
| **README.md / wiki** | Static docs | Goes stale the moment code changes |
| **Graphify** | Auto-extracted code graph for AI | Structural — explains *what*. obsidian-docs is human-curated *why*. They're complementary. |
| **JSDoc / docstrings** | Inline API docs | Per-function reference, not architecture or decisions |
| **Notion / Confluence** | Hosted wiki | Lives outside the repo, no AI hooks, drifts |

The unique angle: **docs versioned with code, written by Claude, browsable as a graph by humans, queryable as structured context by any AI.**

---

## Project structure

```
obsidian-docs/
├── bin/obsidian-docs           # CLI entry
├── commands/
│   ├── install.js              # scaffold vault + skill, patch CLAUDE.md
│   ├── uninstall.js            # surgical removal
│   ├── hook.js                 # PostToolUse hook install/uninstall
│   ├── backfill.js             # spawn Claude to populate the vault
│   ├── status.js               # health check
│   └── update.js               # refresh SKILL.md
├── lib/
│   ├── detect.js               # stack auto-detection
│   └── claude-md.js            # CLAUDE.md marker-block patcher
├── templates/
│   ├── SKILL.md                # the skill Claude follows
│   └── hooks/nudge.sh          # PostToolUse reminder script
└── test/cli.test.js            # 21 tests, zero deps (node:test)
```

---

## Development

```bash
git clone https://github.com/apoorva-01/obsidian-docs.git
cd obsidian-docs
npm install
npm test                # 21 tests, ~60s
npm link                # use `obsidian-docs` from any directory
```

---

## Contributing

Issues and PRs welcome at [github.com/apoorva-01/obsidian-docs](https://github.com/apoorva-01/obsidian-docs).

If you're proposing a behavior change, please add a test in [`test/cli.test.js`](test/cli.test.js) — the suite uses Node's built-in `node:test` so there's nothing to install.

---

## License

[MIT](LICENSE) © Apoorva Verma

---

<sub>Built with [Claude Code](https://claude.com/claude-code). The skill maintains itself.</sub>
