# Campaign ideas

## Launch & awareness

### 1. Show HN: "obsidian-docs"
- **Format:** HN post + companion blog "Why Claude Code forgets your repo (and how I fixed it for myself)"
- **Hook:** First-person story, not a product pitch. End with the npm one-liner.
- **CTA:** `npx obsidian-docs demo` — try it without touching your repo
- **Asset needed:** Blog post (1200–1500 words), HN-friendly screenshot of the Obsidian graph view

### 2. Demo video — "30 seconds to AI memory"
- **Format:** 30–60s screen recording, no voiceover, captions only
- **Beats:** (a) blank repo → (b) `npx obsidian-docs install` → (c) ask Claude to add a feature → (d) cut to Obsidian graph showing the new note linked
- **Distribution:** X (native upload), YouTube Short, Reddit r/ClaudeAI

### 3. Twitter/X thread series
- Thread 1: "Claude Code has amnesia. Here's the fix." (problem-led)
- Thread 2: "Show, don't tell — 5 things `obsidian-docs` writes for you" (feature carousel)
- Thread 3: "I asked Claude to refactor a service. Here's what it documented along the way." (case study)

## Education & trust

### 4. "Anatomy of an Obsidian vault for code" — long-form blog
- Walk through each folder (modules, ADRs, runbooks) with real examples
- Anchor the value prop to ADRs specifically — most devs underrate them
- Cross-post to dev.to, Hashnode, personal site

### 5. YouTube tutorial — collab with an AI-coding channel
- 8–12 min tutorial with a creator like Matthew Berman / AI Jason / Indy Devs
- Live install on a real-ish repo, ask Claude to add a feature, show the graph
- Goal: get into the recommended-videos pool for "Claude Code" searches

### 6. "Migrating from Notion docs to obsidian-docs" — case study
- Document the migration of a real OSS project's docs
- Before/after of "asking Claude a question about the repo"
- Distribution: r/ObsidianMD (huge, sympathetic audience), Obsidian forum

## Community & flywheel

### 7. Template marketplace seed
- Ship 3 opinionated template packs (Next.js, Python services, Rust)
- Each pack ships with example notes pre-filled — instant value on install
- Community-contributable; PRs welcome

### 8. "obsidian-docs week" on X
- 7 days, 7 short posts: one feature, one user testimonial (collect first), one quote-tweet of a Claude Code complaint with the fix
- Pin the launch thread

### 9. Sponsor a small AI-coding newsletter
- One-off sponsorship in TLDR AI / Ben's Bites / Latent Space
- Single CTA: `npx obsidian-docs demo`
- Track install spike to measure attribution

## Conversion / retention

### 10. Onboarding email-free flow
- We don't capture emails (no SaaS) — instead, a single "what next" page after `install` that links to: docs site, Discord, GitHub issues, "how to write a great ADR"
- Lives in `docs/_INDEX.md` so Claude sees it too

### 11. Discord / community channel
- Lightweight: a single Discord channel in the Anthropic or Obsidian server (don't run our own until there's volume)
- Office hours: 30 min/week answering questions live, recorded as YouTube clips

---

## Priority for first 30 days
1. Demo video (Idea #2) — required asset for everything else
2. Show HN (Idea #1) — one-shot at attention
3. X thread #1 (Idea #3) — feeds the demo video into the timeline
4. Sponsor one newsletter (Idea #9) — paid distribution while organic ramps

> See [[assets-checklist]] for the production list.
