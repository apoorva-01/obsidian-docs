---
name: obsidian-docs
description: Maintain the /docs Obsidian vault as a living, AI-readable documentation layer over this codebase. Use whenever a module is created/changed, an architectural decision is made, a gotcha is found, or module interactions change.
---

# Skill: obsidian-docs

Maintain the Obsidian vault at `/docs` as a living, AI-readable
documentation layer over this codebase.

---

## Core Principle

Code explains WHAT. This vault explains WHY.
Every note must answer: "what would a new engineer need to know
about this that the code alone doesn't tell them?"

---

## Before You Write Anything

1. List files in the target folder to check if a note already exists
2. If it exists — patch it, don't rewrite it
3. If it doesn't — create it from the correct template below
4. Always update `_INDEX.md` after creating a new note
5. Never leave a `[[wikilink]]` pointing to a note that doesn't exist

---

## Folder Map

| Folder | What goes here | One file per |
|---|---|---|
| `docs/modules/` | Module/service notes | Module or service |
| `docs/decisions/` | ADRs | Decision |
| `docs/runbooks/` | How-to operational guides | Procedure |
| `docs/architecture/` | System-level diagrams/overviews | Topic |

---

## Template: Module Note

**Filename:** `docs/modules/<ModuleName>.md`
Use PascalCase matching the actual module/class/service name.

```markdown
# <ModuleName>

## Purpose
What problem does this solve? One paragraph max.

## Owns
- `src/path/to/file.ts`
- `src/path/to/other/`

## Dependencies
- [[ModuleA]] — reason why
- [[ModuleB]] — reason why

## Consumed by
- [[ModuleC]]
- [[ModuleD]]

## Key decisions
- [[ADR-001 Decision Title]]

## Known gotchas
- None yet

## Last reviewed
YYYY-MM-DD
```

---

## Template: ADR

**Filename:** `docs/decisions/ADR-<NNN>-<short-slug>.md`
NNN = zero-padded 3-digit number. Always check existing files
for the highest number and increment by 1.

```markdown
# ADR-<NNN>: <Title>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by [[ADR-NNN]]

## Context
What situation or problem forced this decision?
What constraints existed?

## Decision
One clear sentence. Then elaborate if needed.

## Consequences
**Positive:**
-

**Tradeoffs:**
-

## Alternatives considered
| Option | Why rejected |
|---|---|
| Option A | reason |
| Option B | reason |

## Links
[[RelatedModule]] [[ADR-XXX]]
```

---

## Template: Runbook

**Filename:** `docs/runbooks/<Procedure-Name>.md`

```markdown
# <Procedure Name>

## When to use this
What situation triggers this runbook?

## Prerequisites
- Access to X
- Tool Y installed

## Steps
1. Step one
2. Step two
3. Step three

## If something goes wrong
- Symptom → what to do

## Links
[[RelatedModule]] [[ADR-XXX]]
```

---

## `_INDEX.md` Format

Keep this file sorted alphabetically within each section.

```markdown
# Project Docs Index

## Modules
- [[ModuleA]] — one-line description
- [[ModuleB]] — one-line description

## Decisions
- [[ADR-001 Title]] — one-line summary
- [[ADR-002 Title]] — one-line summary

## Runbooks
- [[Procedure Name]] — when to use it

## Architecture
- [[System Overview]] — top-level map
```

---

## Decision Guide: What Triggers What

| Situation | Action |
|---|---|
| New module/service created | Create module note + update INDEX |
| Module significantly refactored | Update existing module note |
| Architectural decision made | Create ADR + link from module notes |
| Bug found with non-obvious cause | Add to module's "Known gotchas" |
| Two modules' relationship changed | Update both notes' deps/consumed-by |
| New operational procedure | Create runbook + update INDEX |
| Decision reversed or superseded | Add "Superseded by" to old ADR, create new ADR |

---

## Hard Rules

- Never delete content unless explicitly asked
- Never renumber existing ADRs
- Never rewrite an Accepted ADR — only supersede it
- Never use generic link text — `[[ModuleName]]` not `[[click here]]`
- Never create a note without updating `_INDEX.md`
- Always use the exact template structure — no improvising headers
