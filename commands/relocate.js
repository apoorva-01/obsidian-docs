import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { healVault } from '../lib/heal.js';
import { readConfig, writeConfig, writeVaultMarker, VAULT_MARKER } from '../lib/vault.js';
import { detectProject } from '../lib/detect.js';
import {
  hasObsidianSection,
  appendObsidianSection,
  generateObsidianSection
} from '../lib/claude-md.js';

export async function relocateCommand(newPathArg, options) {
  const cwd = process.cwd();
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs relocate\n'));

  // No arg → just run the auto-heal scan and exit
  if (!newPathArg) {
    const found = healVault(cwd);
    if (!found) {
      console.log(chalk.red('  ✗ No vault found anywhere in this repo.\n'));
      process.exit(1);
    } else {
      console.log(chalk.green(`  ✓ Vault is at ${chalk.cyan(found + '/')}\n`));
    }
    return;
  }

  const newPath = newPathArg.replace(/\/$/, '');
  const config = readConfig(cwd);
  const currentPath = config?.vaultPath || 'docs';

  if (newPath === currentPath) {
    console.log(chalk.gray(`  Vault already at ${chalk.cyan(newPath + '/')}, nothing to do.\n`));
    return;
  }

  const oldDir = path.join(cwd, currentPath);
  const newDir = path.join(cwd, newPath);

  // If the user already moved the folder themselves, just update config
  const alreadyMoved = !fs.existsSync(oldDir) && fs.existsSync(newDir);
  const needsMove = fs.existsSync(oldDir) && !fs.existsSync(newDir);

  if (!alreadyMoved && !needsMove) {
    console.log(chalk.red(`  ✗ Can't relocate — neither ${currentPath}/ nor ${newPath}/ exists in a usable state.\n`));
    process.exit(1);
  }

  if (needsMove) {
    spinner.start(`Moving ${currentPath}/ → ${newPath}/...`);
    fs.renameSync(oldDir, newDir);
    spinner.succeed(`Moved vault directory`);
  } else {
    spinner.info(`Folder already at ${chalk.cyan(newPath + '/')} — just updating references`);
  }

  // Ensure marker is in the new location
  if (!fs.existsSync(path.join(newDir, VAULT_MARKER))) {
    writeVaultMarker(newDir);
  }

  spinner.start('Updating config...');
  writeConfig(cwd, { ...(config || {}), vaultPath: newPath });
  spinner.succeed(`Config now points at ${chalk.cyan(newPath + '/')}`);

  spinner.start('Updating CLAUDE.md...');
  if (hasObsidianSection(cwd)) {
    const project = detectProject(cwd);
    const skillLocal = path.join(cwd, '.claude/skills/obsidian-docs/SKILL.md');
    const skillRef = fs.existsSync(skillLocal)
      ? '.claude/skills/obsidian-docs/SKILL.md'
      : '~/.claude/skills/obsidian-docs/SKILL.md';
    appendObsidianSection(cwd, generateObsidianSection(project, skillRef, newPath));
    spinner.succeed('Updated CLAUDE.md');
  } else {
    spinner.info('No CLAUDE.md section to update');
  }

  console.log(`\n${chalk.green('  ✓ Vault relocated.')}\n`);
}
