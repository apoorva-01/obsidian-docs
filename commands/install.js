import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import enquirer from 'enquirer';
import { fileURLToPath } from 'url';
import { detectProject } from '../lib/detect.js';
import {
  hasObsidianSection,
  appendObsidianSection,
  generateObsidianSection
} from '../lib/claude-md.js';

const { prompt } = enquirer;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export async function installCommand(options) {
  const cwd = process.cwd();
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs install\n'));

  spinner.start('Detecting project...');
  const project = detectProject(cwd);
  const stack = [project.language, project.framework, project.database].filter(Boolean).join(' · ');
  spinner.succeed(`Detected: ${chalk.cyan(project.name)} · ${chalk.yellow(stack || 'unknown stack')}`);

  let confirmed = true;
  if (process.stdin.isTTY) {
    try {
      const res = await prompt({
        type: 'confirm',
        name: 'confirmed',
        message: `Install obsidian-docs into ${project.name}?`,
        initial: true
      });
      confirmed = res.confirmed;
    } catch {
      confirmed = false;
    }
  }
  if (!confirmed) { console.log(chalk.gray('  Aborted.')); process.exit(0); }

  spinner.start('Creating /docs vault...');
  createVault(cwd);
  spinner.succeed('Created /docs vault structure');

  spinner.start('Installing SKILL.md...');
  const skillPath = installSkill(cwd, options.global);
  const displaySkillPath = options.global ? skillPath : path.relative(cwd, skillPath);
  spinner.succeed(`Installed skill at ${chalk.cyan(displaySkillPath)}`);

  spinner.start('Updating CLAUDE.md...');
  if (hasObsidianSection(cwd)) {
    spinner.warn('CLAUDE.md already had obsidian-docs section — replaced it');
    spinner.start('Updating CLAUDE.md...');
  }
  const refPath = options.global
    ? skillPath.replace(process.env.HOME, '~')
    : path.relative(cwd, skillPath);
  const section = generateObsidianSection(project, refPath);
  appendObsidianSection(cwd, section);
  spinner.succeed('Updated CLAUDE.md');

  if (options.git !== false) {
    spinner.start('Committing to git...');
    try {
      const toAdd = ['docs/', 'CLAUDE.md'];
      if (!options.global) toAdd.push('.claude/');
      execSync(`git add ${toAdd.join(' ')}`, { cwd, stdio: 'ignore' });
      execSync(
        'git commit -m "chore: initialize obsidian-docs vault + claude skill"',
        { cwd, stdio: 'ignore' }
      );
      spinner.succeed('Committed to git');
    } catch {
      spinner.warn('Git commit skipped (not a git repo or nothing to commit)');
    }
  }

  console.log(`
${chalk.green('  ✓ Done!')}

  ${chalk.bold('Next steps:')}
  1. Open ${chalk.cyan('docs/')} as an Obsidian vault
  2. Ask Claude Code to document a module:
     ${chalk.gray('> document the AuthService using the obsidian-docs skill')}
  3. Make a decision? Claude will write the ADR automatically.

  ${chalk.gray('Run `obsidian-docs status` to check vault health anytime.')}
`);
}

function createVault(cwd) {
  const dirs = [
    'docs/modules',
    'docs/decisions',
    'docs/runbooks',
    'docs/architecture',
    'docs/.obsidian'
  ];
  dirs.forEach(d => fs.mkdirSync(path.join(cwd, d), { recursive: true }));

  const indexPath = path.join(cwd, 'docs/_INDEX.md');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `# Project Docs Index

_Maintained by Claude Code via obsidian-docs skill._

## Modules
<!-- Claude will populate this -->

## Decisions
<!-- Claude will populate this -->

## Runbooks
<!-- Claude will populate this -->

## Architecture
<!-- Claude will populate this -->
`);
  }

  const appJsonPath = path.join(cwd, 'docs/.obsidian/app.json');
  if (!fs.existsSync(appJsonPath)) {
    fs.writeFileSync(appJsonPath, JSON.stringify({
      useMarkdownLinks: false,
      newLinkFormat: 'shortest',
      attachmentFolderPath: '_attachments'
    }, null, 2));
  }

  fs.writeFileSync(
    path.join(cwd, 'docs/.obsidian/.gitignore'),
    'workspace.json\nworkspace-mobile.json\n'
  );
}

function installSkill(cwd, global) {
  const skillSrc = path.join(TEMPLATES_DIR, 'SKILL.md');
  let skillDest;

  if (global) {
    const globalDir = path.join(process.env.HOME, '.claude/skills/obsidian-docs');
    fs.mkdirSync(globalDir, { recursive: true });
    skillDest = path.join(globalDir, 'SKILL.md');
  } else {
    const localDir = path.join(cwd, '.claude/skills/obsidian-docs');
    fs.mkdirSync(localDir, { recursive: true });
    skillDest = path.join(localDir, 'SKILL.md');
  }

  fs.copyFileSync(skillSrc, skillDest);
  return skillDest;
}
