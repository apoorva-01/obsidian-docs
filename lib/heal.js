// Self-healing: run on every command. If the vault folder was renamed
// (Obsidian's "rename vault" silently renames the folder on disk), auto-update
// the config + CLAUDE.md + hook script to point at the new location.

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { resolveVault, ensureMarker } from './vault.js';
import { detectProject } from './detect.js';
import {
  hasObsidianSection,
  appendObsidianSection,
  generateObsidianSection,
  readClaudeMd
} from './claude-md.js';

/**
 * Resolve the vault and patch downstream references if it moved.
 * Returns the resolved vault path (or null if not installed).
 * Prints a friendly note to stderr when relocation is detected.
 */
export function healVault(cwd, { silent = false } = {}) {
  const result = resolveVault(cwd);
  if (!result.vaultPath) return null;

  // Drop the marker into legacy vaults (pre-1.2.0 installs) so the next
  // scan is fast and rename detection works.
  ensureMarker(path.join(cwd, result.vaultPath));

  // Decide whether CLAUDE.md needs to be patched. Two cases:
  //   1. We just detected a relocation (config had an old path).
  //   2. CLAUDE.md's section references a different vault path than the
  //      resolved one — happens with legacy installs we just auto-detected,
  //      or any drift between the section and the actual vault on disk.
  const claudeMd = readClaudeMd(cwd) || '';
  const sectionMentionsCurrent =
    claudeMd.includes('<!-- obsidian-docs:start -->') &&
    new RegExp(`\\b${result.vaultPath}/modules\\b`).test(claudeMd);
  const claudeNeedsPatch = hasObsidianSection(cwd) && !sectionMentionsCurrent;

  if (result.relocated || claudeNeedsPatch) {
    if (!silent && result.relocated) {
      console.log(
        chalk.yellow(`  ↻ Vault relocated: ${chalk.cyan(result.relocated.from)} → ${chalk.cyan(result.relocated.to)} — updating references...`)
      );
    } else if (!silent && claudeNeedsPatch) {
      console.log(
        chalk.yellow(`  ↻ CLAUDE.md vault path was out of sync — updating to ${chalk.cyan(result.vaultPath + '/')}`)
      );
    }

    if (claudeNeedsPatch || result.relocated) {
      const project = detectProject(cwd);
      const skillLocal = path.join(cwd, '.claude/skills/obsidian-docs/SKILL.md');
      const skillRef = fs.existsSync(skillLocal)
        ? '.claude/skills/obsidian-docs/SKILL.md'
        : '~/.claude/skills/obsidian-docs/SKILL.md';
      appendObsidianSection(cwd, generateObsidianSection(project, skillRef, result.vaultPath));
    }

    if (!silent) {
      console.log(chalk.green(`  ✓ References point at ${chalk.cyan(result.vaultPath + '/')}`));
    }
  }

  return result.vaultPath;
}
