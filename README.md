# obsidian-docs

One command. Drops a living Obsidian documentation vault and a Claude Code skill into any repo, so Claude maintains your docs as you code.

## Install

```bash
git clone <this-repo> obsidian-docs && cd obsidian-docs
npm install
npm link
```

Or once published:

```bash
npm install -g obsidian-docs
```

## Usage

```bash
cd ~/projects/my-app
obsidian-docs install
```

This creates:

```
my-app/
├── CLAUDE.md                              ← obsidian-docs section appended
├── .claude/
│   └── skills/obsidian-docs/SKILL.md      ← skill Claude follows
└── docs/                                  ← Obsidian vault
    ├── _INDEX.md
    ├── modules/
    ├── decisions/
    ├── runbooks/
    ├── architecture/
    └── .obsidian/
```

### Flags

- `--global` — install the skill at `~/.claude/skills/obsidian-docs/` instead of in the repo (one copy, used by every project)
- `--no-git` — skip the git commit

### Other commands

```bash
obsidian-docs status     # check vault health
obsidian-docs update     # re-copy SKILL.md from the templates
obsidian-docs update --global
```

## How you actually use it

Once installed, ask Claude things like:

```
> document the AuthService using the obsidian-docs skill
> we just decided to use Redis for sessions, write the ADR
> log the gotcha we just found in PaymentService
```

Claude reads the skill, follows the templates, links notes via `[[wikilinks]]`, and updates `_INDEX.md`.

Open `docs/` in Obsidian to browse it as a graph.
