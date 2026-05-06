# Messaging

## Headline taglines (pick by surface)

| Surface | Tagline |
|---|---|
| npm description | Add living Obsidian docs + Claude Code skill to any repo |
| Hero / GitHub | **AI memory for your codebase.** |
| X bio | One command. Claude remembers your repo. Forever. |
| HN title | Show HN: obsidian-docs — give Claude Code a persistent memory of your repo |
| Demo video | "Stop explaining your architecture to Claude every session." |

## Value props (ordered by hook strength)

1. **Claude stops forgetting.** Every session starts with full context — modules, decisions, gotchas — already loaded.
2. **Docs that don't drift.** Notes update in the same commit as the code, written by Claude itself.
3. **Zero lock-in.** Plain markdown in your git repo. Works without Obsidian. Works without Claude. Lose neither.
4. **30-second setup.** `npx obsidian-docs install` — done. Safe on existing repos.
5. **Browse it as a graph.** Open `docs/` in Obsidian for a live knowledge graph of your codebase.

## Elevator pitches

### 10 seconds
> One command gives Claude Code a persistent memory of your repo, kept fresh in the same commits as your code.

### 30 seconds
> Every Claude Code session starts cold — re-reading files, re-deriving architecture, re-discovering gotchas. `obsidian-docs` fixes that. One command scaffolds an Obsidian vault, installs a Claude skill, and patches your CLAUDE.md so Claude maintains structured notes (modules, ADRs, runbooks) in the same commit as the code that needs them. Humans browse it as a graph; Claude reads it as context. Plain markdown, in your git repo, no lock-in.

### 90 seconds
> If you use Claude Code daily, you've felt this: every conversation, you re-explain why a service exists, what depends on what, the weird edge case from last quarter. Claude is brilliant but amnesiac. The usual fixes — READMEs, Notion, wikis — go stale because they're a side project, separate from the code.
>
> `obsidian-docs` is a tiny CLI that fixes this. `npx obsidian-docs install` and you get three things: an Obsidian-compatible vault at `docs/` (modules, decisions, runbooks), a skill that teaches Claude how to maintain it, and an optional hook that nudges Claude after every code edit. From then on, when you ask Claude to "add a NotificationService that calls SendGrid," Claude writes the code AND creates the module note, links its dependencies, and updates the index — all in the same commit.
>
> Humans browse the vault as a knowledge graph in Obsidian. Claude reads it as structured context on every session. It doesn't drift because it's not a separate project — it's how Claude works in your repo. Open source, MIT, no signup, nothing leaves your machine.

## Word patterns to use
- "AI memory" / "persistent memory" / "the *why* behind the code"
- "Same commit as the code"
- "Versioned in git, not in a SaaS"
- "Claude maintains itself"
- "From cold start to full context"

## Word patterns to avoid
- "Revolutionary" / "game-changing" / "AI-powered" — generic, suspicious
- "Documentation tool" — too narrow, sounds like a static-site generator
- "Knowledge management" — sounds enterprise; this is for builders
- Promising specific metrics we haven't measured (the README placeholder `<X>x faster onboarding` should stay caveated until we have data)

## Proof points (use when available)
- 31 tests passing, MIT, zero runtime deps
- npm install count (update in real time)
- GitHub stars (update in real time)
- Time-to-install: ~30 seconds on a fresh repo
- Public testimonials (collect — none yet)
