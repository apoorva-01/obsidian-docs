# Audience & positioning

## Primary audience
**Solo and small-team developers who already use Claude Code daily** and have felt the pain of Claude "forgetting" their architecture every session.

Signals:
- Has `.claude/` folder in their repos
- Uses CLAUDE.md, skills, or hooks
- Vocal on X / Reddit / HN about AI-coding workflows
- Often also an Obsidian user (overlap is high)

## Secondary audience
**Tech leads at 5–50 person engineering orgs** who want to:
- Reduce onboarding time for new hires
- Stop losing architectural context when senior engineers leave
- Standardize how AI assistants get repo context across the team

## Tertiary audience
**Open-source maintainers** of medium-to-large projects who want a low-effort way to keep contributor docs in sync with code.

## Where they hang out
- **X / Twitter** — `#ClaudeCode`, AI dev influencers, Anthropic ecosystem
- **Reddit** — r/ClaudeAI, r/ObsidianMD, r/LocalLLaMA, r/ExperiencedDevs
- **Hacker News** — Show HN, Tuesday/Wednesday morning PT
- **YouTube** — AI-coding channels (Matthew Berman, AI Jason, Indy Devs)
- **Discord** — Anthropic community, Obsidian community, Cursor/Cline servers
- **Newsletters** — TLDR AI, Ben's Bites, Latent Space

## The wedge
Most "AI memory" tools either (a) live in proprietary clouds or (b) try to be a full agentic system. `obsidian-docs` is deliberately tiny: **one CLI, one skill, one optional hook, files on disk in the user's repo.** The differentiation is humility — it doesn't replace anything; it makes the tools you already use (Claude Code + git + Obsidian) compound.

## Positioning statement
> For developers who use Claude Code, `obsidian-docs` is a CLI that gives Claude a persistent, structured memory of your repo — written by Claude, browsed by humans as an Obsidian graph, versioned in git. Unlike static READMEs or hosted wikis, the notes update in the same commit as the code, so they don't drift.

## Anti-positioning (what we are NOT)
- Not a replacement for Claude Code
- Not a hosted SaaS (no signup, no cloud, no data leaves your repo)
- Not a code-generation tool — it generates *documentation about* the code
- Not Obsidian-required for users who don't want it (the vault is just markdown; works without Obsidian)
