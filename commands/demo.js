import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// A pre-built sample project + populated vault so people see what a
// well-maintained repo looks like — without touching their own code.

export async function demoCommand(options) {
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs demo\n'));

  // ── 1. Pick a demo directory ────────────────────────────────
  const demoDir = options.dir
    ? path.resolve(options.dir)
    : path.join(os.tmpdir(), `obsidian-docs-demo-${Date.now()}`);

  if (fs.existsSync(demoDir) && !options.force) {
    if (fs.readdirSync(demoDir).length > 0) {
      console.log(chalk.red(`  ✗ ${demoDir} already exists and isn't empty.`));
      console.log(chalk.gray('    Pass --force to overwrite, or --dir <path> for a different location.\n'));
      process.exit(1);
    }
  }
  fs.mkdirSync(demoDir, { recursive: true });

  spinner.start(`Creating demo project in ${chalk.cyan(demoDir)}...`);
  scaffoldFakeProject(demoDir);
  spinner.succeed(`Demo project: ${chalk.cyan(demoDir)}`);

  // ── 2. Run install in the demo dir ──────────────────────────
  spinner.start('Running obsidian-docs install...');
  const binPath = path.join(__dirname, '..', 'bin', 'obsidian-docs');
  const r = spawnSync('node', [binPath, 'install', '--no-git'], {
    cwd: demoDir,
    input: '\n',
    encoding: 'utf8'
  });
  if (r.status !== 0) {
    spinner.fail('install failed');
    console.log(r.stderr || r.stdout);
    process.exit(1);
  }
  spinner.succeed('Installed obsidian-docs into demo project');

  // ── 3. Populate the vault with sample notes ─────────────────
  spinner.start('Populating vault with sample notes...');
  populateSampleVault(demoDir);
  spinner.succeed('Created 4 module notes, 2 ADRs, 1 runbook');

  // ── 4. Tell the user what to do next ────────────────────────
  console.log(`
${chalk.green('  ✓ Demo ready!')}

  ${chalk.bold('What to look at:')}
    ${chalk.cyan('1.')} Open Obsidian → ${chalk.bold('Open folder as vault')} → select:
       ${chalk.yellow(path.join(demoDir, 'docs'))}

    ${chalk.cyan('2.')} Switch to the ${chalk.bold('Graph view')} (Ctrl/Cmd+G) to see the
       module/decision relationships visualized.

    ${chalk.cyan('3.')} Browse:
       ${chalk.gray('•')} ${chalk.cyan('docs/_INDEX.md')}              ← master index
       ${chalk.gray('•')} ${chalk.cyan('docs/modules/AuthService.md')}  ← sample module note
       ${chalk.gray('•')} ${chalk.cyan('docs/decisions/ADR-001-*.md')}  ← sample ADR
       ${chalk.gray('•')} ${chalk.cyan('docs/runbooks/Deploy.md')}      ← sample runbook

    ${chalk.cyan('4.')} Inspect what got installed:
       ${chalk.gray('•')} ${chalk.cyan('CLAUDE.md')}                                     ${chalk.gray('← policy injected')}
       ${chalk.gray('•')} ${chalk.cyan('.claude/skills/obsidian-docs/SKILL.md')}         ${chalk.gray('← what Claude reads')}

  ${chalk.bold('Try it on your own repo:')}
    ${chalk.gray('$')} cd your-project
    ${chalk.gray('$')} npx obsidian-docs install

  ${chalk.bold('Clean up the demo:')}
    ${chalk.gray('$')} rm -rf ${demoDir}
`);
}

// ──────────────────────────────────────────────────────────────────

function scaffoldFakeProject(dir) {
  // Minimal but realistic Express+Postgres-shaped project so detection lights up
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'demo-orders-api',
    version: '1.0.0',
    description: 'Sample project for obsidian-docs demo',
    dependencies: {
      express: '^4.19.0',
      pg: '^8.11.0',
      jsonwebtoken: '^9.0.0',
      stripe: '^14.0.0'
    }
  }, null, 2));

  // A handful of source files so the project looks real
  const src = (p, body) => {
    const full = path.join(dir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  };

  src('src/index.ts', `import express from 'express';\nimport { authRoutes } from './auth';\nimport { orderRoutes } from './orders';\n\nconst app = express();\napp.use('/auth', authRoutes);\napp.use('/orders', orderRoutes);\napp.listen(3000);\n`);
  src('src/auth/index.ts', `// AuthService — JWT-based auth\nexport * from './service';\n`);
  src('src/auth/service.ts', `import jwt from 'jsonwebtoken';\nimport { UserRepository } from '../db/users';\nexport class AuthService { /* ... */ }\n`);
  src('src/orders/index.ts', `// OrderService\nimport { PaymentService } from '../payments';\nexport * from './service';\n`);
  src('src/orders/service.ts', `import { OrderRepository } from '../db/orders';\nexport class OrderService { /* ... */ }\n`);
  src('src/payments/index.ts', `// PaymentService — Stripe wrapper\nimport Stripe from 'stripe';\nexport class PaymentService { /* ... */ }\n`);
  src('src/db/users.ts', `import { Pool } from 'pg';\nexport class UserRepository { /* ... */ }\n`);
  src('src/db/orders.ts', `import { Pool } from 'pg';\nexport class OrderRepository { /* ... */ }\n`);

  fs.writeFileSync(path.join(dir, 'README.md'), `# demo-orders-api\n\nSample project showcasing obsidian-docs.\n`);
}

function populateSampleVault(dir) {
  const docs = path.join(dir, 'docs');
  const today = new Date().toISOString().slice(0, 10);

  const write = (rel, body) => fs.writeFileSync(path.join(docs, rel), body);

  // ── Module notes ─────────────────────────────────────────────
  write('modules/AuthService.md', `# AuthService

## Purpose
Validates incoming requests and issues JWTs after credential check. The single source of truth for "is this user who they claim to be" across the API.

## Owns
- \`src/auth/\`

## Dependencies
- [[UserRepository]] — fetches user records by email for credential check

## Consumed by
- [[OrderService]] — checks the bearer JWT on every order mutation
- [[PaymentService]] — re-validates the JWT before charging cards

## Key decisions
- [[ADR-001 JWT over sessions]]

## Known gotchas
- Tokens are signed with HS256, not RS256 — rotation requires a service restart
- Refresh tokens are NOT implemented; clients must re-auth after 24h

## Last reviewed
${today}
`);

  write('modules/OrderService.md', `# OrderService

## Purpose
Orchestrates the order lifecycle: create → pay → fulfill. Owns the state machine.

## Owns
- \`src/orders/\`

## Dependencies
- [[AuthService]] — every mutation requires a valid JWT
- [[PaymentService]] — calls .charge() on order confirmation
- [[OrderRepository]] — reads/writes the orders table

## Consumed by
- HTTP layer (\`src/index.ts\`)

## Key decisions
- [[ADR-002 Synchronous payment]]

## Known gotchas
- None yet

## Last reviewed
${today}
`);

  write('modules/PaymentService.md', `# PaymentService

## Purpose
Wraps the Stripe SDK. Centralizes idempotency keys, retry logic, and webhook signature verification so the rest of the codebase never imports \`stripe\` directly.

## Owns
- \`src/payments/\`

## Dependencies
- [[AuthService]] — re-validates JWT before any charge call

## Consumed by
- [[OrderService]]

## Key decisions
- [[ADR-002 Synchronous payment]]

## Known gotchas
- Calling \`.charge()\` before \`.authenticate()\` silently no-ops — always check the return value
- Stripe rate limit is 100 req/s in production; we don't currently retry on 429

## Last reviewed
${today}
`);

  write('modules/UserRepository.md', `# UserRepository

## Purpose
Read-mostly access layer over the \`users\` table. Wraps the connection pool and enforces the canonical user shape.

## Owns
- \`src/db/users.ts\`

## Dependencies
- None

## Consumed by
- [[AuthService]]

## Key decisions
- None

## Known gotchas
- Email lookups are case-sensitive — callers must lowercase first

## Last reviewed
${today}
`);

  // ── ADRs ─────────────────────────────────────────────────────
  write('decisions/ADR-001-jwt-over-sessions.md', `# ADR-001: JWT over server-side sessions

**Date:** ${today}
**Status:** Accepted

## Context
We need to authenticate users across multiple horizontally-scaled API nodes. Sticky sessions would constrain our load balancer choices, and a shared session store (Redis) adds an operational dependency we don't otherwise need at this scale.

## Decision
Use stateless JWTs signed with HS256. Tokens carry user_id and role; nothing sensitive.

## Consequences
**Positive:**
- No session store to operate
- Any API node can validate any token
- Trivial to scale horizontally

**Tradeoffs:**
- Token revocation is hard (we accept 24h max staleness)
- Secret rotation requires coordinated restart

## Alternatives considered
| Option | Why rejected |
|---|---|
| Server-side sessions in Redis | Adds operational dependency |
| OAuth via external provider | Out of scope for v1 |

## Links
[[AuthService]]
`);

  write('decisions/ADR-002-synchronous-payment.md', `# ADR-002: Synchronous payment on order confirmation

**Date:** ${today}
**Status:** Accepted

## Context
Order confirmation can either charge synchronously (block the API call until Stripe returns) or asynchronously (queue and respond optimistically). Async is more scalable but UX is worse — the user doesn't know if their card was declined until later.

## Decision
Synchronous charge for v1. Block the API call. Return failure if Stripe declines.

## Consequences
**Positive:**
- Clear UX — user knows immediately if payment failed
- No queue infrastructure needed
- Easier to reason about order state

**Tradeoffs:**
- Stripe latency directly affects API latency
- A Stripe outage takes down order creation

## Alternatives considered
| Option | Why rejected |
|---|---|
| Async via job queue | Worse UX, more infrastructure |
| Optimistic with reversal | Risk of inconsistent state |

## Links
[[OrderService]] [[PaymentService]]
`);

  // ── Runbook ──────────────────────────────────────────────────
  write('runbooks/Deploy.md', `# Deploy to Production

## When to use this
Whenever shipping a new release. Run from your local machine.

## Prerequisites
- AWS CLI authenticated as the \`deploy\` role
- All tests passing on the release branch

## Steps
1. Tag the release: \`git tag -a v$VERSION -m "release notes"\`
2. Push the tag: \`git push origin v$VERSION\`
3. CI auto-builds and pushes the image
4. Promote: \`kubectl set image deploy/api api=registry/api:$VERSION\`
5. Watch logs: \`kubectl logs -f deploy/api\`

## If something goes wrong
- 5xx spike in first 60s → roll back: \`kubectl rollout undo deploy/api\`
- Stripe errors → check [[PaymentService]] gotchas, verify webhook secret in env

## Links
[[OrderService]] [[PaymentService]]
`);

  // ── Update _INDEX.md ─────────────────────────────────────────
  write('_INDEX.md', `# Project Docs Index

_Maintained by Claude Code via obsidian-docs skill._

## Modules
- [[AuthService]] — JWT issuance and validation
- [[OrderService]] — order lifecycle orchestration
- [[PaymentService]] — Stripe wrapper with idempotency
- [[UserRepository]] — read-mostly access layer over the users table

## Decisions
- [[ADR-001 JWT over sessions]] — stateless auth so we can scale horizontally
- [[ADR-002 Synchronous payment]] — block on Stripe so users know if their card declined

## Runbooks
- [[Deploy]] — production deploy procedure

## Architecture
<!-- add system overviews here -->
`);
}
