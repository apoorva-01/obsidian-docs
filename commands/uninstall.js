import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import enquirer from 'enquirer';
import { healVault } from '../lib/heal.js';
import { readConfig } from '../lib/vault.js';

const { prompt } = enquirer;
const MARKER_START = '<!-- obsidian-docs:start -->';
const MARKER_END = '<!-- obsidian-docs:end -->';

export async function uninstallCommand(options) {
  const cwd = process.cwd();
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs uninstall\n'));

  const vaultPath = healVault(cwd, { silent: true }) || readConfig(cwd)?.vaultPath || 'docs';

  const claudeMd = path.join(cwd, 'CLAUDE.md');
  const localSkillDir = path.join(cwd, '.claude/skills/obsidian-docs');
  const globalSkillDir = path.join(process.env.HOME, '.claude/skills/obsidian-docs');
  const vaultDir = path.join(cwd, vaultPath);
  const configFile = path.join(cwd, '.obsidian-docs.json');

  const targets = {
    claudeSection: fs.existsSync(claudeMd) && fs.readFileSync(claudeMd, 'utf8').includes(MARKER_START),
    config: fs.existsSync(configFile),
    localSkill: fs.existsSync(localSkillDir),
    globalSkill: options.global && fs.existsSync(globalSkillDir),
    vault: !options.keepVault && fs.existsSync(vaultDir)
  };

  console.log('  Will remove:');
  if (targets.claudeSection) console.log(`    ${chalk.yellow('•')} obsidian-docs section in ${chalk.cyan('CLAUDE.md')}`);
  if (targets.config)        console.log(`    ${chalk.yellow('•')} ${chalk.cyan('.obsidian-docs.json')}`);
  if (targets.localSkill)    console.log(`    ${chalk.yellow('•')} ${chalk.cyan('.claude/skills/obsidian-docs/')}`);
  if (targets.globalSkill)   console.log(`    ${chalk.yellow('•')} ${chalk.cyan(globalSkillDir)}`);
  if (targets.vault)         console.log(`    ${chalk.red('•')} ${chalk.cyan(vaultPath + '/')} ${chalk.red.bold('(YOUR VAULT — destructive)')}`);

  if (!Object.values(targets).some(Boolean)) {
    console.log(chalk.gray('  Nothing to remove.\n'));
    return;
  }

  if (options.keepVault && fs.existsSync(vaultDir)) {
    console.log(`    ${chalk.gray('•')} ${chalk.gray('docs/')} ${chalk.gray('(kept — --keep-vault)')}`);
  }

  if (!options.yes) {
    if (!process.stdin.isTTY) {
      console.log(chalk.red('\n  Refusing to uninstall non-interactively without --yes.\n'));
      process.exit(1);
    }
    try {
      const { confirmed } = await prompt({
        type: 'confirm',
        name: 'confirmed',
        message: targets.vault
          ? 'This will DELETE your docs/ vault. Continue?'
          : 'Continue?',
        initial: false
      });
      if (!confirmed) { console.log(chalk.gray('\n  Aborted.\n')); process.exit(0); }
    } catch {
      console.log(chalk.gray('\n  Aborted.\n')); process.exit(0);
    }
  }

  console.log();

  if (targets.claudeSection) {
    spinner.start('Removing obsidian-docs section from CLAUDE.md...');
    const current = fs.readFileSync(claudeMd, 'utf8');
    const cleaned = current
      .replace(new RegExp(`\\n*${MARKER_START}[\\s\\S]*?${MARKER_END}\\n*`), '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n';
    if (cleaned.trim() === '') {
      fs.unlinkSync(claudeMd);
      spinner.succeed('CLAUDE.md was empty after removal — deleted');
    } else {
      fs.writeFileSync(claudeMd, cleaned);
      spinner.succeed('Cleaned CLAUDE.md');
    }
  }

  if (targets.localSkill) {
    spinner.start('Removing local skill...');
    fs.rmSync(localSkillDir, { recursive: true, force: true });
    pruneEmpty(path.join(cwd, '.claude/skills'));
    pruneEmpty(path.join(cwd, '.claude'));
    spinner.succeed('Removed .claude/skills/obsidian-docs/');
  }

  if (targets.globalSkill) {
    spinner.start('Removing global skill...');
    fs.rmSync(globalSkillDir, { recursive: true, force: true });
    spinner.succeed(`Removed ${globalSkillDir}`);
  }

  if (targets.vault) {
    spinner.start(`Removing ${vaultPath}/ vault...`);
    fs.rmSync(vaultDir, { recursive: true, force: true });
    spinner.succeed(`Removed ${vaultPath}/`);
  }

  if (targets.config) {
    spinner.start('Removing .obsidian-docs.json...');
    fs.unlinkSync(configFile);
    spinner.succeed('Removed .obsidian-docs.json');
  }

  console.log(`\n${chalk.green('  ✓ Uninstalled.')}\n`);
}

function pruneEmpty(dir) {
  try {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  } catch { /* ignore */ }
}
