# Product brief — obsidian-docs

## One-liner
**AI memory for your codebase.** One command gives Claude Code a persistent, structured memory of your repo — and keeps it fresh as you code.

## What it is
`obsidian-docs` is a zero-config CLI (`npx obsidian-docs install`) that bolts a living documentation system onto any git repo. It scaffolds:

- An **Obsidian vault** at `docs/` (modules, ADRs, runbooks, architecture)
- A **Claude Code skill** that teaches Claude to maintain those notes
- A **CLAUDE.md policy block** that wires the skill into every Claude session
- An optional **PostToolUse hook** that nudges Claude to update notes after every code edit

The result: humans browse the vault as a knowledge graph; Claude reads it as structured context and writes new notes in the same commit as the code that needs them.

## The problem it solves
Every Claude Code session today starts cold. Claude re-reads files, re-derives architecture, and re-discovers the same gotchas you've explained ten times. The two existing fixes both fail:

- **No docs** — onboarding takes weeks; Claude makes the same mistake twice.
- **Stale docs** — a README graveyard or a Notion page nobody updates; AI gets told the wrong thing.

`obsidian-docs` is the third path: structured templates so docs are cheap to write, plus a skill + hook so Claude maintains them in the same commit as the code. Docs versioned with code, written by Claude, browsable as a graph by humans, queryable as structured context by any AI.

## How it's different
| Compared to | Why obsidian-docs wins |
|---|---|
| Vanilla Obsidian | No AI integration — every note is manual |
| README / wiki | Static, goes stale the moment code changes |
| Graphify | Structural (what) — obsidian-docs is human-curated (why); complementary |
| JSDoc / docstrings | Per-function reference, not architecture or decisions |
| Notion / Confluence | Lives outside the repo, no AI hooks, drifts |

## Status
- Public on npm: `obsidian-docs@1.2.1`
- 31 tests passing, MIT licensed, zero runtime dependencies on the user side
- Repo: https://github.com/apoorva-01/obsidian-docs
