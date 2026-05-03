// Self-healing: run on every command. If the vault folder was renamed
// (Obsidian's "rename vault" silently renames the folder on disk), auto-update
// the config + CLAUDE.md + hook script to point at the new location.

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { resolveVault } from './vault.js';
import { detectProject } from './detect.js';
import {
  hasObsidianSection,
  appendObsidianSection,
  generateObsidianSection
} from './claude-md.js';

/**
 * Resolve the vault and patch downstream references if it moved.
 * Returns the resolved vault path (or null if not installed).
 * Prints a friendly note to stderr when relocation is detected.
 */
export function healVault(cwd, { silent = false } = {}) {
  const result = resolveVault(cwd);
  if (!result.vaultPath) return null;

  if (result.relocated) {
    if (!silent) {
      console.log(
        chalk.yellow(`  ↻ Vault relocated: ${chalk.cyan(result.relocated.from)} → ${chalk.cyan(result.relocated.to)} — updating references...`)
      );
    }

    // Patch CLAUDE.md if it has our section
    if (hasObsidianSection(cwd)) {
      const project = detectProject(cwd);
      const skillLocal = path.join(cwd, '.claude/skills/obsidian-docs/SKILL.md');
      const skillRef = fs.existsSync(skillLocal)
        ? '.claude/skills/obsidian-docs/SKILL.md'
        : '~/.claude/skills/obsidian-docs/SKILL.md';
      appendObsidianSection(cwd, generateObsidianSection(project, skillRef, result.vaultPath));
    }

    if (!silent) {
      console.log(chalk.green(`  ✓ Updated config + CLAUDE.md to use ${chalk.cyan(result.vaultPath + '/')}`));
    }
  }

  return result.vaultPath;
}
