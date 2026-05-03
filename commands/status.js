import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function statusCommand() {
  const cwd = process.cwd();
  const checks = [];

  const check = (label, pass, detail = '') => {
    checks.push({ label, pass, detail });
  };

  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  check('CLAUDE.md exists', fs.existsSync(claudeMdPath));

  check(
    'obsidian-docs section in CLAUDE.md',
    fs.existsSync(claudeMdPath) &&
      fs.readFileSync(claudeMdPath, 'utf8').includes('obsidian-docs')
  );

  const localSkill = path.join(cwd, '.claude/skills/obsidian-docs/SKILL.md');
  const globalSkill = path.join(process.env.HOME, '.claude/skills/obsidian-docs/SKILL.md');
  const skillExists = fs.existsSync(localSkill) || fs.existsSync(globalSkill);
  const skillLocation = fs.existsSync(localSkill)
    ? 'local'
    : fs.existsSync(globalSkill)
      ? 'global'
      : '';
  check('SKILL.md installed', skillExists, skillLocation);

  check('/docs vault exists', fs.existsSync(path.join(cwd, 'docs')));
  check('/docs/_INDEX.md exists', fs.existsSync(path.join(cwd, 'docs/_INDEX.md')));
  check('/docs/modules/ exists', fs.existsSync(path.join(cwd, 'docs/modules')));
  check('/docs/decisions/ exists', fs.existsSync(path.join(cwd, 'docs/decisions')));

  const countFiles = (dir) => {
    try {
      return fs
        .readdirSync(path.join(cwd, dir))
        .filter(f => f.endsWith('.md') && !f.startsWith('_'))
        .length;
    } catch {
      return 0;
    }
  };

  const modules = countFiles('docs/modules');
  const decisions = countFiles('docs/decisions');
  const runbooks = countFiles('docs/runbooks');

  console.log(chalk.bold('\n  obsidian-docs status\n'));

  checks.forEach(({ label, pass, detail }) => {
    const icon = pass ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${icon}  ${label}${detail ? chalk.gray(' — ' + detail) : ''}`);
  });

  console.log(`
  ${chalk.bold('Vault contents:')}
  ${chalk.cyan(modules)} module notes
  ${chalk.cyan(decisions)} ADRs
  ${chalk.cyan(runbooks)} runbooks
`);

  const allPass = checks.every(c => c.pass);
  if (!allPass) {
    console.log(chalk.yellow('  Run `obsidian-docs install` to fix missing items.\n'));
  } else {
    console.log(chalk.green('  Everything looks good.\n'));
  }
}
