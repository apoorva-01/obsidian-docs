# Features

## Shipped (v1.2.1)

### Core
- `install` — scaffolds vault, installs skill, patches `CLAUDE.md`, auto-commits. Safe on existing repos (never overwrites content).
- `uninstall` — surgical removal of vault, skill, and CLAUDE.md marker block (with `--keep-vault` option).
- `demo` — spins up a fully-populated demo project in a temp dir so you can preview before installing.
- `status` — health check that detects all wiring is intact.
- `update` — refreshes `SKILL.md` to the latest version without disturbing user notes.

### Vault structure
- `docs/_INDEX.md` — master index
- `docs/modules/` — one note per module/service
- `docs/decisions/` — Architecture Decision Records (ADRs)
- `docs/runbooks/` — operational procedures
- `docs/architecture/` — system overviews
- `.obsidian/` — pre-configured Obsidian app config

### Claude integration
- **Skill** at `.claude/skills/obsidian-docs/SKILL.md` with strict templates and `[[wikilink]]` rules.
- **PostToolUse hook** (`hook install`) that nudges Claude after Write/Edit/MultiEdit. Smart-skips: docs/ itself, config/lock files, node_modules, dist, test files.
- **`backfill`** command spawns Claude Code to populate `docs/modules/` from existing source.

### Robustness (v1.2.0+)
- **Vault rename survival** — marker file (`.obsidian-docs-vault`) + config (`.obsidian-docs.json`) auto-detect when the user renames the vault inside Obsidian. CLI updates references automatically.
- **`relocate`** command — explicitly move the vault or re-scan after a rename.
- **Auto-heal for legacy installs** (pre-1.2.0) without the marker file.
- `--vault-path` flag to use a custom folder name (e.g. `notes/` instead of `docs/`).

### Auto-detection
Detects language, framework, database, and package manager from `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc., and writes the detected stack into `CLAUDE.md` for context.

### Distribution
- Global install option (`--global`) shares one skill across all repos.
- `--no-git` skips auto-commit.
- `--local` for personal-only hook (gitignored `settings.local.json`).

---

## Proposed / future ideas
*Not yet committed — these are candidates for the roadmap, useful as anchors for marketing storytelling.*

- **`audit` command** — flag stale notes (last-reviewed > N days), modules with no note, ADRs with no backlinks.
- **CI integration** — GitHub Action that fails the build if a code change in `src/` doesn't update or create the corresponding module note.
- **Multi-AI support** — extend beyond Claude Code to Cursor, Cline, Aider with provider-specific skill/policy adapters.
- **Vault analytics** — `obsidian-docs stats` showing graph density, orphan notes, ADR count over time.
- **Templates marketplace** — opinionated template packs for common stacks (Next.js + Supabase, Rails, Django, Go services).
- **Web companion** — read-only public view of a vault for open-source projects (think GitBook for `docs/`).
- **VSCode extension** — surface the relevant module note inline as you edit a file.
- **Auto-link inference** — Claude analyzes import graphs and proposes new `[[wikilinks]]` between module notes.

> Anything in this list that hasn't been validated by user demand should be presented as "exploring" in external campaigns, not as committed roadmap.
