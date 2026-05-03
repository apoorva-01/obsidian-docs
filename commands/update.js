import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export async function updateCommand(options) {
  const cwd = process.cwd();
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs update\n'));

  const skillSrc = path.join(TEMPLATES_DIR, 'SKILL.md');
  const skillDest = options.global
    ? path.join(process.env.HOME, '.claude/skills/obsidian-docs/SKILL.md')
    : path.join(cwd, '.claude/skills/obsidian-docs/SKILL.md');

  if (!fs.existsSync(skillDest)) {
    spinner.fail(`No skill found at ${skillDest}`);
    console.log(chalk.gray('  Run `obsidian-docs install` first.\n'));
    process.exit(1);
  }

  spinner.start('Updating SKILL.md...');
  fs.mkdirSync(path.dirname(skillDest), { recursive: true });
  fs.copyFileSync(skillSrc, skillDest);
  spinner.succeed(`Updated ${chalk.cyan(skillDest)}`);

  console.log();
}
