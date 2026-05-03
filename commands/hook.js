import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const HOOK_ID = 'obsidian-docs:nudge';
const MATCHER = 'Write|Edit|MultiEdit';

function settingsPath(cwd, local) {
  return path.join(cwd, '.claude', local ? 'settings.local.json' : 'settings.json');
}

function readSettings(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) {
    console.log(chalk.red(`  ✗ Failed to parse ${p}: ${e.message}`));
    process.exit(1);
  }
}

function writeSettings(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

export async function hookInstallCommand(options) {
  const cwd = process.cwd();
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs hook install\n'));

  // 1. Copy hook script into the repo
  spinner.start('Installing hook script...');
  const hookDir = path.join(cwd, '.claude/hooks');
  fs.mkdirSync(hookDir, { recursive: true });
  const hookDest = path.join(hookDir, 'obsidian-docs-nudge.sh');
  fs.copyFileSync(path.join(TEMPLATES_DIR, 'hooks/nudge.sh'), hookDest);
  fs.chmodSync(hookDest, 0o755);
  spinner.succeed(`Installed ${chalk.cyan('.claude/hooks/obsidian-docs-nudge.sh')}`);

  // 2. Register in settings.json
  const sPath = settingsPath(cwd, options.local);
  spinner.start(`Registering hook in ${path.relative(cwd, sPath)}...`);
  const settings = readSettings(sPath);
  settings.hooks ??= {};
  settings.hooks.PostToolUse ??= [];

  // Find existing matcher block, or create one
  let block = settings.hooks.PostToolUse.find(b => b.matcher === MATCHER);
  if (!block) {
    block = { matcher: MATCHER, hooks: [] };
    settings.hooks.PostToolUse.push(block);
  }
  block.hooks ??= [];

  // Remove any prior obsidian-docs hook (idempotent re-install)
  block.hooks = block.hooks.filter(h => !(h.command || '').includes('obsidian-docs-nudge.sh'));

  // Append our hook
  block.hooks.push({
    type: 'command',
    command: 'bash .claude/hooks/obsidian-docs-nudge.sh'
  });

  writeSettings(sPath, settings);
  spinner.succeed(`Registered in ${chalk.cyan(path.relative(cwd, sPath))}`);

  console.log(`
${chalk.green('  ✓ Hook installed.')}

  After every ${chalk.cyan('Write')} / ${chalk.cyan('Edit')} / ${chalk.cyan('MultiEdit')} on a real source file,
  Claude will be reminded to update the matching note in ${chalk.cyan('docs/modules/')}.

  ${chalk.gray('Skipped automatically:')}
  ${chalk.gray('• Edits inside docs/ itself (no feedback loop)')}
  ${chalk.gray('• Markdown, JSON, YAML, lockfiles, .env files')}
  ${chalk.gray('• node_modules/, .git/, dist/, build/, .next/')}
  ${chalk.gray('• test/spec files')}

  ${chalk.gray('Remove with:')} obsidian-docs hook uninstall
`);
}

export async function hookUninstallCommand(options) {
  const cwd = process.cwd();
  const spinner = ora();

  console.log(chalk.bold('\n  obsidian-docs hook uninstall\n'));

  // Try both settings files
  const candidates = [settingsPath(cwd, false), settingsPath(cwd, true)];
  let removedFromSettings = false;

  for (const sPath of candidates) {
    if (!fs.existsSync(sPath)) continue;
    const settings = readSettings(sPath);
    const before = JSON.stringify(settings);

    if (settings.hooks?.PostToolUse) {
      for (const block of settings.hooks.PostToolUse) {
        if (Array.isArray(block.hooks)) {
          block.hooks = block.hooks.filter(h => !(h.command || '').includes('obsidian-docs-nudge.sh'));
        }
      }
      // Drop empty matcher blocks
      settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(b => (b.hooks || []).length > 0);
      // Drop empty PostToolUse / hooks
      if (settings.hooks.PostToolUse.length === 0) delete settings.hooks.PostToolUse;
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    }

    if (JSON.stringify(settings) !== before) {
      if (Object.keys(settings).length === 0) {
        fs.unlinkSync(sPath);
        spinner.succeed(`Removed empty ${chalk.cyan(path.relative(cwd, sPath))}`);
      } else {
        writeSettings(sPath, settings);
        spinner.succeed(`Cleaned ${chalk.cyan(path.relative(cwd, sPath))}`);
      }
      removedFromSettings = true;
    }
  }

  // Remove hook script
  const hookDest = path.join(cwd, '.claude/hooks/obsidian-docs-nudge.sh');
  let removedScript = false;
  if (fs.existsSync(hookDest)) {
    fs.unlinkSync(hookDest);
    removedScript = true;
    spinner.succeed(`Removed ${chalk.cyan('.claude/hooks/obsidian-docs-nudge.sh')}`);
  }
  // Prune empty .claude/hooks
  try {
    const hookDir = path.join(cwd, '.claude/hooks');
    if (fs.existsSync(hookDir) && fs.readdirSync(hookDir).length === 0) {
      fs.rmdirSync(hookDir);
    }
  } catch { /* ignore */ }

  if (!removedFromSettings && !removedScript) {
    console.log(chalk.gray('  Nothing to remove.\n'));
  } else {
    console.log(`\n${chalk.green('  ✓ Hook uninstalled.')}\n`);
  }
}
