import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { healVault } from '../lib/heal.js';
import { readConfig } from '../lib/vault.js';

export async function statusCommand() {
  const cwd = process.cwd();

  console.log(chalk.bold('\n  obsidian-docs status\n'));

  const vaultPath = healVault(cwd) || readConfig(cwd)?.vaultPath || 'docs';

  const checks = [];
  const check = (label, pass, detail = '') => checks.push({ label, pass, detail });

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
  const skillLocation = fs.existsSync(localSkill) ? 'local'
    : fs.existsSync(globalSkill) ? 'global' : '';
  check('SKILL.md installed', skillExists, skillLocation);

  check('.obsidian-docs.json config exists', fs.existsSync(path.join(cwd, '.obsidian-docs.json')));
  check(`/${vaultPath} vault exists`, fs.existsSync(path.join(cwd, vaultPath)));
  check(`/${vaultPath}/_INDEX.md exists`, fs.existsSync(path.join(cwd, vaultPath, '_INDEX.md')));
  check(`/${vaultPath}/modules/ exists`, fs.existsSync(path.join(cwd, vaultPath, 'modules')));
  check(`/${vaultPath}/decisions/ exists`, fs.existsSync(path.join(cwd, vaultPath, 'decisions')));

  const countFiles = (dir) => {
    try {
      return fs.readdirSync(path.join(cwd, dir))
        .filter(f => f.endsWith('.md') && !f.startsWith('_')).length;
    } catch { return 0; }
  };

  const modules = countFiles(`${vaultPath}/modules`);
  const decisions = countFiles(`${vaultPath}/decisions`);
  const runbooks = countFiles(`${vaultPath}/runbooks`);

  checks.forEach(({ label, pass, detail }) => {
    const icon = pass ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${icon}  ${label}${detail ? chalk.gray(' — ' + detail) : ''}`);
  });

  console.log(`
  ${chalk.bold('Vault:')}    ${chalk.cyan(vaultPath + '/')}
  ${chalk.bold('Contents:')} ${chalk.cyan(modules)} module notes · ${chalk.cyan(decisions)} ADRs · ${chalk.cyan(runbooks)} runbooks
`);

  const allPass = checks.every(c => c.pass);
  if (!allPass) {
    console.log(chalk.yellow('  Run `obsidian-docs install` to fix missing items.\n'));
  } else {
    console.log(chalk.green('  Everything looks good.\n'));
  }
}
