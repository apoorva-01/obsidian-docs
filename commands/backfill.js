import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import chalk from 'chalk';
import { healVault } from '../lib/heal.js';

export async function backfillCommand(targetArg, options) {
  const cwd = process.cwd();

  console.log(chalk.bold('\n  obsidian-docs backfill\n'));

  // ── 1. Pre-flight checks ─────────────────────────────────────
  const skillLocal = path.join(cwd, '.claude/skills/obsidian-docs/SKILL.md');
  const skillGlobal = path.join(process.env.HOME, '.claude/skills/obsidian-docs/SKILL.md');
  const skillPath = fs.existsSync(skillLocal)
    ? '.claude/skills/obsidian-docs/SKILL.md'
    : fs.existsSync(skillGlobal)
      ? '~/.claude/skills/obsidian-docs/SKILL.md'
      : null;

  if (!skillPath) {
    console.log(chalk.red('  ✗ No SKILL.md found.'));
    console.log(chalk.gray('    Run `obsidian-docs install` first.\n'));
    process.exit(1);
  }

  const vaultPath = healVault(cwd);
  if (!vaultPath) {
    console.log(chalk.red('  ✗ No vault found.'));
    console.log(chalk.gray('    Run `obsidian-docs install` first.\n'));
    process.exit(1);
  }

  // ── 2. Pick target scope ─────────────────────────────────────
  const target = pickTarget(cwd, targetArg);
  console.log(`  ${chalk.gray('Target:')}  ${chalk.cyan(target)}`);
  console.log(`  ${chalk.gray('Vault:')}   ${chalk.cyan(vaultPath + '/')}`);
  console.log(`  ${chalk.gray('Skill:')}   ${chalk.cyan(skillPath)}`);
  console.log(`  ${chalk.gray('Mode:')}    ${chalk.cyan(options.print ? 'print (headless)' : 'interactive')}`);
  console.log();

  // ── 3. Build prompt ──────────────────────────────────────────
  const prompt = buildPrompt({ skillPath, target, vaultPath });

  if (options.dryRun) {
    console.log(chalk.bold('  --dry-run: prompt that would be sent to claude:\n'));
    console.log(chalk.gray('  ─────────────────────────────────────────────'));
    console.log(prompt.split('\n').map(l => '  ' + l).join('\n'));
    console.log(chalk.gray('  ─────────────────────────────────────────────\n'));
    return;
  }

  // ── 4. Verify `claude` CLI is available ──────────────────────
  if (!hasClaudeCli()) {
    console.log(chalk.red('  ✗ `claude` CLI not found on PATH.'));
    console.log(chalk.gray('    Install Claude Code: https://claude.com/claude-code\n'));
    console.log(chalk.gray('    Or run with --dry-run to see the prompt and paste it manually.\n'));
    process.exit(1);
  }

  // ── 5. Spawn claude ──────────────────────────────────────────
  console.log(chalk.gray('  Launching claude...\n'));

  const args = options.print ? ['-p', prompt] : [prompt];
  const result = spawnSync('claude', args, {
    cwd,
    stdio: 'inherit'
  });

  process.exit(result.status ?? 0);
}

// ──────────────────────────────────────────────────────────────────

function pickTarget(cwd, arg) {
  if (arg) return arg;
  // Sensible defaults
  for (const candidate of ['src', 'lib', 'app', 'packages']) {
    if (fs.existsSync(path.join(cwd, candidate))) return candidate;
  }
  return '.';
}

function hasClaudeCli() {
  try {
    execSync('command -v claude', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function buildPrompt({ skillPath, target, vaultPath }) {
  return `Backfill the Obsidian docs vault at \`${vaultPath}/\` from the existing codebase.

First, read \`${skillPath}\` so you follow the templates and rules exactly.

Scope: ${target === '.' ? 'the entire repository' : `\`${target}\``}

Process:
1. Survey the target to identify the major modules / services / subsystems.
   Skip trivial utilities, generated files, vendored code, tests, and config.
2. For each significant module, create \`${vaultPath}/modules/<ModuleName>.md\` using
   the module template from the skill. Use PascalCase filenames matching the
   real module/class/service name.
3. Fill in:
   - Purpose (one paragraph — what problem does this solve?)
   - Owns (the actual file paths it covers)
   - Dependencies (other modules it imports/calls — link with [[wikilinks]])
   - Consumed by (modules that import/call it — link with [[wikilinks]])
   - Known gotchas (only if you spot something non-obvious in the code; otherwise "None yet")
   - Last reviewed (today's date)
4. After creating each note, immediately update \`${vaultPath}/_INDEX.md\` to list it.
5. If a module note already exists, do NOT overwrite — patch missing sections only.
6. Never leave broken \`[[wikilinks]]\` — only link to notes that exist or that
   you are creating in the same pass.
7. Start with the most central / most-depended-on modules first so links resolve
   as you go.

Hard rules from the skill apply: no improvised headers, no rewriting existing
notes, ADRs untouched (this is a backfill of modules, not decisions).

When you're done, print a short summary: how many module notes you created,
which areas you skipped and why.`;
}
